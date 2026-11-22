'use client';

import { useState } from 'react';
import { Taymer2d, type TaymerProps } from './Taymer2d';
import { Taymer3d } from './Taymer3d';

export type TaymerVid = '2d' | '3d';

interface NavigatorPlus extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

/**
 * Какой таймер показать. SVG-кольцо — при prefers-reduced-motion, без
 * WebGL и на слабом устройстве (два ядра и меньше, до 2 ГБ памяти,
 * режим экономии трафика); иначе 3D-кольцо.
 */
export function vybratTaymer(): TaymerVid {
  if (typeof window === 'undefined') return '2d';
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return '2d';
    const nav = navigator as NavigatorPlus;
    if ((nav.hardwareConcurrency ?? 4) <= 2) return '2d';
    if ((nav.deviceMemory ?? 4) <= 2) return '2d';
    if (nav.connection?.saveData === true) return '2d';
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null;
    if (gl === null) return '2d';
    /* Пробный контекст сразу отдаём: их число у браузера ограничено. */
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return '3d';
  } catch {
    return '2d';
  }
}

/**
 * Таймер тренировки: 3D-кольцо (three.js, ленивая загрузка) или
 * SVG-кольцо. Выбор — один раз на тренировку; отказ WebGL по ходу —
 * насовсем SVG.
 */
export function Taymer({ vid, ...props }: TaymerProps & { vid?: TaymerVid }) {
  const [vybor, setVybor] = useState<TaymerVid>(() => vid ?? vybratTaymer());
  if (vybor === '3d') return <Taymer3d {...props} onOtkaz={() => setVybor('2d')} />;
  return <Taymer2d {...props} />;
}
