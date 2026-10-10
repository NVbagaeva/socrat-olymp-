/**
 * Группа IV. Свойства функции f по графику её производной f′.
 *
 *   9.4.1 / 9.4.2 — сколько отмеченных точек на промежутках возрастания / убывания;
 *   9.4.3 / 9.4.4 — точка максимума / минимума;
 *   9.4.5 / 9.4.6 / 9.4.7 — количество точек максимума / минимума / экстремума на отрезке;
 *   9.4.8 — точка экстремума на отрезке;
 *   9.4.9 / 9.4.10 — в какой точке отрезка наибольшее / наименьшее значение.
 *
 * Рисунок — волна f′ (krivye.volnaP): нули только в целых узлах и
 * только пересечения оси. Возрастание f — график f′ выше оси; максимум
 * f — нуль f′ со сменой знака с «+» на «−». Тип нуля и знак берутся из
 * узлов (chtenie.ts), а sobrat() пересчитывает ответ независимо.
 */

import type { Rng } from '../../veroyatnost/generator';
import { chislaOtvet } from '../otvet';
import { nuliUzlov, vybratMetki, znakZnacheniya } from '../chtenie';
import { figura, volnaP } from '../krivye';
import { postroit } from '../spline';
import { d, interval, otrezok } from '../tex';
import type { Draft, Figura, Pomoshch, Uzel, Zapros } from '../types';
import { grafikP, metkiTekst } from '../uslovie';
import { podpisUzlov, proto, shag, sobrat, vopros } from './common';
import type { Nevernyy } from './common';
import { neverniyeChisla, promezhutki, xRavno, xSpisok, znakiPomoshch } from './chtenie-pom';
import type { Promezhutok } from './chtenie-pom';

/** Нуль f′ с типом: sleva = +1 — смена «+» на «−», то есть максимум f. */
interface Nul {
  x: number;
  tip: 'max' | 'min';
}

function tipy(uzly: readonly Uzel[]): Nul[] {
  return nuliUzlov(uzly).map((z) => ({ x: z.x, tip: z.sleva > 0 ? 'max' : 'min' }));
}

/** Неверные варианты: без повторов, не больше трёх. */
function varianty(verno: string, kandidaty: readonly Nevernyy[]): Nevernyy[] {
  const out: Nevernyy[] = [];
  const seen = new Set<string>([verno]);
  for (const c of kandidaty) {
    if (!seen.has(c.tekst)) {
      seen.add(c.tekst);
      out.push(c);
    }
  }
  return out.slice(0, 3);
}

/** Строка про промежуток: график выше или ниже оси. */
function strokaPromezhutka(p: Promezhutok): string {
  return p.znak > 0
    ? `$${interval(p.lo, p.hi)}$: график $f'$ выше оси $Ox$, $f'(x)>0$, функция $f$ возрастает.`
    : `$${interval(p.lo, p.hi)}$: график $f'$ ниже оси $Ox$, $f'(x)<0$, функция $f$ убывает.`;
}

const MINUS_PLUS = 'с $-$ на $+$';
const PLUS_MINUS = 'с $+$ на $-$';

/** Вершина графика f′ (узел не на оси) — ловушка «путают нули и вершины». */
function vershina(uzly: readonly Uzel[], iskl: readonly number[]): number | null {
  const kand = uzly.filter((u) => u.y !== 0 && !iskl.includes(u.x));
  const best = kand.find((u) => {
    const prev = uzly[uzly.indexOf(u) - 1];
    const next = uzly[uzly.indexOf(u) + 1];
    return prev !== undefined && next !== undefined;
  });
  return best === undefined ? null : best.x;
}

/* ── 9.4.1 и 9.4.2 ───────────────────────────────────────────────── */

const FORMULIROVKI_VOZR: Record<'1' | '-1', string[]> = {
  '1': [
    'Сколько отмеченных точек принадлежит промежуткам возрастания функции $f(x)$?',
    'Определите количество отмеченных точек, принадлежащих промежуткам возрастания функции $f(x)$.',
    'Сколько из отмеченных точек лежит на промежутках, где функция $f(x)$ возрастает?',
  ],
  '-1': [
    'Сколько отмеченных точек принадлежит промежуткам убывания функции $f(x)$?',
    'Определите количество отмеченных точек, принадлежащих промежуткам убывания функции $f(x)$.',
    'Сколько из отмеченных точек лежит на промежутках, где функция $f(x)$ убывает?',
  ],
};

