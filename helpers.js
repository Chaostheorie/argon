const keytar = require("keytar"); // for auth
import { BrowserWindow } from 'electron';
import * as path from 'path';
const axios = require('axios');

async function wrapper(config, args) {
    // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
    // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
    if (args.id !== undefined) {
        let i = args.id;
    } else {
        let i = 0;
    }
    if (args.auth != undefined && args.auth === true) {
        let data = [{
            jsonrpc: "2.0",
            id: i++,
            method: "login",
            params: {
                login: config.get("login"),
                password: await keytar.getPassword("argon", config.get("login"))
            }
        }];
    } else {
        let data = [];
    }
    if (args.object !== undefined && args.object !== "global" && args.flogin === undefined) {
        data.push({
            jsonrpc: "2.0",
            id: i++,
            method: "set_focus",
            params: {
                object: args.object
            }
        });
    } else if (args.object !== undefined && args.object !== "global" && args.flogin !== undefined) {
        data.push({
            jsonrpc: "2.0",
            id: i++,
            method: "set_focus",
            params: {
                object: args.object,
                login: args.flogin
            }
        });
    }
    if (args.method !== undefined && args.params !== undefined) {
        data.push({
            jsonrpc: "2.0",
            id: i++,
            method: args.method,
            params: args.params
        });
    } else if (args.method !== undefined && args.params === undefined) {
        data.push({
            jsonrpc: "2.0",
            id: i++,
            method: args.method
        });
    }
    if (args.return !== undefined && args.return === true) {
        if (args.stringify !== undefined && args.stringify === true) {
            return [JSON.stringify(data), i];
        } else {
            return [data, i];
        }
    } else {
        if (args.stringify !== undefined && args.stringify === true) {
            return JSON.stringify(data);
        } else {
            return data;
        }
    }
}

async function xwrapper(config, args) {
    if (args.stringify !== undefined && args.stringify === true) {
        const stringify = args.stringify;
    } else {
        const stringify = false;
    }

    args.stringify = false;
    if (args.auth !== undefined && args.auth === true) {
        let _request = await wrapper(config, args);
    } else {
        let _request = [];
    }
    let part;
    let id = 1;
    for (let i = 0; i < args.data.length; i++) {
        if (args.auth === undefined && i == 1 && mark === undefined) {
            i = 0;
            let mark = null;
        }
        [part, id] = await wrapper(null, {
            stringify: false,
            auth: false,
            return: true,
            method: args.data[i].method,
            object: args.data[i].object,
            params: args.data[i].params,
            flogin: args.data[i].flogin,
            id: id
        });
        for (let c = 0; c < part.length; c++) {
            _request.push(part[c]);
        }
    }
    if (stringify === true) {
        return JSON.stringify(_request);
    } else {
        return _request;
    }
}

function request(event, url, data, handler) {
    axios
        .post(url, data)
        .then((result) => {
            try {
                if (result.data[0].result.return != "FATAL") {
                    handler(event, result);
                } else {
                    console.log("False credentials or maintenance");
                    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
                    event.sender.send("form-recieved", { "has_errors": true });
                }
                // fallback = error or false creds
            } catch (error) {
                console.log(error);
                BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
                event.sender.send("internal-error");
            }
        })
        .catch((error) => {
            console.log(error);
            BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
            event.sender.send("internal-error");
        });
}

// export the helpers
export { wrapper, xwrapper, request };