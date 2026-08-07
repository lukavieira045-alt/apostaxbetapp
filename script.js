// script.js - Gerenciamento Central de Saldo e Acesso aos Jogos

/**
 * Carrega o saldo do localStorage e atualiza a tela.
 * Se o saldo for menor que R$ 10,00, o texto fica vermelho.
 */
function carregarSaldoDisplay() {
    let saldo = localStorage.getItem('apostaXBet_saldo');
    
    // Inicia com 0 se não existir
    if (!saldo) {
        saldo = 0;
        localStorage.setItem('apostaXBet_saldo', 0);
    }
    
    const valorNumerico = parseFloat(saldo);
    const valorFormatado = valorNumerico.toFixed(2).replace('.', ',');
    
    // Atualiza todos os elementos com id="displaySaldo" ou class="saldo"
    const displays = document.querySelectorAll('#displaySaldo, .saldo');
    displays.forEach(el => {
        el.innerText = `R$ ${valorFormatado}`;
        
        // Feedback visual: Vermelho se tiver pouco dinheiro, Verde se estiver ok
        if (valorNumerico < 10) {
            el.style.color = '#ff4d4d'; 
        } else {
            el.style.color = '#00ed91'; 
        }
    });
    
    return valorNumerico;
}

/**
 * Adiciona valor ao saldo (usado no depósito).
 */
function adicionarSaldo(valor) {
    let saldoAtual = parseFloat(localStorage.getItem('apostaXBet_saldo')) || 0;
    let novoSaldo = saldoAtual + valor;
    
    localStorage.setItem('apostaXBet_saldo', novoSaldo);
    carregarSaldoDisplay();
}

/**
 * Desconta valor do saldo (usado ao apostar/perder).
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
 * Abre um modal bonito se o saldo for insuficiente.
 * 
 * @param {number} custoAposta - Valor da aposta
 * @param {string} nomeJogo - Nome do jogo para exibir no aviso
 * @returns {boolean} true se liberado, false se bloqueado
 */
function verificarAcessoJogo(custoAposta, nomeJogo) {
    let saldo = parseFloat(localStorage.getItem('apostaXBet_saldo')) || 0;
    
    // Verifica se tem saldo suficiente para a aposta
    if (saldo < custoAposta) {
        criarModalAviso(custoAposta, saldo, nomeJogo);
        return false; 
    }
    
    return true; // Liberado
}

/**
 * Cria um Modal personalizado na tela (sem usar alert())
 */
function criarModalAviso(custo, saldoAtual, nomeJogo) {
    // Remove modal antigo se já existir algum aberto
    const oldModal = document.getElementById('modalAvisoSaldo');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'modalAvisoSaldo';
    // Estilos inline para garantir que funcione sem CSS externo
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 9999;
        display: flex; justify-content: center; align-items: center;
        backdrop-filter: blur(3px);
    `;
    
    modal.innerHTML = `
        <div style="
            background: #1a1a1a; padding: 30px; border-radius: 15px; 
            text-align: center; max-width: 320px; width: 90%; 
            border: 1px solid #e6c229; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        ">
            <h3 style="color: #e6c229; margin-top: 0; font-size: 20px;">⚠️ Saldo Insuficiente</h3>
            
            <p style="font-size: 15px; color: #ccc; line-height: 1.5; margin: 20px 0;">
                Para jogar <strong>${nomeJogo}</strong> você precisa de <strong style="color:white">R$ ${custo},00</strong>.<br><br>
                Seu saldo atual:<br>
                <span style="font-size: 24px; font-weight: bold; color: #ff4d4d;">R$ ${saldoAtual.toFixed(2)}</span>
            </p>
            
            <button onclick="window.location.href='deposito.html'" style="
                background: #28a745; color: white; border: none; 
                padding: 12px 20px; border-radius: 8px; width: 100%; 
                margin-bottom: 10px; cursor: pointer; font-weight: bold; font-size: 16px;
                transition: transform 0.2s;
            ">
                💰 Depositar Agora
            </button>
            
            <button onclick="document.getElementById('modalAvisoSaldo').remove()" style="
                background: transparent; color: #888; border: 1px solid #444; 
                padding: 10px 20px; border-radius: 8px; width: 100%; 
                cursor: pointer; font-size: 14px;
            ">
                Cancelar
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Executa automaticamente ao carregar qualquer página que importe este script
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', carregarSaldoDisplay);
}
