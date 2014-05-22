define(['js/debug'], function (debug) {
  var $styles = $('<style type="text/css"></style>').appendTo('head')
    , renderedStyles = {};

  function addStyle(name, stylesToAdd) {
    renderedStyles[name] = stylesToAdd;
    renderStyles();
  }

  function removeStyle(name) {
    delete renderedStyles[name];
    renderStyles();
  }

  function renderStyles() {
    var styles = '';
    $.each(renderedStyles, function (name, stylesheet) {
      styles += stylesheet;
    });
    $styles.html(styles);
  }

  return {
    addStyle: addStyle,
    removeStyle: removeStyle,
  };
});
