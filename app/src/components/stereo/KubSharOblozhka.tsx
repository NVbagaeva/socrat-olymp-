'use client';

import { ObjomnayaOblozhka } from '@/components/tasks/stsena';
import { STSENA_STEREO } from '@/content/stereo/zadaniya';
import { assetUrl } from '@/lib/assetUrl';

/** Ракурс модели, совпадающий с картинкой обложки. */
export const KUB_SHAR_AZ = 38;
export const KUB_SHAR_EL = 36;

const KADR = '/images/zadaniya/3/kub-shar';

/**
 * Обложка №3: картинка стеклянного куба с вписанным шаром, по первому
 * касанию — живая модель (kubShar3d.ts, three.js) в том же ракурсе.
 * Куб можно вращать и перетаскивать по шапке (подержать и тянуть).
 */
export function KubSharOblozhka() {
  return (
    <ObjomnayaOblozhka
      poster={{
        src: assetUrl(`${KADR}-560.png`),
        srcSet: `${assetUrl(`${KADR}-560.png`)} 560w, ${assetUrl(`${KADR}-1120.png`)} 1120w`,
        webpSrcSet: `${assetUrl(`${KADR}-560.webp`)} 560w, ${assetUrl(`${KADR}-1120.webp`)} 1120w`,
        sizes: '(max-width: 1023.98px) 150px, 300px',
        width: 961,
        height: 1048,
      }}
      zagruzit={() => import('./kubShar3d')}
      az={KUB_SHAR_AZ}
      el={KUB_SHAR_EL}
      label={STSENA_STEREO.oblozhka}
      knopka={STSENA_STEREO.vrashchat}
      dvigat
    />
  );
}
