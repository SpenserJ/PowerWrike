define(['debug', 'dropdown', 'folders', 'task', 'events'], function (debug, dropdown, folders, task, events) {
  var items = []
    , menu
    , departments = {};

  function initialize() {
    var departmentFolders = folders.getSubfolders('/__SS_Departments');
    // If we couldn't load the department folder, don't build the menu
    if (departmentFolders === false) { return; }

    $.each(departmentFolders, function (i, departmentFolder) {
      departments[departmentFolder.data.title] = departmentFolder;
      items.push({
        name: departmentFolder.data.title,
        color: departmentFolder.powerWrike.colorClass,
      });
    });

    // If there aren't any departments loaded, don't build the menu
    if (items.length === 0) { return; }

    // Task updated
    events.addListener('task.selected', shouldUpdateStatusDropdown);
    events.addListener('task.changed', shouldUpdateStatusDropdown);
  }

  function menuItemClicked($item) {
    var currentTask = task.getCurrentTaskId();
    if (currentTask === false) { return; }
    task.changeFolderByGroup(currentTask, departments[$item.text().trim()], departments);
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

    var activeFolder = task.getActiveFolder(currentTask, departments, 'Please select a department tag');
    if (typeof menu === 'undefined') {
      menu = dropdown.createDropdown('department', items, activeFolder, menuItemClicked);
    }

    // Do we need to rerender the button, or can we just update the text?
    if ($.contains(document, menu.$button[0]) === true) {
      menu.setActive(activeFolder);
    } else {
      menu.renderButton(activeFolder);
    }

    // Hide the folder tags now, and in 500ms to be safe
    task.hideFolderTags(departments);
    setTimeout(function() { task.hideFolderTags(departments); }, 500);
  };

  events.addListener('ready', initialize);
});
