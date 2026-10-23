/**
 * Блоки разбора задач на проценты: краткая запись, пропорция,
 * правило пропорции, сокращение, признаки делимости, плашка-акцент,
 * справка «Правило 100 %».
 *
 * Разбор хранится строками (Etap.lines), их видят тренажёр, опорные
 * задачи, листы учителя и служебные страницы. Блок — тоже строка:
 * невидимый маркер и JSON. Все места вывода рисуют такую строку одним
 * общим рендером (./html.ts), а проверки читают её текст через
 * tekstyBloka — как обычные строки с формулами.
 */

/** Клетка краткой записи или член пропорции. */
export interface Yach {
  /** TeX без долларов: «100\\%», «41\\,760». */
  tex: string;
  /** Неизвестное: «?» или буква после замены. */
  neizv?: '?' | 'x' | 'y';
  /** Единица в скобках после числа: «руб.». */
  ed?: string;
  /** Неизвестный процент: после буквы знак «%» («? %», «x %»). */
  pct?: boolean;
}

export interface ZapisStroka {
  l: Yach;
  r: Yach;
  /** Пояснение справа мелким шрифтом: «после налога». */
  note?: string;
}

/** Шаг сокращения: пояснение и выкладка, числа — для проверки. */
export interface ShagSokr {
  tekst: string;
  /** Выкладка TeX без долларов (может быть пустой). */
  tex: string;
  /** На что сократили (1 — шаг без сокращения: разложение, деление). */
  na: number;
}

export type Blok =
  | { vid: 'zapis'; stroki: ZapisStroka[]; zamena?: boolean }
  | {
      vid: 'proporciya';
      a: string;
      b: string;
      c: string;
      d: string;
      /** Подписи под дробями: из какого столбца записи. */
      podpisi?: [string, string];
      /** Какой член неизвестен (подсвечивается). */
      neizv?: 'a' | 'b' | 'c' | 'd';
    }
  | {
      vid: 'pravilo';
      a: string;
      b: string;
      c: string;
      d: string;
      neizv: 'a' | 'b' | 'c' | 'd';
      /** Равенство «произведение крайних = произведению средних» TeX. */
      ravenstvo: string;
      /** Выражение неизвестного TeX: «x=\\dfrac{100\\cdot41\\,760}{87}». */
      vyrazhenie: string;
    }
  | {
      vid: 'sokr';
      shagi: ShagSokr[];
      /** Исходные множители числителя, знаменатель, итог — для проверки. */
      chislitel: number[];
      znamenatel: number;
      itog: number;
    }
  | { vid: 'priznaki' }
  | { vid: 'plashka'; tekst: string }
  | { vid: 'spravka100' };

/** Маркер строки-блока: невидимый разделитель (U+2063) и слово. */
export const MARKER = '⁣blok:';

export const blokStroka = (b: Blok): string => MARKER + JSON.stringify(b);

export function izStroki(line: string): Blok | null {
  return line.startsWith(MARKER) ? (JSON.parse(line.slice(MARKER.length)) as Blok) : null;
}

const yachTekst = (y: Yach): string =>
  `$${y.neizv ?? y.tex}${y.pct ? '\\,\\%' : ''}$${y.ed ? ` (${y.ed})` : ''}`;

/** Тексты блока для проверок: формулы в $…$, как в обычных строках. */
export function tekstyBloka(b: Blok): string[] {
  switch (b.vid) {
    case 'zapis':
      return b.stroki.map(
        (s) => `${yachTekst(s.l)} — ${yachTekst(s.r)}${s.note ? ` ${s.note}` : ''}`,
      );
    case 'proporciya':
      return [`$\\dfrac{${b.a}}{${b.b}}=\\dfrac{${b.c}}{${b.d}}$`, ...(b.podpisi ?? [])];
    case 'pravilo':
      return [`$${b.ravenstvo}$`, `$${b.vyrazhenie}$`];
    case 'sokr':
      return b.shagi.flatMap((s) => [s.tekst, ...(s.tex ? [`$${s.tex}$`] : [])]);
    case 'plashka':
      return [b.tekst];
    case 'priznaki':
    case 'spravka100':
      return [];
  }
}

/** Строка разбора → тексты для проверок (обычная строка — как есть). */
export function tekstyStroki(line: string): string[] {
  const b = izStroki(line);
  return b === null ? [line] : tekstyBloka(b);
}
