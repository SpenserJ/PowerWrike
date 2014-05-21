function initialize() {
  //requirejs(['js/statuses', 'js/debug', 'js/task', 'js/dropdown', 'js/menu_status', 'js/events'], function (statuses, debug, task, dropdown, menu_status, events) {
  requirejs(function (require) {
    require('js/statuses');
    require('js/debug');
    require('js/events');
    require('js/task');
    require('js/dropdown');
    require('js/menu_status');
//['js/statuses', 'js/debug', 'js/task', 'js/dropdown', 'js/menu_status', 'js/events']
    //dropdown.createDropdown('client-menu', [], 'Select a client tag');
    debug.info('Ready!');
  });
}

// If Wrike has already loaded the folders, initialize immediately, otherwise wait for the folders to load
if ($w.folders.isLoaded === true) { initialize(); }
else { $wrike.bus.on('data.folders.loaded', function () { setTimeout(function () { debug.info('delayed start'); initialize(); }, 250); }); }
