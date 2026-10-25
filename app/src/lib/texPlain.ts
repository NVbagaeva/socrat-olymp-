/**
 * Формула обычным текстом — без KaTeX.
 *
 * Модуль отдельно от lib/tex.ts намеренно: его берут клиентские экраны
 * (подпись чертежа, aria-label), и KaTeX в их сборку тянуть незачем.
 */

/**
 * Тот же текст без разметки — для мест, где KaTeX не набрать:
 * заголовок вкладки браузера, подсказка title, aria-label. Формула
 * пишется обычными знаками: \dfrac{k}{x} → k/x, \cdot → ·.
 */
export function texPlain(text: string): string {
  return text.replace(/\$([^$]+)\$/g, (_match, formula: string) => plainFormula(formula));
}

/* Нижние индексы, для которых есть знак Юникода. */
const SUB: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  a: 'ₐ',
  e: 'ₑ',
  o: 'ₒ',
  x: 'ₓ',
};

function plainFormula(tex: string): string {
  let out = tex;
  /* Дроби изнутри наружу: в числителе может быть своя дробь. */
  for (let i = 0; i < 4; i += 1) {
    out = out.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_m, a: string, b: string) => {
      const wrap = (v: string) => (/^[\w.,]+$/.test(v) ? v : `(${v})`);
      return `${wrap(a)}/${wrap(b)}`;
    });
  }
  return (
    out
      .replace(/\\cdot/g, '·')
      .replace(/\\times/g, '×')
      .replace(/\\le(?:q)?(?![a-z])/g, '≤')
      .replace(/\\ge(?:q)?(?![a-z])/g, '≥')
      .replace(/\\ne(?:q)?(?![a-z])/g, '≠')
      .replace(/\\pi/g, 'π')
      .replace(/\\alpha/g, 'α')
      .replace(/\\Delta\s*/g, 'Δ')
      .replace(/\\sqrt\{([^{}]*)\}/g, '√$1')
      .replace(/\{,\}/g, ',')
      .replace(/\\[,;:! ]|\\quad|\\qquad/g, ' ')
      .replace(/\\text\{([^{}]*)\}/g, '$1')
      /* Имена функций остаются словами: \sin\alpha → sin α, \log_a x → logₐ x. */
      .replace(/\\operatorname\{([^{}]*)\}\s*/g, '$1 ')
      .replace(
        /(\w?)\\(arcsin|arccos|arctg|arcctg|sin|cos|tg|ctg|tan|cot|log|ln|lg|exp)(?![a-zA-Z])\s*/g,
        (_m, before: string, name: string) => `${before === '' ? '' : `${before} `}${name} `,
      )
      .replace(/ _(?:\{(\w)\}|(\w))\s*/g, (_m, a: string | undefined, b: string | undefined) => {
        const ch = a ?? b ?? '';
        return `${SUB[ch] ?? `_${ch}`} `;
      })
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/[{}]/g, '')
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³')
      .replace(/-/g, '−')
      .replace(/\s+/g, ' ')
      .trim()
  );
}
