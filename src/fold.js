export function fold(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function likePattern(token) {
  const escaped = fold(token).replace(/[\\%_]/g, "\\$&");
  return `%${escaped}%`;
}

export function clip(value, max = 80) {
  return String(value ?? "").trim().slice(0, max);
}

export function nowIso() {
  return new Date().toISOString();
}
