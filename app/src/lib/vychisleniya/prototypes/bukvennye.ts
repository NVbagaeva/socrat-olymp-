/**
 * Группа V, буквенные выражения: 8.W, 8.X, 8.Y, 8.Z.
 *
 * Условие «Найдите значение выражения … при a = …, b = …». Значения
 * подбираются так, чтобы после упрощения ответ получался в одно
 * действие; генератор проверяет знаменатели, подкоренные и
 * основания логарифмов.
 *
 * Решение всегда в одном порядке: сначала упрощаем выражение с
 * буквами и говорим, что с чем сокращается, и только потом
 * подставляем числа — отдельным шагом, назвав значения.
 */

import { nice, round9 } from '../numbers';
import type { Rng } from '../rng';
import { d, log, paren, pw } from '../tex';
import type { Draft, Prototype, Shag } from '../types';
import { naydiPri, podtip, shag } from './common';

/** Десятичное с одним знаком из [-4; 4] без нуля или целое из [-9; 9]. */
function value(r: Rng, decimal: boolean): number {
  for (let i = 0; i < 50; i += 1) {
    const x = decimal ? r.dec(-4, 4, 1) : r.int(-9, 9);
    if (x !== 0 && (!decimal || !Number.isInteger(x))) {
      return x;
    }
  }
  return decimal ? 1.5 : 2;
}

/** Коэффициент перед буквой: 1 → пусто. */
function k(c: number): string {
  return c === 1 ? '' : String(c);
}

function pri(a: number, b?: number): string {
  return b === undefined ? `a = ${d(a)}` : `a = ${d(a)},\\ b = ${d(b)}`;
}

/* ── Кирпичи решений ─────────────────────────────────────────── */

/** Выкладка цепочкой равенств; пустые и повторяющиеся подряд звенья выпадают. */
function cep(...parts: string[]): string {
  const out: string[] = [];
  for (const part of parts) {
    if (part !== '' && part !== out[out.length - 1]) out.push(part);
  }
  return out.join(' = ');
}

/** Значения букв для подписи: «$a = 3$, $b = -9$». */
function znach(a: number, b?: number): string {
  return b === undefined ? `$a = ${d(a)}$` : `$a = ${d(a)}$, $b = ${d(b)}$`;
}

/** c·x после подстановки: «5 \cdot (-3)»; при c = 1 — само число. */
function umn(c: number, x: number, first: boolean): string {
  if (c === 1) return first ? d(x) : paren(x);
  return `${c} \\cdot ${paren(x)}`;
}

/** u + v с раскрытым знаком: «15 + 18», «-0{,}4 - 3{,}5». */
function summa(u: number, v: number): string {
  return v < 0 ? `${d(u)} - ${d(-v)}` : `${d(u)} + ${d(v)}`;
}

/** Буква в степени: показатель 0 — буквы нет, 1 — без показателя. */
function mono(x: string, e: number): string {
  if (e === 0) return '';
  return e === 1 ? x : pw(x, String(e));
}

/** Число в степени после подстановки: 0{,}5^{2}; показатель 1 — само число. */
function chislo(v: number, e: number): string {
  return e === 1 ? d(v) : pw(d(v), String(e));
}

/** Одночлен из частей через пробел, без пустых. */
function vmeste(...parts: string[]): string {
  return parts.filter((p) => p !== '').join(' ');
}

/* ── 8.W  рациональные выражения ─────────────────────────────── */

/**
 * (p²a² − q²b²)/(pa ± qb): числитель — разность квадратов, дробь
 * сокращается на знаменатель, остаётся вторая скобка.
 */
function razborW1(
  p: number,
  q: number,
  a: number,
  b: number,
  minus: boolean,
  top: string,
  bottom: string,
  simplified: string,
  ans: number,
): Shag[] {
  const P = `${k(p)}a`;
  const Q = `${k(q)}b`;
  const kvadrat = (c: number, x: string) => (c === 1 ? `${x}^2` : `(${c}${x})^2`);
  const factored = `(${P} - ${Q})(${P} + ${Q})`;
  const zapis = [
    ...(p === 1 ? [] : [`$${p * p}a^2 = (${p}a)^2$`]),
    ...(q === 1 ? [] : [`$${q * q}b^2 = (${q}b)^2$`]),
  ];
  const u = round9(p * a);
  const v = round9(minus ? q * b : -q * b);
  return [
    shag(
      zapis.length === 0
        ? 'Числитель — разность квадратов: $x^2 - y^2 = (x - y)(x + y)$'
        : `Числитель — разность квадратов: ${zapis.join(', ')}, а $x^2 - y^2 = (x - y)(x + y)$`,
      cep(top, `${kvadrat(p, 'a')} - ${kvadrat(q, 'b')}`, factored),
    ),
    shag(
      `Одна из скобок совпадает со знаменателем — сокращаем дробь на $${bottom}$, и квадраты считать не нужно`,
      `\\dfrac{${factored}}{${bottom}} = ${simplified}`,
    ),
    shag(
      `Подставляем ${znach(a, b)} в упрощённое выражение`,
      cep(
        simplified,
        `${umn(p, a, true)} ${minus ? '+' : '-'} ${umn(q, b, false)}`,
        summa(u, v),
        d(ans),
      ),
    ),
  ];
}

