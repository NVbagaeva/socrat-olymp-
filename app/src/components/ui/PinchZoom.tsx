'use client';

import { useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface PinchZoomProps {
  children: ReactNode;
  /** Подписи кнопок масштаба. */
  labels?: { zoomIn: string; zoomOut: string; reset: string };
}

const MIN = 1;
const MAX = 5;

interface View {
  scale: number;
  x: number;
  y: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Масштаб рисунка двумя пальцами и перетаскивание — для окна
 * увеличенного рисунка (FigureZoom с `pinch`).
 *
 * Жесты — Pointer Events: два касания масштабируют вокруг середины
 * между пальцами, одно — двигает увеличенный рисунок, двойное касание
 * возвращает как было. На компьютере — колесо мыши и кнопки «+ / −».
 * Рисунок — вектор, при увеличении он остаётся чётким.
 */
export function PinchZoom({
  children,
  labels = { zoomIn: 'Увеличить', zoomOut: 'Уменьшить', reset: 'Как было' },
}: PinchZoomProps) {
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const box = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; mid: { x: number; y: number }; start: View } | null>(null);
  const lastTap = useRef(0);

  const local = (x: number, y: number) => {
    const r = box.current?.getBoundingClientRect();
    return r === undefined
      ? { x, y }
      : { x: x - r.left - r.width / 2, y: y - r.top - r.height / 2 };
  };

  /** Масштаб вокруг точки p (координаты от центра окна). */
  const zoomAt = (v: View, scale: number, p: { x: number; y: number }): View => {
    const s = clamp(scale, MIN, MAX);
    if (s === 1) return { scale: 1, x: 0, y: 0 };
    const k = s / v.scale;
    return { scale: s, x: p.x - (p.x - v.x) * k, y: p.y - (p.y - v.y) * k };
  };

  const begin = () => {
    const pts = [...pointers.current.values()];
    if (pts.length >= 2) {
      const [a, b] = pts as [{ x: number; y: number }, { x: number; y: number }];
      gesture.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        mid: local((a.x + b.x) / 2, (a.y + b.y) / 2),
        start: view,
      };
    } else {
      gesture.current = null;
    }
  };

  return (
    <div className="pinch">
      <div
        ref={box}
        className="pinch__area"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size === 1) {
            const now = Date.now();
            if (now - lastTap.current < 300) setView({ scale: 1, x: 0, y: 0 });
            lastTap.current = now;
          }
          begin();
        }}
        onPointerMove={(e) => {
          const prev = pointers.current.get(e.pointerId);
          if (prev === undefined) return;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          const g = gesture.current;
          if (g !== null && pointers.current.size >= 2) {
            const [a, b] = [...pointers.current.values()] as [
              { x: number; y: number },
              { x: number; y: number },
            ];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            const mid = local((a.x + b.x) / 2, (a.y + b.y) / 2);
            const zoomed = zoomAt(g.start, (g.start.scale * dist) / Math.max(1, g.dist), g.mid);
            setView(
              zoomed.scale === 1
                ? zoomed
                : { ...zoomed, x: zoomed.x + mid.x - g.mid.x, y: zoomed.y + mid.y - g.mid.y },
            );
          } else if (view.scale > 1) {
            setView((v) => ({ ...v, x: v.x + e.clientX - prev.x, y: v.y + e.clientY - prev.y }));
          }
        }}
        onPointerUp={(e) => {
          pointers.current.delete(e.pointerId);
          begin();
        }}
        onPointerCancel={(e) => {
          pointers.current.delete(e.pointerId);
          begin();
        }}
        onWheel={(e) => {
          const p = local(e.clientX, e.clientY);
          setView((v) => zoomAt(v, v.scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2), p));
        }}
      >
        <div
          className="pinch__content"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        >
          {children}
        </div>
      </div>
      <div className="pinch__tools">
        <button
          type="button"
          className="pinch__btn"
          aria-label={labels.zoomOut}
          disabled={view.scale <= MIN}
          onClick={() => setView((v) => zoomAt(v, v.scale / 1.5, { x: 0, y: 0 }))}
        >
          −
        </button>
        <button
          type="button"
          className="pinch__btn"
          aria-label={labels.reset}
          onClick={() => setView({ scale: 1, x: 0, y: 0 })}
        >
          {Math.round(view.scale * 100)}%
        </button>
        <button
          type="button"
          className="pinch__btn"
          aria-label={labels.zoomIn}
          disabled={view.scale >= MAX}
          onClick={() => setView((v) => zoomAt(v, v.scale * 1.5, { x: 0, y: 0 }))}
        >
          +
        </button>
      </div>
    </div>
  );
}
