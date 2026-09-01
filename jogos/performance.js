(function () {
  'use strict';

  var nav = window.navigator || {};
  var connection = nav.connection || nav.mozConnection || nav.webkitConnection || {};
  var mobile = window.matchMedia && window.matchMedia('(max-width: 700px)').matches;
  var android = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent || '');
  var memory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 0;
  var cores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 0;
  var slowConnection = !!connection.saveData || /^(slow-2g|2g)$/i.test(connection.effectiveType || '');

  // Ativa apenas em celular/tablet ou em conexão claramente lenta.
  // A lógica dos jogos, saldo, apostas e pagamentos não é alterada.
  var lowEnd = (mobile || android) && (
    slowConnection ||
    (memory > 0 && memory <= 4) ||
    (cores > 0 && cores <= 6) ||
    (memory === 0 && cores === 0)
  );

  if (!lowEnd) return;

  document.documentElement.classList.add('ax-low-performance');

  var css = document.createElement('style');
  css.id = 'ax-low-performance-style';
  css.textContent = `
    .ax-low-performance body {
      animation: none !important;
      background-attachment: scroll !important;
    }
    .ax-low-performance .luz,
    .ax-low-performance .particulas,
    .ax-low-performance .particulas span,
    .ax-low-performance [class*="particle"],
    .ax-low-performance [class*="partic"],
    .ax-low-performance [class*="spark"],
    .ax-low-performance [class*="glow"],
    .ax-low-performance [class*="luz"],
    .ax-low-performance [class*="light"] {
      display: none !important;
    }
    .ax-low-performance * {
      text-shadow: none !important;
    }
    .ax-low-performance [style*="filter"],
    .ax-low-performance * {
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
    }
    .ax-low-performance .box,
    .ax-low-performance .card,
    .ax-low-performance .container,
    .ax-low-performance .panel,
    .ax-low-performance .modal {
      box-shadow: none !important;
    }
  `;
  (document.head || document.documentElement).appendChild(css);

  // Evita que áudio fique consumindo processamento quando a aba/jogo não está visível.
  document.addEventListener('visibilitychange', function () {
    var audios = document.querySelectorAll('audio');
    if (document.hidden) {
      audios.forEach(function (audio) {
        if (!audio.paused) {
          audio.dataset.axWasPlaying = '1';
          try { audio.pause(); } catch (e) {}
        }
      });
    } else {
      audios.forEach(function (audio) {
        if (audio.dataset.axWasPlaying === '1') {
          delete audio.dataset.axWasPlaying;
          try {
            var p = audio.play();
            if (p && p.catch) p.catch(function () {});
          } catch (e) {}
        }
      });
    }
  });
})();