function drawW1(r: Rng, decimal: boolean): Draft | null {
  const p = r.int(1, 5);
  const q = r.int(1, 5);
  const a = value(r, decimal);
  const b = value(r, decimal);
  const minus = r.int(0, 1) === 0;
  /* (p²a² − q²b²)/(pa + qb) = pa − qb; со знаком минус — pa + qb. */
  const den = minus ? p * a - q * b : p * a + q * b;
  const ans = round9(minus ? p * a + q * b : p * a - q * b);
  if (Math.abs(den) < 1e-9 || ans === 0 || !nice(ans, 2)) {
    return null;
  }
  const top = `${k(p * p)}a^2 - ${k(q * q)}b^2`;
  const bottom = `${k(p)}a ${minus ? '-' : '+'} ${k(q)}b`;
  const tex = `\\dfrac{${top}}{${bottom}}`;
  const simplified = `${k(p)}a ${minus ? '+' : '-'} ${k(q)}b`;
  return {
    uslovie: naydiPri(tex, pri(a, b)),
    otvet: ans,
    razbor: razborW1(p, q, a, b, minus, top, bottom, simplified, ans),
    proverka: (p * p * a * a - q * q * b * b) / den,
    signature: `${p}:${q}`,
    params: { p, q, a, b, minus: minus ? 1 : 0 },
  };
}

export const P8W: Prototype = {
  id: '8.W',
  group: 'V',
  nazvanie: 'Дроби с буквами',
  podtipy: [
    podtip('squares-int', 'base', (r) => drawW1(r, false)),
    podtip('squares-dec', 'advanced', (r) => drawW1(r, true)),
    podtip('sum-diff', 'advanced', (r) => {
      const kk = r.pick([1, 2, 4, 5, 8]);
      const a = value(r, true);
      const b = value(r, r.int(0, 1) === 0);
      const ans = round9(4 / kk);
      const tex = `\\dfrac{(a + b)^2 - (a - b)^2}{${k(kk)}ab}`;
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: ans,
        razbor: [
          shag(
            'Числитель — разность квадратов: $x^2 - y^2 = (x - y)(x + y)$ при $x = a + b$, $y = a - b$. В разности скобок $a$ уходит, в сумме — $b$',
            cep(
              '(a + b)^2 - (a - b)^2',
              '\\bigl((a + b) - (a - b)\\bigr)\\bigl((a + b) + (a - b)\\bigr)',
              '2b \\cdot 2a',
              '4ab',
            ),
          ),
          shag(
            `Сокращаем дробь на $ab$ — буквы уходят совсем, поэтому значения ${znach(a, b)} не понадобились`,
            cep(
              `\\dfrac{4ab}{${k(kk)}ab}`,
              kk === 1 || kk === 4 ? '' : `\\dfrac{4}{${kk}}`,
              d(ans),
            ),
          ),
        ],
        proverka: ((a + b) ** 2 - (a - b) ** 2) / (kk * a * b),
        signature: `${kk}`,
        params: { k: kk, a, b },
      };
    }),
    podtip('common', 'base', (r) => {
      const decimal = r.int(0, 1) === 0;
      const a = value(r, decimal);
      const b = value(r, decimal);
      const ans = round9(a + b);
      if (Math.abs(a - b) < 1e-9 || ans === 0) {
        return null;
      }
      const tex = `\\dfrac{a^2}{a - b} - \\dfrac{b^2}{a - b}`;
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: ans,
        razbor: [
          shag(
            'Знаменатели одинаковые — вычитаем числители, знаменатель оставляем',
            `${tex} = \\dfrac{a^2 - b^2}{a - b}`,
          ),
          shag(
            'Числитель — разность квадратов: $a^2 - b^2 = (a - b)(a + b)$, поэтому дробь сокращается на $a - b$',
            '\\dfrac{a^2 - b^2}{a - b} = \\dfrac{(a - b)(a + b)}{a - b} = a + b',
          ),
          shag(
            `Подставляем ${znach(a, b)} в упрощённое выражение`,
            cep('a + b', `${d(a)} + ${paren(b)}`, summa(a, b), d(ans)),
          ),
        ],
        proverka: (a * a) / (a - b) - (b * b) / (a - b),
        signature: `${a}`,
        params: { a, b, form: 'common' },
      };
    }),
  ],
};

