/** Общее для проверок семей U, V, W: принадлежность множеству ответа. */
export function vMnozhestve(kuski, x, eps = 1e-9) {
  for (let i = 0; i < kuski.length; i += 4) {
    const [lo, hi, loZ, hiZ] = kuski.slice(i, i + 4);
    const l = loZ ? x >= lo - eps : x > lo + eps;
    const h = hiZ ? x <= hi + eps : x < hi - eps;
    if (l && h) return true;
  }
  return false;
}

/** Точки для проверки множества: концы, середины, далёкие значения. */
export function tochkiProverki(kuski) {
  const ends = [];
  for (let i = 0; i < kuski.length; i += 4)
    for (const v of [kuski[i], kuski[i + 1]]) if (Math.abs(v) < 1e8) ends.push(v);
  const s = [...new Set(ends)].sort((a, b) => a - b);
  const out = [...s, (s[0] ?? 0) - 7.3, (s[s.length - 1] ?? 0) + 7.3];
  for (let i = 0; i + 1 < s.length; i++) out.push((s[i] + s[i + 1]) / 2);
  return out;
}

export const dist3 = (P, Q) => Math.hypot(P[0] - Q[0], P[1] - Q[1], P[2] - Q[2]);
export const sub3 = (a, b) => a.map((x, i) => x - b[i]);
export const cross3 = (u, v) => [
  u[1] * v[2] - u[2] * v[1],
  u[2] * v[0] - u[0] * v[2],
  u[0] * v[1] - u[1] * v[0],
];
export const dot3 = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
export const len3 = (u) => Math.sqrt(dot3(u, u));
/** Расстояние от точки P до плоскости ABC. */
export const doPloskosti = (P, A, B, C) => {
  const n = cross3(sub3(B, A), sub3(C, A));
  return Math.abs(dot3(n, sub3(P, A))) / len3(n);
};
