/*
 * Roleta 2 — correção APENAS da trajetória da bola.
 *
 * A lógica original da roda, sorteio, áudio, saldo e apostas fica intacta.
 * Não cria som, não cria outra bola e não altera o giro da roda.
 */
(function(){
  'use strict';

  function iniciar(){
    if(document.getElementById('roleta2-bola-only-fix')) return;

    const roleta=document.getElementById('roleta');
    const bola=document.getElementById('bola');
    if(!roleta || !bola) return;

    const estilo=document.createElement('style');
    estilo.id='roleta2-bola-only-fix';
    estilo.textContent=`
      /* Somente a bola: compensa a rotação da roda e termina no ponteiro. */
      @keyframes giroBolaPremiumCorrigido{
        0%{
          transform:translate(-50%,-50%)
            rotate(var(--inicio-bola,0deg))
            translateY(calc(var(--raio-bola,-188px) - 18px));
        }
        82%{
          transform:translate(-50%,-50%)
            rotate(calc(var(--inicio-bola,0deg) - 3420deg))
            translateY(calc(var(--raio-bola,-188px) - 18px));
        }
        92%{
          transform:translate(-50%,-50%)
            rotate(calc(var(--inicio-bola,0deg) - 3780deg))
            translateY(calc(var(--raio-bola,-188px) - 8px));
        }
        97%{
          transform:translate(-50%,-50%)
            rotate(calc(var(--inicio-bola,0deg) - 3960deg))
            translateY(calc(var(--raio-bola,-188px) + 8px));
        }
        100%{
          transform:translate(-50%,-50%)
            rotate(calc(0deg - var(--inicio-roleta,0deg) - var(--giro-roleta,0deg)))
            translateY(calc(var(--raio-bola,-188px) + 18px));
        }
      }

      .bola.girando-premium{
        animation:giroBolaPremiumCorrigido var(--duracao-giro,7.5s)
          cubic-bezier(.08,.55,.15,1) forwards !important;
      }
    `;
    document.head.appendChild(estilo);

    let corrigindo=false;

    function fixarBolaNoPonteiro(){
      if(corrigindo) return;
      if(roleta.classList.contains('girando-premium')) return;

      const inicio=roleta.style.getPropertyValue('--inicio-roleta').trim();
      const giro=roleta.style.getPropertyValue('--giro-roleta').trim();
      const raio=bola.style.getPropertyValue('--raio-bola').trim() || '-188px';
      if(!inicio || !giro) return;

      corrigindo=true;
      bola.style.setProperty(
        'transform',
        'translate(-50%,-50%) rotate(calc(0deg - var(--inicio-roleta,0deg) - var(--giro-roleta,0deg))) translateY('+raio+')',
        'important'
      );
      requestAnimationFrame(function(){ corrigindo=false; });
    }

    /*
     * O HTML original, ao terminar, remove a classe e escreve transform=0.
     * Corrigimos somente essa última escrita para a bola continuar no ponteiro.
     */
    const observer=new MutationObserver(function(mutations){
      for(const m of mutations){
        if(m.type==='attributes' && m.attributeName==='style'){
          fixarBolaNoPonteiro();
          break;
        }
        if(m.type==='attributes' && m.attributeName==='class' && !bola.classList.contains('girando-premium')){
          setTimeout(fixarBolaNoPonteiro,0);
          break;
        }
      }
    });

    observer.observe(bola,{attributes:true,attributeFilter:['style','class']});
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  }else{
    iniciar();
  }
})();
