// === SCRIPT.JS - VERSÃO COMPLETA COM SAQUE INTEGRADO ===
// CADASTRO + LOGIN + SALDO REAL (SUPABASE) + MINES + SAQUE PIX

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// =====================================================
// CONFIGURAÇÃO DO SUPABASE
// =====================================================

const SUPABASE_URL = 'https://jxbzjiwmajjzxgihfjgt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XSQ0Lb5v5QD6tQ_xOao_sA_QfxqqhuJ'; // Use sua anon key pública aqui

const CASA_VANTAGEM = 0.95;

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =====================================================
// USUÁRIO LOGADO
// =====================================================

async function getUsuarioLogado() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Erro ao obter sessão:', error);
        return null;
    }

    return data?.session?.user || null;
}


// =====================================================
// BUSCAR SALDO REAL
// =====================================================

async function buscarSaldo() {
    const user = await getUsuarioLogado();

    if (!user) {
        return 0;
    }

    const { data, error } = await supabase
        .from('saldos')
        .select('valor')
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Erro ao buscar saldo:', error);
        return 0;
    }

    if (!data) {
        console.log('Nenhum saldo encontrado para:', user.id);
        return 0;
    }

    const saldo = parseFloat(data.valor);
    return Number.isFinite(saldo) ? saldo : 0;
}


// =====================================================
// SALVAR SALDO
// =====================================================

async function salvarSaldo(novoValor) {
    const user = await getUsuarioLogado();

    if (!user) {
        console.error('Usuário não está logado.');
        return false;
    }

    const valor = Number(novoValor);

    if (!Number.isFinite(valor)) {
        console.error('Valor de saldo inválido:', novoValor);
        return false;
    }

    const { error } = await supabase
        .from('saldos')
        .upsert(
            { user_id: user.id, valor: valor },
            { onConflict: 'user_id' }
        );

    if (error) {
        console.error('Erro ao salvar saldo:', error);
        return false;
    }

    return true;
}


// =====================================================
// ATUALIZAR SALDO NA TELA
// =====================================================

async function carregarSaldoDisplay() {
    const saldo = await buscarSaldo();

    const valorFormatado = saldo.toFixed(2).replace('.', ',');

    const displays = document.querySelectorAll('#displaySaldo, .saldo');

    displays.forEach(el => {
        el.innerText = `R$ ${valorFormatado}`;
        el.style.color = saldo < 10 ? '#ff4d4d' : '#00ed91';
    });

    return saldo;
}


// =====================================================
// DESCONTAR SALDO
// =====================================================

async function descontarSaldo(valor) {
    const valorAposta = Number(valor);

    if (!Number.isFinite(valorAposta) || valorAposta <= 0) {
        return false;
    }

    const saldoAtual = await buscarSaldo();

    if (saldoAtual < valorAposta) {
        console.log('Saldo insuficiente.');
        return false;
    }

    const novoSaldo = saldoAtual - valorAposta;
    const salvo = await salvarSaldo(novoSaldo);

    if (!salvo) {
        return false;
    }

    await carregarSaldoDisplay();
    return true;
}


// =====================================================
// PROCESSAR VITÓRIA
// =====================================================

async function processarVitoria(aposta, multiplicador) {
    const valorAposta = Number(aposta);
    const mult = Number(multiplicador);

    if (!Number.isFinite(valorAposta) || !Number.isFinite(mult)) {
        return 0;
    }

    const saldoAtual = await buscarSaldo();
    const ganhoReal = (valorAposta * mult) * CASA_VANTAGEM;
    const novoSaldo = saldoAtual + ganhoReal;

    const salvo = await salvarSaldo(novoSaldo);

    if (!salvo) {
        return 0;
    }

    await carregarSaldoDisplay();
    return ganhoReal;
}


// =====================================================
// FUNÇÃO DE SAQUE (INTEGRAÇÃO COM EDGE FUNCTION)
// =====================================================

async function processarSaque(valor, chavePix) {
    const user = await getUsuarioLogado();
    
    if (!user) {
        alert('⚠️ Você precisa estar logado para sacar!');
        return false;
    }

    try {
        // Chama a Edge Function 'quick-endpoint'
        const { data, error } = await supabase.functions.invoke('quick-endpoint', {
            body: {
                userId: user.id,
                valor: parseFloat(valor),
                chavePix: chavePix
            }
        });

        if (error) {
            console.error('Erro ao chamar função:', error);
            alert('❌ Erro ao processar saque: ' + error.message);
            return false;
        }

        // Se chegou aqui, a função respondeu
        if (data.mensagem) {
            alert('✅ ' + data.mensagem);
            await carregarSaldoDisplay();
            return true;
        } else if (data.erro) {
            alert('❌ ' + data.erro);
            return false;
        } else {
            alert('✅ Solicitação enviada para análise!');
            await carregarSaldoDisplay();
            return true;
        }

    } catch (err) {
        console.error('Erro inesperado:', err);
        alert('❌ Ocorreu um erro inesperado. Tente novamente.');
        return false;
    }
}


