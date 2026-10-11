import path from 'node:path';
import type { NextConfig } from 'next';
import { assetVersions } from './scripts/lib/asset-versions.mjs';
import { generatorVersions } from './scripts/lib/generator-versions.mjs';

/* Служебные страницы-галереи банков (файлы page.dev.tsx) становятся
   маршрутами только в `next dev` или со флагом GALEREYA=1
   (GALEREYA_1=1, GALEREYA_9=1 и GALEREYA_10=1 — то же для заданий №1,
   №9 и №10). Галереи показывают ответы; в обычной сборке их нет —
   адрес отдаёт 404, это проверяют scripts/check-dev-pages.mjs и
   scripts/check-galereya-1.mjs. */
const devPages =
  process.env.NODE_ENV === 'development' ||
  process.env.GALEREYA === '1' ||
  process.env.GALEREYA_1 === '1' ||
  process.env.GALEREYA_9 === '1' ||
  process.env.GALEREYA_10 === '1';

const nextConfig: NextConfig = {
  pageExtensions: devPages ? ['dev.tsx', 'tsx', 'ts', 'jsx', 'js'] : ['tsx', 'ts', 'jsx', 'js'],
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
