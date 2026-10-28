/**
 * Прототипы раздела «Варианты повышенной сложности» для задания №7.
 * В общий реестр PROTOTYPES не входят — в банк, тренажёр и генератор
 * №7 не попадают. Устроены как прототипы группы III: разбор по тем же
 * этапам (`razbor`), подсказки — `hint`, проверка — подстановкой.
 */

import {
  d,
  div,
  hint,
  hintOtbor,
  konechnaya,
  korenN,
  lin,
  linKoren,
  linReshenie,
  mul,
  num,
  pw,
  q,
  razbor,
  sk,
  stepenTex,
  sub,
  t,
  uslovieTekst,
  val,
  voprosIz,
  vychDelenie,
  type Poryadok,
} from '../kit';
import type { Params, Prototype } from '../types';
import { ryadom } from './gruppa1';
import { logTex } from './gruppa4';

/** Показатель основания по a: 9 при a = 3 → 2. */
function stepen(c: number, a: number): number {
  let s = 0;
  let m = c;
  while (m > 1) {
    if (m % a !== 0) throw new Error(`${c} — не степень ${a}`);
    m /= a;
    s += 1;
  }
  return s;
}

/** Показатель слева: kx + b; по умолчанию b − x (как в варианте 1). */
function pokazatel(p: Params): { k: number; b: number; por: Poryadok } {
  const k = p['k'] === undefined ? -1 : num(p, 'k');
  const por = (p['por'] ?? 'bx') as Poryadok;
  return { k, b: num(p, 'b'), por };
}

/** kx + b с подставленным x: «2-1{,}25», «3\\cdot(-2)+5». */
function linPodst(k: number, b: number, x: ReturnType<typeof q>, por: Poryadok): string {
  const xs = val(x) < 0 ? `(${t(x)})` : t(x);
  const kx = k === 1 ? xs : k === -1 ? `-${xs}` : `${d(k)}\\cdot ${xs}`;
  if (por === 'bx') return kx.startsWith('-') ? `${d(b)}${kx}` : `${d(b)}+${kx}`;
  return b < 0 ? `${kx}-${d(-b)}` : `${kx}+${d(b)}`;
}

function uravnenie(p: Params): string {
  const c = num(p, 'c');
  const a = num(p, 'a');
  const m = num(p, 'm');
  const { k, b, por } = pokazatel(p);
  return `${pw(d(c), lin(k, b, 'x', por))}=\\sqrt{${d(a ** m)}}`;
}

/**
 * c^(b − x) = √(aᵐ), где c = aˢ, m нечётное: справа корень, который
 * не извлекается нацело, — его надо записать степенью a^(m/2).
 */
export const PV7_KOREN: Prototype = {
  id: 'PV7-KOREN',
  no: 101,
  group: 'III',
  title: 'Степень равна корню: показатель-дробь',
  formula: '\\left(a^s\\right)^{b-x}=\\sqrt{a^m}',
  skills: ['stepeni', 'korni', 'perenos'],
  fipiNos: '',
  uravnenie,
  uslovie(p) {
    return uslovieTekst(uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const c = num(p, 'c');
    const a = num(p, 'a');
    const b = num(p, 'b');
    const m = num(p, 'm');
    const { k } = pokazatel(p);
    return { lhs: (x) => c ** (k * x + b), rhs: () => Math.sqrt(a ** m), odz: () => true };
  },
  solve(p) {
    const c = num(p, 'c');
    const a = num(p, 'a');
    const b = num(p, 'b');
    const m = num(p, 'm');
    const s = stepen(c, a);
    const pravyy = q(m, 2);
    const { k, por } = pokazatel(p);
    /* s(kx + b) = m/2  ⇒  x = (m/(2s) − b)/k. */
    const x = linKoren(k, b, q(m, 2 * s));
    const ans = val(x);
    const E = lin(k, b, 'x', por);
    /* Значение показателя слева в корне — для проверки. */
    const Ex = sub(mul(q(k), x), q(-b));
    const levyy = `${d(s)}(${E})`;
    return {
      answer: ans,
      uravnenie: uravnenie(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          'Показательное уравнение. План: записать обе части степенями одного основания и приравнять показатели. Корень справа — тоже степень, только с дробным показателем.',
        ],
        preobr: [
          `Основание слева: $${d(c)}=${pw(d(a), String(s))}$, поэтому $${pw(d(c), E)}=${pw(d(a), levyy)}$ (при возведении степени в степень показатели перемножаются).`,
          `Правая часть: $${d(a ** m)}=${pw(d(a), String(m))}$, а корень — степень с показателем $\\dfrac12$: $\\sqrt{${pw(d(a), String(m))}}=${pw(d(a), `\\frac{${m}}{2}`)}$.`,
          `Основания равны — приравниваем показатели: $${levyy}=\\dfrac{${m}}{2}$.`,
          `Делим на $${d(s)}$: $${E}=${t(q(m, 2 * s))}$.`,
          ...(k === -1 && por === 'bx'
            ? [`Переносим: $x=${d(b)}-${t(q(m, 2 * s))}=${t(x)}$.`]
            : linReshenie(k, b, q(m, 2 * s), por)),
        ],
        korni: [`$x=${t(x)}$ — единственный корень (показательная функция монотонна).`],
        proverka: [
          `При $x=${t(x)}$ показатель слева $${linPodst(k, b, x, por)}=${t(Ex)}$, левая часть $${pw(d(a), `${d(s)}\\cdot${t(Ex)}`)}=${pw(d(a), t(mul(q(s), Ex)))}$; правая часть $${pw(d(a), t(pravyy))}$ — равны.`,
        ],
        answer: ans,
      }),
      vychisleniya: [],
      hints: [
        hint(
          'К какому основанию привести обе части?',
          `$${d(a)}$`,
          [`$${d(c)}$`, `$${d(a ** m)}$`, '$10$'],
          `И $${d(c)}$, и $${d(a ** m)}$ — степени числа $${d(a)}$.`,
        ),
        hint(
          `Как записать $\\sqrt{${d(a ** m)}}$ степенью числа $${d(a)}$?`,
          `$${pw(d(a), `\\frac{${m}}{2}`)}$`,
          [
            `$${pw(d(a), String(m))}$`,
            `$${pw(d(a), String(2 * m))}$`,
            `$${pw(d(a), `\\frac{1}{${m}}`)}$`,
          ],
          'Корень квадратный — это степень $\\dfrac12$: $\\sqrt{a^m}=a^{\\frac{m}{2}}$.',
        ),
        hint(
          'Какое уравнение для показателей получится?',
          `$${levyy}=\\dfrac{${m}}{2}$`,
          [`$${E}=\\dfrac{${m}}{2}$`, `$${levyy}=${m}$`],
          `Слева показатель умножается на $${d(s)}$: $${d(c)}=${pw(d(a), String(s))}$.`,
        ),
        hint('Чему равен $x$?', `$${t(x)}$`, ryadom(x)),
      ],
    };
  },
};

/* ── log_{aʲ}((aʳ)^(kx + b)) = m ───────────────────────────────── */

/** Показатель степени под логарифмом: kx + b. */
function pokazatelLog(p: Params): { k: number; b: number; por: Poryadok; A: string } {
  const k = num(p, 'k');
  const b = num(p, 'b');
  const por = (p['por'] ?? 'bx') as Poryadok;
  return { k, b, por, A: lin(k, b, 'x', por) };
}

function uravnenieLog(p: Params): string {
  const a = num(p, 'a');
  const B = a ** num(p, 'j');
  const C = a ** num(p, 'r');
  return `${logTex(B)} ${pw(d(C), pokazatelLog(p).A)}=${d(num(p, 'm'))}`;
}

/**
 * log_{aʲ}((aʳ)^(kx+b)) = m: и основание, и число под логарифмом — степени
 * одного числа a, но разные (8 и 32). Подвох — привести к a обе части и
 * не потерять множитель r/j.
 */
