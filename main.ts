import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
const axios = require('axios');
const keytar = require('keytar');
const url = "https://www.schulerzbistum.de/jsonrpc.php";
import { Config } from './store.js';

declare global {
  namespace NodeJS {
    interface Global {
       response: any;  // tmp object for last complete response
       tmp: any;  // wull hold tmp data that may be refreshed over time (messages etc.)
       user: any;  // user object (retrived on login)
       member: any[];  // member objects (retrived on login)
       config: any;  // config object (see store.tx) (constructed on start)
    }
  }
}

// First instantiate the class
global.config = new Config({
  // We'll call our data file 'user-preferences'
  configName: 'user-preferences',
  defaults: {}
});


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    icon: path.join(__dirname, '../src/images/favicon.png'),
    webPreferences: {
      nodeIntegration: true,
    }
  });

  // maximize window (bootstrap does scaling if resized) and remove menu
  mainWindow.maximize();
  // mainWindow.removeMenu(); uncomment before making

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));

  // Open the DevTools. (uncomment if required)
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on("credentials", async function(event:any, args: any) {
  console.log("checking creds …");
  if (global.config.get("login") !== undefined) {
    console.log("Sending credentials …");
    var password = await keytar.getPassword("argon", global.config.get("login"));
    event.sender.send("credentials", {
     password: password,
     login: global.config.get("login")
    });
  }
});

ipcMain.on("logout", async function (event: any, args: any) {
  if (global.config.get("login") !== undefined) {
    console.log("Clearing up credentials …")
    keytar.deletePassword("argon", global.config.get("login"));
    global.config.remove("login");
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
  }
});

ipcMain.on("log-in", async function log_in(event: any, args: any) {
let data = JSON.stringify([
  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "login",
    "params": {
      login: args["e-mail"], password: args["password"]
    }
  },
  {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "set_focus",
    "params": {
      "object": "messenger",
    }},
  {
    "jsonrpc": "2.0",
    "id": 3,
    "method": "read_quick_messages"
  },
  {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "set_focus",
    "params": {
      "object": "mailbox",
    }},
  {
    "jsonrpc": "2.0",
    "id": 3,
    "method": "get_state"
  }
]);
axios
.post(url, data)
.then((result: any) => {
  global.response = result;
  try {
    if (result.data[0].result.return != "FATAL") {
     global.tmp = {
       "messages": result.data[2].result.messages,
       "mailbox": {
        "quota": result.data[4].result.quota,
        "unread": result.data[4].result.unread_messages
      }
     }
     global.member = result.data[0].result.member;
     global.user = result.data[0].result.user;
     if (args["remember-me"] && global.config.get("login") === undefined) {
       console.log("adding creds …")
       global.config.set("login", args["e-mail"])
       keytar.setPassword('argon', args["e-mail"], args["password"]);
     } else if (args["remember-me"] && global.config.get("login") !== undefined && global.config.get("login") !== args["e-mail"]) {
       console.log("replacing creds …")
       keytar.deletePassword("argon", global.config.get("login"))
       global.config.set("login", args["e-mail"])
       keytar.setPassword('argon', args["e-mail"], args["password"]);
     } else  if (args["remember-me"] === false) {
       console.log("Clearing up credentials …")
       global.config.remove("login");
       keytar.deletePassword("argon", args["e-mail"]);
     }
     BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/main.html'));

   } else {
     console.log("False credentials or maintenance");
     event.sender.send("form-recieved", {"has_errors": true});
   }
  // fallback = error or false creds
  } catch(error) {
    console.log(error);
    event.sender.send("internal-error");
  }})
.catch((error: any) => {
  console.log(error);
  event.sender.send("internal-error");
});
});

ipcMain.on('close', (evt, arg) => {
  app.quit()
})

ipcMain.on("notes", async function (evt: any, arg: any) {
  let data = JSON.stringify([
    {
      "jsonrpc": "2.0",
      "id": 1,
      "method": "login",
      "params": {
        login: global.config.get("login"), password: await keytar.getPassword("argon", global.config.get("login"))
      }
    },
    {
      "jsonrpc": "2.0",
      "id": 2,
      "method": "set_focus",
      "params": {
        "object": "notes",
      }},
    {
      "jsonrpc": "2.0",
      "id": 3,
      "method": "get_entries"
    }
  ]);
  axios
  .post(url, data)
  .then((result: any) => {
    try {
      if (result.data[0].result.return != "FATAL") {
        global.response = result;
        global.tmp = result.data[2].result.entries;
        BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/notes.html'));
      } else {
        BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
        evt.sender.send("form-recieved", {"has_errors": true});
      }
    // fallback = error or false creds
    } catch(error) {
      console.log(error);
      BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
      evt.sender.send("internal-error");
    }})
  .catch((error: any) => {
    console.log(error);
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
  });
});

