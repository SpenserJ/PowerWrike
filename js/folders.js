define(['debug'], function (debug) {
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

      if (val.data.systemFields !== null && val.data.systemFields.iconCls !== null) {
        val.powerWrike.colorClass = val.data.systemFields.iconCls.replace('w3-custom-node-', '');
      }
    });

    return folders;
  }

  return {
    getSubfolders: getSubfolders
  };
});
