"use strict";

if (typeof $ !== 'undefined') {
    const $ = require('jquery');
} // dynamic jquery support

function update(tmp) {
    $("#main-body").html("");
    let state, date;
    for (let i = 0; i < tmp.length; i++) {
        if ($(`#group-${tmp[i].gid}`).length === 0) {
            console.log($(`#group-${tmp[i].gid}`).length);
            $("#main-body").append(`
                <div class="container-fluid mb-3">
                <p style="font-weight: bold;">${tmp[i].name_hr}</p>
                <hr>
                <div class="card bg-transparent" id="group-${tmp[i].gid}">
                    <ul class="list-group list-group-flush bg-transparent" id="group-${tmp[i].gid}-body">
                    </ul>
                </div>
            `);
        }
        if (tmp[i].completed === 1) {
            state = "checked";
        } else {
            state = "";
        }
        if (tmp[i].due_date === "0") {
            date = "Kein festes Datum";
        } else if (moment().isAfter(moment(tmp[i].due_date * 1000)) && state === "") {
            date = `<div class="text-danger">${moment(tmp[i].due_date * 1000).format("DD.MM.YYYY")}</div>`;
        } else if (state === "checked") {
            date = moment(tmp[i].due_date * 1000).format("DD.MM.YYYY");
        } else {
            date = `<div class="text-success">${moment(tmp[i].due_date * 1000).format("DD.MM.YYYY")}</div>`;
        }
        tmp[i].state = state;
        $(`#group-${tmp[i].gid}-body`).append(`
        <li class="list-group-item container-fluid" data-target="${tmp[i].id}" data-source="${tmp[i].id}-checkbox">
          <div class="row w-100">
            <div class="col-lg">
              ${tmp[i].title}
            </div>
            <div class="col-sm">
              ${date}
            </div>
            <div class="col mr-0 pr-0 float-right align-self-end">
                <input type="checkbox" class="toggle" id="${tmp[i].id}-checkbox" data-target="${tmp[i].id}" data-size="sm" data-offstyle="elegant-color btn-dark white-text" data-onstyle="elegant-color btn-dark white-text" ${state}>
            </div>
          </div>
        </li>
        `);
        $(`#${tmp[i].id}-checkbox`).bootstrapToggle({
            on: 'Fertig',
            off: 'Ausstehend'
        });
    }
}

$('#main-body').on('dblclick', 'li', (evt) => {
    let target;
    if ($(event.target).is("li") === false) {
        let parent = $(event.target).parent();
        while (true) {
            if (parent.is("li") && parent.data("target") !== undefined) {
                break;
            } else if (parent.is("html")) {
                console.log("Unexpected missing parent with parent.data('target') for element");
                break;
            } else {
                parent = parent.parent();
            }
        }
        target = parent;
    } else {
        target = $(event.target);
    }
    let tmp = remote.getGlobal("tmp");
    tmp = reform(tmp);
    console.log(tmp);
    console.log(target.data("target"));
    const t = tmp[target.data("target")];
    $("#task-title").html(t.title);
    $("#task-start-date").html(moment(t.start_date * 1000).format("DD.MM.YYYY"));
    if (moment().isAfter(moment(t.due_date * 1000)) && t.state === "") {
        $("#task-due-date").html(`<div class="text-danger">${moment(t.due_date * 1000).format("DD.MM.YYYY")}</div>`);
    } else if (t.state === "checked") {
        $("#task-due-date").html(`${moment(t.due_date * 1000).format("DD.MM.YYYY")}`);
    } else {
        $("#task-due-date").html(`<div class="text-success">${moment(t.due_date * 1000).format("DD.MM.YYYY")}</div>`);
    }

    $("#task-description").html(t.description);
    $("#task-modal-checkbox").prop("checked", (t.completed === 1));
    $('#modalTaskView').modal({ focus: true, show: true });
});

function reform(entries) {
    let tmp = {};
    for (let i = 0; i < entries.length; i++) {
        tmp[entries[i].id] = entries[i];
    }
    return tmp;
}

$((evt) => {
    moment().format();
    moment.locale("de");
    $("#main-body").html("<div class='spinner-border' role='status'><span class='sr-only'>Laden ...</span></div>");
    let tmp = remote.getGlobal("tmp");
    update(tmp);
    $('input[type=checkbox]').change(function() {
        ipcRenderer.send("set-task", { "completed": $(this).prop("checked"), id: $(this).data("target") });
    });
    reform(tmp);
});