ipcMain.on("add-note", async function (evt: any, args: any) {
  let data = JSON.stringify([
    {
      jsonrpc: "2.0",
      id: 1,
      method: "login",
      params: {
        login: global.config.get("login"),
        password: await keytar.getPassword("argon", global.config.get("login"))
      }
    },
    {
      jsonrpc: "2.0",
      id: 2,
      method: "set_focus",
      params: {
        object: "notes",
      }},
    {
      jsonrpc: "2.0",
      id: 3,
      method: "add_entry",
      params: args
    }
  ]);
  axios
  .post(url, data)
  .then((result: any) => {
    try {
      if (result.data[0].result.return != "FATAL") {
        global.response = result;
        global.tmp = result.data[2].result.entry;
        evt.reply("notes-add-reply", {note: global.tmp});
      } else {
        BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
        evt.sender.send("form-recieved", {"has_errors": true});
      }
    // fallback = error or false creds
    } catch(error) {
      console.log(error);
      BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
      evt.sender.send("internal-error");
    }})
  .catch((error: any) => {
    console.log(error);
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
  });
});

ipcMain.on("profile", async function (event: any, args: any) {
  let data = JSON.stringify([
    {
      "jsonrpc": "2.0",
      "id": 1,
      "method": "login",
      "params": {
        login: global.config.get("login"), password: await keytar.getPassword("argon", global.config.get("login"))
      }
    },
    {
      "jsonrpc": "2.0",
      "id": 2,
      "method": "set_focus",
      "params": {
        "object": "profile",
      }},
    {
      "jsonrpc": "2.0",
      "id": 3,
      "method": "get_profile"
    }
  ]);
  axios
  .post(url, data)
  .then((result: any) => {
    try {
      if (result.data[0].result.return != "FATAL") {
        global.response = result;
        global.tmp = result.data[2].result.profile;
        BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/profile.html'));
      } else {
        BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
        event.sender.send("form-recieved", {"has_errors": true});
      }
    // fallback = error or false creds
    } catch(error) {
      console.log(error);
      BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
      event.sender.send("internal-error");
    }})
  .catch((error: any) => {
    console.log(error);
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
  });
});

ipcMain.on("profile-save", async function (evt: any, data: any) {
  let i = 2;
  let request = [
    {
      "jsonrpc": "2.0",
      "id": 1,
      "method": "login",
      "params": {
        login: global.config.get("login"), password: await keytar.getPassword("argon", global.config.get("login"))
      }
    },
    {
      "jsonrpc": "2.0",
      "id": 2,
      "method": "set_focus",
      "params": {
        "object": "profile",
      }},
    {
      "jsonrpc": "2.0",
      "id": 3,
      "method": "set_profile",
      "params": data
    }
    ];
  axios
  .post(url, JSON.stringify(request), {proxy: false})
  .then((result: any) => {
    try {
      if (result.data[0].result.return !== "FATAL") {
        global.response = result;
        global.tmp = result.data[2].result.profile;
        evt.reply("profile-save-reply", {
          code: 1
        })
      } else {  // auth fallback
        BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
        evt.sender.send("form-recieved", {"has_errors": true});
      }
    // fallback for unexpected behaviour (alias error)
    } catch(error) {
      console.log(error);
      BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
      evt.sender.send("internal-error");
    }})
  .catch((error: any) => {
    console.log(error);
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
  });
});

ipcMain.on("files", async function (evt: any, args: any) {
  const request = JSON.stringify([
    {
      "jsonrpc": "2.0",
      "id": 1,
      "method": "login",
      "params": {
        login: global.config.get("login"), password: await keytar.getPassword("argon", global.config.get("login"))
      }
    },
    {
      "jsonrpc": "2.0",
      "id": 2,
      "method": "set_focus",
      "params": {
        "object": "files",
      }
    },
    {
      "jsonrpc": "2.0",
      "id": 3,
      "method": "get_entries",
      "params": {
        "get_folders": true,
        "get_root": true
      }
    }
  ]);
  axios
  .post(url, request)
  .then((result: any) => {
    try {
      if (result.data[0].result.return != "FATAL") {
        global.response = result;
        global.tmp = result.data[2].result.entries;
        BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/files.html'));
      } else {  // auth fallback
        BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
        evt.sender.send("form-recieved", {"has_errors": true});
      }
    // fallback for unexpected behaviour (also known as error)
    } catch(error) {
      console.log(error);
      BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
      evt.sender.send("internal-error");
    }})
  .catch((error: any) => {
    console.log(error);
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
  });
});

ipcMain.on("settings", async function ( evt: any, args: any ) {
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/client.html'));
});

ipcMain.on("test-request", async function ( evt: any, args: any ) {

});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
