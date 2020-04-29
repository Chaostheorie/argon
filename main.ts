import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
const isDev = require('electron-is-dev');
const axios = require('axios');
const keytar = require('keytar');
const url = "https://www.schulerzbistum.de/jsonrpc.php";
import { Config } from './store.js';
import { wrapper, xwrapper } from "./helpers.js";


// the global properties will eventually be defined with custom types
declare global {
  namespace NodeJS {
    interface Global {
       response: any;  // tmp object for last complete response
       tmp: any;  // wull hold tmp data that may be refreshed over time (messages etc.)
       user: any;  // user object (retrived on login)
       member: any[];  // member objects (retrived on login)
       config: any;  // config object (see store.tx) (constructed on start)
       dev: boolean;  // global val of electron-is-dev
    }
  }
}

// iniitiate config
global.config = new Config({
  // We'll call our data file 'user-preferences'
  configName: 'user-preferences',
  defaults: {}
});

// save dev mode
global.dev = isDev;

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

  if (global.dev === false) {
    mainWindow.setMenu(null)
  }

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

ipcMain.on("log-in", async function (event: any, args: any) {
const request = await xwrapper( null, {
  auth: false, // important
  stringify: true,
  data: [
    {
      method: "login",
      params: {
        login: args["e-mail"],
        password: args["password"]
      }
    },
    {
      method: "read_quick_messages",
      object: "messenger"
    },
    {
      method: "get_state",
      object: "mailbox"
    }
  ]
});
axios
.post(url, request)
.then((result: any) => {
  global.response = result;
  try {
    if (result.data[0].result.return != "FATAL") {
     global.tmp = {
       "messages": result.data[2].result.messages,
       "mailbox": {
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
  const request = await wrapper ( global.config, {
    method: "get_entries",
    object: "notes",
    stringify: true,
    auth: true
  });
  axios
  .post(url, request)
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
  const request = await wrapper ( global.config, {
    method: "add_entry",
    object: "notes",
    auth: true,
    params: args,
    stringify: true
  });
  axios
  .post(url, request)
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
  const request = await wrapper ( global.config, {
    method: "get_profile",
    object: "profile",
    stringify: true,
    auth: true
  });
  axios
  .post(url, request)
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
  const request = await wrapper ( global.config, {
    method: "set_profile",
    object: "profile",
    params: data,
    stringify: true,
    auth: true
  });
  axios
  .post(url, request, {proxy: false})
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
  const request = await wrapper ( global.config, {
    method: "get_entries",
    object: "files",
    auth: true,
    params: {
      get_folders: true,
      get_root: true
    }
  });
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

ipcMain.on("client", async function ( evt: any, args: any ) {
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/client.html'));
});

ipcMain.on("contacts", async function (evt: any, args: any) {
  const request = await wrapper ( global.config, {
    method: "get_entries",
    object: "addresses",
    stringify: true,
    auth: true
  });
  axios
  .post(url, request)
  .then((result: any) => {
    try {
      if (result.data[0].result.return != "FATAL") {
        console.log(result.data[2].result);
        global.response = result;
        global.tmp = result.data[2].result.entries;
        BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/contacts.html'));
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

ipcMain.on("test-request", async function ( evt: any, args: any ) {
  const request = await wrapper ( global.config, {
    method: args.method,
    object: args.object,
    params: args.params,
    stringify: true,
    auth: args.auth
  });
  axios
  .post(url, request)
  .then((result: any) => {
    try {
      console.log(result);
      if (result.data[0].result.return != "FATAL") {
        global.response = result;
        global.tmp = result.data[2].result.entries;
        evt.reply("response", {response: result})
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


ipcMain.on("e-mail", async function (evt: any, args: any) {
  const request = await wrapper ( global.config, {
    method: "get_folders",
    object: "mailbox",
    auth: true,
    stringify: true
  });
  axios
  .post(url, request)
  .then((result: any) => {
    try {
      if (result.data[0].result.return != "FATAL") {
        global.response = result;
        global.tmp = {};
        global.tmp.folders = [];
        global.tmp.data = result.data[2].result.folders;
        for (let i = 0; i < result.data[2].result.folders.length; i++) {
          global.tmp.folders.push(global.tmp.data[i]);
          if (global.tmp.data[i].is_inbox) {
            global.tmp.inbox = global.tmp.data[i].id;
            global.tmp.current = global.tmp.data[i];
          } else if (global.tmp.data[i].is_trash) {
            global.tmp.trash = global.tmp.data[i].id;
          } else if (global.tmp.data[i].is_drafts) {
            global.tmp.drafts = global.tmp.data[i].id;
          } else if (global.tmp.data[i].is_sent) {
            global.tmp.sent = global.tmp.data[i].id;
          }
        }
        BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/e-mail.html'));
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

ipcMain.on("get-e-mail-folder", async function ( evt: any, args: any ) {
  let request = await wrapper( global.config, {
    object: "mailbox",
    method: "get_messages",
    params: {
      folder_id: args.folder
    },
    auth: true,
    stringify: true
  });
  axios
  .post(url, request)
  .then((result: any) => {
    try {
      if (result.data[0].result.return != "FATAL") {
        global.response = result;
        global.tmp.mails = result.data[2].result.messages;
        evt.sender.send("change-folder", {});
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
})

ipcMain.on("view-mail", async function (evt: any, args: any) {
  let request = await wrapper( global.config, {
    object: "mailbox",
    method: "read_message",
    params: {
      folder_id: global.tmp.current.id,
      message_id: args.id
    },
    auth: true,
    stringify: true
  });
  axios
  .post(url, request)
  .then((result: any) => {
    try {
      if (result.data[0].result.return != "FATAL") {
        evt.reply("view-mail", {mail: result.data[2].result.message});
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

ipcMain.on("delete-e-mails", async function (evt: any, args: any) {
  console.log(args.methods);
  let request = await xwrapper( global.config, {
    data: args.methods,
    auth: true,
    stringify: true
  });
  axios
  .post(url, request)
  .then((result: any) => {
    try {
      if (result.data[0].result.return != "FATAL") {
        evt.reply("view-mail", {mail: result.data[2].result.message});
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

ipcMain.on("send-mail", async function (evt: any, args: any) {
  console.log(args.methods);
  let request = await wrapper( global.config, {
    method: "send_mail",
    object: "mailbox",
    params: args,
    auth: true,
    stringify: true
  });
  axios
  .post(url, request)
  .then((result: any) => {
    try {
      if (result.data[0].result.return != "FATAL") {
        evt.reply("alert", {title: "E-Mail gesendet", description: "Deine E-Mail wurde erfolgreich versendet"});
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

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
