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

/* ── Выкладка: формула, которая рвётся по правилам тетради ──────── */

/** Знак между атомами выкладки. */
export type ZnakVykladki = '=' | '+' | '-';

/**
 * Атом выкладки: кусок формулы между знаками и знак перед ним.
 *
 * Уровень разрыва перед атомом: 1 — по знаку «=», предпочтительно;
 * 2 — по «+» или «−», только когда кусок между двумя «=» не влезает
 * в строку целиком; 0 — рвать нельзя (перед атомом стоит одно
 * обозначение вроде «P =», и обрубок из него в строке не оставляют).
 */
export interface AtomVykladki {
  /** Вёрстка KaTeX самого куска, без знаков по краям. */
  html: string;
  /** Знак перед атомом; у первого атома утверждения его нет. */
  znak?: ZnakVykladki;
  uroven?: 0 | 1 | 2;
}

/** Атомы утверждения: с TeX куска, ещё не набранного. */
interface Atom {
  tex: string;
  znak?: ZnakVykladki;
  uroven?: 0 | 1 | 2;
}

/** Разделитель самостоятельных выкладок в одном шаге: «,\\quad». */
const RAZDELITEL = /^[,;]\s*(?:\\quad|\\qquad|\\;|\\,|\\ )/;

/**
 * Самостоятельные выкладки шага. В шаблонах они стоят через запятую
 * или точку с запятой с отбивкой: «10 000 · 0,01 = 100,\\quad
 * 10 000 − 100 = 9900». Каждая начинается с новой строки, и знак «=»
 * между ними не дублируется — это не продолжение, а новое равенство.
 */
export function utverzhdeniya(formula: string): string[] {
  const chasti: string[] = [];
  let glubina = 0;
  let nachalo = 0;
  for (let i = 0; i < formula.length; i += 1) {
    const ch = formula[i];
    if (ch === '{' || ch === '(') {
      glubina += 1;
    } else if (ch === '}' || ch === ')') {
      glubina -= 1;
    } else if (glubina === 0) {
      const m = RAZDELITEL.exec(formula.slice(i));
      if (m !== null) {
        chasti.push(formula.slice(nachalo, i).trim());
        i += m[0].length - 1;
        nachalo = i + 1;
      }
    }
  }
  chasti.push(formula.slice(nachalo).trim());
  return chasti.filter((ch) => ch !== '');
}

/** Команды-операции: кусок с ними — выражение, а не обозначение. */
const OPERATSII = /\\(?:cdot|times|d?frac|sqrt)|[+\-]|\d/;

/**
 * Обозначение без единого слагаемого или множителя: «P», «P_k»,
 * «P(A + B)», «n». Строка из него и знака «=» бессмысленна, поэтому
 * разрыв после такого куска не ставится. Содержимое скобок и групп
 * не смотрится: «P(A + B)» — обозначение, хоть внутри и плюс.
 */
function oboznachenie(tex: string): boolean {
  let bez = '';
  let glubina = 0;
  for (const ch of tex) {
    if (ch === '{' || ch === '(') {
      glubina += 1;
    } else if (ch === '}' || ch === ')') {
      glubina -= 1;
    } else if (glubina === 0) {
      bez += ch;
    }
  }
  return !OPERATSII.test(bez);
}

/**
 * Утверждение атомами: рвётся по «=» верхнего уровня, а внутри куска
 * между двумя «=» — по «+» и бинарному «−». Знаки внутри скобок,
 * групп, дробей и \\text{} не считаются. Минус в начале куска или
 * после другого знака — унарный, по нему не рвут.
 */
function atomy(utverzhdenie: string): Atom[] {
  const rez: Atom[] = [];
  let glubina = 0;
  let nachalo = 0;
  let znak: ZnakVykladki | undefined;
  /* Был ли перед позицией операнд: только тогда «−» бинарный. */
  let operandByl = false;
  const zakryt = (konets: number, dalshe: ZnakVykladki) => {
    const tex = utverzhdenie.slice(nachalo, konets).trim();
    if (tex !== '') {
      rez.push(znak === undefined ? { tex } : { tex, znak, uroven: znak === '=' ? 1 : 2 });
      znak = dalshe;
      nachalo = konets + 1;
      operandByl = false;
    }
  };
  for (let i = 0; i < utverzhdenie.length; i += 1) {
    const ch = utverzhdenie[i];
    if (ch === '{' || ch === '(') {
      glubina += 1;
      operandByl = true;
    } else if (ch === '}' || ch === ')') {
      glubina -= 1;
      operandByl = true;
    } else if (glubina > 0) {
      continue;
    } else if (ch === '=' || ch === '+' || (ch === '-' && operandByl)) {
      zakryt(i, ch);
    } else if (ch !== ' ') {
      operandByl = true;
    }
  }
  zakryt(utverzhdenie.length, '=');
  if (rez.length > 0) {
    /* Хвост после последнего знака: закрывался с фиктивным «=». */
    znak = undefined;
  }
  /* Обозначение перед «=» не оставляют в строке одно: разрыв после
     него запрещён. Обозначение — это весь кусок от предыдущего «=»,
     и он из одного атома: «P(A) + P(B)» — уже выражение. */
  return rez.map((atom, i) => {
    if (atom.znak !== '=') {
      return atom;
    }
    const predydushchiy = rez[i - 1];
    const kusokIzOdnogo = i === 1 || rez[i - 2]?.znak === '=' || i - 2 < 0;
    return predydushchiy !== undefined && kusokIzOdnogo && oboznachenie(predydushchiy.tex)
      ? { ...atom, uroven: 0 }
      : atom;
  });
}

/**
 * Формула шага → выкладка: утверждения, каждое атомами с готовой
 * вёрсткой. Как из атомов собрать строки по ширине колонки, решает
 * браузер (VykladkaKlient); знаки между атомами он рисует сам.
 *
 * `vyklyuchnoy` — выключной набор: дроби и индексы в полный рост, как
 * у формулы отдельной строкой. Разборы набираются строчным: формула
 * там стоит в потоке шага. Пробы берут ту же вёрстку, что и строки,
 * поэтому примерка остаётся верной при любом из наборов.
 */
export function nabratVykladku(
  formula: string,
  strogo = false,
  vyklyuchnoy = false,
): AtomVykladki[][] {
  return utverzhdeniya(formula).map((u) =>
    atomy(u).map(({ tex, znak, uroven }) => ({
      html: typeset(`$${vyklyuchnoy ? `\\displaystyle ${tex}` : tex}$`, strogo),
      ...(znak === undefined ? {} : { znak }),
      ...(uroven === undefined ? {} : { uroven }),
    })),
  );
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
