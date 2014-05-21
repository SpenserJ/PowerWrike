define(function () {
  function getSubfolders(path) {
    var parentFolderId = $w.folders.findBy(function(test) {
      return test.data.titlePath === path;
    }, null, null);
    var parentFolder = $w.folders.getAt(parentFolderId);
    var folders = $w.folders.getChildren(parentFolder);

    $.each(folders, function (i, val) {
      val.wrikeHarder = {
        uniquePath: $w.folders.getUniquePath(val),
        colorClass: 'no-color',
      };

      if (val.data.metaData !== null) {
        var metadata = $.parseJSON(val.data.metaData);
        if (typeof metadata.iconCls !== 'undefined') {
          val.wrikeHarder.colorClass = metadata.iconCls.replace('w3-custom-node-', '');
        }
      }
    });

    return folders;
  }

  return {
    getSubfolders: getSubfolders
  };
});
