(function () {
  'use strict';

  var path = location.pathname || '';
  if (!/\/roleta2\.html$/i.test(path)) return;

  function instalar() {
    var roda = document.getElementById('roleta');
    var bola = document.getElementById('bola');
    if (!roda || !bola || roda.dataset.axRealSpin === '1') return;
    roda.dataset.axRealSpin = '1';

    var animacoes = [];
    var timer = null;
    var ultimaChave = null;

    function cancelar() {
      animacoes.forEach(function (a) { try { a.cancel(); } catch (e) {} });
      animacoes = [];
      if (timer) { clearTimeout(timer); timer = null; }
    }

    function numeroCss(el, nome, padrao) {
      var n = parseFloat(getComputedStyle(el).getPropertyValue(nome));
      return Number.isFinite(n) ? n : padrao;
    }

    function iniciar() {
      if (!roda.classList.contains('girando-premium')) return;

      var inicioR = numeroCss(roda, '--inicio-roleta', 0);
      var giroR = numeroCss(roda, '--giro-roleta', 2160);
      var inicioB = numeroCss(bola, '--inicio-bola', 0);
      var giroB = numeroCss(bola, '--giro-bola', 3240);
      var raio = window.innerWidth <= 650 ? 125 : 188;
      var chave = [inicioR, giroR, inicioB, giroB].join('|');

      if (chave === ultimaChave && animacoes.length) return;
      ultimaChave = chave;
      cancelar();

      roda.getAnimations().forEach(function (a) { try { a.cancel(); } catch (e) {} });
      bola.getAnimations().forEach(function (a) { try { a.cancel(); } catch (e) {} });

      roda.style.animation = 'none';
      bola.style.animation = 'none';
      roda.style.transform = 'rotate(' + inicioR + 'deg)';
      bola.style.transform = 'translate(-50%,-50%) rotate(' + inicioB + 'deg) translateY(-' + raio + 'px)';
      void roda.offsetWidth;

      var duracao = 7200;

      var ar = roda.animate([
        { transform: 'rotate(' + inicioR + 'deg)', offset: 0 },
        { transform: 'rotate(' + (inicioR + giroR * .14) + 'deg)', offset: .14 },
        { transform: 'rotate(' + (inicioR + giroR * .40) + 'deg)', offset: .40 },
        { transform: 'rotate(' + (inicioR + giroR * .68) + 'deg)', offset: .68 },
        { transform: 'rotate(' + (inicioR + giroR * .86) + 'deg)', offset: .86 },
        { transform: 'rotate(' + (inicioR + giroR * .96) + 'deg)', offset: .96 },
        { transform: 'rotate(' + (inicioR + giroR) + 'deg)', offset: 1 }
      ], { duration: duracao, easing: 'cubic-bezier(.08,.70,.16,1)', fill: 'forwards' });

      var ab = bola.animate([
        { transform: 'translate(-50%,-50%) rotate(' + inicioB + 'deg) translateY(-' + raio + 'px)', offset: 0 },
        { transform: 'translate(-50%,-50%) rotate(' + (inicioB - giroB * .18) + 'deg) translateY(-' + raio + 'px)', offset: .18 },
        { transform: 'translate(-50%,-50%) rotate(' + (inicioB - giroB * .44) + 'deg) translateY(-' + (raio - 5) + 'px)', offset: .44 },
        { transform: 'translate(-50%,-50%) rotate(' + (inicioB - giroB * .68) + 'deg) translateY(-' + (raio - 18) + 'px)', offset: .68 },
        { transform: 'translate(-50%,-50%) rotate(' + (inicioB - giroB * .84) + 'deg) translateY(-' + (raio - 34) + 'px)', offset: .84 },
        { transform: 'translate(-50%,-50%) rotate(' + (inicioB - giroB * .95) + 'deg) translateY(-' + (raio - 47) + 'px)', offset: .95 },
        { transform: 'translate(-50%,-50%) rotate(' + (inicioB - giroB) + 'deg) translateY(-' + (raio - 50) + 'px)', offset: 1 }
      ], { duration: duracao, easing: 'cubic-bezier(.18,.68,.08,1)', fill: 'forwards' });

      animacoes = [ar, ab];

      timer = setTimeout(function () {
        try { ar.cancel(); } catch (e) {}
        try { ab.cancel(); } catch (e) {}
        animacoes = [];
        roda.style.animation = 'none';
        bola.style.animation = 'none';
        roda.style.transform = 'rotate(' + (inicioR + giroR) + 'deg)';
        bola.style.transform = 'translate(-50%,-50%) rotate(0deg) translateY(-' + raio + 'px)';
      }, duracao + 40);
    }

    new MutationObserver(function (mutacoes) {
      mutacoes.forEach(function (m) {
        if (m.attributeName === 'class' && roda.classList.contains('girando-premium')) iniciar();
      });
    }).observe(roda, { attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalar);
  } else {
    instalar();
  }
})();
