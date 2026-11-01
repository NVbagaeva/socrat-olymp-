/**
 * Прямой счёт для проверок формул карточек (scripts/verify_cards):
 * фигура по координатам, длины, углы, площадь «шнурком». Формула
 * карточки сверяется с этим счётом, а не сама с собой.
 */

export type P = readonly [number, number];

export const dist = (a: P, b: P): number => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** Площадь многоугольника по вершинам (формула шнурка). */
export function ploshchad(...t: P[]): number {
  let s = 0;
  t.forEach((a, i) => {
    const b = t[(i + 1) % t.length]!;
    s += a[0] * b[1] - b[0] * a[1];
  });
  return Math.abs(s) / 2;
}

/** Угол при вершине v (радианы). */
export function ugol(a: P, v: P, b: P): number {
  const x1 = a[0] - v[0];
  const y1 = a[1] - v[1];
  const x2 = b[0] - v[0];
  const y2 = b[1] - v[1];
  /* У коллинеарных векторов отношение выходит за 1 на погрешность счёта. */
  const c = (x1 * x2 + y1 * y2) / (Math.hypot(x1, y1) * Math.hypot(x2, y2));
  return Math.acos(Math.min(1, Math.max(-1, c)));
}

export const gr = (rad: number): number => (rad * 180) / Math.PI;
export const rad = (g: number): number => (g * Math.PI) / 180;

/** Невырожденный треугольник со случайными вершинами. */
export function treugolnik(rnd: () => number): [P, P, P] {
  for (;;) {
    const t: [P, P, P] = [
      [rnd() * 10, rnd() * 10],
      [rnd() * 10, rnd() * 10],
      [rnd() * 10, rnd() * 10],
    ];
    const [A, B, C] = t;
    const s = ploshchad(A, B, C);
    const minUgol = Math.min(ugol(B, A, C), ugol(A, B, C), ugol(A, C, B));
    if (s > 2 && minUgol > 0.15) return t;
  }
}

/** Центр описанной окружности треугольника. */
export function centrOpisannoy(A: P, B: P, C: P): P {
  const d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]));
  const sq = (p: P) => p[0] * p[0] + p[1] * p[1];
  return [
    (sq(A) * (B[1] - C[1]) + sq(B) * (C[1] - A[1]) + sq(C) * (A[1] - B[1])) / d,
    (sq(A) * (C[0] - B[0]) + sq(B) * (A[0] - C[0]) + sq(C) * (B[0] - A[0])) / d,
  ];
}

/** Центр вписанной окружности: среднее вершин с весами противолежащих сторон. */
export function centrVpisannoy(A: P, B: P, C: P): P {
  const a = dist(B, C);
  const b = dist(A, C);
  const c = dist(A, B);
  const p = a + b + c;
  return [(a * A[0] + b * B[0] + c * C[0]) / p, (a * A[1] + b * B[1] + c * C[1]) / p];
}

/** Расстояние от точки до прямой AB. */
export function doPryamoy(p: P, a: P, b: P): number {
  return (2 * ploshchad(p, a, b)) / dist(a, b);
}

/** Точка на окружности: центр, радиус, угол в градусах. */
export const naOkr = (o: P, r: number, g: number): P => [
  o[0] + r * Math.cos(rad(g)),
  o[1] + r * Math.sin(rad(g)),
];
