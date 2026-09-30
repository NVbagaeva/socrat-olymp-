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
 * Греческие буквы Inter — отдельным файлом: в подмножествах выше их
 * нет, и без него слова παραβολή, ἔλλειψις, ὑπερβολή в исторической
 * врезке №12 отрисовал бы случайный системный шрифт, а буквы
 * с придыханием вроде ἔ и ὑ есть не в каждом.
 *
 * Файл собран из @fontsource/inter: подмножества greek (U+0370–03FF)
 * и greek-ext (U+1F00–1FFF), обычное начертание, слиты fontTools
 * в один woff2 — 11 КБ. Начертание одно: греческие слова встречаются
 * только в тексте врезки, жирным и курсивом их там нет.
 *
 * Запасных семейств у него нет намеренно — ни своих, ни подставленных
 * next/font. В стеке --font-grech это семейство стоит первым, и любое
 * запасное после него перехватывало бы кириллицу: в самом файле её
 * нет. Дальше в стеке идёт --font-sans, и кириллицу с латиницей
 * берёт из него Inter — подстановка идёт по буквам, не по строке.
 * Файл не предзагружается: preload повесил бы ссылку на него в
 * <head> каждой страницы сайта, а греческие буквы есть на одной.
 * Без предзагрузки браузер забирает файл тогда, когда встретит
 * букву, которую больше нечем нарисовать.
 */
export const interGreek = localFont({
  src: [{ path: '../fonts/inter-greek-400.woff2', weight: '400', style: 'normal' }],
  variable: '--font-inter-greek',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
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
