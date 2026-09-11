import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Статический экспорт: деплой на обычный хостинг, не Vercel.
  output: 'export',
  // При экспорте оптимизация изображений недоступна.
  images: { unoptimized: true },
  // Каждая страница выгружается папкой с index.html — так путь работает без правил сервера.
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
