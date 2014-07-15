define(['js/debug', 'lib/EventEmitter'], function (debug, EventEmitter) {
  var ee = new EventEmitter();

  /*
  function taskChanged(task) {
    debug.debug('Task Changed', task);
    ee.emitEvent('task.changed', [task]);
  }

  $wrike.bus.on('record.updated', taskChanged);
  $wrike.bus.on('notifier.EventTaskChanged', taskChanged);
  */

  function taskSelected(task) {
    debug.debug('Task Selected', task);
    ee.emitEvent('task.selected', [task]);
  }

  function commentAdded(comment) {
    ee.emitEvent('task.comment', [comment]);
  }

  $wrike.bus.on("notifier.EventCommentAdded", commentAdded);

  function notificationShown(notification) {
    ee.emitEvent('notification.shown', [notification]);
  }
 
  $wrike.bus.on('desktop.notification.open.item', notificationShown);

  var observers = {}, fireAfterUpdate = {}, taskForObserver = {};

  var ignoreClasses = /(etherpad-|CodeMirror-)/;

  function observeForTasks(observerName, element) {
    console.log(arguments);
    if (typeof observers[observerName] !== 'undefined') {
      observers[observerName].disconnect();
    }

    var observer = new MutationObserver(function(mutations, observer) {
      // If we've recently tracked an update for this observer, reset our timer
      if (typeof fireAfterUpdate[observerName] !== 'undefined') {
        clearTimeout(fireAfterUpdate[observerName]);
      }

      // Flatten an array of all mutations' addedNodes
      var added = [];
      $.each(mutations, function (i, mutation) {
        // Ignore certain targets for mutation events
        if (ignoreClasses.test(mutation.target.className) === true) { return; }

        $.each(mutation.addedNodes, function (i2, node) {
          // Ignore certain targets for mutation events
          if (ignoreClasses.test(node.className) === true) { return; }
          // Skip anything related to powerwrike
          if ($(node).closest('.powerwrike').length === 0) {
            added.push(node);
          }
        });
      });

      // If nothing has been added, cancel out
      if (added.length === 0) { return; }

      // If we've added any nodes, try to find a related task
      var $task = $(added[0]).closest('.wspace-task-view');
      if ($task.length > 0) {
        taskForObserver[observerName] = $task[0];
      }

      // If this observer has a related task recorded, fire our timer
      if (typeof taskForObserver[observerName] !== 'undefined') {
        debug.debug('Setting timer for ' + observerName);
        fireAfterUpdate[observerName] = setTimeout(function() {
          debug.debug('firing Setting timer for ' + observerName);
          taskSelected();
        }, 250);
      }
    });
    observer.observe(element, {
      subtree: true,
      attributes: false,
      childList: true,
    });
    observers[observerName] = observer;
  }

  $(document).ready(function() {
    var overlayObserver = new MutationObserver(function(mutations, observer) {
      $.each(mutations, function (i, mutation) {
        $.each(mutation.addedNodes, function (i2, node) {
          // If we're on the dashboard
          if ($.inArray('w2-overlay-wrapper', node.classList) > -1) {
            debug.warn('Detected overlay change');
            observeForTasks('overlay', $(node).find('.x-plain-body')[0]);
          }
        });
      });
    });
    overlayObserver.observe(document.body, { childList: true });
    if ($('.w2-overlay-wrapper').length > 0) {
      debug.warn('Detected overlay on first load');
      observeForTasks('overlay', $('.w2-overlay-wrapper .x-plain-body')[0]);
    }

    var taskObserver = new MutationObserver(function(mutations, observer) {
      $.each(mutations, function (i, mutation) {
        $.each(mutation.addedNodes, function (i2, node) {
          // If we're not on the dashboard
          if ($.inArray('wspace-dashboard-root', node.classList) === -1) {
            debug.warn('Detected sidebar change');
            observeForTasks('sidebar', $(node).find('.x-border-panel:last')[0]);
          }
        });
      });
    });
    var taskSelector = '.viewport-center-center > .x-panel-bwrap > .x-panel-body';
    taskObserver.observe($(taskSelector)[0], { childList: true });
    if ($(taskSelector + ':not(:has(.wspace-dashboard-root))').length > 0) {
      debug.warn('Detected sidebar on first load');
      observeForTasks('sidebar', $(taskSelector + ' .x-border-panel:last')[0]);
    }
  });

  return ee;
});
