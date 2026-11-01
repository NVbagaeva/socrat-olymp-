/**
 * Формула TeX → читаемый текст: для <title>, description, подписей
 * формул (aria-label) и текста заголовков для поиска.
 *
 *   «Логарифм по основанию $\tfrac{1}{a}$» → «Логарифм по основанию 1/a»
 *   «$x^2 + \sqrt{x} \le 3$»               → «x² + √x ≤ 3»
 *   «Увеличить на $r\,\%$ — умножить на $k$» → «Увеличить на r % — умножить на k»
 *
 * Без KaTeX и без Node: модуль импортируют и страницы, и браузер.
 * Цель — строка, которую можно прочитать и найти поиском; набор
 * формулы на экране делает KaTeX, этот текст его не заменяет.
 */

/** @type {Record<string, string>} */
const SUP = {
  0: '⁰',
  1: '¹',
  2: '²',
  3: '³',
  4: '⁴',
  5: '⁵',
  6: '⁶',
  7: '⁷',
  8: '⁸',
  9: '⁹',
  '+': '⁺',
  '-': '⁻',
  '−': '⁻',
  n: 'ⁿ',
  x: 'ˣ',
};
/** @type {Record<string, string>} */
const SUB = {
  a: 'ₐ',
  e: 'ₑ',
  o: 'ₒ',
  x: 'ₓ',
  n: 'ₙ',
  i: 'ᵢ',
  k: 'ₖ',
  m: 'ₘ',
  '+': '₊',
  '-': '₋',
  '−': '₋',
  0: '₀',
  1: '₁',
  2: '₂',
  3: '₃',
  4: '₄',
  5: '₅',
  6: '₆',
  7: '₇',
  8: '₈',
  9: '₉',
};

/** @type {Record<string, string>} */
const SIMVOLY = {
  iff: '⇔',
  Longleftrightarrow: '⇔',
  longleftrightarrow: '⟷',
  Longrightarrow: '⇒',
  implies: '⇒',
  Leftarrow: '⇐',
  leftarrow: '←',
  mapsto: '↦',
  Phi: 'Φ',
  ell: 'ℓ',
  Gamma: 'Γ',
  Lambda: 'Λ',
  Pi: 'Π',
  Psi: 'Ψ',
  psi: 'ψ',
  zeta: 'ζ',
  kappa: 'κ',
  Theta: 'Θ',
  vartheta: 'θ',
  varrho: 'ρ',
  iota: 'ι',
  upsilon: 'υ',
  nabla: '∇',
  partial: '∂',
  forall: '∀',
  exists: '∃',
  neg: '¬',
  land: '∧',
  lor: '∨',
  wedge: '∧',
  vee: '∨',
  setminus: '∖',
  supset: '⊃',
  subseteq: '⊆',
  supseteq: '⊇',
  cdotp: '·',
  bullet: '•',
  star: '⋆',
  ast: '∗',
  propto: '∝',
  equiv: '≡',
  cong: '≅',
  simeq: '≃',
  lt: '<',
  gt: '>',
  mid: '∣',
  vert: '|',
  Vert: '‖',
  lvert: '|',
  rvert: '|',
  langle: '⟨',
  rangle: '⟩',
  lfloor: '⌊',
  rfloor: '⌋',
  lceil: '⌈',
  rceil: '⌉',
  sum: 'Σ',
  prod: 'Π',
  int: '∫',
  deg: '°',
  hbar: 'ℏ',
  arcctg: 'arcctg',
  sh: 'sh',
  ch: 'ch',
  exp: 'exp',
  mod: 'mod',
  cdot: '·',
  times: '×',
  div: ':',
  pm: '±',
  mp: '∓',
  le: '≤',
  leq: '≤',
  leqslant: '≤',
  ge: '≥',
  geq: '≥',
  geqslant: '≥',
  ne: '≠',
  neq: '≠',
  approx: '≈',
  sim: '∼',
  infty: '∞',
  to: '→',
  rightarrow: '→',
  Rightarrow: '⇒',
  Leftrightarrow: '⇔',
  in: '∈',
  notin: '∉',
  cup: '∪',
  cap: '∩',
  subset: '⊂',
  varnothing: '∅',
  emptyset: '∅',
  angle: '∠',
  perp: '⊥',
  parallel: '∥',
  circ: '°',
  degree: '°',
  ldots: '…',
  dots: '…',
  cdots: '…',
  prime: '′',
  triangle: '△',
  square: '□',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  Delta: 'Δ',
  varepsilon: 'ε',
  epsilon: 'ε',
  pi: 'π',
  varphi: 'φ',
  phi: 'φ',
  mu: 'μ',
  nu: 'ν',
  lambda: 'λ',
  sigma: 'σ',
  Sigma: 'Σ',
  omega: 'ω',
  Omega: 'Ω',
  theta: 'θ',
  rho: 'ρ',
  tau: 'τ',
  xi: 'ξ',
  eta: 'η',
  chi: 'χ',
  log: 'log',
  ln: 'ln',
  lg: 'lg',
  sin: 'sin',
  cos: 'cos',
  tg: 'tg',
  ctg: 'ctg',
  tan: 'tg',
  cot: 'ctg',
  arcsin: 'arcsin',
  arccos: 'arccos',
  arctg: 'arctg',
  max: 'max',
  min: 'min',
  lim: 'lim',
  percent: '%',
};

