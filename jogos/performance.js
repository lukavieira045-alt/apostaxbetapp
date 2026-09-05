/*
 * Roleta 2 — correção do giro visual.
 *
 * O resultado continua sendo escolhido pelo roleta2.html.
 * Não cria som e não altera saldo/apostas.
 *
 * CORREÇÃO IMPORTANTE:
 * A bola antiga terminava em -giroBola. Como a roda também girava
 * para o mesmo deslocamento do número sorteado, a bola acabava
 * visualmente sobre a casa verde/0. A bola agora faz voltas completas
 * no sentido contrário e termina exatamente no ponteiro (12 horas).
 */
(function(){
  'use strict';

  const DURACAO = 7500;
  const CURVA = 'cubic-bezier(.15,.65,.20,1)';

  function manterUmaBola(roleta){
    const bolas = roleta.querySelectorAll('.bola');
    for(let i=1;i<bolas.length;i++) bolas[i].remove();
    return bolas[0] || document.getElementById('bola');
  }

  function iniciar(){
    const roleta = document.getElementById('roleta');
    const bola = document.getElementById('bola');
    if(!roleta || !bola) return;

    let ultimaChave = null;

    /* Substitui somente a animação da bola. */
    const estilo = document.createElement('style');
    estilo.textContent = `
      @keyframes giroBolaCorrigidoRoleta2{
        0%{
          transform:translate(-50%,-50%) rotate(0deg)
            translateY(var(--raio-bola,-220px));
        }
        82%{
          transform:translate(-50%,-50%) rotate(-3542.4deg)
            translateY(var(--raio-bola,-220px));
        }
        92%{
          transform:translate(-50%,-50%) rotate(-3974.4deg)
            translateY(var(--raio-bola,-220px));
        }
        97%{
          transform:translate(-50%,-50%) rotate(-4190.4deg)
            translateY(var(--raio-bola,-220px));
        }
        100%{
          transform:translate(-50%,-50%) rotate(-4320deg)
            translateY(var(--raio-bola,-220px));
        }
      }
    `;
    document.head.appendChild(estilo);

    const observer = new MutationObserver(function(){
      if(!roleta.classList.contains('girando-premium')) return;

      const inicio = roleta.style.getPropertyValue('--inicio-roleta').trim();
      const giro = roleta.style.getPropertyValue('--giro-roleta').trim();
      if(!inicio || !giro) return;

      const chave = inicio + '|' + giro;
      if(chave === ultimaChave) return;
      ultimaChave = chave;

      const bolaAtual = manterUmaBola(roleta);
      if(!bolaAtual) return;

      /* RODA: usa o destino real calculado pelo jogo. */
      roleta.style.setProperty('animation','none','important');
      roleta.style.setProperty('transition','none','important');
      roleta.style.setProperty('transform','rotate('+inicio+')','important');

      void roleta.offsetWidth;

      /* BOLA: começa no topo e termina no topo.
         Assim quem muda de posição é a roda, não o resultado. */
      bolaAtual.style.setProperty('animation','none','important');
      bolaAtual.style.setProperty('transform','translate(-50%,-50%) rotate(0deg) translateY(var(--raio-bola,-220px))','important');
      bolaAtual.style.setProperty('opacity','1','important');
      bolaAtual.style.setProperty('visibility','visible','important');

      void bolaAtual.offsetWidth;

      requestAnimationFrame(function(){
        roleta.style.setProperty(
          'transition',
          'transform '+DURACAO+'ms '+CURVA,
          'important'
        );
        roleta.style.setProperty(
          'transform',
          'rotate(calc('+inicio+' + '+giro+'))',
          'important'
        );

        bolaAtual.style.setProperty(
          'animation',
          'giroBolaCorrigidoRoleta2 '+DURACAO+'ms '+CURVA+' forwards',
          'important'
        );
      });

      setTimeout(function(){
        roleta.style.setProperty('animation','none','important');
        roleta.style.setProperty('transition','none','important');
        roleta.style.setProperty(
          'transform',
          'rotate(calc('+inicio+' + '+giro+'))',
          'important'
        );

        bolaAtual.style.setProperty('animation','none','important');
        bolaAtual.style.setProperty(
          'transform',
          'translate(-50%,-50%) rotate(0deg) translateY(var(--raio-bola,-220px))',
          'important'
        );

        ultimaChave = null;
      }, DURACAO + 100);
    });

    observer.observe(roleta, {
      attributes:true,
      attributeFilter:['class']
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', iniciar, {once:true});
  }else{
    iniciar();
  }
})();
