define(['js/debug', 'js/dropdown', 'js/folders', 'js/task', 'js/events'], function (debug, dropdown, folders, task, events) {
  var items = []
    , currentTask = task.getCurrentTask()
    , menu
    , clientFolders = folders.getSubfolders('/__SS_Client Tags')
    , clients = {};

  // If we couldn't load the client folder, don't build the menu
  if (clientFolders === false) { return; }

  $.each(clientFolders, function (i, clientFolder) {
    clients[clientFolder.data.title] = clientFolder;
    items.push({
      name: clientFolder.data.title,
      color: clientFolder.powerWrike.colorClass,
    });
  });

  function menuItemClicked($item) {
    var currentTask = task.getCurrentTaskId();
    if (currentTask === false) { return; }
    task.changeFolderByGroup(currentTask, clients[$item.text().trim()], clients);
  }

  var activeFolder = task.getActiveFolder(currentTask, clients, 'Please select a client tag');
  menu = dropdown.createDropdown('client', items, activeFolder, menuItemClicked);

  var shouldUpdateStatusDropdown = function shouldUpdateStatusDropdown(record) {
    var currentTask = task.getCurrentTask();
    if (currentTask === false || (typeof record !== 'undefined' && currentTask.id !== record.id)) { return; }

    if (typeof record !== 'undefined') { currentTask = record; }

    // If we have a current task, but it isn't fully loaded, try again in 100ms
    if (typeof currentTask.data === 'undefined' || typeof currentTask.data.parentFolders === 'undefined') {
      return setTimeout(function() { shouldUpdateStatusDropdown(record); }, 100);
    }

    // Do we need to rerender the button, or can we just update the text?
    var activeFolder = task.getActiveFolder(currentTask, clients, 'Please select a client tag');
    if ($.contains(task.getTaskElement(), menu.$button[0]) === true) {
      menu.setActive(activeFolder);
    } else {
      menu.renderButton(activeFolder);
    }

    // Hide the folder tags now, and in 500ms to be safe
    task.hideFolderTags(clients);
    setTimeout(function() { task.hideFolderTags(clients); }, 500);
  };

  // Task updated
  events.addListener('task.selected', shouldUpdateStatusDropdown);
});
