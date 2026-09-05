/*
 * Roleta 2 — correção SOMENTE da bolinha.
 *
 * A roda, o sorteio, o áudio, saldo e apostas continuam com a lógica original.
 * A bolinha não pula entre números: ela faz uma trajetória contínua e termina
 * exatamente sobre o número que a roda levou ao topo.
 */
(function(){
  'use strict';

  function iniciar(){
    const roleta = document.getElementById('roleta');
    const bola = document.getElementById('bola');
    if(!roleta || !bola) return;

    /* O usuário pediu a remoção do ponteiro amarelo. */
    const estilo = document.createElement('style');
    estilo.id = 'roleta2-correcao-bola';
    estilo.textContent = '.roleta-area::before{display:none!important;}';
    document.head.appendChild(estilo);

    let rodada = 0;

    const observer = new MutationObserver(function(){
      if(!roleta.classList.contains('girando-premium')) return;

      const inicio = roleta.style.getPropertyValue('--inicio-roleta').trim();
      const giro = roleta.style.getPropertyValue('--giro-roleta').trim();
      if(!inicio || !giro) return;

      const chave = inicio + '|' + giro;
      if(chave === rodada) return;
      rodada = chave;

      const raio = bola.style.getPropertyValue('--raio-bola').trim() || '-188px';

      /*
       * A roda termina em inicio + giro.
       * Como a bola é filha da roda, para ficar no topo junto do número sorteado
       * ela precisa terminar com a rotação local oposta à rotação final da roda.
       * Acrescentamos voltas inteiras para ela realmente percorrer a pista.
       */
      const finalLocal = `calc(0deg - ${inicio} - ${giro} - 1440deg)`;
      const inicialLocal = `calc(0deg - ${inicio})`;

      bola.getAnimations().forEach(a => a.cancel());
      bola.style.setProperty('animation','none','important');
      bola.style.setProperty(
        'transform',
        `translate(-50%,-50%) rotate(${inicialLocal}) translateY(${raio})`,
        'important'
      );
      bola.style.setProperty('opacity','1','important');
      bola.style.setProperty('visibility','visible','important');
      bola.style.setProperty('display','block','important');

      void bola.offsetWidth;

      requestAnimationFrame(function(){
        const anim = bola.animate([
          {
            transform:`translate(-50%,-50%) rotate(${inicialLocal}) translateY(${raio})`
          },
          {
            transform:`translate(-50%,-50%) rotate(calc(0deg - ${inicio} - ${giro} - 1080deg)) translateY(${raio})`,
            offset:.72
          },
          {
            transform:`translate(-50%,-50%) rotate(calc(0deg - ${inicio} - ${giro} - 1320deg)) translateY(${raio})`,
            offset:.90
          },
          {
            transform:`translate(-50%,-50%) rotate(${finalLocal}) translateY(${raio})`
          }
        ],{
          duration:7500,
          easing:'cubic-bezier(.08,.55,.15,1)',
          fill:'forwards'
        });

        anim.finished.catch(function(){});
      });
    });

    observer.observe(roleta,{
      attributes:true,
      attributeFilter:['class','style']
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  }else{
    iniciar();
  }
})();
