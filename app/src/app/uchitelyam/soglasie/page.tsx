import type { Metadata } from 'next';
import { DokumentStranica } from '@/components/uchitelyam/DokumentStranica';
import { soglasie } from '@/content/uchitelyam-dokumenty';
import '@/components/uchitelyam/usluga.css';

export const metadata: Metadata = { title: soglasie.metaTitle };

export default function Page() {
  return <DokumentStranica doc={soglasie} />;
}
