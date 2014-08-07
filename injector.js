function script(data) {
  var s = document.createElement('script'),
      keys = Object.keys(data),
      i;
  for (i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (typeof s[key] !== 'undefined') { s[key] = data[key]; }
    else { s.setAttribute(key, data[key]); }
  }
  s.onload = function() { this.parentNode.removeChild(this); };
  (document.body||document.documentElement).appendChild(s);
}

// Give Cajon a base URL to work with
script({ 'innerHTML': 'cajonBaseURL = "' + chrome.extension.getURL('') + '";' });

// Inject Cajon and tell it to load index.js
script({
  'src': chrome.extension.getURL('lib/cajon.js'),
  'data-main': chrome.extension.getURL('index.js')
});
