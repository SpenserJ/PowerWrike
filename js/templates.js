define(['debug', 'events', 'task', 'dropdown'], function (debug, events, task, dropdown) {
  var templates = {
    /*jshint multistr: true */
    'QA - Tabs': 'Please turn the following items into checkboxes!\n\n\
Title\n\
Spell check all copy\n\
Preferably a short description if anyone chooses to share\n\
Thumbnail\n\
Double check contest dates, make sure all fields are included in mockup (if we need a location selector for ex, that means there needs to be a province drop down)\n\
Rules and regulations included and mentioned on the mockup so we can link\n\
Short url.\n\
A list of pages on which to install',
  };

  var items = [];
  $.each(templates, function (name, template) {
    items.push({ name: name, color: 'no-color' });
  });

  function menuItemClicked($item) {
    var templateBody = templates[$item.text().trim()];
    if (typeof templateBody === 'undefined') {
      debug.warn('An error occurred in retrieving the template named "' + $item.text().trim() + '"');
      return;
    }

    var etherpad = Ext.getCmp($('.wspace-task-body .etherpad').parent().attr('id'));
    etherpad.padeditor.ace.callWithAce(function (ace) {
      ace.ace_replaceRange(0, 0, templateBody + '\n\n');
    });
  }

  var menuText = { name: 'Use a template', color: 'no-color' };
  var menu = dropdown.createDropdown('templates', items, menuText, menuItemClicked);

  var shouldRender = function shouldRender(record) {
    if ($.contains(task.getTaskElement(), menu.$button[0]) === false) {
      menu.renderButton(menuText);
    }
  };

  events.on('task.selected', shouldRender);
});
