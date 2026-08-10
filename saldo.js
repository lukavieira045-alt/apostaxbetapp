// === SISTEMA DE SALDO COM SUPABASE ===
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- COLE SUAS CHAVES ABAIXO ---
const SUPABASE_URL = 'https://jxbzjiwmajjzxgihfjgt.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_XSQ0Lb5v5QD6tQ_xOao_sA_QfxqqhuJ
// -------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const USER_ID = 'jogador-unico-001'; // ID fixo para teste

async function buscarSaldo() {
    const { data, error } = await supabase
        .from('saldos')
        .select('valor')
        .eq('user_id', USER_ID)
        .single();
    
    if (error || !data) return 500; 
    return parseFloat(data.valor);
}

async function salvarSaldo(novoValor) {
    await supabase
        .from('saldos')
        .upsert({ user_id: USER_ID, valor: novoValor }, { onConflict: 'user_id' });
}

window.SistemaSaldo = {
    get: async function() { return await buscarSaldo(); },
    
    atualizarTela: async function() {
        const saldo = await this.get();
        const el = document.getElementById('display-saldo');
        if (el) el.innerText = 'R$ ' + saldo.toFixed(2);
    },

    debitar: async function(valor) {
        let saldo = await this.get();
        if (valor > saldo) {
            alert('❌ Saldo insuficiente!');
            return false;
        }
        await salvarSaldo(saldo - valor);
        this.atualizarTela();
        return true;
    },

    creditar: async function(valor) {
        let saldo = await this.get();
        await salvarSaldo(saldo + valor);
        this.atualizarTela();
    }
};

document.addEventListener('DOMContentLoaded', () => SistemaSaldo.atualizarTela());
