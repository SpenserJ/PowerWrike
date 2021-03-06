define(['debug', 'statuses', 'events'], function (debug, statuses, ee) {
  function getTaskElement() {
    return $('.wspace-task-view:last');
  }

  function getCurrentTask() {
    // Get the closest Ext Component
    var currentTask = Ext.getCmp($('.wspace-task-view').closest('[id^="ext-comp-"]').attr('id')) || Ext.getCmp('details;task');
    if (typeof currentTask !== 'undefined') {
      if (typeof currentTask.record !== 'undefined') { return currentTask.record; }
      if (typeof currentTask.items.items[0].record !== 'undefined') { return currentTask.items.items[0].record; }
    }

    // If we get here, we couldn't find the record anywhere
    return false;
  }

  function getCurrentTaskId() {
    var currentTask = getCurrentTask();
    return (currentTask === false) ? false : currentTask.id;
  }

  function setDefaultTaskStatus(taskId) {
    var activeStatus = getActiveStatus()
      , currentTask = getCurrentTask();
    if (activeStatus === null) {
      if (currentTask !== false && currentTask.data.id === currentTask.id) {
        var statusKeys = Object.keys(statuses.statuses)
          , status = statuses.statuses[statusKeys[0]];
        debug.warn('Setting default status', currentTask, status);
        changeTaskStatus(currentTask.id, status);
      }
    }
  }

  function changeFolderByGroup(taskId, folder, folderGroup, callbackOnChange) {
    $wrike.record.Task.load(taskId, function(rec) {
      var folderId = folder.id,
          folderIds = [],
          folderChanged = false,
          initialParentFolders = rec.data.parentFolders,
          parentFolders;

      folderIds = $.map(folderGroup, function (getId) { return getId.id; });

      parentFolders = $.grep(rec.data.parentFolders, function (value) {
        return (value == folderId || $.inArray(value, folderIds) == -1);
      });

      if (parentFolders.length !== rec.data.parentFolders.length) { folderChanged = true; }

      if ($.inArray(folderId, parentFolders) == -1) {
        parentFolders.push(folderId);
        folderChanged = true;
      }

      if (folderChanged === true) {
        rec.set('parentFolders', parentFolders);
        if (typeof callbackOnChange === 'function') { callbackOnChange(rec); }
        else { rec.save(null, rec.id); }
      }
    });
  }

  function changeTaskStatus(taskId, status) {
    changeFolderByGroup(taskId, status, statuses.statuses, function (rec) {
      if (rec.data.state !== status.powerWrike.wrikeState) {
        rec.set('state', status.powerWrike.wrikeState);
      }
      rec.save(null, rec.id);
    });
  }

  function hideFolderTags(folderGroup) {
    var $task = $('.wspace-task-view')
      , folderNames = $.map(folderGroup, function (folder) { return folder.powerWrike.uniquePath; });

    // Hide the matching folder tags
    $task.find('.wspace-task-widgets-tags .wspace-tag-simple:visible').filter(function() {
      return ($.inArray($(this).text(), folderNames) !== -1);
    }).hide();
  }

  function getActiveFolder(currentTask, folders, defaultValue) {
    var activeFolder = null
      , foldersById = {}
      , folderIds = [];

    $.each(folders, function (name, folder) {
      foldersById[folder.id] = folder;
      folderIds.push(folder.id.toString());
    });

    if (currentTask !== false && typeof currentTask.data.parentFolders !== 'undefined') {
      var matches = $.grep(currentTask.data.parentFolders, function (val) {
        return ($.inArray(val.toString(), folderIds) !== -1);
      });
      if (matches.length !== 0) {
        var folder = foldersById[matches[0]];
        activeFolder = { name: folder.data.title, color: folder.powerWrike.colorClass, folder: folder };
      }
    }
    // If there isn't a status selected, should we return a default placeholder?
    if (typeof defaultValue === 'string' && activeFolder === null) {
      activeFolder = { name: defaultValue, color: 'no-color', folder: null };
    }
    return activeFolder;
  }

  function getActiveStatus(currentTask) {
    if (typeof currentTask === 'undefined') { currentTask = getCurrentTask(); }
    return getActiveFolder(currentTask, statuses.statuses, 'Select a status');
  }

  function highlightChildTaskStatuses() {
    var activeStatus = getActiveStatus()
      , currentTask = getCurrentTask();

    if (currentTask === false) { return; }

    // Wait until the current task is fully loaded
    if (typeof currentTask.data === 'undefined' || typeof currentTask.data.subTaskIds === 'undefined') {
      return setTimeout(function() { highlightChildTaskStatuses(); }, 100);
    }

    $.each(currentTask.data.subTaskIds, function (i, taskId) {
      var subtask = new $wrike.record.Task({ id: taskId }, taskId);
      subtask.load(function (data) {
        if (data.loaded !== true) {
          debug.error('An error occurred loading task #' + taskId);
          return;
        }

        var task = data.data;
        var statusFolder = getActiveFolder(data, statuses.statuses, 'Select a status');
        var insertChildStatusInterval;
        var total = 0;
        // We need to do some crazy interval logic to ensure Wrike has rendered
        // the elements by the time we have our status element ready.
        var insertChildStatus = function () {
          var $row = $('[id="o-task;subtasks;task=' + taskId + '"], [id="details;task;subtasks;task=' + taskId + '"]');

          total++;
          if ($row.find('.powerwrike-status').length !== 0 || total > 10) {
            clearInterval(insertChildStatusInterval);
            return;
          }

          if ($row.length === 0) { return; }
          var $insertPoint = $row.find('[wrike-task-view-deadline]');
          $insertPoint.before('<span class="powerwrike-status" wrike-task-view-tag wrike-task-view-tag-flavor=' + statusFolder.color + '>' + statusFolder.name + '</span>');
        }
        insertChildStatusInterval = setInterval(insertChildStatus, 100);
      }, !0, 'refresh');
    });
  }

  ee.addListener('task.selected', setDefaultTaskStatus);
  setDefaultTaskStatus();

  ee.addListener('task.selected', highlightChildTaskStatuses);
  highlightChildTaskStatuses();

  return {
    getTaskElement: getTaskElement,
    getCurrentTask: getCurrentTask,
    getCurrentTaskId: getCurrentTaskId,
    changeFolderByGroup: changeFolderByGroup,
    changeTaskStatus: changeTaskStatus,
    hideFolderTags: hideFolderTags,
    getActiveFolder: getActiveFolder,
    getActiveStatus: getActiveStatus,
  };
});
