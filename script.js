// === SCRIPT.JS - VERSÃO FINAL COMPLETA (CADASTRO + LOGIN + SALDO REAL) ===
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- CONFIGURAÇÃO DO SUPABASE ---
const SUPABASE_URL = 'https://jxbzjiwmajjzxgihfjgt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XSQ0Lb5v5QD6tQ_xOao_sA_QfxqqhuJ'; 
const CASA_VANTAGEM = 0.95; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// === SISTEMA DE SALDO REAL (SUPABASE) ===
async function getUsuarioLogado() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user || null;
}

async function buscarSaldo() {
    const user = await getUsuarioLogado();
    if (!user) return 0; // Se não estiver logado, saldo é 0
    
    const { data, error } = await supabase
        .from('saldos')
        .select('valor')
        .eq('user_id', user.id)
        .single();
        
    if (error || !data) return 100.00; // Saldo inicial padrão se não existir
    return parseFloat(data.valor);
}

async function salvarSaldo(novoValor) {
    const user = await getUsuarioLogado();
    if (!user) return;
    
    await supabase.from('saldos').upsert(
        { user_id: user.id, valor: novoValor }, 
        { onConflict: 'user_id' }
    );
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

// === LÓGICA DE INTERFACE E VALIDAÇÃO ===
document.addEventListener('DOMContentLoaded', () => {
    carregarSaldoDisplay();

    // --- VALIDAÇÃO DE CADASTRO ---
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
                alert('️ As senhas não coincidem!'); return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert('⚠️ E-mail inválido!'); return;
            }

            try {
                const { error } = await supabase.auth.signUp({
                    email, password: senha, options: { data: { full_name: nome } }
                });
                if (error) throw error;
                alert('✅ Cadastro realizado! Verifique seu e-mail.');
            } catch (err) {
                alert('❌ Erro ao criar conta: ' + err.message);
            }
        });
    }

    // --- LÓGICA DE LOGIN ---
    const btnEntrar = document.getElementById('btn-entrar');
    if (btnEntrar) {
        btnEntrar.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Ajuste estes IDs conforme estão no seu HTML da aba Login
            const email = document.getElementById('input-login-email')?.value.trim();
            const senha = document.getElementById('input-login-senha')?.value;

            if (!email || !senha) {
                alert('⚠️ Preencha e-mail e senha!'); return;
            }

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email, password: senha
                });
                if (error) throw error;
                
                alert('✅ Login realizado com sucesso!');
                window.location.reload(); // Recarrega para atualizar o saldo do usuário
                
            } catch (err) {
                alert('❌ Erro ao entrar: ' + err.message);
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
// === BOTÃO DE APOSTA DO MINES (SIMPLIFICADO) ===
const btnApostarMines = document.getElementById('btn-apostar-mines');

if (btnApostarMines) {
    btnApostarMines.addEventListener('click', async () => {
        // Pega o valor que o usuário digitou
        const valor = parseFloat(document.getElementById('input-aposta-mines').value);
        
        // Verifica se tem saldo usando o sistema que JÁ FUNCIONA
        const saldo = await window.SistemaSaldo.get();
        
        if (!valor || valor <= 0) {
            alert('⚠️ Digite um valor válido!');
            return;
        }
        
        if (valor > saldo) {
            alert('❌ Saldo insuficiente!');
            return;
        }
        
        // Debita o saldo e avisa
        await window.SistemaSaldo.debitar(valor);
        alert(`✅ Aposta de R$ ${valor.toFixed(2)} realizada! Boa sorte!`);
        
        // Aqui você pode adicionar a lógica visual do jogo depois
    });
}
