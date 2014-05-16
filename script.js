(function () {
  var config = {

  };

  /**
   * Do not edit below this line, unless you're a Wrike god.
   */

  var wrikeHarder = function () {
    var self = this;

    self.statusMenu = null;

    self.wrikeStates = { 'active': 0, 'completed': 1, 'deferred': 2, 'cancelled': 3 };
    self.statuses = {};
    self.statusesById = {};
    
    self.getStatuses = function getStatuses() {
      var statusFolderId = $w.folders.findBy(function(test) {
        return test.data.titlePath === '/Statuses';
      }, null, null);
      var statusFolder = $w.folders.getAt(statusFolderId);
      var statuses = $w.folders.getChildren(statusFolder);
      $.each(statuses, function (i, val) {
        val.wrikeHarder = {
          uniquePath: $w.folders.getUniquePath(val),
          colorClass: 'no-color',
        };

        if (val.data.metaData != null) {
          var metadata = $.parseJSON(val.data.metaData);
          if (typeof metadata.iconCls !== 'undefined') { val.wrikeHarder.colorClass = metadata.iconCls.replace('w3-custom-node-', ''); }
        }

        var wrikeState = val.data.title.match(/\d+\. .* \((.*)\)/);
        // If the status has an improperly formatted name, ignore it
        if (wrikeState == null || typeof (wrikeState = self.wrikeStates[wrikeState[1].toLowerCase()]) === 'undefined') {
          console.warn('Wrike Harder: Status has the wrong format. Should be titled "123. Your Status Name (Active|Completed|Deferred|Cancelled)"\nYou provided "' + val.data.title + '"');
          return;
        }

        val.wrikeHarder.wrikeState = wrikeState;

        self.statuses[val.wrikeHarder.uniquePath] = val;
        self.statusesById[val.id] = val;
      });
    };

    self.getCurrentTask = function getCurrentTask() {
      // Get the closest Ext Component
      var currentTask = Ext.getCmp($('.wspace-task-view').closest('[id^="ext-comp-"]').attr('id')) || Ext.getCmp('details;task');
      if (typeof currentTask !== 'undefined') {
        if (typeof currentTask.record !== 'undefined') { return currentTask.record; }
        if (typeof currentTask.items.items[0].record !== 'undefined') { return currentTask.items.items[0].record; }
      }

      // If we get here, we couldn't find the record anywhere
      console.log('Couldn\'t find current task');
      return false;
    }

    self.getCurrentTaskId = function getCurrentTaskId() {
      var currentTask = self.getCurrentTask();
      return (currentTask === false) ? false : currentTask.id;
    }

    self.addStatusMenu = function addStatusMenu() {
      $('#status-improved-menu').remove();
      self.statusMenu = $menu = $('<div id="status-improved-menu" class="x-menu x-menu-floating x-layer wspace-task-widgets-status-menu w4-shadow-frame w4-animation-fadein" style="position: absolute; z-index: 15000; visibility: hidden; left: -10000px; top: -10000px;"><a class="x-menu-focus" href="#" onclick="return false;" tabindex="-1"></a><ul class="x-menu-list"></ul></div>'),
          $statusItems = [];

      $.each(self.statuses, function (status, rawStatus) {
        var $item = $('\
<li class="x-menu-list-item">\
  <a class="x-menu-item status-icon-0" hidefocus="true" unselectable="on" href="#" style="padding-left: 26px;">\
    <div class="wspace-tag-simple wspace-tag-' + rawStatus.wrikeHarder.colorClass + '">' + status + '</div>\
  </a>\
</li>\
        ');
        $item.hover(function() { $(this).addClass('x-menu-item-active'); }, function() { $(this).removeClass('x-menu-item-active'); });
        $item.click(function (e) {
          e.preventDefault();
          $('#status-improved-menu').css({ visibility: 'hidden', left: '-10000px', top: '-10000px' });

          var currentTask = self.getCurrentTaskId();
          if (currentTask === false) { return; }
          self.changeTaskStatus(currentTask, self.statuses[$(this).text().trim()]);
        });
        $statusItems.push($item);
      });

      $menu.find('ul').append($statusItems);
      $('body').append($menu)
               .click(function(e) {
        var $target = $(e.target);
        if ($target.parents('.ct-status').length === 0 && $target.parents('#status-improved-menu').length === 0) {
          if ($menu.css('visibility') !== 'hidden') {
            self.setStatusMenuVisible(false);
          }
        }
      });
    };

    self.setStatusMenuVisible = function setStatusMenuVisible(state) {
      if (typeof state === 'undefined') { state = true; }

      var $statusDropdown = $('.wspace-task-view .ct-status');

      if (state === false) {
        $menu.css({ visibility: 'hidden', left: '-10000px', top: '-10000px' });
      } else {
        var offset = $statusDropdown.offset();
        $menu.css({ visibility: 'visible', left: offset.left, top: offset.top + $statusDropdown.height() });
      }
    }

    self.setDefaultTaskStatus = function setDefaultTaskStatus(taskId) {
      var statusKeys = Object.keys(self.statuses)
        , status = self.statuses[statusKeys[0]];
      console.log('Setting task ' + taskId + '\'s status to ' + statusKeys[0]);
      self.changeTaskStatus(taskId, status);
      return status;
    }
    
    self.changeTaskStatus = function changeTaskStatus(taskId, status) {
      $wrike.record.Task.load(taskId, function(rec) {
        var statusId = status.id,
            statusIds = [],
            statusChanged = false,
            initialParentFolders = rec.data.parentFolders,
            parentFolders;

        $.each(self.statuses, function (key, value) { statusIds.push(value.id); });

        parentFolders = $.grep(rec.data.parentFolders, function (value) {
          return (value !== statusId && $.inArray(value, statusIds) == -1 && (statusChanged = true));
        });

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
    };

    self.removeStatusTags = function removeStatusTags() {
      var $task = $('.wspace-task-view')
        , statusNames = Object.keys(self.statuses);
      // Disable removing status folders
      $task.find('.wspace-task-widgets-tags .wspace-tag-simple').filter(function() {
        return ($.inArray($(this).text(), statusNames) !== -1);
      }).hide();
    };

    // Task updated
    self.updateStatusDropdown = function updateStatusDropdown() {
      var currentTask = self.getCurrentTask()
        , $task = $('.wspace-task-view')
        , activeStatus = null
        , statusClasses = '';

      if (currentTask === false) { return; }

      self.removeStatusTags();

      $.each(currentTask.data.parentFolders, function (i, id) {
        if (typeof self.statusesById[id] !== 'undefined') {
          var status = self.statusesById[id];
          activeStatus = status.wrikeHarder.uniquePath;
          statusClasses = 'wspace-tag-simple wspace-tag-' + status.wrikeHarder.colorClass;
        }
      });

      if (activeStatus == null) {
        if (currentTask.data.id === currentTask.id) {
          self.setDefaultTaskStatus(currentTask.data.id);
        }
        return;
      }

      // Hide the Wrike Status selector
      $task.find('.ct-status').remove();

      var $statusDropdown = $('\
  <div class="ct-status">\
  <div class="wspace-task-settings-button x-btn-noicon">\
     <div class="wspace-task-tb-button-value ' + statusClasses + '">\
      ' + activeStatus + '\
    </div>\
  </div>\
  </div>\
      ');
      $statusDropdown.find('.wspace-task-settings-button')
        .hover(
          function() { $(this).addClass('x-btn-over'); },
          function() { $(this).removeClass('x-btn-over'); }
        ).click(function() {
          self.setStatusMenuVisible(self.statusMenu.css('visibility') === 'hidden');
        });

      $task.find('.w4-task-statebar').prepend($statusDropdown);
    };

    var delayUpdateStatusDropdown = function delayUpdateStatusDropdown(record) {
      setTimeout(function() { shouldUpdateStatusDropdown(record); }, 0);
    }

    var shouldUpdateStatusDropdown = function shouldUpdateStatusDropdown(record) {
      var currentTask = self.getCurrentTask();
      if (currentTask === false || (typeof record !== 'undefined' && currentTask.id !== record.id)) { return; }

      // If we have a current task, but it isn't fully loaded, try again in 100ms
      if (typeof currentTask.data === 'undefined' || typeof currentTask.data.parentFolders === 'undefined') {
        return setTimeout(function() { shouldUpdateStatusDropdown(record); }, 100);
      }

      self.updateStatusDropdown();
      setTimeout(function() { self.removeStatusTags(); }, 500);
    };

    var initialize = function initialize() {
      $wrike.bus.on('record.updated', delayUpdateStatusDropdown);
      $wrike.bus.on('notifier.EventTaskChanged', delayUpdateStatusDropdown);

      $wrike.bus.on('list.tasklist.task.selected', delayUpdateStatusDropdown);

      // We need to delay just a touch so that the task can load first
      $wrike.bus.on('overlay.shown', function () { setTimeout(shouldUpdateStatusDropdown, 0); });

      // Initialize WrikeHarder
      self.getStatuses();
      self.addStatusMenu();
      //setTimeout(shouldUpdateStatusDropdown, 500);
      shouldUpdateStatusDropdown();

      console.info('Wrike Harder is ready');
    };

    // If Wrike has already loaded the folders, initialize immediately, otherwise wait for the folders to load
    if ($w.folders.isLoaded === true) { initialize(); }
    else { $wrike.bus.on('data.folders.loaded', function () { setTimeout(function () { console.log('delayed start'); initialize(); }, 250); }); }
  }
  
  /*$wspace.list.tasklist.ListView.on('task.selected', function (task) {
    console.info('!WH - Task Selected: ', task);
  });*/

  $wrikeHarder = new wrikeHarder();
})();
