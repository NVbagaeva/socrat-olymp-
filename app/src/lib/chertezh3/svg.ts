/**
 * Кадр → строка SVG: статичный чертёж для листа, предпросмотра и
 * первого кадра интерактивного чертежа (до загрузки скрипта).
 *
 * Цвета и толщины — атрибутами прямо в SVG, значениями (токены сайта
 * из styles/tokens.css): рисунок не зависит от CSS страницы и одинаков
 * на сайте, на листе, в PDF и на сводном листе. Раньше цвета были
 * var(--solid-edge) и т. п. без запасного значения: вне страниц, где
 * токены не заданы, рёбра пропадали, а заливки становились чёрными.
 *
 * Подписи: простые (имя вершины, число, градусы, корень из числа)
 * пишутся текстом SVG — они печатаются где угодно. Сложные (дробь)
 * — разметкой KaTeX внутри foreignObject, если её дали.
 *
 * Оформление на бумаге (ОФОРМЛЕНИЕ): видимые линии 1,35 pt, невидимые —
 * штрих 0,9 pt (штрих 4 pt, пробел 3 pt), заливка выделенной фигуры не
 * плотнее 0,15, подписи — шрифтом KaTeX: имена курсивом с индексом 70 %
 * ниже строки, числа прямо и не жирно, кегль не меньше 10 pt. Толщины
 * задаются в pt через edPt — единиц рисунка в одном pt на бумаге; лист
 * пересчитывает их под итоговую ширину (sheet/figureRules.js,
 * data-line-pt).
 */

import { KOREN, znakKornyaSvg } from '@/lib/risunki/koren.js';
import { BUKVY, CHISLA, indeksSvg } from '@/lib/risunki/shrifty.js';
import { escSvg, imyaSvg } from '@/lib/stereo/proekciya';
import type { Kadr, LiniyaKadra, PodpisKadra } from './kadr';

export interface OpciiSvg {
  /** Подписи: текстом SVG или не рисовать (интерактив кладёт свои, KaTeX). */
  podpisi?: 'svg' | 'net';
  /**
   * Единиц рисунка в одном pt на бумаге. По умолчанию 4/3: единица —
   * CSS-пиксель экрана (1 px = 0,75 pt).
   */
  edPt?: number;
  /** Цвета токенами (на странице и листе) или значениями (файл). */
  tsveta?: 'tokeny' | 'fiks';
  /** Разметка KaTeX для сложных подписей (дроби). */
  katex?: (tex: string) => string;
  kegl: number;
  alt?: string;
  klass?: string;
}

/* Рёбра — тёмные, построения и подсветка — терракота сайта. Режим
   tsveta оставлен для совместимости: и 'tokeny', и 'fiks' дают значения. */
const FIKS = {
  rebro: '#101728',
  akcent: '#e07a2f',
  podsvetka: '#e07a2f',
  tekst: '#101728',
  fon: '#ffffff',
};
const TOKENY = FIKS;

const f = (x: number) => (Math.round(x * 10) / 10).toString();
const f2 = (x: number) => (Math.round(x * 100) / 100).toString();

/** Оформление чертежа на бумаге, pt. */
export const OFORMLENIE = {
  /** Видимая линия (ребро, отрезок условия, построение): 1,2–1,5 pt. */
  vidno: 1.35,
  /** Подсвеченный шаг решения — толще, но в той же границе. */
  yarko: 1.5,
  /** Невидимая линия: штрих 0,8–1 pt. */
  nevidno: 0.9,
  shtrih: [4, 3] as const,
  /** Заливка выделенной фигуры и подсвеченной — не плотнее 0,15. */
  zalivka: 0.12,
  zalivkaYarko: 0.15,
  /** Кегль подписи, не меньше 10 pt. */
  kegl: 10.3,
  /** Индекс — 70 % кегля. */
  indeks: 0.7,
} as const;

/** Единиц рисунка в pt по умолчанию: CSS-пиксель экрана. */
export const ED_PT_EKRAN = 4 / 3;

