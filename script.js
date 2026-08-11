// === SCRIPT.JS - VERSÃO FINAL COM SUPABASE E VALIDAÇÃO SEGURA ===
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- CONFIGURAÇÃO DO SUPABASE ---
const SUPABASE_URL = 'https://jxbzjiwmajjzxgihfjgt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XSQ0Lb5v5QD6tQ_xOao_sA_QfxqqhuJ'; 
const USER_ID = 'jogador-unico-001'; // ID fixo para teste
const CASA_VANTAGEM = 0.95; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// === SISTEMA DE SALDO REAL (SUPABASE) ===
async function buscarSaldo() {
    const { data, error } = await supabase.from('saldos').select('valor').eq('user_id', USER_ID).single();
    if (error || !data) return 100.00;
    return parseFloat(data.valor);
}

async function salvarSaldo(novoValor) {
    await supabase.from('saldos').upsert({ user_id: USER_ID, valor: novoValor }, { onConflict: 'user_id' });
}

function carregarSaldoDisplay() {
    buscarSaldo().then(saldo => {
        const valorFormatado = saldo.toFixed(2).replace('.', ',');
        const displays = document.querySelectorAll('#displaySaldo, .saldo');
        
        displays.forEach(el => {
            el.innerText = `R$ ${valorFormatado}`;
            el.style.color = saldo < 10 ? '#ff4d4d' : '#00ed91';
        });
    });
}

async function descontarSaldo(valor) {
    let saldoAtual = await buscarSaldo();
    if (saldoAtual < valor) return false;
    
    await salvarSaldo(saldoAtual - valor);
    carregarSaldoDisplay();
    return true;
}

async function processarVitoria(aposta, multiplicador) {
    let saldoAtual = await buscarSaldo();
    const ganhoReal = (aposta * multiplicador) * CASA_VANTAGEM;
    await salvarSaldo(saldoAtual + ganhoReal);
    carregarSaldoDisplay();
    return ganhoReal;
}

// === VALIDAÇÃO DE CADASTRO SEGURO ===
document.addEventListener('DOMContentLoaded', () => {
    carregarSaldoDisplay();

    const btnCriarConta = document.getElementById('btn-criar-conta');
    if (btnCriarConta) {
        btnCriarConta.addEventListener('click', async (e) => {
            e.preventDefault(); 
            
            const nome = document.getElementById('input-nome')?.value.trim();
            const email = document.getElementById('input-email')?.value.trim();
            const senha = document.getElementById('input-senha')?.value;
            const confirmar = document.getElementById('input-confirmar-senha')?.value;

            if (!nome || !email || !senha || !confirmar) {
                alert('⚠️ Preencha TODOS os campos!'); return;
            }
            if (senha.length < 6) {
                alert('⚠️ Senha mínima de 6 caracteres!'); return;
            }
            if (senha !== confirmar) {
                alert('⚠️ As senhas não coincidem!'); return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert('⚠️ E-mail inválido!'); return;
            }

            try {
                // Cria a conta no Supabase Auth
const { data, error } = await supabase.auth.signUp({
    email: email,
    password: senha,
    options: {
        data: {
            full_name: nome
        }
    }
});

if (error) throw error;

alert('✅ Cadastro realizado! Verifique seu e-mail para confirmar.');

                
                
            } catch (err) {
                alert('❌ Erro ao criar conta: ' + err.message);
            }
        });
    }
});

// Exporta funções globais para uso nos jogos
window.SistemaSaldo = {
    get: buscarSaldo,
    debitar: descontarSaldo,
    ganhar: processarVitoria,
    atualizarTela: carregarSaldoDisplay
};
