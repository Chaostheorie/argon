import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
const isDev = require('electron-is-dev');
const axios = require('axios');
const getUuid = require('uuid-by-string');
const keytar = require('keytar');
const url = "https://www.schulerzbistum.de/jsonrpc.php";
const moment = require("moment");
import { Config } from './store.js';
import { wrapper, xwrapper, request } from "./helpers.js";


// the global properties will eventually be defined with custom types
declare global {
  namespace NodeJS {
    interface Global {
       response: any;  // tmp object for last complete response
       tmp: any;  // will hold shared tmp data e.g. result from response
       user: any;  // user object (retrived on login)
       member: any[];  // member objects (retrived on login)
       _tmp: any; // will hold shared tmp data for the session should not be fully replaced
       config: any;  // config object (see store.tx) (constructed on start)
    }
  }
}

// iniitiate config
global.config = new Config({
  // We'll call our data file 'user-preferences'
  configName: 'user-preferences',
  defaults: {}
});

// initiate global._tmp
global._tmp = {};

// save dev mode
global._tmp.is_dev = isDev;

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
      spellcheck: true
    }
  });

  if (global._tmp.is_dev === false) {
    mainWindow.setMenu(null)
  }

  // maximize window (bootstrap does scaling if resized) and remove menu
  mainWindow.maximize();
  // mainWindow.removeMenu(); uncomment before making

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
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
    global._tmp.login = undefined;
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/index.html'));
  }
});

