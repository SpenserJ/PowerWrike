var config = {
  folderDropdowns: [],
  statusFolder: '/Statuses',
};

function initialize() {
  requirejs(['js/statuses', 'js/debug', 'js/task', 'js/dropdown'], function (statuses, debug, task, dropdown) {
    var delayUpdateStatusDropdown = function delayUpdateStatusDropdown(record) {
      setTimeout(function() { shouldUpdateStatusDropdown(record); }, 0);
    }

    var shouldUpdateStatusDropdown = function shouldUpdateStatusDropdown(record) {
      var currentTask = task.getCurrentTask();
      if (currentTask === false || (typeof record !== 'undefined' && currentTask.id !== record.id)) { return; }

      // If we have a current task, but it isn't fully loaded, try again in 100ms
      if (typeof currentTask.data === 'undefined' || typeof currentTask.data.parentFolders === 'undefined') {
        return setTimeout(function() { shouldUpdateStatusDropdown(record); }, 100);
      }

      dropdown.renderButton();
      setTimeout(function() { task.hideStatusTags(); }, 500);
    };

    // Task updated

      $wrike.bus.on('record.updated', delayUpdateStatusDropdown);
      $wrike.bus.on('notifier.EventTaskChanged', delayUpdateStatusDropdown);

      $wrike.bus.on('list.tasklist.task.selected', delayUpdateStatusDropdown);

      // We need to delay just a touch so that the task can load first
      $wrike.bus.on('overlay.shown', function () { setTimeout(shouldUpdateStatusDropdown, 0); });
      shouldUpdateStatusDropdown();
      debug.info('Ready!');
  });
}

// If Wrike has already loaded the folders, initialize immediately, otherwise wait for the folders to load
if ($w.folders.isLoaded === true) { initialize(); }
else { $wrike.bus.on('data.folders.loaded', function () { setTimeout(function () { debug.info('delayed start'); initialize(); }, 250); }); }