function metkiNaMonotonnosti(id: string, znak: 1 | -1) {
  const vozr = znak > 0;
  return proto({
    id,
    gruppa: 'IV',
    nazvanie: vozr
      ? 'Сколько отмеченных точек принадлежит промежуткам возрастания функции'
      : 'Сколько отмеченных точек принадлежит промежуткам убывания функции',
    kratko: vozr ? 'Отмеченные точки на возрастании' : 'Отмеченные точки на убывании',
    risunok: true,
    generate(r: Rng): Draft | null {
      const w = volnaP(r, { n: [2, 4], a: [-9, -5], b: [5, 9] });
      if (w === null) {
        return null;
      }
      const spl = postroit(w.uzly);
      const podhodit = (s: number) => (x: number) =>
        x !== 0 && znakZnacheniya(w.uzly, x) === s && Math.abs(spl.y(x)) >= 1;
      let nuzhP = 0;
      let prochP = 0;
      for (let x = w.a + 1; x < w.b; x += 1) {
        nuzhP += podhodit(znak)(x) ? 1 : 0;
        prochP += podhodit(-znak)(x) ? 1 : 0;
      }
      const nMax = Math.min(8, nuzhP + prochP);
      if (nMax < 5) {
        return null;
      }
      const n = r.int(5, nMax);
      const kLo = Math.max(1, n - prochP);
      const kHi = Math.min(n - 1, nuzhP);
      if (kLo > kHi) {
        return null;
      }
      const k = r.int(kLo, kHi);
      const nuzhnye = vybratMetki(r, w.a, w.b, k, podhodit(znak));
      if (nuzhnye === null) {
        return null;
      }
      const ostalnye = vybratMetki(
        r,
        w.a,
        w.b,
        n - k,
        (x) => podhodit(-znak)(x) && !nuzhnye.includes(x),
      );
      if (ostalnye === null) {
        return null;
      }
      const metki = [...nuzhnye, ...ostalnye].sort((p, q) => p - q);
      const sg = metki.map((x) => znakZnacheniya(w.uzly, x));
      const idxNuzh = sg.map((s, i) => (s === znak ? i : -1)).filter((i) => i >= 0);
      const idxProch = sg.map((s, i) => (s === -znak ? i : -1)).filter((i) => i >= 0);
      /* Ловушка: точки, около которых график f′ поднимается (путают f′ и f). */
      const idxVverh = metki.map((x, i) => (spl.dy(x) > 0.2 ? i : -1)).filter((i) => i >= 0);
      const zs = w.nuli.map((z) => z.x);
      const ps = promezhutki([w.a, ...zs, w.b], (m) => znakZnacheniya(w.uzly, m));
      const fig: Figura = figura('fprime', "f'(x)", w.uzly, {
        metki,
        pomoshch: [
          ...metki.map((x): Pomoshch => ({ t: 'vert', x, shag: 1 })),
          ...znakiPomoshch(ps, 2),
        ],
      });
      const variant = r.int(0, 2);
      const vopr = (FORMULIROVKI_VOZR[vozr ? '1' : '-1'] as string[])[variant] as string;
      const uslovie = `${grafikP(w.a, w.b)} ${metkiTekst(n)} ${vopr}`;
      const vyshe = vozr ? 'выше' : 'ниже';
      const nizhe = vozr ? 'ниже' : 'выше';
      const znakStr = vozr ? '>' : '<';
      const sosed = (rows: number[]) => rows.map((i) => `$x_{${i + 1}}$`).join(', ');
      return sobrat(fig, { t: 'metki-na-vozrastanii', znak }, k, {
        uslovie,
        shagi: [
          shag(
            'Что изображено на рисунке',
            "Здесь нарисован график производной $y=f'(x)$, а не самой функции $f$. Поэтому смотрим не на то, куда идёт график, а на то, выше или ниже оси $Ox$ он расположен.",
          ),
          shag(
            'Связь знака производной с монотонностью',
            "Если $f'(x)>0$ (график $f'$ выше оси $Ox$), функция $f$ возрастает. Если $f'(x)<0$ (график $f'$ ниже оси), функция $f$ убывает.",
          ),
          shag(
            'Промежутки возрастания и убывания',
            `График пересекает ось $Ox$ при $x=${zs.map((x) => d(x)).join('$, $x=')}$. Эти точки делят интервал на промежутки:`,
            ...ps.map(strokaPromezhutka),
          ),
          shag(
            'Где лежат отмеченные точки',
            `График $f'$ ${vyshe} оси $Ox$ в точках ${sosed(idxNuzh)}: там $f'(x)${znakStr}0$, функция ${vozr ? 'возрастает' : 'убывает'}.`,
            `В точках ${sosed(idxProch)} график $f'$ ${nizhe} оси, функция ${vozr ? 'убывает' : 'возрастает'}.`,
            `Нужных точек: $${k}$. Проверка: $${k}+${n - k}=${n}$.`,
          ),
          shag('Ответ', `**Ответ: ${k}**`),
        ],
        podskazka: [
          vopros(
            r,
            'Какая функция изображена на рисунке?',
            "Производная $f'$",
            [
              {
                tekst: 'Сама функция $f$',
                pochemu:
                  "В условии сказано: изображён график $y=f'(x)$ — производной. Поведение $f$ придётся выводить по нему.",
              },
              {
                tekst: 'Первообразная функции $f$',
                pochemu:
                  "Про первообразную в условии ничего нет: нарисован график производной $f'$.",
              },
            ],
            "График $y=f'(x)$ — производной функции $f$.",
          ),
          vopros(
            r,
            `Когда функция $f$ ${vozr ? 'возрастает' : 'убывает'}?`,
            `Когда $f'(x)${znakStr}0$: график $f'$ лежит ${vyshe} оси $Ox$`,
            [
              {
                tekst: `Когда график $f'$ идёт ${vozr ? 'вверх' : 'вниз'}`,
                pochemu: `Направление графика $f'$ говорит лишь о том, как меняется сама производная. Для $f$ важен знак $f'$: ${vyshe} оси график или ${nizhe}.`,
              },
              {
                tekst: `Когда $f'(x)${vozr ? '<' : '>'}0$: график $f'$ лежит ${nizhe} оси $Ox$`,
                pochemu: `Так выглядит промежуток, на котором функция ${vozr ? 'убывает' : 'возрастает'}.`,
              },
            ],
            `Функция ${vozr ? 'возрастает' : 'убывает'}, где график $f'$ лежит ${vyshe} оси $Ox$.`,
            1,
          ),
          vopros(
            r,
            `В каких отмеченных точках график $f'$ лежит ${vyshe} оси $Ox$?`,
            xSpisok(idxNuzh),
            varianty(xSpisok(idxNuzh), [
              {
                tekst: xSpisok(idxProch),
                pochemu: `В этих точках график $f'$ лежит ${nizhe} оси: функция там ${vozr ? 'убывает' : 'возрастает'}.`,
              },
              {
                tekst: xSpisok(idxVverh),
                pochemu: `Это точки, около которых график $f'$ идёт вверх. Но поведение $f$ определяет знак $f'$ (${vyshe} или ${nizhe} оси), а не направление графика $f'$.`,
              },
              {
                tekst: xSpisok(idxNuzh.slice(1)),
                pochemu:
                  'Одна подходящая точка пропущена: проверьте положение графика относительно оси в каждой точке.',
              },
              {
                tekst: xSpisok([...idxNuzh, ...idxProch.slice(0, 1)].sort((p, q) => p - q)),
                pochemu: 'В список попала лишняя точка, где график лежит по другую сторону от оси.',
              },
            ]),
            `Нужные точки: ${xSpisok(idxNuzh)}.`,
            2,
          ),
          vopros(
            r,
            'Сколько таких точек?',
            `$${k}$`,
            neverniyeChisla(
              k,
              [
                { v: n - k, w: `Посчитаны точки с противоположным знаком $f'$: их $${n - k}$.` },
                ...(idxVverh.length !== k && idxVverh.length > 0
                  ? [
                      {
                        v: idxVverh.length,
                        w: "Посчитаны точки, где график $f'$ идёт вверх: это не то же самое, что $f'(x)>0$.",
                      },
                    ]
                  : []),
              ],
              1,
            ),
            `Таких точек $${k}$.`,
            2,
          ),
        ],
        params: { n, k, a: w.a, b: w.b, znak },
        signature: podpisUzlov(fig) + `|${znak}`,
        vid: `v${variant}n${n}`,
      });
    },
  });
}

