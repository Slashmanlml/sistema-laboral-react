-- ==========================================
-- SCRIPT DE BASE DE DATOS PARA GROWMANAGER (CON MULTI-USUARIO)
-- Pegar esto en el "SQL Editor" de Supabase para instalaciones limpias
-- ==========================================

-- 1. Crear tabla de genéticas (strains)
create table strains (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('Híbrido', 'Índica', 'Sativa', 'CBD'))
);

-- 2. Crear tabla de lotes (lots)
create table lots (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  strain text not null,
  plant_count integer not null,
  stage text not null check (stage in ('Cama 1 y 2 (Propagación)', 'Cama 3 (Preflora Temprana)', 'Cama 4 (Preflora Avanzada)', 'Cama 5 (Madres)', 'Cama 6 (Pre-flora)', 'Floración', 'Secado', 'Curado')),
  start_date date not null,
  notes text,
  is_archived boolean not null default false
);

-- 3. Crear tabla de registros diarios (logs)
create table logs (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lot_id text not null references lots(id) on delete cascade,
  date timestamp with time zone not null default timezone('utc'::text, now()),
  temp numeric not null,
  humidity numeric not null,
  vpd numeric not null,
  ph numeric,
  ec numeric,
  water_amount numeric,
  watered_by text,
  notes text
);

-- 4. Crear tabla de tareas (tasks)
create table tasks (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lot_id text not null references lots(id) on delete cascade,
  title text not null,
  date date not null,
  type text not null check (type in ('riego', 'fertilizante', 'poda', 'preventivo', 'otro')),
  notes text,
  is_completed boolean not null default false
);

-- 5. Crear tabla de ayudantes (helpers)
create table helpers (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null
);

-- Habilitar Row Level Security (RLS)
alter table strains enable row level security;
alter table lots enable row level security;
alter table logs enable row level security;
alter table tasks enable row level security;
alter table helpers enable row level security;

-- Políticas de aislamiento privado por usuario
create policy "Acceso privado strains" on strains for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Acceso privado lots" on lots for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Acceso privado logs" on logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Acceso privado tasks" on tasks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Acceso privado helpers" on helpers for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- =========================================================================
-- SCRIPT DE MIGRACIÓN: EJECUTAR ESTO PARA MIGRAR SI YA TIENES DATOS CREADOS
-- =========================================================================
/*
-- 1. Crear la tabla de ayudantes (helpers)
create table helpers (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null
);
alter table helpers enable row level security;
create policy "Acceso privado helpers" on helpers for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Agregar la columna watered_by a la tabla logs
alter table logs add column watered_by text;
*/



