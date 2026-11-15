'use client';

import { Taymer2d, type TaymerProps } from './Taymer2d';

export type TaymerVid = '2d';

/**
 * Таймер тренировки. Сейчас — кольцо на SVG; 3D-кольцо (three.js)
 * подключается сюда же ленивой загрузкой и падает обратно на SVG без
 * WebGL, на слабом устройстве и при prefers-reduced-motion.
 */
export function Taymer(props: TaymerProps & { vid?: TaymerVid }) {
  const { vid: _vid, ...rest } = props;
  return <Taymer2d {...rest} />;
}
