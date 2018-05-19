const ipcRenderer = require('./assets/index.js').ipcRenderer;
const pug = require('pug');
const d3 = require('d3');

let $ = require('jquery');

var schemaTemplate = null;

$.get('assets/views/schema.template', (data) => {
  schemaTemplate = pug.compile(data);
}, 'text');

var data = null;

var selected = [];

var filters = new Map();
var selectors = new Map();

$.fn.Toggle = (id, button) => {
   
  if ($(id).css("display") == 'none') {
    $(id).css("display", "inline-block");
    $(button).css("background", $(button).css("background").replace('up', 'down'));
  } else {
    $(id).css("display", "none"); 
    $(button).css("background", $(button).css("background").replace('down', 'up'));
  }

}

$.fn.Draw = () => {
  
  $("#area").html("");

  var categories = new Map();
 
  $("#categories").find("input[name=categorical]:checked").each( (i, ob) => { 
    var field = ob.value;
    var fieldID = 'field-' + field.replace(/[\s|0-9|\(|\)]/g, '-');

    categories.set(field, []);
    
    $("#" + fieldID).find("input[type=checkbox]:checked").each( (i, ob) => { 

      categories.get(field).push(ob.value);

    });

  });  
 
  var continuous = new Map();
 
  $("#continuous").find("input[name=continuous]:checked").each( (i, ob) => { 
    var field = ob.value;
 
    var fieldID = 'field-' + field.replace(/[\s|0-9|\(|\)]/g, '-');

    continuous.set(field, []);
    
    $("#" + fieldID).find("input[type=checkbox]:checked").each( (i, ob) => { 
 
      continuous.get(field).push(ob.value);

    });

  });

  var filteredData = data.filter((d, i) => {

    if (!select(categories, d)) {
      return;
    }

    if (!select(continuous, d)) {
      return;
    }
   
    return d;

    function select(map, d) {
      var iKeys = map.keys();

      for (let key of iKeys) {
        
        if (map.get(key).indexOf(d[key]) == -1) {
          return false;
        }

      }

      return true;

    }

  });

  var m = [30, 10, 30, 10],
    w = ($("#area").width() < 600 ? 600 : $("#area").width()) - m[1] - m[3],
    h = ($("#area").height() < 500 ? 500 : $("#area").height()) - 10 - m[0] - m[2];

  var x = d3.scale.ordinal().rangePoints([0, w], 1),
      y = {},
      dragging = {};

  var line = d3.svg.line(),
      axis = d3.svg.axis().orient("left"),
      background,
      foreground;

  var svg = d3.select("#area").append("svg")
              .attr("width", w + m[1] + m[3])
              .attr("height", h + m[0] + m[2])
              .append("g")
              .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

  x.domain(dimensions = d3.keys(filteredData[0]).filter((d) => {
      return (selected.indexOf(d) > -1) && (y[d] = d3.scale.linear()
        .domain(d3.extent(filteredData, (p) => { return + p[d]; }))
        .range([h, 0]));
  }));

  // Add grey background lines for context

  background = svg.append("g")
      .attr("class", "background")
    .selectAll("path")
      .data(filteredData)
    .enter().append("path")
      .attr("d", path);

// Add blue foreground lines for focus.
  foreground = svg.append("g")
      .attr("class", "foreground")
    .selectAll("path")
      .data(filteredData)
    .enter().append("path")
      .attr("d", path);

  var graph = svg.selectAll(".dimension")
    .data(dimensions)
    .enter().append("g")
    .attr("class", "dimension")
    .attr("transform", (d) => { 
      return "translate(" + x(d) + ")"; 
    })
    .call(d3.behavior.drag()
      .on("dragstart", (d) => {
        dragging[d] = this.__origin__ = x(d);
        background.attr("visibility", "hidden");
      })
      .on("drag", (d) => {
        dragging[d] = Math.min(w, Math.max(0, this.__origin__ += d3.event.dx));
        foreground.attr("d", path);
        dimensions.sort((a, b) => {
           return position(a) - position(b); 
        });
        x.domain(dimensions);
        graph.attr("transform", (d) => { 
          return "translate(" + position(d) + ")";
        })
      })
      .on("dragend", (d) => {
        delete this.__origin__;
        delete dragging[d];

        transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
        transition(foreground)
            .attr("d", path);
        background
            .attr("d", path)
            .transition()
            .delay(500)
            .duration(0)
            .attr("visibility", null);
      }));

  try {
  graph.append("g")
    .attr("class", "axis")
    .each(function (column) { 
      d3.select(this).call(axis.scale(y[column])); 
    })
  .append("text")
    .attr("text-anchor", "middle")
    .attr("y", -9)
    .text(String);
  } catch (e) {
    alert(e);
  }
  // Add and store a brush for each axis.
  graph.append("g")
    .attr("class", "brush")
    .each(function(column) { 
      d3.select(this).
        call(y[column].brush = d3.svg.brush().y(y[column]).
          on("brushstart", brushstart).
          on("brush", brush)); 
    })
  .selectAll("rect")
    .attr("x", -8)
    .attr("width", 16);
  
  return;

  /**
   * Get the position
   *
   * @param {*} d 
   */
  function position(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
  }

  function transition(g) {
    return g.transition().duration(500);
  }

  /**
   * Returns the path for  given point
   * 
   * @param {*} d 
   */
  function path(d) {
    return line(dimensions.map((p) => { return [position(p), y[p](d[p])]; }));
  }

  /**
   * When brushing, don’t trigger axis dragging.
   * 
   */
  function brushstart() {
    d3.event.sourceEvent.stopPropagation();
  }

  /**
   *  Handles a brush event, toggling the display of foreground lines.
   *
   */
  function brush() {
    var actives = dimensions.filter((p) => { 
        return !y[p].brush.empty(); 
      }),
    extents = actives.map((p) => { return y[p].brush.extent(); });
    
    foreground.style("display", (d) => {
      return actives.every((p, i) => {
        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
      }) ? null : "none";
    });

  }

}

