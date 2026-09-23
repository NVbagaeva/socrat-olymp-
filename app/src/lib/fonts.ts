import localFont from 'next/font/local';

/**
 * Inter из @fontsource/inter, по одному файлу на начертание.
 * Поддиапазоны latin, latin-ext, cyrillic и cyrillic-ext слиты в один woff2:
 * next/font/local объявляет один @font-face на файл и не умеет unicode-range.
 */
export const inter = localFont({
  src: [
    { path: '../fonts/inter-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/inter-500.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/inter-600.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/inter-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

/**
 * Caveat для рукописных пометок — файл из @fontsource/caveat 5.2.8,
 * подмножество cyrillic, обычное начертание. Пакет в зависимости не
 * добавлен, в репозитории лежит только сам woff2, поэтому версия и
 * подмножество записаны прямо в имени файла.
 *
 * В подмножестве cyrillic нет латиницы и цифр: символы вне кириллицы
 * браузер отрисует запасным cursive из токена --font-hand.
 */
export const caveat = localFont({
  src: [
    { path: '../fonts/caveat_5.2.8_cyrillic-400-normal.woff2', weight: '400', style: 'normal' },
  ],
  variable: '--font-caveat',
  display: 'swap',
  fallback: ['cursive'],
});

/**
 * PT Serif — антиква условий и разборов на карточке задачи: так
 * набран учебник, и так утверждён макет карточки. Обычное и курсивное
 * начертания одного веса: курсив нужен буквам-обозначениям (x, l) на
 * чертежах и подписям к ним, жирного в макете нет.
 *
 * Файлы собраны из PT_Serif-Web-Regular.ttf и PT_Serif-Web-Italic.ttf
 * (репозиторий google/fonts, OFL) командой pyftsubset: поддиапазоны
 * latin, latin-ext, cyrillic, cyrillic-ext и знаки сравнения ≤ ≥ ≠ ≈
 * в одном woff2 на начертание — по той же причине, что и у Inter.
 */
export const ptSerif = localFont({
  src: [
    { path: '../fonts/pt-serif-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/pt-serif-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-pt-serif',
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});
