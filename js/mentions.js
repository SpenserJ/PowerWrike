define(['js/debug', 'js/events', 'js/styles'], function (debug, events, styles) {
  var mentions = []
    , processedMentions = []
    , $mentionsPanel
    , $mentionsDropdown
    , mentionsCount = { total: 0, unread: 0 }
    , firstRun = true;

  function getStream() {
    var api = new Ext.data.HttpProxy({ url:'/ui/as_append3' });
    api.doRequest('read', null, {
      aggregateByDays: true,
      aggregatedRescheduleChanges: true,
      //appendContext: "{2:1400176884004}",
      filterAuthorMe: false,
      filterByDeltaTypes: "[comment]",
      filterEditedByMe: false,
      filterFollowedByMe: true,
      filterResponsibleMe: false,
      loadDepthLimit: 10,
      loadLimit: 100,
      massActionsEnabled: true,
      noPeep: true,
      onlyAfterTimeLastRead: false,
      onlyUnread: false,
      parentFolderId: null,
      scanLimit: 200,
    }, { read: handleMentionStreamData }, function(){});
  }

  function getComments(taskId, accountId) {
    var api = new Ext.data.HttpProxy({ url:'/ui/as_get_stream_for_entity' });
    api.doRequest('read', null, {
      loadDepthLimit: 5,
      onlyAfterTimeLastRead: false,
      taskId: taskId,
      accountId: accountId,
      parentFolderId: null,
      aggregateByDays: true,
      aggregatedRescheduleChanges: true,
      massActionsEnabled: true,
      loadLimit: 10,
      noPeep: true,
      scanLimit: 200,
      markAsRead: false,
      filterAuthorMe: false,
      filterByDeltaTypes: "[comment]",
      filterEditedByMe: false,
      filterFollowedByMe: true,
      filterResponsibleMe: false,
      onlyUnread: false,
    }, { read: handleMentionStreamData }, function(){});
  }

  function handleMentionStreamData(response) {
    if (response.status !== 200) {
      debug.error('Failed to get stream data', arguments);
      // We don't need to go any farther, so return an empty function
      return { success: function(){} };
    }

    var data = JSON.parse(response.responseText)
      , userId = $wrike.user.getUid()
      , yourMentions = [];

    // Loop through each update and each comment, looking for the current user being mentioned
    $(data.data.stream).each(function (streamIndex, streamUpdate) {
      $(streamUpdate.agentries).each(function (agentriesIndex, comment) {
        if (comment.comment.text.indexOf('<a class="stream-user-id avatar" rel="' + userId + '">') !== -1) {
          // Skip comments that we've already processed
          if ($.inArray(comment.id, processedMentions) !== -1) { return; }

          processedMentions.push(comment.id);
          var task = streamUpdate;
          delete task.agentries;
          yourMentions.push({ task: task, comment: comment });
          mentionsCount.total++;
          if (comment.isRead !== true) { mentionsCount.unread++; }
        }
      });
    });

    if (yourMentions.length === 0) { return { success: function(){} }; }

    // If this is not our first run, emit an event for any new mentions
    if (firstRun === true) { firstRun = false; }
    else { events.emitEvent('mention', yourMentions); }

    mentions = mentions.concat(yourMentions);
    // Sort mentions in reverse chronological order
    mentions.sort(function (a, b) { return b.comment.timepoint - a.comment.timepoint; });
    renderMentions();

    // We don't need to go any farther, so return an empty function
    return { success: function(){} };
  }

  function commentAdded(comment) {
    var tasksProcessed = [];
    $(comment.ids).each(function (i, taskId) {
      if ($.inArray(taskId, tasksProcessed) !== -1) { return; }
      tasksProcessed.push(taskId);
      getComments(taskId, comment.accountId);
    });
  }
  events.addListener('task.comment', commentAdded);

  function renderPanel() {
    $mentionsPanel = $(/*jshint multistr: true */ '\
<div class="x-panel wspace-dashboard-card wrike-size-small x-portlet" style="margin-bottom: 0; top: 45px; position: fixed; bottom: 27px; right: 9px; width: 512px;">\
  <div class="x-panel-header x-unselectable wrike-panel-header" style="cursor: move;">\
    <span class="wrike-panel-title">Mentions - Can\'t click links yet. Find the task yourself!</span>\
  </div>\
  <div style="overflow: auto; position: absolute; bottom: 0; top: 39px;">\
    <div class="x-panel-body">\
      <div class="stream-panel stream-panel-wide">\
        <div class="stream-view-template-target"></div>\
      </div>\
    </div>\
  </div>\
</div>\
    ').hide();
    $('body').append($mentionsPanel);
  }

  function renderMentions() {
    var $mentionsContainer = $mentionsPanel.find('.stream-view-template-target').empty()
      , $mention
      , lastMention;

    $(mentions).each(function (i, mention) {
      var data = {
        commentAuthor: $wrike.user(mention.comment.entryUid).data(),
        taskAuthor: $wrike.user(mention.task.uid).data(),
        firstResponsible: $wrike.user(mention.task.responsibles[0]).data(),
        timestamp: new Date(mention.comment.timepoint),
      };
      if (mention.task.started === null || mention.task.finished === null) {
        data.taskStart = data.taskEnd = null;
        data.taskLength = 0;
      } else {
        data.taskStart = new Date(mention.task.started);
        data.taskEnd = new Date(mention.task.finished);
        data.taskLength = Math.ceil((data.taskEnd - data.taskStart) / 86400 / 1000);
      }

      // If this is the same task as the last one, group the comments together
      if (typeof lastMention !== 'undefined' && lastMention.task.id === mention.task.id) {
        $mention.find('.comments').append(renderComment(mention.comment, data));
        return;
      }

      $mention = $(/*jshint multistr: true */ '\
<div class="stream-entry stream-task-entry">\
  <div class="body body-root">\
    <div class="visual">\
      <div class="task-photo author-photo">\
        <div class="x-user-avatar ua-' + data.taskAuthor.uid + '"><img src="/avatars/' + data.taskAuthor.avatar + '" width="28" height="28"></div>\
      </div>\
      <div class="task-photo-separator"><img src="https://d3tvpxjako9ywy.cloudfront.net/assets/wspace/-mix/wspace/list/tasklist/arrow-right.png"></div>\
      <div class="task-photo resp-photo">\
        <span class="responsibles-container"><span class="responsibles">' + mention.task.responsibles.length + '</span></span>\
        <div class="x-user-avatar ua-' + data.firstResponsible.uid + '"><img src="/avatars/' + data.firstResponsible.avatar + '" width="28" height="28"></div>\
      </div>\
    </div>\
    <div class="details">\
      <p class="root-title">\
        <span class="root-link">' + mention.task.text + '</span>\
        <span class="parent-folders">\
          <span class="mdash"><!-- --></span>\
          <span class="sqb">[</span>\
        </span>\
      </p>\
      <p class="root-info">\
        <span>\
          <span>' + ((data.taskLength !== 0) ? ('Planned for ' + data.taskStart.toLocaleDateString() + ' – ' + data.taskEnd.toLocaleDateString() + ' (' + data.taskLength + 'd)') : 'Backlogged') + '</span>\
          <span class="importance importance-' + mention.task.priority + '"><span class="icon" unselectable="on">&nbsp;&nbsp;&nbsp;</span></span>\
        </span>\
      </p>\
    </div>\
  </div>\
  <div class="comments">' + renderComment(mention.comment, data) + '</div>\
</div>\
      ');

      var folders = [];
      $(mention.task.parentFolders).each(function (i, folderId) {
        var folder = $w.folders.getById(folderId);

        // Skip any folders that we don't have access to
        if (typeof folder === 'undefined') { return; }

        var $folderLink = $('<a rel="folder' + folder.id + '" ext:qmaxwidth="500" ext:qtip="folder:{id:' + folder.id + '}" ext:qparser="folder" ext:anchor="bottom" ext:qtooltip="true" class="title top-folder folder-link">' + folder.data.title + '</a>');

        $folderLink.click(function() { $wspace.History.openFolder({ id: folder.id }); });
        if (folders.length !== 0) { $folderLink.prepend(', '); }

        folders.push($folderLink);
      });
      $mention.find('.details .parent-folders').append(folders).append('<span class="sqb">]</span>');
      $mentionsContainer.append($mention);
      lastMention = mention;
    });

    renderMentionsDropdown();
  }

  function renderComment(comment, data) {
    var commentHtml = /*jshint multistr: true */ '\
<div class="comment comment-firstinday  comment-firstbyuser  comment-text ">\
  <div class="date-container">\
    <span class="date date-to-be-updated date-notime" value="' + comment.timepoint + '">' + data.timestamp.toLocaleDateString() + ' at ' + data.timestamp.toLocaleTimeString() + '</span>\
    <div class="date-container-border-wrap"></div>\
  </div>\
  <div class="comment-wrap">\
    <div class="visual">\
      <div class="x-user-avatar ua-' + data.commentAuthor.uid + '"><img src="/avatars/' + data.commentAuthor.avatar + '" width="28" height="28"></div>\
    </div>\
    <div class="details">\
      <div class="change-wrapper ">\
        <span class="text-comment-author-wrap">\
          <a class="author stream-user-id ua-' + data.commentAuthor.uid + '">' + data.commentAuthor.fullName + '</a>\
          <!--<a class="action-comment-reply">Reply</a>-->\
        </span>\
        <div class="changes-item">\
          <span class="text-entry" data-entrytype="comment" data-entryid="' + comment.id + '">\
            ' + comment.comment.text + '\
          </span>\
        </div>\
      </div>\
    </div>\
  </div>\
</div>';
    return commentHtml;
  }

  function renderMentionsDropdown() {
    var mentionsHtml = 'Mentions (' + mentionsCount.total + ') ' + 
          '<div class="count' + ((mentionsCount.unread === 0) ? ' hidden' : '') + '">' + mentionsCount.unread + '</div>';
    if (typeof $mentionsDropdown === 'undefined') {
      $mentionsDropdown = $(/*jshint multistr: true */ '\
<span class="wspace_header_mentions wspace_header_userLink hasmenu x-btn-noicon" style="width: auto;">\
  <span class="mentions">' + mentionsHtml + '</span>\
</span>\
      ');

      $mentionsDropdown.click(function () {
        $mentionsPanel.toggle();
        mentionsCount.unread = 0;
        renderMentionsDropdown();
      });

      $('.wrike_header_links').prepend($mentionsDropdown);
    } else {
      $mentionsDropdown.find('.mentions').html(mentionsHtml);
    }
  }

  styles.addStyle('mentions', /*jshint multistr: true */ '\
    .wspace_header_mentions .count {\
      display: inline-block;\
      background: red;\
      line-height: 16px;\
      background-color: #dc0d17;\
      background-image: -webkit-gradient(linear, center top, center bottom, from(#fa3c45), to(#dc0d17));\
      background-image: -webkit-linear-gradient(#fa3c45, #dc0d17);\
      color: #fff;\
      min-height: 13px;\
      padding: 1px 5px;\
      text-shadow: 0 -1px 0 rgba(0, 0, 0, .4);\
      -webkit-border-radius: 2px;\
      -webkit-box-shadow: 0 1px 1px rgba(0, 0, 0, .7);\
      margin-left: 8px;\
    }\
    .wspace_header_mentions .count.hidden { display: none; }\
  ');

  renderPanel();
  getStream();

  return {
    mentions: mentions,
  };
});
