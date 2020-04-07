'use strict'

const { remote, ipcRenderer, shell} = require("electron");
const $ = require('jquery');
const btntext = $( "#submit" ).text();
const config = remote.getGlobal("config");
const email = config.get("e-mail");

$( '#has_error' ).hide();

if (email != null) {
  $( "e-mail" ).val(email);
}

//open home page externally (Yes. Custom support for my homepage)
$('a').click(function (event) {
    event.preventDefault();
    shell.openExternal(this.href);
});

$( "#log-in" ).submit(function (event) {
  $( "#submit" ).innerHTML  = "<i class='fas fa-cog fa-spin' style='fill: #fff;' class='white-text'></i>" + btntext;
  event.preventDefault();
  ipcRenderer.send("log-in",
                       {"e-mail": $( '#e-mail' ).val(),
                        "password": $( '#password' ).val(),
                        "remember-me": $( '#remember-me' ).val()});
});

ipcRenderer.on('internal-error', function (event, args) {
  $( "#submit" ).text(btntext);
  var tmp = $("#has_error").html();
  $("#has_error").html("Internal error - For help please <a href='https://sinclair.gq/contact' class='text-muted'>Contact me</a>");
  $("#has_error").show();
  setTimeout(function() {$("#has_error").addClass("fadeOut");}, 4000);
  setTimeout(
    function () {
      $("#has_error").hide();
  }, 4500);
  $("#has_error").html();
});

ipcRenderer.on('form-recieved', function(event, args) {
  $( "#submit" ).text(btntext);
  if (args["has_errors"] == true) {
    $("#has_error").show();
    setTimeout(function() {$("#has_error").addClass("fadeOut");}, 4000);
    setTimeout(
      function () {
        $("#has_error").hide();
    }, 4500);
  } else {
    $("#has_error").hide();
  }
});
