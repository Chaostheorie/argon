"use strict"

if(typeof $ !== 'undefined'){
  const $ = require('jquery');  // jquery support if not loaded before
}
// remote need to be defined beforehand

const user  = remote.getGlobal("user");
const tmp = remote.getGlobal("tmp");
const response  = remote.getGlobal("response");
const emailtxt = $( "#e-mail" ).html();
const quickmessagetxt = $( "#quick-messages" ).html();

$( "#e-mail" ).click( function (event) {
  event.preventDefault();
});

// check unread requiring global.tmp (see main.ts for structure)
const check_unread = function (tmp) {
  if (tmp.mailbox.unread > 0) {
    $("e-mail").html(emailtxt + "<span class='badge badge-danger ml-2'>"+ tmp.mailbox.unread + "</span>");
  }
  if (tmp.messages != []) {
    $( "#quick-messages" ).html(quickmessagetxt);
  }

};

// set some static vars
$( '#username' ).text(user.name_hr);
