/**
 * Группа III, значения по данному значению и четверти: 8.M, 8.N, 8.O, 8.P.
 *
 * Правило группы: искомое значение задаётся первым как m/n с
 * «хорошим» n, данное выводится из основного тождества. Знаки — по
 * четверти; четверть записывается интервалом в радианах.
 */

import { gcd, nice, round9, simpRoot } from '../numbers';
import type { Rng } from '../rng';
import { d, fn, frac, paren, quarterInterval } from '../tex';
import type { Draft, Priznak, Prototype, Shag } from '../types';
import { keys, podtip, priznakiDlya, shag } from './common';

type Quarter = 1 | 2 | 3 | 4;

const SIGN: Record<'sin' | 'cos' | 'tg', Record<Quarter, 1 | -1>> = {
  sin: { 1: 1, 2: 1, 3: -1, 4: -1 },
  cos: { 1: 1, 2: -1, 3: -1, 4: 1 },
  tg: { 1: 1, 2: -1, 3: 1, 4: -1 },
};

const ROMAN: Record<Quarter, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

/* ── Шаги, общие для группы ───────────────────────────────────── */

/** Решение и признаки делимости, на которых держится сокращение. */
interface Razbor {
  razbor: Shag[];
  delimost?: Priznak[];
}

const TOZHDESTVO = 'основного тригонометрического тождества $\\sin^2\\alpha + \\cos^2\\alpha = 1$';

/** Минус перед модулем, если знак отрицательный. */
function mn(sign: number): string {
  return sign < 0 ? '-' : '';
}

/** Отрицательное значение — в скобках: \left(-\dfrac{3}{4}\right). */
function skobki(sign: number, tex: string): string {
  return sign < 0 ? `\\left(${tex}\\right)` : tex;
}

/**
 * Почему у sin или cos в этой четверти такой знак: синус — ордината,
 * косинус — абсцисса точки единичной окружности. Подпись шага, где
 * из двух значений корня выбирается одно.
 */
function znakPoChetverti(f: 'sin' | 'cos', q: Quarter): string {
  const plus = SIGN[f][q] > 0;
  const kto = f === 'sin' ? 'Синус — ордината' : 'Косинус — абсцисса';
  const gde =
    f === 'sin'
      ? q <= 2
        ? 'выше оси $Ox$'
        : 'ниже оси $Ox$'
      : q === 1 || q === 4
        ? 'правее оси $Oy$'
        : 'левее оси $Oy$';
  return (
    `Угол $\\alpha$ из промежутка $${quarterInterval(q)}$ — это ${ROMAN[q]} четверть. ` +
    `${kto} точки единичной окружности, а ${q === 2 ? 'во' : 'в'} ${ROMAN[q]} четверти эта точка лежит ${gde}. ` +
    `Поэтому $${fn(f)}\\alpha ${plus ? '>' : '<'} 0$ и ${plus ? 'берём корень со знаком плюс' : 'перед корнем ставим минус'}`
  );
}

/** Знак тангенса — из знаков синуса и косинуса в этой четверти. */
function znakTangensa(q: Quarter): string {
  if (q === 1) return 'Синус и косинус положительны, значит, и тангенс положителен';
  if (q === 3)
    return 'Синус и косинус оба отрицательны, а минус на минус даёт плюс — тангенс положителен';
  return 'Синус и косинус разных знаков, поэтому тангенс отрицателен';
}

/**
 * Несократимая дробь num/den со знаменателем из двоек и пятёрок — в
 * десятичную: \dfrac{7}{8} = \dfrac{875}{1000} = 0{,}875. mnozh — на что
 * домножаются числитель и знаменатель (1 — знаменатель уже 10).
 */
function desyatichnaya(num: number, den: number, otvet: number): { tex: string; mnozh: number } {
  let p = 10;
  while (p % den !== 0 && p < 1e6) p *= 10;
  const mnozh = p / den;
  const a = Math.abs(num);
  const start = `${mn(num)}\\dfrac{${a}}{${den}}`;
  const mid = mnozh === 1 ? '' : ` = ${mn(num)}\\dfrac{${a * mnozh}}{${p}}`;
  return { tex: `${start}${mid} = ${d(otvet)}`, mnozh };
}

/** Подпись перевода в десятичную дробь: на что домножаем. */
function vDesyatichnuyu(mnozh: number): string {
  return mnozh === 1
    ? 'записываем дробь со знаменателем $10$ десятичной'
    : `переводим в десятичную дробь, домножив числитель и знаменатель на $${mnozh}$`;
}

