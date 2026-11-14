'use client';

import { OpornyeSpisokBanka, type NavykKartochki } from '../opornye/OpornyeBanka';
import { OPORNYE13 } from '@/content/ekonomicheskie13';
import { opornye13Spisok } from '@/lib/zadanie13/progress';

/**
 * Список опорных задач №13 на общих карточках (components/tasks/opornye):
 * прогресс — прежнее хранилище опорных задач (budetege:zadanie-13:opornye:v1),
 * задача блока — постоянный id; прежние записи «блок:номер» переведены
 * (opornye13Spisok).
 */
export function Opornye13Spisok({ navyki }: { navyki: NavykKartochki[] }) {
  return <OpornyeSpisokBanka navyki={navyki} store={opornye13Spisok} labels={OPORNYE13.spisok} />;
}
