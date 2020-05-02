"use strict";

let tmp = remote.getGlobal("tmp");
const notes = tmp;

if(typeof $ !== 'undefined'){
  const $ = require('jquery');
} // dynamic jquery support

var updateNotes = function ( notes ) {
  if (notes.length === 0) {
    $("#notes-grid").html("<strong>Du scheinst keine Notizen gemacht zu haben.</strong>");
  } else {
    $("#notes-grid").html();
    for (let i = 0; i < notes.length; i++) {
      $("#notes-grid").append(
        `
        <div class="col-auto m-2 card">
          <div class="card-body">
            <h6 class="card-title">${notes[i].title}</h6>
            <hr>
            <p class="card-text">${notes[i].text}</p>
            <div class="btn-group">
              <button type="button" name="edit-btn-${notes[i].id}" data-target="${notes[i].id}" data-index="${i}" class="btn btn-elegant btn-sm waves-effect btn-edit" aria-label="Edit"><i class="fas fa-pencil-alt"></i></button>
              <button type="button" name="delete-btn-${notes[i].id}" data-target="${notes[i].id}" data-index="${i}" class="btn btn-elegant btn-sm waves-effect btn-remove" aria-label="Close"><i class="fas fa-times"></i></button>
            </div>
          </div>
        </div>
        `
      );
    }
  }
};

$("#notes-add-btn").click(( evt ) => {
  if ($("#notes-hidden-id").val() !== "") {
    ipcRenderer.send("edit-note", {
      text: $("#notes-new-text").val(),
      title: $("#notes-new-title").val(),
      id: $("#notes-hidden-id").val()
    });
  } else {
    ipcRenderer.send("add-note", {
      text: $("#notes-new-text").val(),
      title: $("#notes-new-title").val()
    });
  }
});

$("#notes-add-trigger").click(( evt ) => {
  $("#notes-new-title").val("");
  $("#notes-new-text").val("");
  $("#notes-hidden-id").val("");
  $("#notes-add-btn").html("Hinzufügen");
});

ipcRenderer.on("notes-add-reply", ( evt, args ) => {
  tmp.push(args.note);
  updateNotes(tmp);
});

$(".btn-edit").click( ( evt ) => {
  console.log(1);
  const note = notes[$(evt.target).data("index")];
  $("#notes-new-title").val(note.title);
  $("#notes-new-text").val(note.text);
  $("#notes-hidden-id").val(note.id);
  $("#notes-add-btn").html("Senden");
  $("#modalNotesForm").modal({focus: true, show: true});
});

$( document ).ready( () => {
  updateNotes(notes);
});
