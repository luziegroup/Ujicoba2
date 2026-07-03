-- Cara jalankan: Dashboard Vercel > project ini > tab "Storage" >
-- pilih database Postgres yang sudah kamu connect > tab "Query" >
-- paste semua isi file ini > klik Run.

create table if not exists documents (
  id text primary key,
  title text not null,
  doc_date text not null,
  summary text,
  content text not null,
  quiz jsonb not null,
  pass_threshold numeric not null default 0.7,
  created_at timestamptz not null default now()
);

create table if not exists receipts (
  id text primary key,
  doc_id text not null references documents(id) on delete cascade,
  name text not null,
  score int not null,
  quiz_length int not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists receipts_doc_id_idx on receipts(doc_id);
create index if not exists receipts_name_idx on receipts(name);
