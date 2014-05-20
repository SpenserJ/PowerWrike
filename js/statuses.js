define(['js/folders'], function (folders) {
  var wrikeStates = { 'active': 0, 'completed': 1, 'deferred': 2, 'cancelled': 3 };

  var statusFolders = folders.getSubfolders(config.statusFolder)
    , statuses = {}
    , statusesById = {};

  $.each(statusFolders, function (i, val) {
    var wrikeState = val.data.title.match(/\d+\. .* \((.*)\)/);
    // If the status has an improperly formatted name, ignore it
    if (wrikeState == null || typeof (wrikeState = wrikeStates[wrikeState[1].toLowerCase()]) === 'undefined') {
      console.warn('Wrike Harder: Status has the wrong format. Should be titled "123. Your Status Name (Active|Completed|Deferred|Cancelled)"\nYou provided "' + val.data.title + '"');
      return;
    }

    val.wrikeHarder.wrikeState = wrikeState;

    statuses[val.wrikeHarder.uniquePath] = statusesById[val.id] = val;
  });

  return {
    statuses: statuses,
    statusesById: statusesById,
  };
});

