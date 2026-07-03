"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [role, setRole] = useState("karyawan");
  const [employeeName, setEmployeeName] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("mom_employee_name");
    if (saved) setEmployeeName(saved);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-5 py-8 pb-16">
      <Topbar role={role} setRole={setRole} />
      {role === "karyawan" ? (
        <KaryawanFlow employeeName={employeeName} setEmployeeName={setEmployeeName} />
      ) : (
        <HrFlow />
      )}
      <p className="text-center text-[11.5px] text-inksoft mt-8 leading-relaxed">
        MoM Read Receipt — bukti sosialisasi digital.
      </p>
    </div>
  );
}

function Topbar({ role, setRole }) {
  return (
    <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-white font-serif font-bold text-sm">
          MR
        </div>
        <div>
          <div className="font-serif font-semibold text-[17px]">MoM Read Receipt</div>
          <div className="text-[11px] text-inksoft font-mono uppercase tracking-wide -mt-0.5">
            Bukti Sosialisasi Digital
          </div>
        </div>
      </div>
      <div className="flex bg-white border border-line rounded-lg p-0.5 gap-0.5">
        {[
          ["karyawan", "Tampilan Karyawan"],
          ["hr", "Dashboard HR"],
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setRole(val)}
            className={`px-3.5 py-2 rounded-md text-[13px] font-semibold transition ${
              role === val ? "bg-ink text-white" : "text-inksoft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white border border-line rounded-2xl p-6 mb-5 ${className}`}>
      {children}
    </div>
  );
}

/* ===================== KARYAWAN ===================== */

function KaryawanFlow({ employeeName, setEmployeeName }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState(null); // doc object or null
  const [view, setView] = useState("list"); // list | reader | retry | locked | already | done
  const [statusMap, setStatusMap] = useState({}); // docId -> {passed, locked, attemptsToday}
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    fetch("/api/docs")
      .then((r) => r.json())
      .then((d) => setDocs(d.docs || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!employeeName || docs.length === 0) return;
    docs.forEach((doc) => {
      fetch(`/api/docs/${doc.id}/receipts?name=${encodeURIComponent(employeeName)}`)
        .then((r) => r.json())
        .then((d) => {
          setStatusMap((prev) => ({
            ...prev,
            [doc.id]: { passed: d.passed, locked: d.locked, attemptsToday: d.attemptsToday },
          }));
        });
    });
  }, [employeeName, docs]);

  if (!employeeName) {
    return <NameGate onSave={(name) => { localStorage.setItem("mom_employee_name", name); setEmployeeName(name); }} />;
  }

  if (loading) return <Card><p className="text-inksoft text-sm">Memuat dokumen…</p></Card>;

  if (view === "list") {
    return (
      <>
        <Card>
          <div className="text-[11px] font-mono uppercase tracking-wide text-golddeep mb-2">Dokumen Menunggu Konfirmasi</div>
          <h1 className="font-serif font-semibold text-2xl mb-1.5">Pilih dokumen untuk dibaca</h1>
          <div className="inline-flex items-center gap-2 bg-[#F5F1E7] border border-[#E9DEC0] text-golddeep px-3 py-1.5 rounded-full text-xs font-semibold mt-3">
            ✓ Masuk sebagai {employeeName}
            <button
              className="text-inksoft underline font-medium"
              onClick={() => { localStorage.removeItem("mom_employee_name"); setEmployeeName(null); }}
            >
              ganti
            </button>
          </div>
        </Card>
        <Card>
          {docs.length === 0 ? (
            <div className="text-center py-10 text-inksoft text-sm">Belum ada dokumen. Buat dari Dashboard HR.</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {docs.map((d) => {
                const st = statusMap[d.id] || {};
                const label = st.passed ? "Sudah lulus" : st.locked ? "Kesempatan habis hari ini" : "Belum dikonfirmasi";
                const badgeClass = st.passed ? "bg-[#E7F1EF] text-teal" : "bg-[#F7E9E4] text-rust";
                return (
                  <div
                    key={d.id}
                    onClick={() => { setActiveDoc(d); setView(st.passed ? "already" : st.locked ? "locked" : "reader"); }}
                    className="flex items-center justify-between border border-line rounded-xl px-4 py-3.5 cursor-pointer hover:border-gold hover:bg-[#FBF8F1] transition"
                  >
                    <div>
                      <div className="font-semibold text-[14.5px]">{d.title}</div>
                      <div className="text-xs text-[#8A93A3] font-mono mt-0.5">{d.id} · {d.doc_date}</div>
                    </div>
                    <div className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${badgeClass}`}>{label}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </>
    );
  }

  if (view === "already") {
    return (
      <Card>
        <StampDone doc={activeDoc} title="Dokumen ini sudah pernah Anda konfirmasi" note="Tidak perlu dikonfirmasi ulang." />
        <div className="text-center">
          <button className="btn-primary mt-4" onClick={() => setView("list")}>Kembali ke daftar dokumen</button>
        </div>
      </Card>
    );
  }

  if (view === "locked") {
    return (
      <Card>
        <div className="text-center py-6 px-2">
          <div className="w-[70px] h-[70px] rounded-full bg-[#F7E9E4] text-rust flex items-center justify-center text-2xl mx-auto mb-4">⏳</div>
          <h2 className="font-serif font-semibold text-lg">Kesempatan hari ini sudah habis</h2>
          <p className="text-inksoft text-sm mt-2">
            Anda sudah mencoba 3x hari ini untuk dokumen <b>{activeDoc?.title}</b> dan belum memenuhi skor minimal.
          </p>
          <p className="text-inksoft text-sm mt-2">
            Silakan pelajari kembali isi dokumennya, lalu coba lagi <b>besok</b>. Kesempatan direset otomatis setiap hari.
          </p>
          <button className="btn-primary mt-4" onClick={() => setView("list")}>Kembali ke daftar dokumen</button>
        </div>
      </Card>
    );
  }

  if (view === "reader" || view === "retry") {
    return (
      <ReaderQuiz
        doc={activeDoc}
        employeeName={employeeName}
        view={view}
        lastResult={lastResult}
        onBack={() => setView("list")}
        onResult={(result) => {
          setLastResult(result);
          if (result.status === "passed") setView("done");
          else if (result.status === "locked") setView("locked");
          else setView("retry");
        }}
      />
    );
  }

  if (view === "done") {
    return (
      <Card>
        <StampDone
          doc={activeDoc}
          title="Konfirmasi tersimpan"
          note="Bukti baca sudah tercatat dan dapat dilihat HR di dashboard."
          extra={lastResult && `${employeeName} · skor kuis ${lastResult.score}/${lastResult.quizLength} · lulus ✓`}
        />
        <div className="text-center">
          <button className="btn-primary mt-4" onClick={() => setView("list")}>Kembali ke daftar dokumen</button>
        </div>
      </Card>
    );
  }

  return null;
}

function NameGate({ onSave }) {
  const [val, setVal] = useState("");
  return (
    <Card>
      <div className="max-w-sm mx-auto text-center">
        <div className="w-11 h-11 rounded-xl bg-ink flex items-center justify-center text-white text-xl mx-auto mb-3.5">👤</div>
        <h1 className="font-serif font-semibold text-2xl mb-1.5">Konfirmasi identitas Anda</h1>
        <p className="text-inksoft text-sm">
          Nama ini akan otomatis dipakai sebagai tanda tangan digital setiap kali Anda mengonfirmasi dokumen.
        </p>
        <input
          className="w-full border border-line rounded-lg px-3.5 py-2.5 mt-3.5 text-sm"
          placeholder="Nama lengkap sesuai data karyawan"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && val.trim() && onSave(val.trim())}
        />
        <button
          className="btn-primary w-full mt-3.5"
          disabled={!val.trim()}
          onClick={() => onSave(val.trim())}
        >
          Simpan & Lanjutkan
        </button>
        <div className="text-[11.5px] text-[#8A93A3] mt-4 leading-relaxed">
          Versi produksi sebaiknya memakai login SSO/NIK karyawan, bukan input bebas.
        </div>
      </div>
    </Card>
  );
}

function ReaderQuiz({ doc, employeeName, view, lastResult, onBack, onResult }) {
  const [scrolledToEnd, setScrolledToEnd] = useState(view === "retry");
  const [acked, setAcked] = useState(view === "retry");
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const allAnswered = doc.quiz.every((_, i) => answers[i] !== undefined);

  function handleScroll(e) {
    const el = e.target;
    const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
    if (pct > 96 && !scrolledToEnd) setScrolledToEnd(true);
  }

  async function submit() {
    setSubmitting(true);
    const res = await fetch(`/api/docs/${doc.id}/receipts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: employeeName, quizAnswers: answers }),
    });
    const data = await res.json();
    setSubmitting(false);
    onResult(data);
  }

  return (
    <Card>
      <button className="text-inksoft text-[13.5px] font-semibold border border-line rounded-lg px-4 py-2" onClick={onBack}>
        ← Kembali ke daftar
      </button>
      <div className="text-[11px] font-mono uppercase tracking-wide text-golddeep mt-4 mb-1.5">
        {doc.id} · {doc.doc_date}
      </div>
      <h1 className="font-serif font-semibold text-2xl mb-1.5">{doc.title}</h1>

      {view === "retry" && (
        <div className="bg-[#F7E9E4] text-rust text-sm rounded-lg px-4 py-3 mt-3">
          Skor sebelumnya {lastResult?.score}/{lastResult?.quizLength} — belum memenuhi ambang lulus. Sisa kesempatan hari ini: {Math.max(0, 3 - (lastResult?.attemptsToday || 0))} dari 3. Silakan tinjau ulang lalu jawab kembali.
        </div>
      )}

      <div
        onScroll={handleScroll}
        className="max-h-[340px] overflow-y-auto border border-line rounded-lg px-5 py-5 bg-[#FCFCFD] leading-relaxed text-[14.5px] mt-4"
        dangerouslySetInnerHTML={{ __html: doc.content + `<p style="color:#8A93A3;font-size:12px;margin-top:16px;">— akhir dokumen —</p>` }}
      />
      <div className="text-center text-[11.5px] text-golddeep font-mono mt-2.5">
        {scrolledToEnd ? "Selesai dibaca — silakan konfirmasi di bawah" : "Gulir sampai bawah untuk mengaktifkan konfirmasi"}
      </div>

      <div className="mt-5 pt-4 border-t border-dashed border-line">
        <label className={`flex items-start gap-2.5 text-[13.5px] ${scrolledToEnd ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <input type="checkbox" checked={acked} disabled={!scrolledToEnd} onChange={(e) => setAcked(e.target.checked)} className="mt-0.5" />
          <span>Saya telah membaca dan memahami isi dokumen ini secara keseluruhan.</span>
        </label>

        {acked && (
          <div className="mt-4">
            <h2 className="font-serif font-semibold text-[19px] mt-1.5">Verifikasi pemahaman singkat</h2>
            <p className="text-inksoft text-sm mb-3">Jawab pertanyaan berikut untuk memastikan isi dokumen benar-benar dipahami.</p>
            {doc.quiz.map((q, qi) => (
              <div key={qi} className="mb-4">
                <div className="font-semibold text-[13.5px] mb-2">{qi + 1}. {q.q}</div>
                <div className="flex flex-col gap-1.5">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 text-[13px] cursor-pointer transition ${
                        answers[qi] === oi ? "border-golddeep bg-[#FBF8F1] font-semibold" : "border-line"
                      }`}
                    >
                      <input type="radio" name={`q${qi}`} checked={answers[qi] === oi} onChange={() => setAnswers({ ...answers, [qi]: oi })} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-[11.5px] text-[#8A93A3] mt-3.5">
              Akan ditandatangani otomatis sebagai <b>{employeeName}</b>.
            </div>
            <button className="btn-primary mt-3.5" disabled={!allAnswered || submitting} onClick={submit}>
              {submitting ? "Menyimpan…" : "Konfirmasi & Tanda Tangani"}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

function StampDone({ doc, title, note, extra }) {
  return (
    <div className="flex flex-col items-center text-center py-6 px-2">
      <div className="w-[140px] h-[140px] border-4 border-[#A83232] rounded-full flex flex-col items-center justify-center text-[#A83232] -rotate-6 relative">
        <div className="absolute inset-2 border border-[#A83232] rounded-full" />
        <div className="font-serif font-bold text-[12px] leading-tight text-center px-3">TELAH DIBACA<br />& DIPAHAMI</div>
        <div className="text-[9.5px] font-mono mt-1.5">{doc?.id}</div>
      </div>
      <h2 className="font-serif font-semibold text-lg mt-5">{title}</h2>
      <p className="text-inksoft text-sm mt-1">{note}</p>
      {extra && <div className="text-inksoft text-[13px] mt-3">{extra}</div>}
    </div>
  );
}

/* ===================== HR ===================== */

function HrFlow() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function login() {
    setError("");
    const res = await fetch("/api/hr-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) setUnlocked(true);
    else setError("Kata sandi salah, coba lagi.");
  }

  if (!unlocked) {
    return (
      <Card>
        <div className="max-w-sm mx-auto text-center">
          <div className="w-11 h-11 rounded-xl bg-ink flex items-center justify-center text-white text-xl mx-auto mb-3.5">🔒</div>
          <h1 className="font-serif font-semibold text-2xl mb-1.5">Akses Dashboard HR</h1>
          <p className="text-inksoft text-sm">Area ini hanya untuk tim HR. Masukkan kata sandi untuk melanjutkan.</p>
          <input
            type="password"
            className="w-full border border-line rounded-lg px-3.5 py-2.5 mt-3.5 text-sm text-center font-mono tracking-widest"
            placeholder="Kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
          <div className="text-rust text-xs mt-2 min-h-[16px]">{error}</div>
          <button className="btn-primary w-full mt-1.5" onClick={login}>Masuk</button>
        </div>
      </Card>
    );
  }

  return <HrDashboard />;
}

function HrDashboard() {
  const [docs, setDocs] = useState([]);
  const [dashDocId, setDashDocId] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [threshold, setThreshold] = useState("0.7");
  const [creating, setCreating] = useState(false);
  const [fileStatus, setFileStatus] = useState("");
  const [formError, setFormError] = useState("");

  function loadDocs() {
    fetch("/api/docs").then((r) => r.json()).then((d) => {
      setDocs(d.docs || []);
      if (!dashDocId && d.docs?.length) setDashDocId(d.docs[0].id);
    });
  }

  useEffect(loadDocs, []);

  useEffect(() => {
    if (!dashDocId) return;
    fetch(`/api/docs/${dashDocId}/receipts`).then((r) => r.json()).then((d) => setReceipts(d.receipts || []));
  }, [dashDocId]);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileStatus(`Mengekstrak teks dari ${file.name}…`);
    try {
      let text = "";
      const name = file.name.toLowerCase();
      if (name.endsWith(".pdf")) {
        const buf = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((it) => it.str).join(" ") + "\n\n";
        }
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
        const buf = await file.arrayBuffer();
        const wb = window.XLSX.read(buf, { type: "array" });
        wb.SheetNames.forEach((sn) => {
          const csv = window.XLSX.utils.sheet_to_csv(wb.Sheets[sn]);
          if (csv.trim()) text += `Sheet: ${sn}\n${csv.trim()}\n\n`;
        });
      } else {
        throw new Error("Format tidak didukung. Gunakan PDF, XLSX, XLS, atau CSV.");
      }
      setContent(text.trim());
      if (!title.trim()) setTitle(file.name.replace(/\.(pdf|xlsx|xls|csv)$/i, ""));
      setFileStatus(`Berhasil mengambil isi dari ${file.name}. Silakan periksa/edit sebelum membuat dokumen.`);
    } catch (err) {
      setFileStatus("Gagal membaca file: " + err.message);
    }
  }

  async function createDoc() {
    setFormError("");
    if (!title.trim() || !content.trim()) {
      setFormError("Judul dan isi dokumen wajib diisi.");
      return;
    }
    setCreating(true);
    const res = await fetch("/api/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, passThreshold: parseFloat(threshold) }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      setFormError(data.error || "Gagal membuat dokumen");
      return;
    }
    setTitle("");
    setContent("");
    setFileStatus("");
    loadDocs();
    setDashDocId(data.doc.id);
  }

  const activeDoc = docs.find((d) => d.id === dashDocId);
  const passed = receipts.filter((r) => r.passed);
  const needsRetry = receipts.filter((r) => !r.passed);

  return (
    <>
      <Card>
        <div className="text-[11px] font-mono uppercase tracking-wide text-golddeep mb-2">Buat Dokumen Baru</div>
        <h1 className="font-serif font-semibold text-2xl mb-4">Sosialisasikan dokumen & hasilkan tautan konfirmasi</h1>

        <label className="text-[12.5px] font-semibold text-inksoft block mb-1.5">Judul dokumen</label>
        <input className="w-full border border-line rounded-lg px-3 py-2.5 text-sm" placeholder="Contoh: Sosialisasi SOP Lembur 2026" value={title} onChange={(e) => setTitle(e.target.value)} />

        <label className="text-[12.5px] font-semibold text-inksoft block mt-3.5 mb-1.5">Unggah file (opsional) — PDF, Excel, atau CSV</label>
        <input type="file" accept=".pdf,.xlsx,.xls,.csv" onChange={handleFile} className="text-sm" />
        {fileStatus && <div className="text-[11.5px] text-[#8A93A3] mt-1">{fileStatus}</div>}

        <label className="text-[12.5px] font-semibold text-inksoft block mt-3.5 mb-1.5">Isi ringkas</label>
        <textarea className="w-full border border-line rounded-lg px-3 py-2.5 text-sm min-h-[110px]" placeholder="Tuliskan isi pengumuman/kebijakan di sini, atau unggah file di atas…" value={content} onChange={(e) => setContent(e.target.value)} />

        <label className="text-[12.5px] font-semibold text-inksoft block mt-3.5 mb-1.5">Skor minimal untuk lulus</label>
        <select className="w-full border border-line rounded-lg px-3 py-2.5 text-sm bg-white" value={threshold} onChange={(e) => setThreshold(e.target.value)}>
          <option value="1">100% — semua jawaban harus benar</option>
          <option value="0.7">70% — cukup toleran</option>
          <option value="0.5">50% — longgar</option>
        </select>
        <div className="text-[11.5px] text-[#8A93A3] mt-1">Kuis dibuat otomatis oleh AI berdasarkan isi dokumen di atas.</div>
        {formError && <div className="text-rust text-xs mt-2">{formError}</div>}
        <button className="btn-primary mt-3.5" disabled={creating} onClick={createDoc}>
          {creating ? "Menyusun kuis…" : "Buat & Hasilkan Kuis Otomatis"}
        </button>
      </Card>

      <Card>
        <div className="text-[11px] font-mono uppercase tracking-wide text-golddeep mb-2">Dashboard Konfirmasi</div>
        <h1 className="font-serif font-semibold text-2xl mb-4">Status pembacaan per dokumen</h1>
        <div className="flex gap-2 flex-wrap mb-4">
          {docs.map((d) => (
            <button
              key={d.id}
              onClick={() => setDashDocId(d.id)}
              className={`border rounded-full px-3.5 py-1.5 text-xs font-semibold ${d.id === dashDocId ? "bg-ink text-white border-ink" : "border-line text-inksoft bg-white"}`}
            >
              {d.title}
            </button>
          ))}
        </div>

        {activeDoc ? (
          <>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <Stat num={passed.length} label="Karyawan lulus konfirmasi" />
              <Stat num={needsRetry.length} label="Percobaan belum lulus" />
              <Stat num={activeDoc.id} label="ID dokumen (tautan unik)" mono />
            </div>
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr>
                  {["Nama", "Waktu Konfirmasi", "Skor Kuis", "Status"].map((h) => (
                    <th key={h} className="text-left text-[11px] uppercase tracking-wide text-[#8A93A3] font-semibold pb-2 border-b border-line">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-[#8A93A3] py-5">Belum ada yang konfirmasi.</td></tr>
                ) : (
                  receipts.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 border-b border-line font-semibold">{r.name}</td>
                      <td className="py-2.5 border-b border-line font-mono text-xs">{new Date(r.created_at).toLocaleString("id-ID")}</td>
                      <td className="py-2.5 border-b border-line">{r.score}/{r.quiz_length}</td>
                      <td className="py-2.5 border-b border-line">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${r.passed ? "bg-[#E7F1EF] text-teal" : "bg-[#F7E9E4] text-rust"}`}>
                          {r.passed ? "Lulus" : "Mengulang"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        ) : (
          <div className="text-center py-10 text-inksoft text-sm">Belum ada dokumen.</div>
        )}
      </Card>
    </>
  );
}

function Stat({ num, label, mono }) {
  return (
    <div className="bg-white border border-line rounded-xl p-4">
      <div className={`font-serif font-semibold text-[28px] ${mono ? "font-mono text-[15px]" : ""}`}>{num}</div>
      <div className="text-[11.5px] text-inksoft mt-0.5">{label}</div>
    </div>
  );
}
