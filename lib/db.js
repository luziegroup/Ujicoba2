import { Pool } from "pg";

// PENTING: file ini hanya boleh dipakai di server (API routes).
//
// Kredensial database TIDAK perlu diisi manual — begitu kamu connect
// database Postgres lewat tab "Storage" di dashboard Vercel, Vercel
// otomatis menambahkan environment variable koneksinya ke project ini
// (biasanya bernama POSTGRES_URL atau DATABASE_URL). Kode di bawah ini
// otomatis memakai salah satu yang tersedia.
let _pool = null;

export function getPool() {
  if (_pool) return _pool;
  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    throw new Error(
      "Tidak menemukan connection string database. Pastikan sudah connect Postgres lewat tab Storage di Vercel, lalu redeploy."
    );
  }

  _pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  return _pool;
}
