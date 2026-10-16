import { supabase, formatSupabaseError } from './supabase-client.js';

const form = document.getElementById('formAvaliacao');
const lista = document.getElementById('lista');
const status = document.getElementById('status');
const authRequired = document.getElementById('authRequired');
let usuarioAtual = null;

function informar(mensagem, erro = false) {
    status.textContent = mensagem;
    status.style.color = erro ? '#a83228' : '#2d6a4f';
}

async function atualizarUsuario() {
    const { data } = await supabase.auth.getUser();
    usuarioAtual = data.user;
    authRequired.hidden = Boolean(usuarioAtual);
    form.querySelectorAll('input, textarea, button').forEach(function(campo) {
        campo.disabled = !usuarioAtual;
    });
}

async function carregarAvaliacoes() {
    const { data, error } = await supabase.from('avaliacoes')
        .select('id, nome, nota, comentario, created_at')
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
        vazio.textContent = 'Ainda não há avaliações.';
        lista.appendChild(vazio);
        return;
    }

    data.forEach(function(avaliacao) {
        const card = document.createElement('article');
        card.className = 'review';
        const titulo = document.createElement('h3');
        titulo.textContent = avaliacao.nome;
        const estrelas = document.createElement('p');
        estrelas.className = 'stars';
        estrelas.textContent = '★'.repeat(avaliacao.nota) + '☆'.repeat(5 - avaliacao.nota);
        const comentario = document.createElement('p');
        comentario.textContent = avaliacao.comentario;
        card.append(titulo, estrelas, comentario);
        lista.appendChild(card);
    });
}

form.addEventListener('submit', async function(evento) {
    evento.preventDefault();
    if (!usuarioAtual) {
        informar('Entre na sua conta para enviar uma avaliação.', true);
        return;
    }

    const dados = Object.fromEntries(new FormData(form).entries());
    const { error } = await supabase.from('avaliacoes').insert({
        owner_id: usuarioAtual.id,
        nome: dados.nome,
        nota: Number(dados.nota),
        comentario: dados.comentario
    });
    if (error) {
        informar(formatSupabaseError(error), true);
        return;
    }

    informar('Avaliação publicada para todos os visitantes. Obrigado por participar.');
    form.reset();
    await carregarAvaliacoes();
});

supabase.auth.onAuthStateChange(function() {
    setTimeout(function() {
        atualizarUsuario().then(carregarAvaliacoes);
    }, 0);
});

await atualizarUsuario();
await carregarAvaliacoes();
