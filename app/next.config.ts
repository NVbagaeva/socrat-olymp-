import path from 'node:path';
import type { NextConfig } from 'next';
import { assetVersions } from './scripts/lib/asset-versions.mjs';
import { generatorVersions } from './scripts/lib/generator-versions.mjs';

/* Служебные страницы (page.dev.tsx) — только для разработки: галерея
   банка №12 показывает ответы и в сборку сайта попадать не должна.
   Страницами они становятся в `next dev` или с флагом GALEREYA=1; в
   обычной сборке Next их не видит, и маршрута нет (404). Проверка —
   scripts/check-galereya-12.mjs. */
const devPages = process.env.NODE_ENV === 'development' || process.env.GALEREYA === '1';

const nextConfig: NextConfig = {
  // Статический экспорт: деплой на обычный хостинг, не Vercel.
  output: 'export',
  pageExtensions: devPages ? ['dev.tsx', 'tsx', 'ts', 'jsx', 'js'] : ['tsx', 'ts', 'jsx', 'js'],
  // При экспорте оптимизация изображений недоступна.
  images: { unoptimized: true },
  // Каждая страница выгружается папкой с index.html — так путь работает без правил сервера.
  trailingSlash: true,
  reactStrictMode: true,
  // Версии файлов из public/ (PDF, картинки): хеш содержимого, считается
  // на каждой сборке. lib/assetUrl.ts добавляет его к ссылке как ?v=…,
  // чтобы перезалитый под тем же именем файл не залипал в годовом кеше.
  env: {
    ASSET_VERSIONS: JSON.stringify(assetVersions(path.join(process.cwd(), 'public'))),
    // Версии генераторов листов: вторая половина кода комплекта
    // (lib/komplekt.ts). Хеш исходников движка — считается на сборке.
    GENERATOR_VERSIONS: JSON.stringify(generatorVersions(path.join(process.cwd(), 'src'))),
  },
};

export default nextConfig;
