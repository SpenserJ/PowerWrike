define(['js/debug', 'js/dropdown', 'js/folders', 'js/task', 'js/events'], function (debug, dropdown, folders, task, events) {
  var items = []
    , currentTask = task.getCurrentTask()
    , menu
    , departmentFolders = folders.getSubfolders('/__SS_Departments')
    , departments = {};

  // If we couldn't load the department folder, don't build the menu
  if (departmentFolders === false) { return; }

  $.each(departmentFolders, function (i, departmentFolder) {
    departments[departmentFolder.data.title] = departmentFolder;
    items.push({
      name: departmentFolder.data.title,
      color: departmentFolder.powerWrike.colorClass,
    });
  });

  function menuItemClicked($item) {
    var currentTask = task.getCurrentTaskId();
    if (currentTask === false) { return; }
    task.changeFolderByGroup(currentTask, departments[$item.text().trim()], departments);
  }

  var activeFolder = task.getActiveFolder(currentTask, departments, 'Please select a department tag');
  menu = dropdown.createDropdown('department', items, activeFolder, menuItemClicked);

  var shouldUpdateStatusDropdown = function shouldUpdateStatusDropdown(record) {
    var currentTask = task.getCurrentTask();
    if (currentTask === false || (typeof record !== 'undefined' && currentTask.id !== record.id)) { return; }

    if (typeof record !== 'undefined') { currentTask = record; }

    // If we have a current task, but it isn't fully loaded, try again in 100ms
    if (typeof currentTask.data === 'undefined' || typeof currentTask.data.parentFolders === 'undefined') {
      return setTimeout(function() { shouldUpdateStatusDropdown(record); }, 100);
    }

    // Do we need to rerender the button, or can we just update the text?
    var activeFolder = task.getActiveFolder(currentTask, departments, 'Please select a department tag');
    if ($.contains(document, menu.$button[0]) === true) {
      menu.setActive(activeFolder);
    } else {
      menu.renderButton(activeFolder);
    }

    // Hide the folder tags now, and in 500ms to be safe
    task.hideFolderTags(departments);
    setTimeout(function() { task.hideFolderTags(departments); }, 500);
  };

  // Task updated
  events.addListener('task.changed', shouldUpdateStatusDropdown);
  events.addListener('task.selected', shouldUpdateStatusDropdown);
  shouldUpdateStatusDropdown();
});
