/**
 * Чертёж для печати и экспорта: всегда параллельная проекция.
 *
 * Берётся направление взгляда текущей камеры (в режиме «3D» — тоже),
 * видимость пересчитывается для параллельной проекции, подписи
 * раскладываются заново. Результат — самостоятельный SVG: линии,
 * штрих невидимых, заливка сечения, подписи текстом SVG (индекс —
 * нижним, штрихи — знаком ′), без KaTeX и внешних шрифтов.
 */

import { type P2, type V, centroid } from './geom';
import { bazis, imyaSvg, proj, shirinaImeni } from '@/lib/stereo/proekciya';
import { razlozhit } from './metki';
import type { Scena } from './scena';
import { type Kamera, linii } from './vidimost';

/* Проекция и подписи текстом SVG — общее ядро (lib/stereo/proekciya). */
export { type Bazis, bazis, imyaSvg, shirinaImeni } from '@/lib/stereo/proekciya';

/** Цвета чертежа: из палитры сайта (tokens.css). */
export const TSVETA = {
  liniya: '#1b1f24',
  sechenie: '#e07a2f',
  zalivka: '#e07a2f',
  vspom: '#1f5fd0',
  ploskost: '#1f5fd0',
};

export interface OpciiSvg {
  shirina?: number;
  kegl?: number;
  sdvigi?: readonly V[];
  bezSecheniya?: boolean;
}

/** SVG чертежа в параллельной проекции по направлению k (к зрителю). */
export function chertezhSvg(sc: Scena, k: V, up: V, o: OpciiSvg = {}): string {
  const b = bazis(k, up);
  const kam: Kamera = { vid: 'orto', k: b.k };
  const ls = linii(sc, kam, o.sdvigi);
  const kegl = o.kegl ?? 18;
  const W = o.shirina ?? 640;

  const vse: P2[] = [];
  for (const l of ls) {
    vse.push(proj(b, l.a), proj(b, l.b));
  }
  for (const v of sc.ploskost ?? []) {
    vse.push(proj(b, v));
  }
  for (const m of sc.metki) {
    vse.push(proj(b, m.p));
  }
  const xs = vse.map((p) => p[0]);
  const ys = vse.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const pole = kegl * 2.2;
  const s = (W - 2 * pole) / Math.max(x1 - x0, 1e-9);
  const H = Math.round((y1 - y0) * s + 2 * pole);
  const map = (p: P2): P2 => [(p[0] - x0) * s + pole, (p[1] - y0) * s + pole];
  const P = (v: V) => map(proj(b, v));
  const f = (x: number) => x.toFixed(1);

  const parts: string[] = [];
  // Порядок заливок: плоскость, затем сечение, затем все линии.
  if (sc.ploskost) {
    const pts = sc.ploskost.map((v) => P(v).map(f).join(',')).join(' ');
    parts.push(
      `<polygon points="${pts}" fill="${TSVETA.ploskost}" fill-opacity="0.08" stroke="none"/>`,
    );
  }
  if (sc.sechenie && !o.bezSecheniya) {
    const pts = sc.sechenie.pts.map((v) => P(v).map(f).join(',')).join(' ');
    parts.push(
      `<polygon points="${pts}" fill="${TSVETA.zalivka}" fill-opacity="0.22" stroke="none"/>`,
    );
  }
  // Порядок: плоскость, построение, рёбра, сечение — сечение поверх.
  const RANG = { ploskost: 0, vspom: 1, rebro: 2, sechenie: 3 } as const;
  for (const l of [...ls].sort((x, y) => RANG[x.vid] - RANG[y.vid])) {
    const [a, c] = [P(l.a), P(l.b)];
    const color =
      l.vid === 'sechenie'
        ? TSVETA.sechenie
        : l.vid === 'vspom'
          ? TSVETA.vspom
          : l.vid === 'ploskost'
            ? TSVETA.ploskost
            : TSVETA.liniya;
    const w = l.vid === 'sechenie' ? 2.6 : l.vid === 'rebro' ? 1.5 : 1.1;
    const dash = l.vidno ? '' : ' stroke-dasharray="6 4"';
    parts.push(
      `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(c[0])}" y2="${f(c[1])}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"${dash}/>`,
    );
  }
  for (const m of sc.metki) {
    if (m.vid === 'tochka') {
      const p = P(m.p);
      parts.push(`<circle cx="${f(p[0])}" cy="${f(p[1])}" r="3" fill="${TSVETA.liniya}"/>`);
    }
  }
  const linii2 = ls.map((l) => [P(l.a), P(l.b)] as const);
  const c2 = map(proj(b, centroid(sc.metki.map((m) => m.p))));
  const pos = razlozhit(
    sc.metki.map((m) => ({ p: P(m.p), w: shirinaImeni(m.name, kegl), h: kegl * 1.15 })),
    linii2,
    c2,
  );
  sc.metki.forEach((m, i) => {
    const q = pos[i];
    if (!q) return;
    parts.push(
      `<text x="${f(q.x)}" y="${f(q.y + kegl * 0.9)}" font-family="'PT Serif', Georgia, serif" font-size="${kegl}" fill="${TSVETA.liniya}">${imyaSvg(m.name)}</text>`,
    );
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#fff"/>${parts.join('')}</svg>`;
}

/** Сечение в натуральную величину — SVG: многоугольник и имена вершин. */
export function naturalnayaSvg(
  nv: { pts: readonly P2[]; names: readonly (string | null)[] },
  W = 360,
  kegl = 18,
): string {
  const xs = nv.pts.map((p) => p[0]);
  const ys = nv.pts.map((p) => -p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const pole = kegl * 2;
  const s = Math.min(
    (W - 2 * pole) / Math.max(x1 - x0, 1e-9),
    (W - 2 * pole) / Math.max(y1 - y0, 1e-9),
  );
  const H = Math.round((y1 - y0) * s + 2 * pole);
  const P = (p: P2): P2 => [(p[0] - x0) * s + pole, (-p[1] - y0) * s + pole];
  const pts = nv.pts.map(P);
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const f = (x: number) => x.toFixed(1);
  const poly = `<polygon points="${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' ')}" fill="${TSVETA.zalivka}" fill-opacity="0.22" stroke="${TSVETA.sechenie}" stroke-width="2.2" stroke-linejoin="round"/>`;
  const names = pts
    .map((p, i) => {
      const name = nv.names[i];
      if (!name) return '';
      const dx = p[0] - cx;
      const dy = p[1] - cy;
      const l = Math.hypot(dx, dy) || 1;
      const w = shirinaImeni(name, kegl);
      const x = p[0] + (dx / l) * (kegl * 0.9) - w / 2;
      const y = p[1] + (dy / l) * (kegl * 0.9) + kegl * 0.35;
      return `<text x="${f(x)}" y="${f(y)}" font-family="'PT Serif', Georgia, serif" font-size="${kegl}" fill="${TSVETA.liniya}">${imyaSvg(name)}</text>`;
    })
    .join('');
  const dots = pts
    .map((p) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="2.5" fill="${TSVETA.liniya}"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${poly}${dots}${names}</svg>`;
}
