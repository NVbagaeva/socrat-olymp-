'use client';

/** Кнопка «Напечатать» на печатных листах №10 (сама на печати не видна). */
export function PechatKnopka10() {
  return (
    <button
      type="button"
      className="btn btn--primary z10-shp__knopka"
      onClick={() => window.print()}
    >
      Напечатать
    </button>
  );
}
