/**
 * Разбор и вычисление записи ответа части 2.
 *
 * Запись приходит либо из математической клавиатуры (LaTeX MathLive:
 * \frac{2\sqrt{21}}{\sqrt{103}}, 14{,}4\sqrt{\frac{2}{2-n}}), либо
 * обычным текстом (2√21/√103, 14,4·sqrt(2/(2-n))). Обе приводятся к
 * одному виду и разбираются в дерево; значение считается числом при
 * заданных переменных. Ответ сравнивается по значению, а не по записи.
 *
 * Не разобралось — null: такую запись проверит учитель, это не «неверно».
 */

export type Uzel =
  | { t: 'num'; v: number }
  | { t: 'var'; name: string }
  | { t: 'neg'; a: Uzel }
  | { t: 'bin'; op: '+' | '-' | '*' | '/' | '^'; a: Uzel; b: Uzel }
  | { t: 'fn'; name: string; args: Uzel[] };

const FUNKCII = new Set([
  'sqrt',
  'root',
  'arctan',
  'sin',
  'cos',
  'tan',
  'cot',
  'ln',
  'log',
  'abs',
  'lg',
]);

/** LaTeX и «бытовые» знаки → плоская запись для разбора. */
export function normalizovat(src: string): string {
  let s = src.trim();
  /* Обёртки MathLive и пробелы TeX. */
  s = s.replace(/\\left|\\right|\\displaystyle|\\,|\;|\\!|\\ |~/g, '');
  s = s.replace(/\\operatorname\{([a-z]+)\}/g, '\\$1');
  s = s.replace(/\\dfrac|\\tfrac/g, '\\frac');
  s = s.replace(/\\cdot|\\times|·|×|⋅/g, '*');
  s = s.replace(/\\div|:/g, '/');
  s = s.replace(/\\pi|π/g, 'pi');
  s = s.replace(/\\infty|∞/g, 'inf');
  s = s.replace(/−|–|—/g, '-');
  /* Арктангенс — до тангенса: в «\\arctg» есть «tg». */
  s = s.replace(/\\?arctg|\\?arctan/g, 'arctan');
  s = s.replace(/\\tg|\\tan/g, 'tan').replace(/\\ctg|\\cot/g, 'cot');
  s = s
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\ln/g, 'ln')
    .replace(/\\lg/g, 'lg');
  s = s
    .replace(/\\log_\{([^{}]*)\}/g, 'logb($1)')
    .replace(/\\log_(\w)/g, 'logb($1)')
    .replace(/\\log/g, 'log');
  /* Десятичная запятая: {,} у KaTeX и «1,5» — только между цифрами. */
  s = s.replace(/\{,\}/g, '.').replace(/(\d),(?=\d)/g, '$1.');
  /* Смешанное число: 4\frac{17}{18} — это 4 + 17/18 (только цифры). */
  s = s.replace(/(\d+)\\frac\{(\d+)\}\{(\d+)\}/g, '($1+$2/$3)');
  /* \frac{a}{b} и \sqrt[n]{a}, \sqrt{a} — изнутри наружу. */
  for (let i = 0; i < 40; i += 1) {
    const before = s;
    s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))');
    s = s.replace(/\\frac(\d)(\d)/g, '(($1)/($2))');
    s = s.replace(/\\sqrt\[([^\]]*)\]\{([^{}]*)\}/g, 'root(($2),($1))');
    s = s.replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)');
    s = s.replace(/\\sqrt(\d)/g, 'sqrt($1)');
    s = s.replace(/\^\{([^{}]*)\}/g, '^($1)');
    /* Простые скобки {…} — только когда команды выше больше нечего
       сворачивать: иначе \frac потеряет свои аргументы. */
    if (s === before) s = s.replace(/\{([^{}]*)\}/g, '($1)');
    if (s === before) break;
  }
  s = s.replace(/√\s*\(/g, 'sqrt(').replace(/√\s*([0-9.]+|[a-z]|pi)/g, 'sqrt($1)');
  s = s.replace(/²/g, '^2').replace(/³/g, '^3');
  s = s.replace(/\s+/g, '');
  return s;
}

type Tok = { k: 'num'; v: number } | { k: 'id'; v: string } | { k: 'op'; v: string };

function lexer(s: string): Tok[] | null {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i]!;
    if (/[0-9.]/.test(ch)) {
      const m = /^\d*\.?\d+(?:e[+-]?\d+)?|^\d+\.?/.exec(s.slice(i));
      if (m === null) return null;
      out.push({ k: 'num', v: Number(m[0]) });
      i += m[0].length;
    } else if (/[a-z]/i.test(ch)) {
      const m = /^[a-z]+/i.exec(s.slice(i))!;
      let w = m[0].toLowerCase();
      /* Слитные имена: «pin» → pi·n, «2sqrt» уже разделено цифрой. */
      const parts: string[] = [];
      while (w.length > 0) {
        const f = [
          'arctan',
          'sqrt',
          'root',
          'logb',
          'sin',
          'cos',
          'tan',
          'cot',
          'log',
          'abs',
          'inf',
          'ln',
          'lg',
          'pi',
        ].find((x) => w.startsWith(x));
        if (f !== undefined) {
          parts.push(f);
          w = w.slice(f.length);
        } else {
          parts.push(w[0]!);
          w = w.slice(1);
        }
      }
      for (const p of parts) out.push({ k: 'id', v: p });
      i += m[0].length;
    } else if ('+-*/^(),'.includes(ch)) {
      out.push({ k: 'op', v: ch });
      i += 1;
    } else {
      return null;
    }
  }
  return out;
}

