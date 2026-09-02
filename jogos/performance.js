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

  if (/roleta-cassino\.html$/i.test(location.pathname)) {
    var rouletteCss = document.createElement('style');
    rouletteCss.id = 'ax-roleta-ficha-style';
    rouletteCss.textContent = `
      .ficha-aposta{
        width:25px!important;
        height:25px!important;
        min-width:25px!important;
        padding:0!important;
        border-radius:50%!important;
        border:2px solid #fff!important;
        background:repeating-conic-gradient(from 0deg,#b51e25 0deg 12deg,#fff 12deg 24deg)!important;
        color:#111!important;
        box-shadow:0 1px 4px #000,inset 0 0 0 2px #b51e25!important;
        position:absolute!important;
        right:2px!important;
        bottom:2px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        z-index:20!important;
        pointer-events:none!important;
      }
      .ficha-aposta::before{
        content:"";
        position:absolute;
        inset:4px;
        border-radius:50%;
        background:radial-gradient(circle at 35% 30%,#fff,#e9e9e9 55%,#aaa 100%);
        border:1px solid #555;
        z-index:-1;
      }
      .ficha-aposta::after{
        content:"";
        position:absolute;
        inset:7px;
        border-radius:50%;
        border:1px dashed #b51e25;
      }
      @media(max-width:600px){
        .ficha-aposta{width:21px!important;height:21px!important;min-width:21px!important;right:1px!important;bottom:1px!important}
      }
    `;
    (document.head || document.documentElement).appendChild(rouletteCss);

    // Bloqueia navegação/ação padrão nas faixas, mas deixa o onclick da roleta executar.
    document.addEventListener('click', function(event){
      var faixa = event.target && event.target.closest ? event.target.closest('.faixa') : null;
      if (faixa) event.preventDefault();
    }, true);
  }

  if (/tesouro-pirata\.html$/i.test(location.pathname)) {
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