/* ── 8.X  иррациональные выражения ───────────────────────────── */

export const P8X: Prototype = {
  id: '8.X',
  group: 'V',
  nazvanie: 'Корни с буквами',
  podtipy: [
    podtip('conjugate', 'advanced', (r) => {
      const sa = r.dec(0.2, 3.9, 1);
      const sb = r.dec(0.1, 3.8, 1);
      if (sa <= sb) {
        return null;
      }
      const a = round9(sa * sa);
      const b = round9(sb * sb);
      const ans = round9(sa + sb);
      const tex = `\\dfrac{a - b}{\\sqrt{a} - \\sqrt{b}}`;
      const factored =
        '\\dfrac{(\\sqrt{a} - \\sqrt{b})(\\sqrt{a} + \\sqrt{b})}{\\sqrt{a} - \\sqrt{b}}';
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: ans,
        razbor: [
          shag(
            'Числитель — разность квадратов корней: $a = (\\sqrt{a})^2$, $b = (\\sqrt{b})^2$, поэтому $a - b = (\\sqrt{a} - \\sqrt{b})(\\sqrt{a} + \\sqrt{b})$',
            `${tex} = ${factored}`,
          ),
          shag(
            'Сокращаем дробь на общий множитель $\\sqrt{a} - \\sqrt{b}$: он не равен нулю, потому что $a \\ne b$',
            `${factored} = \\sqrt{a} + \\sqrt{b}`,
          ),
          shag(
            `Подставляем ${znach(a, b)} и извлекаем корни: $${d(a)} = ${d(sa)}^2$, $${d(b)} = ${d(sb)}^2$`,
            cep(
              '\\sqrt{a} + \\sqrt{b}',
              `\\sqrt{${d(a)}} + \\sqrt{${d(b)}}`,
              `${d(sa)} + ${d(sb)}`,
              d(ans),
            ),
          ),
        ],
        proverka: (a - b) / (Math.sqrt(a) - Math.sqrt(b)),
        signature: `${a}`,
        params: { a, b, form: 'conjugate' },
      };
    }),
    podtip('modulus', 'advanced', (r) => {
      const a = -Math.abs(value(r, r.int(0, 1) === 0));
      const rootB = r.int(2, 10);
      const b = rootB * rootB;
      const ans = round9(-a * rootB);
      const tex = `\\sqrt{a^2 b}`;
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: ans,
        razbor: [
          shag(
            'Корень из произведения — произведение корней, а $\\sqrt{a^2} = \\lvert a \\rvert$: арифметический корень не бывает отрицательным',
            '\\sqrt{a^2 b} = \\sqrt{a^2} \\cdot \\sqrt{b} = \\lvert a \\rvert \\cdot \\sqrt{b}',
          ),
          shag(
            `Подставляем ${znach(a, b)}. Число $a$ отрицательное, поэтому $\\lvert a \\rvert = -a = ${d(-a)}$, а $${b} = ${rootB}^2$`,
            cep(
              '\\lvert a \\rvert \\cdot \\sqrt{b}',
              `\\lvert ${d(a)} \\rvert \\cdot \\sqrt{${b}}`,
              `${d(-a)} \\cdot ${rootB}`,
              d(ans),
            ),
          ),
        ],
        proverka: Math.sqrt(a * a * b),
        signature: `${b}`,
        params: { a, b, form: 'modulus' },
      };
    }),
    podtip('square', 'base', (r) => {
      const a = Math.abs(value(r, true));
      const b = Math.abs(value(r, true));
      if (a === b) {
        return null;
      }
      const ans = round9(a + b);
      const tex = `(\\sqrt{a} - \\sqrt{b})^2 + 2\\sqrt{ab}`;
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: ans,
        razbor: [
          shag(
            'Раскрываем квадрат разности: $(x - y)^2 = x^2 - 2xy + y^2$, где $(\\sqrt{a})^2 = a$, $(\\sqrt{b})^2 = b$ и $\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab}$',
            '(\\sqrt{a} - \\sqrt{b})^2 = a - 2\\sqrt{ab} + b',
          ),
          shag(
            'Слагаемые $-2\\sqrt{ab}$ и $2\\sqrt{ab}$ взаимно уничтожаются — корни считать не придётся',
            'a - 2\\sqrt{ab} + b + 2\\sqrt{ab} = a + b',
          ),
          shag(`Подставляем ${znach(a, b)}`, cep('a + b', `${d(a)} + ${d(b)}`, d(ans))),
        ],
        proverka: (Math.sqrt(a) - Math.sqrt(b)) ** 2 + 2 * Math.sqrt(a * b),
        signature: `${a}`,
        params: { a, b, form: 'square' },
      };
    }),
    podtip('product', 'base', (r) => {
      const a = Math.abs(value(r, true)) + r.int(0, 8);
      const b = Math.abs(value(r, true));
      if (a <= b) {
        return null;
      }
      const ans = round9(a - b);
      const tex = `(\\sqrt{a} + \\sqrt{b})(\\sqrt{a} - \\sqrt{b})`;
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: ans,
        razbor: [
          shag(
            'Произведение суммы и разности — разность квадратов: $(x + y)(x - y) = x^2 - y^2$, а квадрат корня — подкоренное число: $(\\sqrt{a})^2 = a$',
            `${tex} = (\\sqrt{a})^2 - (\\sqrt{b})^2 = a - b`,
          ),
          shag(
            `Подставляем ${znach(a, b)} — корни из них извлекать не нужно`,
            cep('a - b', `${d(a)} - ${d(b)}`, d(ans)),
          ),
        ],
        proverka: (Math.sqrt(a) + Math.sqrt(b)) * (Math.sqrt(a) - Math.sqrt(b)),
        signature: `${a}`,
        params: { a, b, form: 'product' },
      };
    }),
  ],
};