/** Разбор: + − · / ^, неявное умножение, функции, унарный минус. */
export function razobrat(src: string): Uzel | null {
  const toks = lexer(normalizovat(src));
  if (toks === null || toks.length === 0) return null;
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => peek()?.k === 'op' && peek()!.v === v;

  function primary(): Uzel {
    const t = peek();
    if (t === undefined) throw new Error('конец');
    if (t.k === 'num') {
      p += 1;
      return { t: 'num', v: t.v };
    }
    if (t.k === 'op' && t.v === '(') {
      p += 1;
      const e = expr();
      if (!isOp(')')) throw new Error(')');
      p += 1;
      return e;
    }
    if (t.k === 'op' && t.v === '-') {
      p += 1;
      return { t: 'neg', a: power() };
    }
    if (t.k === 'op' && t.v === '+') {
      p += 1;
      return power();
    }
    if (t.k === 'id') {
      p += 1;
      if (t.v === 'pi') return { t: 'num', v: Math.PI };
      if (t.v === 'inf') return { t: 'num', v: Infinity };
      if (FUNKCII.has(t.v) || t.v === 'logb') {
        if (t.v === 'logb') {
          /* logb(осн) затем аргумент. */
          if (!isOp('(')) throw new Error('logb');
          p += 1;
          const b = expr();
          if (!isOp(')')) throw new Error(')');
          p += 1;
          const a = power();
          return { t: 'fn', name: 'logb', args: [b, a] };
        }
        if (isOp('(')) {
          p += 1;
          const args = [expr()];
          while (isOp(',')) {
            p += 1;
            args.push(expr());
          }
          if (!isOp(')')) throw new Error(')');
          p += 1;
          return { t: 'fn', name: t.v, args };
        }
        return { t: 'fn', name: t.v, args: [power()] };
      }
      if (t.v.length === 1) return { t: 'var', name: t.v };
    }
    throw new Error(`лишнее: ${JSON.stringify(t)}`);
  }

  function power(): Uzel {
    const base = primary();
    if (isOp('^')) {
      p += 1;
      return { t: 'bin', op: '^', a: base, b: power() };
    }
    return base;
  }

  /** Начинается ли следующий токен множитель (неявное умножение). */
  const nachaloMnozhitelya = () => {
    const t = peek();
    return t !== undefined && (t.k === 'num' || t.k === 'id' || (t.k === 'op' && t.v === '('));
  };

  function term(): Uzel {
    let a = power();
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = peek()!.v as '*' | '/';
        p += 1;
        a = { t: 'bin', op, a, b: power() };
      } else if (nachaloMnozhitelya()) {
        a = { t: 'bin', op: '*', a, b: power() };
      } else return a;
    }
  }

  function expr(): Uzel {
    let a = term();
    while (isOp('+') || isOp('-')) {
      const op = peek()!.v as '+' | '-';
      p += 1;
      a = { t: 'bin', op, a, b: term() };
    }
    return a;
  }

  try {
    const e = expr();
    return p === toks.length ? e : null;
  } catch {
    return null;
  }
}

/** Значение дерева при переменных; NaN — не определено. */
export function vychislit(u: Uzel, vars: Readonly<Record<string, number>> = {}): number {
  switch (u.t) {
    case 'num':
      return u.v;
    case 'var':
      return vars[u.name] ?? NaN;
    case 'neg':
      return -vychislit(u.a, vars);
    case 'bin': {
      const a = vychislit(u.a, vars);
      const b = vychislit(u.b, vars);
      switch (u.op) {
        case '+':
          return a + b;
        case '-':
          return a - b;
        case '*':
          return a * b;
        case '/':
          return a / b;
        case '^':
          /* (−1)^n при целом n — знак, а не NaN. */
          if (a < 0 && Number.isInteger(b)) return (b % 2 === 0 ? 1 : -1) * Math.abs(a) ** b;
          return a ** b;
      }
      return NaN;
    }
    case 'fn': {
      const x = u.args.map((a) => vychislit(a, vars));
      const a0 = x[0] ?? NaN;
      switch (u.name) {
        case 'sqrt':
          return Math.sqrt(a0);
        case 'root': {
          const n = x[1] ?? 2;
          return a0 < 0 && n % 2 === 1 ? -((-a0) ** (1 / n)) : a0 ** (1 / n);
        }
        case 'sin':
          return Math.sin(a0);
        case 'cos':
          return Math.cos(a0);
        case 'tan':
          return Math.tan(a0);
        case 'arctan':
          return Math.atan(a0);
        case 'cot':
          return 1 / Math.tan(a0);
        case 'ln':
          return Math.log(a0);
        case 'lg':
        case 'log':
          return Math.log10(a0);
        case 'logb':
          return Math.log(x[1] ?? NaN) / Math.log(a0);
        case 'abs':
          return Math.abs(a0);
      }
      return NaN;
    }
  }
}

/** Переменные, которые встречаются в записи. */
export function peremennye(u: Uzel, out = new Set<string>()): Set<string> {
  if (u.t === 'var') out.add(u.name);
  else if (u.t === 'neg') peremennye(u.a, out);
  else if (u.t === 'bin') {
    peremennye(u.a, out);
    peremennye(u.b, out);
  } else if (u.t === 'fn') u.args.forEach((a) => peremennye(a, out));
  return out;
}

/** Число из записи без переменных; null — не разобралось или есть буквы. */
export function chislo(src: string): number | null {
  const u = razobrat(src);
  if (u === null || peremennye(u).size > 0) return null;
  const v = vychislit(u);
  return Number.isNaN(v) ? null : v;
}
