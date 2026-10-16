import { supabase, formatSupabaseError } from './supabase-client.js';

const form = document.getElementById('formCuidador');
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
    form.querySelectorAll('input, select, textarea, button').forEach(function(campo) {
        campo.disabled = !usuarioAtual;
    });
}

async function retirarServico(servico) {
    if (!usuarioAtual || !window.confirm('Deseja retirar este anúncio de serviço?')) return;
    const { error } = await supabase.from('cuidadores')
        .update({ status: 'retirado' })
        .eq('id', servico.id)
        .eq('owner_id', usuarioAtual.id);
    if (error) {
        informar(formatSupabaseError(error), true);
        return;
    }
    informar('Anúncio retirado.');
    await carregarCuidadores();
}

async function carregarCuidadores() {
    const { data, error } = await supabase.from('cuidadores')
        .select('id, owner_id, nome, servico, bairro, cidade, pets, valor, telefone, descricao, created_at')
        .eq('status', 'ativo')
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
        vazio.textContent = 'Ainda não há serviços anunciados.';
        lista.appendChild(vazio);
        return;
    }

    data.forEach(function(servico) {
        const card = document.createElement('article');
        card.className = 'caregiver';
        const titulo = document.createElement('h3');
        titulo.textContent = servico.nome + ' · ' + servico.servico;
        const local = document.createElement('p');
        local.textContent = servico.bairro + ', ' + servico.cidade + ' · ' + servico.pets;
        const valor = document.createElement('p');
        valor.textContent = servico.valor;
        const descricao = document.createElement('p');
        descricao.textContent = servico.descricao;
        const contato = document.createElement('p');
        contato.textContent = 'WhatsApp: ' + servico.telefone;
        card.append(titulo, local, valor, descricao, contato);
        if (usuarioAtual?.id === servico.owner_id) {
            const retirar = document.createElement('button');
            retirar.type = 'button';
            retirar.className = 'remove-button';
            retirar.textContent = 'Retirar anúncio';
            retirar.addEventListener('click', function() { retirarServico(servico); });
            card.appendChild(retirar);
        }
        lista.appendChild(card);
    });
}

form.addEventListener('submit', async function(evento) {
    evento.preventDefault();
    if (!usuarioAtual) {
        informar('Entre na sua conta para anunciar um serviço.', true);
        return;
    }

    const dados = Object.fromEntries(new FormData(form).entries());
    const { error } = await supabase.from('cuidadores').insert({
        owner_id: usuarioAtual.id,
        nome: dados.nome,
        servico: dados.servico,
        bairro: dados.bairro,
        cidade: dados.cidade,
        pets: dados.pets,
        valor: dados.valor,
        telefone: dados.telefone,
        descricao: dados.descricao
    });
    if (error) {
        informar(formatSupabaseError(error), true);
        return;
    }

    informar('Serviço anunciado para todos os visitantes.');
    form.reset();
    document.getElementById('cidade').value = 'Recife';
    await carregarCuidadores();
});

supabase.auth.onAuthStateChange(function() {
    setTimeout(function() {
        atualizarUsuario().then(carregarCuidadores);
    }, 0);
});

await atualizarUsuario();
await carregarCuidadores();