const P941 = metkiNaMonotonnosti('9.4.1', 1);
const P942 = metkiNaMonotonnosti('9.4.2', -1);

/* ── 9.4.3 и 9.4.4: точка максимума / минимума ──────────────────── */

const FORMULIROVKI_TOCHKA: Record<'max' | 'min', ((a: number, b: number) => string)[]> = {
  max: [
    () => 'Найдите точку максимума функции $f(x)$.',
    (a, b) => `Найдите точку максимума функции $f(x)$ на интервале $${interval(a, b)}$.`,
    (a, b) => `В какой точке интервала $${interval(a, b)}$ функция $f(x)$ имеет максимум?`,
  ],
  min: [
    () => 'Найдите точку минимума функции $f(x)$.',
    (a, b) => `Найдите точку минимума функции $f(x)$ на интервале $${interval(a, b)}$.`,
    (a, b) => `В какой точке интервала $${interval(a, b)}$ функция $f(x)$ имеет минимум?`,
  ],
};

function tochkaEkstremuma(id: string, tip: 'max' | 'min') {
  const mx = tip === 'max';
  const slovo = mx ? 'максимума' : 'минимума';
  const protivSlovo = mx ? 'минимума' : 'максимума';
  const smena = mx ? PLUS_MINUS : MINUS_PLUS;
  const protivSmena = mx ? MINUS_PLUS : PLUS_MINUS;
  return proto({
    id,
    gruppa: 'IV',
    nazvanie: mx
      ? 'Точка максимума функции по графику производной'
      : 'Точка минимума функции по графику производной',
    kratko: mx ? "Найти точку максимума по $f'$" : "Найти точку минимума по $f'$",
    risunok: true,
    generate(r: Rng): Draft | null {
      /* Ровно один нуль нужного типа и хотя бы один противоположного:
         нулей два (любой порядок) или три (нужный тип — в середине). */
      const nZer = r.int(2, 3);
      const first: 1 | -1 = nZer === 2 ? (r.next() < 0.5 ? 1 : -1) : mx ? -1 : 1;
      const w = volnaP(r, { n: [nZer, nZer], pervyy: first, shag: 2 });
      if (w === null) {
        return null;
      }
      const nuli = tipy(w.uzly);
      const nuzhnye = nuli.filter((z) => z.tip === tip);
      const lovushki = nuli.filter((z) => z.tip !== tip);
      if (nuzhnye.length !== 1 || lovushki.length < 1) {
        return null;
      }
      const ans = (nuzhnye[0] as Nul).x;
      const zs = nuli.map((z) => z.x);
      const ps = promezhutki([w.a, ...zs, w.b], (m) => znakZnacheniya(w.uzly, m));
      const fig: Figura = figura('fprime', "f'(x)", w.uzly, {
        pomoshch: [
          ...zs.map((x): Pomoshch => ({ t: 'vert', x, podpis: d(x), shag: 1 })),
          ...znakiPomoshch(ps, 2),
        ],
      });
      const variant = r.int(0, 2);
      const vopr = (FORMULIROVKI_TOCHKA[tip][variant] as (a: number, b: number) => string)(
        w.a,
        w.b,
      );
      const uslovie = `${grafikP(w.a, w.b)} ${vopr}`;
      const vershinaX = vershina(w.uzly, zs);
      const stroki = ps.map(strokaPromezhutka);
      return sobrat(fig, { t: mx ? 'tochka-max' : 'tochka-min' }, ans, {
        uslovie,
        shagi: [
          shag(
            `Что такое точка ${slovo}`,
            `Точка ${slovo} функции $f$ — это точка, в которой возрастание сменяется убыванием (для максимума) или убывание — возрастанием (для минимума).`,
            `Для максимума $f'$ меняет знак ${PLUS_MINUS}, для минимума — ${MINUS_PLUS}. Поэтому ищем нули $f'$, в которых график пересекает ось.`,
          ),
          shag(
            'Находим нули производной',
            `График $f'$ пересекает ось $Ox$ при $x=${zs.map((x) => d(x)).join('$, $x=')}$. В остальных точках $f'(x)\\ne0$, так что других кандидатов нет.`,
          ),
          shag('Определяем знаки производной', ...stroki),
          shag(
            'Выбираем нужную смену знака',
            `При $x=${d(ans)}$ знак $f'$ меняется ${smena}: это точка ${slovo}.`,
            `При ${xRavno(lovushki.map((z) => z.x))} знак меняется ${protivSmena}: ${lovushki.length === 1 ? 'это точка' : 'это точки'} ${protivSlovo}.`,
          ),
          shag('Ответ', `**Ответ: ${chislaOtvet(ans)}**`),
        ],
        podskazka: [
          vopros(
            r,
            'Какой график изображён на рисунке?',
            "График производной $f'$",
            [
              {
                tekst: 'График самой функции $f$',
                pochemu:
                  "В условии сказано, что изображён график $y=f'(x)$. Значит, максимумы и минимумы $f$ нужно искать по знаку $f'$, а не по вершинам этого графика.",
              },
              {
                tekst: 'График первообразной',
                pochemu:
                  "Нарисован график производной $f'$, про первообразную в условии нет ни слова.",
              },
            ],
            "Нарисован график $y=f'(x)$.",
          ),
          vopros(
            r,
            `Как меняется знак $f'$ при переходе через точку ${slovo} функции $f$?`,
            `Знак меняется ${smena}`,
            [
              {
                tekst: `Знак меняется ${protivSmena}`,
                pochemu: `Так меняется знак у точки ${protivSlovo}: функция ${mx ? 'убывала, потом стала возрастать' : 'возрастала, потом стала убывать'}.`,
              },
              {
                tekst: 'Знак не меняется',
                pochemu:
                  'Без смены знака $f' +
                  "'" +
                  '$ функция не меняет характер монотонности, и экстремума нет.',
              },
            ],
            `У точки ${slovo} знак $f'$ меняется ${smena}.`,
            1,
          ),
          vopros(
            r,
            `Где график $f'$ пересекает ось $Ox$ ${mx ? 'сверху вниз' : 'снизу вверх'}?`,
            `$x=${d(ans)}$`,
            varianty(`$x=${d(ans)}$`, [
              ...lovushki.map((z) => ({
                tekst: `$x=${d(z.x)}$`,
                pochemu: `Здесь график пересекает ось ${mx ? 'снизу вверх' : 'сверху вниз'}: знак меняется ${protivSmena}, это точка ${protivSlovo}.`,
              })),
              ...(vershinaX === null
                ? []
                : [
                    {
                      tekst: `$x=${d(vershinaX)}$`,
                      pochemu:
                        "Это вершина графика $f'$, а не его пересечение с осью. В вершине $f'\\ne0$, и характер монотонности $f$ не меняется.",
                    },
                  ]),
            ]),
            `Подходит $x=${d(ans)}$.`,
            2,
          ),
        ],
        params: { a: w.a, b: w.b, ans, n: zs.length },
        signature: podpisUzlov(fig),
        vid: `v${variant}n${zs.length}`,
      });
    },
  });
}

