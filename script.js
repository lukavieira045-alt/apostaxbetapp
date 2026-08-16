// =====================================================
// APOSTAXBET - SCRIPT.JS
// VERSÃO CORRIGIDA
// =====================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// =====================================================
// CONFIGURAÇÃO DO SUPABASE
// =====================================================

const SUPABASE_URL = 'https://jxbzjiwmajjzxgihfjgt.supabase.co';

const SUPABASE_KEY =
    'sb_publishable_XSQ0Lb5v5QD6tQ_xOao_sA_QfxqqhuJ';

const CASA_VANTAGEM = 0.95;


// =====================================================
// INICIALIZAÇÃO DO SUPABASE
// IMPORTANTE: PRIMEIRO CRIA O CLIENTE,
// DEPOIS QUALQUER FUNÇÃO PODE USÁ-LO.
// =====================================================

const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// Disponibiliza também globalmente.
// Isso evita problemas com outros scripts da página.
window.supabaseClient = supabaseClient;

// Mantém o nome "supabase" usado no restante do projeto.
const supabase = supabaseClient;


// =====================================================
// FUNÇÕES DE USUÁRIO
// =====================================================

async function getUsuarioLogado() {
    try {
        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {
            console.error('Erro ao verificar sessão:', error);
            return null;
        }

        return data?.session?.user || null;

    } catch (erro) {
        console.error('Erro na sessão:', erro);
        return null;
    }
}


// =====================================================
// BUSCAR SALDO
// =====================================================

async function buscarSaldo() {

    const user = await getUsuarioLogado();

    if (!user) {
        return 0;
    }

    try {

        const { data, error } = await supabaseClient
            .from('saldos')
            .select('valor')
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('Erro ao buscar saldo:', error);
            return 0;
        }

        if (!data) {
            return 0;
        }

        const saldo = parseFloat(data.valor);

        return Number.isFinite(saldo) ? saldo : 0;

    } catch (erro) {

        console.error('Erro ao buscar saldo:', erro);
        return 0;
    }
}


// =====================================================
// SALVAR SALDO
// =====================================================

async function salvarSaldo(novoValor) {

    const user = await getUsuarioLogado();

    if (!user) {
        return false;
    }

    const valor = Number(novoValor);

    if (!Number.isFinite(valor)) {
        return false;
    }

    try {

        const { error } = await supabaseClient
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
            console.error('Erro ao salvar saldo:', error);
            return false;
        }

        return true;

    } catch (erro) {

        console.error('Erro ao salvar saldo:', erro);
        return false;
    }
}


// =====================================================
// ATUALIZAR SALDO NA TELA
// =====================================================

