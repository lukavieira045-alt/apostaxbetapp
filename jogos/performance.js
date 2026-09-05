/* Roleta 2 — corrige somente a posição final da bola. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const roleta = document.getElementById('roleta');
    const bola = document.getElementById('bola');
    if (!roleta || !bola) return;

    roleta.addEventListener('animationend', function (evento) {
      if (evento.animationName !== 'giroRoletaPremium') return;

      const finalRoleta = getComputedStyle(roleta)
        .getPropertyValue('--roleta-final').trim();
      const raio = getComputedStyle(bola)
        .getPropertyValue('--raio-bola').trim() || '-188px';

      if (!finalRoleta) return;

      // A roda termina com o número sorteado no topo.
      // A bola precisa terminar com a rotação oposta da roda,
      // para ficar fisicamente sobre esse mesmo número.
      bola.style.transform =
        `translate(-50%,-50%) rotate(calc(0deg - ${finalRoleta})) translateY(${raio})`;
    });
  });
})();
