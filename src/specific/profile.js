"use strict";

const sanitizier = require("sanitize-html");
let tmp = remote.getGlobal("tmp");
const user = remote.getGlobal("user");

if(typeof $ !== 'undefined'){
  const $ = require('jquery');  // jquery support if not loaded before
} // dynamic jquery support

$( "#profile-save" ).click(async function (event) {
  event.preventDefault();
  var values = {};
  if ($('.selectpicker').val() === 4) {
    values.gender = null;
  } else {
    values.gender = $(".selectpicker").val();
  }
  $( "input" ).each( function ( index ) {
      values[`${$( this ).attr("id").slice(8)}`] = $( this ).val();
  });
  ipcRenderer.send("profile-save", values);
});

ipcRenderer.on("profile-save-reply", (evt, arg) => {
  if (arg.code === 1) {
    $( "#alert" ).append("<div class='alert alert-dark' role='alert'>Profile aktualisiert<button type='button' class='close' data-dismiss='alert' aria-label='Close'> <span aria-hidden='true'>&times;</span></button></div>");
  } else if (arg.code === 2) {
    $( "#alert" ).append("<div class='alert alert-dark' role='alert'>Unerwartetes Verhalten<button type='button' class='close' data-dismiss='alert' aria-label='Close'> <span aria-hidden='true'>&times;</span></button></div>");
  }
  tmp = remote.getGlobal("tmp");
  update(tmp);
});

var update = function (tmp) {
  $("#profile-fullname").val(sanitizier(tmp.fullname));
  $("#profile-email").val(sanitizier(tmp.emailaddress));
  $("#profile-webpage").val(sanitizier(tmp.webpage));
  if (tmp.gender !== undefined) {
    $(".selectpicker").val(tmp.gender);
  } else {
    $(".selectpicker").val(4);
  }
  $('.selectpicker').selectpicker('render');
};

update(tmp);