async function carregarSaldoDisplay() {

    const saldo = await buscarSaldo();

    const valorFormatado =
        saldo.toFixed(2).replace('.', ',');

    document
        .querySelectorAll('#displaySaldo, .saldo')
        .forEach(el => {

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

    const valorNumerico = Number(valor);

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
        return false;
    }

    const saldoAtual = await buscarSaldo();

    if (saldoAtual < valorNumerico) {
        return false;
    }

    const novoSaldo =
        saldoAtual - valorNumerico;

    const salvo =
        await salvarSaldo(novoSaldo);

    if (salvo) {
        await carregarSaldoDisplay();
    }

    return salvo;
}


// =====================================================
// PROCESSAR VITÓRIA
// =====================================================

async function processarVitoria(aposta, multiplicador) {

    const apostaNumerica = Number(aposta);
    const multiplicadorNumerico = Number(multiplicador);

    if (
        !Number.isFinite(apostaNumerica) ||
        !Number.isFinite(multiplicadorNumerico)
    ) {
        return 0;
    }

    const ganhoReal =
        (apostaNumerica * multiplicadorNumerico)
        * CASA_VANTAGEM;

    const saldoAtual =
        await buscarSaldo();

    const salvo =
        await salvarSaldo(
            saldoAtual + ganhoReal
        );

    if (salvo) {
        await carregarSaldoDisplay();
    }

    return ganhoReal;
}


// =====================================================
// PROCESSAR SAQUE
// =====================================================

async function processarSaque(valor, chavePix) {

    const user =
        await getUsuarioLogado();

    if (!user) {

        alert(
            '⚠️ Você precisa estar logado para sacar!'
        );

        return false;
    }

    try {

        const { data, error } =
            await supabaseClient.functions.invoke(
                'quick-endpoint',
                {
                    body: {
                        userId: user.id,
                        valor: parseFloat(valor),
                        chavePix: chavePix
                    }
                }
            );

        if (error) {
            throw error;
        }

        if (data?.mensagem) {

            alert(
                '✅ ' + data.mensagem
            );

        } else if (data?.erro) {

            alert(
                '❌ ' + data.erro
            );

            return false;

        } else {

            alert(
                '✅ Solicitação enviada para análise!'
            );
        }

        await carregarSaldoDisplay();

        return true;

    } catch (err) {

        console.error(
            'Erro no saque:',
            err
        );

        alert(
            '❌ Erro ao processar saque: ' +
            (err?.message || err)
        );

        return false;
    }
}


// =====================================================
// QUANDO A PÁGINA CARREGAR
// =====================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        // =================================================
        // ATUALIZA SALDO
        // =================================================

        await carregarSaldoDisplay();


        // =================================================
        // CADASTRO
        // =================================================

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
                            .getElementById('input-nome')
                            ?.value
                            .trim();

                    const email =
                        document
                            .getElementById('input-email')
                            ?.value
                            .trim();

                    const senha =
                        document
                            .getElementById('input-senha')
                            ?.value;

                    const confirmar =
                        document
                            .getElementById(
                                'input-confirmar-senha'
                            )
                            ?.value;


                    // -----------------------------------------
                    // VALIDAÇÕES
                    // -----------------------------------------

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
                            '⚠️ A senha precisa ter no mínimo 6 caracteres!'
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


                    // -----------------------------------------
                    // CADASTRAR NO SUPABASE
                    // -----------------------------------------

                    btnCriarConta.disabled = true;

                    const textoOriginal =
                        btnCriarConta.innerText;

                    btnCriarConta.innerText =
                        '⏳ Criando conta...';


                    try {

                        const { data, error } =
                            await supabaseClient.auth.signUp(
                                {
                                    email: email,
                                    password: senha,

                                    options: {
                                        data: {
                                            full_name: nome
                                        }
                                    }
                                }
                            );


                        if (error) {
                            throw error;
                        }


                        console.log(
                            'Cadastro realizado:',
                            data
                        );


                        if (
                            data?.user &&
                            !data?.session
                        ) {

                            alert(
                                '✅ Cadastro realizado!\n\n' +
                                'Verifique seu e-mail para confirmar a conta.'
                            );

                        } else {

                            alert(
                                '✅ Conta criada com sucesso!'
                            );
                        }


                    } catch (err) {

                        console.error(
                            'Erro no cadastro:',
                            err
                        );

                        alert(
                            '❌ Erro ao criar conta:\n' +
                            (err?.message || err)
                        );

                    } finally {

                        btnCriarConta.disabled =
                            false;

                        btnCriarConta.innerText =
                            textoOriginal;
                    }
                }
            );
        }


        // =================================================
        // LOGIN
        // =================================================

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


                    btnEntrar.disabled = true;

                    const textoOriginal =
                        btnEntrar.innerText;

                    btnEntrar.innerText =
                        '⏳ Entrando...';


                    try {

                        const { data, error } =
                            await supabaseClient.auth
                                .signInWithPassword(
                                    {
                                        email: email,
                                        password: senha
                                    }
                                );


                        if (error) {
                            throw error;
                        }


                        console.log(
                            'Login realizado:',
                            data
                        );


                        alert(
                            '✅ Login realizado com sucesso!'
                        );


                        window.location.reload();


                    } catch (err) {

                        console.error(
                            'Erro no login:',
                            err
                        );

                        alert(
                            '❌ Erro ao entrar:\n' +
                            (err?.message || err)
                        );

                    } finally {

                        btnEntrar.disabled =
                            false;

                        btnEntrar.innerText =
                            textoOriginal;
                    }
                }
            );
        }


        // =================================================
        // SAQUE
        // =================================================

        const botoes =
            Array.from(
                document.querySelectorAll('button')
            );


        const btnSaque =
            botoes.find(
                b =>
                    b.innerText
                        ?.toLowerCase()
                        .includes(
                            'solicitar saque'
                        )
            ) ||
            document.getElementById(
                'btn-solicitar-saque'
            );


        if (btnSaque) {

            console.log(
                '✅ Botão de saque detectado!'
            );


            btnSaque.addEventListener(
                'click',
                async () => {

                    const inputs =
                        Array.from(
                            document.querySelectorAll(
                                'input'
                            )
                        );


                    let inputValor =
                        inputs.find(
                            i =>
                                i.type === 'number' ||
                                (
                                    i.placeholder &&
                                    i.placeholder
                                        .toLowerCase()
                                        .includes(
                                            'valor'
                                        )
                                )
                        );


                    let inputPix =
                        inputs.find(
                            i =>
                                (
                                    i.placeholder &&
                                    i.placeholder
                                        .toLowerCase()
                                        .includes(
                                            'pix'
                                        )
                                ) ||
                                (
                                    i.value &&
                                    i.value
                                        .toString()
                                        .length > 8
                                )
                        );


                    // Fallback
                    if (
                        !inputValor &&
                        inputs.length >= 2
                    ) {
                        inputValor = inputs[0];
                    }


                    if (
                        !inputPix &&
                        inputs.length >= 2
                    ) {
                        inputPix = inputs[1];
                    }


                    const valorStr =
                        inputValor?.value;

                    const chavePix =
                        inputPix?.value;


                    if (
                        !valorStr ||
                        !chavePix
                    ) {

                        alert(
                            '⚠️ Preencha o valor e a chave Pix!'
                        );

                        return;
                    }


                    const valorNumerico =
                        parseFloat(
                            String(valorStr)
                                .replace(',', '.')
                        );


                    if (
                        isNaN(valorNumerico) ||
                        valorNumerico <= 0
                    ) {

                        alert(
                            '⚠️ Digite um valor válido!'
                        );

                        return;
                    }


                    const saldoAtual =
                        await buscarSaldo();


                    if (
                        valorNumerico >
                        saldoAtual
                    ) {

                        alert(
                            '❌ Saldo insuficiente!'
                        );

                        return;
                    }


                    btnSaque.disabled = true;

                    const textoOriginal =
                        btnSaque.innerText;

                    btnSaque.innerText =
                        '⏳ Processando...';


                    try {

                        const sucesso =
                            await processarSaque(
                                valorNumerico,
                                chavePix
                            );


                        if (
                            sucesso &&
                            inputValor
                        ) {

                            inputValor.value = '';
                        }


                    } finally {

                        btnSaque.disabled =
                            false;

                        btnSaque.innerText =
                            textoOriginal;
                    }
                }
            );

        } else {

            console.error(
                '❌ Botão de saque NÃO encontrado.'
            );
        }


        // =================================================
        // MINES
        // =================================================

        const btnMines =
            document.getElementById(
                'btn-apostar-mines'
            );


        if (btnMines) {

            btnMines.addEventListener(
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


                    if (
                        !Number.isFinite(valor) ||
                        valor <= 0
                    ) {

                        alert(
                            '⚠️ Digite um valor válido!'
                        );

                        return;
                    }


                    const saldo =
                        await buscarSaldo();


                    if (valor > saldo) {

                        alert(
                            '❌ Saldo insuficiente!'
                        );

                        return;
                    }


                    const sucesso =
                        await descontarSaldo(
                            valor
                        );


                    if (sucesso) {

                        alert(
                            `✅ Aposta de R$ ${valor
                                .toFixed(2)
                                .replace('.', ',')} realizada! Boa sorte!`
                        );

                    } else {

                        alert(
                            '❌ Não foi possível debitar o saldo.'
                        );
                    }
                }
            );
        }

    }
);


// =====================================================
// API GLOBAL DOS JOGOS
// NÃO REMOVER
// =====================================================

window.SistemaSaldo = {

    get: buscarSaldo,

    debitar: descontarSaldo,

    ganhar: processarVitoria,

    atualizarTela: carregarSaldoDisplay

};


// =====================================================
// CONFIRMAÇÃO NO CONSOLE
// =====================================================

console.log(
    '✅ ApostaXBet: Supabase inicializado corretamente!'
);

console.log(
    '✅ supabaseClient disponível globalmente!'
);