/** Дробь k√m / n в упрощённой записи, со знаком. */
function radicalFrac(sign: 1 | -1, num: number, m: number, den: number): string {
  const g = gcd(num, den);
  const k = num / g;
  const n = den / g;
  const top = m === 1 ? String(k) : `${k === 1 ? '' : k}\\sqrt{${m}}`;
  const body = n === 1 ? top : `\\dfrac{${top}}{${n}}`;
  return sign < 0 ? `-${body}` : body;
}

/* ── 8.M, 8.N  sin по cos и cos по sin ───────────────────────── */

/**
 * Решение 8.M/8.N. Данное — ±k√rad/n (rad = 1 — десятичная дробь),
 * искомое — ±m/n; n² = m² + k²·rad.
 */
function razborMN(
  find: 'sin' | 'cos',
  q: Quarter,
  rational: boolean,
  k: number,
  rad: number,
  n: number,
  m: number,
  ans: number,
): Razbor {
  const given = find === 'sin' ? 'cos' : 'sin';
  const F = fn(find);
  const G = fn(given);
  const gs = SIGN[given][q];
  const fs = SIGN[find][q];
  const vyrazhaem = `Из ${TOZHDESTVO} выражаем $${F}^2\\alpha$`;
  const tozhd = `${F}^2\\alpha = 1 - ${G}^2\\alpha`;
  const znak = znakPoChetverti(find, q);

  if (rational) {
    const gv = round9((gs * k) / n);
    const g1 = gcd(k, n);
    const kk = k / g1;
    const nn = n / g1;
    if (nn !== 25) {
      /* Один знак после запятой: 0,6 и 0,8 — считаем в десятичных. */
      const sq = round9((k / n) ** 2);
      const ost = round9(1 - sq);
      return {
        razbor: [
          shag(
            `${vyrazhaem}${gs < 0 ? '. При возведении в квадрат минус пропадает' : ''}`,
            `${tozhd} = 1 - ${paren(gv)}^2 = 1 - ${d(sq)} = ${d(ost)}`,
          ),
          shag(znak, `${F}\\alpha = ${mn(fs)}\\sqrt{${d(ost)}} = ${d(ans)}`),
        ],
      };
    }
    /* Два знака после запятой (0,28 и 0,96): в обыкновенных дробях
       со знаменателем 25 квадраты и корень видны сразу. */
    const mm = m / gcd(m, n);
    const C = kk * 4;
    const dec = desyatichnaya(fs * mm, 25, ans);
    return {
      razbor: [
        shag(
          `С двумя знаками после запятой удобнее обыкновенная дробь. Сокращаем на $4$: и $${C}$, и $100$ делятся на $4$`,
          `${G}\\alpha = ${d(gv)} = ${mn(gs)}\\dfrac{${C}}{100} = ${mn(gs)}\\dfrac{${kk}}{25}`,
        ),
        shag(
          `${vyrazhaem}${gs < 0 ? '. При возведении в квадрат минус пропадает' : ''}. Единицу записываем как $\\dfrac{625}{625}$`,
          `${tozhd} = 1 - \\left(${mn(gs)}\\dfrac{${kk}}{25}\\right)^2 = 1 - \\dfrac{${kk * kk}}{625} = \\dfrac{625 - ${kk * kk}}{625} = \\dfrac{${mm * mm}}{625}`,
        ),
        shag(
          `${znak}. Корень из дроби извлекаем из числителя и знаменателя отдельно: $${mm}^2 = ${mm * mm}$, $25^2 = 625$. Затем ${vDesyatichnuyu(dec.mnozh)}`,
          `${F}\\alpha = ${mn(fs)}\\sqrt{\\dfrac{${mm * mm}}{625}} = ${dec.tex}`,
        ),
      ],
      delimost: priznakiDlya(4),
    };
  }

  /* Данное с корнем: в квадрате корень уходит, (√rad)² = rad. */
  const g = gcd(k, n);
  const kk = k / g;
  const nn = n / g;
  const mm = m / g;
  const A = kk * kk * rad;
  const B = nn * nn;
  const dec = desyatichnaya(fs * mm, nn, ans);
  return {
    razbor: [
      shag(
        `Возводим $${G}\\alpha$ в квадрат: в квадрат возводятся и числитель, и знаменатель, $(\\sqrt{${rad}})^2 = ${rad}$${gs < 0 ? ', а минус пропадает' : ''}`,
        `${G}^2\\alpha = \\left(${radicalFrac(gs, k, rad, n)}\\right)^2 = ${kk === 1 ? '' : `\\dfrac{${kk * kk} \\cdot ${rad}}{${B}} = `}\\dfrac{${A}}{${B}}`,
      ),
      shag(
        `${vyrazhaem}. Единицу записываем как $\\dfrac{${B}}{${B}}$`,
        `${tozhd} = 1 - \\dfrac{${A}}{${B}} = \\dfrac{${B} - ${A}}{${B}} = \\dfrac{${mm * mm}}{${B}}`,
      ),
      shag(
        `${znak}. Корень из дроби извлекаем из числителя и знаменателя отдельно, затем ${vDesyatichnuyu(dec.mnozh)}`,
        `${F}\\alpha = ${mn(fs)}\\sqrt{\\dfrac{${mm * mm}}{${B}}} = ${dec.tex}`,
      ),
    ],
  };
}

