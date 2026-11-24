'use client';

import { ZhivayaLazy } from '../ZhivayaLazy';

const zParametr = () => import('./Parametr');

export function ParametrLazy({ id }: { id: string }) {
  return (
    <ZhivayaLazy
      zagruzit={zParametr}
      props={{ id }}
      zagruzka="Сцена загружается…"
      vysota={{ uzko: 760, shiroko: 820 }}
    />
  );
}
