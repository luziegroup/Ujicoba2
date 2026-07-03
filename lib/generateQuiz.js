// Memanggil Claude API untuk menyusun kuis otomatis dari isi dokumen.
// Dipanggil dari API route (server-side) supaya ANTHROPIC_API_KEY tidak
// pernah terkirim ke browser.
export async function generateQuiz(title, plainContent) {
  const prompt = `Kamu membantu membuat kuis verifikasi pemahaman untuk dokumen sosialisasi internal perusahaan (Bahasa Indonesia).
Judul dokumen: "${title}"
Isi dokumen:
"""${plainContent}"""

Buat 2 pertanyaan pilihan ganda untuk memverifikasi apakah pembaca benar-benar memahami isi dokumen di atas. Setiap pertanyaan punya 4 opsi jawaban, hanya 1 yang benar. Pertanyaan harus spesifik terhadap isi dokumen, bukan pertanyaan generik.

Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown backticks, format persis:
{"quiz":[{"q":"...","options":["...","...","...","..."],"answer":0},{"q":"...","options":["...","...","...","..."],"answer":2}]}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error("Anthropic API error: " + errText);
  }

  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error("Tidak ada respons teks dari AI");

  const clean = textBlock.text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  if (!parsed.quiz || !Array.isArray(parsed.quiz) || parsed.quiz.length === 0) {
    throw new Error("Format kuis dari AI tidak valid");
  }
  return parsed.quiz;
}

// Kuis cadangan kalau pemanggilan AI gagal (mis. API key belum diisi)
export function fallbackQuiz() {
  return [
    {
      q: "Apakah Anda telah membaca seluruh isi dokumen ini?",
      options: [
        "Ya, saya sudah membaca dan memahami",
        "Belum sepenuhnya",
        "Tidak",
        "Lewati saja",
      ],
      answer: 0,
    },
  ];
}
