import type { Metadata } from 'next';
import { DokumentStranica } from '@/components/uchitelyam/DokumentStranica';
import { oferta } from '@/content/uchitelyam-dokumenty';
import '@/components/uchitelyam/usluga.css';

export const metadata: Metadata = { title: oferta.metaTitle };

export default function Page() {
  return <DokumentStranica doc={oferta} />;
}
