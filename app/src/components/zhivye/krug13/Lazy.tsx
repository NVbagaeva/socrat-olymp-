'use client';

import { ZhivayaLazy } from '../ZhivayaLazy';

const zUgol = () => import('./Ugol');
const zDelenie = () => import('./Delenie');

export function UgolLazy() {
  return (
    <ZhivayaLazy
      zagruzit={zUgol}
      zagruzka="Сцена загружается…"
      vysota={{ uzko: 900, shiroko: 640 }}
    />
  );
}

export function DelenieLazy() {
  return (
    <ZhivayaLazy
      zagruzit={zDelenie}
      zagruzka="Сцена загружается…"
      vysota={{ uzko: 900, shiroko: 640 }}
    />
  );
}
