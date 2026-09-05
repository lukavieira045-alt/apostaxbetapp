/* Roleta 2 — correção somente da lógica de resultado/prêmio. Giro permanece intacto. */
(function () {
  'use strict';

  function instalar() {
    if (document.title.includes('Roleta de Relâmpagos') || !document.querySelector('.roleta-centro')) return;
    const estilo = document.createElement('style');
    estilo.textContent = '.roleta-area::before{display:none!important}';
    document.head.appendChild(estilo);

    const original = window.girarRoleta;
    if (typeof original !== 'function') return;

    /* Mesma tabela de cores da roleta europeia. Não depende do visual. */
    const VERMELHOS = new Set([
      1,3,5,7,9,12,14,16,18,
      19,21,23,25,27,30,32,34,36
    ]);

    function corResultado(numero) {
      numero = Number(numero);
      if (numero === 0) return 'verde';
      return VERMELHOS.has(numero) ? 'vermelho' : 'preto';
    }

    /*
     * A aposta usada no fechamento é a cópia feita NO MOMENTO DO GIRO.
     * Assim nenhuma alteração visual/estado posterior pode transformar
     * uma aposta perdida em vitória.
     */
    window.finalizarRodada = async function (numero) {
      numero = Number(numero);

      resultados.unshift(numero);
      resultados = resultados.slice(0, 8);
      atualizarResultados();
      document.getElementById('ultimoResultado').textContent = numero;

      const apostasDaRodada = Array.isArray(ultimaAposta)
        ? ultimaAposta.map(a => ({ ...a }))
        : [];

      let premioBruto = 0;

      apostasDaRodada.forEach(aposta => {
        const valorAposta = aposta.valor;
        const quantia = Number(aposta.quantia) || 0;

        if (aposta.tipo === 'numero') {
          /* Só o número EXATO sorteado pode pagar esta aposta. */
          if (Number(valorAposta) === numero) {
            premioBruto += quantia * (numero === 0 ? 30 : 36);
          }
          return;
        }

        if (aposta.tipo === 'cor') {
          const resultado = corResultado(numero);
          const apostada = String(valorAposta).trim().toLowerCase();

          /* Vermelho != preto. Preto != vermelho. Verde somente no 0. */
          if (resultado === apostada) {
            premioBruto += quantia * 2;
          }
          return;
        }

        if (aposta.tipo === 'par') {
          if (numero !== 0) {
            const resultado = numero % 2 === 0 ? 'par' : 'impar';
            if (resultado === String(valorAposta).trim().toLowerCase()) {
              premioBruto += quantia * 2;
            }
          }
          return;
        }

        if (aposta.tipo === 'baixo') {
          if (numero >= 1 && numero <= 18) premioBruto += quantia * 2;
          return;
        }

        if (aposta.tipo === 'alto') {
          if (numero >= 19 && numero <= 36) premioBruto += quantia * 2;
          return;
        }

        if (aposta.tipo === 'dozen') {
          if (aposta.valor === 1 && numero >= 1 && numero <= 12) {
            premioBruto += quantia * 3;
          }
          return;
        }

        if (aposta.tipo === 'doze') {
          const grupo = numero >= 1 && numero <= 12 ? 1
            : numero >= 13 && numero <= 24 ? 2
            : numero >= 25 && numero <= 36 ? 3
            : 0;
          if (grupo === Number(aposta.valor)) premioBruto += quantia * 3;
        }
      });

      const premioFinal = premioBruto * TAXA_CASA;
      const cor = corResultado(numero);

      if (premioFinal > 0) {
        await creditar(premioFinal);
        mensagemEl.textContent = `🎉 Saiu ${numero} (${cor.toUpperCase()}) — prêmio ${moeda(premioFinal)}!`;
        mensagemEl.className = 'mensagem resultado-vitoria';
      } else {
        mensagemEl.textContent = `Saiu ${numero} (${cor.toUpperCase()}). Você perdeu esta rodada.`;
        mensagemEl.className = 'mensagem resultado-derrota';
      }

      atualizarEstatisticas();
      apostas = [];
      atualizarAposta();
      fichasDisponiveis = 0;
      atualizarContadorFichas();
      limparFichasVisuais();
      await obterSaldo();
    };

    /* GIRO ORIGINAL CORRIGIDO APENAS PARA CHAMAR O FINALIZADOR CERTO. */
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

        requestAnimationFrame(() => {
          roleta.style.transform = `rotate(${inicioRoleta + giroRoleta}deg)`;
          bola.style.transform =
            `translate(-50%,-50%) rotate(${inicioBola - giroBola}deg) translateY(-${raioBola}px)`;
        });

        await new Promise(resolve => setTimeout(resolve, duracao * 1000 + 30));
        pararSomRoleta();

        rotacaoRoletaAtual = ((inicioRoleta + giroRoleta) % 360 + 360) % 360;
        rotacaoBolaAtual = ((inicioBola - giroBola) % 360 + 360) % 360;

        roleta.style.transition = 'none';
        bola.style.transition = 'none';
        roleta.style.transform = `rotate(${rotacaoRoletaAtual}deg)`;
        bola.style.transform =
          `translate(-50%,-50%) rotate(${rotacaoBolaAtual}deg) translateY(-${raioBola}px)`;

        await window.finalizarRodada(numeroFinal);

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
