// === SCRIPT.JS - VERSÃO FINAL COM SAQUE UNIVERSAL ===
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// =====================================================
// CONFIGURAÇÃO DO SUPABASE
// =====================================================
const SUPABASE_URL = 'https://jxbzjiwmajjzxgihfjgt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XSQ0Lb5v5QD6tQ_xOao_sA_QfxqqhuJ'; // Sua anon key pública
const CASA_VANTAGEM = 0.95;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =====================================================
// FUNÇÕES DE USUÁRIO E SALDO
// =====================================================
async function getUsuarioLogado() {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
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

    if (error || !data) return 0;
    const saldo = parseFloat(data.valor);
    return Number.isFinite(saldo) ? saldo : 0;
}

async function salvarSaldo(novoValor) {
    const user = await getUsuarioLogado();
    if (!user) return false;

    const valor = Number(novoValor);
    if (!Number.isFinite(valor)) return false;

    const { error } = await supabase
        .from('saldos')
        .upsert({ user_id: user.id, valor: valor }, { onConflict: 'user_id' });

    return !error;
}

async function carregarSaldoDisplay() {
    const saldo = await buscarSaldo();
    const valorFormatado = saldo.toFixed(2).replace('.', ',');
    
    document.querySelectorAll('#displaySaldo, .saldo').forEach(el => {
        el.innerText = `R$ ${valorFormatado}`;
        el.style.color = saldo < 10 ? '#ff4d4d' : '#00ed91';
    });
    return saldo;
}

async function descontarSaldo(valor) {
    const saldoAtual = await buscarSaldo();
    if (saldoAtual < valor) return false;
    
    const salvo = await salvarSaldo(saldoAtual - valor);
    if (salvo) await carregarSaldoDisplay();
    return salvo;
}

async function processarVitoria(aposta, multiplicador) {
    const ganhoReal = (Number(aposta) * Number(multiplicador)) * CASA_VANTAGEM;
    const saldoAtual = await buscarSaldo();
    
    const salvo = await salvarSaldo(saldoAtual + ganhoReal);
    if (salvo) await carregarSaldoDisplay();
    return ganhoReal;
}

// =====================================================
// FUNÇÃO DE SAQUE (EDGE FUNCTION)
// =====================================================
async function processarSaque(valor, chavePix) {
    const user = await getUsuarioLogado();
    if (!user) {
        alert('⚠️ Você precisa estar logado para sacar!');
        return false;
    }

    try {
        const { data, error } = await supabase.functions.invoke('quick-endpoint', {
            body: { userId: user.id, valor: parseFloat(valor), chavePix: chavePix }
        });

        if (error) throw error;

        if (data.mensagem) {
            alert('✅ ' + data.mensagem);
        } else if (data.erro) {
            alert('❌ ' + data.erro);
            return false;
        } else {
            alert('✅ Solicitação enviada para análise!');
        }
        
        await carregarSaldoDisplay();
        return true;
    } catch (err) {
        console.error('Erro no saque:', err);
        alert('❌ Erro ao processar saque: ' + err.message);
        return false;
    }
}

// =====================================================
// INICIALIZAÇÃO E EVENTOS
// =====================================================
document.addEventListener('DOMContentLoaded', async () => {
    await carregarSaldoDisplay();

    // --- CADASTRO ---
    const btnCriarConta = document.getElementById('btn-criar-conta');
    if (btnCriarConta) {
        btnCriarConta.addEventListener('click', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('input-nome')?.value.trim();
            const email = document.getElementById('input-email')?.value.trim();
            const senha = document.getElementById('input-senha')?.value;
            const confirmar = document.getElementById('input-confirmar-senha')?.value;

            if (!nome || !email || !senha || !confirmar) return alert('⚠️ Preencha TODOS os campos!');
            if (senha.length < 6) return alert('⚠️ Senha mínima de 6 caracteres!');
            if (senha !== confirmar) return alert('⚠️ As senhas não coincidem!');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('⚠️ E-mail inválido!');

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

    // --- LOGIN ---
    const btnEntrar = document.getElementById('btn-entrar');
    if (btnEntrar) {
        btnEntrar.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('input-login-email')?.value.trim();
            const senha = document.getElementById('input-login-senha')?.value;

            if (!email || !senha) return alert('⚠️ Preencha e-mail e senha!');

            try {
                const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
                if (error) throw error;
                alert('✅ Login realizado com sucesso!');
                window.location.reload();
            } catch (err) {
                alert('❌ Erro ao entrar: ' + err.message);
            }
        });
    }

    // --- SAQUE UNIVERSAL (ENCONTRA ELEMENTOS AUTOMATICAMENTE) ---
    const botoes = Array.from(document.querySelectorAll('button'));
    const btnSaque = botoes.find(b => b.innerText.toLowerCase().includes('solicitar saque')) || 
                     document.getElementById('btn-solicitar-saque');

    if (btnSaque) {
        console.log('✅ Botão de saque detectado!');
        btnSaque.addEventListener('click', async () => {
            const inputs = Array.from(document.querySelectorAll('input'));
            
            // Tenta identificar qual input é valor e qual é PIX
            let inputValor = inputs.find(i => i.type === 'number' || i.placeholder.toLowerCase().includes('valor'));
            let inputPix = inputs.find(i => i.placeholder.toLowerCase().includes('pix') || i.value.toString().length > 8);
            
            // Fallback se não encontrar por placeholder
            if (!inputValor && inputs.length >= 2) inputValor = inputs[0];
            if (!inputPix && inputs.length >= 2) inputPix = inputs[1];

            const valorStr = inputValor?.value;
            const chavePix = inputPix?.value;

            if (!valorStr || !chavePix) return alert('⚠️ Preencha o valor e a chave Pix!');

            const valorNumerico = parseFloat(String(valorStr).replace(',', '.'));
            if (isNaN(valorNumerico) || valorNumerico <= 0) return alert('⚠️ Digite um valor válido!');

            const saldoAtual = await buscarSaldo();
            if (valorNumerico > saldoAtual) return alert('❌ Saldo insuficiente!');

            btnSaque.disabled = true;
            const textoOriginal = btnSaque.innerText;
            btnSaque.innerText = '⏳ Processando...';

            try {
                const sucesso = await processarSaque(valorNumerico, chavePix);
                if (sucesso && inputValor) inputValor.value = '';
            } finally {
                btnSaque.disabled = false;
                btnSaque.innerText = textoOriginal;
            }
        });
    } else {
        console.error('❌ Botão de saque NÃO encontrado. Botões disponíveis:', botoes.map(b => b.innerText));
    }

    // --- MINES ---
    const btnMines = document.getElementById('btn-apostar-mines');
    if (btnMines) {
        btnMines.addEventListener('click', async () => {
            const campo = document.getElementById('input-aposta-mines');
            const valor = parseFloat(campo?.value);

            if (!Number.isFinite(valor) || valor <= 0) return alert('⚠️ Digite um valor válido!');
            
            const saldo = await buscarSaldo();
            if (valor > saldo) return alert('❌ Saldo insuficiente!');

            const sucesso = await descontarSaldo(valor);
            if (sucesso) alert(`✅ Aposta de R$ ${valor.toFixed(2).replace('.', ',')} realizada! Boa sorte!`);
            else alert(' Não foi possível debitar o saldo.');
        });
    }
});

// =====================================================
// API GLOBAL PARA JOGOS
// =====================================================
window.SistemaSaldo = {
    get: buscarSaldo,
    debitar: descontarSaldo,
    ganhar: processarVitoria,
    atualizarTela: carregarSaldoDisplay
};
