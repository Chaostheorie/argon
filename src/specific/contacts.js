"use strict";

if(typeof $ !== 'undefined'){
  const $ = require('jquery');  // jquery support if not loaded before
}

const tmp = remote.getGlobal("tmp");
let chars = [];

for (var i = 0; i < tmp.length; i++) {
  if (tmp[i].firstname !== undefined && chars.includes(tmp[i].firstname[0].toUpperCase()) === false) {
    chars.push(tmp[i].firstname[0].toUpperCase());
    $("#char-labels").append(
      `
      <span class="badge badge-pill badge-dark" data-target="${tmp[i].firstname[0]}">${tmp[i].firstname[0].toUpperCase()}</span>
      `
    );
  } else if (tmp[i].lastname !== undefined && chars.includes(tmp[i].lastname[0].toUpperCase()) === false) {
    chars.push(tmp[i].lastname[0].toUpperCase());
    $("#char-labels").append(
      `
      <span class="badge badge-pill badge-dark" data-target="${tmp[i].lastname[0]}">${tmp[i].lastname[0].toUpperCase()}</span>
      `
    );
  }
  if (tmp[i].lastname === undefined || tmp[i].lastname === "") {
    var name = tmp[i].firstname;
  } else if (tmp[i].firstname === undefined || tmp[i].firstname === "") {
    var name = tmp[i].lastname;
  } else {
    var name = tmp[i].lastname + ", " + tmp[i].firstname;
  }
  $( "#main-body" ).append(
    `
    <div id="div-${tmp[i].id}">
      <button type='button' data-toggle="contact" data-target="${tmp[i].id}" class='btn btn-dark btn-block mt-1 mb-1 white-text m-0'><i class="fas fa-address-card"></i> ${name}</button>
    </div>
    `
  );
}
