let saldo = localStorage.getItem("saldo");

if (saldo === null) {
    saldo = 2.00;
    localStorage.setItem("saldo", saldo);
}

function mostrarSaldo() {
    const elemento = document.getElementById("saldo");
    if (elemento) {
        elemento.innerText = "💰 Saldo: R$ " + Number(saldo).toFixed(2);
    }
}

function alterarSaldo(valor) {
    saldo = Number(localStorage.getItem("saldo")) + valor;
    localStorage.setItem("saldo", saldo);
    mostrarSaldo();
}
