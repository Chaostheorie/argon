"use strict"

const { remote, ipcRenderer} = require("electron");
const $ = require('jquery');
const user  = remote.getGlobal("user");
const response  = remote.getGlobal("response");

console.log(response);
$( '#username' ).text(user.name_hr);
