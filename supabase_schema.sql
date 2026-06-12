-- ==========================================
-- SCRIPT DE BASE DE DATOS PARA GROWMANAGER
-- Pegar esto en el "SQL Editor" de Supabase
-- ==========================================

-- 1. Crear tabla de genéticas (strains)
create table strains (
  id text primary key,
  name text not null,
  type text not null check (type in ('Híbrido', 'Índica', 'Sativa', 'CBD'))
);

-- 2. Crear tabla de lotes (lots)
create table lots (
  id text primary key,
  name text not null,
  strain text not null,
  plant_count integer not null,
  stage text not null check (stage in ('Germinación', 'Vegetativo', 'Floración', 'Secado', 'Curado')),
  start_date date not null,
  notes text,
  is_archived boolean not null default false
);

-- 3. Crear tabla de registros diarios (logs)
create table logs (
  id text primary key,
  lot_id text not null references lots(id) on delete cascade,
  date timestamp with time zone not null default timezone('utc'::text, now()),
  temp numeric not null,
  humidity numeric not null,
  vpd numeric not null,
  ph numeric,
  ec numeric,
  water_amount numeric,
  notes text
);

-- 4. Crear tabla de tareas (tasks)
create table tasks (
  id text primary key,
  lot_id text not null references lots(id) on delete cascade,
  title text not null,
  date date not null,
  type text not null check (type in ('riego', 'fertilizante', 'poda', 'preventivo', 'otro')),
  notes text,
  is_completed boolean not null default false
);

-- ==========================================
-- Habilitar Row Level Security (RLS) y dar acceso público
-- ==========================================

alter table strains enable row level security;
alter table lots enable row level security;
alter table logs enable row level security;
alter table tasks enable row level security;

-- Políticas públicas (Permiten leer, insertar, actualizar y borrar sin estar logueado)
create policy "Acceso público strains" on strains for all using (true) with check (true);
create policy "Acceso público lots" on lots for all using (true) with check (true);
create policy "Acceso público logs" on logs for all using (true) with check (true);
create policy "Acceso público tasks" on tasks for all using (true) with check (true);

-- ==========================================
-- ACTUALIZACIÓN A POLÍTICAS PRIVADAS (AUTH)
-- Pegar esto en el "SQL Editor" para cerrar el acceso público
-- ==========================================

-- 1. Eliminar políticas públicas anteriores
-- drop policy "Acceso público strains" on strains;
-- drop policy "Acceso público lots" on lots;
-- drop policy "Acceso público logs" on logs;
-- drop policy "Acceso público tasks" on tasks;

-- 2. Crear políticas privadas restringidas a usuarios autenticados
-- create policy "Acceso privado strains" on strains for all to authenticated using (true) with check (true);
-- create policy "Acceso privado lots" on lots for all to authenticated using (true) with check (true);
-- create policy "Acceso privado logs" on logs for all to authenticated using (true) with check (true);
-- create policy "Acceso privado tasks" on tasks for all to authenticated using (true) with check (true);

