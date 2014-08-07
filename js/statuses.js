define(['config', 'folders'], function (config, folders) {
  var wrikeStates = { 'active': 0, 'completed': 1, 'deferred': 2, 'cancelled': 3 };

  var statusFolders = folders.getSubfolders(config.statusFolder)
    , statuses = {}
    , statusesById = {};

  $.each(statusFolders, function (i, val) {
    var wrikeState = val.data.title.match(/\d+\. .* \((.*)\)/);
    // If the status has an improperly formatted name, ignore it
    if (wrikeState === null || typeof (wrikeState = wrikeStates[wrikeState[1].toLowerCase()]) === 'undefined') {
      debug.warn('Status has the wrong format. Should be titled "123. Your Status Name (Active|Completed|Deferred|Cancelled)"\nYou provided "' + val.data.title + '"');
      return;
    }

    val.powerWrike.wrikeState = wrikeState;

    statuses[val.powerWrike.uniquePath] = statusesById[val.id] = val;
  });

  return {
    statuses: statuses,
    statusesById: statusesById,
  };
});

