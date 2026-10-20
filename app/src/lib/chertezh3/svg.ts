/**
 * Кадр → строка SVG: статичный чертёж для листа, предпросмотра и
 * первого кадра интерактивного чертежа (до загрузки скрипта).
 *
 * Цвета — токены палитры сайта (--solid-edge, --graph-accent,
 * --color-text…): на сайте их задаёт tokens.css, на листе — тема
 * листа (sheet/theme.css, цветная и ч/б). Для отдельного файла есть
 * режим `fiks` — те же цвета значениями.
 *
 * Подписи: простые (имя вершины, число, градусы, корень из числа)
 * пишутся текстом SVG — они печатаются где угодно. Сложные (дробь)
 * — разметкой KaTeX внутри foreignObject, если её дали.
 */

import { escSvg, imyaSvg } from '@/lib/stereo/proekciya';
import type { Kadr, LiniyaKadra, PodpisKadra } from './kadr';

export interface OpciiSvg {
  /** Подписи: текстом SVG или не рисовать (интерактив кладёт свои, KaTeX). */
  podpisi?: 'svg' | 'net';
  /** Цвета токенами (на странице и листе) или значениями (файл). */
  tsveta?: 'tokeny' | 'fiks';
  /** Разметка KaTeX для сложных подписей (дроби). */
  katex?: (tex: string) => string;
  kegl: number;
  alt?: string;
  klass?: string;
}

const TOKENY = {
  rebro: 'var(--solid-edge)',
  akcent: 'var(--graph-accent)',
  podsvetka: 'var(--color-accent)',
  tekst: 'var(--color-text)',
  fon: 'var(--color-surface)',
};
const FIKS = {
  rebro: '#1f5fd0',
  akcent: '#e07a2f',
  podsvetka: '#e07a2f',
  tekst: '#101728',
  fon: '#ffffff',
};

const f = (x: number) => (Math.round(x * 10) / 10).toString();

/** Стиль линии: цвет, толщина, штрих, прозрачность. */
export function stilLinii(l: Pick<LiniyaKadra, 'vid' | 'vidno' | 'yarko' | 'tusklo'>) {
  const cvet = l.yarko ? 'podsvetka' : l.vid === 'rebro' ? 'rebro' : 'akcent';
  let w = l.vid === 'rebro' ? 1.6 : l.vid === 'uslovie' ? 2 : 1.4;
  if (l.yarko) w += 1.1;
  if (!l.vidno) w = Math.max(1.1, w - 0.4);
  let op = l.vidno ? 1 : 0.8;
  if (l.tusklo) op *= 0.28;
  return { cvet, w, dash: l.vidno ? '' : '5 4', op } as const;
}

const GRECH: Record<string, string> = {
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  varphi: 'φ',
  phi: 'φ',
  pi: 'π',
};

/** Простой TeX → текст SVG. null — слишком сложно для текста. */
export function texSvg(tex: string): string | null {
  if (/\\frac|\\dfrac|\\cdot|\\tfrac/.test(tex)) return null;
  const name = /^([A-Z])('*)(?:_\{?(\d+)\}?)?$/.exec(tex);
  if (name) {
    const [, b = '', pr = '', idx = ''] = name;
    return imyaSvg(`${b}${idx ? `_${idx}` : ''}${pr}`);
  }
  let rest = tex
    .replace(/\\(alpha|beta|gamma|varphi|phi|pi)\b/g, (_, g: string) => GRECH[g] ?? g)
    .replace(/\{,\}/g, ',')
    .replace(/\^\\circ/g, '°')
    .replace(/\\circ/g, '°');
  const parts: string[] = [];
  const re = /\\sqrt\{([^{}]*)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest)) !== null) {
    parts.push(plain(rest.slice(last, m.index)));
    parts.push(`√<tspan text-decoration="overline">${plain(m[1] ?? '')}</tspan>`);
    last = m.index + m[0].length;
  }
  parts.push(plain(rest.slice(last)));
  rest = parts.join('');
  if (/\\/.test(rest)) return null;
  return rest;
}

