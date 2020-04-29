const keytar = require("keytar");  // for auth
import { BrowserWindow } from 'electron';
import * as path from 'path';
const axios = require('axios');

async function wrapper( config, args ) {
  // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
  // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
  if (args.id !== undefined) {
    let i = args.id;
  } else {
    let i = 0;
  }
  if (args.auth != undefined && args.auth === true) {
    let data = [
      {
        jsonrpc: "2.0",
        id: i++,
        method: "login",
        params: {
          login: config.get("login"),
          password: await keytar.getPassword("argon", config.get("login"))
        }
      }
    ];
  } else {
    let data = [];
  }
  if (args.object !== undefined  && args.object !== "global") {
    data.push(
      {
        "jsonrpc": "2.0",
        "id": i++,
        "method": "set_focus",
        "params": {
          "object": args.object
        }
      }
    );
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
  }
  else {
    if (args.stringify !== undefined && args.stringify === true) {
      return JSON.stringify(data);
    } else {
      return data;
    }
  }
}

async function xwrapper ( config, args ) {
  if (args.stringify !== undefined && args.stringify === true) {
    const stringify = args.stringify;
  } else {
    const stringify = false;
  }

  args.stringify = false;
  if (args.auth !== undefined && args.auth === true) {
    let request = await wrapper( config, args );
  } else {
    let request = [];
  }
  console.log(`Request ${request}`);
  let part;
  let id = 1;
  for (let i = 0; i < args.data.length; i++) {
    if (args.auth === undefined && i == 1 && mark === undefined) {
      i = 0;
      let mark = null;
    }
    [part, id] = await wrapper( null, {
      stringify: false,
      auth: false,
      return: true,
      method: args.data[i].method,
      object: args.data[i].object,
      params: args.data[i].params,
      id: id
    });
    for (let c = 0; c < part.length; c++) {
      request.push(part[c]);
    }
  }
  if (stringify === true) {
    return JSON.stringify(request);
  } else {
    return request;
  }
}

// export the helpers
export { wrapper, xwrapper };
