'use client';

/** Кнопка «Напечатать» на печатных листах №7 (сама на печати не видна). */
export function PechatKnopka7() {
  return (
    <button
      type="button"
      className="btn btn--primary z7-shp__knopka"
      onClick={() => window.print()}
    >
      Напечатать
    </button>
  );
}