/** Содержимое группы {…} с учётом вложенности, начиная с позиции открывающей скобки. */
/**
 * @param {string} s
 * @param {number} start
 * @returns {[string, number]}
 */
function gruppa(s, start) {
  if (s[start] !== '{') {
    /* Один знак без скобок: \frac12, x^2. Команда — целиком. */
    if (s[start] === '\\') {
      const m = /^\\[A-Za-z]+/.exec(s.slice(start));
      if (m !== null) return [m[0], start + m[0].length];
    }
    return [s[start] ?? '', start + 1];
  }
  let depth = 0;
  for (let i = start; i < s.length; i += 1) {
    if (s[i] === '{') depth += 1;
    else if (s[i] === '}') {
      depth -= 1;
      if (depth === 0) return [s.slice(start + 1, i), i + 1];
    }
  }
  return [s.slice(start + 1), s.length];
}

/** Сложное выражение в дроби или степени — в скобках: (n+1)/2. */
/** @param {string} t */
function vSkobkah(t) {
  return /^[\p{L}\p{N}.,′°]+$/u.test(t) || /^\(.*\)$/.test(t) ? t : `(${t})`;
}

/** @param {string} t */
function stepen(t) {
  return [...t].every((ch) => SUP[ch] !== undefined)
    ? [...t].map((ch) => SUP[ch]).join('')
    : `^${vSkobkah(t)}`;
}

/** @param {string} t */
function indeks(t) {
  return [...t].every((ch) => SUB[ch] !== undefined)
    ? [...t].map((ch) => SUB[ch]).join('')
    : `_${vSkobkah(t)}`;
}

/** Сама формула TeX (без $) → текст. */
/**
 * @param {string} tex
 * @returns {string}
 */
