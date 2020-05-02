'use strict';

const { remote, shell } = require("electron");
if (typeof $ !== 'undefined') {
    const $ = require('jquery'); // jquery support if not loaded before
}

function copyTextToClipboard(text) {
    var textArea = document.createElement("textarea");

    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';


    textArea.value = text;

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copying text command was ' + msg);
    } catch (err) {
        console.log('Oops, unable to copy');
    }

    document.body.removeChild(textArea);
}

function moveFooter() {
    var dH = $(document).height();
    var wH = $(window).height();
    if (dH > wH) {
        $('#footer').css("position", "relative");
    } else {
        $('#footer').css("position", "absolute");
    }
    $('#footer').addClass("visible fadeIn");
}
$(document).ready(function() {
    moveFooter();
    $(window).resize(function() {
        moveFooter();
    });
    $('ul li:has(ul.sub)').addClass('sub');
});

// open home page externally (Yes. Custom support for my homepage on every fcking page)
$('a[name!="#"]').click(function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
});

// parse "get" method url params
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
        vars[key] = value;
    });
    return vars;
}

// activate all tooltips by data-toggle
$(function() {
    $('[data-toggle="tooltip"]').tooltip();
});

// navigation support with data attribute
$(".send-button").each(function(index) {
    $(this).click(function(event) {
        if ($(this).hasClass("send-default") === false) {
            event.preventDefault();
        }
        if ($(this).data("target") !== undefined) {
            ipcRenderer.send($(this).data("target"));
        } else {
            ipcRenderer.send($(this).attr("id"));
        }
    });
});