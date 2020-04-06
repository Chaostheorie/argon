import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { RpcClient } from 'jsonrpc-ts';
const url = "https://www.schulerzbistum.de/jsonrpc.php";
const client = new RpcClient({ url: url });

declare global {
  namespace NodeJS {
    interface Global {
       response: any;
       tmp: any;
       user: any;
       member: any[];
    }
  }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // maximize window
  mainWindow.maximize();

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));

  // Open the DevTools. (toggle if required)
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.on("log-in", async function log_in(event: any, args: any) {
let has_error = false;
try {
  let response = await client.makeRequest({
  method: 'login',
  params: {login: args["e-mail"], password: args["password"]},
  id: 1,
  jsonrpc: '2.0',
    });
  const data = response.data.result;
  if (data.return === "FATAL") {
   has_error = true;
  }
 global.response = data;
 global.member = data["member"];
 global.user = data["user"];
} catch (error) {
  console.log(error);
  has_error = true;
}
if (has_error === false) {
  BrowserWindow.getFocusedWindow().loadFile(path.join(__dirname, '../src/main.html'));
} else {
  event.sender.send("form-recieved", {"has_errors": true});
}});


app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
