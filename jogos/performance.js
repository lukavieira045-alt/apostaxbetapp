/* Roleta 2 — correção exclusiva da posição final da bola. */
(function () {
  'use strict';
  const style = document.createElement('style');
  style.textContent = `
@keyframes giroBolaPremium {
0%{transform:translate(-50%,-50%) rotate(var(--inicio-bola,0deg)) translateY(calc(var(--raio-bola,-188px) - 18px));}
82%{transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola,0deg)*.82)) translateY(calc(var(--raio-bola,-188px) - 18px));}
92%{transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola,0deg)*.92)) translateY(calc(var(--raio-bola,-188px) - 8px));}
97%{transform:translate(-50%,-50%) rotate(calc(var(--inicio-bola,0deg) - var(--giro-bola,0deg)*.97)) translateY(calc(var(--raio-bola,-188px) + 8px));}
100%{transform:translate(-50%,-50%) rotate(calc(0deg - var(--inicio-roleta,0deg) - var(--giro-roleta,0deg))) translateY(calc(var(--raio-bola,-188px) + 18px));}
}`;
  document.head.appendChild(style);
})();
