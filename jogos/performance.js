/*
 * Roleta 2 — correção APENAS da trajetória da bola.
 *
 * A lógica original do giro da roda, sorteio, áudio, saldo e apostas
 * permanece intacta no roleta2.html.
 * Este arquivo não altera a roda nem cria outro som.
 */
(function(){
  'use strict';

  function iniciar(){
    if(document.getElementById('roleta2-bola-only-fix')) return;

    const estilo=document.createElement('style');
    estilo.id='roleta2-bola-only-fix';
    estilo.textContent=`
      /* Somente a bola: ela compensa a rotação da roda e termina no ponteiro. */
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
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  }else{
    iniciar();
  }
})();
