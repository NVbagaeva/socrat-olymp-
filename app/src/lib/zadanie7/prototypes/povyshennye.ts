/**
 * Прототипы раздела «Варианты повышенной сложности» для задания №7.
 * В общий реестр PROTOTYPES не входят — в банк, тренажёр и генератор
 * №7 не попадают. Устроены как прототипы группы III: разбор по тем же
 * этапам (`razbor`), подсказки — `hint`, проверка — подстановкой.
 */

import {
  d,
  hint,
  hintOtbor,
  lin,
  linKoren,
  linReshenie,
  mul,
  num,
  pw,
  q,
  razbor,
  sub,
  t,
  uslovieTekst,
  val,
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
