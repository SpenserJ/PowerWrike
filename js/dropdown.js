define(['js/statuses', 'js/task'], function (statuses, task) {
  var $dropdown;

  console.log('Initializing dropdown');

  function renderDropdown() {
    $('#status-improved-menu').remove();
    $dropdown = $('<div id="status-improved-menu" class="x-menu x-menu-floating x-layer wspace-task-widgets-status-menu w4-shadow-frame w4-animation-fadein" style="position: absolute; z-index: 15000; visibility: hidden; left: -10000px; top: -10000px;"><a class="x-menu-focus" href="#" onclick="return false;" tabindex="-1"></a><ul class="x-menu-list"></ul></div>'),
        $statusItems = [];

    $.each(statuses.statuses, function (status, rawStatus) {
      var $item = $('\
<li class="x-menu-list-item">\
<a class="x-menu-item status-icon-0" hidefocus="true" unselectable="on" href="#" style="padding-left: 26px;">\
  <div class="wspace-tag-simple wspace-tag-' + rawStatus.wrikeHarder.colorClass + '">' + status + '</div>\
</a>\
</li>\
      ');
      $item.hover(function() { $(this).addClass('x-menu-item-active'); }, function() { $(this).removeClass('x-menu-item-active'); });
      $item.click(function (e) {
        e.preventDefault();
        $('#status-improved-menu').css({ visibility: 'hidden', left: '-10000px', top: '-10000px' });

        var currentTask = task.getCurrentTaskId();
        if (currentTask === false) { return; }
        task.changeTaskStatus(currentTask, statuses.statuses[$(this).text().trim()]);
      });
      $statusItems.push($item);
    });

    $dropdown.find('ul').append($statusItems);
    $('body').append($dropdown)
             .click(function(e) {
      var $target = $(e.target);
      if ($target.parents('.ct-status').length === 0 && $target.parents('#status-improved-menu').length === 0) {
        if ($dropdown.css('visibility') !== 'hidden') {
          setVisibility(false);
        }
      }
    });
  };

  function renderButton() {
    var currentTask = task.getCurrentTask()
      , $task = $('.wspace-task-view')
      , activeStatus = null
      , statusClasses = '';

    if (currentTask === false) { return; }

    task.hideStatusTags();

    $.each(currentTask.data.parentFolders, function (i, id) {
      if (typeof statuses.statusesById[id] !== 'undefined') {
        var status = statuses.statusesById[id];
        activeStatus = status.wrikeHarder.uniquePath;
        statusClasses = 'wspace-tag-simple wspace-tag-' + status.wrikeHarder.colorClass;
      }
    });

    if (activeStatus == null) {
      if (currentTask.data.id === currentTask.id) {
        task.setDefaultTaskStatus(currentTask.data.id);
      }
      return;
    }

    // Hide the Wrike Status selector
    $task.find('.ct-status').remove();

    var $button = $('\
<div class="ct-status">\
<div class="wspace-task-settings-button x-btn-noicon">\
   <div class="wspace-task-tb-button-value ' + statusClasses + '">\
    ' + activeStatus + '\
  </div>\
</div>\
</div>\
    ');
    $button.find('.wspace-task-settings-button')
      .hover(
        function() { $(this).addClass('x-btn-over'); },
        function() { $(this).removeClass('x-btn-over'); }
      ).click(function() {
        setVisibility($dropdown.css('visibility') === 'hidden');
      });

    $task.find('.w4-task-statebar').prepend($button);
  };

  function setVisibility(state) {
    if (typeof state === 'undefined') { state = true; }

    var $button = $('.wspace-task-view .ct-status');

    if (state === false) {
      $dropdown.css({ visibility: 'hidden', left: '-10000px', top: '-10000px' });
    } else {
      var offset = $button.offset();
      $dropdown.css({ visibility: 'visible', left: offset.left, top: offset.top + $button.height() });
    }
  }

  renderDropdown();

  return {
    renderButton: renderButton,
    setVisibility: setVisibility,
  };
});
