define(['js/debug', 'js/statuses'], function (debug, statuses) {
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
    var statusKeys = Object.keys(statuses.statuses)
      , status = statuses.statuses[statusKeys[0]];
    changeTaskStatus(taskId, status);
    return status;
  }

  function changeTaskStatus(taskId, status) {
    $wrike.record.Task.load(taskId, function(rec) {
      var statusId = status.id,
          statusIds = Object.keys(statuses.statusesById),
          statusChanged = false,
          initialParentFolders = rec.data.parentFolders,
          parentFolders;

      parentFolders = $.grep(rec.data.parentFolders, function (value) {
        return (value != statusId && $.inArray(value.toString(), statusIds) == -1);
      });

      if (parentFolders.length !== rec.data.parentFolders.length) { statusChanged = true; }

      if ($.inArray(statusId, parentFolders) == -1) {
        parentFolders.push(statusId);
        statusChanged = true;
      }

      if (rec.data.state !== status.wrikeHarder.wrikeState) {
        rec.set('state', status.wrikeHarder.wrikeState);
        statusChanged = true;
      }

      if (statusChanged === true) {
        rec.set('parentFolders', parentFolders);
        rec.save(null, rec.id);
      }
    });
  }

  function hideStatusTags() {
    var $task = $('.wspace-task-view')
      , statusNames = Object.keys(statuses.statuses);
    // Disable removing status folders
    $task.find('.wspace-task-widgets-tags .wspace-tag-simple').filter(function() {
      return ($.inArray($(this).text(), statusNames) !== -1);
    }).hide();
  }

  return {
    getCurrentTask: getCurrentTask,
    getCurrentTaskId: getCurrentTaskId,
    setDefaultTaskStatus: setDefaultTaskStatus,
    changeTaskStatus: changeTaskStatus,
    hideStatusTags: hideStatusTags,
  };
});