/* ── 8.Y  степенные выражения с буквами ──────────────────────── */

const VALUES_Y = [0.5, 2, 3, 5, 0.2, 10, 0.25, 4];

function expTex(e: number): string {
  return e === 1 ? '' : `^{${e}}`;
}

/** Показатели складываем и вычитаем: «1{,}1 - 2 + 1{,}4» вместо «1{,}1 + (-2) - (-1{,}4)». */
function pokazateliY(x: number, y: number, z: number): string[] {
  const raw = `${d(x)} + ${paren(y)} - ${paren(z)}`;
  const clean = `${d(x)} ${y < 0 ? '-' : '+'} ${d(Math.abs(y))} ${z < 0 ? '+' : '-'} ${d(Math.abs(z))}`;
  return y < 0 || z < 0 ? [raw, clean] : [clean];
}

/** Решение 8.Y decimal: показатели одним действием, потом смысл показателя и подстановка. */
function razborYdecimal(
  tex: string,
  x: number,
  y: number,
  z: number,
  target: number,
  a: number,
  ans: number,
): Shag[] {
  const steps: Shag[] = [
    shag(
      `Основания одинаковые: при умножении показатели складываются, при делении вычитаются — $\\dfrac{a^{x} \\cdot a^{y}}{a^{z}} = a^{x + y - z}$${
        y < 0 || z < 0 ? '. Следим за знаками отрицательных показателей' : ''
      }`,
      cep(
        tex,
        ...pokazateliY(x, y, z).map((e) => pw('a', e)),
        pw('a', d(target)),
        target === 1 ? 'a' : '',
      ),
    ),
  ];
  if (target === 1) {
    steps.push(
      shag(`Значит, выражение равно самому $a$. Подставляем $a = ${d(a)}$`, `a = ${d(ans)}`),
    );
  } else if (target === 2) {
    steps.push(shag(`Подставляем $a = ${d(a)}$`, cep(pw('a', '2'), pw(d(a), '2'), d(ans))));
  } else if (target === -1) {
    steps.push(
      shag(
        'Показатель $-1$ означает обратное число: $a^{-1} = \\dfrac{1}{a}$',
        `${pw('a', '-1')} = \\dfrac{1}{a}`,
      ),
      shag(`Подставляем $a = ${d(a)}$`, cep('\\dfrac{1}{a}', `\\dfrac{1}{${d(a)}}`, d(ans))),
    );
  } else {
    steps.push(
      shag(
        'Показатель $0{,}5 = \\dfrac{1}{2}$ — это квадратный корень: $a^{\\frac{1}{2}} = \\sqrt{a}$',
        `${pw('a', '0{,}5')} = ${pw('a', '\\frac{1}{2}')} = \\sqrt{a}`,
      ),
      shag(
        `Подставляем $a = ${d(a)}$: это точный квадрат, $${d(a)} = ${d(ans)}^2$`,
        cep('\\sqrt{a}', `\\sqrt{${d(a)}}`, d(ans)),
      ),
    );
  }
  return steps;
}

