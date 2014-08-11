define(['debug', 'lib/EventEmitter'], function (debug, EventEmitter) {
  var ee = new EventEmitter();

  function taskChanged(task) {
    debug.debug('Task Changed', task);
    ee.emitEvent('task.changed', [task]);
  }

  $wrike.bus.on('record.updated', taskChanged);
  $wrike.bus.on('notifier.EventTaskChanged', taskChanged);

  function taskSelected(task) {
    if (typeof task.record !== 'undefined') { task = task.record; }
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

  function monitorDisplay() {
    var cmpCenter = Ext.getCmp($('.viewport-center-center').attr('id'));
    cmpCenter.on('add', function (target, added, depth) {
      // If we're switching to the folder list, monitor it for any new tasks
      if (added.bodyCssClass === 'w4-folder-overview-body') {
        loadedTaskList();
      }
    });

    // If the list is already visible on first load, monitor it
    loadedTaskList();

    // Monitor the overlay for any changes
    var cmpOverlay = $wspace.overlay.View.getInstance($wrike.bus);
    cmpOverlay.on('show', overlayShown);
    if (cmpOverlay.hidden === false) { overlayShown(cmpOverlay); }
  }

  function overlayShown(overlay) {
    // Only react when tasks are shown in the overlay
    if (typeof overlay.items.items[0] === 'undefined') { return; }
    monitorTask(overlay.items.items[0]);
  }

  function loadedTaskList() {
    var $container = $('.viewport-center-center .x-border-layout-ct');
    if ($container.length === 0) { return; }

    var cmpCenter = Ext.getCmp($container.attr('id'))
      , cmpRight = cmpCenter.items.items[1];

    // Monitor the right pane for new elements, and monitor any new tasks
    cmpRight.on('add', function (target, added, depth) { monitorTask(added); });

    // If a task is already visible, monitor it for changes
    var cmpTask = Ext.getCmp('details;task');
    if (typeof cmpTask !== 'undefined') { monitorTask(cmpTask); }
  }

  function monitorTask(target) {
    // Only monitor if this is a task
    if (target.id !== 'details;task' && target.ns !== 'o-task') { return; }

    target.on('setrecord', taskSelected);
    if (typeof target.record !== 'undefined') { taskSelected(target); }
  }
  ee.addListener('ready', monitorDisplay);

  return ee;
});
