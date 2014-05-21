define(['js/debug', 'lib/EventEmitter'], function (debug, EventEmitter) {
  var ee = new EventEmitter();

  function taskChanged(task) {
    debug.debug('Task Changed', task);
    ee.emitEvent('task.changed', task);
  }

  $wrike.bus.on('record.updated', taskChanged);
  $wrike.bus.on('notifier.EventTaskChanged', taskChanged);

  function taskSelected(task) {
    debug.debug('Task Selected', task);
    ee.emitEvent('task.selected', task);
  }

  $wrike.bus.on('list.tasklist.task.selected', taskSelected);
  $wrike.bus.on('overlay.shown', taskSelected);

  return ee;
});