/** Решение 8.Y numeric: (c·a)^p : a^s — степень произведения, деление степеней, подстановка. */
function razborYnumeric(c: number, p: number, s: number, a: number, ans: number): Shag[] {
  const C = c ** p;
  const e = p - s;
  const steps: Shag[] = [
    shag(
      'Возводим произведение в степень — каждый множитель отдельно: $(xy)^{n} = x^{n} y^{n}$',
      cep(
        `(${c}a)^{${p}}`,
        `${pw(String(c), String(p))} ${pw('a', String(p))}`,
        `${C}${pw('a', String(p))}`,
      ),
    ),
  ];
  const drobTex = `\\dfrac{${C}${pw('a', String(p))}}{a${expTex(s)}}`;
  if (e === 0) {
    steps.push(
      shag(
        `В числителе и в знаменателе одна и та же степень $a${expTex(s)}$ — сокращаем её полностью, поэтому значение $a = ${d(a)}$ не понадобится`,
        `${drobTex} = ${d(ans)}`,
      ),
    );
    return steps;
  }
  const ae = round9(a ** e);
  const naChetyre = ae === 0.25;
  steps.push(
    shag(
      'Делим степени с одинаковым основанием — показатели вычитаются: $\\dfrac{a^{m}}{a^{n}} = a^{m - n}$',
      cep(drobTex, `${C}${pw('a', `${p} - ${s}`)}`, `${C}${mono('a', e)}`),
    ),
    shag(
      `Подставляем $a = ${d(a)}$${naChetyre ? '. Умножить на $0{,}25$ — всё равно что разделить на $4$' : ''}`,
      cep(
        `${C}${mono('a', e)}`,
        `${C} \\cdot ${chislo(a, e)}`,
        `${C} \\cdot ${d(ae)}`,
        naChetyre ? `${C} : 4` : '',
        d(ans),
      ),
    ),
  );
  return steps;
}

export const P8Y: Prototype = {
  id: '8.Y',
  group: 'V',
  nazvanie: 'Степени с буквами',
  podtipy: [
    podtip('int-pos', 'base', (r) => drawY(r, false)),
    podtip('int-neg', 'advanced', (r) => drawY(r, true)),
    podtip('decimal', 'advanced', (r) => {
      const target = r.pick([1, 2, -1, 0.5]);
      const x = r.dec(0.2, 3.9, 1);
      const y = r.dec(-2.9, 2.9, 1);
      const z = round9(x + y - target);
      if (Number.isInteger(x) || Number.isInteger(z) || z === 0 || y === 0) {
        return null;
      }
      let a: number;
      if (target === 0.5) {
        const root = r.pick([2, 3, 4, 5, 7, 9, 11]);
        a = root * root;
      } else if (target === -1) {
        a = r.pick([2, 4, 5, 8, 10, 0.5, 0.2, 0.25]);
      } else {
        a = r.pick([2, 3, 5, 7, 0.5, 0.2, 1.5, 2.5, 11]);
      }
      const ans = round9(a ** target);
      if (!nice(ans, 3)) {
        return null;
      }
      const tex = `\\dfrac{a^{${d(x)}} \\cdot a^{${d(y)}}}{a^{${d(z)}}}`;
      return {
        uslovie: naydiPri(tex, pri(a)),
        otvet: ans,
        razbor: razborYdecimal(tex, x, y, z, target, a, ans),
        proverka: (Math.pow(a, x) * Math.pow(a, y)) / Math.pow(a, z),
        signature: `${target}:${a}`,
        params: { x, y, z, a },
      };
    }),
    podtip('numeric', 'base', (r) => {
      const c = r.pick([2, 3, 5]);
      const p = r.pick([2, 3]);
      const s = r.int(1, p);
      const a = r.pick([0.5, 2, 0.2, 5, 0.1, 10, 1.5, 4]);
      const e = p - s;
      const ans = round9(c ** p * a ** e);
      if (!nice(ans, 3) || ans > 1000) {
        return null;
      }
      const tex = `\\dfrac{(${c}a)^{${p}}}{a${expTex(s)}}`;
      return {
        uslovie: naydiPri(tex, pri(a)),
        otvet: ans,
        razbor: razborYnumeric(c, p, s, a, ans),
        proverka: Math.pow(c * a, p) / Math.pow(a, s),
        signature: `${c}:${p}:${s}`,
        params: { c, p, s, a },
      };
    }),
  ],
};

