var config = {
  folderDropdowns: [],
  statusFolder: '/Statuses',
};

function initialize() {
  requirejs(['js/statuses', 'js/debug', 'js/task', 'js/dropdown', 'js/menu_status'], function (statuses, debug, task, dropdown, menu_status) {
    //dropdown.createDropdown('client-menu', [], 'Select a client tag');
    debug.info('Ready!');
  });
}

// If Wrike has already loaded the folders, initialize immediately, otherwise wait for the folders to load
if ($w.folders.isLoaded === true) { initialize(); }
else { $wrike.bus.on('data.folders.loaded', function () { setTimeout(function () { debug.info('delayed start'); initialize(); }, 250); }); }
