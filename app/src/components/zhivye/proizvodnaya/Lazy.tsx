'use client';

import { ZhivayaLazy } from '../ZhivayaLazy';

/**
 * Ленивые сцены «Понятия производной»: каждая — свой кусок (import с
 * буквальным путём), грузится, когда блок подходит к экрану.
 */

const ZAGRUZKA = 'Сцена загружается…';
const zSekushchaya = () => import('./Sekushchaya');
const zSkorost = () => import('./Skorost');
const zModul = () => import('./Modul');

export function SekushchayaLazy() {
  return (
    <ZhivayaLazy
      zagruzit={zSekushchaya}
      zagruzka={ZAGRUZKA}
      vysota={{ uzko: 1080, shiroko: 860 }}
    />
  );
}

export function SkorostLazy() {
  return (
    <ZhivayaLazy zagruzit={zSkorost} zagruzka={ZAGRUZKA} vysota={{ uzko: 980, shiroko: 800 }} />
  );
}

export function ModulLazy() {
  return <ZhivayaLazy zagruzit={zModul} zagruzka={ZAGRUZKA} vysota={{ uzko: 980, shiroko: 820 }} />;
}
