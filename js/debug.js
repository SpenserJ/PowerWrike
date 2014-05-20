define(function () {
  function emit(logType, args) {
    console[logType].apply(console, ['Wrike Harder:'].concat([].splice.call(args, 0)));
  }

  return {
    debug: function () { emit('debug', arguments); },
    error: function () {
      emit('error', arguments);
      console.trace();
      alert('A critical error has occurred. Please contact Spenser for assistance in resolving this.\n\nAfter pressing OK, you may open a new tab and continue working. Do not close this tab!');
      debugger;
    },
    info: function () { emit('info', arguments); },
    log: function () { emit('log', arguments); },
    warn: function () { emit('warn', arguments); },
  };
});
