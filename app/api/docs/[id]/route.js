import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isHrAuthed } from "@/lib/checkHrAuth";

export const dynamic = "force-dynamic";

export async function DELETE(req, { params }) {
  if (!isHrAuthed(req)) {
    return NextResponse.json({ error: "Tidak diizinkan. Silakan login HR dulu." }, { status: 401 });
  }

  const { id } = params;
  try {
    const pool = getPool();
    // Receipts ikut terhapus otomatis karena foreign key "on delete cascade"
    // di tabel receipts (lihat db/schema.sql).
    await pool.query("delete from documents where id = $1", [id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
