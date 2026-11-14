/**
 * Схема знаков производной в решении — координатная прямая в две строки:
 *
 *   y   │   ↗ возрастает   max   ↘ убывает   min   ↗ возрастает
 *   y′  │ ──────+──────────●─────────−────────●────────+──────▶ x
 *                          −5                 5
 *
 * Верхняя строка — что делает функция на каждом промежутке, нижняя —
 * прямая со знаками производной. Над точкой, где знак меняется,
 * подписано max или min. Выколотая точка (вне области определения) —
 * пустой кружок; конец отрезка — квадратная скобка, граница открытого
 * промежутка — круглая.
 *
 * SVG строкой: схему вставляют и шаги решения на сайте, и лист печати.
 */

export type VidTochki = 'krit' | 'vykolota' | 'konec' | 'granica';

export interface Shema {
  /** Точки по возрастанию: подпись (текст, «−5», «−3π/2») и вид. */
  tochki: { podpis: string; vid: VidTochki }[];
  /** Знаки производной на промежутках слева направо. */
  znaki: ('+' | '-')[];
  /** Есть ли луч левее первой точки и правее последней. */
  luchLevo: boolean;
  luchPravo: boolean;
}

/** Подпись числа на схеме: «−5», «2,5». */
export function podpisChisla(n: number): string {
  const r = Math.round(n * 1e9) / 1e9;
  return String(Object.is(r, -0) ? 0 : r)
    .replace('.', ',')
    .replace('-', '−');
}

/** Схема для точек экстремума: точки и знаки на всей прямой (или от границы области). */
export function shemaPoZnakam(
  tochki: readonly number[],
  znaki: readonly ('+' | '-')[],
  { vykoloty = [], granicaLevo }: { vykoloty?: readonly number[]; granicaLevo?: number } = {},
): Shema {
  const t: Shema['tochki'] = tochki.map((x) => ({
    podpis: podpisChisla(x),
    vid: vykoloty.includes(x) ? 'vykolota' : 'krit',
  }));
  if (granicaLevo !== undefined) {
    /* Левее границы функции нет: первый знак — на промежутке от границы. */
    return {
      tochki: [{ podpis: podpisChisla(granicaLevo), vid: 'granica' }, ...t],
      znaki: [...znaki],
      luchLevo: false,
      luchPravo: true,
    };
  }
  return { tochki: t, znaki: [...znaki], luchLevo: true, luchPravo: true };
}

