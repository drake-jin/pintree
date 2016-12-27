import { app, BrowserWindow } from 'electron';

export var fileMenuTemplate = {
    label: 'File',
    submenu: [{
        label: "New pad",
        accelerator: "CmdOrCtrl+N",
        click: function () { app.newPad() }
    },{
        type: "separator"
    },{
        label: "All Quit",
        accelerator: "CmdOrCtrl+Shift+Q",
        click: function () { app.quit() }
    }]
};