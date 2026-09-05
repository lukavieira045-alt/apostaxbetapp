/* Roleta 2 — controla somente a física visual da única bola original. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const roleta = document.getElementById('roleta');
    const bola = document.getElementById('bola');
    if (!roleta || !bola) return;

    const VOLTAS_BOLA = 12;
    let bolaJaGirou = false;
    let corrigindo = false;

    function anguloDoResultado() {
      const giroRoleta = parseFloat(
        getComputedStyle(roleta).getPropertyValue('--giro-roleta')
      ) || 0;

      const ajuste = ((giroRoleta % 360) + 360) % 360;
      return (360 - ajuste) % 360;
    }

    function corrigirGiroDaBola() {
      const original = parseFloat(
        getComputedStyle(bola).getPropertyValue('--giro-bola')
      );
      if (!Number.isFinite(original)) return;

      const anguloFinal = anguloDoResultado();
      const giroCorreto = VOLTAS_BOLA * 360 - anguloFinal;

      if (Math.abs(original - giroCorreto) < 0.001) return;

      corrigindo = true;
      bola.style.setProperty('--giro-bola', `${giroCorreto}deg`);
      corrigindo = false;
    }

    function manterBolaNaCasaFinal() {
      if (!bolaJaGirou) return;

      const anguloFinal = anguloDoResultado();
      const raio = Math.abs(parseFloat(
        getComputedStyle(bola).getPropertyValue('--raio-bola')
      ) || 220);

      const transformFinal =
        `translate(-50%,-50%) rotate(${anguloFinal}deg) translateY(-${raio}px)`;

      if (bola.style.transform === transformFinal) return;

      corrigindo = true;
      bola.style.transform = transformFinal;
      corrigindo = false;
    }

    const observador = new MutationObserver(function (mutacoes) {
      if (corrigindo) return;

      let corrigirGiro = false;
      let verificarParada = false;

      mutacoes.forEach(function (mutacao) {
        if (mutacao.type !== 'attributes') return;

        if (mutacao.attributeName === 'style') {
          const style = bola.getAttribute('style') || '';
          if (style.includes('--giro-bola')) corrigirGiro = true;
          if (bolaJaGirou && style.includes('rotate(0deg)')) {
            verificarParada = true;
          }
        }

        if (mutacao.attributeName === 'class') {
          if (bola.classList.contains('girando-premium')) {
            bolaJaGirou = true;
            corrigirGiro = true;
          } else if (bolaJaGirou) {
            verificarParada = true;
          }
        }
      });

      if (corrigirGiro) corrigirGiroDaBola();
      if (verificarParada) manterBolaNaCasaFinal();
    });

    observador.observe(bola, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    observador.observe(roleta, {
      attributes: true,
      attributeFilter: ['style']
    });

    // Remove somente o ponteiro amarelo da Roleta 2.
    const estilo = document.createElement('style');
    estilo.textContent = '.roleta-area::before{display:none!important}';
    document.head.appendChild(estilo);
  });
})();
