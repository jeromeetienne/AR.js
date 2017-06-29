function renderNoembed(event) {
  var iframes         = document.querySelectorAll('.noembed-wrapper');
  var loaded          = 0;
  var total           = iframes.length;
  var externalScripts = [];

  function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
    var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

    return {width: (srcWidth * ratio) | 0, height: (srcHeight * ratio) | 0};
  }

  function ajaxReq(url, callback) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
      if (req.readyState === XMLHttpRequest.DONE) {
        if (req.status === 200) {
          callback(JSON.parse(req.responseText));
        }
      }
    };

    req.open('GET', url, true);
    req.send();
    return req;
  }

  function checkForScripts(html) {
    var tempElement = document.createElement('div');
    tempElement.innerHTML = html;

    var scripts = tempElement.querySelectorAll('script');

    if (scripts.length) {
      for (var i = 0; i < scripts.length; i++) {
        if (externalScripts.indexOf(scripts[i].src) < 0) {
          externalScripts.push(scripts[i].src);
          scripts[i].parentElement.removeChild(scripts[i]);
        }
      }
    }

    return tempElement;
  }

  function getVideoData(url, wrapper) {
    if (!!url.length) {
      ajaxReq(url, function(res) {
        var safeHtml = '';

        if (res.html) {
          safeHtml = checkForScripts(res.html);

          if (res.type === 'video' && res.hasOwnProperty('width') && res.hasOwnProperty('height')) {
            var dims = calculateAspectRatioFit(res.width, res.height, wrapper.clientWidth, 9999);
            wrapper.classList.add('noembed-type-video');
            wrapper.style.width = dims.width + 'px';
            wrapper.style.height = dims.height + 'px';
          }

        } else {
          safeHtml = document.createElement('a');
          safeHtml.href = res.url;
          safeHtml.innerText = res.url;
        }

        wrapper.innerHTML = '';
        wrapper.appendChild(safeHtml);

        loaded++;

        if (loaded === total) {
          externalScripts.forEach(function(script) {
            var newScript = document.createElement('script');
            newScript.src = script;
            document.body.appendChild(newScript);
          });
        }
      });
    }
  }

  for (var i = 0; i < iframes.length; i++) {
    var wrapper = iframes[i];
    var url     = wrapper.dataset.url;

    getVideoData(url, wrapper);
  }
}

require(['gitbook'], function(gitbook) {
  gitbook.events.on('page.change', renderNoembed);
});
