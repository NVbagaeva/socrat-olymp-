import fs from 'node:fs';
import path from 'node:path';
import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import { assetVersions } from './scripts/lib/asset-versions.mjs';
import { generatorVersions } from './scripts/lib/generator-versions.mjs';
import { prodavetsProblems } from './src/lib/legal/prodavetsProblems.mjs';
import {
  legalConfigError,
  legalConfigProblems,
  readLegalConfig,
} from './scripts/lib/legal-config.mjs';

/* Служебные страницы-галереи банков (файлы page.dev.tsx) становятся
   маршрутами только в `next dev` или со флагом GALEREYA=1
   (GALEREYA_1=1, GALEREYA_6=1, GALEREYA_7=1, GALEREYA_9=1 и GALEREYA_10=1 —
   то же для заданий №1, №6, №7, №9 и №10, SOGLASIYA=1 — для витрины согласий
   /styleguide/soglasiya/). Галереи показывают ответы; в обычной сборке
   их нет — адрес отдаёт 404, это проверяют scripts/check-dev-pages.mjs,
   scripts/check-galereya-1.mjs и
   scripts/check-galereya-12.mjs (галерея банка №12). */
const devPages =
  process.env.NODE_ENV === 'development' ||
  process.env.GALEREYA === '1' ||
  process.env.GALEREYA_1 === '1' ||
  process.env.GALEREYA_6 === '1' ||
  process.env.GALEREYA_7 === '1' ||
  process.env.GALEREYA_9 === '1' ||
  process.env.GALEREYA_10 === '1' ||
  process.env.SOGLASIYA === '1' ||
  process.env.INTRO_DEV_PAGES === '1' ||
  process.env.KABINET === '1';

/* Оферта (src/app/oferta/page.oferta.tsx) — черновик на вычитку, пока
   владелец не включит NEXT_PUBLIC_LEGAL_READY=1. До этого маршрут есть
   только в next dev и в превью pull request (OFERTA_PREVIEW=1,
   .github/workflows/preview.yml); в сборке для хостинга адрес отдаёт
   404 — проверяет scripts/check-oferta.mjs. */
const legalReady = process.env.NEXT_PUBLIC_LEGAL_READY === '1';
const ofertaPage =
  legalReady || process.env.NODE_ENV === 'development' || process.env.OFERTA_PREVIEW === '1';

/** Версии файлов из public/ (lib/assetUrl.ts). */
const ASSETS = assetVersions(path.join(process.cwd(), 'public'));