export const PV7_LOG_STEPENI: Prototype = {
  id: 'PV7-LOG-STEPENI',
  no: 102,
  group: 'IV',
  title: 'Логарифм степени: основание и число — разные степени одного числа',
  formula: '\\log_{a^j}\\left(a^r\\right)^{kx+b}=m',
  skills: ['log-svoystva', 'stepeni', 'perenos'],
  fipiNos: '',
  uravnenie: uravnenieLog,
  uslovie(p) {
    return uslovieTekst(uravnenieLog(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const a = num(p, 'a');
    const B = a ** num(p, 'j');
    const C = a ** num(p, 'r');
    const m = num(p, 'm');
    const { k, b } = pokazatelLog(p);
    return {
      lhs: (x) => ((k * x + b) * Math.log(C)) / Math.log(B),
      rhs: () => m,
      odz: () => true,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const j = num(p, 'j');
    const r = num(p, 'r');
    const m = num(p, 'm');
    const { k, b, por, A } = pokazatelLog(p);
    const B = a ** j;
    const C = a ** r;
    const LB = logTex(B);
    /* r(kx+b)/j = m  ⇒  kx + b = jm/r. */
    const pravaya = q(j * m, r);
    const x = linKoren(k, b, pravaya);
    const ans = val(x);
    return {
      answer: ans,
      uravnenie: uravnenieLog(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          `Основание $${d(B)}$ и число $${d(C)}$ — степени одного числа: $${d(B)}=${pw(d(a), String(j))}$, $${d(C)}=${pw(d(a), String(r))}$. Запишем всё через $${d(a)}$ и применим свойства логарифма.`,
        ],
        odz: [
          `Число под логарифмом — степень положительного числа, оно положительно при любом $x$; ограничений нет.`,
        ],
        preobr: [
          `$${pw(d(C), A)}=${pw(d(a), `${d(r)}(${A})`)}$ — при возведении степени в степень показатели перемножаются.`,
          `$${LB} ${pw(d(a), 'E')}=\\dfrac{E}{${d(j)}}$, поэтому левая часть равна $\\dfrac{${d(r)}(${A})}{${d(j)}}$.`,
          `Уравнение: $\\dfrac{${d(r)}(${A})}{${d(j)}}=${d(m)}$, откуда $${A}=\\dfrac{${d(j)}\\cdot${d(m)}}{${d(r)}}=${t(pravaya)}$.`,
          ...linReshenie(k, b, pravaya, por),
        ],
        korni: [`$x=${t(x)}$.`],
        proverka: [
          `При $x=${t(x)}$: $${A}=${t(pravaya)}$, левая часть $\\dfrac{${d(r)}\\cdot${t(pravaya)}}{${d(j)}}=${d(m)}$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: [],
      hints: [
        hint(
          `Степенью какого числа являются и $${d(B)}$, и $${d(C)}$?`,
          `$${d(a)}$`,
          [`$${d(B)}$`, `$${d(C)}$`, '$10$'],
          `$${d(B)}=${pw(d(a), String(j))}$, $${d(C)}=${pw(d(a), String(r))}$.`,
        ),
        hint(
          'Чему равна левая часть?',
          `$\\dfrac{${d(r)}(${A})}{${d(j)}}$`,
          [`$\\dfrac{${d(j)}(${A})}{${d(r)}}$`, `$${d(r)}(${A})$`, `$\\dfrac{${A}}{${d(j)}}$`],
          `$${pw(d(C), 'E')}=${pw(d(a), `${d(r)}E`)}$, а $${LB} ${pw(d(a), 'F')}=\\dfrac{F}{${d(j)}}$.`,
        ),
        hint('Какое линейное уравнение получится?', `$${A}=${t(pravaya)}$`, [
          `$${A}=${d(m)}$`,
          `$${A}=${t(q(r * m, j))}$`,
        ]),
        hint('Чему равен $x$?', `$${t(x)}$`, ryadom(x)),
      ],
    };
  },
};

/* ── log_a(c − x) = log_a(x² − x): посторонний корень ──────────── */

function uravnenieKv(p: Params): string {
  const a = num(p, 'a');
  return `${logTex(a)}(${d(num(p, 'c'))}-x)=${logTex(a)}(x^2-x)`;
}

/**
 * log_a(c − x) = log_a(x² − x), 0 < c < 1: после приравнивания x² = c,
 * корни ±√c. Подвох: x = √c даёт отрицательное число под логарифмом —
 * посторонний; «больший корень» — это −√c.
 */
export const PV7_LOG_KVADRAT: Prototype = {
  id: 'PV7-LOG-KVADRAT',
  no: 103,
  group: 'IV',
  title: 'Равные логарифмы: квадратное уравнение и посторонний корень',
  formula: '\\log_a(c-x)=\\log_a(x^2-x)',
  skills: ['log-opredelenie', 'korni'],
  fipiNos: '',
  uravnenie: uravnenieKv,
  uslovie(p) {
    return uslovieTekst(uravnenieKv(p), 'bolshiy');
  },
  vopros: () => 'bolshiy',
  chisla(p) {
    const a = num(p, 'a');
    const c = num(p, 'c');
    return {
      lhs: (x) => Math.log(c - x) / Math.log(a),
      rhs: (x) => Math.log(x * x - x) / Math.log(a),
      odz: (x) => c - x > 0 && x * x - x > 0,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const c = num(p, 'c');
    const s = Math.round(Math.sqrt(c) * 1000) / 1000;
    if (Math.abs(s * s - c) > 1e-9 || c <= 0 || c >= 1)
      throw new Error(`c=${c}: нужен квадрат 0<c<1`);
    const L = logTex(a);
    const x1 = s;
    const x2 = -s;
    const ans = x2;
    return {
      answer: ans,
      uravnenie: uravnenieKv(p),
      korni: [x2, x1],
      postoronnie: [x1],
      etapy: razbor({
        plan: [
          'Логарифмы с одинаковым основанием равны — равны и выражения под ними. План: приравнять выражения, решить уравнение и обязательно проверить, что под обоими логарифмами положительные числа.',
        ],
        odz: [`$${d(c)}-x>0$ и $x^2-x>0$.`],
        preobr: [
          `$${d(c)}-x=x^2-x$, слагаемые $-x$ сокращаются: $x^2=${d(c)}$.`,
          `$x=${d(s)}$ или $x=${d(-s)}$.`,
        ],
        korni: [`$x=${d(x1)}$ или $x=${d(x2)}$.`],
        otbor: [
          `$x=${d(x1)}$: $${d(c)}-${d(x1)}=${d(c - x1)}<0$ — под логарифмом отрицательное число, корень посторонний.`,
          `$x=${d(x2)}$: $${d(c)}+${d(s)}=${d(c + s)}>0$ и $x^2-x=${d(c)}+${d(s)}=${d(c + s)}>0$ — подходит.`,
          'Корень один — он и есть больший.',
        ],
        proverka: [`$${L}${d(c + s)}=${L}${d(c + s)}$ — верно.`],
        answer: ans,
      }),
      vychisleniya: [{ tekst: 'Корень из правой части:', tex: `\\sqrt{${d(c)}}=${d(s)}` }],
      hints: [
        hint('Что следует из равенства логарифмов с одним основанием?', `$${d(c)}-x=x^2-x$`, [
          `$${d(c)}-x=${d(a)}$`,
          `$x^2-x=0$`,
        ]),
        hint('Какие корни у уравнения $x^2=' + d(c) + '$?', `$${d(s)}$ и $${d(-s)}$`, [
          `$${d(s)}$`,
          `$${d(c / 2)}$ и $${d(-c / 2)}$`,
        ]),
        hintOtbor(
          'bolshiy',
          `$${d(ans)}$`,
          [`$${d(x1)}$`, `$${d(c)}$`],
          `При $x=${d(x1)}$ под первым логарифмом $${d(c - x1)}<0$ — корень посторонний.`,
        ),
      ],
    };
  },
};

/* ── (1/x + c)³ = d: нечётная степень, затем обратное число ─────── */

function uravnenieKub(p: Params): string {
  return `\\left(\\dfrac{1}{x}+${d(num(p, 'c'))}\\right)^3=${d(num(p, 'd'))}`;
}

/**
 * (1/x + c)³ = d, d — куб целого r: кубический корень один, 1/x = r − c.
 * Подвох — 1/x выходит отрицательным, и x — маленькая десятичная дробь
 * со знаком минус (а не r − c и не c − r).
 */
export const PV7_KUB_OBRATNOE: Prototype = {
  id: 'PV7-KUB-OBRATNOE',
  no: 104,
  group: 'I',
  title: 'Куб суммы с дробью $\\dfrac1x$: кубический корень и обратное число',
  formula: '\\left(\\dfrac{1}{x}+c\\right)^3=d',
  skills: ['stepeni', 'perenos'],
  fipiNos: '',
  uravnenie: uravnenieKub,
  uslovie(p) {
    return uslovieTekst(uravnenieKub(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const c = num(p, 'c');
    const dd = num(p, 'd');
    return { lhs: (x) => (1 / x + c) ** 3, rhs: () => dd, odz: (x) => x !== 0 };
  },
  solve(p) {
    const c = num(p, 'c');
    const dd = num(p, 'd');
    const r = korenN(dd, 3);
    if (r === null) throw new Error(`${dd} — не куб целого`);
    const y = r - c;
    if (y === 0) throw new Error('PV7-KUB-OBRATNOE: 1/x = 0, корней нет');
    const x = q(1, y);
    if (!konechnaya(x)) throw new Error(`PV7-KUB-OBRATNOE: 1/${y} — бесконечная дробь`);
    const ans = val(x);
    const Y = '\\dfrac{1}{x}';
    return {
      answer: ans,
      uravnenie: uravnenieKub(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          `Куб выражения $${Y}+${d(c)}$ равен числу. Степень $3$ нечётная — у уравнения $t^3=${d(dd)}$ ровно один корень $t=\\sqrt[3]{${d(dd)}}$. План: извлечь кубический корень, найти $${Y}$ и перевернуть дробь.`,
        ],
        odz: ['$x\\ne0$ — на ноль делить нельзя.'],
        preobr: [
          `$${d(dd)}=${stepenTex(r, 3)}$, поэтому $${Y}+${d(c)}=${d(r)}$.`,
          `Переносим $${d(c)}$ в правую часть с противоположным знаком: $${Y}=${d(r)}-${d(c)}=${d(y)}$.`,
          `Число, обратное к $${d(y)}$: $x=\\dfrac{1}{${d(y)}}=${t(x)}$.`,
        ],
        korni: [`$x=${t(x)}$ — единственный корень, $x\\ne0$.`],
        proverka: [
          `$\\dfrac{1}{${t(x)}}=${d(y)}$, $${d(y)}+${d(c)}=${d(r)}$, $${sk(r)}^3=${d(dd)}$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: vychDelenie(q(1), q(y)),
      hints: [
        hint(
          'С чего начать?',
          `извлечь кубический корень: $${Y}+${d(c)}=${d(r)}$`,
          ['раскрыть куб суммы по формуле', `$${Y}+${d(c)}=\\pm${d(Math.abs(r))}$`],
          'Степень нечётная: каждое число — куб ровно одного числа.',
        ),
        hint(`Чему равно $${Y}$?`, `$${d(y)}$`, [`$${d(r + c)}$`, `$${d(-y)}$`]),
        hint('Чему равен $x$?', `$${t(x)}$`, [`$${d(y)}$`, `$${t(q(-1, y))}$`, `$${d(-y)}$`]),
      ],
    };
  },
};

/* ── √(a·x² − b) = x²: отрицательные корни не посторонние ───────── */

function uravnenieKvKoren(p: Params): string {
  return `\\sqrt{${d(num(p, 'a'))}x^2-${d(num(p, 'b'))}}=x^2`;
}

/** Точный квадратный корень из неотрицательного целого или null. */
function kvKoren(n: number): number | null {
  const r = korenN(n, 2);
  return r === null || r < 0 ? null : r;
}

/**
 * √(a·x² − b) = x², меньший корень. После возведения в квадрат —
 * биквадратное x⁴ − a·x² + b = 0 (у книжного типа — полный квадрат
 * (x² − s)²). Подвох: правая часть x² неотрицательна при любом x, и
 * отрицательный корень — не посторонний; меньший корень — отрицательный.
 */
export const PV7_KOREN_KVADRAT: Prototype = {
  id: 'PV7-KOREN-KVADRAT',
  no: 105,
  group: 'II',
  title: 'Корень равен $x^2$: отрицательные корни подходят',
  formula: '\\sqrt{ax^2-b}=x^2',
  skills: ['korni', 'diskriminant'],
  fipiNos: '',
  uravnenie: uravnenieKvKoren,
  uslovie(p) {
    return uslovieTekst(uravnenieKvKoren(p), 'menshiy');
  },
  vopros: () => 'menshiy',
  chisla(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    return {
      lhs: (x) => Math.sqrt(a * x * x - b),
      rhs: (x) => x * x,
      odz: (x) => a * x * x - b >= 0,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const D = a * a - 4 * b;
    const sD = kvKoren(D);
    if (sD === null || (a + sD) % 2 !== 0) throw new Error(`PV7-KOREN-KVADRAT: D = ${D}`);
    /* t = x²: t² − a·t + b = 0, оба корня — положительные точные квадраты. */
    const ts = [...new Set([(a - sD) / 2, (a + sD) / 2])];
    const ks = ts.map((u) => {
      const s = kvKoren(u);
      if (u <= 0 || s === null) throw new Error(`PV7-KOREN-KVADRAT: x² = ${u}`);
      return s;
    });
    const vse = ks.flatMap((s) => [-s, s]).sort((x, y) => x - y);
    const ans = vse[0] as number;
    const smax = -ans;
    const tmax = smax * smax;
    const kvadrat = ts.length === 1;
    const t0 = ts[0] as number;
    const t1 = ts[ts.length - 1] as number;
    const kvUr = `x^4-${d(a)}x^2+${d(b)}=0`;
    return {
      answer: ans,
      uravnenie: uravnenieKvKoren(p),
      korni: vse,
      postoronnie: [],
      etapy: razbor({
        plan: [
          'Корень равен $x^2$. Справа число неотрицательное при любом $x$, поэтому $\\sqrt A=x^2\\iff A=x^4$ — возводим в квадрат без потери корней и без лишних. Получится биквадратное уравнение: решаем его заменой $t=x^2$.',
        ],
        odz: [
          'Подкоренное выражение после возведения в квадрат равно $x^4\\ge0$, а условие $x^2\\ge0$ верно всегда — отдельных ограничений на знак $x$ нет.',
        ],
        preobr: [
          `Возводим в квадрат: $${d(a)}x^2-${d(b)}=x^4$, то есть $${kvUr}$.`,
          kvadrat
            ? `Слева полный квадрат: $${d(a)}=2\\cdot${d(t0)}$, $${d(b)}=${d(t0)}^2$, поэтому $\\left(x^2-${d(t0)}\\right)^2=0$ и $x^2=${d(t0)}$.`
            : `Замена $t=x^2$: $t^2-${d(a)}t+${d(b)}=0$, $D=${d(a)}^2-4\\cdot${d(b)}=${d(D)}$, $t=\\dfrac{${d(a)}\\pm${d(sD)}}{2}$: $t=${d(t0)}$ или $t=${d(t1)}$ — оба положительны.`,
        ],
        korni: ts.map(
          (u, i) => `$x^2=${d(u)}$: $x=${d(ks[i] as number)}$ или $x=${d(-(ks[i] as number))}$.`,
        ),
        otbor: [
          'Все корни подходят: правая часть $x^2$ при отрицательном $x$ тоже положительна, а подкоренное выражение равно $x^4$. Отбрасывать отрицательные корни нельзя — в этом ловушка.',
          `Меньший корень — $${d(ans)}$.`,
        ],
        proverka: [
          `$x=${d(ans)}$: $\\sqrt{${d(a)}\\cdot${d(tmax)}-${d(b)}}=\\sqrt{${d(a * tmax - b)}}=${d(tmax)}$, а $x^2=(${d(ans)})^2=${d(tmax)}$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: [
        {
          tekst: 'Корни для $t=x^2$ проверяем по теореме Виета: сумма и произведение.',
          tex: kvadrat
            ? `${d(t0)}+${d(t0)}=${d(a)},\\quad ${d(t0)}\\cdot${d(t0)}=${d(b)}`
            : `${d(t0)}+${d(t1)}=${d(a)},\\quad ${d(t0)}\\cdot${d(t1)}=${d(b)}`,
        },
      ],
      hints: [
        hint('Какое уравнение получится после возведения в квадрат?', `$${kvUr}$`, [
          `$x^4-${d(a)}x^2-${d(b)}=0$`,
          `$x^2-${d(a)}x+${d(b)}=0$`,
        ]),
        hint('Чему может равняться $x^2$?', kvadrat ? `$${d(t0)}$` : `$${d(t0)}$ или $${d(t1)}$`, [
          `$${d(b)}$`,
          `$${d(a)}$`,
          `$${d(-t1)}$`,
        ]),
        hint(
          `Подходит ли корень $x=${d(ans)}$?`,
          'да: справа $x^2$, оно положительно и при отрицательном $x$',
          [
            'нет: корень не может равняться отрицательному числу',
            'нет: подкоренное выражение отрицательно',
          ],
        ),
        hintOtbor('menshiy', `$${d(ans)}$`, [
          `$${d(smax)}$`,
          kvadrat ? `$${d(tmax)}$` : `$${d(-(ks[0] as number))}$`,
        ]),
      ],
    };
  },
};

/* ── √(k·x) = c·x, c — смешанное число: корень x = 0 ───────────── */

/** Смешанное число w n/m: целая часть, числитель, знаменатель и N = wm + n. */
function smeshannoe(p: Params): { w: number; n: number; m: number; N: number } {
  const w = num(p, 'w');
  const n = num(p, 'n');
  const m = num(p, 'm');
  if (!(w >= 1 && n > 0 && n < m)) throw new Error(`смешанное число ${w} ${n}/${m}`);
  return { w, n, m, N: w * m + n };
}

function uravnenieLinKoren(p: Params): string {
  const { w, n, m } = smeshannoe(p);
  return `\\sqrt{${d(num(p, 'k'))}x}=${d(w)}\\dfrac{${d(n)}}{${d(m)}}x`;
}

/**
 * √(kx) = (w n/m)·x, больший корень. После возведения в квадрат
 * x·(c²x − k) = 0: корни 0 и k/c². Подвох — x = 0 тоже корень (его
 * теряют делением на x), а спрашивают больший — ненулевой.
 */
export const PV7_KOREN_LINEYNYY: Prototype = {
  id: 'PV7-KOREN-LINEYNYY',
  no: 106,
  group: 'II',
  title: 'Корень из $kx$ равен $cx$ со смешанным числом: корень $x=0$',
  formula: '\\sqrt{kx}=w\\dfrac{n}{m}\\,x',
  skills: ['korni', 'proporciya'],
  fipiNos: '',
  uravnenie: uravnenieLinKoren,
  uslovie(p) {
    return uslovieTekst(uravnenieLinKoren(p), 'bolshiy');
  },
  vopros: () => 'bolshiy',
  chisla(p) {
    const k = num(p, 'k');
    const { m, N } = smeshannoe(p);
    return {
      lhs: (x) => Math.sqrt(k * x),
      rhs: (x) => (N / m) * x,
      odz: (x) => k * x >= 0 && x >= 0,
    };
  },
  solve(p) {
    const k = num(p, 'k');
    const { w, n, m, N } = smeshannoe(p);
    const c = q(N, m);
    const x = div(q(k), mul(c, c));
    if (!konechnaya(x)) throw new Error(`PV7-KOREN-LINEYNYY: x = ${t(x)} — бесконечная дробь`);
    const ans = val(x);
    /* √(k·x) = k·m/N — значение обеих частей в корне. */
    const znach = q(k * m, N);
    const ct = `\\dfrac{${d(N)}}{${d(m)}}`;
    const c2t = `\\dfrac{${d(N * N)}}{${d(m * m)}}`;
    return {
      answer: ans,
      uravnenie: uravnenieLinKoren(p),
      korni: [0, ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          'Корень равен выражению с $x$. Корень неотрицателен, значит, и правая часть должна быть неотрицательной: $x\\ge0$. План: смешанное число — в неправильную дробь, возвести обе части в квадрат, вынести $x$ за скобки.',
        ],
        odz: [`$${d(k)}x\\ge0$ и $${ct}x\\ge0$ — оба условия дают $x\\ge0$.`],
        preobr: [
          `$${d(w)}\\dfrac{${d(n)}}{${d(m)}}=\\dfrac{${d(w)}\\cdot${d(m)}+${d(n)}}{${d(m)}}=${ct}$.`,
          `Возводим в квадрат: $${d(k)}x=${c2t}x^2$.`,
          `Переносим всё в одну часть и выносим $x$: $x\\left(${c2t}x-${d(k)}\\right)=0$. Делить на $x$ нельзя — потеряется корень $x=0$.`,
        ],
        korni: [
          `$x=0$ или $${c2t}x=${d(k)}$, откуда $x=\\dfrac{${d(k)}\\cdot${d(m * m)}}{${d(N * N)}}=${t(x)}$.`,
        ],
        otbor: [
          'Оба корня неотрицательны — оба подходят: при $x=0$ обе части равны нулю.',
          `Больший — $${t(x)}$.`,
        ],
        proverka: [
          `$\\sqrt{${d(k)}\\cdot${t(x)}}=\\sqrt{${t(mul(q(k), x))}}=${t(znach)}$, а $${ct}\\cdot${t(x)}=${t(znach)}$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: vychDelenie(q(k * m * m), q(N * N)),
      hints: [
        hint(`Как записать $${d(w)}\\dfrac{${d(n)}}{${d(m)}}$ дробью?`, `$${ct}$`, [
          `$\\dfrac{${d(w + n)}}{${d(m)}}$`,
          `$\\dfrac{${d(n)}}{${d(w * m)}}$`,
        ]),
        hint(
          'Сколько корней у уравнения после возведения в квадрат?',
          'два: $x=0$ и ещё один',
          ['один', 'ни одного'],
          `$${d(k)}x=${c2t}x^2\\iff x\\left(${c2t}x-${d(k)}\\right)=0$.`,
        ),
        hintOtbor('bolshiy', `$${t(x)}$`, ['$0$', `$${t(znach)}$`]),
      ],
    };
  },
};

/* ── (aˢ)^(kx + b) = (aʳ)^(mx + c): степени одного основания ─────── */

/** Основание aˢ и показатель kx + b одной части уравнения. */
function chast(p: Params, s: 's' | 'r', k: 'k' | 'm', b: 'b' | 'c', por: 'por1' | 'por2') {
  const a = num(p, 'a');
  return {
    st: num(p, s),
    osn: a ** num(p, s),
    k: num(p, k),
    b: num(p, b),
    E: lin(num(p, k), num(p, b), 'x', (p[por] ?? 'xb') as Poryadok),
  };
}

function uravneniePokaz(p: Params): string {
  const L = chast(p, 's', 'k', 'b', 'por1');
  const R = chast(p, 'r', 'm', 'c', 'por2');
  return `${pw(d(L.osn), L.E)}=${pw(d(R.osn), R.E)}`;
}

/**
 * (aˢ)^(kx + b) = (aʳ)^(mx + c): основания — разные степени одного
 * числа a (16 и 2, 2 и 64). Подвох — привести обе части к a и
 * умножить каждый показатель на свою степень, а не приравнять
 * показатели сразу.
 */
export const PV7_POKAZATELNOE: Prototype = {
  id: 'PV7-POKAZATELNOE',
  no: 107,
  group: 'III',
  title: 'Показательное: основания — разные степени одного числа',
  formula: '\\left(a^s\\right)^{kx+b}=\\left(a^r\\right)^{mx+c}',
  skills: ['stepeni', 'perenos'],
  fipiNos: '',
  uravnenie: uravneniePokaz,
  uslovie(p) {
    return uslovieTekst(uravneniePokaz(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const L = chast(p, 's', 'k', 'b', 'por1');
    const R = chast(p, 'r', 'm', 'c', 'por2');
    /* Сравниваем логарифмы частей: сами степени бывают огромными. */
    return {
      lhs: (x) => (L.k * x + L.b) * Math.log(L.osn),
      rhs: (x) => (R.k * x + R.b) * Math.log(R.osn),
      odz: () => true,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const L = chast(p, 's', 'k', 'b', 'por1');
    const R = chast(p, 'r', 'm', 'c', 'por2');
    /* s(kx + b) = r(mx + c)  ⇒  (sk − rm)x = rc − sb. */
    const K = L.st * L.k - R.st * R.k;
    const B = R.st * R.b - L.st * L.b;
    if (K === 0) throw new Error('PV7-POKAZATELNOE: коэффициент при x равен нулю');
    const x = q(B, K);
    if (!konechnaya(x)) throw new Error(`PV7-POKAZATELNOE: ${B}/${K} — бесконечная дробь`);
    const ans = val(x);
    const A = d(a);
    /* s·(kx + b): одночлен — без скобок («6x», «4·2x»). */
    const vid = (st: number, E: string) =>
      st === 1
        ? E
        : E === 'x'
          ? `${d(st)}x`
          : /^-?\d*x$/.test(E)
            ? `${d(st)}\\cdot ${E}`
            : `${d(st)}(${E})`;
    const levyy = vid(L.st, L.E);
    const pravyy = vid(R.st, R.E);
    const raskr = (st: number, k: number, b: number) => lin(st * k, st * b);
    const osnTex = (st: number, osn: number) =>
      st === 1 ? `$${A}$ — уже нужное основание` : `$${d(osn)}=${pw(A, String(st))}$`;
    return {
      answer: ans,
      uravnenie: uravneniePokaz(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          `Показательное уравнение. Основания $${d(L.osn)}$ и $${d(R.osn)}$ — степени числа $${A}$. План: записать обе части степенями $${A}$ и приравнять показатели.`,
        ],
        preobr: [
          `Слева: ${osnTex(L.st, L.osn)}, поэтому левая часть равна $${pw(A, levyy)}$.`,
          `Справа: ${osnTex(R.st, R.osn)}, поэтому правая часть равна $${pw(A, pravyy)}$.`,
          `Основания равны — приравниваем показатели: $${levyy}=${pravyy}$, то есть $${raskr(L.st, L.k, L.b)}=${raskr(R.st, R.k, R.b)}$.`,
          `Переносим: $${lin(K, 0)}=${d(B)}$, $x=${t(x)}$.`,
        ],
        korni: [`$x=${t(x)}$ — единственный корень (показательная функция монотонна).`],
        proverka: [
          `При $x=${t(x)}$ показатели степеней $${A}$ слева и справа равны $${t(mul(q(L.st), sub(mul(q(L.k), x), q(-L.b))))}$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: [],
      hints: [
        hint(
          'К какому основанию привести обе части?',
          `$${A}$`,
          [`$${d(Math.max(L.osn, R.osn))}$`, '$10$'],
          `$${d(L.osn)}$ и $${d(R.osn)}$ — степени числа $${A}$.`,
        ),
        hint('Какое уравнение для показателей получится?', `$${levyy}=${pravyy}$`, [
          `$${L.E}=${R.E}$`,
          `$${vid(R.st, L.E)}=${vid(L.st, R.E)}$`,
        ]),
        hint('Чему равен $x$?', `$${t(x)}$`, ryadom(x)),
      ],
    };
  },
};

/* ── 1 + log_a(px + q) = 2·log_a(x + e): квадратное и ОДЗ ───────── */

function uravnenieLogKv(p: Params): string {
  const a = num(p, 'a');
  const L = logTex(a);
  const odin = `1+${L}(${lin(num(p, 'p'), num(p, 'q'))})`;
  const dva = `2${L}(${lin(1, num(p, 'e'))})`;
  return num(p, 'sleva') === 1 ? `${odin}=${dva}` : `${dva}=${odin}`;
}

/** Корни (x + e)² = a(px + q) по возрастанию. */
function korniLogKv(p: Params): number[] {
  const a = num(p, 'a');
  const e = num(p, 'e');
  /* x² + (2e − ap)x + e² − aq = 0. */
  const B = 2 * e - a * num(p, 'p');
  const C = e * e - a * num(p, 'q');
  const D = B * B - 4 * C;
  const s = Math.round(Math.sqrt(D));
  if (D < 0 || s * s !== D) throw new Error(`PV7-LOG-KVADRATNOE: D = ${D} — не квадрат`);
  return [(-B - s) / 2, (-B + s) / 2];
}

/**
 * 1 + log_a(px + q) = 2·log_a(x + e): единица — это log_a a, двойка —
 * показатель квадрата. Подвох — квадратное уравнение даёт два корня, а
 * ОДЗ x + e > 0 оставляет один; «меньший из корней» — оставшийся.
 */
export const PV7_LOG_KVADRATNOE: Prototype = {
  id: 'PV7-LOG-KVADRATNOE',
  no: 108,
  group: 'IV',
  title: 'Единица и удвоенный логарифм: квадратное уравнение и ОДЗ',
  formula: '1+\\log_a(px+q)=2\\log_a(x+e)',
  skills: ['log-svoystva', 'log-opredelenie', 'diskriminant'],
  fipiNos: '',
  uravnenie: uravnenieLogKv,
  uslovie(p) {
    return uslovieTekst(uravnenieLogKv(p), 'menshiy');
  },
  vopros: () => 'menshiy',
  chisla(p) {
    const a = num(p, 'a');
    const pp = num(p, 'p');
    const qq = num(p, 'q');
    const e = num(p, 'e');
    const ln = (x: number) => Math.log(x) / Math.log(a);
    return {
      lhs: (x) => 1 + ln(pp * x + qq),
      rhs: (x) => 2 * ln(x + e),
      odz: (x) => pp * x + qq > 0 && x + e > 0,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const pp = num(p, 'p');
    const qq = num(p, 'q');
    const e = num(p, 'e');
    const L = logTex(a);
    const [x1, x2] = korniLogKv(p) as [number, number];
    const ok = (x: number) => pp * x + qq > 0 && x + e > 0;
    const goden = [x1, x2].filter(ok);
    const plohie = [x1, x2].filter((x) => !ok(x));
    if (goden.length === 0) throw new Error('PV7-LOG-KVADRATNOE: корней нет');
    const ans = Math.min(...goden);
    const PX = lin(pp, qq);
    const XE = lin(1, e);
    const B = 2 * e - a * pp;
    const C = e * e - a * qq;
    const podst = (x: number) => d(x + e);
    return {
      answer: ans,
      uravnenie: uravnenieLogKv(p),
      korni: [x1, x2],
      postoronnie: plohie,
      etapy: razbor({
        plan: [
          `Запишем обе части логарифмами по основанию $${d(a)}$: $1=${L}${d(a)}$, а $2${L}(${XE})=${L}(${XE})^2$ при $${XE}>0$. Затем приравняем выражения под логарифмами и отберём корни по ОДЗ.`,
        ],
        odz: [`$${PX}>0$ и $${XE}>0$.`],
        preobr: [
          `$1+${L}(${PX})=${L}\\big(${d(a)}(${PX})\\big)$, поэтому $${d(a)}(${PX})=(${XE})^2$.`,
          `$${lin(a * pp, a * qq)}=x^2${e < 0 ? '-' : '+'}${d(Math.abs(2 * e))}x+${d(e * e)}$, то есть $x^2${B < 0 ? '-' : '+'}${d(Math.abs(B))}x${C < 0 ? '-' : '+'}${d(Math.abs(C))}=0$.`,
          `$D=${d(B * B - 4 * C)}$, корни $x=${d(x1)}$ и $x=${d(x2)}$.`,
        ],
        korni: [`$x=${d(x1)}$ или $x=${d(x2)}$.`],
        otbor: [
          ...[x1, x2].map((x) =>
            ok(x)
              ? `$x=${d(x)}$: $${XE}=${podst(x)}>0$ и $${PX}=${d(pp * x + qq)}>0$ — подходит.`
              : `$x=${d(x)}$: $${XE}=${podst(x)}${x + e === 0 ? '' : '<0'}$ — не входит в ОДЗ, корень посторонний.`,
          ),
          goden.length === 1
            ? 'Корень один — он и есть ответ.'
            : 'Оба корня подходят, записываем меньший.',
        ],
        proverka: [
          `$1+${L}${d(pp * ans + qq)}=${L}${d(a * (pp * ans + qq))}$ и $2${L}${podst(ans)}=${L}${d((ans + e) ** 2)}$ — равны.`,
        ],
        answer: ans,
      }),
      vychisleniya: [],
      hints: [
        hint(
          `Каким логарифмом записать $1$?`,
          `$${L}${d(a)}$`,
          [`$${L}1$`, `$${L}10$`],
          `$${L}${d(a)}=1$, а сумма логарифмов — логарифм произведения.`,
        ),
        hint('Какое уравнение получится без логарифмов?', `$${d(a)}(${PX})=(${XE})^2$`, [
          `$${PX}=2(${XE})$`,
          `$1+${PX}=(${XE})^2$`,
        ]),
        hintOtbor(
          'menshiy',
          `$${d(ans)}$`,
          [x1, x2].filter((x) => x !== ans).map((x) => `$${d(x)}$`),
          plohie.length > 0
            ? `При $x=${d(plohie[0] as number)}$ выражение $${XE}$ не положительно — корень посторонний.`
            : undefined,
        ),
      ],
    };
  },
};

/* ── √(b − x) = x + c: посторонний корень после возведения в квадрат ── */

function uravnenieKorenMinus(p: Params): string {
  const b = num(p, 'b');
  const c = num(p, 'c');
  const pod = b === 0 ? '-x' : `${d(b)}-x`;
  return `\\sqrt{${pod}}=x${c < 0 ? '-' : '+'}${d(Math.abs(c))}`;
}

/** Корни x² + (2c + 1)x + (c² − b) = 0 по возрастанию (целые) или null. */
function korniMinus(p: Params): [number, number] | null {
  const b = num(p, 'b');
  const c = num(p, 'c');
  const B = 2 * c + 1;
  const C = c * c - b;
  const D = B * B - 4 * C;
  const s = korenN(D, 2);
  if (D <= 0 || s === null) return null;
  return [(-B - s) / 2, (-B + s) / 2];
}

/**
 * √(b − x) = x + c, «если корней больше одного — меньший». После
 * возведения в квадрат — квадратное уравнение с двумя корнями, но один
 * из них посторонний: при нём правая часть x + c отрицательна. Подвох —
 * записать в ответ меньший корень квадратного уравнения, не проверив.
 */
export const PV7_KOREN_POSTORONNIY: Prototype = {
  id: 'PV7-KOREN-POSTORONNIY',
  no: 109,
  group: 'II',
  title: 'Корень из $b-x$ равен $x+c$: посторонний корень',
  formula: '\\sqrt{b-x}=x+c',
  skills: ['korni', 'diskriminant'],
  fipiNos: '',
  uravnenie: uravnenieKorenMinus,
  uslovie(p) {
    return uslovieTekst(uravnenieKorenMinus(p), 'menshiy');
  },
  vopros: () => 'menshiy',
  chisla(p) {
    const b = num(p, 'b');
    const c = num(p, 'c');
    return {
      lhs: (x) => Math.sqrt(b - x),
      rhs: (x) => x + c,
      odz: (x) => b - x >= 0,
    };
  },
  solve(p) {
    const b = num(p, 'b');
    const c = num(p, 'c');
    const kr = korniMinus(p);
    if (kr === null) throw new Error(`PV7-KOREN-POSTORONNIY: корни не целые ${JSON.stringify(p)}`);
    const [x1, x2] = kr;
    const goden = (x: number) => x + c >= 0 && b - x >= 0;
    const vse = [x1, x2].filter(goden);
    if (vse.length !== 1) throw new Error(`PV7-KOREN-POSTORONNIY: подходящих корней ${vse.length}`);
    const ans = vse[0] as number;
    const lishniy = ans === x1 ? x2 : x1;
    const B = 2 * c + 1;
    const C = c * c - b;
    const kv = `x^2${B < 0 ? '-' : '+'}${Math.abs(B) === 1 ? '' : d(Math.abs(B))}x${C < 0 ? '-' : '+'}${d(Math.abs(C))}=0`;
    const prav = (x: number) => `${d(x)}${c < 0 ? '-' : '+'}${d(Math.abs(c))}`;
    return {
      answer: ans,
      uravnenie: uravnenieKorenMinus(p),
      korni: [ans],
      postoronnie: [lishniy],
      etapy: razbor({
        plan: [
          'Слева арифметический корень — он неотрицателен. Возводим в квадрат, решаем квадратное уравнение, а потом проверяем корни: правая часть тоже должна быть неотрицательной.',
        ],
        odz: [
          `Нужно $${b === 0 ? '-x' : `${d(b)}-x`}\\ge0$ и $x${c < 0 ? '-' : '+'}${d(Math.abs(c))}\\ge0$, то есть $${d(-c)}\\le x\\le ${d(b)}$.`,
        ],
        preobr: [
          `Возводим в квадрат: $${b === 0 ? '-x' : `${d(b)}-x`}=\\left(x${c < 0 ? '-' : '+'}${d(Math.abs(c))}\\right)^2$.`,
          `Раскрываем скобки и переносим: $${kv}$.`,
        ],
        korni: [`Корни квадратного уравнения: $x=${d(x1)}$ и $x=${d(x2)}$.`],
        otbor: [
          `При $x=${d(lishniy)}$ правая часть $${prav(lishniy)}=${d(lishniy + c)}<0$ — корень посторонний.`,
          `При $x=${d(ans)}$ правая часть $${prav(ans)}=${d(ans + c)}\\ge0$ — подходит. Корень один, он и в ответе.`,
        ],
        proverka: [`$\\sqrt{${d(b - ans)}}=${d(ans + c)}$ — верно.`],
        answer: ans,
      }),
      vychisleniya: [
        {
          tekst: 'Корни проверяем по теореме Виета.',
          tex: `${d(x1)}+${d(x2)}=${d(-B)},\\quad ${d(x1)}\\cdot${d(x2)}=${d(C)}`,
        },
      ],
      hints: [
        hint('Какое уравнение получится после возведения в квадрат?', `$${kv}$`, [
          `$x^2${B < 0 ? '+' : '-'}${Math.abs(B) === 1 ? '' : d(Math.abs(B))}x${C < 0 ? '-' : '+'}${d(Math.abs(C))}=0$`,
          `$x^2+${d(c * c + b)}=0$`,
        ]),
        hint(`Подходит ли корень $x=${d(lishniy)}$?`, 'нет: правая часть при нём отрицательна', [
          'да: он меньше, его и записываем',
          'да: после возведения в квадрат равенство верно',
        ]),
        hintOtbor('menshiy', `$${d(ans)}$`, [`$${d(lishniy)}$`]),
      ],
    };
  },
};

/* ── (c − x²)ⁿ = d: корень n-й степени и знак ──────────────────── */

function uravnenieStepenKv(p: Params): string {
  const D = num(p, 'D');
  return `\\left(${d(num(p, 'c'))}-x^2\\right)^{${num(p, 'n')}}=${d(D)}`;
}

/** Значения t = c − x²: при нечётном n одно, при чётном ±корень. */
function znacheniyaT(p: Params): number[] {
  const n = num(p, 'n');
  const D = num(p, 'D');
  const r = korenN(Math.abs(D), n);
  if (r === null) throw new Error(`PV7-STEPEN-KVADRATA: ${D} — не степень ${n}`);
  if (n % 2 === 1) return [D < 0 ? -r : r];
  if (D <= 0) throw new Error('PV7-STEPEN-KVADRATA: чётная степень и D ≤ 0');
  return [r, -r];
}

/**
 * (c − x²)ⁿ = D, меньший корень. Подвох — при чётном n у числа два
 * корня n-й степени (±r), и одно из уравнений c − x² = ±r может не
 * иметь решений; при нечётном — знак D переходит в t. Меньший корень —
 * отрицательный.
 */
export const PV7_STEPEN_KVADRATA: Prototype = {
  id: 'PV7-STEPEN-KVADRATA',
  no: 110,
  group: 'I',
  title: 'Степень выражения с $x^2$: корень $n$-й степени и два знака',
  formula: '(c-x^2)^n=D',
  skills: ['stepeni', 'korni'],
  fipiNos: '',
  uravnenie: uravnenieStepenKv,
  uslovie(p) {
    return uslovieTekst(uravnenieStepenKv(p), 'menshiy');
  },
  vopros: () => 'menshiy',
  chisla(p) {
    const c = num(p, 'c');
    const n = num(p, 'n');
    return {
      lhs: (x) => (c - x * x) ** n,
      rhs: () => num(p, 'D'),
      odz: () => true,
    };
  },
  solve(p) {
    const c = num(p, 'c');
    const n = num(p, 'n');
    const D = num(p, 'D');
    const ts = znacheniyaT(p);
    const korni: number[] = [];
    const stroki: string[] = [];
    for (const tz of ts) {
      const x2 = c - tz;
      if (x2 < 0) {
        stroki.push(`$${d(c)}-x^2=${d(tz)}$: $x^2=${d(x2)}<0$ — решений нет.`);
        continue;
      }
      const s = korenN(x2, 2);
      if (s === null) throw new Error(`PV7-STEPEN-KVADRATA: x² = ${x2} — не квадрат`);
      if (s === 0) {
        korni.push(0);
        stroki.push(`$${d(c)}-x^2=${d(tz)}$: $x^2=0$, $x=0$.`);
      } else {
        korni.push(-s, s);
        stroki.push(`$${d(c)}-x^2=${d(tz)}$: $x^2=${d(x2)}$, $x=\\pm${d(s)}$.`);
      }
    }
    if (korni.length < 2) throw new Error('PV7-STEPEN-KVADRATA: меньше двух корней');
    const ans = Math.min(...korni);
    const r = Math.abs(ts[0] as number);
    return {
      answer: ans,
      uravnenie: uravnenieStepenKv(p),
      korni: [...korni].sort((a, b) => a - b),
      postoronnie: [],
      etapy: razbor({
        plan: [
          n % 2 === 1
            ? `Степень нечётная: у числа $${d(D)}$ ровно один корень ${n}-й степени, знак сохраняется. Находим $${d(c)}-x^2$, потом $x$.`
            : `Степень чётная: $t^{${n}}=${d(D)}$ даёт два значения $t=\\pm${d(r)}$. Каждое даёт своё уравнение для $x^2$.`,
        ],
        preobr: [
          n % 2 === 1
            ? `$${d(c)}-x^2=${d(ts[0] as number)}$, так как $(${d(ts[0] as number)})^{${n}}=${d(D)}$.`
            : `$${d(c)}-x^2=${d(r)}$ или $${d(c)}-x^2=${d(-r)}$, так как $(\\pm${d(r)})^{${n}}=${d(D)}$.`,
        ],
        korni: stroki,
        otbor: [`Меньший из корней — $${d(ans)}$.`],
        proverka: [
          `$\\left(${d(c)}-(${d(ans)})^2\\right)^{${n}}=(${d(c - ans * ans)})^{${n}}=${d(D)}$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: [],
      hints: [
        hint(
          `Чему может равняться $${d(c)}-x^2$?`,
          n % 2 === 1 ? `$${d(ts[0] as number)}$` : `$${d(r)}$ или $${d(-r)}$`,
          n % 2 === 1
            ? [`$${d(-(ts[0] as number))}$`, `$\\pm${d(r)}$`]
            : [`только $${d(r)}$`, `$${d(D)}$`],
          n % 2 === 1
            ? 'Нечётная степень сохраняет знак.'
            : 'У чётной степени два корня с разными знаками.',
        ),
        hintOtbor('menshiy', `$${d(ans)}$`, [`$${d(-ans)}$`, `$${d(c - ans * ans)}$`]),
      ],
    };
  },
};

/* ── Партия 5 (варианты 25–30) ──────────────────────────────────── */

/** √(A / (kx + b)) = c: условие. */
function uravnenieKorenDrob(p: Params): string {
  const E = lin(num(p, 'k'), num(p, 'b'), 'x', (p.por ?? 'xb') as Poryadok);
  return `\\sqrt{\\dfrac{${d(num(p, 'A'))}}{${E}}}=${d(num(p, 'c'))}`;
}

/**
 * √(A / (kx + b)) = c: возвести в квадрат, перевернуть дробь, решить
 * линейное. Подвох — c² десятичное (1,6² = 2,56), а знаменатель должен
 * остаться положительным; корень один, хотя условие спрашивает
 * «меньший из корней».
 */
export const PV7_KOREN_DROB: Prototype = {
  id: 'PV7-KOREN-DROB',
  no: 111,
  group: 'II',
  title: 'Корень из дроби с линейным знаменателем',
  formula: '\\sqrt{\\dfrac{A}{kx+b}}=c',
  skills: ['korni', 'perenos'],
  fipiNos: '',
  uravnenie: uravnenieKorenDrob,
  uslovie(p) {
    return uslovieTekst(uravnenieKorenDrob(p), voprosIz(p, ['koren', 'menshiy', 'bolshiy']));
  },
  vopros: (p) => voprosIz(p, ['koren', 'menshiy', 'bolshiy']),
  chisla(p) {
    const A = num(p, 'A');
    const k = num(p, 'k');
    const b = num(p, 'b');
    return {
      lhs: (x) => Math.sqrt(A / (k * x + b)),
      rhs: () => num(p, 'c'),
      odz: (x) => k * x + b > 0,
    };
  },
  solve(p) {
    const A = num(p, 'A');
    const k = num(p, 'k');
    const b = num(p, 'b');
    const c = num(p, 'c');
    const c2 = mul(q(c), q(c));
    const zn = div(q(A), c2);
    const x = div(sub(zn, q(b)), q(k));
    if (!konechnaya(x))
      throw new Error(`PV7-KOREN-DROB: корень — бесконечная дробь ${JSON.stringify(p)}`);
    const ans = val(x);
    const E = lin(k, b, 'x', (p.por ?? 'xb') as Poryadok);
    return {
      answer: ans,
      uravnenie: uravnenieKorenDrob(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          'Справа положительное число, обе части неотрицательны — возводим в квадрат. Под корнем дробь: знаменатель не может быть нулём и должен быть положителен.',
        ],
        preobr: [
          `$\\dfrac{${d(A)}}{${E}}=${d(c)}^2=${t(c2)}$.`,
          `Знаменатель равен частному: $${E}=\\dfrac{${d(A)}}{${t(c2)}}=${t(zn)}$.`,
          ...linReshenie(k, b, zn),
        ],
        korni: [`$x=${t(x)}$ — корень единственный: линейное уравнение.`],
        proverka: [
          `$${lin(k, 0)}+${d(b)}$ при $x=${t(x)}$ равно $${t(zn)}>0$, $\\dfrac{${d(A)}}{${t(zn)}}=${t(c2)}=${d(c)}^2$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: vychDelenie(q(A), c2),
      hints: [
        hint('Что сделать первым шагом?', 'Возвести обе части в квадрат', [
          'Умножить обе части на знаменатель',
          'Извлечь корень из числителя',
        ]),
        hint(`Чему равно $${d(c)}^2$?`, `$${t(c2)}$`, [`$${t(mul(q(c), q(2)))}$`, `$${t(q(c))}$`]),
        hint('Чему равен знаменатель дроби?', `$${t(zn)}$`, [
          `$${t(c2)}$`,
          `$${t(mul(q(A), c2))}$`,
        ]),
        hintOtbor(voprosIz(p, ['koren', 'menshiy', 'bolshiy']), `$${t(x)}$`, ryadom(x)),
      ],
    };
  },
};

/** log_a(px + q) = n·log_a(c): условие. */
function uravnenieLogMnozh(p: Params): string {
  const a = num(p, 'a');
  const n = num(p, 'n');
  const E = lin(num(p, 'k'), num(p, 'b'), 'x', (p.por ?? 'bx') as Poryadok);
  return `${logTex(a)}(${E})=${n === 1 ? '' : d(n)}${logTex(a)} ${d(num(p, 'c'))}`;
}

/**
 * logₐ(kx + b) = n·logₐ c: внести множитель под логарифм (c^n), затем
 * приравнять аргументы. Подвох — множитель n перед логарифмом — это
 * степень числа c, а не множитель аргумента: kx + b = cⁿ, не n·c.
 */
export const PV7_LOG_MNOZHITEL: Prototype = {
  id: 'PV7-LOG-MNOZHITEL',
  no: 112,
  group: 'IV',
  title: 'Логарифм с множителем справа: $\\log_a(kx+b)=n\\log_a c$',
  formula: '\\log_a(kx+b)=n\\log_a c',
  skills: ['log-svoystva', 'perenos'],
  fipiNos: '',
  uravnenie: uravnenieLogMnozh,
  uslovie(p) {
    return uslovieTekst(uravnenieLogMnozh(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const k = num(p, 'k');
    const b = num(p, 'b');
    return {
      lhs: (x) => Math.log(k * x + b),
      rhs: () => num(p, 'n') * Math.log(num(p, 'c')),
      odz: (x) => k * x + b > 0,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const k = num(p, 'k');
    const b = num(p, 'b');
    const n = num(p, 'n');
    const c = num(p, 'c');
    const C = c ** n;
    const x = div(q(C - b), q(k));
    if (!konechnaya(x))
      throw new Error(`PV7-LOG-MNOZHITEL: корень — бесконечная дробь ${JSON.stringify(p)}`);
    const ans = val(x);
    const E = lin(k, b, 'x', (p.por ?? 'bx') as Poryadok);
    const L = logTex(a);
    return {
      answer: ans,
      uravnenie: uravnenieLogMnozh(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          `Логарифмы по одному основанию $${d(a)}$. План: внести множитель $${d(n)}$ под логарифм справа и приравнять аргументы.`,
        ],
        odz: [`Аргумент логарифма положителен: $${E}>0$.`],
        preobr: [
          `$${d(n)}${L} ${d(c)}=${L} ${d(c)}^{${d(n)}}=${L} ${d(C)}$.`,
          `Основания равны — приравниваем аргументы: $${E}=${d(C)}$.`,
          ...linReshenie(k, b, q(C), (p.por ?? 'bx') as Poryadok),
        ],
        korni: [`$x=${t(x)}$.`],
        proverka: [
          `$${E}$ при $x=${t(x)}$ равно $${d(C)}>0$ — ОДЗ выполнена, и $${L} ${d(C)}=${d(n)}${L} ${d(c)}$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: [],
      hints: [
        hint(`Чему равно $${d(n)}${L} ${d(c)}$?`, `$${L} ${d(C)}$`, [
          `$${L} ${d(n * c)}$`,
          `$${L} ${d(c + n)}$`,
        ]),
        hint('Какое уравнение получится для аргументов?', `$${E}=${d(C)}$`, [
          `$${E}=${d(n * c)}$`,
          `$${E}=${d(c)}$`,
        ]),
        hint('Чему равен $x$?', `$${t(x)}$`, ryadom(x)),
      ],
    };
  },
};

/* ── Партия 6 (варианты 31–36) ──────────────────────────────────── */

/** Основание a^m в TeX: 0,2 вместо 1/5, если дробь конечная; иначе \frac{1}{a^|m|}. */
function osnovanieStepeni(a: number, m: number): string {
  if (m > 0) return d(a ** m);
  const v = div(q(1), q(a ** -m));
  return konechnaya(v) ? t(v) : `\\frac{1}{${d(a ** -m)}}`;
}

function logPo(osn: string): string {
  return osn.length === 1 ? `\\log_${osn}` : `\\log_{${osn}}`;
}

function uravnenieTozhdestvo(p: Params): string {
  const a = num(p, 'a');
  const k = num(p, 'k');
  const E = lin(num(p, 'kx'), num(p, 'b'), 'x', (p.por ?? 'xb') as Poryadok);
  return `${d(a)}^{${logPo(d(a ** k))}(${E})}=${d(num(p, 'D'))}`;
}

/**
 * a^(log_{a^k}(kx·x + b)) = D: основание логарифма — степень основания
 * степени. Подвох — тождество a^{logₐ E} = E здесь напрямую не
 * работает: log_{a^k} E = (1/k)·logₐ E, и слева стоит E^{1/k}, а не E;
 * отсюда kx·x + b = D^k, а не D.
 */
export const PV7_TOZHDESTVO_STEPEN: Prototype = {
  id: 'PV7-TOZHDESTVO-STEPEN',
  no: 113,
  group: 'IV',
  title: 'Основное тождество, основание логарифма — степень: $a^{\\log_{a^k} E}=D$',
  formula: 'a^{\\log_{a^k}(bx+c)}=D',
  skills: ['log-svoystva', 'log-opredelenie'],
  fipiNos: '',
  uravnenie: uravnenieTozhdestvo,
  uslovie(p) {
    return uslovieTekst(uravnenieTozhdestvo(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const a = num(p, 'a');
    const k = num(p, 'k');
    const kx = num(p, 'kx');
    const b = num(p, 'b');
    return {
      lhs: (x) => a ** (Math.log(kx * x + b) / Math.log(a ** k)),
      rhs: () => num(p, 'D'),
      odz: (x) => kx * x + b > 0,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const k = num(p, 'k');
    const kx = num(p, 'kx');
    const b = num(p, 'b');
    const D = num(p, 'D');
    const Dk = D ** k;
    const x = div(q(Dk - b), q(kx));
    if (!konechnaya(x))
      throw new Error(`PV7-TOZHDESTVO-STEPEN: корень — бесконечная дробь ${JSON.stringify(p)}`);
    const ans = val(x);
    const por = (p.por ?? 'xb') as Poryadok;
    const E = lin(kx, b, 'x', por);
    const ak = d(a ** k);
    const koren = k === 2 ? '\\sqrt' : `\\sqrt[${k}]`;
    return {
      answer: ans,
      uravnenie: uravnenieTozhdestvo(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          `Основание логарифма $${ak}=${d(a)}^{${k}}$ — степень числа $${d(a)}$. Перейдём к логарифму по основанию $${d(a)}$ и применим основное логарифмическое тождество.`,
        ],
        odz: [`Аргумент логарифма положителен: $${E}>0$.`],
        preobr: [
          `$${logPo(ak)}(${E})=\\dfrac{1}{${k}}\\log_{${d(a)}}(${E})$, поэтому левая часть равна $${d(a)}^{\\frac{1}{${k}}\\log_{${d(a)}}(${E})}=(${E})^{\\frac{1}{${k}}}=${koren}{${E}}$.`,
          `$${koren}{${E}}=${d(D)}$, значит $${E}=${d(D)}^{${k}}=${d(Dk)}$.`,
          ...linReshenie(kx, b, q(Dk), por),
        ],
        korni: [`$x=${t(x)}$.`],
        proverka: [
          `При $x=${t(x)}$: $${E}=${d(Dk)}>0$, $${logPo(ak)}${d(Dk)}=\\dfrac{1}{${k}}\\log_{${d(a)}}${d(Dk)}$ и $${d(a)}^{\\frac{1}{${k}}\\log_{${d(a)}}${d(Dk)}}=${koren}{${d(Dk)}}=${d(D)}$ — верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: [],
      hints: [
        hint(
          `Чему равно $${logPo(ak)}(${E})$ через логарифм по основанию $${d(a)}$?`,
          `$\\dfrac{1}{${k}}\\log_{${d(a)}}(${E})$`,
          [`$${k}\\log_{${d(a)}}(${E})$`, `$\\log_{${d(a)}}(${E})$`],
        ),
        hint('Какое уравнение получится для выражения под логарифмом?', `$${E}=${d(Dk)}$`, [
          `$${E}=${d(D)}$`,
          `$${E}=${d(D * k)}$`,
        ]),
        hint('Чему равен $x$?', `$${t(x)}$`, ryadom(x)),
      ],
    };
  },
};

function uravnenieLogOsn(p: Params): string {
  const a = num(p, 'a');
  const m = num(p, 'm');
  const F = lin(num(p, 'k1'), num(p, 'b1'));
  const G = lin(num(p, 'k2'), num(p, 'b2'));
  return `${logTex(a)}(${F})=${logPo(osnovanieStepeni(a, m))}(${G})`;
}

/** Корни A x² + B x + C = 0, где F^m = G (m = −1 или 2), по возрастанию, или null. */
function korniLogOsn(p: Params): { A: number; B: number; C: number; korni: number[] } | null {
  const m = num(p, 'm');
  const k1 = num(p, 'k1');
  const b1 = num(p, 'b1');
  const k2 = num(p, 'k2');
  const b2 = num(p, 'b2');
  const [A, B, C] =
    m === -1
      ? [k1 * k2, k1 * b2 + k2 * b1, b1 * b2 - 1]
      : [k1 * k1, 2 * k1 * b1 - k2, b1 * b1 - b2];
  const Dis = B * B - 4 * A * C;
  if (Dis <= 0) return null;
  const s = Math.sqrt(Dis);
  if (!Number.isInteger(s)) return null;
  const x1 = val(div(q(-B - s), q(2 * A)));
  const x2 = val(div(q(-B + s), q(2 * A)));
  return { A, B, C, korni: [Math.min(x1, x2), Math.max(x1, x2)] };
}

/**
 * logₐ F = log_{a^m} G при m = −1 (основание 1/a) или m = 2 (a²):
 * переходим к основанию a — m·logₐ F = logₐ G, то есть F^m = G.
 * Подвох — квадратное уравнение даёт два корня, ОДЗ (F > 0 и G > 0)
 * оставляет один; «меньший из корней» — оставшийся, а не меньший корень
 * квадратного уравнения.
 */
export const PV7_LOG_OSNOVANIYA: Prototype = {
  id: 'PV7-LOG-OSNOVANIYA',
  no: 114,
  group: 'IV',
  title: 'Логарифмы по основаниям $a$ и $\\frac1a$ (или $a^2$): квадратное уравнение и ОДЗ',
  formula: '\\log_a F=\\log_{a^m} G',
  skills: ['log-svoystva', 'log-opredelenie', 'diskriminant'],
  fipiNos: '',
  uravnenie: uravnenieLogOsn,
  uslovie(p) {
    return uslovieTekst(uravnenieLogOsn(p), 'menshiy');
  },
  vopros: () => 'menshiy',
  chisla(p) {
    const a = num(p, 'a');
    const m = num(p, 'm');
    const f = (x: number) => num(p, 'k1') * x + num(p, 'b1');
    const g = (x: number) => num(p, 'k2') * x + num(p, 'b2');
    return {
      lhs: (x) => Math.log(f(x)) / Math.log(a),
      rhs: (x) => Math.log(g(x)) / Math.log(a ** m),
      odz: (x) => f(x) > 0 && g(x) > 0,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const m = num(p, 'm');
    const k1 = num(p, 'k1');
    const b1 = num(p, 'b1');
    const k2 = num(p, 'k2');
    const b2 = num(p, 'b2');
    const r = korniLogOsn(p);
    if (r === null)
      throw new Error(`PV7-LOG-OSNOVANIYA: нет двух рациональных корней ${JSON.stringify(p)}`);
    const { A, B, C, korni } = r;
    const [x1, x2] = korni as [number, number];
    const F = lin(k1, b1);
    const G = lin(k2, b2);
    const ok = (x: number) => k1 * x + b1 > 0 && k2 * x + b2 > 0;
    const goden = korni.filter(ok);
    const plohie = korni.filter((x) => !ok(x));
    if (goden.length !== 1)
      throw new Error('PV7-LOG-OSNOVANIYA: в ОДЗ должен остаться один корень');
    const ans = goden[0] as number;
    if (!konechnaya(q(Math.round(ans * 1e6), 1e6)))
      throw new Error('PV7-LOG-OSNOVANIYA: корень не конечная дробь');
    const osn = osnovanieStepeni(a, m);
    const L = logTex(a);
    const per =
      m === -1
        ? `$${logPo(osn)}(${G})=-${L}(${G})$, так как $${osn}=${d(a)}^{-1}$. Уравнение: $${L}(${F})=-${L}(${G})$, то есть $${L}(${F})+${L}(${G})=0$ и $(${F})(${G})=1$.`
        : `$${logPo(osn)}(${G})=\\dfrac12${L}(${G})$, так как $${osn}=${d(a)}^{2}$. Уравнение: $2${L}(${F})=${L}(${G})$, то есть $(${F})^2=${G}$.`;
    const kvTex = `${A === 1 ? '' : d(A)}x^2${B === 0 ? '' : B < 0 ? `-${Math.abs(B) === 1 ? '' : d(-B)}x` : `+${B === 1 ? '' : d(B)}x`}${C === 0 ? '' : C < 0 ? d(C) : `+${d(C)}`}=0`;
    const podst = (x: number) => `$${F}=${d(k1 * x + b1)}$, $${G}=${d(k2 * x + b2)}$`;
    return {
      answer: ans,
      uravnenie: uravnenieLogOsn(p),
      korni,
      postoronnie: plohie,
      etapy: razbor({
        plan: [
          `Основание $${osn}$ — степень числа $${d(a)}$. Перейдём к одному основанию $${d(a)}$, уберём логарифмы и отберём корни по ОДЗ.`,
        ],
        odz: [`$${F}>0$ и $${G}>0$.`],
        preobr: [
          per,
          `Раскрываем скобки: $${kvTex}$.`,
          `$D=${d(B * B - 4 * A * C)}$, корни $x=${d(x1)}$ и $x=${d(x2)}$.`,
        ],
        korni: [`$x=${d(x1)}$ или $x=${d(x2)}$.`],
        otbor: [
          ...korni.map((x) =>
            ok(x)
              ? `$x=${d(x)}$: ${podst(x)} — оба положительны, подходит.`
              : `$x=${d(x)}$: ${podst(x)} — не входит в ОДЗ, корень посторонний.`,
          ),
          'Подходит один корень — он и есть ответ.',
        ],
        proverka: [
          m === -1
            ? `При $x=${d(ans)}$: $${L}${d(k1 * ans + b1)}$ и $${logPo(osn)}${d(k2 * ans + b2)}=-${L}${d(k2 * ans + b2)}$ — равны, потому что $${d(k1 * ans + b1)}\\cdot${d(k2 * ans + b2)}=1$.`
            : `При $x=${d(ans)}$: $(${d(k1 * ans + b1)})^2=${d((k1 * ans + b1) ** 2)}=${d(k2 * ans + b2)}$ — равенство верно.`,
        ],
        answer: ans,
      }),
      vychisleniya: [],
      hints: [
        hint(
          `Чему равен $${logPo(osn)}(${G})$ через логарифм по основанию $${d(a)}$?`,
          m === -1 ? `$-${L}(${G})$` : `$\\dfrac12${L}(${G})$`,
          m === -1
            ? [`$${L}(${G})$`, `$\\dfrac{1}{${L}(${G})}$`]
            : [`$2${L}(${G})$`, `$${L}(${G})$`],
        ),
        hint(
          'Какое уравнение получится без логарифмов?',
          m === -1 ? `$(${F})(${G})=1$` : `$(${F})^2=${G}$`,
          [`$${F}=${G}$`, m === -1 ? `$(${F})(${G})=-1$` : `$${F}=(${G})^2$`],
        ),
        hintOtbor(
          'menshiy',
          `$${d(ans)}$`,
          korni.filter((x) => x !== ans).map((x) => `$${d(x)}$`),
          plohie.length > 0
            ? `При $x=${d(plohie[0] as number)}$ выражение под логарифмом не положительно — корень посторонний.`
            : undefined,
        ),
      ],
    };
  },
};
