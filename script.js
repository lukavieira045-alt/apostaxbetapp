// script.js - Gerenciamento Central de Saldo e Acesso aos Jogos
// Chave usada no localStorage: 'apostaXBet_saldo'

/**
 * Carrega o saldo do localStorage e atualiza todos os elementos 
 * com id="displaySaldo" ou class="saldo" na página.
 */
function carregarSaldoDisplay() {
    let saldo = localStorage.getItem('apostaXBet_saldo');
    
    // Se não existir saldo salvo, inicia com 0
    if (!saldo) {
        saldo = 0;
        localStorage.setItem('apostaXBet_saldo', 0);
    }
    
    const valorFormatado = parseFloat(saldo).toFixed(2).replace('.', ',');
    
    // Atualiza qualquer elemento na página que tenha id="displaySaldo" OU class="saldo"
    const displays = document.querySelectorAll('#displaySaldo, .saldo');
    displays.forEach(el => {
        el.innerText = `Saldo: R$ ${valorFormatado}`;
    });
    
    return parseFloat(saldo);
}

/**
 * Adiciona um valor ao saldo (usado após confirmação de depósito).
 * @param {number} valor - Valor a ser adicionado
 */
function adicionarSaldo(valor) {
    let saldoAtual = parseFloat(localStorage.getItem('apostaXBet_saldo')) || 0;
    let novoSaldo = saldoAtual + valor;
    
    localStorage.setItem('apostaXBet_saldo', novoSaldo);
    carregarSaldoDisplay();
    
    alert(`✅ Depósito de R$ ${valor},00 recebido com sucesso!`);
}

/**
 * Desconta um valor do saldo (usado quando o usuário perde uma aposta).
 * @param {number} valor - Valor a ser descontado
 */
function descontarSaldo(valor) {
    let saldoAtual = parseFloat(localStorage.getItem('apostaXBet_saldo')) || 0;
    // Garante que o saldo nunca fique negativo
    let novoSaldo = Math.max(0, saldoAtual - valor);
    
    localStorage.setItem('apostaXBet_saldo', novoSaldo);
    carregarSaldoDisplay();
}

/**
 * VERIFICA SE O USUÁRIO PODE JOGAR.
 * Bloqueia o acesso se o saldo for menor que R$ 10,00 
 * ou insuficiente para o valor da aposta.
 * 
 * @param {number} custoAposta - Valor necessário para fazer a aposta
 * @returns {boolean} true se liberado, false se bloqueado
 */
function verificarAcessoJogo(custoAposta) {
    let saldo = parseFloat(localStorage.getItem('apostaXBet_saldo')) || 0;
    
    // Regra 1: Saldo mínimo de R$ 10,00 para acessar qualquer jogo
    if (saldo < 10) {
        alert("🔒 ACESSO BLOQUEADO!\n\nVocê precisa ter no mínimo R$ 10,00 em saldo para jogar.\nFaça um depósito para continuar.");
        window.location.href = 'deposito.html'; // Redireciona para a página de depósito
        return false; 
    }
    
    // Regra 2: Saldo suficiente para cobrir o valor desta aposta específica
    if (saldo < custoAposta) {
        alert(`⚠️ SALDO INSUFICIENTE!\n\nCusto da aposta: R$ ${custoAposta},00\nSeu saldo atual: R$ ${saldo.toFixed(2)}\n\nDeposite mais para continuar jogando.`);
        return false;
    }
    
    // Se passou pelas duas verificações, libera o jogo
    return true; 
}

// Executa automaticamente ao carregar qualquer página que importe este script
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', carregarSaldoDisplay);
}
