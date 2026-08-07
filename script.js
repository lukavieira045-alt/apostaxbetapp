// script.js - Gerenciamento de Saldo e Acesso (Versão Suave)

// Função para atualizar o saldo na tela
function carregarSaldoDisplay() {
    let saldo = localStorage.getItem('apostaXBet_saldo');
    if (!saldo) {
        saldo = 0;
        localStorage.setItem('apostaXBet_saldo', 0);
    }
    
    const valorFormatado = parseFloat(saldo).toFixed(2).replace('.', ',');
    const displays = document.querySelectorAll('#displaySaldo, .saldo');
    
    displays.forEach(el => {
        el.innerText = `R$ ${valorFormatado}`;
        // Muda a cor se o saldo estiver baixo (opcional)
        if (parseFloat(saldo) < 10) {
            el.style.color = '#ff4d4d'; // Vermelho se tiver pouco
        } else {
            el.style.color = '#00ed91'; // Verde normal
        }
    });
    
    return parseFloat(saldo);
}

// Adicionar saldo (Depósito)
function adicionarSaldo(valor) {
    let saldoAtual = parseFloat(localStorage.getItem('apostaXBet_saldo')) || 0;
    localStorage.setItem('apostaXBet_saldo', saldoAtual + valor);
    carregarSaldoDisplay();
}

// Descontar saldo (Perda/Aposta)
function descontarSaldo(valor) {
    let saldoAtual = parseFloat(localStorage.getItem('apostaXBet_saldo')) || 0;
    let novoSaldo = Math.max(0, saldoAtual - valor);
    localStorage.setItem('apostaXBet_saldo', novoSaldo);
    carregarSaldoDisplay();
}

// --- NOVA LÓGICA DE VERIFICAÇÃO (SEM REDIRECIONAMENTO AUTOMÁTICO) ---
function verificarAcessoJogo(custoAposta, nomeJogo) {
    let saldo = parseFloat(localStorage.getItem('apostaXBet_saldo')) || 0;
    
    // Se não tem saldo nem para a aposta
    if (saldo < custoAposta) {
        // Cria um modal bonito em vez de alert
        criarModalAviso(custoAposta, saldo, nomeJogo);
        return false; 
    }
    
    return true; // Liberado
}

// Função auxiliar para criar o Modal de Aviso Bonito
function criarModalAviso(custo, saldoAtual, nomeJogo) {
    // Remove modal antigo se existir
    const oldModal = document.getElementById('modalAvisoSaldo');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'modalAvisoSaldo';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 9999;
        display: flex; justify-content: center; align-items: center;
    `;
    
    modal.innerHTML = `
        <div style="background: #1a1a1a; padding: 25px; border-radius: 15px; text-align: center; max-width: 300px; border: 1px solid #e6c229; color: white;">
            <h3 style="color: #e6c229; margin-top: 0;">⚠️ Saldo Insuficiente</h3>
            <p style="font-size: 14px; color: #ccc;">
                Para jogar <strong>${nomeJogo}</strong> você precisa de <strong>R$ ${custo},00</strong>.<br>
                Seu saldo atual: <strong>R$ ${saldoAtual.toFixed(2)}</strong>
            </p>
            <button onclick="window.location.href='deposito.html'" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; width: 100%; margin-bottom: 10px; cursor: pointer; font-weight: bold;">
                💰 Depositar Agora
            </button>
            <button onclick="document.getElementById('modalAvisoSaldo').remove()" style="background: transparent; color: #888; border: 1px solid #444; padding: 8px 20px; border-radius: 5px; width: 100%; cursor: pointer;">
                Cancelar
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Inicializa ao carregar a página
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', carregarSaldoDisplay);
}
