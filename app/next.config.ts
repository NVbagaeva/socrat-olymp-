import path from 'node:path';
import type { NextConfig } from 'next';
import { assetVersions } from './scripts/lib/asset-versions.mjs';
import { generatorVersions } from './scripts/lib/generator-versions.mjs';

const nextConfig: NextConfig = {
  // Статический экспорт: деплой на обычный хостинг, не Vercel.
  output: 'export',
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