const P943 = tochkaEkstremuma('9.4.3', 'max');
const P944 = tochkaEkstremuma('9.4.4', 'min');

/* ── Общее для задач на отрезке [p; q] ──────────────────────────── */

interface Otrezok {
  p: number;
  q: number;
}

/** Нули внутри отрезка и снаружи. */
function razdelit(nuli: readonly Nul[], s: Otrezok): { v: Nul[]; vne: Nul[] } {
  return {
    v: nuli.filter((z) => z.x >= s.p && z.x <= s.q),
    vne: nuli.filter((z) => z.x < s.p || z.x > s.q),
  };
}

function opisanieNulya(z: Nul): string {
  return `$x=${d(z.x)}$: знак $f'$ меняется ${z.tip === 'max' ? PLUS_MINUS : MINUS_PLUS}, точка ${z.tip === 'max' ? 'максимума' : 'минимума'}.`;
}

/* ── 9.4.5 – 9.4.7: количество точек на отрезке ─────────────────── */

type TipSchyota = 'max' | 'min' | 'extr';

function formulSchet(t: TipSchyota, s: Otrezok): string[] {
  const seg = `$${otrezok(s.p, s.q)}$`;
  const slovo = t === 'max' ? 'максимума' : t === 'min' ? 'минимума' : 'экстремума';
  return [
    `Найдите количество точек ${slovo} функции $f(x)$, принадлежащих отрезку ${seg}.`,
    `Сколько точек ${slovo} имеет функция $f(x)$ на отрезке ${seg}?`,
    `Определите количество точек ${slovo} функции $f(x)$ на отрезке ${seg}.`,
  ];
}

