// Memanggil Google Gemini API untuk merapikan isi dokumen mentah (hasil
// ketik bebas atau ekstraksi dari PDF/Excel yang sering jadi satu paragraf
// panjang) menjadi HTML terstruktur: ada heading, paragraf terpisah, dan
// poin-poin/bullet kalau memang ada daftar di dalamnya.
//
// PENTING: prompt secara eksplisit meminta AI untuk TIDAK mengubah,
// meringkas, atau menghilangkan informasi apapun — hanya menata ulang
// strukturnya. ini penting karena isi dokumen adalah kebijakan/pengumuman
// resmi, bukan draft yang boleh diparafrase.
export async function formatDocumentHtml(title, rawContent) {
  const prompt = `Kamu membantu merapikan FORMAT dokumen sosialisasi internal perusahaan (Bahasa Indonesia). Ini kebijakan/pengumuman resmi, jadi kamu HARUS mempertahankan setiap informasi, angka, dan kata-kata asli — JANGAN meringkas, JANGAN mengubah makna, JANGAN menambah informasi baru. Tugasmu murni menata ulang strukturnya saja: pisahkan jadi paragraf yang wajar, ubah daftar/list yang tersirat (misal ditandai "-" atau angka berurutan) menjadi <ul><li>, dan beri heading <h3> secukupnya kalau ada bagian yang jelas berbeda topik (misal "Ringkasan", "Ketentuan", "Berlaku Efektif").

Judul dokumen: "${title}"

Isi mentah:
"""${rawContent}"""

Balas HANYA dengan potongan HTML (tanpa <html>/<body>, tanpa markdown backticks, tanpa penjelasan tambahan), memakai tag <h3>, <p>, <ul>, <li> saja.`;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error("Gemini API error (format): " + errText);
  }

  const data = await response.json();
  const textBlock = data?.candidates?.[0]?.content?.parts?.[0];
  if (!textBlock) throw new Error("Tidak ada respons teks dari AI");

  let html = textBlock.text.replace(/```html|```/g, "").trim();
  if (!html.includes("<")) {
    // Jaga-jaga kalau AI tidak mengembalikan HTML sama sekali
    throw new Error("Format hasil AI tidak valid");
  }
  return html;
}

// Format cadangan kalau pemanggilan AI gagal — tetap lebih rapi daripada
// satu paragraf mentah, dengan memecah baris yang diawali "-" jadi <li>.
export function fallbackFormatHtml(rawContent) {
  const lines = rawContent.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  let html = "";
  let inList = false;
  for (const line of lines) {
    const isBullet = /^[-•*]\s+/.test(line);
    const text = escapeHtml(line.replace(/^[-•*]\s+/, ""));
    if (isBullet) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${text}</li>`;
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p>${text}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html || `<p>${escapeHtml(rawContent)}</p>`;
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
