/*
 * Roleta 2 — controlador único do giro da roda.
 * Não cria som.
 * Não altera resultado, saldo ou apostas.
 * Usa exatamente o --inicio-roleta e --giro-roleta calculados
 * pelo roleta2.html, então a roda termina no número sorteado.
 */
(function(){
  'use strict';

  function iniciar(){
    const roleta = document.getElementById('roleta');
    if(!roleta) return;

    let ultimoGiro = null;

    const observer = new MutationObserver(function(){
      if(!roleta.classList.contains('girando-premium')) return;

      const inicio = roleta.style.getPropertyValue('--inicio-roleta').trim();
      const giro = roleta.style.getPropertyValue('--giro-roleta').trim();
      if(!inicio || !giro) return;

      const chave = inicio + '|' + giro;
      if(chave === ultimoGiro) return;
      ultimoGiro = chave;

      /* A keyframe antiga começava sempre de zero.
         Aqui usamos o estado real e o destino real da rodada. */
      roleta.style.animation = 'none';
      roleta.style.transition = 'none';
      roleta.style.transform = 'rotate(' + inicio + ')';

      void roleta.offsetWidth;

      roleta.style.transition = 'transform 7.5s cubic-bezier(.15,.65,.20,1)';
      roleta.style.transform = 'rotate(calc(' + inicio + ' + ' + giro + '))';

      setTimeout(function(){
        if(!roleta.classList.contains('girando-premium')){
          roleta.style.transition = 'none';
          roleta.style.transform = 'rotate(calc(' + inicio + ' + ' + giro + '))';
          ultimoGiro = null;
        }
      }, 7600);
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
