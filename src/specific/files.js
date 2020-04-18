"use strict";

if(typeof $ !== 'undefined'){
  const $ = require('jquery');  // jquery support if not loaded before
}

const tmp = remote.getGlobal("tmp");

for (var i = 0; i < tmp.length; i++) {
  $( "#main-body" ).append(
    `
    <div id="div-${tmp[i].name}">
      <button type='button' data-toggle="folder" class='btn btn-dark white-text m-0' id="open-${tmp[i].name}"><i class="fas fa-folder"></i> ${tmp[i].name}</button>
    </div>
    `
  );
}


$("button[data-slide=folder]").click((evt) => {
  if (event.target.parent().hasClass("toggled")) {
    event.target.parent().removeClass("toggled");
    event.target.parent().children().each( (index) => {
      if ($( this ).attr("id") !== event.target.attr("id")) {
        $( this ).remove();
      }
    });
  } else {
    ipcRenderer.sendSync("list-files", {
      real: event.target.attr("id")
    });
  }
});

ipcRenderer.on("list-files", (args) => {

})