const nextConfig: NextConfig = {
  ...(process.env.INTRO_DEV_PAGES === '1' ? { distDir: '.next-dev' } : {}),
  // Статический экспорт: деплой на обычный хостинг, не Vercel.
  output: 'export',
  pageExtensions: [
    ...(devPages ? ['dev.tsx'] : []),
    ...(ofertaPage ? ['oferta.tsx'] : []),
    'tsx',
    'ts',
    'jsx',
    'js',
  ],
  // При экспорте оптимизация изображений недоступна.
  images: { unoptimized: true },
  // Каждая страница выгружается папкой с index.html — так путь работает без правил сервера.
  trailingSlash: true,
  reactStrictMode: true,
  // Версии файлов из public/ (PDF, картинки): хеш содержимого, считается
  // на каждой сборке. lib/assetUrl.ts добавляет его к ссылке как ?v=…,
  // чтобы перезалитый под тем же именем файл не залипал в годовом кеше.
  env: {
    // Структура экзамена (src/content/struktura.js): всегда одна из двух
    // строк, чтобы выбор вычислялся на сборке. Сайт собирается по
    // структуре из 20 заданий; STRUKTURA_EGE=2027-19 — пробная сборка по
    // новой структуре, только для проверки (не для выкладки).
    STRUKTURA_EGE: process.env.STRUKTURA_EGE === '2027-19' ? '2027-19' : '2027-20',
    // Скрытые разделы (src/lib/skrytye.ts): «1» — открыты всем, с плашкой.
    // Только для превью pull request (SKRYTYE=1), где войти
    // администратором нельзя; на хостинг такая сборка не выкладывается.
    SKRYTYE_VSEM: process.env.SKRYTYE === '1' ? '1' : '0',
    // Вход в кабинет: «1» или «0» всегда, а не undefined. Так условие
    // `process.env.AUTH_ON === '1'` вычисляется на сборке, и без флага
    // webpack не кладёт в сборку ни ветку входа, ни кусок SDK
    // (lib/auth/config.ts, lib/auth/client.ts).
    // Пробный кабинет (служебные страницы /kabinet/…): «1» в next dev и в
    // сборке с KABINET=1. По нему экран «Собрать вариант» показывает
    // ссылку «Выдать через кабинет»; в обычной сборке ссылки нет.
    KABINET_ON: process.env.NODE_ENV === 'development' || process.env.KABINET === '1' ? '1' : '0',
    AUTH_ON:
      process.env.NEXT_PUBLIC_AUTH_ENABLED === '1' &&
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '') !== '' &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '') !== ''
        ? '1'
        : '0',
    // Кнопка «Войти» в шапке и в меню телефона: «1» — показывать. Без
    // флага вход работает (страница /voyti/ открывается по прямой
    // ссылке), но в шапке его не видно — так живёт пробный режим.
    // Кружок с инициалами после входа показывается при любом значении.
    AUTH_HEADER:
      process.env.NEXT_PUBLIC_AUTH_ENABLED === '1' &&
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '') !== '' &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '') !== '' &&
      process.env.NEXT_PUBLIC_AUTH_IN_HEADER === '1'
        ? '1'
        : '0',
    // Таблица версий попадает в первую загрузку каждой страницы, поэтому
    // слои заставки (public/intro/, 28 файлов) в ней не лежат: их версии —
    // в INTRO_ASSET_VERSIONS, её подставляет только код самой заставки,
    // а он грузится отдельно (components/onboarding/intro/IntroSplash.tsx).
    // Так же — файлы данных тренажёров 6, 7, 10 (public/data/, 82 файла):
    // DATA_ASSET_VERSIONS, её подставляет lib/dataUrl.ts.
    ASSET_VERSIONS: JSON.stringify(
      Object.fromEntries(
        Object.entries(ASSETS).filter(
          ([file]) => !file.startsWith('/intro/') && !file.startsWith('/data/'),
        ),
      ),
    ),
    INTRO_ASSET_VERSIONS: JSON.stringify(
      Object.fromEntries(Object.entries(ASSETS).filter(([file]) => file.startsWith('/intro/'))),
    ),
    DATA_ASSET_VERSIONS: JSON.stringify(
      Object.fromEntries(Object.entries(ASSETS).filter(([file]) => file.startsWith('/data/'))),
    ),
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
  /* Оферта и реквизиты с «[ИНН]» вместо номера не публикуются: с флагом
     NEXT_PUBLIC_LEGAL_READY=1 сборка падает, пока не заполнен
     src/content/legal/prodavets.json. LEGAL_DRAFT это не отменяет. */
  if (phase === PHASE_PRODUCTION_BUILD && legalReady) {
    const problems = prodavetsProblems(
      JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), 'src', 'content', 'legal', 'prodavets.json'),
          'utf8',
        ),
      ),
    );
    if (problems.length > 0) {
      throw new Error(
        [
          '',
          'Сборка остановлена: включён NEXT_PUBLIC_LEGAL_READY, но реквизиты продавца не заполнены.',
          'Заполните файл app/src/content/legal/prodavets.json:',
          ...problems.map((p) => `  — ${p}`),
          '',
        ].join('\n'),
      );
    }
  }
  if (phase === PHASE_PRODUCTION_BUILD && process.env.LEGAL_DRAFT !== '1') {
    const problems = legalConfigProblems(readLegalConfig());
    if (problems.length > 0) {
      throw new Error(legalConfigError(problems));
    }
  }
  return nextConfig;
}
