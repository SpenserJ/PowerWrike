define(['js/debug', 'js/statuses', 'js/task'], function (debug, statuses, task) {
  var dropdowns = {};

  var Dropdown = function Dropdown(name, items, active, menuItemClicked) {
    var self = this;
    
    self.name = name;
    self.items = items;
    self.menuItemClicked = menuItemClicked;
    self.$dropdown = null;
    debug.debug(self);

    self.properties = {
      id: 'wrikeharder-dropdown-' + self.name.replace(/[^a-zA-Z0-9_\-]/g, '_'),
    }

    debug.info('Initializing dropdown "' + self.name + '"');
    self.renderDropdown();
    self.renderButton(active);
  }


  Dropdown.prototype.renderDropdown = function renderDropdown() {
    var self = this;

    // Remove the dropdown if it already exists
    if (self.$dropdown != null) { self.$dropdown.remove(); }

    self.$dropdown = $('<div id="' + self.properties.id + '" class="x-menu x-menu-floating x-layer wspace-task-widgets-status-menu w4-shadow-frame w4-animation-fadein" style="position: absolute; z-index: 15000; visibility: hidden; left: -10000px; top: -10000px;"><a class="x-menu-focus" href="#" onclick="return false;" tabindex="-1"></a><ul class="x-menu-list"></ul></div>'),
        $statusItems = [];

    $.each(self.items, function (index, itemDetails) {
      var $item = $('\
<li class="x-menu-list-item">\
<a class="x-menu-item status-icon-0" hidefocus="true" unselectable="on" href="#" style="padding-left: 26px;">\
  <div class="wspace-tag-simple wspace-tag-' + itemDetails.color + '">' + itemDetails.name + '</div>\
</a>\
</li>\
      ');
      $item.hover(function() { $(this).addClass('x-menu-item-active'); }, function() { $(this).removeClass('x-menu-item-active'); });
      $item.click(function (e) {
        e.preventDefault();
        self.$dropdown.css({ visibility: 'hidden', left: '-10000px', top: '-10000px' });
        self.menuItemClicked($(this));
      });
      $statusItems.push($item);
    });

    self.$dropdown.find('ul').append($statusItems);
    $('body').append(self.$dropdown)
             .click(function(e) {
      var $target = $(e.target);
      if ($target.parents('.ct-status').length === 0 && $target.parents('#' + self.properties.id).length === 0) {
        if (self.$dropdown.css('visibility') !== 'hidden') {
          self.setVisibility(false);
        }
      }
    });
  };

  Dropdown.prototype.renderButton = function renderButton(active) {
    var self = this;

    var $task = $('.wspace-task-view');

    /*if (activeStatus == null) {
      if (currentTask.data.id === currentTask.id) {
        task.setDefaultTaskStatus(currentTask.data.id);
      }
      return;
    }*/

    // Hide the Wrike Status selector
    $task.find('.ct-status').remove();

    var $button = $('\
<div class="ct-status">\
<div class="wspace-task-settings-button x-btn-noicon">\
  <div class="wspace-task-tb-button-value wspace-tag-simple wspace-tag-' + active.color + '">\
    ' + active.name + '\
  </div>\
</div>\
</div>\
    ');
    $button.find('.wspace-task-settings-button')
      .hover(
        function() { $(this).addClass('x-btn-over'); },
        function() { $(this).removeClass('x-btn-over'); }
      ).click(function() {
        self.setVisibility(self.$dropdown.css('visibility') === 'hidden');
      });

    $task.find('.w4-task-statebar').prepend($button);
  };

  Dropdown.prototype.setVisibility = function setVisibility(state) {
    var self = this;

    if (typeof state === 'undefined') { state = true; }

    var $button = $('.wspace-task-view .ct-status');

    if (state === false) {
      self.$dropdown.css({ visibility: 'hidden', left: '-10000px', top: '-10000px' });
    } else {
      var offset = $button.offset();
      self.$dropdown.css({ visibility: 'visible', left: offset.left, top: offset.top + $button.height() });
    }
  }

  function createDropdown(name, items, active, menuItemClicked) {
    return dropdowns[name] = new Dropdown(name, items, active, menuItemClicked);
  }

  return {
    dropdowns: dropdowns,
    createDropdown: createDropdown,
  };
});
