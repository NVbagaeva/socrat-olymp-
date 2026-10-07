/**
 * Временная миниатюра задания, у которого ещё нет своей картинки
 * task-{no}.webp. Стоит в том же месте и тех же размеров: круглая
 * подложка и линейный значок в поле 96×96, цвет — currentColor
 * (основной цвет карточки).
 *
 * Классы ill-* общие с рисованными миниатюрами (components.css).
 * KaTeX сюда намеренно не подключается: банк — клиентский экран,
 * и библиотека формул в его сборку попадать не должна.
 *
 * Когда художник отдаст картинку, у задания в content/tasks.ts
 * убирается illustration: 'placeholder' — и значок пропадает сам.
 */

import type { ReactElement } from 'react';

const ART: Record<string, ReactElement> = {
  /* 14 — уравнение: две кривые пересекаются, корни отмечены на оси. */
  '14': (
    <>
      <path className="ill-line" d="M20 64 H 76" />
      <path className="ill-accent" d="M22 30 C 36 76, 60 76, 74 30" />
      <path className="ill-line" d="M22 50 H 74" />
      <circle className="ill-dot" cx="31.5" cy="50" r="2.5" />
      <circle className="ill-dot" cx="64.5" cy="50" r="2.5" />
    </>
  ),

  /* 15 — стереометрия: пирамида, невидимое ребро пунктиром. */
  '15': (
    <>
      <path className="ill-fill" d="M48 22 L 24 66 L 58 74 Z" />
      <path className="ill-line" d="M48 22 L 24 66 L 58 74 Z M48 22 L 74 60 L 58 74" />
      <path className="ill-dash" d="M24 66 L 74 60" />
      <circle className="ill-dot" cx="48" cy="22" r="2.5" />
    </>
  ),

  /* 16 — неравенство: числовая прямая, закрашенный промежуток. */
  '16': (
    <>
      <path className="ill-line" d="M18 56 H 78 M72 51 L 78 56 L 72 61" />
      <path className="ill-fill" d="M34 36 H 62 V 56 H 34 Z" />
      <path className="ill-accent" d="M34 56 H 62" />
      <circle className="ill-dot" cx="34" cy="56" r="3" />
      <circle className="ill-line" cx="62" cy="56" r="3" />
    </>
  ),

  /* 17 — оптимизация: кривая с отмеченным максимумом. */
  '17': (
    <>
      <path className="ill-line" d="M22 72 H 76 M26 22 V 76" />
      <path className="ill-accent" d="M28 68 C 40 20, 56 20, 72 64" />
      <path className="ill-line" d="M40 32 H 62" />
      <circle className="ill-dot" cx="49" cy="32" r="3" />
    </>
  ),

  /* 18 — планиметрия: треугольник с вписанной окружностью. */
  '18': (
    <>
      <polygon className="ill-accent" points="22,70 74,70 40,26" />
      <circle className="ill-line" cx="43" cy="55" r="12" />
      <circle className="ill-dot" cx="43" cy="55" r="2" />
    </>
  ),

  /* 19 — параметр: семейство прямых через одну точку. */
  '19': (
    <>
      <path className="ill-line" d="M22 72 H 76 M26 22 V 76" />
      <path className="ill-line" d="M30 66 L 72 30 M30 58 L 72 38 M30 46 L 72 46" />
      <path className="ill-accent" d="M34 72 L 66 24" />
      <circle className="ill-dot" cx="51" cy="46" r="3" />
    </>
  ),

  /* 20 — олимпиадная задача: звезда. */
  '20': (
    <>
      <polygon
        className="ill-fill"
        points="48,22 55,40 74,41 59,53 64,72 48,61 32,72 37,53 22,41 41,40"
      />
      <polygon
        className="ill-accent"
        points="48,22 55,40 74,41 59,53 64,72 48,61 32,72 37,53 22,41 41,40"
      />
    </>
  ),
};

export function TaskPlaceholderArt({ no }: { no: string }) {
  const art = ART[no];
  return (
    <span className="ill-frame">
      <svg className="ill" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
        <circle className="ill-disc" cx="48" cy="48" r="34" />
        {art !== undefined ? (
          <g transform="translate(48,48) scale(0.82) translate(-48,-48)">{art}</g>
        ) : null}
      </svg>
    </span>
  );
}