/** Стиль линии: цвет, толщина и штрих в единицах рисунка, прозрачность. */
export function stilLinii(
  l: Pick<LiniyaKadra, 'vid' | 'vidno' | 'yarko' | 'tusklo'>,
  edPt: number = ED_PT_EKRAN,
) {
  const o = OFORMLENIE;
  const cvet = l.yarko ? 'podsvetka' : l.vid === 'rebro' ? 'rebro' : 'akcent';
  const pt = !l.vidno ? o.nevidno : l.yarko ? o.yarko : o.vidno;
  let op = l.vidno ? 1 : 0.85;
  if (l.tusklo) op *= 0.28;
  return {
    cvet,
    w: pt * edPt,
    dash: l.vidno ? '' : o.shtrih.map((x) => f2(x * edPt)).join(' '),
    op,
  } as const;
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
  /* Корень — не текстом: знак и черта рисуются путём (podpisSKornem). */
  if (/\\sqrt/.test(rest)) return null;
  rest = plain(rest);
  if (/\\/.test(rest)) return null;
  return rest;
}

/** Ширина простого текста подписи в долях кегля (цифры KaTeX_Main — 0,5). */
function shirinaPlain(t: string): number {
  let w = 0;
  for (const ch of t) {
    if (/[0-9]/.test(ch)) w += 0.5;
    else if (/[A-Za-z]/.test(ch)) w += 0.62;
    else if (ch === ' ') w += 0.25;
    else if (ch === '°') w += 0.4;
    else w += 0.3;
  }
  return w;
}

/**
 * Подпись с корнем («\\sqrt{12}», «35\\sqrt{2}», «a\\sqrt{3}»): куски
 * текста на рассчитанных местах, подкоренное — заданной ширины, знак и
 * черта над всем подкоренным — путь (lib/risunki/koren.js). null —
 * запись сложнее (дробь под корнем и т. п.): её наберёт KaTeX.
 */
function podpisSKornem(
  tex: string,
  x0: number,
  base: number,
  kegl: number,
  shrift: string,
  fill: string,
  op: string,
): string | null {
  const t = tex
    .replace(/\{,\}/g, ',')
    .replace(/\^\\circ/g, '°')
    .trim();
  const re = /\\sqrt\{([0-9A-Za-z,]+)\}/g;
  const kuski: { t: string; koren: boolean }[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    if (m.index > last) kuski.push({ t: t.slice(last, m.index), koren: false });
    kuski.push({ t: m[1] ?? '', koren: true });
    last = m.index + m[0].length;
  }
  if (last < t.length) kuski.push({ t: t.slice(last), koren: false });
  if (kuski.length === 0 || kuski.some((k) => /[\\{}^_]/.test(k.t))) return null;
  let x = x0;
  const tspany: string[] = [];
  const znaki: string[] = [];
  for (const k of kuski) {
    const w = shirinaPlain(k.t) * kegl;
    if (k.koren) {
      znaki.push(znakKornyaSvg(x, base, w, kegl, fill, 'ch3-koren'));
      x += KOREN.znak * kegl;
      tspany.push(
        `<tspan x="${f2(x)}" textLength="${f2(w)}" lengthAdjust="spacingAndGlyphs">${plain(k.t)}</tspan>`,
      );
      x += w + KOREN.hvost * kegl;
    } else {
      tspany.push(`<tspan x="${f2(x)}">${plain(k.t)}</tspan>`);
      x += w;
    }
  }
  return (
    `<g${op}><text y="${f(base)}" font-family="${shrift}" font-size="${f2(kegl)}" fill="${fill}">` +
    `${tspany.join('')}</text>${znaki.join('')}</g>`
  );
}

/** Обозначения латиницей — курсивом, числа — прямо. */
function plain(s: string): string {
  return escSvg(
    s
      .replace(/\\(alpha|beta|gamma|varphi|phi|pi)\b/g, (_, g: string) => GRECH[g] ?? g)
      .replace(/[{}]/g, ''),
  ).replace(
    /([a-zA-Z])(?:_(\w+))?/g,
    /* Индекс — общей типографикой рисунков (lib/risunki): 70 %, опущен,
       многозначный одним блоком; после него строка возвращается. */
    (_, l: string, sub?: string) =>
      `<tspan font-style="italic">${l}</tspan>` + (sub ? indeksSvg(sub, null, true) : ''),
  );
}

/* Шрифты — общие для рисунков (lib/risunki/shrifty): имена — курсив
   KaTeX_Math, числа — прямой KaTeX_Main. */
const SHRIFT_IMENI = BUKVY;
const SHRIFT_CHISLA = CHISLA;

