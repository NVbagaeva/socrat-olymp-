'use client';

import { pechatat } from '@/lib/sheet/pechat';

/** Кнопка «Напечатать» на печатных листах №7 (сама на печати не видна). */
export function PechatKnopka7() {
  return (
    <button
      type="button"
      className="btn btn--primary z7-shp__knopka"
      onClick={() => void pechatat()}
    >
      Напечатать
    </button>
  );
}
