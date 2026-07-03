import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isHrAuthed } from "@/lib/checkHrAuth";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS_PER_DAY = 3;

export async function GET(req, { params }) {
  const { id } = params;
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  try {
    const pool = getPool();

    if (name) {
      // Karyawan cek status dirinya sendiri — tidak perlu login HR.
      const { rows } = await pool.query(
        `select * from receipts where doc_id = $1 and name = $2 order by created_at desc`,
        [id, name]
      );
      const passed = rows.some((r) => r.passed);
      const attemptsToday = rows.filter(
        (r) => new Date(r.created_at).toDateString() === new Date().toDateString()
      ).length;
      return NextResponse.json({
        receipts: rows,
        passed,
        attemptsToday,
        locked: !passed && attemptsToday >= MAX_ATTEMPTS_PER_DAY,
        maxAttempts: MAX_ATTEMPTS_PER_DAY,
      });
    }

    // Tanpa "name" berarti dashboard HR (lihat semua orang) — wajib login HR.
    if (!isHrAuthed(req)) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
    }
    const { rows } = await pool.query(
      `select * from receipts where doc_id = $1 order by created_at desc`,
      [id]
    );
    return NextResponse.json({ receipts: rows });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const { id } = params;
  const { name, quizAnswers } = await req.json();

  if (!name || !quizAnswers) {
    return NextResponse.json({ error: "Nama dan jawaban kuis wajib diisi" }, { status: 400 });
  }

  try {
    const pool = getPool();

    const { rows: docRows } = await pool.query("select * from documents where id = $1", [id]);
    if (docRows.length === 0) {
      return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
    }
    const doc = docRows[0];

    const { rows: myReceipts } = await pool.query(
      "select * from receipts where doc_id = $1 and name = $2",
      [id, name]
    );

    if (myReceipts.some((r) => r.passed)) {
      return NextResponse.json({ status: "already_passed" });
    }

    const todaysAttempts = myReceipts.filter(
      (r) => new Date(r.created_at).toDateString() === new Date().toDateString()
    );

    if (todaysAttempts.length >= MAX_ATTEMPTS_PER_DAY) {
      return NextResponse.json({ status: "locked", attemptsToday: todaysAttempts.length });
    }

    // Skor dihitung di server berdasarkan kunci jawaban dari database,
    // bukan dikirim dari browser — supaya tidak bisa dimanipulasi.
    let score = 0;
    doc.quiz.forEach((q, i) => {
      if (quizAnswers[i] === q.answer) score++;
    });
    const minCorrect = Math.ceil(doc.quiz.length * (doc.pass_threshold ?? 0.7));
    const passed = score >= minCorrect;
    const receiptId = "rcpt_" + Math.random().toString(36).slice(2, 10);

    await pool.query(
      `insert into receipts (id, doc_id, name, score, quiz_length, passed)
       values ($1, $2, $3, $4, $5, $6)`,
      [receiptId, id, name, score, doc.quiz.length, passed]
    );

    const attemptsUsed = todaysAttempts.length + 1;
    return NextResponse.json({
      status: passed ? "passed" : (attemptsUsed >= MAX_ATTEMPTS_PER_DAY ? "locked" : "failed"),
      score,
      quizLength: doc.quiz.length,
      attemptsToday: attemptsUsed,
      maxAttempts: MAX_ATTEMPTS_PER_DAY,
      receiptId,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
