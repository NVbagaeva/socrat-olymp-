'use client';

import { OpornyeSpisokBanka, type NavykKartochki } from '../opornye/OpornyeBanka';
import { OPORNYE13 } from '@/content/ekonomicheskie13';
import { opornye13 } from '@/lib/zadanie13/progress';

/**
 * Список опорных задач №13 на общих карточках (components/tasks/opornye):
 * прогресс — прежнее хранилище опорных задач (budetege:zadanie-13:opornye:v1),
 * задача блока — «блок:номер».
 */
export function Opornye13Spisok({ navyki }: { navyki: NavykKartochki[] }) {
  return <OpornyeSpisokBanka navyki={navyki} store={opornye13} labels={OPORNYE13.spisok} />;
}
