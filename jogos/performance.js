/* Roleta 2 — corrige somente a parada da bola e remove o ponteiro. */
(function () {
  'use strict';

  function instalar() {
    const estilo = document.createElement('style');
    estilo.textContent = '.roleta-area::before{display:none!important}';
    document.head.appendChild(estilo);

    const bola = document.getElementById('bola');
    const roleta = document.getElementById('roleta');
    if (!bola || !roleta) return;

    let transformFinal = '';
    let travarFinal = false;
    let frameId = 0;

    function pararResetDaBola() {
      if (!transformFinal) return;

      travarFinal = true;
      let frames = 0;

      function manter() {
        if (!travarFinal || !transformFinal || frames++ > 90) {
          travarFinal = false;
          frameId = 0;
          return;
        }

        // O código original tenta resetar a bola alguns milissegundos
        // depois do fim da animação. Mantemos exatamente o último frame
        // para impedir a segunda rotação/salto para outro número.
        bola.style.transform = transformFinal;
        frameId = requestAnimationFrame(manter);
      }

      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(manter);
    }

    // Corrige o sentido final da bola: a roda e a bola giram em sentidos
    // opostos, mas terminam sincronizadas no mesmo bolso selecionado.
    const addOriginal = DOMTokenList.prototype.add;
    DOMTokenList.prototype.add = function (...tokens) {
      if (this === bola.classList && tokens.includes('girando-premium')) {
        const giroRoda = parseFloat(roleta.style.getPropertyValue('--giro-roleta')) || 0;
        const ajuste = ((giroRoda % 360) + 360) % 360;
        const anguloFinal = ((360 - ajuste) % 360 + 360) % 360;
        const giroCorreto = 12 * 360 - anguloFinal;

        bola.style.setProperty('--giro-bola', `${giroCorreto}deg`);
        bola.style.setProperty('--duracao-giro', '7.48s');
        roleta.style.setProperty('--duracao-giro', '7.48s');

        transformFinal = '';
        travarFinal = false;
        if (frameId) {
          cancelAnimationFrame(frameId);
          frameId = 0;
        }
      }

      return addOriginal.apply(this, tokens);
    };

    bola.addEventListener('animationend', function (ev) {
      if (ev.animationName !== 'giroBolaPremium') return;

      // Captura o ponto EXATO em que a bola terminou a animação.
      transformFinal = getComputedStyle(bola).transform;

      // O reset original acontece logo depois dos 7.5s. A partir daqui,
      // congelamos a bola no último frame para ela não sair do número.
      pararResetDaBola();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalar, { once: true });
  } else {
    instalar();
  }
})();