/** sin по cos (find = 'sin') или cos по sin (find = 'cos'). */
function drawMN(r: Rng, find: 'sin' | 'cos', wantBase: boolean): Draft | null {
  const given = find === 'sin' ? 'cos' : 'sin';
  const n = r.pick([4, 5, 10, 20, 25]);
  const m = r.int(1, n - 1);
  if (!nice(m / n, 2)) {
    return null;
  }
  const rest = n * n - m * m;
  const { k, m: rad } = simpRoot(rest);
  if (rad > 100) {
    return null;
  }
  const q = r.pick([1, 2, 3, 4] as const);
  const rational = rad === 1;
  const isBase = q === 1 || rational;
  if (isBase !== wantBase) {
    return null;
  }
  /* Рациональное данное записывается десятичной дробью, как в ЕГЭ:
     знаменатели 4, 5, 10, 20, 25 всегда дают конечную запись. */
  const givenTex = rational ? d((SIGN[given][q] * k) / n) : radicalFrac(SIGN[given][q], k, rad, n);
  const ans = round9((SIGN[find][q] * m) / n);
  const uslovie = `Найдите $${fn(find)}\\alpha$, если $${fn(given)}\\alpha = ${givenTex}$ и $\\alpha \\in ${quarterInterval(q)}$.`;
  return {
    uslovie,
    otvet: ans,
    ...razborMN(find, q, rational, k, rad, n, m, ans),
    proverka: SIGN[find][q] * Math.sqrt(1 - ((SIGN[given][q] * k * Math.sqrt(rad)) / n) ** 2),
    signature: `${n}:${m}`,
    params: { n, m, q },
  };
}

export const P8M: Prototype = {
  id: '8.M',
  group: 'III',
  nazvanie: 'Найти $\\sin \\alpha$ по $\\cos \\alpha$',
  podtipy: [
    podtip('base', 'base', (r) => drawMN(r, 'sin', true)),
    podtip('adv', 'advanced', (r) => drawMN(r, 'sin', false)),
  ],
  isklyucheniya: keys([
    { n: 5, m: 1, q: 1 },
    { n: 10, m: 9, q: 1 },
    { n: 4, m: 3, q: 2 },
    { n: 5, m: 2, q: 2 },
    { n: 10, m: 9, q: 3 },
    { n: 10, m: 7, q: 3 },
    { n: 10, m: 3, q: 4 },
    { n: 4, m: 3, q: 4 },
  ]),
};

export const P8N: Prototype = {
  id: '8.N',
  group: 'III',
  nazvanie: 'Найти $\\cos \\alpha$ по $\\sin \\alpha$',
  podtipy: [
    podtip('base', 'base', (r) => drawMN(r, 'cos', true)),
    podtip('adv', 'advanced', (r) => drawMN(r, 'cos', false)),
  ],
  isklyucheniya: keys([
    { n: 4, m: 3, q: 1 },
    { n: 10, m: 1, q: 1 },
    { n: 4, m: 2, q: 1 },
    { n: 25, m: 24, q: 1 },
    { n: 5, m: 1, q: 2 },
    { n: 10, m: 1, q: 2 },
    { n: 5, m: 2, q: 2 },
    { n: 4, m: 3, q: 2 },
    { n: 5, m: 2, q: 3 },
    { n: 10, m: 9, q: 3 },
    { n: 4, m: 2, q: 3 },
    { n: 10, m: 7, q: 3 },
    { n: 25, m: 24, q: 4 },
    { n: 10, m: 3, q: 4 },
    { n: 5, m: 1, q: 4 },
    { n: 5, m: 2, q: 4 },
  ]),
};