function chisloNaOtrezke(id: string, t: TipSchyota) {
  const slovo = t === 'max' ? 'максимума' : t === 'min' ? 'минимума' : 'экстремума';
  const zaprosT: Zapros['t'] =
    t === 'max' ? 'chislo-max' : t === 'min' ? 'chislo-min' : 'chislo-extr';
  const podhodit = (z: Nul) => t === 'extr' || z.tip === t;
  return proto({
    id,
    gruppa: 'IV',
    nazvanie: `Количество точек ${slovo} на отрезке по графику производной`,
    kratko: `Сколько точек ${slovo} на отрезке`,
    risunok: true,
    generate(r: Rng): Draft | null {
      const w = volnaP(r, { n: [6, 7], a: [-9, -6], b: [6, 9] });
      if (w === null) {
        return null;
      }
      const nuli = tipy(w.uzly);
      const zs = nuli.map((z) => z.x);
      /* Окна из подряд идущих нулей [i; j]: отрезок охватывает их и не задевает остальные. */
      const okna = new Map<number, { i: number; j: number }[]>();
      for (let i = 0; i < nuli.length; i += 1) {
        for (let j = i + 1; j < nuli.length; j += 1) {
          if (i === 0 && j === nuli.length - 1) {
            continue;
          }
          const vnutri = nuli.slice(i, j + 1);
          const kk = vnutri.filter(podhodit).length;
          if (kk < 1 || (t !== 'extr' && kk === vnutri.length)) {
            continue;
          }
          const lst = okna.get(kk) ?? [];
          lst.push({ i, j });
          okna.set(kk, lst);
        }
      }
      const znacheniya = [...okna.keys()].sort((x, y) => x - y);
      if (znacheniya.length === 0) {
        return null;
      }
      /* Целевое число точек выбираем равномерно среди возможных. */
      const zel = r.pick(znacheniya);
      const okno = r.pick(okna.get(zel) as { i: number; j: number }[]);
      const prev = okno.i === 0 ? w.a : (nuli[okno.i - 1] as Nul).x;
      const next = okno.j === nuli.length - 1 ? w.b : (nuli[okno.j + 1] as Nul).x;
      const p = r.int(prev + 1, (nuli[okno.i] as Nul).x - 1);
      const q = r.int((nuli[okno.j] as Nul).x + 1, next - 1);
      if (p < w.a + 1 || q > w.b - 1 || q - p < 3) {
        return null;
      }
      const { v, vne } = razdelit(nuli, { p, q });
      if (v.length < 2 || vne.length < 1) {
        return null;
      }
      const nuzhnye = v.filter(podhodit);
      const k = nuzhnye.length;
      const vseTipa = nuli.filter(podhodit).length;
      const ps = promezhutki([w.a, ...zs, w.b], (m) => znakZnacheniya(w.uzly, m));
      const fig: Figura = figura('fprime', "f'(x)", w.uzly, {
        pomoshch: [
          { t: 'otrezok', p, q, shag: 1 },
          ...zs.map((x): Pomoshch => ({ t: 'vert', x, podpis: d(x), shag: 2 })),
          ...znakiPomoshch(ps, 3),
        ],
      });
      const variant = r.int(0, 2);
      const uslovie = `${grafikP(w.a, w.b)} ${formulSchet(t, { p, q })[variant] as string}`;
      const opredelenie =
        t === 'max'
          ? "Точка максимума — точка, где возрастание $f$ сменяется убыванием: $f'$ меняет знак с $+$ на $-$ (график $f'$ пересекает ось сверху вниз)."
          : t === 'min'
            ? "Точка минимума — точка, где убывание $f$ сменяется возрастанием: $f'$ меняет знак с $-$ на $+$ (график $f'$ пересекает ось снизу вверх)."
            : "Точка экстремума — точка максимума или минимума: в ней $f'$ меняет знак (график $f'$ пересекает ось в любую сторону).";
      const spisok = (rows: Nul[]) => (rows.length === 0 ? 'нет' : xRavno(rows.map((z) => z.x)));
      const vTipa = v.filter(podhodit);
      const maxV = v.filter((z) => z.tip === 'max').length;
      const minV = v.filter((z) => z.tip === 'min').length;
      const lovCnt: { v: number; w: string }[] = [
        {
          v: v.length,
          w: `Посчитаны все нули на отрезке ($${v.length}$), но среди них есть точки другого типа.`,
        },
        { v: vseTipa, w: 'Посчитаны точки нужного типа на всём графике, а не только на отрезке.' },
        {
          v: t === 'max' ? minV : maxV,
          w: 'Посчитаны точки противоположного типа: максимум и минимум перепутаны.',
        },
      ];
      return sobrat(fig, { t: zaprosT, p, q }, k, {
        uslovie,
        shagi: [
          shag(
            'Что нужно найти',
            opredelenie,
            "Значит, нужно отобрать нули $f'$ со сменой знака нужного вида.",
          ),
          shag(
            'Нули производной и смена знака',
            `График $f'$ пересекает ось $Ox$ при ${xRavno(zs)}. Определим тип каждого нуля:`,
            ...nuli.map(opisanieNulya),
          ),
          shag(
            'Отбираем нули из отрезка',
            `Отрезок $${otrezok(p, q)}$ содержит нули ${spisok(v)}.`,
            `Вне отрезка лежат нули ${spisok(vne)} — они не учитываются.`,
          ),
          shag(
            'Считаем',
            t === 'extr'
              ? `Все нули на отрезке — точки экстремума: ${spisok(vTipa)}. Их $${k}$.`
              : `Из нулей на отрезке точками ${slovo} являются ${spisok(vTipa)}. Их $${k}$.`,
          ),
          shag('Ответ', `**Ответ: ${k}**`),
        ],
        podskazka: [
          vopros(
            r,
            `Как должен вести себя $f'$ около точки ${slovo}?`,
            t === 'max'
              ? 'Менять знак с $+$ на $-$'
              : t === 'min'
                ? 'Менять знак с $-$ на $+$'
                : 'Менять знак (в любую сторону)',
            [
              ...(t === 'extr'
                ? [
                    {
                      tekst: 'Быть равной нулю, не меняя знак',
                      pochemu: 'Если знак не меняется, монотонность не меняется и экстремума нет.',
                    },
                    {
                      tekst: 'Достигать наибольшего значения',
                      pochemu:
                        "Вершина графика $f'$ — экстремум самой производной, а нужны нули $f'$ со сменой знака.",
                    },
                  ]
                : [
                    {
                      tekst: t === 'max' ? 'Менять знак с $-$ на $+$' : 'Менять знак с $+$ на $-$',
                      pochemu: `Так меняется знак у точки ${t === 'max' ? 'минимума' : 'максимума'}.`,
                    },
                    {
                      tekst: 'Достигать наибольшего значения',
                      pochemu:
                        "Вершина графика $f'$ — экстремум самой производной, а нужны нули $f'$ со сменой знака.",
                    },
                  ]),
            ],
            t === 'max'
              ? "У максимума знак $f'$ меняется с $+$ на $-$."
              : t === 'min'
                ? "У минимума знак $f'$ меняется с $-$ на $+$."
                : "У экстремума знак $f'$ меняется.",
          ),
          vopros(
            r,
            `Какие нули $f'$ лежат на отрезке $${otrezok(p, q)}$?`,
            spisok(v),
            varianty(spisok(v), [
              {
                tekst: spisok(nuli),
                pochemu:
                  'Это все нули графика, а отрезок $[' +
                  `${p};\\ ${q}` +
                  ']$ охватывает лишь часть из них.',
              },
              { tekst: spisok(vne), pochemu: 'Это нули вне отрезка: условие их не касается.' },
              {
                tekst: spisok(v.slice(1)),
                pochemu: 'Один из нулей отрезка пропущен: проверьте края отрезка.',
              },
            ]),
            `На отрезке лежат нули ${spisok(v)}.`,
            1,
          ),
          vopros(
            r,
            `Какие из них — точки ${slovo}?`,
            spisok(vTipa),
            varianty(spisok(vTipa), [
              ...(t === 'extr'
                ? [
                    {
                      tekst: spisok(v.filter((z) => z.tip === 'max')),
                      pochemu: 'Это только максимумы. Минимумы — тоже экстремумы.',
                    },
                    {
                      tekst: spisok(v.filter((z) => z.tip === 'min')),
                      pochemu: 'Это только минимумы. Максимумы — тоже экстремумы.',
                    },
                  ]
                : [
                    {
                      tekst: spisok(v.filter((z) => z.tip !== t)),
                      pochemu: `Здесь знак меняется в другую сторону: это точки ${t === 'max' ? 'минимума' : 'максимума'}.`,
                    },
                    {
                      tekst: spisok(v),
                      pochemu:
                        'Здесь взяты все нули на отрезке, но часть из них — точки другого типа.',
                    },
                  ]),
            ]),
            `Точки ${slovo} на отрезке: ${spisok(vTipa)}.`,
            3,
          ),
          vopros(
            r,
            'Сколько их?',
            `$${k}$`,
            neverniyeChisla(k, lovCnt, 1),
            `Таких точек $${k}$.`,
            3,
          ),
        ],
        params: { a: w.a, b: w.b, p, q, k, n: zs.length },
        signature: podpisUzlov(fig) + `|${p}|${q}`,
        vid: `v${variant}k${k}`,
      });
    },
  });
}

