import { supabase, formatSupabaseError, localDateString } from './supabase-client.js';

function mostrarErro(lista, erro) {
    const aviso = document.createElement('p');
    aviso.textContent = formatSupabaseError(erro);
    lista.replaceChildren(aviso);
}

async function carregarDoacoes() {
    const lista = document.getElementById('listaDoacoes');
    const { data, error } = await supabase.from('doacoes')
        .select('id, tipo, item, quantidade, validade, bairro, cidade, telefone, descricao, created_at')
        .eq('status', 'disponivel')
        .or('validade.is.null,validade.gte.' + localDateString())
        .order('created_at', { ascending: false });

    if (error) {
        mostrarErro(lista, error);
        return;
    }
    if (!data.length) return;

    lista.replaceChildren();
    data.forEach(function(doacao) {
        const card = document.createElement('article');
        card.className = 'card';
        const titulo = document.createElement('h3');
        titulo.textContent = doacao.item;
        const tipo = document.createElement('p');
        tipo.textContent = doacao.tipo + ' · ' + doacao.quantidade;
        const descricao = document.createElement('p');
        descricao.textContent = doacao.descricao || '';
        const local = document.createElement('p');
        local.textContent = doacao.bairro + ' - ' + doacao.cidade;
        const contato = document.createElement('p');
        contato.textContent = 'Contato: ' + doacao.telefone;
        card.append(titulo, tipo, descricao, local, contato);
        if (doacao.validade) {
            const validade = document.createElement('p');
            validade.textContent = 'Validade: ' + doacao.validade.split('-').reverse().join('/');
            card.appendChild(validade);
        }
        lista.appendChild(card);
    });
}

async function carregarAvaliacoes() {
    const lista = document.getElementById('listaAvaliacoes');
    const { data, error } = await supabase.from('avaliacoes')
        .select('id, nome, nota, comentario, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        mostrarErro(lista, error);
        return;
    }
    if (!data.length) return;

    lista.replaceChildren();
    data.forEach(function(avaliacao) {
        const card = document.createElement('article');
        card.className = 'card-avaliacao';
        const estrelas = document.createElement('p');
        estrelas.className = 'estrelas-ouro';
        estrelas.textContent = '★'.repeat(avaliacao.nota) + '☆'.repeat(5 - avaliacao.nota);
        const comentario = document.createElement('p');
        comentario.className = 'comentario-texto';
        comentario.textContent = avaliacao.comentario;
        const autor = document.createElement('p');
        autor.textContent = avaliacao.nome;
        card.append(estrelas, comentario, autor);
        lista.appendChild(card);
    });
}

await Promise.all([carregarDoacoes(), carregarAvaliacoes()]);
