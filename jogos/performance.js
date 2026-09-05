/*
 * Roleta 2 — correção do giro da roda.
 * Não cria som e não mexe em saldo/apostas.
 * O resultado continua sendo sorteado pelo próprio roleta2.html.
 */
(function(){
  'use strict';

  function corrigirRoleta(){
    const roleta=document.getElementById('roleta');
    if(!roleta)return;

    const obs=new MutationObserver(function(){
      if(!roleta.classList.contains('giro-premium'))return;

      const destino=roleta.style.getPropertyValue('--roleta-final').trim();
      if(!destino)return;

      /* Cancela a keyframe que começa em zero e força a roda
         a sair da posição atual e desacelerar até o número sorteado. */
      roleta.style.animation='none';
      roleta.style.transition='none';
      const atual=roleta.style.transform||'rotate(0deg)';
      roleta.style.transform=atual;

      void roleta.offsetWidth;

      roleta.style.transition='transform 7.5s cubic-bezier(.15,.65,.20,1)';
      roleta.style.transform='rotate('+destino+')';

      setTimeout(function(){
        if(roleta.classList.contains('giro-premium'))return;
        roleta.style.transition='none';
        roleta.style.transform='rotate('+destino+')';
      },7600);
    });

    obs.observe(roleta,{attributes:true,attributeFilter:['class']});
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',corrigirRoleta,{once:true});
  }else{
    corrigirRoleta();
  }
})();
