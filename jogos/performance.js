(function () {
  'use strict';
  var nav = window.navigator || {};
  var connection = nav.connection || nav.mozConnection || nav.webkitConnection || {};
  var mobile = window.matchMedia && window.matchMedia('(max-width: 700px)').matches;
  var android = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent || '');
  var slowConnection = !!connection.saveData || /^(slow-2g|2g)$/i.test(connection.effectiveType || '');
  if (!(mobile || android || slowConnection)) return;

  document.documentElement.classList.add('ax-low-performance');
  var css = document.createElement('style');
  css.id = 'ax-low-performance-style';
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
  `;
  (document.head || document.documentElement).appendChild(css);

  if (/tesouro-pirata\.html$/i.test(location.pathname)) {
    var removeBadSpinMode = function () {
      var game = document.querySelector('.casino');
      if (game && game.classList.contains('perf-spin')) game.classList.remove('perf-spin');
    };
    removeBadSpinMode();
    var observer = new MutationObserver(removeBadSpinMode);
    observer.observe(document.documentElement, {subtree:true, attributes:true, attributeFilter:['class']});
  }

  if (/roleta-cassino\.html$/i.test(location.pathname)) {
    var rouletteFix = function () {
      var style = document.createElement('style');
      style.id = 'ax-roleta-cassino-fix';
      style.textContent = `
        .ficha-aposta{width:25px!important;min-width:25px!important;height:25px!important;padding:0!important;border-radius:50%!important;border:2px solid #fff!important;background:repeating-conic-gradient(from 0deg,#b51e25 0deg 12deg,#fff 12deg 24deg)!important;color:#111!important;box-shadow:0 1px 4px #000,inset 0 0 0 2px #b51e25!important}
        .ficha-aposta::before{content:""!important;position:absolute!important;inset:4px!important;border-radius:50%!important;background:radial-gradient(circle at 35% 30%,#fff,#e9e9e9 55%,#aaa 100%)!important;border:1px solid #555!important;z-index:-1!important}
        .ficha-aposta::after{content:""!important;position:absolute!important;inset:7px!important;border-radius:50%!important;border:1px dashed #b51e25!important}
      `;
      document.head.appendChild(style);
      document.querySelectorAll('.faixa').forEach(function (botao) {
        botao.addEventListener('pointerdown', function(e){e.preventDefault();e.stopPropagation();}, true);
        botao.addEventListener('touchstart', function(e){e.preventDefault();e.stopPropagation();}, {passive:false,capture:true});
        botao.addEventListener('click', function(e){
          e.preventDefault();e.stopPropagation();
          if (typeof fazerAposta === 'function') fazerAposta(botao.dataset.bet, botao);
        }, true);
      });
    };
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',rouletteFix); else rouletteFix();
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
