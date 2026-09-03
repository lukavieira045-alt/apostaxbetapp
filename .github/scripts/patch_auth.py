from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

def replace_once(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'Bloco esperado nao encontrado: {label}')
    s = s.replace(old, new, 1)

replace_once('''<label>E-mail</label>\n<input id="emailCadastro" type="email" placeholder="Digite seu e-mail" required>\n\n<label>Telefone</label>\n<input id="telefoneCadastro" type="tel" placeholder="Digite seu telefone" required>\n<label>CPF</label>\n<input id="cpfCadastro" type="text" inputmode="numeric" maxlength="14" placeholder="Digite seu CPF" required>''', '''<label>Celular</label>\n<input id="telefoneCadastro" type="tel" inputmode="tel" autocomplete="tel" placeholder="Digite seu número de celular" required>''', 'campos cadastro')

replace_once('''<label>E-mail</label>\n<input id="emailLogin" type="email" placeholder="Digite seu e-mail" required>''', '''<label>Celular</label>\n<input id="telefoneLogin" type="tel" inputmode="tel" autocomplete="tel" placeholder="Digite seu número de celular" required>''', 'campo login')

replace_once('''\n<button type="button" class="esqueci" onclick="mostrarRecuperacao()">\nEsqueci minha senha?\n</button>\n''', '\n', 'link recuperacao por email')

start = s.index('async function cadastrar(event){')
end = s.index('/* ========================= LOGIN ========================= */', start)
new_cadastro = '''async function cadastrar(event){\n    event.preventDefault();\n\n    const nome=document.getElementById("nomeCadastro").value.trim();\n    const telefoneDigitado=document.getElementById("telefoneCadastro").value.trim();\n    const senha=document.getElementById("senhaCadastro").value;\n    const confirmar=document.getElementById("confirmarSenha").value;\n    const botao=document.getElementById("btnCadastro");\n\n    if(senha!==confirmar){\n        mensagem("mensagemCadastro","As senhas não são iguais.","erro");\n        return;\n    }\n\n    if(senha.length<6){\n        mensagem("mensagemCadastro","A senha precisa ter pelo menos 6 caracteres.","erro");\n        return;\n    }\n\n    if(!telefoneDigitado){\n        mensagem("mensagemCadastro","Digite seu número de celular.","erro");\n        return;\n    }\n\n    const numeros=telefoneDigitado.replace(/\\D/g,"");\n    const telefone=telefoneDigitado.startsWith("+")\n        ?"+"+numeros\n        :(numeros.length===10||numeros.length===11?"+55"+numeros:"");\n\n    if(!telefone){\n        mensagem("mensagemCadastro","Digite um celular válido com DDD.","erro");\n        return;\n    }\n\n    botao.disabled=true;\n    botao.innerText="CRIANDO CONTA...";\n\n    try{\n        const {data,error}=await clienteSupabase().auth.signUp({\n            phone:telefone,\n            password:senha,\n            options:{data:{nome,full_name:nome,telefone,phone:telefone}}\n        });\n\n        if(error)throw error;\n\n        if(data?.session){\n            sessionStorage.removeItem("apostaxbet_logout");\n            mensagem("mensagemCadastro","Conta criada com sucesso! Entrando...","sucesso");\n            setTimeout(()=>mostrarSite(data.session.user),500);\n        }else{\n            mensagem("mensagemCadastro","Conta criada, mas a sessão automática não foi liberada. Desative a confirmação de telefone no Supabase para entrar imediatamente.","erro");\n        }\n    }catch(error){\n        mensagem("mensagemCadastro",traduzirErro(error?.message||error),"erro");\n    }\n\n    botao.disabled=false;\n    botao.innerText="CRIAR CONTA";\n}\n\n'''
s = s[:start] + new_cadastro + s[end:]

start = s.index('async function entrar(event){')
end = s.index('/* ========================= DADOS DA CONTA ========================= */', start)
new_login = '''async function entrar(event){\n    event.preventDefault();\n\n    const telefoneDigitado=document.getElementById("telefoneLogin").value.trim();\n    const senha=document.getElementById("senhaLogin").value;\n    const botao=document.getElementById("btnLogin");\n\n    if(!telefoneDigitado){\n        mensagem("mensagemLogin","Digite seu número de celular.","erro");\n        return;\n    }\n\n    const numeros=telefoneDigitado.replace(/\\D/g,"");\n    const telefone=telefoneDigitado.startsWith("+")\n        ?"+"+numeros\n        :(numeros.length===10||numeros.length===11?"+55"+numeros:"");\n\n    if(!telefone){\n        mensagem("mensagemLogin","Digite um celular válido com DDD.","erro");\n        return;\n    }\n\n    botao.disabled=true;\n    botao.innerText="ENTRANDO...";\n\n    try{\n        const {data,error}=await clienteSupabase().auth.signInWithPassword({\n            phone:telefone,\n            password:senha\n        });\n\n        if(error)throw error;\n\n        sessionStorage.removeItem("apostaxbet_logout");\n        mensagem("mensagemLogin","Login realizado! Entrando...","sucesso");\n        setTimeout(()=>mostrarSite(data.user),500);\n    }catch(error){\n        mensagem("mensagemLogin",traduzirErro(error?.message||error),"erro");\n    }\n\n    botao.disabled=false;\n    botao.innerText="ENTRAR";\n}\n\n'''
s = s[:start] + new_login + s[end:]

