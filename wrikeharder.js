function initialize() {
  requirejs(function (require) {
    require('js/statuses');
    require('js/debug');
    require('js/events');
    require('js/task');
    require('js/dropdown');
    require('js/menu_department');
    require('js/menu_client');
    require('js/menu_status');
    require('js/mentions');
    require('js/templates');
    debug.info('Ready!');
  });
}

$wrike.bus.on('wrike.ready', function () {
  // If Wrike has already loaded the folders, initialize immediately, otherwise wait for the folders to load
  if ($w.folders.isLoaded === true) { initialize(); }
  else { $wrike.bus.on('data.folders.loaded', function () { setTimeout(initialize, 250); }); }
});
