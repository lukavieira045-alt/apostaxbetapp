/* Roleta 2 — corrige somente a posição final da bola. */
(function () {
  'use strict';

  function corrigirPosicaoFinal() {
    const roleta = document.getElementById('roleta');
    const bola = document.getElementById('bola');
    if (!roleta || !bola) return;

    const giro = parseFloat(getComputedStyle(roleta).getPropertyValue('--giro-roleta')) || 0;
    const ajuste = ((giro % 360) + 360) % 360;
    const anguloFinal = (360 - ajuste) % 360;
    const raio = parseFloat(getComputedStyle(bola).getPropertyValue('--raio-bola')) || 220;

    bola.style.transform = `translate(-50%,-50%) rotate(${anguloFinal}deg) translateY(-${raio}px)`;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const roleta = document.getElementById('roleta');
    if (!roleta) return;

    roleta.addEventListener('animationend', function (evento) {
      if (evento.animationName !== 'giroRoletaPremium') return;
      setTimeout(corrigirPosicaoFinal, 30);
    });
  });
})();
