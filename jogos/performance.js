/*
 * Roleta 2 — ajuste visual mínimo.
 *
 * NÃO interfere no giro original, na bola, no sorteio, no áudio,
 * no saldo ou nas apostas.
 * Apenas remove o ponteiro amarelo que foi pedido para não aparecer.
 */
(function(){
  'use strict';

  function iniciar(){
    if(document.getElementById('roleta2-sem-ponteiro')) return;

    const estilo=document.createElement('style');
    estilo.id='roleta2-sem-ponteiro';
    estilo.textContent=`
      .roleta-area::before{
        display:none !important;
      }
    `;
    document.head.appendChild(estilo);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  }else{
    iniciar();
  }
})();