/* ── 8.O  тангенс по синусу или косинусу ─────────────────────── */

/** Решение 8.O с десятичными sin и cos (0,6 и 0,8). */
function razborTriple(
  given: 'sin' | 'cos',
  q: Quarter,
  value: number,
  otherValue: number,
  ans: number,
): Shag[] {
  const other = given === 'sin' ? 'cos' : 'sin';
  const gs = SIGN[given][q];
  const os = SIGN[other][q];
  const gv = round9(gs * value);
  const ov = round9(os * otherValue);
  const sinV = given === 'sin' ? gv : ov;
  const cosV = given === 'sin' ? ov : gv;
  const sq = round9(value * value);
  const ost = round9(1 - sq);
  /* Без запятых: 0,6 : 0,8 = 6 : 8, сокращаем на общий множитель. */
  const a = Math.round(Math.abs(sinV) * 10);
  const b = Math.round(Math.abs(cosV) * 10);
  const g = gcd(a, b);
  const dec = desyatichnaya((SIGN.tg[q] * a) / g, b / g, ans);
  return [
    shag(
      `Из ${TOZHDESTVO} выражаем $${fn(other)}^2\\alpha$${gs < 0 ? '. При возведении в квадрат минус пропадает' : ''}`,
      `${fn(other)}^2\\alpha = 1 - ${fn(given)}^2\\alpha = 1 - ${paren(gv)}^2 = 1 - ${d(sq)} = ${d(ost)}`,
    ),
    shag(znakPoChetverti(other, q), `${fn(other)}\\alpha = ${mn(os)}\\sqrt{${d(ost)}} = ${d(ov)}`),
    shag(
      `Тангенс — отношение синуса к косинусу. ${znakTangensa(q)}. Чтобы убрать запятые, домножаем числитель и знаменатель на $10$, затем сокращаем на $${g}$ и записываем ответ десятичной дробью`,
      `\\operatorname{tg}\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha} = \\dfrac{${d(sinV)}}{${d(cosV)}} = ${mn(SIGN.tg[q])}\\dfrac{${a}}{${b}} = ${dec.tex}`,
    ),
  ];
}

export const P8O: Prototype = {
  id: '8.O',
  group: 'III',
  nazvanie: 'Найти $\\operatorname{tg} \\alpha$',
  podtipy: [
    podtip('triple', 'base', (r) => {
      /* Десятичные sin и cos с «хорошим» отношением дают только
         тройки семейства 3-4-5: tg = ±0,75. Даётся меньший катет как
         синус или больший как косинус. */
      const scale = r.pick([1, 2, 5]);
      const [a, b, c] = [3 * scale, 4 * scale, 5 * scale];
      const given = r.pick(['sin', 'cos'] as const);
      const q = r.pick([1, 2, 3, 4] as const);
      const value = given === 'sin' ? a / c : b / c;
      const givenTex = d(SIGN[given][q] * value);
      const ans = round9((SIGN.tg[q] * a) / b);
      const otherValue = given === 'sin' ? b / c : a / c;
      return {
        uslovie: `Найдите $\\operatorname{tg}\\alpha$, если $${fn(given)}\\alpha = ${givenTex}$ и $\\alpha \\in ${quarterInterval(q)}$.`,
        otvet: ans,
        razbor: razborTriple(given, q, value, otherValue, ans),
        proverka:
          given === 'sin'
            ? (SIGN.sin[q] * value) / (SIGN.cos[q] * Math.sqrt(1 - value * value))
            : (SIGN.sin[q] * Math.sqrt(1 - value * value)) / (SIGN.cos[q] * value),
        signature: `${given}:${scale}:${q}`,
        params: { given, value: round9(value), q },
      };
    }),
    podtip('root-int', 'base', (r) => drawO(r, [1])),
    podtip('root', 'advanced', (r) => drawO(r, [2, 4, 5, 8, 10])),
  ],
  isklyucheniya: keys([
    { given: 'sin', p: 2, q: 5, quarter: 1 },
    { given: 'sin', p: 1, q: 5, quarter: 1 },
    { given: 'cos', p: 4, q: 1, quarter: 1 },
    { given: 'cos', p: 2, q: 1, quarter: 1 },
    { given: 'sin', p: 3, q: 5, quarter: 2 },
    { given: 'sin', p: 2, q: 1, quarter: 2 },
    { given: 'cos', p: 3, q: 1, quarter: 2 },
    { given: 'cos', p: 5, q: 1, quarter: 2 },
    { given: 'sin', p: 4, q: 5, quarter: 3 },
    { given: 'sin', p: 5, q: 4, quarter: 3 },
    { given: 'cos', p: 1, q: 5, quarter: 3 },
    { given: 'cos', p: 2, q: 3, quarter: 3 },
    { given: 'sin', p: 1, q: 2, quarter: 4 },
    { given: 'sin', p: 3, q: 5, quarter: 4 },
    { given: 'cos', p: 2, q: 5, quarter: 4 },
    { given: 'cos', p: 4, q: 1, quarter: 4 },
  ]),
};

