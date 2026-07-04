import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { generateQuiz, fallbackQuiz } from "@/lib/generateQuiz";
import { formatDocumentHtml, fallbackFormatHtml } from "@/lib/formatContent";
import { isHrAuthed } from "@/lib/checkHrAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      "select * from documents order by created_at desc"
    );
    return NextResponse.json({ docs: rows });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!isHrAuthed(req)) {
    return NextResponse.json({ error: "Tidak diizinkan. Silakan login HR dulu." }, { status: 401 });
  }

  const { title, content, passThreshold, manualQuiz } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: "Judul dan isi dokumen wajib diisi" }, { status: 400 });
  }

  let quiz;
  let htmlContent;
  let summary;

  if (manualQuiz && Array.isArray(manualQuiz) && manualQuiz.length > 0) {
    quiz = manualQuiz;
    summary = "Dokumen sosialisasi, kuis ditulis manual oleh HR.";
    try {
      htmlContent = await formatDocumentHtml(title, content);
    } catch (e) {
      console.error("AI format failed:", e.message);
      htmlContent = fallbackFormatHtml(content);
    }
  } else {
    summary = "Dokumen sosialisasi, kuis dibuat otomatis oleh AI.";
    try {
      [quiz, htmlContent] = await Promise.all([
        generateQuiz(title, content).catch((e) => {
          console.error("AI quiz generation failed:", e.message);
          return fallbackQuiz();
        }),
        formatDocumentHtml(title, content).catch((e) => {
          console.error("AI format failed:", e.message);
          return fallbackFormatHtml(content);
        }),
      ]);
    } catch (e) {
      quiz = fallbackQuiz();
      htmlContent = fallbackFormatHtml(content);
    }
  }

  const id = "mom_" + Math.random().toString(36).slice(2, 10);
  const docDate = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `insert into documents (id, title, doc_date, summary, content, quiz, pass_threshold)
       values ($1, $2, $3, $4, $5, $6, $7) returning *`,
      [
        id,
        title,
        docDate,
        summary,
        htmlContent,
        JSON.stringify(quiz),
        passThreshold ?? 0.7,
      ]
    );
    return NextResponse.json({ doc: rows[0] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
