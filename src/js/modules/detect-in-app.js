// Detects whether the page is being viewed inside the app's webview.
// Sets data-in-app="true" on <body> and persists the state in sessionStorage
// so it survives soft navigations within the same session.
(function () {
  var qParams = new URLSearchParams(window.location.search);
  if (qParams.has('inApp') || qParams.get('utm_source') === 'app') {
    document.body.setAttribute('data-in-app', 'true');
    window.sessionStorage.setItem('in-app-web-view', 'true');
  } else if (window.sessionStorage.getItem('in-app-web-view')) {
    document.body.setAttribute('data-in-app', 'true');
  }
})();
