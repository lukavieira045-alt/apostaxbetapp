// === SISTEMA DE SALDO REAL COM SUPABASE ===

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://jxbzjiwmajjzxgihfjgt.supabase.co';

const SUPABASE_KEY =
    'sb_publishable_XSQ0Lb5v5QD6tQ_xOao_sA_QfxqqhuJ';

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const CASA_VANTAGEM = 0.95;


// =====================================================
// USUÁRIO LOGADO
// =====================================================

async function getUsuarioLogado() {

    const { data, error } =
        await supabase.auth.getSession();

    if (error) {
        console.error(
            'Erro ao obter sessão:',
            error
        );

        return null;
    }

    return data?.session?.user || null;
}


// =====================================================
// BUSCAR SALDO
// =====================================================

async function buscarSaldo() {

    const user =
        await getUsuarioLogado();

    if (!user) {
        return 0;
    }

    const { data, error } =
        await supabase
            .from('saldos')
            .select('valor')
            .eq('user_id', user.id)
            .single();

    if (error) {

        console.error(
            'Erro ao buscar saldo:',
            error
        );

        return 0;
    }

    if (!data) {
        return 0;
    }

    return parseFloat(data.valor) || 0;
}


// =====================================================
// SALVAR SALDO
// =====================================================

async function salvarSaldo(novoValor) {

    const user =
        await getUsuarioLogado();

    if (!user) {
        return false;
    }

    const { error } =
        await supabase
            .from('saldos')
            .upsert(
                {
                    user_id: user.id,
                    valor: Number(novoValor)
                },
                {
                    onConflict: 'user_id'
                }
            );

    if (error) {

        console.error(
            'Erro ao salvar saldo:',
            error
        );

        return false;
    }

    return true;
}


// =====================================================
// ATUALIZAR SALDO NA TELA
// =====================================================

async function atualizarTela() {

    const saldo =
        await buscarSaldo();

    const valorFormatado =
        saldo
            .toFixed(2)
            .replace('.', ',');

    const elementos =
        document.querySelectorAll(
            '#displaySaldo, #display-saldo, .saldo'
        );

    elementos.forEach(el => {

        el.innerText =
            `💰 Saldo: R$ ${valorFormatado}`;

    });

    return saldo;
}


// =====================================================
// DEBITAR
// =====================================================

async function debitar(valorAposta) {

    const valor =
        Number(valorAposta);

    if (
        !Number.isFinite(valor) ||
        valor <= 0
    ) {
        return false;
    }

    const saldoAtual =
        await buscarSaldo();

    if (valor > saldoAtual) {

        alert(
            '❌ Saldo insuficiente!'
        );

        return false;
    }

    const novoSaldo =
        saldoAtual - valor;

    const salvo =
        await salvarSaldo(novoSaldo);

    if (!salvo) {
        return false;
    }

    await atualizarTela();

    return true;
}


// =====================================================
// PROCESSAR VITÓRIA
// =====================================================

async function processarVitoria(
    valorAposta,
    multiplicadorJusto
) {

    const aposta =
        Number(valorAposta);

    const multiplicador =
        Number(multiplicadorJusto);

    if (
        !Number.isFinite(aposta) ||
        !Number.isFinite(multiplicador)
    ) {
        return 0;
    }

    const saldoAtual =
        await buscarSaldo();

    const ganhoReal =
        (aposta * multiplicador) *
        CASA_VANTAGEM;

    const novoSaldo =
        saldoAtual + ganhoReal;

    const salvo =
        await salvarSaldo(novoSaldo);

    if (!salvo) {
        return 0;
    }

    await atualizarTela();

    return ganhoReal;
}


// =====================================================
// CREDitar
// =====================================================

async function creditar(valor) {

    const valorCredito =
        Number(valor);

    if (
        !Number.isFinite(valorCredito) ||
        valorCredito <= 0
    ) {
        return false;
    }

    const saldoAtual =
        await buscarSaldo();

    const novoSaldo =
        saldoAtual + valorCredito;

    const salvo =
        await salvarSaldo(novoSaldo);

    if (!salvo) {
        return false;
    }

    await atualizarTela();

    return true;
}


// =====================================================
// SISTEMA GLOBAL
// =====================================================

window.SistemaSaldo = {

    get: buscarSaldo,

    debitar: debitar,

    ganhar: processarVitoria,

    processarVitoria: processarVitoria,

    creditar: creditar,

    atualizarTela: atualizarTela

};


// =====================================================
// CARREGAR AO ABRIR A PÁGINA
// =====================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        atualizarTela();

    }
);