/** Одночлен с отрицательными показателями — дробью: a b^{-1} → \dfrac{a}{b}. */
function drobY(ea: number, eb: number): string {
  const num = vmeste(ea > 0 ? mono('a', ea) : '', eb > 0 ? mono('b', eb) : '');
  const den = vmeste(ea < 0 ? mono('a', -ea) : '', eb < 0 ? mono('b', -eb) : '');
  if (den === '') return num;
  return `\\dfrac{${num === '' ? '1' : num}}{${den}}`;
}

/** Числа после подстановки: части с показателями, их запись и значение. */
function podstanovkaY(parts: { v: number; e: number }[]): {
  sub: string;
  val: number;
  short: string;
} {
  if (parts.length === 0) return { sub: '1', val: 1, short: '1' };
  const val = round9(parts.reduce((acc, { v, e }) => acc * v ** e, 1));
  return { sub: parts.map(({ v, e }) => chislo(v, e)).join(' \\cdot '), val, short: d(val) };
}

/**
 * Решение 8.Y int: (a^p b^q)^r : (a^s b^t) — степень произведения,
 * деление степеней с одним основанием, отрицательные показатели —
 * в знаменатель, и только потом подстановка.
 */
function razborYint(
  p: number,
  q: number,
  rr: number,
  s: number,
  t: number,
  a: number,
  b: number,
  top: string,
  bottom: string,
  ans: number,
): Shag[] {
  const pa = p * rr;
  const pb = q * rr;
  const ea = pa - s;
  const eb = pb - t;
  const steps: Shag[] = [];
  const umnozhit = (x: string, e: number) =>
    e === 1 ? pw(x, String(rr)) : pw(x, `${e} \\cdot ${paren(rr)}`);
  const posle = vmeste(mono('a', pa), mono('b', pb));
  steps.push(
    shag(
      p === 1 && q === 1
        ? 'Возводим произведение в степень — каждый множитель отдельно: $(xy)^{k} = x^{k} y^{k}$'
        : 'Возводим произведение в степень: каждый множитель отдельно, показатели перемножаются — $(x^{m} y^{n})^{k} = x^{mk} y^{nk}$',
      cep(top, vmeste(umnozhit('a', p), umnozhit('b', q)), posle),
    ),
  );
  const itog = vmeste(mono('a', ea), mono('b', eb));
  const drob = drobY(ea, eb);
  const otricatelnye = ea < 0 || eb < 0;
  const vZnamenatel =
    'Отрицательный показатель переносим в знаменатель: $x^{-n} = \\dfrac{1}{x^{n}}$';
  if (bottom !== '') {
    const vychest = (x: string, e: number, sub: number) =>
      sub === 0 ? mono(x, e) : pw(x, `${e} - ${paren(sub)}`);
    const ushli = [...(ea === 0 ? ['a'] : []), ...(eb === 0 ? ['b'] : [])];
    steps.push(
      shag(
        `Делим степени с одинаковым основанием — показатели вычитаются: $\\dfrac{x^{m}}{x^{n}} = x^{m - n}$${
          ushli.length > 0 ? `; $${ushli[0]}$ сокращается полностью` : ''
        }${otricatelnye ? `. ${vZnamenatel}` : ''}`,
        cep(
          `\\dfrac{${posle}}{${bottom}}`,
          vmeste(vychest('a', pa, s), vychest('b', pb, t)),
          itog,
          drob,
        ),
      ),
    );
  } else if (otricatelnye) {
    steps.push(shag(vZnamenatel, cep(posle, drob)));
  }
  const num = podstanovkaY([
    ...(ea > 0 ? [{ v: a, e: ea }] : []),
    ...(eb > 0 ? [{ v: b, e: eb }] : []),
  ]);
  const den = podstanovkaY([
    ...(ea < 0 ? [{ v: a, e: -ea }] : []),
    ...(eb < 0 ? [{ v: b, e: -eb }] : []),
  ]);
  const imena = [...(ea === 0 ? [] : [`$a = ${d(a)}$`]), ...(eb === 0 ? [] : [`$b = ${d(b)}$`])];
  if (!otricatelnye) {
    steps.push(shag(`Подставляем ${imena.join(', ')}`, cep(drob, num.sub, num.short, d(ans))));
    return steps;
  }
  /* Делить на 0,25 — умножать на 4: так считать проще. */
  const obratnoe = round9(1 / den.val);
  const umnozhaem =
    den.val < 1 && Number.isInteger(obratnoe) && num.val !== 1 && num.val !== den.val;
  steps.push(
    shag(
      `Подставляем ${imena.join(', ')}${
        umnozhaem ? `. Делить на $${den.short}$ — то же, что умножать на $${obratnoe}$` : ''
      }`,
      cep(
        drob,
        `\\dfrac{${num.sub}}{${den.sub}}`,
        `\\dfrac{${num.short}}{${den.short}}`,
        umnozhaem ? `${num.short} \\cdot ${obratnoe}` : '',
        d(ans),
      ),
    ),
  );
  return steps;
}

