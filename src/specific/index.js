'use strict'

const { remote, ipcRenderer} = require("electron");
const $ = require('jquery');
const btntext = $( "#submit" ).text();

$( '#has_error' ).hide();

$( "#log-in" ).submit(function (event) {
  $( "#submit" ).innerHTML  = "<i class='fas fa-cog fa-spin'></i>" + btntext;
  event.preventDefault();
  ipcRenderer.send("log-in",
                       {"e-mail": $( '#e-mail' ).val(),
                        "password": $( '#password' ).val()});
});

ipcRenderer.on('form-recieved', function(event, args) {
  $( "#submit" ).text(btntext);
  if (args["has_errors"] == true) {
    $("#has_error").show();
  } else {
    $("#has_error").hide();
  }
});
