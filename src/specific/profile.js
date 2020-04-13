"use strict";

const sanitizier = require("sanitize-html");
const tmp = remote.getGlobal("tmp");
const user = remote.getGlobal("user");

if(typeof $ !== 'undefined'){
  const $ = require('jquery');  // jquery support if not loaded before
} // dynamic jquery support

$( "#profile-save" ).click(function (event) {
  event.preventDefault();
  var values = {};
  if ($('.selectpicker').val() === 4) {
    values.gender = null;
  } else {
    values.gender = $(".selectpicker").val();
  }
  $( "input" ).each( function ( index ) {
      values[$( this ).attr("id").slice(8)] = $( this ).val();
  });
  var response = ipcRenderer.send("profile-save", values);
  if (response.code === 1) {
    $( "#alert" ).append("<div class='alert alert-dark' role='alert'>Profile aktualisiert<button type='button' class='close' data-dismiss='alert' aria-label='Close'> <span aria-hidden='true'>&times;</span></button></div>");
  } else if (response.code === 2) {
    $( "#alert" ).append("<div class='alert alert-dark' role='alert'>Unerwartetes Verhalten<button type='button' class='close' data-dismiss='alert' aria-label='Close'> <span aria-hidden='true'>&times;</span></button></div>");
  }
});

$("#profile-name-hr").val(sanitizier(user.name_hr));
$("#profile-full-name").val(sanitizier(tmp.fullname));
$("#profile-email").val(sanitizier(tmp.emailaddress));
$("#profile-webpage").val(sanitizier(tmp.webpage));
$("#profile-description").val(sanitizier(tmp.notes));
if (tmp.gender !== undefined) {
  $(".selectpicker").val(tmp.gender);
} else {
  $(".selectpicker").val(4);
}
$('.selectpicker').selectpicker('render');
