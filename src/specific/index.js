'use strict'

if(typeof $ !== 'undefined'){
  const $ = require('jquery');  // jquery support if not loaded before
}

const { ipcRenderer } = require("electron");
// remote need to be defined beforehand
const btntext = $( "#submit" ).text();
const config = remote.getGlobal("config");
const email = config.get("e-mail");

$( '#has_error' ).hide();

if (email != null) {
  $( "e-mail" ).val(email);
}

$( "#log-in" ).submit(function (event) {
  $( "#submit" ).innerHTML  = "<i class='fas fa-cog fa-spin' style='fill: #fff;' class='white-text'></i>" + btntext;
  event.preventDefault();
  ipcRenderer.send("log-in",
                       {"e-mail": $( '#e-mail' ).val(),
                        "password": $( '#password' ).val(),
                        "remember-me": $( '#remember-me' ).is(':checked')});
});

ipcRenderer.on('internal-error', function (event, args) {
  $( "#submit" ).text(btntext);
  var tmp = $("#has_error").html();
  // has error will be replaced with alert https://mdbootstrap.com/docs/jquery/components/alerts/#introduction
  $("#has_error").html("Internal error - For help please <a href='https://sinclair.gq/contact' class='text-muted'>Contact me</a>");
  $("#has_error").show();
  setTimeout(function() {
    $("#has_error").addClass("fadeOut");
  }, 4000);
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
    setTimeout(function() {
      $("#has_error").addClass("fadeOut");
    }, 4000);
    setTimeout(
      function () {
        $("#has_error").hide();
    }, 4500);
  } else {
    $("#has_error").hide();
  }
});

$( document ).ready( function () {
  ipcRenderer.send("credentials");
});

ipcRenderer.on("credentials", function (event, args) {
  if (args["login"] !== undefined && args["password"] !== undefined) {
    $( "#e-mail" ).val(args["login"]);
    $( "#password" ).val(args["password"]);
    $( '#remember-me' ).prop("checked", true);
  }
});
