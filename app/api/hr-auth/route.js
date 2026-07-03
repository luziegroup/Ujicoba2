import { NextResponse } from "next/server";

// Login HR sangat sederhana: cek password terhadap env var, lalu set
// cookie httpOnly. Ini masih level "dasar" — untuk data sensitif
// sungguhan, upgrade ke Supabase Auth (email+password per akun HR)
// supaya setiap HR punya login sendiri dan bisa di-audit.
export async function POST(req) {
  const { password } = await req.json();

  if (!password || password !== process.env.HR_PASSWORD) {
    return NextResponse.json({ ok: false, error: "Kata sandi salah" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("hr_session", process.env.HR_PASSWORD, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 jam
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("hr_session");
  return res;
}
