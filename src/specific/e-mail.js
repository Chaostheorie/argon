"use strict";

if (typeof $ !== 'undefined') {
    const $ = require('jquery'); // jquery support if not loaded before
}

const sanitizier = require("sanitize-html");
let folders = null;
let tmp = remote.getGlobal("tmp");

console.log(tmp.folders);
console.log(tmp.current);

window.alert = alert = null;

for (var f = 0; f < tmp.folders.length; f++) {
    $("#mail-folder-list").html();
    $("#mail-folder-list").append(`
    <button type="button" class="btn btn-dark btn-folder elegant-color white-text btn-block" data-toggle="folder-toggle" data-target="${tmp.folders[f].id}">${tmp.folders[f].name}</button>
    `);
}

$(".btn-folder").click((evt) => {
    ipcRenderer.send("get-e-mail-folder", { folder: evt.target.data("target") });
});

function update(remote, folders, rupt) {
    $("#folder-labels").html("");
    let tmp = remote.getGlobal("tmp");
    let active = "";
    if (tmp.folders !== folders) {
        folders = tmp.folders;
        for (let i = 0; i < tmp.folders.length; i++) {
            if (tmp.current.id === tmp.folders[i].id) {
                active = "btn-outline-white";
            } else {
                active = "";
            }
            $("#folder-labels").append(`
        <button type="button" class="btn btn-folder ${active} btn-dark elegant-color black-text btn-sm " id="${tmp.folders[i].id}">${tmp.folders[i].name}</button>
        `);
        }
    }
    if (tmp.mails !== undefined) {
        console.log(tmp.mails);
        $('#main-table').DataTable().clear();
        for (let i = 0; i < tmp.mails.length; i++) {
            if (tmp.mails[i].is_unread === 1) {
                $('#main-table').DataTable().row.add([
                    "", tmp.mails[i].subject, { display: moment(tmp.mails[i].date * 1000).format("DD.MM.YYYY, hh:mm"), val: tmp.mails[i].date },
                    tmp.mails[i].from[0].name, { display: "<i class='fas fa-eye black-text'></i>", val: 1 },
                    tmp.mails[i].id
                ]);
            } else {
                $('#main-table').DataTable().row.add([
                    "", tmp.mails[i].subject, { display: moment(tmp.mails[i].date * 1000).format("DD.MM.YYYY, hh:mm"), val: tmp.mails[i].date },
                    tmp.mails[i].from[0].name, { display: "<i class='fas fa-eye text-info'></i>", val: 0 },
                    tmp.mails[i].id
                ]);
            }
            $('#main-table').DataTable().draw();
        }
        moveFooter();
    } else if (rupt !== undefined && rupt === true) {
        location.reload();
        update(remote, folders, false)
    }
}

ipcRenderer.on("change-folder", (evt, args) => {
    console.log("change");
    update(remote, folders, true);
});

ipcRenderer.on("view-mail", (evt, args) => {
    console.log(args);
    $("#mail-subject").html(sanitizier(args.mail.subject));
    $("#mail-content").html(sanitizier(args.mail.body_plain));
    if (args.mail.from.length > 1) {
        let string = [];
        for (let i = 0; i < args.mail.from.length - 1; i++) {
            string += ", " + args.mail.from[i].name;
        }
        string += args.mail.from[-1].name;
        $("#mail-from").html(sanitizier(string));
    } else {
        $("#mail-from").html(sanitizier(args.mail.from[0].name));
    }
    console.log(args.mail.from[0]);
    $("#mail-from").data("mail", sanitizier(args.mail.from[0].addr));
    if (args.mail.cc === undefined) {
        $("#mail-cc-row").hide();
    } else {
        $("#mail-cc-row").show();
    }

    if (args.is_flagged === 1) {
        $("#mail-subject").append("<i class='fas fa-exclamation-triangle' style='color: yellow;'></i>");
    }

    $("#mail-date").html(moment(args.mail.date * 1000).format("DD.MM.YYYY, hh:mm"));

    $('#modalMailView').modal({ focus: true, show: true });
});

$('#main-table-body').on('dblclick', 'tr', (evt) => {
    const row = $('#main-table').DataTable().row($(evt.target).parent());
    let data = row.data();
    ipcRenderer.send("view-mail", { id: data[5] });
    data[4] = { display: "<i class='fas fa-eye text-info'></i>", val: 0 };
    $('#main-table').DataTable().row($(evt.target).parent()).data(data).draw();
});

$('#modalMailView').on('hidden.bs.modal', (e) => {
    e.preventDefault();
})

$("#mail-client-trash").click((evt) => {
    let rows = $('#main-table').DataTable().rows({ selected: true }).data();
    let methods = [{
        object: "mailbox",
        method: "delete_message",
        params: { id: rows[0][5] }
    }];
    for (let i = 1; i < rows.length; i++) {
        methods.push({
            method: "delete_message",
            params: { id: rows[i][5] }
        });
    }
    ipcRenderer.send("delete-e-mails", { methods });
});

$("#client-reload").click((evt) => {
    ipcRenderer.send("get-e-mail-folder", { folder: tmp.current.id })
});

$("#client-new-mail").click((evt) => {
    $("#new-subject").val("");
    $("#new-recipient").val("");
    $("#new-content").val("");
    $('#new-mail-modal').modal({ focus: true, show: true });
});

$("#mail-send").click((evt) => {
    ipcRenderer.send("send-mail", {
        subject: $("#new-subject").val(),
        to: $("#new-recipient").val(),
        body_plain: $("#new-content").val()
    });
    $("#new-mail-close").click();
});

$("#mail-reply").click((evt) => {
    $("#modalMailView-close").click();
    $("#new-subject").val(`Re: ${$("#mail-subject").html()}`);
    $("#new-recipient").val(`${$("#mail-from").data("mail")}`);
    $("#new-content").val("");
    $('#new-mail-modal').modal({ focus: true, show: true });
});

ipcRenderer.on("alert", (evt, args) => {
    $("#alert-title").html(args.title);
    $("#alert-description").html(args.description);
    $('#alert-modal').modal({ focus: true, show: true });
});

$("#client-settings").click((evt) => {
    $('#mail-settings-modal').modal({ focus: true, show: true });
});

$(document).ready(() => {
    moment().format();
    moment.locale("de");
    $('#main-table').DataTable({
        "columnDefs": [{
                targets: 0,
                orderable: false,
                className: "select-checkbox select-checkbox-all"
            },
            {
                targets: [2, 4],
                visible: true,
                searchable: true,
                render: {
                    _: 'display',
                    sort: 'val'
                }
            },
            {
                targets: [5],
                visible: false,
                searchable: false
            }
        ],
        select: {
            style: 'multi',
            selector: 'td:first-child'
        }
    }).draw();
    window.alert = (function() {
        var nativeAlert = window.alert;
        return function(message) {
            window.alert = nativeAlert;
            if (message.indexOf("DataTables warning") === 0) {
                console.warn(message);
            } else {
                nativeAlert(message);
            }
        }
    })();
    $('.dataTables_length').addClass('bs-select');
    ipcRenderer.send("get-e-mail-folder", { folder: tmp.current.id })
});