export function formulaVTekst(tex) {
  let out = '';
  let i = 0;
  const s = tex;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '\\') {
      const m = /^\\([A-Za-z]+|.)/.exec(s.slice(i));
      const cmd = m?.[1] ?? '';
      i += 1 + cmd.length;
      if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac' || cmd === 'cfrac') {
        const [a, j] = gruppa(s, i);
        const [b, k] = gruppa(s, j);
        out += `${vSkobkah(formulaVTekst(a))}/${vSkobkah(formulaVTekst(b))}`;
        i = k;
      } else if (cmd === 'sqrt') {
        let pokaz = '';
        if (s[i] === '[') {
          const end = s.indexOf(']', i);
          pokaz = s.slice(i + 1, end);
          i = end + 1;
        }
        const [a, j] = gruppa(s, i);
        const t = formulaVTekst(a);
        out += `${pokaz === '' ? '' : stepen(pokaz)}√${vSkobkah(t)}`;
        i = j;
      } else if (
        [
          'text',
          'mathrm',
          'textbf',
          'mathbf',
          'boldsymbol',
          'operatorname',
          'mathit',
          'textit',
          'bm',
          'mbox',
          'vec',
          'overline',
          'overrightarrow',
          'arc',
          'hat',
          'bar',
          'widehat',
          'underline',
          'mathbb',
        ].includes(cmd)
      ) {
        const [a, j] = gruppa(s, i);
        const t = cmd.startsWith('text') || cmd === 'mbox' ? a : formulaVTekst(a);
        out += cmd === 'vec' || cmd === 'overrightarrow' ? `${t}⃗` : cmd === 'arc' ? `дуга ${t}` : t;
        i = j;
      } else if (cmd === 'begin' || cmd === 'end') {
        /* Имя окружения ({cases}, {array}{cc}) — не текст. */
        let [, j] = gruppa(s, i);
        while (s[j] === '{') [, j] = gruppa(s, j);
        i = j;
        out += cmd === 'end' ? ' ' : '';
      } else if (cmd === '\\') {
        out += '; ';
      } else if (
        cmd === 'left' ||
        cmd === 'right' ||
        cmd === 'big' ||
        cmd === 'Big' ||
        cmd === 'bigl' ||
        cmd === 'bigr' ||
        cmd === 'displaystyle' ||
        cmd === 'textstyle' ||
        cmd === 'limits' ||
        cmd === 'nolimits'
      ) {
        /* размер скобок и стиль — не текст */
      } else if (
        cmd === ',' ||
        cmd === ';' ||
        cmd === ':' ||
        cmd === ' ' ||
        cmd === 'quad' ||
        cmd === 'qquad' ||
        cmd === '!' ||
        cmd === 'enspace' ||
        cmd === 'thinspace'
      ) {
        out += cmd === '!' ? '' : ' ';
      } else if (
        cmd === '%' ||
        cmd === '{' ||
        cmd === '}' ||
        cmd === '$' ||
        cmd === '&' ||
        cmd === '#' ||
        cmd === '_'
      ) {
        out += cmd;
      } else if (cmd === 'lbrace') out += '{';
      else if (cmd === 'rbrace') out += '}';
      else if (SIMVOLY[cmd] !== undefined) {
        const sym = SIMVOLY[cmd];
        out += /^[a-z]+$/.test(sym) ? `${sym} ` : sym;
      } else {
        /* Неизвестная команда: её имя — не текст. */
      }
    } else if (ch === '^') {
      const [a, j] = gruppa(s, i + 1);
      out = out.trimEnd() + stepen(formulaVTekst(a));
      i = j;
    } else if (ch === '_') {
      const [a, j] = gruppa(s, i + 1);
      out = out.trimEnd() + indeks(formulaVTekst(a));
      i = j;
    } else if (ch === '{' || ch === '}') {
      /* {,} — десятичная запятая; прочие скобки группы не видны */
      if (s.startsWith('{,}', i)) {
        out += ',';
        i += 3;
        continue;
      }
      i += 1;
    } else if (ch === '&') {
      out += ' ';
      i += 1;
    } else if (ch === '~') {
      out += ' ';
      i += 1;
    } else {
      out += ch === '-' ? '−' : ch;
      i += 1;
    }
  }
  return out
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:)²³⁰¹⁴⁵⁶⁷⁸⁹ⁿ₀₁₂₃₄₅₆₇₈₉])/g, '$1')
    .replace(/\(\s+/g, '(')
    .trim();
}

/** Текст с формулами в $…$ → тот же текст словами и знаками. */
/**
 * @param {string} text
 * @returns {string}
 */
export function tekstBezTex(text) {
  return text
    .replace(/\$\$([^$]+)\$\$|\$([^$]+)\$/g, (_m, a, b) => formulaVTekst(a ?? b ?? ''))
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