const P945 = chisloNaOtrezke('9.4.5', 'max');
const P946 = chisloNaOtrezke('9.4.6', 'min');
const P947 = chisloNaOtrezke('9.4.7', 'extr');

/* ── 9.4.8: точка экстремума на отрезке ─────────────────────────── */

const P948 = proto({
  id: '9.4.8',
  gruppa: 'IV',
  nazvanie: 'Точка экстремума на отрезке по графику производной',
  kratko: 'Точка экстремума на отрезке',
  risunok: true,
  generate(r: Rng): Draft | null {
    const w = volnaP(r, { n: [3, 5], a: [-9, -5], b: [5, 9] });
    if (w === null) {
      return null;
    }
    const nuli = tipy(w.uzly);
    const zs = nuli.map((z) => z.x);
    const z0 = r.pick(nuli);
    const p = z0.x - r.int(1, 3);
    const q = z0.x + r.int(1, 3);
    if (p < w.a + 1 || q > w.b - 1) {
      return null;
    }
    const { v, vne } = razdelit(nuli, { p, q });
    if (v.length !== 1 || vne.length < 1) {
      return null;
    }
    const ans = z0.x;
    const ps = promezhutki([w.a, ...zs, w.b], (m) => znakZnacheniya(w.uzly, m));
    const fig: Figura = figura('fprime', "f'(x)", w.uzly, {
      pomoshch: [
        { t: 'otrezok', p, q, shag: 1 },
        ...zs.map((x): Pomoshch => ({ t: 'vert', x, podpis: d(x), shag: 2 })),
        ...znakiPomoshch(ps, 3),
      ],
    });
    const variant = r.int(0, 2);
    const vopr = [
      `Найдите точку экстремума функции $f(x)$, принадлежащую отрезку $${otrezok(p, q)}$.`,
      `В какой точке отрезка $${otrezok(p, q)}$ функция $f(x)$ имеет экстремум?`,
      `Укажите точку экстремума функции $f(x)$ на отрезке $${otrezok(p, q)}$.`,
    ][variant] as string;
    const vershinaX = vershina(w.uzly, zs);
    const tipNul = z0.tip === 'max' ? 'максимума' : 'минимума';
    const spisokVne = vne.map((z) => z.x);
    return sobrat(fig, { t: 'extr-na-otrezke', p, q }, ans, {
      uslovie: `${grafikP(w.a, w.b)} ${vopr}`,
      shagi: [
        shag(
          'Что такое точка экстремума',
          "Точка экстремума функции $f$ — точка максимума или минимума. В ней $f'(x)=0$ и $f'$ меняет знак, то есть график $f'$ пересекает ось $Ox$.",
        ),
        shag(
          'Находим нули производной и смену знака',
          `График $f'$ пересекает ось $Ox$ при ${xRavno(zs)}.`,
          ...nuli.map(opisanieNulya),
        ),
        shag(
          'Выбираем нуль из отрезка',
          `Отрезок $${otrezok(p, q)}$ содержит один нуль: $x=${d(ans)}$ (${d(p)}<${d(ans)}<${d(q)}).`.replace(
            `(${d(p)}<${d(ans)}<${d(q)})`,
            `($${d(p)}<${d(ans)}<${d(q)}$)`,
          ),
          `Нули ${xRavno(spisokVne)} лежат вне отрезка.`,
          `В точке $x=${d(ans)}$ знак $f'$ меняется, поэтому это точка ${tipNul}.`,
        ),
        shag('Ответ', `**Ответ: ${chislaOtvet(ans)}**`),
      ],
      podskazka: [
        vopros(
          r,
          "Что должно происходить с $f'$ в точке экстремума функции $f$?",
          "$f'$ обращается в нуль и меняет знак",
          [
            {
              tekst: "$f'$ достигает наибольшего значения",
              pochemu: "Вершина графика $f'$ — это экстремум производной, а не функции $f$.",
            },
            {
              tekst: "$f'$ положительна",
              pochemu: "Если $f'>0$, функция $f$ просто возрастает: экстремума в такой точке нет.",
            },
          ],
          "В точке экстремума график $f'$ пересекает ось $Ox$.",
        ),
        vopros(
          r,
          `Какие нули $f'$ лежат на отрезке $${otrezok(p, q)}$?`,
          `$x=${d(ans)}$`,
          varianty(
            `$x=${d(ans)}$`,
            vne.slice(0, 3).map((z) => ({
              tekst: `$x=${d(z.x)}$`,
              pochemu: `В этой точке $f'$ тоже меняет знак, но она вне отрезка $${otrezok(p, q)}$.`,
            })),
          ),
          `На отрезке лежит единственный нуль $x=${d(ans)}$.`,
          1,
        ),
        vopros(
          r,
          `Меняет ли $f'$ знак в точке $x=${d(ans)}$?`,
          `Да, знак меняется ${z0.tip === 'max' ? PLUS_MINUS : MINUS_PLUS}`,
          [
            {
              tekst: `Да, знак меняется ${z0.tip === 'max' ? MINUS_PLUS : PLUS_MINUS}`,
              pochemu: 'Посмотрите на знаки по обе стороны от нуля: слева и справа они другие.',
            },
            {
              tekst: 'Нет, знак не меняется',
              pochemu: 'График в этой точке пересекает ось, а не касается её: знак меняется.',
            },
            ...(vershinaX === null
              ? []
              : [
                  {
                    tekst: `Ответом является $x=${d(vershinaX)}$`,
                    pochemu:
                      "Это вершина графика $f'$, в ней $f'\\ne0$: экстремума функции $f$ там нет.",
                  },
                ]),
          ].slice(0, 3),
          `Знак меняется, значит $x=${d(ans)}$ — точка экстремума.`,
          3,
        ),
      ],
      params: { a: w.a, b: w.b, p, q, ans, n: zs.length },
      signature: podpisUzlov(fig) + `|${p}|${q}`,
      vid: `v${variant}t${z0.tip}`,
    });
  },
});

