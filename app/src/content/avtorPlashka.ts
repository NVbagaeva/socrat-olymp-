/**
 * Плашка автора (components/avtor/AvtorPlashka.tsx): рядом с ценами и
 * на главной. Строку прислала автор сама; полные регалии — только на
 * «Об авторе» (content/about.ts).
 */

import { assetUrl } from '@/lib/assetUrl';

export const AVTOR_PLASHKA = {
  imya: 'Наталия Багаева',
  kto: 'учитель математики, эксперт ГИА',
  href: '/about/',
  foto: {
    src: assetUrl('/images/author/nata-miniatyura-96.webp'),
    src2x: assetUrl('/images/author/nata-miniatyura-192.webp'),
  },
} as const;
