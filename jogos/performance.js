/* Roleta 2 — mesma lógica de giro/parada: uma única trajetória, sem reset da bola. */
(function () {
  'use strict';

  function instalar() {
    /* Ponteiro amarelo: permanece removido. */
    const estilo = document.createElement('style');
    estilo.textContent = '.roleta-area::before{display:none!important}';
    document.head.appendChild(estilo);

    /*
     * A Roleta 2 não usa mais uma animação independente da bola.
     * Roda e bola partem do estado atual e recebem diretamente o
     * transform final da mesma rodada. Assim, quando termina,
     * o último frame já é o estado parado — não existe reset posterior.
     */
    const original = window.girarRoleta;
    if (typeof original !== 'function') return;

    window.girarRoleta = async function () {
      if (girando) return;

      if (apostas.length === 0) {
        mensagemEl.textContent = 'Faça pelo menos uma aposta antes de girar.';
        mensagemEl.className = 'mensagem resultado-derrota';
        return;
      }

      const total = totalApostas();
      if (total <= 0) {
        mensagemEl.textContent = 'Valor de aposta inválido.';
        mensagemEl.className = 'mensagem resultado-derrota';
        return;
      }

      try {
        iniciarAudio();
        girando = true;
        btnGirar.disabled = true;
        mensagemEl.textContent = '🎰 A roleta está girando...';
        mensagemEl.className = 'mensagem';
        ultimaAposta = apostas.map(a => ({ ...a }));

        await debitar(total);

        const indice = numeroAleatorioSeguro(SEQUENCIA.length);
        const numeroFinal = SEQUENCIA[indice];
        const anguloPorNumero = 360 / SEQUENCIA.length;
        const anguloFinal = indice * anguloPorNumero;

        const raioBola = window.innerWidth <= 650 ? 148 : 220;
        bola.style.setProperty('--raio-bola', `-${raioBola}px`);

        roleta.getAnimations().forEach(a => a.cancel());
        bola.getAnimations().forEach(a => a.cancel());
        roleta.classList.remove('girando-premium');
        bola.classList.remove('girando-premium');

        const inicioRoleta = Number(rotacaoRoletaAtual) || 0;
        const inicioBola = Number(rotacaoBolaAtual) || 0;

        const voltasRoleta = 8;
        const ajusteRoleta = (360 - anguloFinal) % 360;
        const giroRoleta = voltasRoleta * 360 + ajusteRoleta;

        const voltasBola = 12;
        const giroBola = voltasBola * 360 - anguloFinal;

        /* Estado inicial, sem animação. */
        roleta.style.transition = 'none';
        bola.style.transition = 'none';
        roleta.style.transform = `rotate(${inicioRoleta}deg)`;
        bola.style.transform = `translate(-50%,-50%) rotate(${inicioBola}deg) translateY(-${raioBola}px)`;
        bola.style.opacity = '1';
        bola.style.visibility = 'visible';
        bola.style.display = 'block';

        void roleta.offsetWidth;

        const duracao = 7.5;
        const easing = 'cubic-bezier(.08,.55,.15,1)';
        roleta.style.transition = `transform ${duracao}s ${easing}`;
        bola.style.transition = `transform ${duracao}s ${easing}`;

        iniciarSomRoleta();

        /* Um único alvo final para cada elemento. */
        requestAnimationFrame(() => {
          roleta.style.transform = `rotate(${inicioRoleta + giroRoleta}deg)`;
          bola.style.transform =
            `translate(-50%,-50%) rotate(${inicioBola - giroBola}deg) translateY(-${raioBola}px)`;
        });

        await new Promise(resolve => setTimeout(resolve, duracao * 1000 + 30));

        pararSomRoleta();

        /* Mantém exatamente o estado final. Não remove transform nem reseta a bola. */
        rotacaoRoletaAtual = ((inicioRoleta + giroRoleta) % 360 + 360) % 360;
        rotacaoBolaAtual = ((inicioBola - giroBola) % 360 + 360) % 360;

        roleta.style.transition = 'none';
        bola.style.transition = 'none';
        roleta.style.transform = `rotate(${rotacaoRoletaAtual}deg)`;
        bola.style.transform =
          `translate(-50%,-50%) rotate(${rotacaoBolaAtual}deg) translateY(-${raioBola}px)`;

        await finalizarRodada(numeroFinal);

        girando = false;
        btnGirar.disabled = false;
        await obterSaldo();

        if (auto && apostas.length > 0) {
          setTimeout(girarRoleta, 1200);
        }
      } catch (erro) {
        pararSomRoleta();
        console.error('Erro ao girar:', erro);
        contagemEl.style.display = 'none';
        girando = false;
        btnGirar.disabled = false;
        mensagemEl.textContent = erro.message || 'Não foi possível realizar a aposta.';
        mensagemEl.className = 'mensagem resultado-derrota';
        await obterSaldo();
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalar, { once: true });
  } else {
    instalar();
  }
})();
