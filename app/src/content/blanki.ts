/**
 * Бланки ЕГЭ для блока «Бланки» (components/blanki/BlankiEge.tsx).
 *
 * Новый год — новые файлы: положить общий PDF бланков в
 * `pnpm build:blanki <Бланки-ГГГГ.pdf> ГГГГ` (страницы разложатся по
 * app/public/blanki/ГГГГ/ под теми же именами, на лист A4) и поменять
 * здесь BLANKI_YEAR. Больше ничего менять не нужно.
 */

export const BLANKI_YEAR = 2026;

/** Папка файлов бланков в public/. */
export const BLANKI_DIR = `/blanki/${BLANKI_YEAR}/`;

/** Страницы бланков: по файлу на страницу, каждая на лист A4. */
export const BLANKI_FILES = {
  registraciya: 'registraciya.pdf',
  otvety1: 'otvety-1.pdf',
  otvety2list1: 'otvety-2-list-1.pdf',
  otvety2list2: 'otvety-2-list-2.pdf',
  dop2: 'dop-otvety-2.pdf',
} as const;

export type BlankPart = keyof typeof BLANKI_FILES;

export interface BlankKit {
  id: string;
  label: string;
  /** Мелкая строка под кнопкой. */
  note?: string;
  /** Страницы файла по порядку. */
  parts: BlankPart[];
  /** Главная кнопка блока. */
  main?: boolean;
  /** У кнопки поле «Количество копий». */
  copies?: boolean;
  /** Имя скачанного файла без «.pdf» — латиницей: кириллицу в имени
      скачанного файла браузеры понимают не все. */
  file: string;
}

export const BLANKI_KITS: readonly BlankKit[] = [
  {
    id: 'otvety1',
    label: 'Бланк ответов № 1',
    parts: ['otvety1'],
    main: true,
    copies: true,
    file: `ege-${BLANKI_YEAR}-blank-otvetov-1`,
  },
  {
    id: 'registraciya',
    label: 'Бланк регистрации',
    parts: ['registraciya'],
    file: `ege-${BLANKI_YEAR}-blank-registracii`,
  },
  {
    id: 'otvety2',
    label: 'Бланк ответов № 2 (лист 1 и 2)',
    parts: ['otvety2list1', 'otvety2list2'],
    file: `ege-${BLANKI_YEAR}-blank-otvetov-2`,
  },
  {
    id: 'dop2',
    label: 'Дополнительный бланк № 2',
    parts: ['dop2'],
    file: `ege-${BLANKI_YEAR}-dop-blank-otvetov-2`,
  },
  {
    id: 'komplekt1',
    label: 'Комплект для первой части',
    note: 'регистрация + № 1',
    parts: ['registraciya', 'otvety1'],
    file: `ege-${BLANKI_YEAR}-komplekt-chast-1`,
  },
  {
    id: 'ves',
    label: 'Весь комплект',
    note: 'все 5 страниц',
    parts: ['registraciya', 'otvety1', 'otvety2list1', 'otvety2list2', 'dop2'],
    file: `ege-${BLANKI_YEAR}-komplekt-blankov`,
  },
];

export const BLANKI_TEXT = {
  title: `Бланки ЕГЭ-${BLANKI_YEAR}`,
  lead: 'Официальные бланки — отдельно от вариантов: в листы они не входят.',
  copies: 'Количество копий',
  copiesNote: (n: number) => `по числу вариантов — ${n}`,
  busy: 'Собираем файл…',
  failed: 'Не удалось собрать файл. Проверьте связь и попробуйте ещё раз.',
  print: 'Печатать на A4 в масштабе 100 %',
  copiesMax: 40,
} as const;
