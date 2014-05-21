define(['js/debug', 'js/dropdown', 'js/statuses', 'js/task'], function (debug, dropdown, statuses, task) {
  var items = []
    , currentTask = task.getCurrentTask()
    , menu;

  $.each(statuses.statuses, function (statusName, status) {
    items.push({
      name: statusName,
      color: status.wrikeHarder.colorClass,
    });
  });

  function menuItemClicked($item) {
    var currentTask = task.getCurrentTaskId();
    if (currentTask === false) { return; }
    task.changeTaskStatus(currentTask, statuses.statuses[$item.text().trim()]);
  }

  function getActiveStatus() {
    var activeStatus = { name: 'Select a status', color: 'no-color' };
    if (currentTask !== false) {
      $.each(currentTask.data.parentFolders, function (i, id) {
        if (typeof statuses.statusesById[id] !== 'undefined') {
          var status = statuses.statusesById[id];
          activeStatus = { name: status.wrikeHarder.uniquePath, color: status.wrikeHarder.colorClass };
        }
      });
    }
    return activeStatus;
  }

  menu = dropdown.createDropdown('status', items, getActiveStatus(), menuItemClicked);

  var delayUpdateStatusDropdown = function delayUpdateStatusDropdown(record) {
    setTimeout(function() { shouldUpdateStatusDropdown(record); }, 0);
  };

  var shouldUpdateStatusDropdown = function shouldUpdateStatusDropdown(record) {
    var currentTask = task.getCurrentTask();
    if (currentTask === false || (typeof record !== 'undefined' && currentTask.id !== record.id)) { return; }

    // If we have a current task, but it isn't fully loaded, try again in 100ms
    if (typeof currentTask.data === 'undefined' || typeof currentTask.data.parentFolders === 'undefined') {
      return setTimeout(function() { shouldUpdateStatusDropdown(record); }, 100);
    }

    menu.renderButton(getActiveStatus());

    // Hide the status tags now, and in 500ms to be safe
    task.hideStatusTags();
    setTimeout(function() { task.hideStatusTags(); }, 500);
  };

  // Task updated
  $wrike.bus.on('record.updated', delayUpdateStatusDropdown);
  $wrike.bus.on('notifier.EventTaskChanged', delayUpdateStatusDropdown);

  $wrike.bus.on('list.tasklist.task.selected', delayUpdateStatusDropdown);

  // We need to delay just a touch so that the task can load first
  $wrike.bus.on('overlay.shown', function () { setTimeout(shouldUpdateStatusDropdown, 0); });
  shouldUpdateStatusDropdown();
});
