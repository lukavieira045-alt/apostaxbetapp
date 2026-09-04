(function () {
  'use strict';
  var nav = window.navigator || {};
  var connection = nav.connection || nav.mozConnection || nav.webkitConnection || {};
  var mobile = window.matchMedia && window.matchMedia('(max-width: 700px)').matches;
  var android = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent || '');
  var slowConnection = !!connection.saveData || /^(slow-2g|2g)$/i.test(connection.effectiveType || '');
  var isRoleta = /\/roleta\.html$/i.test(location.pathname);

  if (isRoleta) document.documentElement.classList.add('ax-premium-layer');

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

    /* APOSTAXBET — ROLETA PROFISSIONAL / VISUAL ONLY */
    html.ax-premium-layer body{
      background:
        radial-gradient(ellipse at 50% 8%,rgba(35,116,77,.24),transparent 28%),
        radial-gradient(ellipse at 50% 55%,rgba(8,55,37,.5),transparent 58%),
        linear-gradient(180deg,#030807 0%,#07110e 48%,#020403 100%) !important;
      color:#f7f5ef;
      font-family:Arial,sans-serif;
    }

    html.ax-premium-layer .topo{
      height:62px!important;
      padding:0 16px!important;
      background:linear-gradient(180deg,#151613,#070807)!important;
      border-bottom:1px solid rgba(212,174,82,.72)!important;
      box-shadow:0 4px 22px rgba(0,0,0,.7),inset 0 -1px rgba(255,255,255,.04)!important;
    }
    html.ax-premium-layer .logo{
      color:#e9c969!important;
      font-size:14px!important;
      letter-spacing:2px!important;
      text-shadow:0 1px 12px rgba(233,201,105,.18)!important;
    }
    html.ax-premium-layer #displaySaldo{
      color:#f3d879!important;
      font-size:17px!important;
      text-shadow:0 0 12px rgba(243,216,121,.18)!important;
    }
    html.ax-premium-layer .saldo-label{color:#8c908b!important;letter-spacing:1.5px}

    html.ax-premium-layer .container{
      max-width:680px!important;
      padding:16px 10px 42px!important;
    }

    html.ax-premium-layer .lobby{
      top:75px!important;
      left:10px!important;
      width:64px!important;
      height:58px!important;
      border:1px solid rgba(219,184,99,.55)!important;
      border-radius:12px!important;
      background:linear-gradient(145deg,#171a18,#070907)!important;
      box-shadow:0 8px 18px rgba(0,0,0,.55),inset 0 1px rgba(255,255,255,.06)!important;
      color:#ddd!important;
    }
    html.ax-premium-layer .lobby-icon{font-size:25px!important}

    html.ax-premium-layer .titulo{
      margin-top:2px!important;
      color:#efd27a!important;
      font-size:16px!important;
      letter-spacing:4px!important;
      text-shadow:0 2px 16px rgba(239,210,122,.16)!important;
    }
    html.ax-premium-layer .subtitulo{
      color:#92968f!important;
      font-size:9px!important;
      letter-spacing:2.5px!important;
      margin:7px 0 14px!important;
    }

    /* Felted table surround: gives the wheel a real casino-table stage. */
    html.ax-premium-layer .roleta-area{
      position:relative!important;
      margin:0 auto 14px!important;
      padding:18px 12px!important;
      min-height:calc(min(92vw,390px) + 36px)!important;
      border:1px solid rgba(215,181,91,.68)!important;
      border-radius:22px!important;
      background:
        radial-gradient(ellipse at center,rgba(28,129,79,.25),transparent 52%),
        linear-gradient(145deg,#0a3826,#06291d 45%,#03150e)!important;
      box-shadow:
        0 18px 35px rgba(0,0,0,.68),
        inset 0 0 0 2px rgba(0,0,0,.35),
        inset 0 0 45px rgba(0,0,0,.45)!important;
      overflow:visible!important;
    }
    html.ax-premium-layer .roleta-area::before{
      content:"";
      position:absolute;
      inset:8px;
      border:1px solid rgba(238,207,122,.22);
      border-radius:17px;
      pointer-events:none;
    }
    html.ax-premium-layer .roleta-area::after{
      content:"APOSTAXBET  •  ROULETTE";
      position:absolute;
      bottom:5px;
      left:0;
      right:0;
      text-align:center;
      color:rgba(235,211,139,.28);
      font-size:7px;
      font-weight:800;
      letter-spacing:3px;
      pointer-events:none;
    }

    html.ax-premium-layer .roleta{
      width:min(88vw,390px)!important;
      height:min(88vw,390px)!important;
      border:8px solid #d3aa4c!important;
      background:
        radial-gradient(circle at 50% 50%,#101c18 0 13%,#030706 14% 22%,transparent 23%),
        radial-gradient(circle,#16241f 0 68%,#060a08 69% 100%)!important;
      box-shadow:
        0 0 0 2px #6b481b,
        0 0 0 5px rgba(240,202,111,.15),
        0 20px 36px rgba(0,0,0,.8),
        inset 0 0 30px #000!important;
    }
    html.ax-premium-layer .roleta::before{
      inset:8px!important;
      border:14px solid #111613!important;
      box-shadow:inset 0 0 12px #000,0 1px 0 rgba(255,255,255,.08)!important;
    }
    html.ax-premium-layer .roleta::after{
      inset:30px!important;
      background:repeating-conic-gradient(from 0deg,rgba(240,202,111,.75) 0deg 1deg,transparent 1deg 18deg)!important;
      opacity:.8;
    }
    html.ax-premium-layer .roleta-inner{
      inset:32px!important;
      background:
        repeating-conic-gradient(#b72b31 0deg 9deg,#101212 9deg 18deg)!important;
      box-shadow:inset 0 0 38px rgba(0,0,0,.95),inset 0 0 8px rgba(239,200,99,.6)!important;
    }

    html.ax-premium-layer .numero{
      color:#fff!important;
      font-weight:900!important;
    }
    html.ax-premium-layer .numero-conteudo{
      color:#fff7db!important;
      text-shadow:0 2px 4px #000,0 0 5px rgba(255,255,255,.22)!important;
    }
    html.ax-premium-layer .numero.perdeu .numero-conteudo{
      color:#ff8a8e!important;
    }
    html.ax-premium-layer .numero.super-bonus .numero-conteudo{
      color:#ffe58a!important;
      text-shadow:0 0 7px #fff,0 0 18px #ffbf38!important;
    }

    html.ax-premium-layer .centro{
      width:88px!important;
      height:88px!important;
      background:radial-gradient(circle at 35% 28%,#30453c,#0a1511 55%,#020403 100%)!important;
      border:4px solid #d7af50!important;
      box-shadow:0 0 0 2px #68481d,0 0 22px rgba(224,187,81,.28),inset 0 0 18px #000!important;
    }
    html.ax-premium-layer .centro strong{color:#f0d071!important;font-size:20px!important}
    html.ax-premium-layer .centro span{color:#a2a39b!important;letter-spacing:2.5px!important}

    html.ax-premium-layer .ponteiro{
      border-top-color:#fff8df!important;
      filter:drop-shadow(0 2px 4px #000) drop-shadow(0 0 9px rgba(255,221,116,.7))!important;
    }
    html.ax-premium-layer .raio{
      background:#ffe9a6!important;
      box-shadow:0 0 5px #fff,0 0 18px #f4c95c!important;
    }

    /* Result + countdown become a compact casino information board. */
    html.ax-premium-layer .resultado{
      min-height:58px!important;
      padding:9px 10px!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      border:1px solid rgba(214,179,88,.25)!important;
      border-radius:12px!important;
      background:linear-gradient(180deg,rgba(17,21,18,.92),rgba(5,8,6,.92))!important;
      color:#f0eee5!important;
      font-size:17px!important;
      letter-spacing:.3px!important;
      box-shadow:inset 0 1px rgba(255,255,255,.04),0 7px 18px rgba(0,0,0,.38)!important;
    }
    html.ax-premium-layer .contagem{
      margin:8px 0 10px!important;
      padding:9px!important;
      border-radius:9px!important;
      background:rgba(6,11,8,.86)!important;
      border:1px solid rgba(216,178,80,.22)!important;
      color:#e6c86f!important;
      text-shadow:none!important;
    }
    html.ax-premium-layer .contagem strong{
      color:#fff!important;
      font-size:22px!important;
      margin-left:4px;
    }

    html.ax-premium-layer .painel{
      padding:17px 14px 15px!important;
      border:1px solid rgba(216,178,80,.55)!important;
      border-radius:15px!important;
      background:linear-gradient(145deg,#151814,#080a09 62%,#050605)!important;
      box-shadow:0 15px 30px rgba(0,0,0,.7),inset 0 1px rgba(255,255,255,.04),inset 0 0 25px rgba(214,178,82,.035)!important;
    }
    html.ax-premium-layer .ficha-area{
      height:55px!important;
      margin-bottom:7px!important;
    }
    html.ax-premium-layer .ficha{
      width:46px!important;
      height:46px!important;
      border:2px solid #f2dfad!important;
      background:radial-gradient(circle at 32% 28%,#fff,#d8d8d8 31%,#8e8e8e 43%,#a6252c 46%,#d9474c 72%,#641317 100%)!important;
      box-shadow:0 5px 14px rgba(0,0,0,.7),inset 0 0 0 2px rgba(255,255,255,.5),inset 0 -5px 8px rgba(0,0,0,.28)!important;
    }
    html.ax-premium-layer .ficha.selecionada{
      transform:scale(1.1)!important;
      outline:2px solid #f0cf70!important;
      outline-offset:3px!important;
      box-shadow:0 0 22px rgba(240,207,112,.38),0 5px 14px rgba(0,0,0,.7)!important;
    }

    html.ax-premium-layer .valores{gap:7px!important;margin-bottom:10px!important}
    html.ax-premium-layer .btn-valor{
      height:43px!important;
      border:1px solid #62532e!important;
      border-radius:8px!important;
      background:linear-gradient(180deg,#171916,#090a09)!important;
      color:#c1c1b9!important;
      font-weight:800!important;
      transition:all .15s ease!important;
    }
    html.ax-premium-layer .btn-valor.ativo{
      color:#ffe28a!important;
      border-color:#d7b452!important;
      background:linear-gradient(180deg,#2c2410,#121007)!important;
      box-shadow:0 0 14px rgba(215,180,82,.2),inset 0 0 12px rgba(215,180,82,.08)!important;
    }

    html.ax-premium-layer .btn-apostar{
      height:57px!important;
      margin-top:9px!important;
      border:1px solid #e0bf63!important;
      border-radius:10px!important;
      background:linear-gradient(180deg,#cda94c,#8b681e)!important;
      color:#171208!important;
      font-size:15px!important;
      font-weight:1000!important;
      letter-spacing:2px!important;
      box-shadow:0 8px 18px rgba(0,0,0,.5),inset 0 1px rgba(255,255,255,.45),0 0 15px rgba(222,187,83,.12)!important;
      text-shadow:0 1px rgba(255,255,255,.22)!important;
    }
    html.ax-premium-layer .btn-apostar:not(:disabled):active{transform:translateY(1px)!important}
    html.ax-premium-layer .btn-apostar:disabled{filter:saturate(.45)!important;opacity:.55!important}

    html.ax-premium-layer .info{
      margin-top:11px!important;
      padding-top:10px!important;
      border-top:1px solid rgba(255,255,255,.07)!important;
      color:#a7aaa3!important;
    }
    html.ax-premium-layer .info strong{color:#e9cb70!important}
    html.ax-premium-layer .mensagem{color:#6f756e!important;letter-spacing:.5px}

    html.ax-premium-layer .repeat-btn,
    html.ax-premium-layer .menu-btn{
      width:50px!important;
      height:50px!important;
      border:1px solid rgba(220,185,98,.55)!important;
      background:linear-gradient(145deg,#191b18,#070807)!important;
      box-shadow:0 7px 18px rgba(0,0,0,.6),inset 0 1px rgba(255,255,255,.05)!important;
    }

    @media(max-width:600px){
      html.ax-premium-layer .container{padding-top:12px!important}
      html.ax-premium-layer .roleta-area{padding:13px 6px!important;border-radius:18px!important}
      html.ax-premium-layer .roleta-area::after{letter-spacing:2px}
      html.ax-premium-layer .resultado{font-size:15px!important}
      html.ax-premium-layer .painel{border-radius:13px!important}
    }
    @media(max-width:360px){
      html.ax-premium-layer .roleta-area{padding:10px 3px!important}
      html.ax-premium-layer .roleta{width:310px!important;height:310px!important}
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