/**
 * Решение 8.O с корнем: sin α = ±p/√s, cos α = ±qq/√s, √s = k√m, данное
 * в условии записано как num√m/(k·m). √s не вычисляем: при делении
 * синуса на косинус √m · √m = m, и k·m сокращается.
 */
function razborO(
  given: 'sin' | 'cos',
  q: Quarter,
  p: number,
  qq: number,
  k: number,
  m: number,
  givenTex: string,
  ans: number,
): Shag[] {
  const other = given === 'sin' ? 'cos' : 'sin';
  const G = fn(given);
  const O = fn(other);
  const gs = SIGN[given][q];
  const os = SIGN[other][q];
  const ts = SIGN.tg[q];
  const num = given === 'sin' ? p : qq;
  const o = given === 'sin' ? qq : p;
  const s = p * p + qq * qq;
  const km = k * m;
  /** c√m: 7\sqrt{2}, \sqrt{113}. */
  const koren = (c: number): string => `${c === 1 ? '' : c}\\sqrt{${m}}`;
  /** Произведение без множителя 1. */
  const proizv = (x: number, y: number): string =>
    x === 1 ? `${y}` : y === 1 ? `${x}` : `${x} \\cdot ${y}`;
  const otherTex = `${mn(os)}\\dfrac{${o}}{${koren(k)}}`;

  const sinTex = given === 'sin' ? skobki(gs, givenTex) : skobki(os, otherTex);
  const cosTex = given === 'sin' ? skobki(os, otherTex) : skobki(gs, givenTex);
  /* sin : cos — умножаем на перевёрнутую дробь. */
  const [n1, d1, n2, d2] =
    given === 'sin'
      ? [`${koren(num)} \\cdot ${koren(k)}`, proizv(km, o), proizv(num, km), proizv(km, o)]
      : [proizv(o, km), `${koren(k)} \\cdot ${koren(num)}`, proizv(o, km), proizv(km, num)];
  const rez = qq === 1 ? d(ans) : frac(ts * p, qq);

  const steps: Shag[] = [
    shag(
      `Возводим $${G}\\alpha$ в квадрат${gs < 0 ? ', минус пропадает' : ''}: $(\\sqrt{${m}})^2 = ${m}$. Дробь сразу сокращаем на $${m}$${k === 1 ? ` — считать $${m}^2$ не нужно` : ''}`,
      `${G}^2\\alpha = \\left(${givenTex}\\right)^2 = \\dfrac{${proizv(num * num, m)}}{${k === 1 ? `${m} \\cdot ${m}` : km * km}} = \\dfrac{${num * num}}{${s}}`,
    ),
    shag(
      `Из ${TOZHDESTVO} выражаем $${O}^2\\alpha$. Единицу записываем как $\\dfrac{${s}}{${s}}$`,
      `${O}^2\\alpha = 1 - ${G}^2\\alpha = 1 - \\dfrac{${num * num}}{${s}} = \\dfrac{${s} - ${num * num}}{${s}} = \\dfrac{${o * o}}{${s}}`,
    ),
    shag(
      `${znakPoChetverti(other, q)}. Корень из дроби извлекаем из числителя и знаменателя отдельно; ${
        k === 1
          ? `$\\sqrt{${s}}$ оставляем как есть — он потом сократится`
          : `$\\sqrt{${s}} = \\sqrt{${k * k} \\cdot ${m}} = ${koren(k)}$`
      }`,
      `${O}\\alpha = ${mn(os)}\\sqrt{\\dfrac{${o * o}}{${s}}} = ${mn(os)}\\dfrac{${o}}{\\sqrt{${s}}}${k === 1 ? '' : ` = ${otherTex}`}`,
    ),
    shag(
      `Тангенс — отношение синуса к косинусу. ${znakTangensa(q)}. Делим на дробь — значит умножаем на перевёрнутую; $${koren(k)} \\cdot \\sqrt{${m}} = ${km}$, и $${km}$ сокращается ещё до умножения`,
      `\\operatorname{tg}\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha} = ${sinTex} : ${cosTex} = ${mn(ts)}\\dfrac{${n1}}{${d1}} = ${mn(ts)}\\dfrac{${n2}}{${d2}} = ${rez}`,
    ),
  ];
  if (qq !== 1) {
    const dec = desyatichnaya(ts * p, qq, ans);
    const text = vDesyatichnuyu(dec.mnozh);
    steps.push(shag(`${text.charAt(0).toUpperCase()}${text.slice(1)}`, dec.tex));
  }
  return steps;
}