ipcMain.on("log-in", async function (event: any, args: any) {
const _request = await xwrapper( null, {
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
.post(url, _request)
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
       global.config.set("login", args["e-mail"]);
       global._tmp.login = args["e-mail"];
       keytar.setPassword('argon', args["e-mail"], args["password"]);
     } else if (args["remember-me"] && global.config.get("login") !== undefined && global.config.get("login") !== args["e-mail"]) {
       console.log("replacing creds …")
       keytar.deletePassword("argon", global.config.get("login"))
       global.config.set("login", args["e-mail"])
       global._tmp.login = args["e-mail"];
       keytar.setPassword('argon', args["e-mail"], args["password"]);
     } else  if (args["remember-me"] === false) {
       console.log("Clearing up credentials …")
       global.config.remove("login");
       global._tmp.login = undefined;
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

ipcMain.on('close', (event, arg) => {
  app.quit()
})

ipcMain.on("notes", async function (event: any, arg: any) {
  const _request = await wrapper ( global.config, {
    method: "get_entries",
    object: "notes",
    stringify: true,
    auth: true
  });
  request(event, url, _request, (event: any, result: any) => {
    global.response = result;
    global.tmp = result.data[2].result.entries;
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/notes.html'));  });
});

ipcMain.on("tasks", async function (event: any, arg: any) {
  let members;

  if (global._tmp.member !== undefined) {
    members = [{
      method: "get_entries",
      object: "tasks",
      flogin: global._tmp[1],
    }];

    for (let i = 1; i < global.member.length; i++) {
      members.push({
        method: "get_entries",
        object: "tasks",
        flogin: global._tmp[i],
      });
    }
  } else {
    members = [{
      method: "get_entries",
      object: "tasks",
      flogin: global.member[1].login,
    }];

    for (let i = 1; i < global.member.length; i++) {
      members.push({
        method: "get_entries",
        object: "tasks",
        flogin: global.member[i].login,
      });
    }
  }
  
  const _request = await xwrapper ( global.config, {
    data: members,
    stringify: true,
    auth: true
  });
  request(event, url, _request, (event: any, result: any) => {
    let iterator, group, tasks;
    for (let i = 4; i < result.data.length; i += 2) {
      group = result.data[i].result.entries;
      if (group !== undefined && group.length > 0) {
        for (let t = 0; t < group.length; t++) {
          iterator = i/2-1;
          group[t].name_hr = global.member[iterator].name_hr;
          group[t].login = global.member[iterator].login;
          group[t].gid = getUuid(global.member[iterator].login);
          if (tasks === undefined) {
            tasks = [group[t]];
          } else {
            tasks.push(group[t]);
          }
        }
        if (global._tmp.member === undefined) {
          global._tmp.member = [global.member[iterator].login];  
        } else {
          global._tmp.member.push(global.member[iterator].login);
        }
      }
    }
    
    global.response = result;
    global.tmp = tasks;
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/tasks.html'));
  });
});

ipcMain.on("set-task", async function (event: any, args: any) {
  let completed;
  if (args.completed === true) {
    completed = 1;
  } else {
    completed = 0;
  }
  const _request = await wrapper ( global.config, {
    method: "set_entry",
    object: "tasks",
    auth: true,
    flogin: args.login,
    params: { completed: completed, id: args.id },
    stringify: true
  });
  request(event, url, _request, (event: any, result: any) => {
    global.response = result;
  });
});

ipcMain.on("add-note", async function (event: any, args: any) {
  const _request = await wrapper ( global.config, {
    method: "add_entry",
    object: "notes",
    auth: true,
    params: args,
    stringify: true
  });
  request(event, url, _request, (event: any, result: any) => {
    global.response = result;
    global.tmp = result.data[2].result.entry;
    event.reply("notes-add-reply", {note: global.tmp});
  });
});

ipcMain.on("profile", async function (event: any, args: any) {
  const _request = await wrapper ( global.config, {
    method: "get_profile",
    object: "profile",
    stringify: true,
    auth: true
  });
  request(event, url, _request, (event: any, result: any) => {
    global.response = result;
    global.tmp = result.data[2].result.profile;
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/profile.html'));
  });
});

ipcMain.on("profile-save", async function (event: any, data: any) {
  const _request = await wrapper ( global.config, {
    method: "set_profile",
    object: "profile",
    params: data,
    stringify: true,
    auth: true
  });
  request(event, url, _request, (event: any, result: any) => {
    global.response = result;
    global.tmp = result.data[2].result.profile;
    event.reply("profile-save-reply", {
      code: 1
    });
  });
});

ipcMain.on("files", async function (event: any, args: any) {
  const _request = await wrapper ( global.config, {
    method: "get_entries",
    object: "files",
    auth: true,
    params: {
      get_folders: true,
      get_root: true
    }
  });
  request(event, url, _request, (event: any, result: any) => {
    global.response = result;
    global.tmp = result.data[2].result.entries;
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/files.html'));
  });
});

ipcMain.on("client", async function ( event: any, args: any ) {
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/client.html'));
});

ipcMain.on("contacts", async function (event: any, args: any) {
  const _request = await wrapper ( global.config, {
    method: "get_entries",
    object: "addresses",
    stringify: true,
    auth: true
  });
  request(event, url, _request, (event: any, result: any) => {
    global.response = result;
    global.tmp = result.data[2].result.entries;
    global._tmp.contacts = global.tmp;  // for autocomplete with contacts
    BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/contacts.html'));
  });
});

ipcMain.on("contacts-refresh", async(event: any, args: any) => {
  const _request = await wrapper ( global.config, {
    method: "get_entries",
    object: "addresses",
    stringify: true,
    auth: true
  });
  request(event, url, _request, (event: any, result: any) => {
    global.response = result;
    global._tmp.contacts = {entries: global.tmp, time: moment()};  // for autocomplete with contacts
    event.reply("contacts-refreshed", {entries: global.tmp})
  });
});

ipcMain.on("test-request", async function ( event: any, args: any ) {
  const _request = await wrapper ( global.config, {
    method: args.method,
    object: args.object,
    params: args.params,
    stringify: true,
    auth: args.auth
  });
  request(event, url, _request, (event: any, result: any) => {
    global.response = result;
    global.tmp = result.data[2].result.entries;
    event.reply("response", {response: result});
  });
});


ipcMain.on("e-mail", async function (event: any, args: any) {
  const _request = await wrapper ( global.config, {
    method: "get_folders",
    object: "mailbox",
    auth: true,
    stringify: true
  });
  request(event, url, _request, (event: any, result: any) => {
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
  });
});

ipcMain.on("get-e-mail-folder", async function ( event: any, args: any ) {
  const _request = await wrapper( global.config, {
    object: "mailbox",
    method: "get_messages",
    params: {
      folder_id: args.folder
    },
    auth: true,
    stringify: true
  });
  request(event, url, _request, (event: any, result: any) => {
    global.response = result;
    global.tmp.mails = result.data[2].result.messages;
    event.sender.send("change-folder", {});
  });
})

ipcMain.on("view-mail", async function (event: any, args: any) {
  let _request = await wrapper( global.config, {
    object: "mailbox",
    method: "read_message",
    params: {
      folder_id: global.tmp.current.id,
      message_id: args.id
    },
    auth: true,
    stringify: true
  });
  request(event, url, _request, (event: any, result: any) => {
    event.reply("view-mail", {mail: result.data[2].result.message});
  });
});

ipcMain.on("delete-e-mails", async function (event: any, args: any) {
  let _request = await xwrapper( global.config, {
    data: args.methods,
    auth: true,
    stringify: true
  });
  request(event, url, _request, (event: any, result: any) => {
    event.reply("view-mail", {mail: result.data[2].result.message});
  });
});

ipcMain.on("send-mail", async function (event: any, args: any) {
  const _request = await wrapper( global.config, {
    method: "send_mail",
    object: "mailbox",
    params: args,
    auth: true,
    stringify: true
  });
  request(event, url, _request, (event: any, result: any) => {
    event.reply("alert", {title: "E-Mail gesendet", description: "Deine E-Mail wurde erfolgreich versendet"});
  });
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
