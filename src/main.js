// This is main.html custom javascript.

import { remote } from 'electron';
import PouchDB from 'pouchdb';

var app = remote.app,
    db = new PouchDB('db');

// Load main window's state from database
db.get('main').then(function (doc) {
    // Set window state and show
    app.MainController.setState(doc.state);
}).catch(function (err) {
    console.log('This is first time to load');
    var doc = {
        "_id": "main",
        "state": app.MainController.getState()
    }
    db.put(doc).then(function () {
        app.MainController.setState(doc.state);
    })
})

// Load pad window's state from database
db.allDocs({
    include_docs: true,
    attachments: true,
    startkey: 'pad_'
}).then(function (result) {
    app.PadController.init(result.rows);
}).catch(function (err) {
    console.log(err);
})

// Save main window's state to database
window.onbeforeunload = function() {
    // Load state
    db.get('main').then(function (doc) {
        // Update current state
        return db.put({
            _id: doc._id,
            _rev: doc._rev,
            state: app.MainController.getState()
        })
    }).then(function () {
        // Remove Callback function to quit window
        window.onbeforeunload = () => { }
    }).then(function () {
        app.MainController.destroy();   // destroy window
        window.close();                 // close window
    })
    .catch(function (err) {
        console.log(err);
    })
    // Prevent close window event
    return false;
}

var id = null;

var renderSidebar = function() {
    $(".sidebar-body-list").empty().append(() => {
        var html = "";
        var instances = app.PadController.getAll();
        for(let instance of instances) {
            html += '<li data-id="' + instance.settings.id + '">';
            html += '<a href="#" data-toggle="modal" data-target="#rename-modal">' + instance.settings.name + '</a>';
            html += '<a href="#" data-remoteAction="focus"><i class="fa fa-eye" area-hidden="true"></i></a>';
            html += '<a href="#" data-remoteAction="remove"><i class="fa fa-trash-o" area-hidden="true"></i></a>';
            html += '</li>';
        }
        return html;
    });
}

document.addEventListener('DOMContentLoaded', function () {

    // Init sidenav toggle
    $("#menu-toggle").click(function(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
        $("#pad-wrapper").toggleClass("toggled");
    });

    // Get id
    $(document).on('mouseover', '.sidebar-body-list li', function() {
        id = $(this).data('id');
    });

    // Add event for focus pad
    $(document).on('click', '[data-remoteAction="focus"]', function() {
        app.PadController.focus(id);
    });

    // Add event for delete pad
    $(document).on('click', '[data-remoteAction="remove"]', function() {
        app.PadController.remove(id);
        renderSidebar();
    });

    // Add event for creating new pad
    $(document).on('click', '[data-remoteAction="create"]', function() {
        // Create new pad's table

        var doc = {
            _id: 'pad_' + new Date().getTime(),
            name: 'noname',
            content: {},
            state: {
                x: (window.innerWidth - 400) / 2,
                y: (window.innerHeight - 400) / 2,
                width: 400,
                height: 400,
                frame: false
            }
        };

        db.put(doc).then(function () {
            doc.isFirst = true;
            app.PadController.create(doc);
            // renderSidebar();
        }).catch(function (err) {
            console.log(err);
        })

    });

    // Add event for rename pad
    $(document).on('click', '[data-remoteAction="rename"]', function() {
        var name = $('#rename-modal').find('#name').val();
        if(name == "") return;
        app.PadController.update(id, { name: name });
        renderSidebar();
    });

    // Render sidebar
    // renderSidebar();
});
