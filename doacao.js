import { supabase, formatSupabaseError, localDateString } from './supabase-client.js';

const form = document.getElementById('formDoacao');
const lista = document.getElementById('lista');
const status = document.getElementById('status');
const authRequired = document.getElementById('authRequired');
let usuarioAtual = null;

function informar(mensagem, erro = false) {
    status.textContent = mensagem;
    status.style.color = erro ? '#a83228' : '#2d6a4f';
}

function criarAcao(rotulo, funcao) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'remove-button';
    botao.textContent = rotulo;
    botao.addEventListener('click', funcao);
    return botao;
}

async function atualizarUsuario() {
    const { data } = await supabase.auth.getUser();
    usuarioAtual = data.user;
    authRequired.hidden = Boolean(usuarioAtual);
    form.querySelectorAll('input, select, textarea, button').forEach(function(campo) {
        campo.disabled = !usuarioAtual;
    });
}

async function alterarStatus(doacao, novoStatus) {
    if (!usuarioAtual) return;
    const pergunta = novoStatus === 'doada'
        ? 'Confirmar que esta doação já foi entregue?'
        : 'Deseja retirar esta doação sem marcá-la como entregue?';
    if (!window.confirm(pergunta)) return;

    const { error } = await supabase.from('doacoes')
        .update({ status: novoStatus })
        .eq('id', doacao.id)
        .eq('owner_id', usuarioAtual.id);
    if (error) {
        informar(formatSupabaseError(error), true);
        return;
    }
    informar(novoStatus === 'doada' ? 'Doação marcada como entregue.' : 'Anúncio retirado.');
    await carregarDoacoes();
}

async function carregarDoacoes() {
    const hoje = localDateString();
    const { data, error } = await supabase.from('doacoes')
        .select('id, owner_id, tipo, item, quantidade, validade, bairro, cidade, nome, telefone, descricao, created_at')
        .eq('status', 'disponivel')
        .or('validade.is.null,validade.gte.' + hoje)
        .order('created_at', { ascending: false });

    lista.replaceChildren();
    if (error) {
        const aviso = document.createElement('p');
        aviso.className = 'empty';
        aviso.textContent = formatSupabaseError(error);
        lista.appendChild(aviso);
        return;
    }
    if (!data.length) {
        const vazio = document.createElement('p');
        vazio.className = 'empty';
        vazio.textContent = 'Ainda não há doações disponíveis.';
        lista.appendChild(vazio);
        return;
    }

    data.forEach(function(doacao) {
        const card = document.createElement('article');
        card.className = 'donation';
        const titulo = document.createElement('h3');
        titulo.textContent = doacao.item;
        const tipo = document.createElement('p');
        tipo.textContent = doacao.tipo + ' · ' + doacao.quantidade;
        const local = document.createElement('p');
        local.textContent = doacao.bairro + ', ' + doacao.cidade;
        const contato = document.createElement('p');
        contato.textContent = 'Contato: ' + doacao.nome + ' · ' + doacao.telefone;
        card.append(titulo, tipo, local, contato);
        if (doacao.descricao) {
            const descricao = document.createElement('p');
            descricao.textContent = doacao.descricao;
            card.appendChild(descricao);
        }
        if (doacao.validade) {
            const validade = document.createElement('p');
            validade.textContent = 'Validade: ' + doacao.validade.split('-').reverse().join('/');
            card.appendChild(validade);
        }
        if (usuarioAtual?.id === doacao.owner_id) {
            const acoes = document.createElement('div');
            acoes.className = 'listing-actions';
            acoes.append(
                criarAcao('Marcar como doada', function() { alterarStatus(doacao, 'doada'); }),
                criarAcao('Retirar anúncio', function() { alterarStatus(doacao, 'retirada'); })
            );
            card.appendChild(acoes);
        }
        lista.appendChild(card);
    });
}

form.addEventListener('submit', async function(evento) {
    evento.preventDefault();
    if (!usuarioAtual) {
        informar('Entre na sua conta para cadastrar uma doação.', true);
        return;
    }

    const dados = Object.fromEntries(new FormData(form).entries());
    if (dados.validade && dados.validade < localDateString()) {
        informar('A validade informada já passou. Confira a data antes de publicar.', true);
        return;
    }

    const { error } = await supabase.from('doacoes').insert({
        owner_id: usuarioAtual.id,
        tipo: dados.tipo,
        item: dados.item,
        quantidade: dados.quantidade,
        validade: dados.validade || null,
        bairro: dados.bairro,
        cidade: dados.cidade,
        nome: dados.nome,
        telefone: dados.telefone,
        descricao: dados.descricao || ''
    });
    if (error) {
        informar(formatSupabaseError(error), true);
        return;
    }

    informar('Doação publicada para todos os visitantes.');
    form.reset();
    document.getElementById('cidade').value = 'Recife';
    await carregarDoacoes();
});

supabase.auth.onAuthStateChange(function() {
    setTimeout(function() {
        atualizarUsuario().then(carregarDoacoes);
    }, 0);
});

await atualizarUsuario();
await carregarDoacoes();
