'use client';

import { pechatat } from '@/lib/sheet/pechat';

/** Кнопка «Напечатать» на печатных листах №6 (сама на печати не видна). */
export function PechatKnopka6() {
  return (
    <button
      type="button"
      className="btn btn--primary z6-shp__knopka"
      onClick={() => void pechatat()}
    >
      Напечатать
    </button>
  );
}
