'use strict';

const electron = require('electron');

const url = require('url');
const path = require('path');
const fs = require('fs');

const app = electron.app;
const ipcMain = electron.ipcMain;
const dialog = electron.dialog;

const nativeImage = electron.nativeImage;
const BrowserWindow = electron.BrowserWindow;

const locals = {};
const pug = require('electron-pug')({pretty: true}, locals);
var mainWindow = null

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1400, height: 800, autoHideMenuBar: true})

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.pug'),
    protocol: 'file:',
    slashes: true
  }))

 mainWindow.on('closed', function () {
     mainWindow = null
  })

}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
   app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }

});