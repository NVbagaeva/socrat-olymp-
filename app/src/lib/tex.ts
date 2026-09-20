/**
 * Формулы внутри обычного текста.
 *
 * Условия задач хранятся строкой, а формулы в них помечены знаками
 * доллара: «Диагональ куба равна $\sqrt{12}$». Здесь эта разметка
 * превращается в готовый HTML на сборке: KaTeX отрабатывает при
 * сборке страницы, в браузер уходит только вёрстка.
 *
 * Модуль отдельный, чтобы у стереометрии не появилось своей второй
 * такой функции: набор формул в проекте один.
 */

import { katex } from './graph/katex';

/**
 * Текст с формулами → HTML: $...$ набирается KaTeX. `strogo` — ошибка
 * TeX роняет набор, а не оставляет формулу текстом: так набираются
 * разборы заданий №4 и №5, у которых формула обязана собраться.
 */
export function typeset(text: string, strogo = false): string {
  return text.replace(/\$([^$]+)\$/g, (_match, formula: string) =>
    katex.renderToString(formula, { throwOnError: strogo, displayMode: false }),
  );
}

/**
 * Формула кусками по знаку «=»: разрыв допустим только на нём.
 *
 * Знак на разрыве пишется дважды, как в тетради: кусок до разрыва
 * кончается на «=», кусок после — начинается с него. Считаются
 * только знаки верхнего уровня: внутри скобок и групп — например,
 * в \\text{...} или \\dfrac{}{} — формула не рвётся. Формула без «=»
 * — один кусок.
 */
export function kuskiPoRavno(formula: string): string[] {
  const kuski: string[] = [];
  let glubina = 0;
  let nachalo = 0;
  for (let i = 0; i < formula.length; i += 1) {
    const ch = formula[i];
    if (ch === '{' || ch === '(') {
      glubina += 1;
    } else if (ch === '}' || ch === ')') {
      glubina -= 1;
    } else if (ch === '=' && glubina === 0 && i > nachalo) {
      kuski.push(`${formula.slice(nachalo, i).trim()} =`);
      nachalo = i;
    }
  }
  kuski.push(formula.slice(nachalo).trim());
  return kuski.filter((kusok) => kusok !== '' && kusok !== '=');
}

/**
 * Куски выкладки готовой вёрсткой: каждый набирается KaTeX отдельно,
 * со своими знаками «=» по краям. Как из кусков собрать строки —
 * решает браузер по ширине колонки (VykladkaKlient): лишний знак на
 * стыке двух кусков в одной строке он прячет стилем.
 */
export function nabratKuski(kuski: readonly string[], strogo = false): string[] {
  return kuski.map((kusok) => typeset(`$${kusok}$`, strogo));
}

/**
 * Строки выкладки одной строкой.
 *
 * В данных формула хранится строками с разрывами по знаку «=», и на
 * разрыве знак стоит дважды — в конце строки и в начале следующей.
 * Когда формула помещается целиком, она показывается одной строкой,
 * и второй знак на стыке лишний: он снимается здесь. Строки, не
 * начинающиеся со знака, склеиваются как есть.
 */
export function odnoyStrokoy(stroki: readonly string[]): string {
  return stroki.reduce((formula, stroka) => {
    const dalshe = stroka.trim();
    const dubl = formula.trimEnd().endsWith('=') && dalshe.startsWith('=');
    return `${formula} ${dubl ? dalshe.slice(1).trim() : dalshe}`;
  });
}

/**
 * Тот же текст словами: для alt, заголовков и голосового доступа.
 * Читать «доллар слэш sqrt» вслух нельзя, поэтому корень
 * проговаривается словами.
 */
export function plain(text: string): string {
  return text.replace(/\$([^$]+)\$/g, (_match, formula: string) =>
    formula
      .replace(/\\sqrt\{([^}]*)\}/g, 'корень из $1')
      .replace(/[{}\\]/g, '')
      .trim(),
  );
}
