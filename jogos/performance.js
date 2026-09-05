/* Roleta 2 — corrige somente a parada da única bola original. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const roleta = document.getElementById('roleta');
    const bola = document.getElementById('bola');
    if (!roleta || !bola) return;

    const VOLTAS_BOLA = 12;
    let bolaGirou = false;
    let regraParada = null;

    function anguloResultado() {
      const giroRoleta = parseFloat(
        getComputedStyle(roleta).getPropertyValue('--giro-roleta')
      ) || 0;
      const ajuste = ((giroRoleta % 360) + 360) % 360;
      return (360 - ajuste) % 360;
    }

    function corrigirGiroInicialDaBola() {
      const giroAtual = parseFloat(
        getComputedStyle(bola).getPropertyValue('--giro-bola')
      );
      if (!Number.isFinite(giroAtual)) return;

      const angulo = anguloResultado();
      const giroCorreto = VOLTAS_BOLA * 360 - angulo;
      if (Math.abs(giroAtual - giroCorreto) < 0.001) return;

      bola.style.setProperty('--giro-bola', giroCorreto + 'deg');
    }

    function travarPosicaoFinal() {
      if (!bolaGirou) return;

      const angulo = anguloResultado();
      const raio = Math.abs(parseFloat(
        getComputedStyle(bola).getPropertyValue('--raio-bola')
      ) || 220);

      if (regraParada) regraParada.remove();
      regraParada = document.createElement('style');
      regraParada.textContent =
        `.bola:not(.girando-premium){transform:translate(-50%,-50%) rotate(${angulo}deg) translateY(-${raio}px)!important}`;
      document.head.appendChild(regraParada);
    }

    const observador = new MutationObserver(function (mutacoes) {
      let comecou = false;
      let parou = false;

      for (const mutacao of mutacoes) {
        if (mutacao.type !== 'attributes') continue;
        if (mutacao.target !== bola) continue;

        if (mutacao.attributeName === 'class') {
          if (bola.classList.contains('girando-premium')) {
            bolaGirou = true;
            comecou = true;
          } else if (bolaGirou) {
            parou = true;
          }
        }
      }

      if (comecou) corrigirGiroInicialDaBola();
      if (parou) travarPosicaoFinal();
    });

    observador.observe(bola, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Remove somente o ponteiro amarelo da Roleta 2.
    const estiloPonteiro = document.createElement('style');
    estiloPonteiro.textContent = '.roleta-area::before{display:none!important}';
    document.head.appendChild(estiloPonteiro);
  });
})();
