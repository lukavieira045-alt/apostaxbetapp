/* Roleta 2 — corrige somente a posição final da bola original. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const roleta = document.getElementById('roleta');
    const bola = document.getElementById('bola');
    if (!roleta || !bola) return;

    bola.addEventListener('animationend', function (evento) {
      if (evento.animationName !== 'giroBolaPremium') return;

      setTimeout(function () {
        const giroRoleta = parseFloat(
          getComputedStyle(roleta).getPropertyValue('--giro-roleta')
        ) || 0;

        const ajuste = ((giroRoleta % 360) + 360) % 360;
        const anguloFinal = (360 - ajuste) % 360;
        const raio = Math.abs(parseFloat(
          getComputedStyle(bola).getPropertyValue('--raio-bola')
        ) || 220);

        /* A roleta é o elemento pai da bola. */
        bola.style.transform =
          `translate(-50%,-50%) rotate(${anguloFinal}deg) translateY(-${raio}px)`;
      }, 60);
    });

    /* Remove somente o ponteiro amarelo da Roleta 2. */
    const estilo = document.createElement('style');
    estilo.textContent = '.roleta-area::before{display:none!important}';
    document.head.appendChild(estilo);
  });
})();
