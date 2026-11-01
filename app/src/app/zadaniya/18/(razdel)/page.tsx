import type { Metadata } from 'next';
import { OZadanii18 } from '@/components/zadanie18/OZadanii18';
import { metaVkladki } from '@/content/seo';
import { VsyoZadaniya18 } from '@/components/seo/VsyoVRazdele';

export const metadata: Metadata = metaVkladki(18, 'o-zadanii');

/** Вкладка «О задании» живёт на адресе самого раздела, как у №16 и №19. */
export default function OZadanii18Tab() {
  return (
    <>
      <OZadanii18 />
      <VsyoZadaniya18 />
    </>
  );
}
