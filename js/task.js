define(['js/debug', 'js/statuses', 'js/events'], function (debug, statuses, ee) {
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
      if (rec.data.state !== status.wrikeHarder.wrikeState) {
        rec.set('state', status.wrikeHarder.wrikeState);
      }
      rec.save(null, rec.id);
    });
  }

  function hideFolderTags(folderGroup) {
    var $task = $('.wspace-task-view')
      , folderNames = $.map(folderGroup, function (folder) { return folder.wrikeHarder.uniquePath; });

    // Hide the matching folder tags
    $task.find('.wspace-task-widgets-tags .wspace-tag-simple').filter(function() {
      return ($.inArray($(this).text(), folderNames) !== -1);
    }).hide();
  }

  function getActiveStatus(provideDefault) {
    var currentTask = getCurrentTask()
      , activeStatus = null;
    if (currentTask !== false) {
      $.each(currentTask.data.parentFolders, function (i, id) {
        if (typeof statuses.statusesById[id] !== 'undefined') {
          var status = statuses.statusesById[id];
          activeStatus = { name: status.wrikeHarder.uniquePath, color: status.wrikeHarder.colorClass };
        }
      });
    }
    // If there isn't a status selected, should we return a default placeholder?
    if (provideDefault === true && activeStatus === null) {
      activeStatus = { name: 'Select a status', color: 'no-color' };
    }
    return activeStatus;
  }

  ee.addListener('task.selected', setDefaultTaskStatus);
  setDefaultTaskStatus();

  return {
    getCurrentTask: getCurrentTask,
    getCurrentTaskId: getCurrentTaskId,
    changeFolderByGroup: changeFolderByGroup,
    changeTaskStatus: changeTaskStatus,
    hideFolderTags: hideFolderTags,
    getActiveStatus: getActiveStatus,
  };
});
