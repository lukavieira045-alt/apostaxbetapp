(function () {
  'use strict';
  var nav = window.navigator || {};
  var connection = nav.connection || nav.mozConnection || nav.webkitConnection || {};
  var mobile = window.matchMedia && window.matchMedia('(max-width: 700px)').matches;
  var android = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent || '');
  var slowConnection = !!connection.saveData || /^(slow-2g|2g)$/i.test(connection.effectiveType || '');
  if (!(mobile || android || slowConnection)) return;

  /* Guarda de CPU: limita apenas loops de animação muito rápidos.
     Não altera apostas, resultados, saldo, depósitos, saques ou pagamentos. */
  var nativeSetInterval = window.setInterval.bind(window);
  var nativeClearInterval = window.clearInterval.bind(window);
  var intervalMap = new Map();
  window.setInterval = function (fn, delay) {
    var n = Number(delay);
    if (isFinite(n) && n > 0 && n < 20) n = 33;
    var id = nativeSetInterval(fn, n, ...Array.prototype.slice.call(arguments, 2));
    intervalMap.set(id, id);
    return id;
  };
  window.clearInterval = function (id) {
    intervalMap.delete(id);
    return nativeClearInterval(id);
  };

  /* Se algum jogo usar requestAnimationFrame para efeitos, limita a 30fps no celular. */
  if (typeof window.requestAnimationFrame === 'function') {
    var nativeRAF = window.requestAnimationFrame.bind(window);
    var nativeCancelRAF = window.cancelAnimationFrame ? window.cancelAnimationFrame.bind(window) : function () {};
    var rafTimers = new Map();
    var rafSeq = 1;
    window.requestAnimationFrame = function (callback) {
      var id = rafSeq++;
      var timer = nativeSetInterval(function () {
        nativeClearInterval(timer);
        rafTimers.delete(id);
        nativeRAF(callback);
      }, 33);
      rafTimers.set(id, timer);
      return id;
    };
    window.cancelAnimationFrame = function (id) {
      var timer = rafTimers.get(id);
      if (timer) {
        nativeClearInterval(timer);
        rafTimers.delete(id);
      }
      try { nativeCancelRAF(id); } catch (e) {}
    };
  }

  document.documentElement.classList.add('ax-low-performance');
  var css = document.createElement('style');
  css.id = 'ax-low-performance-style';
  css.textContent = `
    .ax-low-performance body{animation:none!important;background-attachment:scroll!important}
    .ax-low-performance .luz,
    .ax-low-performance .particulas,
    .ax-low-performance .particulas span,
    .ax-low-performance [class*="particle"],
    .ax-low-performance [class*="partic"],
    .ax-low-performance [class*="spark"],
    .ax-low-performance [class*="glow"],
    .ax-low-performance [class*="luz"],
    .ax-low-performance [class*="light"],
    .ax-low-performance [class*="shine"],
    .ax-low-performance [class*="confetti"],
    .ax-low-performance [class*="smoke"]{display:none!important;animation:none!important}
    .ax-low-performance *,
    .ax-low-performance *::before,
    .ax-low-performance *::after{
      text-shadow:none!important;
      box-shadow:none!important;
      filter:none!important;
      -webkit-filter:none!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
    }
    .ax-low-performance *{animation-iteration-count:1!important}
    .ax-low-performance img{content-visibility:auto}
    .ax-low-performance .raio,
    .ax-low-performance .superbonus-raio,
    .ax-low-performance .energia,
    .ax-low-performance #energia,
    .ax-low-performance #rastro{animation:none!important;filter:none!important;-webkit-filter:none!important;box-shadow:none!important}
  `;
  (document.head || document.documentElement).appendChild(css);

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