// =====================================================
// CADASTRO + LOGIN + EVENTOS GERAIS
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    carregarSaldoDisplay();

    // =============================================
    // BOTÃO CRIAR CONTA
    // =============================================
    const btnCriarConta = document.getElementById('btn-criar-conta');
    if (btnCriarConta) {
        btnCriarConta.addEventListener('click', async (e) => {
            e.preventDefault();

            const nome = document.getElementById('input-nome')?.value.trim();
            const email = document.getElementById('input-email')?.value.trim();
            const senha = document.getElementById('input-senha')?.value;
            const confirmar = document.getElementById('input-confirmar-senha')?.value;

            if (!nome || !email || !senha || !confirmar) {
                alert('⚠️ Preencha TODOS os campos!');
                return;
            }

            if (senha.length < 6) {
                alert('⚠️ Senha mínima de 6 caracteres!');
                return;
            }

            if (senha !== confirmar) {
                alert('⚠️ As senhas não coincidem!');
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert('⚠️ E-mail inválido!');
                return;
            }

            try {
                const { error } = await supabase.auth.signUp({
                    email,
                    password: senha,
                    options: { data: { full_name: nome } }
                });

                if (error) throw error;

                alert('✅ Cadastro realizado! Verifique seu e-mail.');
            } catch (err) {
                alert('❌ Erro ao criar conta: ' + err.message);
            }
        });
    }

    // =============================================
    // LOGIN
    // =============================================
    const btnEntrar = document.getElementById('btn-entrar');
    if (btnEntrar) {
        btnEntrar.addEventListener('click', async (e) => {
            e.preventDefault();

            const email = document.getElementById('input-login-email')?.value.trim();
            const senha = document.getElementById('input-login-senha')?.value;

            if (!email || !senha) {
                alert('⚠️ Preencha e-mail e senha!');
                return;
            }

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password: senha
                });

                if (error) throw error;

                console.log('Usuário logado:', data.user);
                alert('✅ Login realizado com sucesso!');
                window.location.reload();
            } catch (err) {
                alert('❌ Erro ao entrar: ' + err.message);
            }
        });
    }

    // =============================================
    // BOTÃO DE SAQUE (NOVO!)
    // ⚠️ VERIFIQUE SE OS IDs ABAIXO SÃO IGUAIS AO SEU HTML
    // =============================================
    const btnSolicitarSaque = document.getElementById('btn-solicitar-saque'); 
    
    if (btnSolicitarSaque) {
        btnSolicitarSaque.addEventListener('click', async () => {
            
            // AJUSTE ESTES IDs CONFORME SEU HTML
            const inputValor = document.getElementById('input-valor-saque'); 
            const inputPix = document.getElementById('input-chave-pix');     
            
            const valor = inputValor?.value;
            const chavePix = inputPix?.value;

            if (!valor || !chavePix) {
                alert('⚠️ Preencha o valor e a chave Pix!');
                return;
            }

            const valorNumerico = parseFloat(valor.replace(',', '.'));
            
            if (isNaN(valorNumerico) || valorNumerico <= 0) {
                alert('⚠️ Digite um valor válido!');
                return;
            }

            const saldoAtual = await buscarSaldo();
            if (valorNumerico > saldoAtual) {
                alert(' Saldo insuficiente!');
                return;
            }

            btnSolicitarSaque.disabled = true;
            btnSolicitarSaque.innerText = 'Processando...';

            const sucesso = await processarSaque(valorNumerico, chavePix);

            btnSolicitarSaque.disabled = false;
            btnSolicitarSaque.innerText = '💵 Solicitar saque';
        });
    }
});


// =====================================================
// SISTEMA GLOBAL DOS JOGOS
// =====================================================

window.SistemaSaldo = {
    get: buscarSaldo,
    debitar: descontarSaldo,
    ganhar: processarVitoria,
    atualizarTela: carregarSaldoDisplay
};


// =====================================================
// MINES
// =====================================================

const btnApostarMines = document.getElementById('btn-apostar-mines');

if (btnApostarMines) {
    btnApostarMines.addEventListener('click', async () => {
        const campo = document.getElementById('input-aposta-mines');
        const valor = parseFloat(campo?.value);

        if (!Number.isFinite(valor) || valor <= 0) {
            alert('⚠️ Digite um valor válido!');
            return;
        }

        const saldo = await window.SistemaSaldo.get();

        if (valor > saldo) {
            alert('❌ Saldo insuficiente!');
            return;
        }

        const sucesso = await window.SistemaSaldo.debitar(valor);

        if (!sucesso) {
            alert('❌ Não foi possível debitar o saldo.');
            return;
        }

        alert(`✅ Aposta de R$ ${valor.toFixed(2).replace('.', ',')} realizada! Boa sorte!`);
    });
}
