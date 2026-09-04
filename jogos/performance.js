(function () {
  'use strict';
  var nav = window.navigator || {};
  var connection = nav.connection || nav.mozConnection || nav.webkitConnection || {};
  var mobile = window.matchMedia && window.matchMedia('(max-width: 700px)').matches;
  var android = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent || '');
  var slowConnection = !!connection.saveData || /^(slow-2g|2g)$/i.test(connection.effectiveType || '');
  var path = location.pathname || '';
  var isRoleta = /\/roleta\.html$/i.test(path);
  var isRoletaCassino = /\/roleta-cassino\.html$/i.test(path);

  if (isRoleta || isRoletaCassino) {
    document.documentElement.classList.add('ax-premium-layer');
    var premiumLink = document.createElement('link');
    premiumLink.rel = 'stylesheet';
    premiumLink.href = isRoletaCassino ? 'roleta-cassino-premium.css?v=1' : 'roleta-premium.css?v=1';
    document.head.appendChild(premiumLink);
  }

  var css = document.createElement('style');
  css.id = 'ax-performance-style';
  css.textContent = `
    .ax-low-performance body{animation:none!important;background-attachment:scroll!important}
    .ax-low-performance .luz,.ax-low-performance .particulas,.ax-low-performance .particulas span,
    .ax-low-performance [class*="particle"],.ax-low-performance [class*="partic"],.ax-low-performance [class*="spark"],
    .ax-low-performance [class*="glow"],.ax-low-performance [class*="luz"],.ax-low-performance [class*="light"],
    .ax-low-performance [class*="shine"],.ax-low-performance [class*="confetti"],.ax-low-performance [class*="smoke"]{
      display:none!important;animation:none!important
    }
    .ax-low-performance *,.ax-low-performance *::before,.ax-low-performance *::after{
      text-shadow:none!important;box-shadow:none!important;filter:none!important;-webkit-filter:none!important;
      backdrop-filter:none!important;-webkit-backdrop-filter:none!important
    }
    .ax-low-performance *{animation-iteration-count:1!important}
    .ax-low-performance img{content-visibility:auto}
    .ax-low-performance .raio,.ax-low-performance .superbonus-raio,.ax-low-performance .energia,
    .ax-low-performance #energia,.ax-low-performance #rastro{animation:none!important;filter:none!important;-webkit-filter:none!important;box-shadow:none!important}
    .ax-low-performance .faixa{position:relative!important;user-select:none!important;-webkit-user-select:none!important;-webkit-touch-callout:none!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
  `;
  (document.head || document.documentElement).appendChild(css);

  /* As duas roletas mantêm seus efeitos visuais completos mesmo em celular/2G. */
  if (!isRoleta && !isRoletaCassino && (mobile || android || slowConnection)) {
    document.documentElement.classList.add('ax-low-performance');
  }

  if (/tesouro-pirata\.html$/i.test(path)) {
    var removeBadSpinMode = function () {
      var game = document.querySelector('.casino');
      if (game && game.classList.contains('perf-spin')) game.classList.remove('perf-spin');
    };
    removeBadSpinMode();
    var observer = new MutationObserver(removeBadSpinMode);
    observer.observe(document.documentElement, {subtree:true, attributes:true, attributeFilter:['class']});
  }

  document.addEventListener('visibilitychange', function () {
    document.querySelectorAll('audio').forEach(function (audio) {
      if (document.hidden) {
        if (!audio.paused) { audio.dataset.axWasPlaying='1'; try{audio.pause()}catch(e){} }
      } else if (audio.dataset.axWasPlaying==='1') {
        delete audio.dataset.axWasPlaying;
        try { var p=audio.play(); if(p&&p.catch)p.catch(function(){}); } catch(e){}
      }
    });
  });
})();
