/* scripts/lib/schet-edinic.mjs — пересчёт цепочек «a = b = c» в TeX
   с учётом единиц (pnpm test:edinicy).

   Формула режется на звенья по «=» (и «\approx» — с допуском). Каждое
   звено считается как выражение: числа ($2{,}5$, $72\,000$), \cdot, :,
   +, −, скобки, \dfrac / \frac, степени. Единица \text{ км/ч} — это
   множитель в СИ (1000/3600), поэтому «72 км/ч = 20 м/с» сходится.
   Звено без единиц берёт единицу ближайшего соседа с единицей:
   «2,5 ч = 2,5·60 = 150 мин» — середина считается в минутах.

   Звено с буквами (a^m, T, x) или незнакомым словом не считается и
   разрывает цепочку: сравниваются только соседние посчитанные звенья.
   Формулы с неравенствами не проверяются. */

/** Единицы → множитель в СИ. */
const EDINICY = {
  с: 1,
  мин: 60,
  ч: 3600,
  сут: 86400,
  м: 1,
  км: 1000,
  см: 0.01,
  мм: 0.001,
  нм: 1e-9,
  г: 0.001,
  кг: 1,
  т: 1000,
  В: 1,
  кВ: 1000,
  Гц: 1,
  МГц: 1e6,
  ГГц: 1e9,
  Ф: 1,
  мкФ: 1e-6,
};

function edinica(t) {
  const s = t.trim();
  if (s in EDINICY) return EDINICY[s];
  const m = s.match(/^([^/]+)\/([^/]+)$/);
  if (m && m[1] in EDINICY && m[2] in EDINICY) return EDINICY[m[1]] / EDINICY[m[2]];
  return null;
}

class Neznayu extends Error {}

/** Разбор одного звена. Возвращает { v, ed } (ed — множитель последней единицы) или null. */
function schitat1(tex, bezEdinic) {
  let s = tex
    .replace(/\\left|\\right|\\displaystyle/g, '')
    .replace(/(\d)\\,(?=\d)/g, '$1')
    .replace(/\{,\}/g, '.')
    .replace(/\\[dt]?frac/g, '\\frac')
    .replace(/\\cdot|\\times/g, '*')
    .replace(/\\,|\\;|\\ |~/g, ' ')
    .replace(/−/g, '-');
  let i = 0;
  let poslednyaya = null;
  let estEdinica = false;
  /* «1 ч 20 мин»: число сразу после единицы — это сложение. */
  let posleEdinicy = false;
  const peek = () => {
    while (s[i] === ' ') i += 1;
    return s[i];
  };
  const est = (c) => {
    if (peek() === c) {
      i += 1;
      return true;
    }
    return false;
  };
  function gruppa() {
    if (!est('{')) throw new Neznayu();
    const v = expr();
    if (!est('}')) throw new Neznayu();
    return v;
  }
  function primary() {
    const c = peek();
    if (c === '(') {
      i += 1;
      const v = expr();
      if (!est(')')) throw new Neznayu();
      return v;
    }
    if (c === '{') return gruppa();
    if (c !== undefined && /[0-9.]/.test(c)) {
      const m = s.slice(i).match(/^[0-9]+(?:\.[0-9]+)?/);
      if (!m) throw new Neznayu();
      i += m[0].length;
      return Number(m[0]);
    }
    if (s.startsWith('\\frac', i)) {
      i += 5;
      const a = peek() === '{' ? gruppa() : odnaCifra();
      const b = peek() === '{' ? gruppa() : odnaCifra();
      return a / b;
    }
    if (s.startsWith('\\text', i)) {
      i += 5;
      if (!est('{')) throw new Neznayu();
      const end = s.indexOf('}', i);
      const t = s.slice(i, end);
      i = end + 1;
      /* Степень единицы: «км/ч}^2» — квадрат знаменателя, «м}^2» — квадрат. */
      let st = 1;
      if (peek() === '^') {
        i += 1;
        st = peek() === '{' ? gruppa() : odnaCifra();
      }
      const m = t.trim().match(/^([^/]+)\/([^/]+)$/);
      let f;
      if (m && st !== 1) {
        const a = edinica(m[1]);
        const b = edinica(m[2]);
        if (a === null || b === null) throw new Neznayu();
        f = a / b ** st;
      } else {
        const e = edinica(t);
        if (e === null) throw new Neznayu();
        f = e ** st;
      }
      poslednyaya = f;
      estEdinica = true;
      posleEdinicy = true;
      return bezEdinic ? 1 : f;
    }
    throw new Neznayu();
  }
  function odnaCifra() {
    const c = peek();
    if (c === undefined || !/[0-9]/.test(c)) throw new Neznayu();
    i += 1;
    return Number(c);
  }
  function factor() {
    let v = primary();
    while (peek() === '^') {
      i += 1;
      const e = peek() === '{' ? gruppa() : odnaCifra();
      v = v ** e;
    }
    return v;
  }
  function unary() {
    if (est('-')) return -unary();
    if (est('+')) return unary();
    return factor();
  }
  function term() {
    posleEdinicy = false;
    let v = unary();
    for (;;) {
      const c = peek();
      if (posleEdinicy && c !== undefined && /[0-9]/.test(c)) {
        return v;
      }
      posleEdinicy = false;
      if (c === '*') {
        i += 1;
        v *= unary();
      } else if (c === ':' || c === '/') {
        i += 1;
        v /= unary();
      } else if (
        c === '(' ||
        c === '{' ||
        s.startsWith('\\frac', i) ||
        s.startsWith('\\text', i) ||
        (c !== undefined && /[0-9]/.test(c))
      ) {
        v *= unary();
      } else {
        return v;
      }
    }
  }
  function expr() {
    let v = term();
    for (;;) {
      const c = peek();
      if (c !== undefined && /[0-9]/.test(c)) v += term();
      else if (est('+')) v += term();
      else if (est('-')) v -= term();
      else return v;
    }
  }
  try {
    const v = expr();
    if (peek() !== undefined) return null;
    return { v, ed: estEdinica ? poslednyaya : null };
  } catch (e) {
    if (e instanceof Neznayu) return null;
    throw e;
  }
}

