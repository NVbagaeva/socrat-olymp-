'use client';

import { useEffect, useRef } from 'react';
import { sozdat, type Model3d } from '@/components/stereo/kubShar3d';
import type { ZhivoyProps } from './tip';
import { ZhivoyKoren } from './obshchee';
import { useVrashchenie } from './tri';

/** Ракурс модели, совпадающий с картинкой шапки (kub-shar-560.webp). */
const KUB_SHAR_AZ = 38;
const KUB_SHAR_EL = 36;

/**
 * №3 «Стереометрия»: стеклянный куб с вписанным шаром — та же живая
 * модель, что оживала в прежней обложке (kubShar3d.ts, three.js), в том
 * же ракурсе, что и картинка. Вращение — общее для объёмных чертежей
 * шапки (useVrashchenie): во все стороны мышью, пальцем вбок, с
 * инерцией и медленным авто-вращением.
 *
 * Ракурс ядра стереометрии и камера модели считают азимут в разные
 * стороны: азимут модели — минус азимут ракурса.
 */
export default function KubShar({ label, tiho, avtofokus }: ZhivoyProps) {
  const vr = useVrashchenie({ azimut: -KUB_SHAR_AZ, vysota: KUB_SHAR_EL }, tiho);
  const host = useRef<HTMLDivElement>(null);
  const model = useRef<Model3d | null>(null);
  const rakurs = useRef(vr.rakurs);

  useEffect(() => {
    const node = host.current;
    if (node === null) return;
    const m = sozdat(node, -rakurs.current.azimut, rakurs.current.vysota);
    model.current = m;
    const ro = new ResizeObserver(() => m.razmer());
    ro.observe(node);
    return () => {
      ro.disconnect();
      m.ubrat();
      model.current = null;
    };
  }, []);

  useEffect(() => {
    rakurs.current = vr.rakurs;
    model.current?.vid(-vr.rakurs.azimut, vr.rakurs.vysota);
  }, [vr.rakurs]);

  return (
    <ZhivoyKoren
      label={label}
      avtofokus={avtofokus}
      className="zhv--3d"
      naStrelku={(d, e) => vr.naStrelku(d, e)}
      {...vr.pointer}
    >
      <div
        ref={host}
        className="zhv-kub"
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden="true"
      />
    </ZhivoyKoren>
  );
}
