const ipcRenderer = require('./assets/index.js').ipcRenderer;
const pug = require('pug');

let $ = require('jquery');

$('#load').on('click', function(e) {
    
    $('#uploadDialog').css('display', 'block');

    return false;

});

$('#uploadDialogClose').on('click', function(e) {
    
    $('#uploadDialog').css('display', 'none');

    return false;

});
