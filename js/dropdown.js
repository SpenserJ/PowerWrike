define(['js/debug', 'js/statuses', 'js/task', 'js/styles'], function (debug, statuses, task, styles) {
  var dropdowns = {}
    , stylesLoaded = false;

  var Dropdown = function Dropdown(name, items, active, menuItemClicked) {
    var self = this;
    
    self.name = name;
    self.items = items;
    self.menuItemClicked = menuItemClicked;

    // Set our DOM variables
    self.$dropdown = null;
    self.$button = null;

    self.properties = {
      id: 'powerwrike-dropdown-' + self.name.replace(/[^a-zA-Z0-9_\-]/g, '_'),
    };

    debug.info('Initializing dropdown "' + self.name + '"');
    self.renderDropdown();
    self.renderButton(active);
  };


  Dropdown.prototype.renderDropdown = function renderDropdown() {
    var self = this;

    var $statusItems = [];

    // Remove the dropdown if it already exists
    if (self.$dropdown !== null) { self.$dropdown.remove(); }

    self.$dropdown = $('<div id="' + self.properties.id + '" class="powerwrike-dropdown x-menu x-menu-floating x-layer wspace-task-widgets-status-menu w4-shadow-frame w4-animation-fadein" style="position: absolute; z-index: 15000; visibility: hidden; left: -10000px; top: -10000px;"><a class="x-menu-focus" href="#" onclick="return false;" tabindex="-1"></a><ul class="x-menu-list"></ul></div>');

    $.each(self.items, function (index, itemDetails) {
      /*jshint multistr: true */
      var $item = $('\
<li class="x-menu-list-item">\
<a class="x-menu-item status-icon-0" hidefocus="true" unselectable="on" href="#">\
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
      if ($target.parents('#' + self.properties.id + '-button').length === 0 && $target.parents('#' + self.properties.id).length === 0) {
        if (self.$dropdown.css('visibility') !== 'hidden') {
          self.setVisibility(false);
        }
      }
    });
  };

  Dropdown.prototype.renderButton = function renderButton(active) {
    var self = this;

    var $task = task.getTaskElement();

    // Hide the Wrike Status selector
    $task.find('.ct-status').remove();

    // Remove our button if it already exists
    $task.find('#' + self.properties.id + '-button').remove();

    /*jshint multistr: true */
    self.$button = $('\
<div class="powerwrike-dropdown-button" id="' + self.properties.id + '-button" style="float: left;">\
  <div class="wspace-task-settings-button x-btn-noicon">\
    <div class="wspace-task-tb-button-value"></div>\
  </div>\
</div>\
    ');
    self.setActive(active);
    self.$button.find('.wspace-task-settings-button')
      .hover(
        function() { $(this).addClass('x-btn-over'); },
        function() { $(this).removeClass('x-btn-over'); }
      ).click(function() {
        self.setVisibility(self.$dropdown.css('visibility') === 'hidden');
      });

    $task.find('.w4-task-statebar').prepend(self.$button);
  };

  Dropdown.prototype.setActive = function setActive(active) {
    var self = this
      , $buttonText = self.$button.find('.wspace-task-tb-button-value');
    $buttonText.attr('class', 'wspace-task-tb-button-value wspace-tag-simple wspace-tag-' + active.color)
               .html(active.name);
  };

  Dropdown.prototype.setVisibility = function setVisibility(state) {
    var self = this;

    if (typeof state === 'undefined') { state = true; }

    if (state === false) {
      self.$dropdown.css({ visibility: 'hidden', left: '-10000px', top: '-10000px' });
    } else {
      var offset = self.$button.offset();
      self.$dropdown.css({ visibility: 'visible', left: offset.left, top: offset.top + self.$button.height() });
    }
  };

  function createDropdown(name, items, active, menuItemClicked) {
    if (stylesLoaded === false) {
      stylesLoaded = true;
      styles.addStyle('dropdown',
'.powerwrike-dropdown-button .wspace-task-settings-button { padding: 0 5px; line-height: 54px; }' +
'.w4-task-statebar { padding-left: 21px; }' +
'.powerwrike-dropdown-button .wspace-tag-simple { margin-right: 0; }' +
'.powerwrike-dropdown .x-menu-list { padding: 0; }' +
'.powerwrike-dropdown a.x-menu-item { padding: 5px; }'
      );
    }
    return (dropdowns[name] = new Dropdown(name, items, active, menuItemClicked));
  }

  return {
    dropdowns: dropdowns,
    createDropdown: createDropdown,
  };
});
