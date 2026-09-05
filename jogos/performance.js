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

  /* =========================================================
     ROULETA 2 PRO — roda e bola como uma roleta fisica
     ========================================================= */
  var isRoleta2 = /\/roleta2\.html$/i.test(path);
  if (isRoleta2) {
    var pro = document.createElement('style');
    pro.id = 'ax-roleta2-pro';
    pro.textContent = `
      /* O rotor gira em um sentido e a bola no sentido contrario. */
      @keyframes giroRoletaPremium{
        0%{transform:rotate(var(--inicio-roleta,0deg));}
        55%{transform:rotate(calc(var(--inicio-roleta,0deg) + var(--giro-roleta,0deg) * .70));}
        82%{transform:rotate(calc(var(--inicio-roleta,0deg) + var(--giro-roleta,0deg) * .91));}
        94%{transform:rotate(calc(var(--inicio-roleta,0deg) + var(--giro-roleta,0deg) * .985));}
        100%{transform:rotate(calc(var(--inicio-roleta,0deg) + var(--giro-roleta,0deg)));}
      }
      @keyframes giroBolaPremium{
        0%{transform:translate(-50%,-50%) rotate(var(--inicio-bola,0deg)) translateY(var(--pro-raio-bola,-238px));}
        45%{transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola,0deg) * .55)) translateY(var(--pro-raio-bola,-238px));}
        72%{transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola,0deg) * .79)) translateY(var(--pro-raio-bola,-238px));}
        90%{transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola,0deg) * .94)) translateY(var(--pro-raio-bola,-238px));}
        100%{transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola,0deg))) translateY(var(--pro-raio-bola,-238px));}
      }

      .roleta.girando-premium{
        animation-name:giroRoletaPremium!important;
        animation-duration:7.2s!important;
        animation-timing-function:cubic-bezier(.12,.66,.16,1)!important;
        animation-iteration-count:1!important;
        animation-fill-mode:forwards!important;
      }
      .bola.girando-premium{
        --pro-raio-bola:-238px;
        animation-name:giroBolaPremium!important;
        animation-duration:7.2s!important;
        animation-timing-function:cubic-bezier(.16,.62,.12,1)!important;
        animation-iteration-count:1!important;
        animation-fill-mode:forwards!important;
      }

      /* Aparencia de roleta fisica: bowl de madeira, aro de latao e fretes dourados. */
      .roleta{
        border:18px solid #2a1809!important;
        background:radial-gradient(circle at 42% 38%,rgba(255,230,164,.2),transparent 16%),radial-gradient(circle at 50% 55%,#87501a 0%,#4a260b 57%,#1a0b03 100%)!important;
        box-shadow:0 0 0 3px #e0ae4d,0 0 0 7px #5b3713,0 0 0 10px rgba(255,224,138,.16),0 22px 58px rgba(0,0,0,.88),inset 0 0 35px #000!important;
      }
      .roleta::before{
        inset:14px!important;
        background:repeating-conic-gradient(from -4.8649deg,rgba(249,215,129,.95) 0deg .82deg,transparent .82deg 9.729729deg),conic-gradient(#078b45 0deg 9.729729deg,#c92b24 9.729729deg 19.459458deg,#070808 19.459458deg 29.189187deg,#c92b24 29.189187deg 38.918916deg,#070808 38.918916deg 48.648645deg,#c92b24 48.648645deg 58.378374deg,#070808 58.378374deg 68.108103deg,#c92b24 68.108103deg 77.837832deg,#070808 77.837832deg 87.567561deg,#c92b24 87.567561deg 97.29729deg,#070808 97.29729deg 107.027019deg,#c92b24 107.027019deg 116.756748deg,#070808 116.756748deg 126.486477deg,#c92b24 126.486477deg 136.216206deg,#070808 136.216206deg 145.945935deg,#c92b24 145.945935deg 155.675664deg,#070808 155.675664deg 165.405393deg,#c92b24 165.405393deg 175.135122deg,#070808 175.135122deg 184.864851deg,#c92b24 184.864851deg 194.59458deg,#070808 194.59458deg 204.324309deg,#c92b24 204.324309deg 214.054038deg,#070808 214.054038deg 223.783767deg,#c92b24 223.783767deg 233.513496deg,#070808 233.513496deg 243.243225deg,#c92b24 243.243225deg 252.972954deg,#070808 252.972954deg 262.702683deg,#c92b24 262.702683deg 272.432412deg,#070808 272.432412deg 282.162141deg,#c92b24 282.162141deg 291.89187deg,#070808 291.89187deg 301.621599deg,#c92b24 301.621599deg 311.351328deg,#070808 311.351328deg 321.081057deg,#c92b24 321.081057deg 330.810786deg,#070808 330.810786deg 340.540515deg,#c92b24 340.540515deg 350.270244deg,#078b45 350.270244deg 360deg)!important;
        box-shadow:inset 0 0 30px #000,inset 0 0 9px rgba(255,255,255,.18),0 0 0 2px rgba(255,224,138,.22)!important;
      }
      .roleta::after{
        inset:5px!important;
        border:3px solid rgba(255,230,170,.45)!important;
        box-shadow:inset 0 0 20px #000,0 0 0 2px rgba(0,0,0,.5)!important;
      }
      .numero-roleta::before{
        content:""!important;
        position:absolute!important;
        inset:32px!important;
        border-radius:50%!important;
        border:3px solid rgba(245,205,119,.5)!important;
        box-shadow:0 0 0 5px rgba(34,17,5,.72),inset 0 0 20px rgba(0,0,0,.72)!important;
        pointer-events:none!important;
        z-index:1!important;
      }
      .numero-roleta::after{
        content:""!important;
        position:absolute!important;
        inset:55px!important;
        border-radius:50%!important;
        border:1px solid rgba(255,220,130,.24)!important;
        pointer-events:none!important;
        z-index:1!important;
      }
      .numero-roleta span{
        font-family:Georgia,"Times New Roman",serif!important;
        font-size:15px!important;
        font-weight:900!important;
        color:#fff!important;
        text-shadow:0 2px 3px #000,0 0 5px #000!important;
      }
      .roleta-centro{
        width:136px!important;
        height:136px!important;
        border:8px solid #b97918!important;
        background:radial-gradient(circle at 34% 24%,#fff7ca 0%,#efc15f 18%,#b87818 43%,#683906 70%,#1b0b02 100%)!important;
        box-shadow:inset 0 0 18px #3b1c00,inset 0 0 3px rgba(255,255,255,.55),0 0 0 4px #e2b65b,0 0 0 7px #56310b,0 0 25px rgba(0,0,0,.9)!important;
      }
      .roleta-centro::before{
        content:""!important;
        position:absolute!important;
        left:50%!important;top:50%!important;
        width:34px!important;height:34px!important;
        transform:translate(-50%,-50%)!important;
        border-radius:50%!important;
        border:4px solid #f4cf73!important;
        box-shadow:inset 0 0 8px #4a2606,0 2px 5px #000!important;
      }
      .roleta-centro::after{
        content:"A"!important;
        font-size:42px!important;
        color:#fff4c4!important;
        text-shadow:0 2px 6px #000,0 0 10px rgba(255,218,120,.3)!important;
      }
      .bola{
        width:20px!important;height:20px!important;
        background:radial-gradient(circle at 30% 25%,#fff 0%,#fff 34%,#e3e3e3 65%,#aaa 100%)!important;
        box-shadow:0 0 7px #fff,0 0 16px rgba(255,255,255,.95),0 0 28px rgba(255,255,255,.6),inset -2px -2px 3px rgba(0,0,0,.35)!important;
      }
      @media(max-width:650px){
        .roleta{width:84vw!important;border-width:12px!important}
        .roleta-centro{width:90px!important;height:90px!important}
        .roleta-centro::after{font-size:30px!important}
        .numero-roleta span{font-size:11px!important;width:28px!important;height:28px!important;margin-left:-14px!important;margin-top:-14px!important}
        .bola{width:16px!important;height:16px!important;--pro-raio-bola:-165px!important}
        .roleta-area::before{top:calc(50% - 235px)!important}
      }
    `;
    (document.head || document.documentElement).appendChild(pro);

    /* Corrige tambem o raio literal usado pelo JS ao remover a animacao, sem tocar no resultado. */
    var ballObserver = new MutationObserver(function () {
      var ball = document.querySelector('.bola');
      if (!ball || ball.classList.contains('girando-premium')) return;
      var t = ball.style.transform || '';
      if (window.innerWidth <= 650) {
        if (t.indexOf('translateY(-125px)') !== -1) ball.style.transform = t.replace('translateY(-125px)','translateY(-165px)');
      } else if (t.indexOf('translateY(-188px)') !== -1) {
        ball.style.transform = t.replace('translateY(-188px)','translateY(-238px)');
      }
    });
    ballObserver.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['style','class']});
  }
})();