/** Тангенс по данному с корнем: sin α = p/√(p²+q²) или cos α = q/√(p²+q²). */
function drawO(r: Rng, qs: number[]): Draft | null {
  {
    const p = r.int(qs.length === 1 ? 2 : 1, 9);
    const qq = r.pick(qs);
    if (gcd(p, qq) !== 1 || p === qq) {
      return null;
    }
    const s = p * p + qq * qq;
    const { k, m } = simpRoot(s);
    if (m === 1) {
      return null;
    }
    const given = r.pick(['sin', 'cos'] as const);
    const q = r.pick([1, 2, 3, 4] as const);
    /* sin α = p/√s = p√m / (k·m), cos α = q/√s. */
    const num = given === 'sin' ? p : qq;
    const givenTex = radicalFrac(SIGN[given][q], num, m, k * m);
    const ans = round9((SIGN.tg[q] * p) / qq);
    if (!nice(ans, 3)) {
      return null;
    }
    return {
      uslovie: `Найдите $\\operatorname{tg}\\alpha$, если $${fn(given)}\\alpha = ${givenTex}$ и $\\alpha \\in ${quarterInterval(q)}$.`,
      otvet: ans,
      razbor: razborO(given, q, p, qq, k, m, givenTex, ans),
      proverka:
        given === 'sin'
          ? (SIGN.sin[q] * (p / Math.sqrt(s))) / (SIGN.cos[q] * Math.sqrt(1 - (p * p) / s))
          : (SIGN.sin[q] * Math.sqrt(1 - (qq * qq) / s)) / (SIGN.cos[q] * (qq / Math.sqrt(s))),
      signature: `${p}:${qq}`,
      params: { given, p, q: qq, quarter: q },
    };
  }
}

/* ── 8.P  k·cos 2α по sin α или cos α ────────────────────────── */

/**
 * Решение 8.P: формула косинуса двойного угла через данную функцию
 * (вторую искать не нужно, четверть не нужна — значение в квадрате),
 * потом умножение на k удобным способом.
 */
