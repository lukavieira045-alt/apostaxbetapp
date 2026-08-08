// === SISTEMA DE SALDO GLOBAL - APOSTAXBET ===

// Inicializa o saldo se for a primeira vez
if (!localStorage.getItem('apostaXBet_saldo')) {
    localStorage.setItem('apostaXBet_saldo', '100.00'); // <-- AQUI ESTÁ OS 100 REAIS
}

// Funções globais disponíveis para todos os jogos
window.SistemaSaldo = {
    // Lê o saldo atual
    get: function() {
        return parseFloat(localStorage.getItem('apostaXBet_saldo'));
    },

    // Atualiza o valor na tela
    atualizarTela: function() {
        const el = document.getElementById('display-saldo');
        if (el) {
            el.innerText = 'R$ ' + this.get().toFixed(2);
        }
    },

    // Tenta debitar (retorna true se der certo, false se não tiver saldo)
    debitar: function(valor) {
        let saldo = this.get();
        if (valor > saldo) {
            alert('❌ Saldo insuficiente! Você tem R$ ' + saldo.toFixed(2));
            return false;
        }
        saldo -= valor;
        localStorage.setItem('apostaXBet_saldo', saldo.toFixed(2));
        this.atualizarTela();
        return true;
    },

    // Adiciona dinheiro (quando ganha)
    creditar: function(valor) {
        let saldo = this.get();
        saldo += valor;
        localStorage.setItem('apostaXBet_saldo', saldo.toFixed(2));
        this.atualizarTela();
    }
};

// Atualiza automaticamente quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    SistemaSaldo.atualizarTela();
});
