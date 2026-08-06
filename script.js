// Sistema de saldo

let saldo = Number(localStorage.getItem("saldo")) || 2;


function atualizarSaldo(){

    let campo = document.getElementById("saldo");

    if(campo){
        campo.innerHTML = 
        "R$ " + saldo.toFixed(2);
    }

    localStorage.setItem("saldo", saldo);

}


atualizarSaldo();



// Botões da carteira

let botoes = document.querySelectorAll(".botoes button");


if(botoes.length >= 2){


    botoes[0].onclick = function(){

        alert("💳 Área de depósito PIX em construção");


    };


    botoes[1].onclick = function(){

        alert("💸 Área de saque em construção");


    };


}
