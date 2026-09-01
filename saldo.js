// === SISTEMA DE SALDO REAL COM SUPABASE ===

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://jxbzjiwmajjzxgihfjgt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XSQ0Lb5v5QD6tQ_xOao_sA_QfxqqhuJ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const CASA_VANTAGEM = 0.95;

async function getUsuarioLogado() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Erro ao obter sessão:', error);
        return null;
    }
    return data?.session?.user || null;
}

async function buscarSaldo() {
    const user = await getUsuarioLogado();
    if (!user) return 0;
    const { data, error } = await supabase
        .from('saldos')
        .select('valor')
        .eq('user_id', user.id)
        .single();
    if (error || !data) {
        if (error) console.error('Erro ao buscar saldo:', error);
        return 0;
    }
    return parseFloat(data.valor) || 0;
}

async function atualizarTela() {
    const saldo = await buscarSaldo();
    const valorFormatado = saldo.toFixed(2).replace('.', ',');
    document.querySelectorAll('#displaySaldo, #display-saldo, .saldo').forEach(el => {
        el.innerText = `💰 Saldo: R$ ${valorFormatado}`;
    });
    return saldo;
}

async function debitar(valorAposta) {
    const valor = Number(valorAposta);
    if (!Number.isFinite(valor) || valor <= 0) return false;
    const user = await getUsuarioLogado();
    if (!user) return false;

    const { error } = await supabase.rpc('debitar_saldo', {
        p_user_id: user.id,
        p_valor: valor
    });

    if (error) {
        console.error('Erro ao debitar saldo:', error);
        alert('❌ Saldo insuficiente!');
        return false;
    }
    await atualizarTela();
    return true;
}

async function processarVitoria(valorAposta, multiplicadorJusto) {
    const aposta = Number(valorAposta);
    const multiplicador = Number(multiplicadorJusto);
    if (!Number.isFinite(aposta) || !Number.isFinite(multiplicador) || aposta <= 0 || multiplicador < 0) return 0;

    const user = await getUsuarioLogado();
    if (!user) return 0;

    const { data, error } = await supabase.rpc('processar_vitoria', {
        p_user_id: user.id,
        p_aposta: aposta,
        p_multiplicador: multiplicador
    });

    if (error) {
        console.error('Erro ao processar vitória:', error);
        return 0;
    }
    await atualizarTela();
    return Number(data) || 0;
}

// Créditos de depósito são feitos exclusivamente pelo backend.
async function creditar() {
    console.warn('Crédito de saldo é uma operação exclusiva do servidor.');
    return false;
}

window.SistemaSaldo = {
    get: buscarSaldo,
    debitar,
    ganhar: processarVitoria,
    processarVitoria,
    atualizarTela
};

document.addEventListener('DOMContentLoaded', () => {
    atualizarTela();
});
