"use strict";

if(typeof $ !== 'undefined'){
  const $ = require('jquery');  // jquery support if not loaded before
}

// remote needs to be declared beforehand
const { ipcRenderer } = require("electron");


// hover support for sidebar
$( ".sidebar" ).hover(
  function () {
    $("#wrapper").toggleClass("toggled");
  },
  function () {
    $("#wrapper").toggleClass("toggled");
    $( ".sidebar-dropdown" ).each( function ( index ) {
      if ($( this ).hasClass("show")) {
        $( this ).removeClass("show");
      }
    });
  }
);

// quit bind
$( "#sidebar-quit" ).click(function () {
  console.log("Gracefull shutdown initiated from Renderer. Bye ;)")
  ipcRenderer.send("close");
});

// logout bind
$( "#sidebar-logout" ).click( function () {
  console.log("Gracefull logout initiated from Renderer.")
  ipcRenderer.send("logout");
});

// check if user has safed creds
$( document ).ready( function () {
  if (remote.getGlobal("config").get("login") === undefined) {
    $( "#sidebar-logout" ).remove();
  }
});