/** Обозначения латиницей — курсивом, числа — прямо. */
function plain(s: string): string {
  return escSvg(
    s
      .replace(/\\(alpha|beta|gamma|varphi|phi|pi)\b/g, (_, g: string) => GRECH[g] ?? g)
      .replace(/[{}]/g, ''),
  ).replace(
    /([a-zA-Z])(?:_(\w))?/g,
    (_, l: string, sub?: string) =>
      `<tspan font-style="italic">${l}</tspan>` +
      (sub ? `<tspan baseline-shift="sub" font-size="70%">${sub}</tspan>` : ''),
  );
}

function podpisSvg(p: PodpisKadra, c: typeof TOKENY, o: OpciiSvg): string {
  const op = p.tusklo ? ' opacity="0.35"' : '';
  const fill = p.yarko ? c.podsvetka : p.vid === 'imya' ? c.tekst : c.akcent;
  const weight = p.yarko || p.vid === 'dannoe' ? ' font-weight="600"' : '';
  const txt = texSvg(p.tex);
  if (txt === null && o.katex) {
    return (
      `<foreignObject x="${f(p.x)}" y="${f(p.y)}" width="${f(p.w + 4)}" height="${f(p.h + 4)}"${op}>` +
      `<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${o.kegl}px;line-height:1;color:${fill}">${o.katex(p.tex)}</div></foreignObject>`
    );
  }
  const shrift =
    p.vid === 'imya' ? "'PT Serif', Georgia, serif" : 'var(--font-sans, Inter, sans-serif)';
  return (
    `<text x="${f(p.x + 1)}" y="${f(p.y + p.h * 0.78)}" font-family="${shrift}" font-size="${o.kegl}" fill="${fill}"${weight}${op}>` +
    `${txt ?? escSvg(p.tex)}</text>`
  );
}

export function kadrSvg(k: Kadr, o: OpciiSvg): string {
  const c = o.tsveta === 'fiks' ? FIKS : TOKENY;
  const out: string[] = [];
  for (const z of k.zalivki) {
    const op = (z.yarko ? 0.26 : 0.13) * (z.tusklo ? 0.35 : 1);
    out.push(
      `<polygon points="${z.pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' ')}" fill="${z.yarko ? c.podsvetka : c.akcent}" fill-opacity="${op.toFixed(3)}" stroke="none"/>`,
    );
  }
  // Невидимые под видимыми, тусклые под яркими.
  const rang = (l: LiniyaKadra) => (l.vidno ? 2 : 0) + (l.yarko ? 4 : 0) + (l.tusklo ? 0 : 1);
  for (const l of [...k.linii].sort((x, y) => rang(x) - rang(y))) {
    const s = stilLinii(l);
    out.push(
      `<line x1="${f(l.a[0])}" y1="${f(l.a[1])}" x2="${f(l.b[0])}" y2="${f(l.b[1])}" stroke="${c[s.cvet]}" stroke-width="${s.w}" stroke-linecap="round"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}${s.op < 1 ? ` stroke-opacity="${s.op.toFixed(2)}"` : ''}/>`,
    );
  }
  for (const p of k.puti) {
    const s = stilLinii({ vid: 'vspom', vidno: p.vidno, yarko: p.yarko, tusklo: p.tusklo });
    out.push(
      `<polyline points="${p.pts.map((q) => `${f(q[0])},${f(q[1])}`).join(' ')}" fill="none" stroke="${c[s.cvet]}" stroke-width="${s.w}"${s.dash ? ` stroke-dasharray="3 3"` : ''}${s.op < 1 ? ` stroke-opacity="${s.op.toFixed(2)}"` : ''}/>`,
    );
  }
  for (const t of k.tochki) {
    out.push(
      `<circle cx="${f(t.p[0])}" cy="${f(t.p[1])}" r="${t.yarko ? 3.6 : 2.8}" fill="${t.yarko ? c.podsvetka : c.tekst}"${t.tusklo ? ' opacity="0.35"' : ''}/>`,
    );
  }
  if (o.podpisi !== 'net') {
    for (const p of k.podpisi) out.push(podpisSvg(p, c, o));
  }
  const aria = o.alt
    ? ` role="img" aria-label="${escSvg(o.alt).replace(/"/g, '&quot;')}"`
    : ' aria-hidden="true"';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="${o.klass ?? 'ch3-svg'}" viewBox="0 0 ${f(k.W)} ${f(k.H)}" width="${f(k.W)}" height="${f(k.H)}"${aria}>` +
    out.join('') +
    '</svg>'
  );
}
