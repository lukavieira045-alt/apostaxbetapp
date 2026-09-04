(function () {
  'use strict';
  var nav = window.navigator || {};
  var connection = nav.connection || nav.mozConnection || nav.webkitConnection || {};
  var mobile = window.matchMedia && window.matchMedia('(max-width: 700px)').matches;
  var android = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent || '');
  var slowConnection = !!connection.saveData || /^(slow-2g|2g)$/i.test(connection.effectiveType || '');

  document.documentElement.classList.add('ax-premium-layer');

  var css = document.createElement('style');
  css.id = 'ax-performance-style';
  css.textContent = `
    /* Desempenho original */
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

    /* =====================================================
       APOSTAXBET — CAMADA PREMIUM DA ROLETA
       Somente visual. Nenhuma função/resultado/aposta é alterado.
    ===================================================== */
    body.ax-premium-layer .mesa{
      background:
        radial-gradient(circle at 50% 35%,rgba(36,151,91,.20),transparent 35%),
        linear-gradient(145deg,#03150f 0%,#06291d 45%,#020b08 100%) !important;
      border-top:1px solid rgba(216,176,83,.45);
      box-shadow:inset 0 0 80px rgba(0,0,0,.5);
    }

    body.ax-premium-layer .top{
      height:58px !important;
      background:linear-gradient(180deg,#171717,#080808) !important;
      border-bottom:1px solid rgba(218,177,78,.75) !important;
      box-shadow:0 4px 20px rgba(0,0,0,.65);
      letter-spacing:.3px;
    }

    body.ax-premium-layer .top span:first-child{
      font-weight:900;
      color:#f1d78b;
      text-shadow:0 1px 10px rgba(218,177,78,.25);
    }

    body.ax-premium-layer .online{
      color:#69f0a0 !important;
      font-weight:800;
      text-shadow:0 0 10px rgba(105,240,160,.35);
    }

    body.ax-premium-layer .roleta-area{
      filter:drop-shadow(0 16px 24px rgba(0,0,0,.75));
    }

    body.ax-premium-layer .ponteiro{
      border-top-color:#f5d477 !important;
      filter:drop-shadow(0 2px 5px rgba(0,0,0,.9)) drop-shadow(0 0 7px rgba(245,212,119,.35));
    }

    body.ax-premium-layer .roleta{
      border-width:7px !important;
      border-color:#d7a84e !important;
      box-shadow:
        0 0 0 2px #6e4b1d,
        0 0 0 5px rgba(244,207,111,.18),
        0 14px 30px rgba(0,0,0,.8) !important;
    }

    body.ax-premium-layer .centro-roleta{
      box-shadow:0 0 16px rgba(235,193,93,.35),inset 0 0 10px rgba(0,0,0,.7);
    }

    body.ax-premium-layer .numero-roleta{
      color:#fff !important;
      font-weight:900 !important;
      text-shadow:0 2px 4px #000,0 0 3px rgba(0,0,0,.8) !important;
    }

    body.ax-premium-layer .mesa-jogo{
      background:
        linear-gradient(180deg,rgba(11,104,62,.98),rgba(4,59,36,.98)) !important;
      border:3px solid #e2c16b !important;
      box-shadow:
        0 0 0 2px #6b4819,
        0 18px 35px rgba(0,0,0,.72),
        inset 0 0 35px rgba(0,0,0,.24) !important;
      border-radius:10px;
    }

    body.ax-premium-layer .numero,
    body.ax-premium-layer .zero,
    body.ax-premium-layer .faixa{
      transition:transform .16s ease,filter .16s ease,box-shadow .16s ease,border-color .16s ease !important;
    }

    body.ax-premium-layer .numero:hover,
    body.ax-premium-layer .zero:hover,
    body.ax-premium-layer .faixa:hover{
      filter:brightness(1.12) !important;
      box-shadow:inset 0 0 12px rgba(255,255,255,.10),0 0 9px rgba(226,193,107,.22) !important;
      transform:translateY(-1px);
    }

    body.ax-premium-layer .zero{
      background:linear-gradient(145deg,#0b8d4c,#04552d) !important;
      border-color:#e2c16b !important;
      color:#fff !important;
      text-shadow:0 2px 4px #000 !important;
    }

    body.ax-premium-layer .vermelho{
      background:linear-gradient(145deg,#c52b31,#86171c) !important;
    }

    body.ax-premium-layer .preto{
      background:linear-gradient(145deg,#252525,#080808) !important;
    }

    body.ax-premium-layer .faixa{
      background:linear-gradient(145deg,#0b7650,#06452f) !important;
      border-color:rgba(255,255,255,.7) !important;
      color:#fff !important;
      text-shadow:0 1px 3px #000;
    }

    body.ax-premium-layer .faixa.vermelho{
      background:linear-gradient(145deg,#bd2930,#78151b) !important;
    }

    body.ax-premium-layer .controles{
      background:linear-gradient(180deg,#111,#070707) !important;
      border-top:1px solid rgba(218,177,78,.45) !important;
      box-shadow:0 -10px 30px rgba(0,0,0,.35);
    }

    body.ax-premium-layer .linha{
      color:#b9b9b9 !important;
    }

    body.ax-premium-layer .linha b{
      color:#71e9a0 !important;
      text-shadow:0 0 8px rgba(113,233,160,.2);
    }

    body.ax-premium-layer .ficha{
      background:radial-gradient(circle at 35% 30%,#fff,#ddd 38%,#a4a4a4 42%,#7b2026 44%,#c7353b 72%,#681116 100%) !important;
      border-color:#f4dfaa !important;
      box-shadow:0 5px 12px rgba(0,0,0,.65),inset 0 0 0 2px rgba(255,255,255,.55) !important;
      text-shadow:0 1px 2px #000;
    }

    body.ax-premium-layer .ficha.ativa{
      outline:3px solid #f4d66f !important;
      outline-offset:2px;
      box-shadow:0 0 18px rgba(244,214,111,.45),0 5px 12px rgba(0,0,0,.65) !important;
    }

    body.ax-premium-layer #btnGirar{
      background:linear-gradient(180deg,#19a964,#087241) !important;
      border:1px solid #63e9a1 !important;
      box-shadow:0 0 18px rgba(25,169,100,.22),inset 0 1px 0 rgba(255,255,255,.18);
      text-shadow:0 1px 3px #000;
    }

    body.ax-premium-layer #limpar{
      background:linear-gradient(180deg,#242424,#111) !important;
      border-color:#555 !important;
    }

    body.ax-premium-layer #mensagem{
      color:#f0d47b;
      font-weight:700;
    }

    @media(max-width:600px){
      body.ax-premium-layer .mesa-jogo{
        border-radius:8px;
      }
      body.ax-premium-layer .controles{
        padding:13px 10px;
      }
      body.ax-premium-layer .ficha{
        min-width:46px;
        height:46px;
      }
    }
  `;
  (document.head || document.documentElement).appendChild(css);

  if (mobile || android || slowConnection) {
    document.documentElement.classList.add('ax-low-performance');
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
