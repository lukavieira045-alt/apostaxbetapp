// =====================================================
// APOSTAXBET - SCRIPT.JS
// VERSÃO CORRIGIDA - SUPABASE
// =====================================================

(function () {

"use strict";

// =====================================================
// CONFIGURAÇÃO SUPABASE
// =====================================================

const SUPABASE_URL =
    "https://jxbzjiwmajjzxgihfjgt.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_XSQ0Lb5v5QD6tQ_xOao_sA_QfxqqhuJ";

const CASA_VANTAGEM = 0.95;


// =====================================================
// VERIFICAR SUPABASE
// =====================================================

if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
) {

    console.error(
        "❌ Biblioteca Supabase não foi carregada."
    );

    alert(
        "❌ Erro: o Supabase não foi carregado. Recarregue a página."
    );

    return;
}


// =====================================================
// CRIAR CLIENTE SUPABASE
// =====================================================
// IMPORTANTE:
// Não usamos `const supabaseClient`.
// Usamos diretamente window.supabaseClient.
// Isso evita o erro:
// Cannot access 'supabaseClient' before initialization
// =====================================================

window.supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// =====================================================
// FUNÇÃO AUXILIAR
// =====================================================

function clienteSupabase() {

    return window.supabaseClient;
}


// =====================================================
// USUÁRIO LOGADO
// =====================================================

async function getUsuarioLogado() {

    try {

        const { data, error } =
            await clienteSupabase()
                .auth
                .getSession();

        if (error) {

            console.error(
                "Erro ao verificar sessão:",
                error
            );

            return null;
        }

        return data?.session?.user || null;

    } catch (erro) {

        console.error(
            "Erro na sessão:",
            erro
        );

        return null;
    }
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

    try {

        const { data, error } =
            await clienteSupabase()
                .from("saldos")
                .select("valor")
                .eq("user_id", user.id)
                .maybeSingle();

        if (error) {

            console.error(
                "Erro ao buscar saldo:",
                error
            );

            return 0;
        }

        if (!data) {

            return 0;
        }

        const saldo =
            parseFloat(data.valor);

        return Number.isFinite(saldo)
            ? saldo
            : 0;

    } catch (erro) {

        console.error(
            "Erro ao buscar saldo:",
            erro
        );

        return 0;
    }
}


// =====================================================
// SALVAR SALDO
// =====================================================

async function salvarSaldo(novoValor) {

    const user =
        await getUsuarioLogado();

    if (!user) {

        console.error(
            "Usuário não está logado."
        );

        return false;
    }

    const valor =
        Number(novoValor);

    if (!Number.isFinite(valor)) {

        console.error(
            "Valor de saldo inválido."
        );

        return false;
    }

    try {

        const { error } =
            await clienteSupabase()
                .from("saldos")
                .upsert(
                    {
                        user_id: user.id,
                        valor: valor
                    },
                    {
                        onConflict: "user_id"
                    }
                );

        if (error) {

            console.error(
                "Erro ao salvar saldo:",
                error
            );

            return false;
        }

        return true;

    } catch (erro) {

        console.error(
            "Erro ao salvar saldo:",
            erro
        );

        return false;
    }
}


// =====================================================
// ATUALIZAR SALDO NA TELA
// =====================================================

async function carregarSaldoDisplay() {

    const saldo =
        await buscarSaldo();

    const valorFormatado =
        saldo
            .toFixed(2)
            .replace(".", ",");


    document
        .querySelectorAll(
            "#displaySaldo, .saldo"
        )
        .forEach(function (el) {

            // Não duplica "R$" caso o elemento
            // já possua esse texto no HTML.
            if (
                el.id === "displaySaldo"
            ) {

                el.innerText =
                    "R$ " + valorFormatado;

            } else {

                // Para o elemento .saldo
                // preserva o texto original
                // quando ele possui "R$".
                const span =
                    el.querySelector(
                        "#saldoValor"
                    );

                if (span) {

                    span.innerText =
                        valorFormatado;

                } else {

                    el.innerText =
                        "💰 Saldo: R$ " +
                        valorFormatado;
                }
            }

            el.style.color =
                saldo < 10
                    ? "#ff4d4d"
                    : "#00ed91";

        });


    // Compatibilidade com o HTML
    const saldoValor =
        document.getElementById(
            "saldoValor"
        );

    if (saldoValor) {

        saldoValor.innerText =
            valorFormatado;
    }


    const contaSaldo =
        document.getElementById(
            "contaSaldo"
        );

    if (contaSaldo) {

        contaSaldo.innerText =
            valorFormatado;
    }


    return saldo;
}


// =====================================================
// DESCONTAR SALDO
// =====================================================

async function descontarSaldo(valor) {

    const valorNumerico =
        Number(valor);

    if (
        !Number.isFinite(valorNumerico) ||
        valorNumerico <= 0
    ) {

        return false;
    }


    const saldoAtual =
        await buscarSaldo();


    if (
        saldoAtual <
        valorNumerico
    ) {

        return false;
    }


    const novoSaldo =
        saldoAtual -
        valorNumerico;


    const salvo =
        await salvarSaldo(
            novoSaldo
        );


    if (salvo) {

        await carregarSaldoDisplay();
    }


    return salvo;
}


// =====================================================
// PROCESSAR VITÓRIA
// =====================================================

async function processarVitoria(
    aposta,
    multiplicador
) {

    const apostaNumerica =
        Number(aposta);

    const multiplicadorNumerico =
        Number(multiplicador);


    if (
        !Number.isFinite(apostaNumerica) ||
        !Number.isFinite(multiplicadorNumerico)
    ) {

        return 0;
    }


    const ganhoReal =
        (
            apostaNumerica *
            multiplicadorNumerico
        ) * CASA_VANTAGEM;


    const saldoAtual =
        await buscarSaldo();


    const salvo =
        await salvarSaldo(
            saldoAtual +
            ganhoReal
        );


    if (salvo) {

        await carregarSaldoDisplay();
    }


    return ganhoReal;
}


// =====================================================
// PROCESSAR SAQUE
// =====================================================

async function processarSaque(
    valor,
    chavePix
) {

    const user =
        await getUsuarioLogado();


    if (!user) {

        alert(
            "⚠️ Você precisa estar logado para sacar!"
        );

        return false;
    }


    const valorNumerico =
        Number(valor);


    if (
        !Number.isFinite(valorNumerico) ||
        valorNumerico <= 0
    ) {

        alert(
            "❌ Valor de saque inválido."
        );

        return false;
    }


    if (!chavePix) {

        alert(
            "❌ Informe sua chave Pix."
        );

        return false;
    }


    try {

        const { data, error } =
            await clienteSupabase()
                .functions
                .invoke(
                    "quick-endpoint",
                    {
                        body: {
                            userId: user.id,
                            valor: valorNumerico,
                            chavePix: chavePix
                        }
                    }
                );


        if (error) {

            throw error;
        }


        if (data?.mensagem) {

            alert(
                "✅ " +
                data.mensagem
            );

        } else if (data?.erro) {

            alert(
                "❌ " +
                data.erro
            );

            return false;

        } else {

            alert(
                "✅ Solicitação enviada para análise!"
            );
        }


        await carregarSaldoDisplay();

        return true;

    } catch (err) {

        console.error(
            "Erro no saque:",
            err
        );


        alert(
            "❌ Erro ao processar saque:\n" +
            (
                err?.message ||
                String(err)
            )
        );


        return false;
    }
}


// =====================================================
// CADASTRO
// =====================================================

async function realizarCadastro(
    nome,
    email,
    senha
) {

    try {

        const { data, error } =
            await clienteSupabase()
                .auth
                .signUp({

                    email: email,

                    password: senha,

                    options: {

                        data: {
                            nome: nome,
                            full_name: nome
                        }
                    }
                });


        if (error) {

            throw error;
        }


        console.log(
            "✅ Cadastro realizado:",
            data
        );


        return {
            sucesso: true,
            data: data
        };


    } catch (erro) {

        console.error(
            "❌ Erro no cadastro:",
            erro
        );


        return {
            sucesso: false,
            erro: erro
        };
    }
}


// =====================================================
// LOGIN
// =====================================================

async function realizarLogin(
    email,
    senha
) {

    try {

        const { data, error } =
            await clienteSupabase()
                .auth
                .signInWithPassword({

                    email: email,
                    password: senha

                });


        if (error) {

            throw error;
        }


        return {
            sucesso: true,
            data: data
        };


    } catch (erro) {

        console.error(
            "❌ Erro no login:",
            erro
        );


        return {
            sucesso: false,
            erro: erro
        };
    }
}


// =====================================================
// DOM READY
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "✅ ApostaXBet: Supabase inicializado corretamente!"
        );


        console.log(
            "✅ window.supabaseClient disponível!"
        );


        // =============================================
        // ATUALIZAR SALDO
        // =============================================

        await carregarSaldoDisplay();


        // =============================================
        // BOTÃO CADASTRO
        // =============================================

        const btnCriarConta =
            document.getElementById(
                "btn-criar-conta"
            );


        if (btnCriarConta) {

            btnCriarConta.addEventListener(
                "click",
                async function (e) {

                    e.preventDefault();


                    const nome =
                        document
                            .getElementById(
                                "input-nome"
                            )
                            ?.value
                            .trim();


                    const email =
                        document
                            .getElementById(
                                "input-email"
                            )
                            ?.value
                            .trim();


                    const senha =
                        document
                            .getElementById(
                                "input-senha"
                            )
                            ?.value;


                    const confirmar =
                        document
                            .getElementById(
                                "input-confirmar-senha"
                            )
                            ?.value;


                    if (
                        !nome ||
                        !email ||
                        !senha ||
                        !confirmar
                    ) {

                        alert(
                            "⚠️ Preencha todos os campos!"
                        );

                        return;
                    }


                    if (
                        senha.length < 6
                    ) {

                        alert(
                            "⚠️ A senha precisa ter pelo menos 6 caracteres!"
                        );

                        return;
                    }


                    if (
                        senha !== confirmar
                    ) {

                        alert(
                            "⚠️ As senhas não coincidem!"
                        );

                        return;
                    }


                    const emailValido =
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                            .test(email);


                    if (!emailValido) {

                        alert(
                            "⚠️ Digite um e-mail válido!"
                        );

                        return;
                    }


                    btnCriarConta.disabled =
                        true;


                    const textoOriginal =
                        btnCriarConta.innerText;


                    btnCriarConta.innerText =
                        "⏳ Criando conta...";


                    try {

                        const resultado =
                            await realizarCadastro(
                                nome,
                                email,
                                senha
                            );


                        if (
                            !resultado.sucesso
                        ) {

                            throw resultado.erro;
                        }


                        const data =
                            resultado.data;


                        if (
                            data?.user &&
                            !data?.session
                        ) {

                            alert(
                                "✅ Cadastro realizado!\n\n" +
                                "Verifique seu e-mail para confirmar a conta."
                            );

                        } else {

                            alert(
                                "✅ Conta criada com sucesso!"
                            );
                        }


                    } catch (err) {

                        console.error(
                            "Erro no cadastro:",
                            err
                        );


                        alert(
                            "❌ Erro ao criar conta:\n" +
                            traduzirErro(
                                err?.message ||
                                String(err)
                            )
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


        // =============================================
        // BOTÃO LOGIN
        // =============================================

        const btnEntrar =
            document.getElementById(
                "btn-entrar"
            );


        if (btnEntrar) {

            btnEntrar.addEventListener(
                "click",
                async function (e) {

                    e.preventDefault();


                    const email =
                        document
                            .getElementById(
                                "input-login-email"
                            )
                            ?.value
                            .trim();


                    const senha =
                        document
                            .getElementById(
                                "input-login-senha"
                            )
                            ?.value;


                    if (
                        !email ||
                        !senha
                    ) {

                        alert(
                            "⚠️ Preencha e-mail e senha!"
                        );

                        return;
                    }


                    btnEntrar.disabled =
                        true;


                    const textoOriginal =
                        btnEntrar.innerText;


                    btnEntrar.innerText =
                        "⏳ Entrando...";


                    try {

                        const resultado =
                            await realizarLogin(
                                email,
                                senha
                            );


                        if (
                            !resultado.sucesso
                        ) {

                            throw resultado.erro;
                        }


                        alert(
                            "✅ Login realizado com sucesso!"
                        );


                        window.location.reload();


                    } catch (err) {

                        console.error(
                            "Erro no login:",
                            err
                        );


                        alert(
                            "❌ Erro ao entrar:\n" +
                            traduzirErro(
                                err?.message ||
                                String(err)
                            )
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


        // =============================================
        // BOTÃO MINES
        // =============================================

        const btnMines =
            document.getElementById(
                "btn-apostar-mines"
            );


        if (btnMines) {

            btnMines.addEventListener(
                "click",
                async function () {

                    const campo =
                        document.getElementById(
                            "input-aposta-mines"
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
                            "⚠️ Digite um valor válido!"
                        );

                        return;
                    }


                    const saldo =
                        await buscarSaldo();


                    if (
                        valor > saldo
                    ) {

                        alert(
                            "❌ Saldo insuficiente!"
                        );

                        return;
                    }


                    const sucesso =
                        await descontarSaldo(
                            valor
                        );


                    if (sucesso) {

                        alert(
                            "✅ Aposta de R$ " +
                            valor
                                .toFixed(2)
                                .replace(".", ",") +
                            " realizada!"
                        );

                    } else {

                        alert(
                            "❌ Não foi possível debitar o saldo."
                        );
                    }
                }
            );
        }

    }
);


// =====================================================
// API GLOBAL DOS JOGOS
// =====================================================

window.SistemaSaldo = {

    get: buscarSaldo,

    debitar: descontarSaldo,

    ganhar: processarVitoria,

    atualizarTela:
        carregarSaldoDisplay,

    salvar:
        salvarSaldo

};


// =====================================================
// FUNÇÕES GLOBAIS
// =====================================================

window.ApostaXBet = {

    supabase:
        window.supabaseClient,

    getUsuarioLogado:
        getUsuarioLogado,

    buscarSaldo:
        buscarSaldo,

    salvarSaldo:
        salvarSaldo,

    descontarSaldo:
        descontarSaldo,

    processarVitoria:
        processarVitoria,

    processarSaque:
        processarSaque,

    cadastrar:
        realizarCadastro,

    login:
        realizarLogin

};


// =====================================================
// TRADUÇÃO DE ERROS
// =====================================================

function traduzirErro(erro) {

    if (!erro) {

        return "Ocorreu um erro.";
    }


    const texto =
        String(erro)
            .toLowerCase();


    if (
        texto.includes(
            "invalid login credentials"
        )
    ) {

        return "E-mail ou senha incorretos.";
    }


    if (
        texto.includes(
            "user already registered"
        )
    ) {

        return "Esse e-mail já está cadastrado.";
    }


    if (
        texto.includes(
            "email rate limit exceeded"
        )
    ) {

        return "Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.";
    }


    if (
        texto.includes(
            "password should be at least"
        )
    ) {

        return "A senha precisa ter pelo menos 6 caracteres.";
    }


    if (
        texto.includes(
            "unable to validate email address"
        )
    ) {

        return "Digite um e-mail válido.";
    }


    if (
        texto.includes(
            "email not confirmed"
        )
    ) {

        return "Confirme seu e-mail antes de entrar.";
    }


    if (
        texto.includes(
            "database error saving new user"
        )
    ) {

        return "O cadastro chegou ao Supabase, mas existe um problema na configuração do banco de dados. Verifique as configurações de cadastro do Supabase.";
    }


    if (
        texto.includes(
            "cannot access"
        ) &&
        texto.includes(
            "before initialization"
        )
    ) {

        return "Erro de inicialização do Supabase. Verifique se existe outro script criando ou usando supabaseClient antes deste arquivo.";
    }


    return String(erro);
}


console.log(
    "✅ ApostaXBet carregado."
);

console.log(
    "✅ Supabase Client:",
    window.supabaseClient
);

})();