/* ── 9.4.9 и 9.4.10: наибольшее / наименьшее значение на отрезке ── */

type Stsenariy = 'plus' | 'minus' | 'pm' | 'mp';

interface Vybor {
  p: number;
  q: number;
  /** Нуль внутри отрезка (для сценариев pm и mp). */
  z: number | null;
}

/** Выбор отрезка под сценарий; null — не получилось. */
function vyborOtrezka(
  r: Rng,
  uzly: readonly Uzel[],
  a: number,
  b: number,
  s: Stsenariy,
): Vybor | null {
  const nuli = tipy(uzly);
  const B = [a, ...nuli.map((z) => z.x), b];
  if (s === 'plus' || s === 'minus') {
    const want = s === 'plus' ? 1 : -1;
    const lobes: number[] = [];
    for (let i = 0; i < B.length - 1; i += 1) {
      const lo = B[i] as number;
      const hi = B[i + 1] as number;
      if (znakZnacheniya(uzly, (lo + hi) / 2) === want && hi - lo >= 4) {
        lobes.push(i);
      }
    }
    if (lobes.length === 0) {
      return null;
    }
    const i = r.pick(lobes);
    const lo = B[i] as number;
    const hi = B[i + 1] as number;
    const p = r.int(lo + 1, hi - 3);
    const q = r.int(p + 2, hi - 1);
    return { p, q, z: null };
  }
  const tip = s === 'pm' ? 'max' : 'min';
  const idx = nuli.map((z, i) => (z.tip === tip ? i : -1)).filter((i) => i >= 0);
  if (idx.length === 0) {
    return null;
  }
  const j = r.pick(idx);
  const z = (nuli[j] as Nul).x;
  const prev = B[j] as number;
  const next = B[j + 2] as number;
  const p = r.int(prev + 1, z - 1);
  const q = r.int(z + 1, next - 1);
  if (q - p < 3) {
    return null;
  }
  return { p, q, z };
}

function opisanieStsenariya(s: Stsenariy): { f1: string; f: string } {
  switch (s) {
    case 'plus':
      return {
        f1: "график $f'$ лежит выше оси $Ox$ на всём отрезке",
        f: 'функция $f$ возрастает на всём отрезке',
      };
    case 'minus':
      return {
        f1: "график $f'$ лежит ниже оси $Ox$ на всём отрезке",
        f: 'функция $f$ убывает на всём отрезке',
      };
    case 'pm':
      return {
        f1: "знак $f'$ меняется с $+$ на $-$",
        f: 'функция $f$ сначала возрастает, затем убывает',
      };
    default:
      return {
        f1: "знак $f'$ меняется с $-$ на $+$",
        f: 'функция $f$ сначала убывает, затем возрастает',
      };
  }
}

