/* Roleta 2 — corrige somente a posição final da bola original. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const roleta = document.getElementById('roleta');
    const bola = document.getElementById('bola');
    if (!roleta || !bola) return;

    function alinharBola() {
      const giroRoleta = parseFloat(
        getComputedStyle(roleta).getPropertyValue('--giro-roleta')
      ) || 0;

      // giroRoleta termina a roda no número sorteado.
      // A bola é filha da roda, então sua rotação local compensa
      // exatamente a rotação final da roda.
      const ajuste = ((giroRoleta % 360) + 360) % 360;
      const anguloFinal = (360 - ajuste) % 360;
      const raio = Math.abs(parseFloat(
        getComputedStyle(bola).getPropertyValue('--raio-bola')
      ) || 220);

      bola.style.transform =
        `translate(-50%,-50%) rotate(${anguloFinal}deg) translateY(-${raio}px)`;
    }

    bola.addEventListener('animationend', function (evento) {
      if (evento.animationName !== 'giroBolaPremium') return;

      // O roleta2.html original ainda faz um reset para rotate(0)
      // depois dos 7,5 s. Corrigimos depois desse reset e repetimos
      // por alguns instantes para impedir que qualquer outro estilo
      // devolva a bola para o verde/0.
      [80, 250, 600, 1200, 2000].forEach(function (tempo) {
        setTimeout(alinharBola, tempo);
      });
    });

    // Remove somente o ponteiro amarelo da Roleta 2.
    const estilo = document.createElement('style');
    estilo.textContent = '.roleta-area::before{display:none!important}';
    document.head.appendChild(estilo);
  });
})();
