/*
 * Roleta 2 — correção final da parada visual.
 * Não cria som.
 * Não altera resultado, saldo ou apostas.
 * O roleta2.html continua escolhendo o número aleatório.
 */
(function(){
  'use strict';

  function iniciar(){
    const roleta = document.getElementById('roleta');
    if(!roleta) return;

    let ultimaChave = null;

    const observer = new MutationObserver(function(){
      if(!roleta.classList.contains('girando-premium')) return;

      const inicio = roleta.style.getPropertyValue('--inicio-roleta').trim();
      const giro = roleta.style.getPropertyValue('--giro-roleta').trim();
      if(!inicio || !giro) return;

      const chave = inicio + '|' + giro;
      if(chave === ultimaChave) return;
      ultimaChave = chave;

      /* Impede a keyframe original de assumir o controle.
         O destino vem do índice aleatório calculado pelo jogo. */
      roleta.style.setProperty('animation', 'none', 'important');
      roleta.style.setProperty('transition', 'none', 'important');
      roleta.style.setProperty('transform', 'rotate(' + inicio + ')', 'important');

      void roleta.offsetWidth;

      requestAnimationFrame(function(){
        roleta.style.setProperty(
          'transition',
          'transform 7.5s cubic-bezier(.15,.65,.20,1)',
          'important'
        );
        roleta.style.setProperty(
          'transform',
          'rotate(calc(' + inicio + ' + ' + giro + '))',
          'important'
        );
      });

      setTimeout(function(){
        roleta.style.setProperty('animation', 'none', 'important');
        roleta.style.setProperty('transition', 'none', 'important');
        roleta.style.setProperty(
          'transform',
          'rotate(calc(' + inicio + ' + ' + giro + '))',
          'important'
        );
        ultimaChave = null;
      }, 7550);
    });

    observer.observe(roleta, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', iniciar, {once:true});
  }else{
    iniciar();
  }
})();
