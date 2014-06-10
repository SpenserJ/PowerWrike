define(['js/debug', 'lib/EventEmitter'], function (debug, EventEmitter) {
  var ee = new EventEmitter();

  function taskChanged(task) {
    debug.debug('Task Changed', task);
    ee.emitEvent('task.changed', [task]);
  }

  $wrike.bus.on('record.updated', taskChanged);
  $wrike.bus.on('notifier.EventTaskChanged', taskChanged);

  function taskSelected(task) {
    debug.debug('Task Selected', task);
    ee.emitEvent('task.selected', [task]);
  }

  $wrike.bus.on('list.tasklist.task.selected', taskSelected);
  // Delay the event for overlays slightly, so it can finish loading
  $wrike.bus.on('overlay.shown', function(task) { setTimeout(function() { taskSelected(task); }, 50); });

  function commentAdded(comment) {
    ee.emitEvent('task.comment', [comment]);
  }

  $wrike.bus.on("notifier.EventCommentAdded", commentAdded);

  function notificationShown(notification) {
    ee.emitEvent('notification.shown', [notification]);
  }
 
  $wrike.bus.on('desktop.notification.open.item', notificationShown);

  return ee;
});
