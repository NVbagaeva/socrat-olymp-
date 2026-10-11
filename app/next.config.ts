import path from 'node:path';
import type { NextConfig } from 'next';
import { assetVersions } from './scripts/lib/asset-versions.mjs';
import { generatorVersions } from './scripts/lib/generator-versions.mjs';

/* Служебные страницы прототипов (page.dev.tsx, сейчас — /dev/intro)
   есть только в `next dev` и в сборке с INTRO_DEV_PAGES=1 (запись видео
   и статичного кадра). В обычной сборке их нет: файл page.dev.tsx для
   Next.js не страница, и адрес отдаёт 404 — это проверяет
   test:dev-pages в CI. */
const devPages = process.env.NODE_ENV !== 'production' || process.env.INTRO_DEV_PAGES === '1';

const nextConfig: NextConfig = {
  pageExtensions: devPages ? ['dev.tsx', 'tsx', 'ts', 'jsx', 'js'] : ['tsx', 'ts', 'jsx', 'js'],
  /* Сборка с прототипами не должна затереть настоящую в out/. */
  ...(process.env.INTRO_DEV_PAGES === '1' ? { distDir: '.next-dev' } : {}),
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
