var s = document.createElement('script');
s.src = chrome.extension.getURL('lib/cajon.js');
s.setAttribute('data-main', chrome.extension.getURL('wrikeharder.js'));
s.onload = function() { this.parentNode.removeChild(this); };
(document.body||document.documentElement).appendChild(s);
