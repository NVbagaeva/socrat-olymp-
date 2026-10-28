'use client';

import { pechatat } from '@/lib/sheet/pechat';

/** Кнопка «Напечатать» на печатных листах №10 (сама на печати не видна). */
export function PechatKnopka10() {
  return (
    <button
      type="button"
      className="btn btn--primary z10-shp__knopka"
      onClick={() => void pechatat()}
    >
      Напечатать
    </button>
  );
}
