import type { Metadata } from 'next';
import { DokumentStranica } from '@/components/uchitelyam/DokumentStranica';
import { politika } from '@/content/uchitelyam-dokumenty';
import '@/components/uchitelyam/usluga.css';

export const metadata: Metadata = { title: politika.metaTitle };

/** Политика обработки данных — для всего сайта: заявки на услугу и Метрика. */
export default function Page() {
  return <DokumentStranica doc={politika} />;
}