function razborP(given: 'sin' | 'cos', s: number, k: number, c2: number, ans: number): Razbor {
  const s2 = round9(s * s);
  const dva = round9(2 * s2);
  const imya = given === 'sin' ? 'синус' : 'косинус';
  const vtoraya = given === 'sin' ? '\\cos\\alpha' : '\\sin\\alpha';
  const znakS =
    s < 0
      ? `. Знак ${given === 'sin' ? 'синуса' : 'косинуса'} не важен: при возведении в квадрат минус пропадает`
      : '';
  const pervyi =
    given === 'sin'
      ? shag(
          `Из формул косинуса двойного угла берём ту, где есть только ${imya}: $\\cos 2\\alpha = 1 - 2\\sin^2\\alpha$. Тогда $${vtoraya}$ искать не нужно${znakS}`,
          `\\cos 2\\alpha = 1 - 2\\sin^2\\alpha = 1 - 2 \\cdot ${paren(s)}^2 = 1 - 2 \\cdot ${d(s2)} = 1 - ${d(dva)} = ${d(c2)}`,
        )
      : shag(
          `Из формул косинуса двойного угла берём ту, где есть только ${imya}: $\\cos 2\\alpha = 2\\cos^2\\alpha - 1$. Тогда $${vtoraya}$ искать не нужно${znakS}`,
          `\\cos 2\\alpha = 2\\cos^2\\alpha - 1 = 2 \\cdot ${paren(s)}^2 - 1 = 2 \\cdot ${d(s2)} - 1 = ${d(dva)} - 1 = ${d(c2)}`,
        );

  /* |cos 2α| — сотые доли: 0,28 = 28/100. */
  const C = Math.round(Math.abs(c2) * 100);
  const z = mn(c2);
  const lhs = `${k} \\cdot ${paren(c2)}`;
  if (C === 50) {
    return {
      razbor: [
        pervyi,
        shag(
          'Умножить на $0{,}5$ — значит разделить пополам: $0{,}5 = \\dfrac{1}{2}$',
          `${lhs} = ${z}\\dfrac{${k}}{2} = ${d(ans)}`,
        ),
      ],
    };
  }
  if (k === 25) {
    const nacelo = Number.isInteger(ans);
    return {
      razbor: [
        pervyi,
        shag(
          `Умножить на $25$ — то же, что умножить на $100$ и разделить на $4$, ведь $25 = \\dfrac{100}{4}$${
            nacelo ? `. Число $${C}$ делится на $4$ нацело` : ''
          }`,
          `${lhs} = ${z}\\dfrac{${d(Math.abs(c2))} \\cdot 100}{4} = ${z}\\dfrac{${C}}{4} = ${d(ans)}`,
        ),
      ],
      ...(nacelo ? { delimost: priznakiDlya(4) } : {}),
    };
  }
  if (k % 10 === 0) {
    const sdvig = d(round9(Math.abs(c2) * 10));
    return {
      razbor: [
        pervyi,
        shag(
          k === 10
            ? 'Умножить на $10$ — значит перенести запятую на один знак вправо'
            : `Раскладываем $${k} = ${k / 10} \\cdot 10$: умножить на $10$ — значит перенести запятую на один знак вправо, а потом умножаем на $${k / 10}$`,
          `${lhs} = ${k === 10 ? '' : `${z}${k / 10} \\cdot ${sdvig} = `}${d(ans)}`,
        ),
      ],
    };
  }
  return {
    razbor: [
      pervyi,
      shag(
        `Десятичную дробь умножаем на целое так: перемножаем $${k}$ и $${C}$ как целые числа — $${k} \\cdot ${C} = ${k * C}$, а затем отделяем запятой два знака — столько их у $${d(Math.abs(c2))}$`,
        `${lhs} = ${z}\\dfrac{${k} \\cdot ${C}}{100} = ${z}\\dfrac{${k * C}}{100} = ${d(ans)}`,
      ),
    ],
  };
}

function drawP(r: Rng, integer: boolean): Draft | null {
  const s = r.pick([-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9]) / 10;
  const given = r.pick(['sin', 'cos'] as const);
  const c2 = round9(given === 'sin' ? 1 - 2 * s * s : 2 * s * s - 1);
  const k = r.int(2, 25);
  const ans = round9(k * c2);
  if (ans === 0 || Number.isInteger(ans) !== integer || !nice(ans, 2)) {
    return null;
  }
  if (!integer && s > 0 && r.int(0, 1) === 0) {
    return null;
  }
  return {
    uslovie: `Найдите $${k}\\cos 2\\alpha$, если $${fn(given)}\\alpha = ${d(s)}$.`,
    otvet: ans,
    ...razborP(given, s, k, c2, ans),
    proverka: k * Math.cos(2 * (given === 'sin' ? Math.asin(s) : Math.acos(s))),
    signature: `${given}:${s}`,
    params: { given, s, k },
  };
}

export const P8P: Prototype = {
  id: '8.P',
  group: 'III',
  nazvanie: 'Косинус двойного угла по $\\sin$ или $\\cos$',
  podtipy: [
    podtip('int', 'base', (r) => drawP(r, true)),
    podtip('dec', 'advanced', (r) => drawP(r, false)),
  ],
  isklyucheniya: keys([
    { given: 'sin', s: 0.6, k: 3 },
    { given: 'cos', s: 0.5, k: 16 },
    { given: 'sin', s: -0.5, k: 4 },
    { given: 'cos', s: -0.8, k: 3 },
  ]),
};
