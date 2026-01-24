export const $ = (id) => document.getElementById(id);

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

export function safeJsonParse(el) {
  try { return JSON.parse(el.textContent); }
  catch (e) { console.error("[digital] JSON parse failed:", e); return []; }
}

export function mod(n, m) {
  return ((n % m) + m) % m;
}

export function setStyleImportant(el, prop, value) {
  if (!el) return;
  el.style.setProperty(prop, value, "important");
}

export function setTransformImportant(el, value) {
  setStyleImportant(el, "transform", value);
}

export function setTransitionImportant(el, value) {
  setStyleImportant(el, "transition", value);
}
