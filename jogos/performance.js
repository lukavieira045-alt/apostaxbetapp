/* Roleta 2 — somente remove o ponteiro amarelo. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    const estiloPonteiro = document.createElement('style');
    estiloPonteiro.textContent = '.roleta-area::before{display:none!important}';
    document.head.appendChild(estiloPonteiro);
  });
})();
