-- Registro rápido de atividades FitBox (projeto Supabase FitBox)
-- Migração executada: create_quick_activity_logs
-- Nunca altera a tabela cardio_logs ou as sessões existentes.
create table if not exists public.activity_logs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 date date not null,
 kind text not null check (kind in ('hyrox','funcional','caminhada','musculacao','cardio','esporte','mobilidade','outro')),
 label text check (label is null or char_length(label) <= 80),
 duration_min numeric(8,2) not null check (duration_min > 0 and duration_min <= 1440),
 calories_kcal integer check (calories_kcal between 0 and 20000),
 avg_heart_rate integer check (avg_heart_rate between 30 and 250),
 rpe numeric(3,1) check (rpe between 1 and 10),
 notes text check (notes is null or char_length(notes) <= 1000),
 created_at timestamptz not null default now()
);
create index if not exists activity_logs_user_date_idx on public.activity_logs(user_id,date desc);
alter table public.activity_logs enable row level security;
grant select,insert,update,delete on public.activity_logs to authenticated;
revoke all on public.activity_logs from anon;
create policy "activity_logs_owner_only" on public.activity_logs
 for all to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
