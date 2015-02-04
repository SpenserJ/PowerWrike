var requireLocal = cajon.config({
  baseUrl: cajonBaseURL + 'js',
  paths: {
    'lib': '../lib',
    'config': '../config',
    jquery: [
      'http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min',
      'lib/jquery'
    ]
  }
});

// Cleanup our Cajon config
delete cajonBaseURL;

function initialize() {
  requireLocal([
      'debug',
      'events',
      'dashboard',
      'menu_status',
      'menu_department',
      'menu_client',
      'templates',
      'mentions',
    ], function (
      debug,
      events,
      dashboard,
      menu_status,
      menu_department,
      menu_client,
      templates,
      mentions
    ) {

    // Give our debug library a message to prefix to the logs
    debug.initialize('PowerWrike');

    // The extension core is initialized
    debug.info('is ready');
    events.emitEvent('ready');
  });
}

// If Wrike has already loaded the folders, initialize immediately, otherwise wait for the folders to load
if ($w.folders.isLoaded === true) { initialize(); }
else { $wrike.bus.on('data.folders.loaded', initialize); }
