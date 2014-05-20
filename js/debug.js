define(function () {
  function emit(logType, args) {
    console[logType].apply(console, ['Wrike Harder:'].concat([].splice.call(args, 0)));
  }

  return {
    debug: function () { emit('debug', arguments); },
    error: function () { emit('error', arguments); },
    info: function () { emit('info', arguments); },
    log: function () { emit('log', arguments); },
    warn: function () { emit('warn', arguments); },
  };
});