function naibNaimOtrezok(id: string, naib: boolean) {
  const slovo = naib ? 'наибольшее' : 'наименьшее';
  return proto({
    id,
    gruppa: 'IV',
    nazvanie: naib
      ? 'В какой точке отрезка функция принимает наибольшее значение'
      : 'В какой точке отрезка функция принимает наименьшее значение',
    kratko: naib ? 'Где на отрезке наибольшее значение' : 'Где на отрезке наименьшее значение',
    risunok: true,
    generate(r: Rng): Draft | null {
      const w = volnaP(r, { n: [2, 4], a: [-9, -5], b: [5, 9] });
      if (w === null) {
        return null;
      }
      const stsenariy: Stsenariy = naib
        ? r.pick(['plus', 'minus', 'pm', 'pm'] as const)
        : r.pick(['plus', 'minus', 'mp', 'mp'] as const);
      const vy = vyborOtrezka(r, w.uzly, w.a, w.b, stsenariy);
      if (vy === null) {
        return null;
      }
      const { p, q, z } = vy;
      /* Ответ из задуманного сценария. */
      let ans: number;
      if (stsenariy === 'plus') {
        ans = naib ? q : p;
      } else if (stsenariy === 'minus') {
        ans = naib ? p : q;
      } else {
        ans = z as number;
      }
      const nuli = tipy(w.uzly);
      const zs = nuli.map((x) => x.x);
      const ps = promezhutki([w.a, ...zs, w.b], (m) => znakZnacheniya(w.uzly, m));
      const fig: Figura = figura('fprime', "f'(x)", w.uzly, {
        pomoshch: [
          { t: 'otrezok', p, q, shag: 1 },
          ...zs.map((x): Pomoshch => ({ t: 'vert', x, podpis: d(x), shag: 2 })),
          ...znakiPomoshch(ps, 2),
        ],
      });
      const variant = r.int(0, 2);
      const vopr = naib
        ? [
            `В какой точке отрезка $${otrezok(p, q)}$ функция $f(x)$ принимает наибольшее значение?`,
            `Найдите точку отрезка $${otrezok(p, q)}$, в которой функция $f(x)$ принимает наибольшее значение.`,
            `В какой точке отрезка $${otrezok(p, q)}$ значение функции $f(x)$ наибольшее?`,
          ][variant]
        : [
            `В какой точке отрезка $${otrezok(p, q)}$ функция $f(x)$ принимает наименьшее значение?`,
            `Найдите точку отрезка $${otrezok(p, q)}$, в которой функция $f(x)$ принимает наименьшее значение.`,
            `В какой точке отрезка $${otrezok(p, q)}$ значение функции $f(x)$ наименьшее?`,
          ][variant];
      const op = opisanieStsenariya(stsenariy);
      const vneNuli = nuli.filter((x) => x.x < p || x.x > q);
      const vOtrezke = nuli.filter((x) => x.x >= p && x.x <= q);
      const vyvod = (() => {
        if (stsenariy === 'plus') {
          return naib
            ? `Возрастающая функция принимает наибольшее значение на правом конце отрезка: $x=${d(q)}$.`
            : `Возрастающая функция принимает наименьшее значение на левом конце отрезка: $x=${d(p)}$.`;
        }
        if (stsenariy === 'minus') {
          return naib
            ? `Убывающая функция принимает наибольшее значение на левом конце отрезка: $x=${d(p)}$.`
            : `Убывающая функция принимает наименьшее значение на правом конце отрезка: $x=${d(q)}$.`;
        }
        return stsenariy === 'pm'
          ? `Слева от $x=${d(ans)}$ функция возрастает, справа убывает, значит в точке $x=${d(ans)}$ (точка максимума) её значение наибольшее на отрезке.`
          : `Слева от $x=${d(ans)}$ функция убывает, справа возрастает, значит в точке $x=${d(ans)}$ (точка минимума) её значение наименьшее на отрезке.`;
      })();
      const opisKand = (x: number): string => {
        if (x === p) {
          return 'левый конец отрезка';
        }
        if (x === q) {
          return 'правый конец отрезка';
        }
        return 'внутренняя точка смены знака';
      };
      const kandidaty = [p, q, ...(z === null ? [] : [z])];
      return sobrat(fig, { t: naib ? 'naib-na-otrezke' : 'naim-na-otrezke', p, q }, ans, {
        uslovie: `${grafikP(w.a, w.b)} ${vopr as string}`,
        shagi: [
          shag(
            'Связь знака производной и поведения функции',
            "Если $f'(x)>0$ (график $f'$ выше оси $Ox$), функция $f$ возрастает; если $f'(x)<0$ (график ниже оси), $f$ убывает.",
          ),
          shag(
            "Знак $f'$ на отрезке",
            `Рассмотрим отрезок $${otrezok(p, q)}$: ${op.f1}${
              vOtrezke.length === 0 && vneNuli.length > 0
                ? ` (ближайшие нули лежат вне отрезка: ${xRavno(vneNuli.slice(0, 3).map((x) => x.x))})`
                : ''
            }.`,
            ...(vOtrezke.length === 1
              ? [`Единственный нуль на отрезке: $x=${d((vOtrezke[0] as Nul).x)}$.`]
              : []),
          ),
          shag('Как ведёт себя функция', `Значит, ${op.f}.`, vyvod),
          shag(
            'Ответ',
            `Искомая точка: $x=${d(ans)}$ — ${opisKand(ans)}.`,
            `**Ответ: ${chislaOtvet(ans)}**`,
          ),
        ],
        podskazka: [
          vopros(
            r,
            "Как график $f'$ расположен относительно оси $Ox$ на отрезке $" + otrezok(p, q) + '$?',
            op.f1.charAt(0).toUpperCase() + op.f1.slice(1),
            varianty(
              op.f1.charAt(0).toUpperCase() + op.f1.slice(1),
              (['plus', 'minus', 'pm', 'mp'] as Stsenariy[])
                .filter((s) => s !== stsenariy)
                .map((s) => ({
                  tekst:
                    opisanieStsenariya(s).f1.charAt(0).toUpperCase() +
                    opisanieStsenariya(s).f1.slice(1),
                  pochemu: `Нет: на этом отрезке ${op.f1}.`,
                })),
            ),
            `На отрезке ${op.f1}.`,
            1,
          ),
          vopros(
            r,
            'Как ведёт себя функция $f$ на этом отрезке?',
            op.f.charAt(0).toUpperCase() + op.f.slice(1),
            varianty(
              op.f.charAt(0).toUpperCase() + op.f.slice(1),
              (['plus', 'minus', 'pm', 'mp'] as Stsenariy[])
                .filter((s) => s !== stsenariy)
                .map((s) => ({
                  tekst:
                    opisanieStsenariya(s).f.charAt(0).toUpperCase() +
                    opisanieStsenariya(s).f.slice(1),
                  pochemu: `Нет: по знаку $f'$ на отрезке ${op.f}.`,
                })),
            ),
            `На отрезке ${op.f}.`,
            2,
          ),
          vopros(
            r,
            `В какой точке отрезка значение функции ${slovo}?`,
            `$x=${d(ans)}$`,
            varianty(`$x=${d(ans)}$`, [
              ...kandidaty
                .filter((x) => x !== ans)
                .map((x) => ({
                  tekst: `$x=${d(x)}$`,
                  pochemu: `В точке $x=${d(x)}$ (${opisKand(x)}) значение функции ${naib ? 'меньше' : 'больше'}, чем в точке $x=${d(ans)}$: так показывает знак $f'$ на отрезке.`,
                })),
              ...vneNuli.slice(0, 1).map((x) => ({
                tekst: `$x=${d(x.x)}$`,
                pochemu: `Эта точка лежит вне отрезка $${otrezok(p, q)}$, а ответ нужно искать на отрезке.`,
              })),
            ]),
            `${slovo.charAt(0).toUpperCase() + slovo.slice(1)} значение — в точке $x=${d(ans)}$.`,
            2,
          ),
        ],
        params: { a: w.a, b: w.b, p, q, ans, stsenariy },
        signature: podpisUzlov(fig) + `|${p}|${q}`,
        vid: `${stsenariy}v${variant}`,
      });
    },
  });
}

const P949 = naibNaimOtrezok('9.4.9', true);
const P9410 = naibNaimOtrezok('9.4.10', false);

export const PO_GRAFIKU_FPRIME = [P941, P942, P943, P944, P945, P946, P947, P948, P949, P9410];