function drawY(r: Rng, negatives: boolean): Draft | null {
  const range = negatives ? [-2, -1, 1, 2, 3] : [1, 2, 3];
  const p = r.pick(range);
  const q = r.pick(range);
  const rr = r.pick(negatives ? [-2, -1, 2, 3] : [2, 3]);
  const s = r.int(negatives ? -4 : 0, 4);
  const t = r.int(negatives ? -4 : 0, 4);
  const ea = p * rr - s;
  const eb = q * rr - t;
  if (Math.abs(ea) > 2 || Math.abs(eb) > 2 || (ea === 0 && eb === 0)) {
    return null;
  }
  if (!negatives && s === 0 && t === 0) {
    return null;
  }
  const a = r.pick(VALUES_Y);
  const b = r.pick(VALUES_Y);
  const ans = round9(a ** ea * b ** eb);
  if (!nice(ans, 3) || Math.abs(ans) > 1000 || Math.abs(ans) < 0.001) {
    return null;
  }
  const inner = `a${expTex(p)} b${expTex(q)}`;
  const top = `(${inner})^{${rr}}`;
  const bottomParts = [s === 0 ? '' : `a${expTex(s)}`, t === 0 ? '' : `b${expTex(t)}`].filter(
    Boolean,
  );
  const bottom = bottomParts.join(' ');
  const tex = bottom === '' ? top : `\\dfrac{${top}}{${bottom}}`;
  return {
    uslovie: naydiPri(tex, pri(a, b)),
    otvet: ans,
    razbor: razborYint(p, q, rr, s, t, a, b, top, bottom, ans),
    proverka: Math.pow(Math.pow(a, p) * Math.pow(b, q), rr) / (Math.pow(a, s) * Math.pow(b, t)),
    signature: `${ea}:${eb}:${a}:${b}`,
    params: { p, q, r: rr, s, t, a, b },
  };
}

/* ── 8.Z  логарифмические выражения с буквами ────────────────── */

