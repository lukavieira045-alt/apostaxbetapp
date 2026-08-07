// script.js - Versão Final Corrigida

function carregarSaldoDisplay() {
    let saldo = localStorage.getItem('apostaXBet_saldo');
    if (!saldo) {
        saldo = 0;
        localStorage.setItem('apostaXBet_saldo', 0);
    }
    
    const valorNumerico = parseFloat(saldo);
    const valorFormatado = valorNumerico.toFixed(2).replace('.', ',');
    
    const displays = document.querySelectorAll('#displaySaldo, .saldo');
    displays.forEach(el => {
        el.innerText = `R$ ${valorFormatado}`;
        
        // Lógica de cor: Vermelho se < 10, Verde se >= 10
        if (valorNumerico < 10) {
            el.style.color = '#ff4d4d'; 
        } else {
            el.style.color = '#00ed91'; 
        }
    });
    
    return valorNumerico;
}

function adicionarSaldo(valor) {
    let saldoAtual = parseFloat(localStorage.getItem('apostaXBet_saldo')) || 0;
    localStorage.setItem('apostaXBet_saldo', saldoAtual + valor);
    carregarSaldoDisplay();
}

function descontarSaldo(valor) {
    let saldoAtual = parseFloat(localStorage.getItem('apostaXBet_saldo')) || 0;
    let novoSaldo = Math.max(0, saldoAtual - valor);
    localStorage.setItem('apostaXBet_saldo', novoSaldo);
    carregarSaldoDisplay();
}

function verificarAcessoJogo(custoAposta, nomeJogo) {
    let saldo = parseFloat(localStorage.getItem('apostaXBet_saldo')) || 0;
    
    if (saldo < custoAposta) {
        criarModalAviso(custoAposta, saldo, nomeJogo);
        return false; 
    }
    return true;
}

function criarModalAviso(custo, saldoAtual, nomeJogo) {
    const oldModal = document.getElementById('modalAvisoSaldo');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'modalAvisoSaldo';
    modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);`;
    
    modal.innerHTML = `
        <div style="background: #1a1a1a; padding: 30px; border-radius: 15px; text-align: center; max-width: 320px; width: 90%; border: 1px solid #e6c229; color: white;">
            <h3 style="color: #e6c229; margin-top: 0;">⚠️ Saldo Insuficiente</h3>
            <p style="font-size: 15px; color: #ccc;">Para jogar <strong>${nomeJogo}</strong> você precisa de <strong>R$ ${custo},00</strong>.<br>Seu saldo: <span style="color:#ff4d4d; font-weight:bold">R$ ${saldoAtual.toFixed(2)}</span></p>
            <button onclick="window.location.href='deposito.html'" style="background: #28a745; color: white; border: none; padding: 12px; border-radius: 8px; width: 100%; margin-bottom: 10px; font-weight: bold;">💰 Depositar</button>
            <button onclick="document.getElementById('modalAvisoSaldo').remove()" style="background: transparent; color: #888; border: 1px solid #444; padding: 10px; border-radius: 8px; width: 100%;">Cancelar</button>
        </div>`;
    document.body.appendChild(modal);
}

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', carregarSaldoDisplay);
}
