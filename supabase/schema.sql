create table if not exists public.doacoes (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    tipo text not null,
    item text not null,
    quantidade text not null,
    validade date,
    bairro text not null,
    cidade text not null,
    nome text not null,
    telefone text not null,
    descricao text not null default '',
    status text not null default 'disponivel'
        check (status in ('disponivel', 'doada', 'retirada')),
    created_at timestamptz not null default now()
);

create table if not exists public.cuidadores (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    nome text not null,
    servico text not null,
    bairro text not null,
    cidade text not null,
    pets text not null,
    valor text not null,
    telefone text not null,
    descricao text not null,
    status text not null default 'ativo'
        check (status in ('ativo', 'retirado')),
    created_at timestamptz not null default now()
);

create table if not exists public.avaliacoes (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    nome text not null,
    nota smallint not null check (nota between 1 and 5),
    comentario text not null,
    created_at timestamptz not null default now()
);

create index if not exists doacoes_ativas_data_idx
    on public.doacoes (status, validade, created_at desc);
create index if not exists cuidadores_ativos_data_idx
    on public.cuidadores (status, created_at desc);
create index if not exists avaliacoes_data_idx
    on public.avaliacoes (created_at desc);

alter table public.doacoes enable row level security;
alter table public.cuidadores enable row level security;
alter table public.avaliacoes enable row level security;

drop policy if exists "Doacoes disponiveis publicas" on public.doacoes;
create policy "Doacoes disponiveis publicas"
    on public.doacoes for select to anon, authenticated
    using (status = 'disponivel' and (validade is null or validade >= current_date));

drop policy if exists "Dono cria doacao" on public.doacoes;
create policy "Dono cria doacao"
    on public.doacoes for insert to authenticated
    with check (owner_id = (select auth.uid()) and status = 'disponivel');

drop policy if exists "Dono retira doacao" on public.doacoes;
create policy "Dono retira doacao"
    on public.doacoes for update to authenticated
    using (owner_id = (select auth.uid()) and status = 'disponivel')
    with check (owner_id = (select auth.uid()));

drop policy if exists "Servicos ativos publicos" on public.cuidadores;
create policy "Servicos ativos publicos"
    on public.cuidadores for select to anon, authenticated
    using (status = 'ativo');

drop policy if exists "Dono cria servico" on public.cuidadores;
create policy "Dono cria servico"
    on public.cuidadores for insert to authenticated
    with check (owner_id = (select auth.uid()) and status = 'ativo');

drop policy if exists "Dono retira servico" on public.cuidadores;
create policy "Dono retira servico"
    on public.cuidadores for update to authenticated
    using (owner_id = (select auth.uid()) and status = 'ativo')
    with check (owner_id = (select auth.uid()));

drop policy if exists "Avaliacoes publicas" on public.avaliacoes;
create policy "Avaliacoes publicas"
    on public.avaliacoes for select to anon, authenticated
    using (true);

drop policy if exists "Usuario cria avaliacao" on public.avaliacoes;
create policy "Usuario cria avaliacao"
    on public.avaliacoes for insert to authenticated
    with check (owner_id = (select auth.uid()));

grant usage on schema public to anon, authenticated;
grant select on public.doacoes, public.cuidadores, public.avaliacoes to anon, authenticated;
grant insert, update on public.doacoes, public.cuidadores to authenticated;
grant insert on public.avaliacoes to authenticated;
