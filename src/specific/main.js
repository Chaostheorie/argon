"use strict"

const { remote, ipcRenderer} = require("electron");
const $ = require('jquery');
const user  = remote.getGlobal("user");
const response  = remote.getGlobal("response");

$("#menu-toggle").click(function(e) {
  e.preventDefault();
  $("#wrapper").toggleClass("toggled");
});

$( ".sidebar" ).hover(function() {
  $("#wrapper").toggleClass("toggled");
});

console.log(response);
$( '#username' ).text(user.name_hr);
