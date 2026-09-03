from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# Remove email e CPF somente dos campos visiveis do cadastro.
s, n_email = re.subn(r'<label[^>]*>\s*E-?mail\s*</label>\s*<input[^>]*id=["\']emailCadastro["\'][^>]*>\s*', '', s, count=1, flags=re.I)
s, n_cpf = re.subn(r'<label[^>]*>\s*CPF\s*</label>\s*<input[^>]*id=["\']cpfCadastro["\'][^>]*>\s*', '', s, count=1, flags=re.I)
if n_email == 0 or n_cpf == 0:
    raise SystemExit(f'Campos de cadastro nao encontrados: email={n_email}, cpf={n_cpf}')

# Troca o campo de login de email para celular.
s, n_login = re.subn(
    r'<label[^>]*>\s*E-?mail\s*</label>\s*<input[^>]*id=["\']emailLogin["\'][^>]*>',
    '<label>Celular</label>\n<input id="telefoneLogin" type="tel" inputmode="tel" autocomplete="tel" placeholder="Digite seu número de celular" required>',
    s, count=1, flags=re.I
)
if n_login == 0:
    raise SystemExit('Campo emailLogin nao encontrado')

# Nao oferece recuperacao por email no login.
s = re.sub(r'<button[^>]*class=["\']esqueci["\'][^>]*>.*?</button>', '', s, count=1, flags=re.I|re.S)


def replace_function(src, name, replacement):
    marker = f'async function {name}(event)'
    start = src.find(marker)
    if start < 0:
        raise SystemExit(f'Funcao nao encontrada: {name}')
    brace = src.find('{', start)
    if brace < 0:
        raise SystemExit(f'Inicio da funcao nao encontrado: {name}')
    depth = 0
    end = None
    for i in range(brace, len(src)):
        c = src[i]
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end is None:
        raise SystemExit(f'Fim da funcao nao encontrado: {name}')
    return src[:start] + replacement + src[end:]

new_cadastro = r'''async function cadastrar(event){
    event.preventDefault();

    const nome=document.getElementById("nomeCadastro").value.trim();
    const telefoneDigitado=document.getElementById("telefoneCadastro").value.trim();
    const senha=document.getElementById("senhaCadastro").value;
    const confirmar=document.getElementById("confirmarSenha").value;
    const botao=document.getElementById("btnCadastro");

    if(senha!==confirmar){
        mensagem("mensagemCadastro","As senhas não são iguais.","erro");
        return;
    }

    if(senha.length<6){
        mensagem("mensagemCadastro","A senha precisa ter pelo menos 6 caracteres.","erro");
        return;
    }

    const numeros=telefoneDigitado.replace(/\D/g,"");
    const telefone=telefoneDigitado.startsWith("+")
        ?"+"+numeros
        :(numeros.length===10||numeros.length===11?"+55"+numeros:"");

    if(!telefone){
        mensagem("mensagemCadastro","Digite um celular válido com DDD.","erro");
        return;
    }

    botao.disabled=true;
    botao.innerText="CRIANDO CONTA...";

    try{
        const {data,error}=await clienteSupabase().auth.signUp({
            phone:telefone,
            password:senha,
            options:{data:{nome,full_name:nome,telefone,phone:telefone}}
        });

        if(error)throw error;

        if(data?.session){
            sessionStorage.removeItem("apostaxbet_logout");
            mensagem("mensagemCadastro","Conta criada com sucesso! Entrando...","sucesso");
            setTimeout(()=>mostrarSite(data.session.user),500);
        }else{
            mensagem("mensagemCadastro","Conta criada, mas a sessão automática não foi liberada. Desative a confirmação de telefone no Supabase para entrar imediatamente.","erro");
        }
    }catch(error){
        mensagem("mensagemCadastro",traduzirErro(error?.message||error),"erro");
    }

    botao.disabled=false;
    botao.innerText="CRIAR CONTA";
}'''

new_login = r'''async function entrar(event){
    event.preventDefault();

    const telefoneDigitado=document.getElementById("telefoneLogin").value.trim();
    const senha=document.getElementById("senhaLogin").value;
    const botao=document.getElementById("btnLogin");

    const numeros=telefoneDigitado.replace(/\D/g,"");
    const telefone=telefoneDigitado.startsWith("+")
        ?"+"+numeros
        :(numeros.length===10||numeros.length===11?"+55"+numeros:"");

    if(!telefone){
        mensagem("mensagemLogin","Digite um celular válido com DDD.","erro");
        return;
    }

    botao.disabled=true;
    botao.innerText="ENTRANDO...";

    try{
        const {data,error}=await clienteSupabase().auth.signInWithPassword({
            phone:telefone,
            password:senha
        });

        if(error)throw error;
        sessionStorage.removeItem("apostaxbet_logout");
        mensagem("mensagemLogin","Login realizado! Entrando...","sucesso");
        setTimeout(()=>mostrarSite(data.user),500);
    }catch(error){
        mensagem("mensagemLogin",traduzirErro(error?.message||error),"erro");
    }

    botao.disabled=false;
    botao.innerText="ENTRAR";
}'''

s = replace_function(s, 'cadastrar', new_cadastro)
s = replace_function(s, 'entrar', new_login)

# Remove a mascara de CPF, se existir, sem tocar no restante.
mask = '/* ========================= MÁSCARA CPF ========================= */'
recovery = '/* ========================= RECUPERAÇÃO ========================= */'
if mask in s and recovery in s:
    a=s.index(mask)
    b=s.index(recovery,a)
    s=s[:a]+s[b:]

# Atualiza a funcao da conta para mostrar somente nome/celular/ID.
start=s.find('function atualizarDadosConta(user)')
if start >= 0:
    brace=s.find('{',start)
    depth=0
    end=None
    for i in range(brace,len(s)):
        if s[i]=='{': depth+=1
        elif s[i]=='}':
            depth-=1
            if depth==0:
                end=i+1
                break
    if end is None: raise SystemExit('Fim de atualizarDadosConta nao encontrado')
    new_account = r'''function atualizarDadosConta(user){
    if(!user)return;
    const meta=user.user_metadata||{};
    const nome=meta.nome||meta.full_name||meta.name||"Não informado";
    const telefone=meta.telefone||meta.phone||meta.celular||user.phone||"Não informado";
    const contaNome=document.getElementById("contaNome");
    const contaNomeCompleto=document.getElementById("contaNomeCompleto");
    const contaTelefone=document.getElementById("contaTelefone");
    const contaId=document.getElementById("contaId");
    if(contaNome)contaNome.innerText=textoSeguro(nome);
    if(contaNomeCompleto)contaNomeCompleto.innerText=textoSeguro(nome);
    if(contaTelefone)contaTelefone.innerText=textoSeguro(telefone);
    if(contaId)contaId.innerText=textoSeguro(user.id);
}'''
    s=s[:start]+new_account+s[end:]

# Mensagens antigas de email/CPF.
s=s.replace('E-mail ou senha incorretos.','Celular ou senha incorretos.')
s=s.replace('Esse e-mail já está cadastrado.','Esse celular já está cadastrado.')
s=s.replace('Digite um e-mail válido.','Digite um celular válido com DDD.')
s=s.replace('Confirme seu e-mail antes de entrar.','Confirme seu celular antes de entrar.')
s=s.replace('Cadastro com nome, telefone e CPF.','Cadastro com nome, celular e senha — sem e-mail, sem CPF e sem SMS.')

p.write_text(s,encoding='utf-8')
print('Patch aplicado:', n_email, n_cpf, n_login)
