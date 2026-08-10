// === SISTEMA DE SALDO COM SUPABASE E VANTAGEM DA CASA ===
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- COLE SUAS CHAVES ABAIXO ---
const SUPABASE_URL = 'https://jxbzjiwmajjzxgihfjgt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XSQ0Lb5v5QD6tQ_xOao_sA_QfxqqhuJ'; 
// -------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const USER_ID = 'jogador-unico-001'; // ID fixo para teste

// Configuração da Vantagem da Casa (0.95 = Jogador recebe 95% do valor justo)
// A casa fica com 5% de cada vitória automaticamente
const CASA_VANTAGEM = 0.95; 

async function buscarSaldo() {
    const { data, error } = await supabase
        .from('saldos')
        .select('valor')
        .eq('user_id', USER_ID)
        .single();

    if (error || !data) return 100.00;
    return parseFloat(data.valor);
}

async function salvarSaldo(novoValor) {
    await supabase
        .from('saldos')
        .upsert({ user_id: USER_ID, valor: novoValor }, { onConflict: 'user_id' });
}

window.SistemaSaldo = {
    get: async function() { 
        return await buscarSaldo(); 
    },

    atualizarTela: async function() {
        const saldo = await this.get();
        const el = document.getElementById('display-saldo');
        if (el) el.innerText = 'R$ ' + saldo.toFixed(2);
    },

    debitar: async function(valorAposta) {
        let saldoAtual = await this.get();
        
        if (valorAposta > saldoAtual) {
            alert('❌ Saldo insuficiente!');
            return false;
        }
        
        // Desconta a aposta inteira imediatamente
        await salvarSaldo(saldoAtual - valorAposta);
        this.atualizarTela();
        return true;
    },

    // NOVA FUNÇÃO: Processar Vitória com Vantagem da Casa Automática
    processarVitoria: async function(valorAposta, multiplicadorJusto) {
        let saldoAtual = await this.get();
        
        // Calcula o ganho REAL aplicando a taxa da casa
        // Ex: Aposta 10 x Mult 2.0 = 20. Com taxa (0.95): 20 * 0.95 = 19.
        const ganhoReal = (valorAposta * multiplicadorJusto) * CASA_VANTAGEM;
        
        const novoSaldo = saldoAtual + ganhoReal;
        await salvarSaldo(novoSaldo);
        this.atualizarTela();
        
        return ganhoReal; 
    },

    creditar: async function(valor) {
        let saldo = await this.get();
        await salvarSaldo(saldo + valor);
        this.atualizarTela();
    }
};

document.addEventListener('DOMContentLoaded', () => SistemaSaldo.atualizarTela());