export const P8Z: Prototype = {
  id: '8.Z',
  group: 'V',
  nazvanie: 'Логарифмы с буквами',
  podtipy: [
    podtip('product', 'base', (r) => {
      const p = r.int(2, 5);
      const a = r.pick([2, 3, 5, 7]);
      const b = r.pick([3, 5, 6, 7, 10, 11]);
      if (a === b) {
        return null;
      }
      const tex = `${log('a', `(a^{${p}} b)`)} - ${log('a', 'b')}`;
      const chastnoe = log('a', `\\dfrac{a^{${p}} b}{b}`);
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: p,
        razbor: [
          shag(
            'Разность логарифмов с одним основанием — логарифм частного: $\\log_{a} x - \\log_{a} y = \\log_{a} \\dfrac{x}{y}$',
            `${tex} = ${chastnoe}`,
          ),
          shag(
            `Сокращаем дробь на $b$, а логарифм степени основания равен показателю: $\\log_{a} a^{k} = k$. Значения ${znach(a, b)} не понадобились`,
            `${chastnoe} = ${log('a', `a^{${p}}`)} = ${p}`,
          ),
        ],
        proverka: Math.log(a ** p * b) / Math.log(a) - Math.log(b) / Math.log(a),
        signature: `${p}:${a}`,
        params: { p, a, b },
      };
    }),
    podtip('chain', 'base', (r) => {
      const p = r.int(2, 6);
      const a = r.pick([2, 3, 5, 7, 10]);
      const b = r.pick([2, 3, 5, 7, 11]);
      if (a === b) {
        return null;
      }
      const tex = `${log('a', 'b')} \\cdot ${log('b', `a^{${p}}`)}`;
      const vynesli = `${p} \\cdot ${log('a', 'b')} \\cdot ${log('b', 'a')}`;
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: p,
        razbor: [
          shag(
            'Выносим показатель степени за знак логарифма: $\\log_{b} a^{k} = k \\log_{b} a$',
            `${tex} = ${vynesli}`,
          ),
          shag(
            `Логарифмы $\\log_{a} b$ и $\\log_{b} a$ взаимно обратны: $\\log_{b} a = \\dfrac{1}{\\log_{a} b}$, поэтому их произведение равно $1$. Значения ${znach(a, b)} не понадобились`,
            `${vynesli} = ${p} \\cdot 1 = ${p}`,
          ),
        ],
        proverka: (Math.log(b) / Math.log(a)) * (Math.log(a ** p) / Math.log(b)),
        signature: `${p}:${a}`,
        params: { p, a, b, form: 'chain' },
      };
    }),
    podtip('identity', 'advanced', (r) => {
      const a = r.pick([2, 3, 5, 7]);
      const root = r.int(2, 12);
      const b = root * root;
      const tex = `${a}^{${log(String(a * a), 'b')}}`;
      const koren = log(String(a), '\\sqrt{b}');
      return {
        uslovie: naydiPri(tex, `b = ${b}`),
        otvet: root,
        razbor: [
          shag(
            `Основание логарифма — квадрат: $${a * a} = ${a}^{2}$, поэтому выносим множитель $\\dfrac{1}{2}$: $\\log_{c^{2}} x = \\dfrac{1}{2}\\log_{c} x$. Его возвращаем под логарифм как квадратный корень — теперь у логарифма то же основание $${a}$, что и у степени`,
            cep(
              log(String(a * a), 'b'),
              log(`${a}^{2}`, 'b'),
              `\\dfrac{1}{2}${log(String(a), 'b')}`,
              koren,
            ),
          ),
          shag(
            'Основное логарифмическое тождество: $c^{\\log_{c} x} = x$ — степень и логарифм с одним основанием взаимно уничтожаются',
            `${tex} = ${a}^{${koren}} = \\sqrt{b}`,
          ),
          shag(
            `Подставляем $b = ${b}$: это точный квадрат, $${b} = ${root}^{2}$`,
            `\\sqrt{b} = \\sqrt{${b}} = ${root}`,
          ),
        ],
        proverka: Math.pow(a, Math.log(b) / Math.log(a * a)),
        signature: `${a}:${root}`,
        params: { a, b },
      };
    }),
    podtip('given', 'advanced', (r) => {
      const t = r.dec(0.5, 4.5, 1);
      if (Number.isInteger(t)) {
        return null;
      }
      const m = r.int(2, 5);
      const n = r.int(1, m - 1);
      const ans = round9((m - n) * t);
      const tex =
        `${log('a', `b^{${m}}`)} + ${log('a', `\\dfrac{1}{b^{${n === 1 ? '' : n}}}`)}`.replace(
          '^{}',
          '',
        );
      const e = m - n;
      const dano = `Подставляем данное в условии значение $${log('a', 'b')} = ${d(t)}$`;
      return {
        uslovie: `Найдите значение выражения $${tex}$, если $${log('a', 'b')} = ${d(t)}$.`,
        otvet: ans,
        razbor: [
          shag(
            'Сумма логарифмов с одним основанием — логарифм произведения: $\\log_{a} x + \\log_{a} y = \\log_{a} (xy)$. Под логарифмом делим степени $b$ — показатели вычитаются',
            cep(
              tex,
              log('a', `\\dfrac{b^{${m}}}{${mono('b', n)}}`),
              log('a', pw('b', `${m} - ${n}`)),
              log('a', mono('b', e)),
            ),
          ),
          ...(e === 1
            ? [shag(dano, `${log('a', 'b')} = ${d(ans)}`)]
            : [
                shag(
                  'Выносим показатель степени за знак логарифма: $\\log_{a} x^{k} = k \\log_{a} x$',
                  `${log('a', mono('b', e))} = ${e}${log('a', 'b')}`,
                ),
                shag(dano, cep(`${e}${log('a', 'b')}`, `${e} \\cdot ${d(t)}`, d(ans))),
              ]),
        ],
        proverka: m * t + -n * t,
        signature: `${m}:${n}`,
        params: { t, m, n },
      };
    }),
  ],
};
