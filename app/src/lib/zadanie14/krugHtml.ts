/**
 * Тригонометрическая окружность №14 — разметка: SVG линий и подписи
 * KaTeX поверх (как чертежи №16). Одна функция на сайт, тренажёр и
 * печатный лист: на выходе строка HTML, её вставляют как есть.
 *
 * Подписи точек — синие и полужирные; дуга промежутка и ключевые точки
 * — цветом акцента и толще остальных линий. Подписи стоят в процентах
 * рисунка, кегль — в долях ширины (container query), поэтому рисунок
 * масштабируется целиком и подписи не съезжают с мест.
 */

import { katex } from '../graph/katex';
import { geomKruga, KEGL, chislo as f, type KrugSpec } from './krug';
import {
  korniNaPromezhutke,
  q,
  sdvig,
  ugolTex,
  val,
  znach,
  type Promezhutok,
  type Seriya,
  type Ugol,
} from './ugol';

function esc(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function tex(t: string, zhirno: boolean): string {
  const src = zhirno ? `\\boldsymbol{${t}}` : t;
  return katex.renderToString(src, { throwOnError: false, displayFrac: true } as never);
}

/** Окружность одной строкой HTML. */
export function krugHtml(spec: KrugSpec, klass = ''): string {
  const g = geomKruga(spec);
  const { x, y, w, h } = g.vb;
  const pct = (v: number, o: number, of: number) => `${f(((v - o) / of) * 100)}%`;
  const svg: string[] = [];
  svg.push(
    `<svg class="k14__svg" viewBox="${f(x)} ${f(y)} ${f(w)} ${f(h)}" aria-hidden="true" focusable="false">`,
  );
  /* Оси со стрелками. */
  const o = g.osi;
  svg.push(`<line class="k14__os" x1="${f(o.x1)}" y1="0" x2="${f(o.x2)}" y2="0"/>`);
  svg.push(`<line class="k14__os" x1="0" y1="${f(o.y1)}" x2="0" y2="${f(o.y2)}"/>`);
  svg.push(
    `<path class="k14__strelka" d="M${f(o.x2 - 9)} -4.5L${f(o.x2)} 0L${f(o.x2 - 9)} 4.5Z"/>`,
    `<path class="k14__strelka" d="M-4.5 ${f(o.y2 + 9)}L0 ${f(o.y2)}L4.5 ${f(o.y2 + 9)}Z"/>`,
  );
  if (g.osTg) {
    svg.push(
      `<line class="k14__os-tg" x1="${f(g.osTg.x)}" y1="${f(g.osTg.y1)}" x2="${f(g.osTg.x)}" y2="${f(g.osTg.y2)}"/>`,
    );
  }
  if (g.osCtg) {
    svg.push(
      `<line class="k14__os-tg" x1="${f(g.osCtg.x1)}" y1="${f(g.osCtg.y)}" x2="${f(g.osCtg.x2)}" y2="${f(g.osCtg.y)}"/>`,
    );
  }
  svg.push('<circle class="k14__okr" cx="0" cy="0" r="100"/>');
  for (const z of g.zasechki) {
    svg.push(
      `<line class="k14__zasechka" x1="${f(z.x1)}" y1="${f(z.y1)}" x2="${f(z.x2)}" y2="${f(z.y2)}"/>`,
    );
  }
  for (const l of g.linii) {
    svg.push(
      `<line class="k14__${l.vid}" x1="${f(l.x1)}" y1="${f(l.y1)}" x2="${f(l.x2)}" y2="${f(l.y2)}"/>`,
    );
  }
  if (g.duga) {
    svg.push(`<path class="k14__duga" d="${g.duga.d}"/>`);
    if (g.duga.strelka !== '') svg.push(`<path class="k14__duga-strelka" d="${g.duga.strelka}"/>`);
  }
  for (const t of g.tochki) {
    const k = [
      'k14__tochka',
      t.akcent ? 'k14__tochka--akcent' : '',
      t.vykolota ? 'k14__tochka--vykolota' : '',
      t.znach ? 'k14__tochka--znach' : '',
    ]
      .filter(Boolean)
      .join(' ');
    svg.push(
      `<circle class="${k}" cx="${f(t.x)}" cy="${f(t.y)}" r="${t.znach ? 3.6 : t.akcent ? 5.2 : 4.4}"/>`,
    );
  }
  svg.push('</svg>');
  const podpisi = g.podpisi
    .map((p) => {
      const left = pct(p.x, x, w);
      const top = pct(p.y, y, h);
      const zhirno = p.vid === 'tochka' || p.vid === 'konec';
      const k = `k14__podpis k14__podpis--${p.vid}${p.akcent ? ' k14__podpis--akcent' : ''}`;
      return `<span class="${k}" style="left:${left};top:${top}">${tex(p.tex, zhirno)}</span>`;
    })
    .join('');
  /* Кегль подписи — доля ширины рисунка: KEGL единиц viewBox. */
  const kegl = f((KEGL / w) * 100);
  return (
    `<figure class="k14${klass ? ` ${klass}` : ''}${g.pustoy ? ' k14--pustoy' : ''}" role="img" aria-label="${esc(g.opisanie)}" ` +
    `style="--k14-kegl:${kegl}cqi;aspect-ratio:${f(w)} / ${f(h)}">` +
    `<div class="k14__holst">${svg.join('')}${podpisi}</div></figure>`
  );
}

/** Несколько окружностей рядом (длинный промежуток). */
export function krugiHtml(specs: readonly KrugSpec[], klass = ''): string {
  if (specs.length === 1) return krugHtml(specs[0] as KrugSpec, klass);
  return `<div class="k14-ryad">${specs.map((s) => krugHtml(s, klass)).join('')}</div>`;
}

/** Точки серий на одном обороте $[0;\,2\pi)$ — начала серий как в записи ответа. */
export function tochkiSeriy(serii: readonly Seriya[]): Ugol[] {
  const out: Ugol[] = [];
  for (const sr of serii) {
    const n = Math.max(1, Math.round(2 / val(sr.shag)));
    for (let j = 0; j < n; j += 1) {
      const a = sdvig(sr.nach, q(sr.shag.n * j, sr.shag.m));
      const t = ((znach(a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      if (
        !out.some(
          (b) => Math.abs((((znach(b) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - t) < 1e-7,
        )
      ) {
        out.push(a);
      }
    }
  }
  return out;
}

/** Окружность пункта а: точки серий подписаны. */
export function krugSerii(serii: readonly Seriya[], dop: Partial<KrugSpec> = {}): KrugSpec {
  return {
    tochki: tochkiSeriy(serii).map((ugol) => ({ ugol, akcent: true })),
    ...dop,
  };
}

/**
 * Окружности отбора пункта б. Промежуток короче оборота — одна
 * окружность; длиннее — несколько: границы — кратные $\frac{\pi}{2}$,
 * каждая часть короче оборота.
 */
export function krugiOtbora(serii: readonly Seriya[], p: Promezhutok): KrugSpec[] {
  const a = znach(p.ot);
  const b = znach(p.do);
  const kusok = (ot: Ugol, doU: Ugol, vkl: [boolean, boolean]): KrugSpec => {
    const korni = korniNaPromezhutke(serii, { ot, do: doU, vkl });
    return {
      tochki: korni.map((ugol) => ({ ugol, akcent: true, tex: ugolTex(ugol) })),
      duga: { ot, do: doU, vkl },
    };
  };
  if (b - a < 2 * Math.PI - 1e-9) return [kusok(p.ot, p.do, p.vkl)];
  /* Границы частей — кратные π/2 у равных долей промежутка; частей
     столько, чтобы каждая была короче оборота. */
  for (let n = Math.floor((b - a) / (2 * Math.PI)) + 1; n < 12; n += 1) {
    const granicy: number[] = [];
    for (let j = 1; j < n; j += 1)
      granicy.push(Math.round((a + ((b - a) * j) / n) / (Math.PI / 2)));
    const xs = [a, ...granicy.map((g) => (g * Math.PI) / 2), b];
    if (
      xs.some(
        (x, i) =>
          i > 0 &&
          (x - (xs[i - 1] as number) >= 2 * Math.PI - 1e-9 || x <= (xs[i - 1] as number) + 1e-9),
      )
    )
      continue;
    const ugly: Ugol[] = [p.ot, ...granicy.map((g) => ({ pi: q(g, 2) })), p.do];
    return ugly
      .slice(0, -1)
      .map((ot, i) =>
        kusok(ot, ugly[i + 1] as Ugol, [
          i === 0 ? p.vkl[0] : false,
          i === ugly.length - 2 ? p.vkl[1] : true,
        ]),
      );
  }
  return [kusok(p.ot, p.do, p.vkl)];
}
