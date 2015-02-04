define(['debug', 'dropdown', 'statuses', 'task', 'events'], function (debug, dropdown, statuses, task, events) {
  var items = [], menu;

  function initialize() {
    $.each(statuses.statuses, function (statusName, status) {
      items.push({
        name: statusName,
        color: status.powerWrike.colorClass,
      });
    });

    // If there aren't any statuses loaded, don't build the menu
    if (items.length === 0) { return; }

    // Task updated
    events.addListener('task.selected', shouldUpdateStatusDropdown);
    events.addListener('task.changed', shouldUpdateStatusDropdown);
  }

  function menuItemClicked($item) {
    var currentTask = task.getCurrentTaskId();
    if (currentTask === false) { return; }
    task.changeTaskStatus(currentTask, statuses.statuses[$item.text().trim()]);
  }

  var shouldUpdateStatusDropdown = function shouldUpdateStatusDropdown(record) {
    var currentTask = task.getCurrentTask();
    // Return if we're not focused on the task that is being updated
    if (currentTask.id !== record.id) { return; }

    currentTask = record;
    // If we're using an updated record, ensure the data property is set
    if (typeof currentTask.data === 'undefined') { currentTask.data = record; }

    // If we have a current task, but it isn't fully loaded, try again in 100ms
    if (typeof currentTask.data === 'undefined' || typeof currentTask.data.parentFolders === 'undefined') {
      return setTimeout(function() { shouldUpdateStatusDropdown(record); }, 100);
    }

    if (typeof menu === 'undefined') {
      menu = dropdown.createDropdown('status', items, task.getActiveStatus(), menuItemClicked);
    }

    // Do we need to rerender the button, or can we just update the text?
    if ($.contains(document, menu.$button[0]) === true) {
      menu.setActive(task.getActiveStatus(currentTask));
    } else {
      menu.renderButton(task.getActiveStatus(currentTask));
    }

    // Hide the status tags now, and in 500ms to be safe
    task.hideFolderTags(statuses.statuses);
    setTimeout(function() { task.hideFolderTags(statuses.statuses); }, 500);
  };

  events.addListener('ready', initialize);
});
