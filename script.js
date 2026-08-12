// === SCRIPT.JS - VERSÃO COMPLETA ===
// CADASTRO + LOGIN + SALDO REAL (SUPABASE) + MINES

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// =====================================================
// CONFIGURAÇÃO DO SUPABASE
// =====================================================

const SUPABASE_URL = 'https://jxbzjiwmajjzxgihfjgt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XSQ0Lb5v5QD6tQ_xOao_sA_QfxqqhuJ';

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

        console.error(
            'Erro ao buscar saldo:',
            error
        );

        return 0;
    }

    if (!data) {

        console.log(
            'Nenhum saldo encontrado para:',
            user.id
        );

        return 0;
    }

    const saldo = parseFloat(data.valor);

    return Number.isFinite(saldo)
        ? saldo
        : 0;
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
            {
                user_id: user.id,
                valor: valor
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

async function carregarSaldoDisplay() {

    const saldo = await buscarSaldo();

    const valorFormatado = saldo
        .toFixed(2)
        .replace('.', ',');

    const displays = document.querySelectorAll(
        '#displaySaldo, .saldo'
    );

    displays.forEach(el => {

        el.innerText = `R$ ${valorFormatado}`;

        el.style.color =
            saldo < 10
                ? '#ff4d4d'
                : '#00ed91';

    });

    return saldo;
}


// =====================================================
// DESCONTAR SALDO
// =====================================================

async function descontarSaldo(valor) {

    const valorAposta = Number(valor);

    if (
        !Number.isFinite(valorAposta) ||
        valorAposta <= 0
    ) {
        return false;
    }

    const saldoAtual = await buscarSaldo();

    if (saldoAtual < valorAposta) {

        console.log(
            'Saldo insuficiente.'
        );

        return false;
    }

    const novoSaldo =
        saldoAtual - valorAposta;

    const salvo =
        await salvarSaldo(novoSaldo);

    if (!salvo) {
        return false;
    }

    await carregarSaldoDisplay();

    return true;
}


// =====================================================
// PROCESSAR VITÓRIA
// =====================================================

async function processarVitoria(
    aposta,
    multiplicador
) {

    const valorAposta = Number(aposta);
    const mult = Number(multiplicador);

    if (
        !Number.isFinite(valorAposta) ||
        !Number.isFinite(mult)
    ) {
        return 0;
    }

    const saldoAtual =
        await buscarSaldo();

    const ganhoReal =
        (valorAposta * mult) *
        CASA_VANTAGEM;

    const novoSaldo =
        saldoAtual + ganhoReal;

    const salvo =
        await salvarSaldo(novoSaldo);

    if (!salvo) {
        return 0;
    }

    await carregarSaldoDisplay();

    return ganhoReal;
}


// =====================================================
// CADASTRO
// =====================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        carregarSaldoDisplay();


        // =============================================
        // BOTÃO CRIAR CONTA
        // =============================================

        const btnCriarConta =
            document.getElementById(
                'btn-criar-conta'
            );

        if (btnCriarConta) {

            btnCriarConta.addEventListener(
                'click',
                async (e) => {

                    e.preventDefault();

                    const nome =
                        document
                            .getElementById(
                                'input-nome'
                            )
                            ?.value
                            .trim();

                    const email =
                        document
                            .getElementById(
                                'input-email'
                            )
                            ?.value
                            .trim();

                    const senha =
                        document
                            .getElementById(
                                'input-senha'
                            )
                            ?.value;

                    const confirmar =
                        document
                            .getElementById(
                                'input-confirmar-senha'
                            )
                            ?.value;


                    if (
                        !nome ||
                        !email ||
                        !senha ||
                        !confirmar
                    ) {

                        alert(
                            '⚠️ Preencha TODOS os campos!'
                        );

                        return;
                    }


                    if (senha.length < 6) {

                        alert(
                            '⚠️ Senha mínima de 6 caracteres!'
                        );

                        return;
                    }


                    if (senha !== confirmar) {

                        alert(
                            '⚠️ As senhas não coincidem!'
                        );

                        return;
                    }


                    if (
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                            .test(email)
                    ) {

                        alert(
                            '⚠️ E-mail inválido!'
                        );

                        return;
                    }


                    try {

                        const {
                            error
                        } =
                            await supabase.auth.signUp({
                                email,
                                password: senha,

                                options: {
                                    data: {
                                        full_name: nome
                                    }
                                }
                            });


                        if (error) {
                            throw error;
                        }


                        alert(
                            '✅ Cadastro realizado! Verifique seu e-mail.'
                        );

                    } catch (err) {

                        alert(
                            '❌ Erro ao criar conta: ' +
                            err.message
                        );

                    }

                }
            );

        }


        // =============================================
        // LOGIN
        // =============================================

        const btnEntrar =
            document.getElementById(
                'btn-entrar'
            );

        if (btnEntrar) {

            btnEntrar.addEventListener(
                'click',
                async (e) => {

                    e.preventDefault();

                    const email =
                        document
                            .getElementById(
                                'input-login-email'
                            )
                            ?.value
                            .trim();

                    const senha =
                        document
                            .getElementById(
                                'input-login-senha'
                            )
                            ?.value;


                    if (!email || !senha) {

                        alert(
                            '⚠️ Preencha e-mail e senha!'
                        );

                        return;
                    }


                    try {

                        const {
                            data,
                            error
                        } =
                            await supabase.auth
                                .signInWithPassword({
                                    email,
                                    password: senha
                                });


                        if (error) {
                            throw error;
                        }


                        console.log(
                            'Usuário logado:',
                            data.user
                        );


                        alert(
                            '✅ Login realizado com sucesso!'
                        );


                        window.location.reload();


                    } catch (err) {

                        alert(
                            '❌ Erro ao entrar: ' +
                            err.message
                        );

                    }

                }
            );

        }

    }
);


// =====================================================
// SISTEMA GLOBAL DOS JOGOS
// =====================================================

window.SistemaSaldo = {

    get: buscarSaldo,

    debitar: descontarSaldo,

    ganhar: processarVitoria,

    atualizarTela:
        carregarSaldoDisplay

};


// =====================================================
// MINES
// =====================================================

const btnApostarMines =
    document.getElementById(
        'btn-apostar-mines'
    );


if (btnApostarMines) {

    btnApostarMines.addEventListener(
        'click',
        async () => {

            const campo =
                document.getElementById(
                    'input-aposta-mines'
                );

            const valor =
                parseFloat(
                    campo?.value
                );


            // =========================================
            // VALIDAÇÃO
            // =========================================

            if (
                !Number.isFinite(valor) ||
                valor <= 0
            ) {

                alert(
                    '⚠️ Digite um valor válido!'
                );

                return;
            }


            // =========================================
            // BUSCAR SALDO
            // =========================================

            const saldo =
                await window.SistemaSaldo.get();


            // =========================================
            // VERIFICAR SALDO
            // =========================================

            if (valor > saldo) {

                alert(
                    '❌ Saldo insuficiente!'
                );

                return;
            }


            // =========================================
            // DEBITAR
            // =========================================

            const sucesso =
                await window.SistemaSaldo
                    .debitar(valor);


            if (!sucesso) {

                alert(
                    '❌ Não foi possível debitar o saldo.'
                );

                return;
            }


            alert(
                `✅ Aposta de R$ ${valor
                    .toFixed(2)
                    .replace('.', ',')} realizada! Boa sorte!`
            );

        }
    );

}
