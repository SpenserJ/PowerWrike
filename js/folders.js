define(['js/debug'], function (debug) {
  function getSubfolders(path) {
    var parentFolderId = $w.folders.findBy(function(test) {
      return test.data.titlePath === path;
    }, null, null);
    var parentFolder = $w.folders.getAt(parentFolderId);
    if (typeof parentFolder === 'undefined') { return false; }

    var folders = $w.folders.getChildren(parentFolder);

    $.each(folders, function (i, val) {
      val.powerWrike = {
        uniquePath: $w.folders.getUniquePath(val),
        colorClass: 'no-color',
      };

      if (val.data.metaData !== null && val.data.metaData !== '') {
        var metadata = $.parseJSON(val.data.metaData);

        // Handle buggy folders
        if (metadata === null) {
          debug.warn('Failed to parse folder metadata', val);
          return;
        }

        if (typeof metadata.iconCls !== 'undefined') {
          val.powerWrike.colorClass = metadata.iconCls.replace('w3-custom-node-', '');
        }
      }
    });

    return folders;
  }

  return {
    getSubfolders: getSubfolders
  };
});
