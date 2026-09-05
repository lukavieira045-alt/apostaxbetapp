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

        /*
         * A roleta é o elemento pai da bola.
         * Portanto, quando a roda termina girada para o resultado,
         * a bola precisa ficar no ângulo oposto/local correspondente.
         * Nunca força 0°: usa o resultado sorteado pela própria roleta.
         */
        bola.style.transform =
          `translate(-50%,-50%) rotate(${anguloFinal}deg) translateY(-${raio}px)`;
      }, 60);
    });
  });
})();
