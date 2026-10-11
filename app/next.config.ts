import path from 'node:path';
import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import { assetVersions } from './scripts/lib/asset-versions.mjs';
import { generatorVersions } from './scripts/lib/generator-versions.mjs';
import {
  legalConfigError,
  legalConfigProblems,
  readLegalConfig,
} from './scripts/lib/legal-config.mjs';

/* Служебные страницы-галереи банков (файлы page.dev.tsx) становятся
   маршрутами только в `next dev` или со флагом GALEREYA=1
   (GALEREYA_1=1, GALEREYA_7=1 и GALEREYA_10=1 — то же для заданий №1, №7 и №10,
   SOGLASIYA=1 — для витрины согласий /styleguide/soglasiya/). В
   обычной сборке их нет — адрес отдаёт 404, это проверяют
   scripts/check-dev-pages.mjs и scripts/check-galereya-1.mjs. */
const devPages =
  process.env.NODE_ENV === 'development' ||
  process.env.GALEREYA === '1' ||
  process.env.GALEREYA_1 === '1' ||
  process.env.GALEREYA_7 === '1' ||
  process.env.GALEREYA_10 === '1' ||
  process.env.SOGLASIYA === '1';

const nextConfig: NextConfig = {
  pageExtensions: devPages ? ['dev.tsx', 'tsx', 'ts', 'jsx', 'js'] : ['tsx', 'ts', 'jsx', 'js'],
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

/* Правовые документы с «[ФИО]» вместо имени оператора на сайт не
   выкладываются: продакшен-сборка падает, пока не заполнен
   src/content/legal/operator.json. Черновик для превью и проверок
   CI — LEGAL_DRAFT=1 (scripts/lib/legal-config.mjs). */
export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD && process.env.LEGAL_DRAFT !== '1') {
    const problems = legalConfigProblems(readLegalConfig());
    if (problems.length > 0) {
      throw new Error(legalConfigError(problems));
    }
  }
  return nextConfig;
}
