import localFont from 'next/font/local';

/**
 * Шрифты «Чертежа»: Onest Variable (ось wght) — весь текст, JetBrains Mono
 * — только цифры номеров (файл урезан до цифр и знаков). Только этой
 * страницы: next/font предзагружает файлы лишь на маршруте, где шрифт
 * объявлен.
 *
 * Латиница и кириллица Onest — разные файлы и разные семейства: next/font
 * не умеет unicode-range. Кириллица в стеке первой и без запасного шрифта,
 * запасной с подогнанными метриками — у латиницы. Caveat для ремарки уже
 * загружен сайтом (--font-caveat).
 */
export const onestKirillica = localFont({
  src: '../../../fonts/demo/onest-cyrillic-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-chertyozh-kir',
  display: 'swap',
  adjustFontFallback: false,
});

export const onestLatinica = localFont({
  src: '../../../fonts/demo/onest-latin-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-chertyozh-lat',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

export const monoCifry = localFont({
  src: '../../../fonts/demo/jetbrains-mono-cifry-wght.woff2',
  weight: '100 800',
  variable: '--font-chertyozh-cifry',
  display: 'swap',
  adjustFontFallback: false,
});
