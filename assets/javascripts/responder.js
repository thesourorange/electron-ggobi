const ipcRenderer = require('./assets/index.js').ipcRenderer;
const pug = require('pug');
const d3 = require('d3');

let $ = require('jquery');

var schemaTemplate = pug.compileFile('assets/views/schema.pug');

var data = null;

$('#load').on('click', function(e) {
    
    $('#uploadDialog').css('display', 'block');

    return false;

});


$('#show').on('click', function(e) {

    return false;

});

$('#uploadDialogClose').on('click', function(e) {
    
    $('#uploadDialog').css('display', 'none');

    return false;

});

$(document).ready(function() {
    var dropzone = $('#droparea');
    
    dropzone.on('dragover', function() {
      dropzone.addClass('hover');
      return false;
    });
  
    dropzone.on('dragleave', function() {
      dropzone.removeClass('hover');
      return false;
    });
    
    dropzone.on('drop', function(e) {
      //prevent browser from open the file when drop ofd
      e.stopPropagation();
      e.preventDefault();
      dropzone.removeClass('hover');
      
      //retrieve uploaded files data
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
      
      Array.prototype.slice.call(files).forEach(function(file) { 
        var fileURL = URL.createObjectURL(file);

        d3.csv(fileURL, function(error, rows) {
          var headers = d3.keys(rows[0]);
          
          data = rows;

          var html = schemaTemplate({
            fields: headers
          });
  
          $('#schema').html(html);
  
          $("input[type=checkbox]").on("click", function() {
            var checked = $( "input:checked" ).length;
    
            if (checked > 1) {
              $('#showButton').css('color', 'white');
              $('#show').css('color', 'white');
            } else {
              $('#showButton').css('color', 'grey');
              $('#show').css('color', 'grey');
            }
   
          });
       
          $('#uploadDialog').css('display', 'none');    
    
        });
   
      });

    }
    
});
