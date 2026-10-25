/**
 * Плоский рабочий треугольник — правая панель двухпанельного формата
 * «пространство → треугольник»: тот же треугольник, что выделен на
 * объёмном чертеже, нарисован отдельно, в натуральную величину, с
 * данными и знаком прямого угла.
 *
 * Чистый TypeScript, без DOM: SVG строкой, как у lib/solid. Цвета —
 * те же переменные, что у объёмного чертежа: выделенный треугольник
 * на обеих панелях одного цвета.
 */

export interface PloskiyTreugolnik {
  /** Вершины: прямой угол — у первой. «C», «A₂» пишутся «C», «A2». */
  vershiny: readonly [string, string, string];
  /** Катеты в натуральную величину: от первой вершины ко второй и к третьей. */
  kateti: readonly [number, number];
  /** Подписи сторон: катет к второй вершине, катет к третьей, гипотенуза. */
  podpisi: { a?: string; b?: string; c?: string };
  /** Что ищем: сторона или острый угол — выделены и подписаны. */
  iskomoe?: 'a' | 'b' | 'c' | 'ugolB' | 'ugolC';
  /** Описание для голосового доступа. */
  alt: string;
}

type P = [number, number];

const FIT = 220;
const PAD = 34;
const FONT = 15;

function px(v: number): string {
  return String(Math.round(v * 10) / 10);
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Имя вершины: буква и индекс — индекс нижним регистром, как на объёмном чертеже. */
function imya(name: string, x: number, y: number, anchor: string, weight = 700): string {
  const m = /^([A-Za-zА-Яа-я])(\d*)$/.exec(name);
  const base = m?.[1] ?? name;
  const sub = m?.[2] ?? '';
  return (
    `<text x="${px(x)}" y="${px(y)}" text-anchor="${anchor}" dominant-baseline="middle" ` +
    `font-family="var(--font-sans)" font-size="${FONT}" font-weight="${weight}" fill="var(--color-text)">` +
    `${esc(base)}${sub === '' ? '' : `<tspan font-size="10.5" dy="3.5">${esc(sub)}</tspan>`}</text>`
  );
}

function podpis(text: string, x: number, y: number, hl: boolean): string {
  return (
    `<text x="${px(x)}" y="${px(y)}" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="var(--font-sans)" font-size="${FONT}" font-weight="${hl ? 700 : 600}" ` +
    `fill="${hl ? 'var(--graph-accent)' : 'var(--color-text)'}" paint-order="stroke" ` +
    `stroke="var(--color-surface)" stroke-width="4" stroke-linejoin="round">${esc(text)}</text>`
  );
}

function sub2(a: P, b: P): P {
  return [a[0] - b[0], a[1] - b[1]];
}

function norm(v: P): P {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
}

/** Вершины треугольника на экране: прямой угол внизу слева. */
export function vershinyNaEkrane(t: PloskiyTreugolnik): [P, P, P] {
  const [a, b] = t.kateti;
  const k = FIT / Math.max(a, b);
  const C: P = [PAD, PAD + b * k];
  const A: P = [PAD + a * k, PAD + b * k];
  const B: P = [PAD, PAD];
  return [C, A, B];
}

/** SVG рабочего треугольника. */
export function renderPloskiy(t: PloskiyTreugolnik): string {
  const [C, A, B] = vershinyNaEkrane(t);
  const width = Math.max(A[0], C[0]) + PAD;
  const height = C[1] + PAD;
  const center: P = [(C[0] + A[0] + B[0]) / 3, (C[1] + A[1] + B[1]) / 3];
  const parts: string[] = [];

  parts.push(
    `<path d="M${px(C[0])} ${px(C[1])}L${px(A[0])} ${px(A[1])}L${px(B[0])} ${px(B[1])}Z" ` +
      `fill="var(--graph-accent)" fill-opacity="0.14" stroke="none"/>`,
  );
  const side = (p: P, q: P, hl: boolean) =>
    parts.push(
      `<path d="M${px(p[0])} ${px(p[1])}L${px(q[0])} ${px(q[1])}" fill="none" ` +
        `stroke="${hl ? 'var(--graph-accent)' : 'var(--solid-edge)'}" stroke-width="${hl ? 3.4 : 2}" stroke-linecap="round"/>`,
    );
  side(C, A, t.iskomoe === 'a');
  side(C, B, t.iskomoe === 'b');
  side(A, B, t.iskomoe === 'c');

  /* Знак прямого угла. */
  const m = 13;
  parts.push(
    `<path d="M${px(C[0] + m)} ${px(C[1])}L${px(C[0] + m)} ${px(C[1] - m)}L${px(C[0])} ${px(C[1] - m)}" ` +
      `fill="none" stroke="var(--graph-accent)" stroke-width="1.6"/>`,
  );

  /* Искомый острый угол — дуга у вершины. */
  if (t.iskomoe === 'ugolB' || t.iskomoe === 'ugolC') {
    const at = t.iskomoe === 'ugolB' ? A : B;
    const u = norm(sub2(C, at));
    const v = norm(sub2(t.iskomoe === 'ugolB' ? B : A, at));
    const r = 26;
    const p1: P = [at[0] + u[0] * r, at[1] + u[1] * r];
    const p2: P = [at[0] + v[0] * r, at[1] + v[1] * r];
    const sweep = u[0] * v[1] - u[1] * v[0] > 0 ? 1 : 0;
    parts.push(
      `<path d="M${px(p1[0])} ${px(p1[1])}A${r} ${r} 0 0 ${sweep} ${px(p2[0])} ${px(p2[1])}" ` +
        `fill="none" stroke="var(--graph-accent)" stroke-width="2.4"/>`,
    );
  }

  /* Подписи сторон: снаружи, со сдвигом от линии. */
  const off = (p: P, q: P, d: number): P => {
    const mid: P = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const n = norm([-(q[1] - p[1]), q[0] - p[0]]);
    const out = (mid[0] - center[0]) * n[0] + (mid[1] - center[1]) * n[1] >= 0 ? 1 : -1;
    return [mid[0] + n[0] * d * out, mid[1] + n[1] * d * out];
  };
  const { a, b, c } = t.podpisi;
  if (a !== undefined) {
    const p = off(C, A, 14);
    parts.push(podpis(a, p[0], p[1], t.iskomoe === 'a'));
  }
  if (b !== undefined) {
    const p = off(C, B, 10);
    const w = b.length * 4.5;
    parts.push(podpis(b, p[0] - w, p[1], t.iskomoe === 'b'));
  }
  if (c !== undefined) {
    const p = off(A, B, 16);
    const w = c.length * 4.5;
    parts.push(podpis(c, p[0] + w, p[1], t.iskomoe === 'c'));
  }

  /* Имена вершин: от центра наружу. */
  const name = (p: P, text: string) => {
    const d = norm(sub2(p, center));
    parts.push(imya(text, p[0] + d[0] * 17, p[1] + d[1] * 17, 'middle'));
  };
  name(C, t.vershiny[0]);
  name(A, t.vershiny[1]);
  name(B, t.vershiny[2]);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px(width)} ${px(height)}" ` +
    `width="${px(width)}" height="${px(height)}" role="img" aria-label="${esc(t.alt)}" class="ploskiy">` +
    `<title>${esc(t.alt)}</title>${parts.join('')}</svg>`
  );
}
