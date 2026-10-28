import localFont from 'next/font/local';

/**
 * Inter 4 Variable (оси wght и opsz) — шрифт «Стеклянной сцены».
 * Только этой страницы: next/font предзагружает файлы лишь на маршруте,
 * где шрифт объявлен.
 *
 * Латиница и кириллица — разные файлы и разные семейства: next/font не
 * умеет unicode-range. В стеке кириллица стоит первой и без запасного
 * шрифта — иначе запасной перехватил бы латиницу и цифры. Запасной с
 * подогнанными метриками — у латиницы, он и держит строку до загрузки.
 */
export const interKirillica = localFont({
  src: '../../../fonts/demo/inter-cyrillic-opsz-normal.woff2',
  weight: '100 900',
  variable: '--font-steklo-kir',
  display: 'swap',
  adjustFontFallback: false,
});

export const interLatinica = localFont({
  src: '../../../fonts/demo/inter-latin-opsz-normal.woff2',
  weight: '100 900',
  variable: '--font-steklo-lat',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});
