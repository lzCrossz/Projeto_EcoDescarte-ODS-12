-- EcoDescarte — tabela de pontos de recolha (ODS 12 / TI Verde)
-- Cole e execute este script no SQL Editor do Supabase.

create table if not exists public.pontos_recolha (
  id uuid primary key default gen_random_uuid(),
  nome_local text not null,
  endereco text not null,
  tipo_material text not null,
  created_at timestamptz not null default now()
);

alter table public.pontos_recolha enable row level security;

-- Políticas abertas para um protótipo académico (anon).
-- Em produção, restrinja insert/select a utilizadores autenticados.
create policy "Leitura pública dos pontos"
  on public.pontos_recolha
  for select
  to anon, authenticated
  using (true);

create policy "Inserção pública dos pontos"
  on public.pontos_recolha
  for insert
  to anon, authenticated
  with check (true);
