// Saldo inicial
let saldo = Number(localStorage.getItem("saldo") || 2);

// Atualiza o saldo na tela
function atualizarSaldo() {
    document.getElementById("saldo").textContent =
        "R$ " + saldo.toFixed(2);

    localStorage.setItem("saldo", saldo);
}

atualizarSaldo();

// Botões (temporário)
const botoes = document.querySelectorAll(".acoes button");

botoes[0].addEventListener("click", () => {
    alert("Depósito via PIX (em breve).");
});

botoes[1].addEventListener("click", () => {
    alert("Saque (em breve).");
});
