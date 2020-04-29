"use strict";

var wiki;

if(typeof $ !== 'undefined'){
  const $ = require('jquery');  // jquery support if not loaded before
}

$.get("specific/client.json").done( (data) => {
  wiki = data;
  var keys = Object.keys(wiki);
  for (var i = 0; i < keys.length; i++)  {
    console.log(wiki[keys[i]]);
    $("#client-object-focus").append(`<option value="${keys[i]}">${keys[i]}</option>`);
  };
});

$("#client-object-focus").change((evt) => {
  var keys = Object.keys(wiki[$("#client-object-focus").val()]);
  $("#client-object-methods").html("");
  for (var i = 0; i < keys.length; i++) {
    $("#client-object-methods").append(`<option value="${keys[i]}">${keys[i]}</option> \n`);
  }
  $('#client-object-methods').selectpicker('refresh');
  moveFooter();
});

$('#client-object-methods').change( (etv) => {
  var method = wiki[$("#client-object-focus").val()][$("#client-object-methods").val()];
  $("#params-description").html(method.description);
  $("#client-params-list").html("");
  $("#client-params-list-required").html("");
  if (method.params !== undefined) {
      var keys = Object.keys(method.params);
  } else {
    console.log(method.params);
    return;
  }
  for (var i = 0; i < keys.length; i++) {
  if (keys[i] === "params-optional") {
    var methods = Object.keys(method.params[keys[i]]);
    for (var x = 0; x < methods.length; x++) {
      $("#client-params-list").append(`
        <div class="row" data-target="${x}">
          <div class="col">
          <input type="text" class="form-control" value="${methods[x]}" id="client-param-key-${x}" />
          </div>
          <div class="col">
            <input type="text" class="form-control" placeholder="${method.params[keys[i]][methods[x]]}" id="client-param-value-${x}" />
          </div>
        </div>
      `);
      }
    } else if (keys[i] === "params-required") {
      var methods = Object.keys(method.params[keys[i]]);
      for (var x = 0; x < methods.length; x++) {
        $("#client-params-list-required").append(`
          <div class="row" data-target="${x}">
            <div class="col">
              <input type="text" class="form-control" value="${methods[x]}" id="client-param-key-${x}" required />
            </div>
            <div class="col">
              <input type="text" class="form-control" placeholder="${method.params[keys[i]][methods[x]]}" id="client-param-value-${x}" required />
            </div>
          </div>
        `);
      }
    } else {
      console.log(keys[i]);
    }
  }
  moveFooter();
});

$("#send-request").click( (evt) => {
  var params = {};
  var rows = $("#client-params-list").children();
  var rows_optional = $( "#client-params-list-required" ).children();
  for (var i = 0; i < rows_optional.length; i++) {
    rows.push(rows_optional[i])
  }
  rows.each( ( index ) => {
    console.log($(`#client-param-key-${$( rows[index]).data("target")}`).val());
    var val = $(`#client-param-value-${$(rows[index]).data("target")}`).val();
    if (val !== "") {
      if (val === "true") {
        val=true;
      } else if (val === "false") {
        val=false;
      } else if (val=== "null") {
        val = null;
      }
      params[$(`#client-param-key-${$( rows[index]).data("target")}`).val()] = $(`#client-param-value-${$(rows[index]).data("target")}`).val();
    }
  })
  ipcRenderer.send("test-request", {
    object: $("#client-object-focus").val(),
    method: $("#client-object-methods").val(),
    params: params
  });
});

ipcRenderer.on("response", (args) => {
  $("#response-body").html("");
  $("#response-body").html(JSON.stringify(args.response, undefined, 4));
  moveFooter();
});