/** Экстремум в точке i: смена знака слева и справа. */
export function ekstremum(s: Shema, i: number): 'max' | 'min' | null {
  if (s.tochki[i]?.vid !== 'krit') return null;
  const sleva = i - (s.luchLevo ? 0 : 1);
  const l = s.znaki[sleva];
  const p = s.znaki[sleva + 1];
  if (l === '+' && p === '-') return 'max';
  if (l === '-' && p === '+') return 'min';
  return null;
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** SVG схемы: ширина по контейнеру, высота постоянная. */
export function shemaSvg(s: Shema): string {
  const W = 640;
  const H = 128;
  const L = 44; // поле подписей «y», «y′»
  const R = 24; // стрелка оси
  const n = s.tochki.length;
  const intervalov = n - 1 + (s.luchLevo ? 1 : 0) + (s.luchPravo ? 1 : 0);
  const shag = (W - L - R) / Math.max(1, intervalov);
  /* Координаты точек: равные промежутки, лучи — такой же ширины. */
  const xs = s.tochki.map((_, i) => L + shag * (i + (s.luchLevo ? 1 : 0)));
  const granicy = [
    s.luchLevo ? L : (xs[0] ?? L),
    ...xs,
    s.luchPravo ? W - R : (xs[n - 1] ?? W - R),
  ];
  /* Промежутки: между соседними границами, без вырожденных. */
  const prom: [number, number][] = [];
  for (let i = 0; i + 1 < granicy.length; i += 1) {
    const a = granicy[i] as number;
    const b = granicy[i + 1] as number;
    if (b - a > 1) prom.push([a, b]);
  }
  const Y_FN = 30;
  const Y_OS = 84;
  const parts: string[] = [];
  const t = (x: number, y: number, text: string, cls: string, anchor = 'middle') =>
    `<text x="${x.toFixed(1)}" y="${y}" text-anchor="${anchor}" class="${cls}">${esc(text)}</text>`;

  parts.push(t(10, Y_FN + 5, 'y', 'sh-os', 'start'));
  parts.push(t(10, Y_OS + 5, 'y′', 'sh-os', 'start'));
  parts.push(
    `<line x1="${L - 8}" y1="${Y_FN + 18}" x2="${W - 4}" y2="${Y_FN + 18}" class="sh-razdel"/>`,
  );
  /* Ось со стрелкой. */
  const x0 = s.luchLevo ? L - 6 : (xs[0] ?? L);
  parts.push(`<line x1="${x0}" y1="${Y_OS}" x2="${W - 10}" y2="${Y_OS}" class="sh-pryamaya"/>`);
  parts.push(
    `<path d="M${W - 10} ${Y_OS - 5}L${W - 2} ${Y_OS}L${W - 10} ${Y_OS + 5}" class="sh-strelka"/>`,
  );
  parts.push(t(W - 6, Y_OS + 22, 'x', 'sh-x'));

  prom.forEach(([a, b], i) => {
    const z = s.znaki[i];
    if (z === undefined) return;
    const c = (a + b) / 2;
    const vozr = z === '+';
    parts.push(t(c, Y_OS - 10, vozr ? '+' : '−', vozr ? 'sh-plus' : 'sh-minus'));
    parts.push(t(c, Y_FN + 5, vozr ? '↗ возрастает' : '↘ убывает', vozr ? 'sh-vozr' : 'sh-ubyv'));
  });

  s.tochki.forEach((p, i) => {
    const x = xs[i] as number;
    if (p.vid === 'krit') parts.push(`<circle cx="${x}" cy="${Y_OS}" r="4.5" class="sh-tochka"/>`);
    else if (p.vid === 'vykolota')
      parts.push(`<circle cx="${x}" cy="${Y_OS}" r="4.5" class="sh-pustaya"/>`);
    else {
      /* Скобка конца: «[» слева, «]» справа; у открытой границы — круглая. */
      const levyy = i === 0;
      const kv = p.vid === 'konec';
      const d = kv
        ? levyy
          ? `M${x + 5} ${Y_OS - 9}H${x}V${Y_OS + 9}H${x + 5}`
          : `M${x - 5} ${Y_OS - 9}H${x}V${Y_OS + 9}H${x - 5}`
        : levyy
          ? `M${x + 5} ${Y_OS - 9}Q${x - 3} ${Y_OS} ${x + 5} ${Y_OS + 9}`
          : `M${x - 5} ${Y_OS - 9}Q${x + 3} ${Y_OS} ${x - 5} ${Y_OS + 9}`;
      parts.push(`<path d="${d}" class="sh-skobka"/>`);
    }
    parts.push(t(x, Y_OS + 24, p.podpis, 'sh-chislo'));
    const e = ekstremum(s, i);
    if (e !== null) {
      parts.push(`<line x1="${x}" y1="${Y_FN + 24}" x2="${x}" y2="${Y_OS - 6}" class="sh-pod"/>`);
      parts.push(t(x, Y_FN + 5, e, e === 'max' ? 'sh-max' : 'sh-min'));
    }
  });

  return (
    `<svg class="z21-shema" viewBox="0 0 ${W} ${H}" role="img" aria-label="Знаки производной и промежутки возрастания и убывания">` +
    `<style>.z21-shema text{font:15px/1 var(--font-sans,system-ui,sans-serif);fill:#1f2937}` +
    `.z21-shema .sh-os{font-style:italic;font-weight:700;font-size:17px}` +
    `.z21-shema .sh-x{font-style:italic}` +
    `.z21-shema .sh-plus{fill:#15803d;font-weight:700;font-size:20px}` +
    `.z21-shema .sh-minus{fill:#c2410c;font-weight:700;font-size:20px}` +
    `.z21-shema .sh-vozr{fill:#15803d}.z21-shema .sh-ubyv{fill:#c2410c}` +
    `.z21-shema .sh-max,.z21-shema .sh-min{font-weight:700;fill:#1f5fd0}` +
    `.z21-shema .sh-chislo{font-weight:600}` +
    `.z21-shema .sh-pryamaya,.z21-shema .sh-strelka,.z21-shema .sh-skobka{stroke:#1f2937;stroke-width:1.6;fill:none}` +
    `.z21-shema .sh-razdel{stroke:#d1d5db;stroke-width:1}` +
    `.z21-shema .sh-pod{stroke:#1f5fd0;stroke-width:1;stroke-dasharray:3 3}` +
    `.z21-shema .sh-tochka{fill:#1f2937}.z21-shema .sh-pustaya{fill:#fff;stroke:#1f2937;stroke-width:1.6}</style>` +
    parts.join('') +
    `</svg>`
  );
}
