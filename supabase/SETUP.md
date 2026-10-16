# Configuracao do Supabase

## 1. Criar as tabelas e politicas

No painel do projeto, abra **SQL Editor > New query**, cole e execute o conteudo de `schema.sql`.

Isso cria as tabelas `doacoes`, `cuidadores` e `avaliacoes`, ativa RLS e concede somente as operacoes previstas pelas politicas. O site mostra listas publicas; para cadastrar, retirar anuncios ou avaliar, a pessoa precisa entrar na conta. Cada usuario pode alterar apenas os proprios anuncios.

## 2. Configurar URLs de autenticacao

Em **Authentication > URL Configuration**, use:

- Site URL: `https://farmacia-solidaria-pet-bay.vercel.app`
- Redirect URLs: `https://farmacia-solidaria-pet-bay.vercel.app/**`
- Para desenvolvimento local, acrescente `http://localhost:5500/**` se usar esse endereco.

A confirmacao de cadastro retorna para `index.html`; a recuperacao de senha retorna para `login.html`.

## 3. Credenciais do frontend

A URL do projeto e a chave publishable ficam em `supabase-client.js`. A chave publishable e feita para uso no navegador; as politicas RLS do schema protegem os dados.

Nunca coloque no frontend nem compartilhe a chave `service_role`, senha do banco ou token administrativo.

## 4. Verificar antes de publicar

Depois de executar o schema, teste as paginas `doacao.html`, `cuidadores.html` e `avaliar.html`: as listas devem carregar sem a mensagem de schema ausente. Em seguida, faca login e teste cadastro e retirada com uma conta autenticada.
