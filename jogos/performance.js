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
    let travarReset = false;
    let liberacaoTimer = null;

    // O HTML antigo calcula a bola com +anguloFinal, mas o CSS já aplica
    // -giro-bola. Corrigimos o valor no instante em que a animação começa.
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

        travarReset = false;
        transformFinal = '';
        if (liberacaoTimer) clearTimeout(liberacaoTimer);
      }
      return addOriginal.apply(this, tokens);
    };

    // A animação da bola termina antes do timeout de 7.5s do jogo.
    // Capturamos o transform REAL do último frame e bloqueamos o reset
    // posterior que fazia a bola sair do número em que havia parado.
    bola.addEventListener('animationend', function (ev) {
      if (ev.animationName !== 'giroBolaPremium') return;

      transformFinal = getComputedStyle(bola).transform;
      travarReset = true;

      // Se o navegador ainda precisar remover a animação, o transform
      // capturado permanece exatamente no mesmo ponto visual.
      liberacaoTimer = setTimeout(function () {
        travarReset = false;
      }, 1200);
    });

    // O código original faz bola.style.transform = ... depois de 7.5s.
    // Interceptamos apenas esse reset enquanto a rodada está travada.
    const proto = CSSStyleDeclaration.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'transform');
    if (desc && desc.set && desc.get) {
      Object.defineProperty(proto, 'transform', {
        configurable: true,
        enumerable: desc.enumerable,
        get: desc.get,
        set: function (valor) {
          if (this === bola.style && travarReset && transformFinal) {
            return desc.set.call(this, transformFinal);
          }
          return desc.set.call(this, valor);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalar, { once: true });
  } else {
    instalar();
  }
})();
