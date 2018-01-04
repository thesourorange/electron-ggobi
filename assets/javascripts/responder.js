const ipcRenderer = require('./assets/index.js').ipcRenderer;
const pug = require('pug');

let $ = require('jquery');
var lines = [];

$('#load').on('click', function(e) {
    
    $('#uploadDialog').css('display', 'block');

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
        getAsText(file);
      });

    }

    function getAsText(file) {
      var reader = new FileReader();
    
      reader.readAsText(file);

      // Handle errors load
      reader.onload = loadHandler;
      reader.onerror = errorHandler;
    
    }

    function loadHandler(event) {
      var csv = event.target.result;
    
      processData(csv);

      $('#uploadDialog').css('display', 'none');    
    
    }

    function processData(csv) {
      var allTextLines = csv.split(/\r\n|\n/);
 
      for (var iLine = 0; iLine<allTextLines.length; iLine++) {
        var data = allTextLines[iLine].split(',');
        var row = [];

        for (var iColumn = 0; iColumn< data.length; iColumn++) {
          row.push(data[iColumn]);
        }
          
        lines.push(row);

      }

    }

    function errorHandler(evt) {
      if (evt.target.error.name == "NotReadableError") {
        alert("Cannot read file !");
      }
    }
    
});
