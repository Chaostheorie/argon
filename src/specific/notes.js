"use strict";

let tmp = remote.getGlobal("tmp");

if(typeof $ !== 'undefined'){
  const $ = require('jquery');
} // dynamic jquery support

var updateNotes = function ( notes ) {
  if (notes.length === 0) {
    $("#notes-grid").html("<strong>Du scheinst keine Notizen gemacht zu haben.</strong>");
  } else {
    console.log(notes);
    for (let i = 0; i < notes.length; i++) {
      $("#notes-grid").append(
        `
        <div class="col-auto m-2 card">
          <div class="card-body">
            <h6 class="card-title">${notes[i].title}</h6>
            <hr>
            <p class="card-text">${notes[i].text}</p>
            <div class="btn-group">
              <button type="button" name="edit-btn-${notes[i].id}" data-target="${notes[i].id}" class="btn btn-elegant btn-sm waves-effect" aria-label="Edit"><i class="fas fa-pencil-alt"></i></button>
              <button type="button" name="delete-btn-${notes[i].id}" data-target="${notes[i].id}" class="btn btn-elegant btn-sm waves-effect" aria-label="Close"><i class="fas fa-times"></i></button>
            </div>
          </div>
        </div>
        `
      );
    }
  }
};

$("#notes-add-btn").click( (evt) => {
  ipcRenderer.send("add-note", {
    text: $("#notes-new-text").val(),
    title: $("#notes-new-title").val()
  });
});

ipcRenderer.on("notes-add-reply", ( evt, args ) => {
  tmp.push(args.note);
  updateNotes(tmp);
});

$( document ).ready( () => {
  updateNotes(tmp);

  $(".btn[name|='delete-btn']").each( (index) => {
    $( this ).click( ( evt ) => {
      console.log($( this  ).data("target"));
      ipcRenderer.send("delete-note", {
        id: $( this  ).data("target")
      });
    });
  });
});