/**
 * Значение звена в СИ и множитель его единицы: «72 км/ч» → v = 20,
 * ed = 1000/3600 (отношение значений с единицами и без них).
 */
export function schitat(tex) {
  const a = schitat1(tex, false);
  if (a === null || a.ed === null) return a;
  const b = schitat1(tex, true);
  return { v: a.v, ed: b === null || b.v === 0 ? a.ed : a.v / b.v };
}

/** Делит по разделителю верхнего уровня (вне фигурных скобок). */
function razrezat(s, re) {
  const out = [];
  let glub = 0;
  let start = 0;
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (c === '{') glub += 1;
    else if (c === '}') glub -= 1;
    else if (glub === 0) {
      const m = s.slice(i).match(re);
      if (m && m.index === 0) {
        out.push({ t: s.slice(start, i), sep: m[0] });
        i += m[0].length - 1;
        start = i + 1;
      }
    }
  }
  out.push({ t: s.slice(start), sep: null });
  return out;
}

const NERAVENSTVO = /\\[gl]eq?(?![a-z])|\\ne(?![a-z])|<|>|\\in(?![a-z])|\\pm|\\Rightarrow/;

/**
 * Проверка одной формулы (TeX без $). Возвращает
 * { proverok, oshibki: string[] }: proverok — сколько пар звеньев сверено.
 */
export function proveritFormulu(tex) {
  const res = { proverok: 0, oshibki: [] };
  if (NERAVENSTVO.test(tex)) return res;
  for (const chast of razrezat(tex, /^(,\\quad|\\qquad|\\quad|;)/)) {
    const zvenya = razrezat(chast.t, /^(=|\\approx)/);
    const sch = zvenya.map((z) => ({ ...z, r: schitat(z.t) }));
    /* Единица для звеньев без неё — от ближайшего соседа справа, иначе слева. */
    const ed = sch.map((z, k) => {
      if (z.r === null) return null;
      if (z.r.ed !== null) return 1;
      for (let j = k + 1; j < sch.length && sch[j].r !== null; j += 1) {
        if (sch[j].r.ed !== null) return sch[j].r.ed;
      }
      for (let j = k - 1; j >= 0 && sch[j].r !== null; j -= 1) {
        if (sch[j].r.ed !== null) return sch[j].r.ed;
      }
      return 1;
    });
    for (let k = 0; k + 1 < sch.length; k += 1) {
      const a = sch[k];
      const b = sch[k + 1];
      if (a.r === null || b.r === null) continue;
      const va = a.r.v * ed[k];
      const vb = b.r.v * ed[k + 1];
      const priblizh = a.sep === '\\approx';
      /* «≈» — с точностью последнего знака правой части. */
      const znakov = (b.t.match(/\{,\}(\d+)/) ?? [null, ''])[1].length;
      const edB = b.r.ed ?? ed[k + 1];
      const dop = priblizh
        ? 0.5 * 10 ** -znakov * Math.abs(edB) + 1e-12
        : 1e-9 * Math.max(Math.abs(va), Math.abs(vb), 1e-300);
      res.proverok += 1;
      if (Math.abs(va - vb) > dop) {
        res.oshibki.push(`«${a.t.trim()}» ${priblizh ? '≈' : '='} «${b.t.trim()}»: ${va} ≠ ${vb}`);
      }
    }
  }
  return res;
}

/** Все формулы $…$ строки. */
export function formulyStroki(stroka) {
  return [...stroka.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]);
}