# Remove the CPF mask block only.
mask = '/* ========================= MÁSCARA CPF ========================= */'
recovery = '/* ========================= RECUPERAÇÃO ========================= */'
if mask in s and recovery in s:
    a=s.index(mask)
    b=s.index(recovery,a)
    s=s[:a]+s[b:]

# Remove email/CPF from the visible account card.
account_email = '''<div class="conta-email" id="contaEmail"></div>\n<div class="conta-item">\n<strong>📧 E-mail</strong>\n<div class="conta-dado" id="contaEmailDetalhe">\nNão informado\n</div>\n</div>\n\n'''
if account_email in s:
    s=s.replace(account_email,'',1)
account_cpf = '''<div class="conta-item">\n<strong>🪪 CPF</strong>\n<div class="conta-dado" id="contaCpf">\nNão informado\n</div>\n</div>\n'''
if account_cpf in s:
    s=s.replace(account_cpf,'',1)

# Keep account data compatible with phone-only users.
start=s.index('function atualizarDadosConta(user){')
end=s.index('/* ========================= ID DO USUÁRIO ========================= */',start)
new_account='''function atualizarDadosConta(user){\n    if(!user)return;\n    const meta=user.user_metadata||{};\n    const nome=meta.nome||meta.full_name||meta.name||"Não informado";\n    const telefone=meta.telefone||meta.phone||meta.celular||user.phone||"Não informado";\n    const contaNome=document.getElementById("contaNome");\n    const contaNomeCompleto=document.getElementById("contaNomeCompleto");\n    const contaTelefone=document.getElementById("contaTelefone");\n    const contaId=document.getElementById("contaId");\n    if(contaNome)contaNome.innerText=textoSeguro(nome);\n    if(contaNomeCompleto)contaNomeCompleto.innerText=textoSeguro(nome);\n    if(contaTelefone)contaTelefone.innerText=textoSeguro(telefone);\n    if(contaId)contaId.innerText=textoSeguro(user.id);\n}\n\n'''
s=s[:start]+new_account+s[end:]

s=s.replace('return "E-mail ou senha incorretos.";','return "Celular ou senha incorretos.";')
s=s.replace('return "Esse e-mail já está cadastrado.";','return "Esse celular já está cadastrado.";')
s=s.replace('return "Digite um e-mail válido.";','return "Digite um celular válido com DDD.";')
s=s.replace('return "Confirme seu e-mail antes de entrar.";','return "Confirme seu celular antes de entrar.";')
s=s.replace('"✅ Cadastro com nome, telefone e CPF."','"✅ Cadastro com nome, celular e senha — sem e-mail, sem CPF e sem SMS."')

# Change the duplicate public API auth helpers at the end.
start=s.index('window.ApostaXBet={')
end=s.index('/* ========================= AUTH STATE ========================= */',start)
new_api='''window.ApostaXBet={\n    supabase:window.supabaseClient,\n    getUsuarioLogado,\n    buscarSaldo,\n    salvarSaldo,\n    descontarSaldo,\n    processarVitoria,\n    processarSaque,\n    cadastrar:async(nome,telefoneDigitado,senha)=>{\n        try{\n            const numeros=String(telefoneDigitado||"").replace(/\\D/g,"");\n            const telefone=String(telefoneDigitado||"").startsWith("+")?"+"+numeros:((numeros.length===10||numeros.length===11)?"+55"+numeros:"");\n            if(!telefone)throw new Error("Celular inválido.");\n            const {data,error}=await clienteSupabase().auth.signUp({phone:telefone,password:senha,options:{data:{nome,full_name:nome,telefone,phone:telefone}}});\n            if(error)throw error;\n            return{sucesso:true,data};\n        }catch(error){return{sucesso:false,erro:error};}\n    },\n    login:async(telefoneDigitado,senha)=>{\n        try{\n            const numeros=String(telefoneDigitado||"").replace(/\\D/g,"");\n            const telefone=String(telefoneDigitado||"").startsWith("+")?"+"+numeros:((numeros.length===10||numeros.length===11)?"+55"+numeros:"");\n            if(!telefone)throw new Error("Celular inválido.");\n            const {data,error}=await clienteSupabase().auth.signInWithPassword({phone:telefone,password:senha});\n            if(error)throw error;\n            return{sucesso:true,data};\n        }catch(error){return{sucesso:false,erro:error};}\n    }\n};\n'''
s=s[:start]+new_api+s[end:]

p.write_text(s,encoding='utf-8')
print('OK')