function podpisSvg(p: PodpisKadra, c: typeof TOKENY, o: OpciiSvg): string {
  const op = p.tusklo
    ? ' opacity="0.35"'
    : p.skryta === true
      ? ' opacity="0.55" data-skryt="1"'
      : '';
  const fill = p.yarko ? c.podsvetka : p.vid === 'imya' ? c.tekst : c.akcent;
  const txt = texSvg(p.tex);
  const shrift = p.vid === 'imya' ? SHRIFT_IMENI : SHRIFT_CHISLA;
  if (txt === null) {
    const s = podpisSKornem(p.tex, p.x + 1, p.y + p.h * 0.78, o.kegl, shrift, fill, op);
    if (s !== null) return s;
  }
  if (txt === null && o.katex) {
    /* Формулу (дробь, корень из дроби) набирает KaTeX. Размер блока
       меряется оценкой, а у KaTeX черта корня и черта дроби выше и
       ниже строки: блок с запасом по высоте и overflow: visible —
       иначе SVG обрезает их по краю foreignObject. */
    const zapas = o.kegl * 0.6;
    return (
      `<foreignObject x="${f(p.x)}" y="${f(p.y - zapas / 2)}" width="${f(p.w + 8)}" height="${f(p.h + zapas + 4)}" style="overflow:visible"${op}>` +
      `<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${o.kegl}px;line-height:1;padding-top:${f(zapas / 2)}px;color:${fill};overflow:visible;white-space:nowrap">${o.katex(p.tex)}</div></foreignObject>`
    );
  }
  /* Индекс (indeksSvg) — цифры прямым KaTeX_Main, как в формуле. */
  const tekst = txt ?? escSvg(p.tex);
  return (
    `<text x="${f(p.x + 1)}" y="${f(p.y + p.h * 0.78)}" font-family="${shrift}" font-size="${f2(o.kegl)}" fill="${fill}"${op}>` +
    `${tekst}</text>`
  );
}

export function kadrSvg(k: Kadr, o: OpciiSvg): string {
  const c = o.tsveta === 'fiks' ? FIKS : TOKENY;
  const edPt = o.edPt ?? ED_PT_EKRAN;
  const out: string[] = [];
  for (const z of k.zalivki) {
    const op = (z.yarko ? OFORMLENIE.zalivkaYarko : OFORMLENIE.zalivka) * (z.tusklo ? 0.35 : 1);
    out.push(
      `<polygon points="${z.pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' ')}" fill="${z.yarko ? c.podsvetka : c.akcent}" fill-opacity="${op.toFixed(3)}" stroke="none"/>`,
    );
  }
  // Невидимые под видимыми, тусклые под яркими.
  const rang = (l: LiniyaKadra) => (l.vidno ? 2 : 0) + (l.yarko ? 4 : 0) + (l.tusklo ? 0 : 1);
  for (const l of [...k.linii].sort((x, y) => rang(x) - rang(y))) {
    const s = stilLinii(l, edPt);
    out.push(
      `<line x1="${f(l.a[0])}" y1="${f(l.a[1])}" x2="${f(l.b[0])}" y2="${f(l.b[1])}" stroke="${c[s.cvet]}" stroke-width="${f2(s.w)}" stroke-linecap="${s.dash ? 'butt' : 'round'}"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}${s.op < 1 ? ` stroke-opacity="${s.op.toFixed(2)}"` : ''}/>`,
    );
  }
  for (const p of k.puti) {
    const s = stilLinii({ vid: 'vspom', vidno: p.vidno, yarko: p.yarko, tusklo: p.tusklo }, edPt);
    out.push(
      `<polyline points="${p.pts.map((q) => `${f(q[0])},${f(q[1])}`).join(' ')}" fill="none" stroke="${c[s.cvet]}" stroke-width="${f2(s.w)}"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}${s.op < 1 ? ` stroke-opacity="${s.op.toFixed(2)}"` : ''}/>`,
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
    `<svg xmlns="http://www.w3.org/2000/svg" data-engine="chertezh3" class="${o.klass ?? 'ch3-svg'}" viewBox="0 0 ${f(k.W)} ${f(k.H)}" width="${f(k.W)}" height="${f(k.H)}"` +
    ` data-line-pt="${OFORMLENIE.vidno}" data-line-w="${f2(OFORMLENIE.vidno * edPt)}"${aria}>` +
    out.join('') +
    '</svg>'
  );
}