$(window).resize(() => {

  $(this).Draw();

});

$('#load').on('click', (e) => {
    
  $('#uploadDialog').css('display', 'block');

  return false;

});

$('#draw').on('click', (e) => {
  
  $(this).Draw();

  return false;

});

/**
 * Closing/Hiding the Upload Dialog
 * 
 */
$('#uploadDialogClose').on('click', (e) => {
    
    $('#uploadDialog').css('display', 'none');

    return false;

});

$(document).ready(() => {
    var dropzone = $('#droparea');
    
    dropzone.on('dragover', () => {
      dropzone.addClass('hover');
      return false;
    });
  
    dropzone.on('dragleave', () => {
      dropzone.removeClass('hover');
      return false;
    });
    
    dropzone.on('drop', (e) => {
      e.stopPropagation();
      e.preventDefault();
      dropzone.removeClass('hover');
      
      var files = e.originalEvent.dataTransfer.files;
      processFiles(files);
      
      return false;
  
    });

    var uploadBtn = $('#uploadbtn');
    var defaultUploadBtn = $('#upload');
   
    uploadBtn.on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        defaultUploadBtn.click();
    });
  
    defaultUploadBtn.on('change', function() {
      var files = $(this)[0].files;
  
      processFiles(files);
  
      return false;
  
    });
   
    function processFiles(files) { 
      var categorical = [];
      var continuous = [];

      category = null;

      filters.clear();
      selectors.clear();

      Array.prototype.slice.call(files).forEach((file) => { 
        var fileURL = URL.createObjectURL(file);

        d3.csv(fileURL, (error, rows) => {
        var headers = d3.keys(rows[0]);
        data = rows;

        rows.forEach((row) => {
           
            headers.forEach((column) => {

              if (!isNumber(row[column]) && row[column].match(/\S/)) {  
                
                  if (categorical.indexOf(column) == -1) {
                    categorical.push(column);
                    filters.set(column, []);
                  }

                  if (filters.get(column).indexOf(row[column]) == -1) {
                    filters.get(column).push(row[column]);
                  }

              } else {
                if (continuous.indexOf(column) == -1) {
                  continuous.push(column);
                  selectors.set(column, []);
                }

                if (selectors.get(column).indexOf(row[column]) == -1) {
                  selectors.get(column).push(row[column]);
                }

              }

            });
                      
            function isNumber(n) {
              return !isNaN(parseFloat(n)) && isFinite(n);
            }
 
          });

          category = categorical.length > 0 ? categorical[0] : null;

          var html = schemaTemplate({
            categorical: categorical,
            continuous: continuous,
            filters: filters,
            selectors: selectors
          });

          $('#schema').html(html);
  
          $("input[type=checkbox]").on("click", () => {
            selected = [];

            $("#continuous").find("input[name=continuous]:checked").each((i, ob) => { 
              selected.push(ob.value);
            }); 

            $("#categories").find("input[name=categorical]:checked").each((i, ob) => { 
            });  

            if (selected.length > 1) {
              $('#drawButton').css('color', 'white');
              $('#draw').css('color', 'white');
            } else {
              $('#drawButton').css('color', 'grey');
              $('#draw').css('color', 'grey');
            }

          });
       
          $('#uploadDialog').css('display', 'none'); 
          $('#area').empty();   
    
        });
   
      });

    }
    
});
