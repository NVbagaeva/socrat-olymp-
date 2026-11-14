/**
 * Значение функции, записанной в TeX, — для самотеста. Проверяет, что
 * формула, которую видит ученик, — та самая функция, по которой
 * считается ответ: прототип строит текст и расчёт порознь, и ошибка
 * в одном из них иначе осталась бы незамеченной.
 *
 * Понимает ровно то, что пишут прототипы: числа с {,}, x, \pi, e^{…},
 * степени ^n и ^{…}, \frac, \sqrt, \ln, \log_{b}, \cos, \sin,
 * \operatorname{tg}, скобки и умножение без знака.
 */

type Tok = { t: 'n'; v: number } | { t: 'x' } | { t: 'f'; v: string } | { t: 'op'; v: string };

/** TeX → простая запись: «((2)/(3))*x*sqrt(x)». */
function uprostit(tex: string): string {
  let s = tex.replace(/^\s*y\s*=\s*/, '');
  s = s
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\{,\}/g, '.')
    .replace(/\\cdot/g, '*')
    .replace(/\\,/g, '')
    .replace(/\\operatorname\{tg\}\s*x/g, 'tan(x)')
    .replace(/\\cos\s*x/g, 'cos(x)')
    .replace(/\\sin\s*x/g, 'sin(x)')
    .replace(/\\ln\s*x/g, 'ln(x)')
    /* ln(x+a)^{n} — логарифм степени, а не степень логарифма. */
    .replace(/\\ln\(([^()]*)\)\^\{(\d+)\}/g, 'ln(abs(($1)^($2)))')
    .replace(/\\ln\(/g, 'ln(')
    .replace(/\\log_\{(\d+)\}\(/g, 'log$1(')
    .replace(/\\pi/g, 'pi');
  /* Вложенные \frac и \sqrt — изнутри наружу. */
  for (let i = 0; i < 20; i += 1) {
    const prev = s;
    s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))');
    s = s.replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)');
    s = s.replace(/e\^\{([^{}]*)\}/g, 'exp($1)');
    s = s.replace(/\^\{([^{}]*)\}/g, '^($1)');
    if (s === prev) break;
  }
  return s.replace(/\s+/g, '');
}

function tokeny(s: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i] as string;
    const num = /^\d+(\.\d+)?/.exec(s.slice(i));
    if (num) {
      out.push({ t: 'n', v: Number(num[0]) });
      i += num[0].length;
      continue;
    }
    const fn = /^(sqrt|ln|log\d+|exp|cos|sin|tan|abs|pi)/.exec(s.slice(i));
    if (fn) {
      if (fn[0] === 'pi') out.push({ t: 'n', v: Math.PI });
      else out.push({ t: 'f', v: fn[0] });
      i += fn[0].length;
      continue;
    }
    if (ch === 'x') {
      out.push({ t: 'x' });
      i += 1;
      continue;
    }
    if ('+-*/^()'.includes(ch)) {
      out.push({ t: 'op', v: ch });
      i += 1;
      continue;
    }
    throw new Error(`texCalc: непонятный знак «${ch}» в «${s}»`);
  }
  return out;
}

/** Функция по записи в TeX. Бросает ошибку, если запись непонятна. */
export function funkciyaIzTex(tex: string): (x: number) => number {
  const toks = tokeny(uprostit(tex));
  return (x: number) => {
    let pos = 0;
    const peek = () => toks[pos];
    const isOp = (v: string) => {
      const t = peek();
      return t !== undefined && t.t === 'op' && t.v === v;
    };
    const startsAtom = () => {
      const t = peek();
      return t !== undefined && (t.t !== 'op' || t.v === '(');
    };
    function expr(): number {
      let v = term();
      while (isOp('+') || isOp('-')) {
        const op = (toks[pos++] as { v: string }).v;
        const r = term();
        v = op === '+' ? v + r : v - r;
      }
      return v;
    }
    function term(): number {
      let v = unary();
      for (;;) {
        if (isOp('*') || isOp('/')) {
          const op = (toks[pos++] as { v: string }).v;
          const r = unary();
          v = op === '*' ? v * r : v / r;
        } else if (startsAtom()) {
          v *= power();
        } else return v;
      }
    }
    function unary(): number {
      if (isOp('-')) {
        pos += 1;
        return -unary();
      }
      return power();
    }
    function power(): number {
      const b = atom();
      if (isOp('^')) {
        pos += 1;
        return b ** unary();
      }
      return b;
    }
    function atom(): number {
      const t = toks[pos++];
      if (t === undefined) throw new Error('texCalc: формула оборвалась');
      if (t.t === 'n') return t.v;
      if (t.t === 'x') return x;
      if (t.t === 'op' && t.v === '(') {
        const v = expr();
        pos += 1;
        return v;
      }
      if (t.t === 'f') {
        pos += 1; // «(»
        const a = expr();
        pos += 1; // «)»
        if (t.v.startsWith('log')) return Math.log(a) / Math.log(Number(t.v.slice(3)));
        const F: Record<string, (z: number) => number> = {
          sqrt: Math.sqrt,
          ln: Math.log,
          exp: Math.exp,
          cos: Math.cos,
          sin: Math.sin,
          tan: Math.tan,
          abs: Math.abs,
        };
        return (F[t.v] as (z: number) => number)(a);
      }
      throw new Error(`texCalc: неожиданный знак «${t.v}»`);
    }
    const v = expr();
    if (pos !== toks.length) throw new Error('texCalc: лишние знаки в конце');
    return v;
  };
}
