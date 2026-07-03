export function isHrAuthed(req) {
  const cookie = req.cookies.get("hr_session");
  return !!cookie && cookie.value === process.env.HR_PASSWORD;
}
