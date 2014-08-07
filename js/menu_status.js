define(['debug', 'dropdown', 'statuses', 'task', 'events'], function (debug, dropdown, statuses, task, events) {
  var items = []
    , currentTask = task.getCurrentTask()
    , menu;

  $.each(statuses.statuses, function (statusName, status) {
    items.push({
      name: statusName,
      color: status.powerWrike.colorClass,
    });
  });

  // If there aren't any statuses loaded, don't build the menu
  if (items.length === 0) { return; }

  function menuItemClicked($item) {
    var currentTask = task.getCurrentTaskId();
    if (currentTask === false) { return; }
    task.changeTaskStatus(currentTask, statuses.statuses[$item.text().trim()]);
  }

  menu = dropdown.createDropdown('status', items, task.getActiveStatus(), menuItemClicked);

  var shouldUpdateStatusDropdown = function shouldUpdateStatusDropdown(record) {
    var currentTask = task.getCurrentTask();
    // Return if we're not focused on a task, or are getting an update for a different task
    if (currentTask === false || (typeof record !== 'undefined' && currentTask.id !== record.id)) { return; }

    if (typeof record !== 'undefined') {
      currentTask = record;
      // If we're using an updated record, ensure the data property is set
      if (typeof currentTask.data === 'undefined') { currentTask.data = record; }
    }

    // If we have a current task, but it isn't fully loaded, try again in 100ms
    if (typeof currentTask.data === 'undefined' || typeof currentTask.data.parentFolders === 'undefined') {
      return setTimeout(function() { shouldUpdateStatusDropdown(record); }, 100);
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

  // Task updated
  events.addListener('task.selected', shouldUpdateStatusDropdown);
});
