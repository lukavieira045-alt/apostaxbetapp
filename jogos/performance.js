/*
 * Roleta 2 — controlador visual do giro
 * Não altera saldo, apostas, resultados ou probabilidades.
 */
(function () {
  'use strict';

  function aplicarGiroNatural() {
    if (!document.getElementById('roleta') || !document.getElementById('bola')) return;

    const style = document.createElement('style');
    style.id = 'roleta2-giro-natural';
    style.textContent = `
      .roleta.girando-premium{
        animation:giroRoletaNatural 9.6s cubic-bezier(.16,.68,.20,1) forwards !important;
      }
      .bola.girando-premium{
        animation:giroBolaNatural 9.6s cubic-bezier(.20,.64,.14,1) forwards !important;
      }

      @keyframes giroRoletaNatural{
        0%{transform:rotate(var(--inicio-roleta,0deg));}
        10%{transform:rotate(calc(var(--inicio-roleta,0deg) + var(--giro-roleta)*.13));}
        25%{transform:rotate(calc(var(--inicio-roleta,0deg) + var(--giro-roleta)*.32));}
        45%{transform:rotate(calc(var(--inicio-roleta,0deg) + var(--giro-roleta)*.56));}
        62%{transform:rotate(calc(var(--inicio-roleta,0deg) + var(--giro-roleta)*.74));}
        76%{transform:rotate(calc(var(--inicio-roleta,0deg) + var(--giro-roleta)*.87));}
        87%{transform:rotate(calc(var(--inicio-roleta,0deg) + var(--giro-roleta)*.94));}
        94%{transform:rotate(calc(var(--inicio-roleta,0deg) + var(--giro-roleta)*.98));}
        100%{transform:rotate(calc(var(--inicio-roleta,0deg) + var(--giro-roleta)));}
      }

      @keyframes giroBolaNatural{
        0%{
          transform:translate(-50%,-50%) rotate(var(--inicio-bola,0deg)) translateY(calc(var(--raio-bola,-188px) - 18px));
        }
        12%{
          transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola)*.15)) translateY(calc(var(--raio-bola,-188px) - 18px));
        }
        28%{
          transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola)*.34)) translateY(calc(var(--raio-bola,-188px) - 18px));
        }
        48%{
          transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola)*.57)) translateY(calc(var(--raio-bola,-188px) - 18px));
        }
        65%{
          transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola)*.75)) translateY(calc(var(--raio-bola,-188px) - 18px));
        }
        78%{
          transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola)*.87)) translateY(calc(var(--raio-bola,-188px) - 18px));
        }
        86%{
          transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola)*.93)) translateY(calc(var(--raio-bola,-188px) - 10px));
        }
        92%{
          transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola)*.965)) translateY(calc(var(--raio-bola,-188px) - 2px));
        }
        96%{
          transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola)*.985)) translateY(calc(var(--raio-bola,-188px) + 5px));
        }
        98%{
          transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola)*.994)) translateY(calc(var(--raio-bola,-188px) + 10px));
        }
        100%{
          transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola))) translateY(var(--raio-bola,-188px));
        }
      }
    `;
    document.head.appendChild(style);

    /* Mais voltas = menos sensação de robô; a função original continua
       escolhendo o número normalmente com crypto.getRandomValues(). */
    const original = window.girarRoleta;
    if (typeof original === 'function' && !original.__giroNatural) {
      const natural = function () {
        return original.apply(this, arguments);
      };
      natural.__giroNatural = true;
      window.girarRoleta = natural;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicarGiroNatural, { once:true });
  } else {
    aplicarGiroNatural();
  }
})();
