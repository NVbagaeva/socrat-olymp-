import type { MetadataRoute } from 'next';

/* Статический экспорт: маршрут собирается в файл на сборке. */
export const dynamic = 'force-static';

/**
 * Манифест веб-приложения: /manifest.webmanifest.
 *
 * Название и значки — те же, что в шапке и во вкладке браузера:
 * поисковик и телефон видят один и тот же бренд «Будет на ЕГЭ».
 * Файлы значков лежат в public/ под постоянными именами.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Будет на ЕГЭ — подготовка к ЕГЭ по профильной математике',
    short_name: 'Будет на ЕГЭ',
    description:
      'Онлайн-платформа для подготовки к ЕГЭ по профильной математике: теория, задания, тренажёры и генератор задач.',
    start_url: '/',
    display: 'standalone',
    lang: 'ru',
    background_color: '#ffffff',
    theme_color: '#1f5fd0',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
