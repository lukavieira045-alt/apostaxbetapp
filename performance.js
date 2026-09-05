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
        .faixa{touch-action:manipulation!important;-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important;-webkit-tap-highlight-color:transparent!important}
        .faixa.vermelho{touch-action:manipulation!important;-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}
        .ficha-aposta{width:25px!important;min-width:25px!important;height:25px!important;padding:0!important;border-radius:50%!important;border:2px solid #fff!important;background:repeating-conic-gradient(from 0deg,#b51e25 0deg 12deg,#fff 12deg 24deg)!important;color:#111!important;box-shadow:0 1px 4px #000,inset 0 0 0 2px #b51e25!important}
        .ficha-aposta::before{content:""!important;position:absolute!important;inset:4px!important;border-radius:50%!important;background:radial-gradient(circle at 35% 30%,#fff,#e9e9e9 55%,#aaa 100%)!important;border:1px solid #555!important;z-index:-1!important}
        .ficha-aposta::after{content:""!important;position:absolute!important;inset:7px!important;border-radius:50%!important;border:1px dashed #b51e25!important}
      `;
      document.head.appendChild(style);

      document.querySelectorAll('.faixa').forEach(function (botao) {
        if (botao.dataset.axRouletteBound === '1') return;
        botao.dataset.axRouletteBound = '1';
        var handled = false;

        botao.addEventListener('pointerdown', function(e){
          handled = false;
          if (e.pointerType === 'mouse') return;
          e.stopPropagation();
        }, true);

        botao.addEventListener('pointerup', function(e){
          if (e.pointerType === 'mouse') return;
          e.preventDefault();
          e.stopPropagation();
          if (handled) return;
          handled = true;
          if (typeof fazerAposta === 'function') fazerAposta(botao.dataset.bet, botao);
          setTimeout(function(){ handled = false; }, 500);
        }, true);

        botao.addEventListener('click', function(e){
          e.preventDefault();
          e.stopPropagation();
          if (handled) return;
          handled = true;
          if (typeof fazerAposta === 'function') fazerAposta(botao.dataset.bet, botao);
          setTimeout(function(){ handled = false; }, 500);
        }, true);
      });
    };
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',rouletteFix); else rouletteFix();
  }

  /*
   * ROLETA 2 — giro físico realista.
   * A roleta gira para frente e a bola percorre a pista no sentido oposto.
   * O código original continua responsável pelo resultado, apostas, saldo e pagamentos;
   * este bloco só assume a animação visual quando a classe girando-premium é ativada.
   */
  if (/roleta2\.html$/i.test(location.pathname)) {
    var roulette2Visual = function () {
      var roda = document.getElementById('roleta');
      var bola = document.getElementById('bola');
      if (!roda || !bola || roda.dataset.axRealSpin === '1') return;
      roda.dataset.axRealSpin = '1';

      var animacoes = [];
      var timerFinal = null;
      var ultimoInicio = null;

      function cancelar() {
        animacoes.forEach(function(a){ try { a.cancel(); } catch(e) {} });
        animacoes = [];
        if (timerFinal) { clearTimeout(timerFinal); timerFinal = null; }
      }

      function numCss(el, nome, fallback) {
        var v = getComputedStyle(el).getPropertyValue(nome).trim();
        var n = parseFloat(v);
        return Number.isFinite(n) ? n : fallback;
      }

      function iniciar() {
        if (!roda.classList.contains('girando-premium')) return;
        var inicioR = numCss(roda, '--inicio-roleta', 0);
        var giroR = numCss(roda, '--giro-roleta', 2160);
        var inicioB = numCss(bola, '--inicio-bola', 0);
        var giroB = numCss(bola, '--giro-bola', 3240);
        var raio = Math.abs(numCss(bola, '--raio-bola', window.innerWidth <= 650 ? -125 : -188));
        if (ultimoInicio === inicioR && animacoes.length) return;
        ultimoInicio = inicioR;

        cancelar();
        roda.getAnimations().forEach(function(a){ try { a.cancel(); } catch(e) {} });
        bola.getAnimations().forEach(function(a){ try { a.cancel(); } catch(e) {} });

        roda.style.animation = 'none';
        bola.style.animation = 'none';
        roda.style.transform = 'rotate(' + inicioR + 'deg)';
        bola.style.transform = 'translate(-50%,-50%) rotate(' + inicioB + 'deg) translateY(-' + raio + 'px)';
        void roda.offsetWidth;

        var dur = 7200;
        var easingR = 'cubic-bezier(.08,.70,.16,1)';
        var easingB = 'cubic-bezier(.16,.68,.10,1)';

        var ar = roda.animate([
          {transform:'rotate(' + inicioR + 'deg)', offset:0},
          {transform:'rotate(' + (inicioR + giroR*.18) + 'deg)', offset:.18},
          {transform:'rotate(' + (inicioR + giroR*.48) + 'deg)', offset:.48},
          {transform:'rotate(' + (inicioR + giroR*.74) + 'deg)', offset:.74},
          {transform:'rotate(' + (inicioR + giroR*.90) + 'deg)', offset:.90},
          {transform:'rotate(' + (inicioR + giroR*.975) + 'deg)', offset:.975},
          {transform:'rotate(' + (inicioR + giroR) + 'deg)', offset:1}
        ], {duration:dur, easing:easingR, fill:'forwards'});

        var ab = bola.animate([
          {transform:'translate(-50%,-50%) rotate(' + inicioB + 'deg) translateY(-' + raio + 'px)', offset:0},
          {transform:'translate(-50%,-50%) rotate(' + (inicioB - giroB*.16) + 'deg) translateY(-' + raio + 'px)', offset:.16},
          {transform:'translate(-50%,-50%) rotate(' + (inicioB - giroB*.43) + 'deg) translateY(-' + raio + 'px)', offset:.43},
          {transform:'translate(-50%,-50%) rotate(' + (inicioB - giroB*.68) + 'deg) translateY(-' + raio + 'px)', offset:.68},
          {transform:'translate(-50%,-50%) rotate(' + (inicioB - giroB*.86) + 'deg) translateY(-' + raio + 'px)', offset:.86},
          {transform:'translate(-50%,-50%) rotate(' + (inicioB - giroB*.955) + 'deg) translateY(-' + raio + 'px)', offset:.955},
          {transform:'translate(-50%,-50%) rotate(' + (inicioB - giroB) + 'deg) translateY(-' + raio + 'px)', offset:1}
        ], {duration:dur, easing:easingB, fill:'forwards'});

        animacoes = [ar, ab];

        // O script da roleta restaura a bola no ponteiro ao terminar.
        // Reaplicamos esse estado depois dos 7,2 s para impedir o salto visual.
        timerFinal = setTimeout(function(){
          try { ar.cancel(); } catch(e) {}
          try { ab.cancel(); } catch(e) {}
          animacoes = [];
          roda.style.animation = 'none';
          bola.style.animation = 'none';
          var rf = numCss(roda, '--inicio-roleta', 0) + numCss(roda, '--giro-roleta', 2160);
          roda.style.transform = 'rotate(' + (rf % 360) + 'deg)';
          bola.style.transform = 'translate(-50%,-50%) rotate(0deg) translateY(-' + raio + 'px)';
        }, dur + 25);
      }

      var observer = new MutationObserver(function(mutations){
        mutations.forEach(function(m){
          if (m.type === 'attributes' && m.attributeName === 'class' && roda.classList.contains('girando-premium')) iniciar();
        });
      });
      observer.observe(roda, {attributes:true, attributeFilter:['class']});
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', roulette2Visual); else roulette2Visual();
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
