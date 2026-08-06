let saldo = Number(localStorage.getItem("saldo")) || 1000;


function atualizarSaldo(){

    let campo = document.getElementById("saldo");

    if(campo){
        campo.innerHTML = "R$ " + saldo.toFixed(2);
    }

    localStorage.setItem("saldo", saldo);

}


atualizarSaldo();



// Botões da carteira

let botoes = document.querySelectorAll(".botoes button");


if(botoes.length >= 2){

    botoes[0].onclick = function(){

        saldo += 100;

        atualizarSaldo();

        alert("💰 Adicionado R$100 de teste");

    };


    botoes[1].onclick = function(){

        alert("💸 Saque de teste");

    };

}
