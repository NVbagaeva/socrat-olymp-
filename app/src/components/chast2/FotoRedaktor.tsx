'use client';

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui';
import { CHAST2_TEXT as T } from '@/content/variantOnline/chast2Text';
import { BEZ_PRAVKI, kakSkan, povernut, type Pravka } from '@/lib/chast2/foto';

export interface FotoRedaktorProps {
  img: HTMLImageElement;
  initial?: Pravka;
  onDone: (p: Pravka) => void;
  onCancel: () => void;
}

type Ugol = 'nw' | 'ne' | 'sw' | 'se' | 'move';
const MIN = 0.1;
const PREVIEW = 1100;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Редактор фото перед отправкой: поворот на 90°, выпрямление ±15°,
 * рамка обрезки за углы, «как скан» и «Отменить всё». Правка — только
 * параметры; сам файл собирается из оригинала при отправке (foto.ts).
 */
export function FotoRedaktor({ img, initial = BEZ_PRAVKI, onDone, onCancel }: FotoRedaktorProps) {
  const [p, setP] = useState<Pravka>(initial);
  const view = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ ugol: Ugol; x: number; y: number; crop: Pravka['crop'] } | null>(null);
  const first = useRef<HTMLButtonElement>(null);

  /* Предпросмотр: поворот, выпрямление и фильтр на уменьшенной копии. */
  useEffect(() => {
    const c = view.current;
    if (c === null) return;
    const scale = Math.min(1, PREVIEW / Math.max(img.naturalWidth, img.naturalHeight));
    const turned = povernut(img, p.rot90, p.angle, scale);
    if (p.scan) kakSkan(turned);
    c.width = turned.width;
    c.height = turned.height;
    c.getContext('2d')!.drawImage(turned, 0, 0);
  }, [img, p.rot90, p.angle, p.scan]);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  const rot = (d: 1 | -1) =>
    setP((x) => ({
      ...x,
      rot90: ((((x.rot90 + d) % 4) + 4) % 4) as Pravka['rot90'],
      /* После поворота рамка прежняя по смыслу не совпадёт — снова целиком. */
      crop: BEZ_PRAVKI.crop,
    }));

  function point(e: RPointerEvent): { x: number; y: number } {
    const r = box.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }
  function down(e: RPointerEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    const ugol = (e.currentTarget.dataset['ugol'] ?? 'move') as Ugol;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { ugol, ...point(e), crop: p.crop };
  }
  function move(e: RPointerEvent) {
    const d = drag.current;
    if (d === null) return;
    const { x, y } = point(e);
    const dx = x - d.x;
    const dy = y - d.y;
    const c = d.crop;
    let { x: l, y: t } = c;
    let r = c.x + c.w;
    let b = c.y + c.h;
    if (d.ugol === 'move') {
      l = clamp(c.x + dx, 0, 1 - c.w);
      t = clamp(c.y + dy, 0, 1 - c.h);
      r = l + c.w;
      b = t + c.h;
    } else {
      if (d.ugol === 'nw' || d.ugol === 'sw') l = clamp(c.x + dx, 0, r - MIN);
      if (d.ugol === 'ne' || d.ugol === 'se') r = clamp(r + dx, l + MIN, 1);
      if (d.ugol === 'nw' || d.ugol === 'ne') t = clamp(c.y + dy, 0, b - MIN);
      if (d.ugol === 'sw' || d.ugol === 'se') b = clamp(b + dy, t + MIN, 1);
    }
    setP((x0) => ({ ...x0, crop: { x: l, y: t, w: r - l, h: b - t } }));
  }
  const up = () => {
    drag.current = null;
  };
  /* Клавиатура: стрелки двигают рамку, Shift+стрелки — правый нижний угол. */
  function key(e: React.KeyboardEvent) {
    const step = 0.02;
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const v = map[e.key];
    if (v === undefined) return;
    e.preventDefault();
    setP((x0) => {
      const c = x0.crop;
      if (e.shiftKey) {
        return {
          ...x0,
          crop: { ...c, w: clamp(c.w + v[0], MIN, 1 - c.x), h: clamp(c.h + v[1], MIN, 1 - c.y) },
        };
      }
      return {
        ...x0,
        crop: { ...c, x: clamp(c.x + v[0], 0, 1 - c.w), y: clamp(c.y + v[1], 0, 1 - c.h) },
      };
    });
  }

  const c = p.crop;
  const pct = (v: number) => `${(v * 100).toFixed(3)}%`;
  return createPortal(
    <div
      className="c2-red"
      role="dialog"
      aria-modal="true"
      aria-label={T.editor.title}
      data-testid="c2-red"
    >
      <div className="c2-red__head">
        <h2 className="c2-red__title">{T.editor.title}</h2>
      </div>
      <div className="c2-red__stage">
        <div
          className="c2-red__box"
          ref={box}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <canvas ref={view} className="c2-red__canvas" data-testid="c2-red-canvas" />
          <div
            className="c2-red__crop"
            role="slider"
            tabIndex={0}
            aria-label={T.editor.crop}
            aria-valuenow={Math.round(c.w * 100)}
            aria-valuemin={10}
            aria-valuemax={100}
            aria-valuetext={`${Math.round(c.w * 100)}% × ${Math.round(c.h * 100)}%`}
            style={{ left: pct(c.x), top: pct(c.y), width: pct(c.w), height: pct(c.h) }}
            onPointerDown={down}
            data-ugol="move"
            onKeyDown={key}
            data-testid="c2-red-crop"
          >
            {(['nw', 'ne', 'sw', 'se'] as const).map((u) => (
              <span
                key={u}
                className={`c2-red__h c2-red__h--${u}`}
                onPointerDown={down}
                data-ugol={u}
                data-testid={`c2-red-${u}`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="c2-red__tools">
        <div className="c2-red__row">
          <button
            ref={first}
            type="button"
            className="c2-chip"
            onClick={() => rot(-1)}
            data-testid="c2-red-rotl"
          >
            ⟲ <span className="sr-only">{T.editor.rotL}</span>
          </button>
          <button
            type="button"
            className="c2-chip"
            onClick={() => rot(1)}
            data-testid="c2-red-rotr"
          >
            ⟳ <span className="sr-only">{T.editor.rotR}</span>
          </button>
          <label className="c2-red__angle">
            <span>{T.editor.straighten}</span>
            <input
              type="range"
              min={-15}
              max={15}
              step={0.5}
              value={p.angle}
              onChange={(e) => setP((x) => ({ ...x, angle: Number(e.target.value) }))}
              data-testid="c2-red-angle"
            />
            <output>{T.editor.angle(p.angle)}</output>
          </label>
          <label className="c2-red__scan">
            <input
              type="checkbox"
              checked={p.scan}
              onChange={(e) => setP((x) => ({ ...x, scan: e.target.checked }))}
              data-testid="c2-red-scan"
            />
            {T.editor.scan}
          </label>
        </div>
        <div className="c2-red__row c2-red__row--end">
          <Button variant="ghost" onClick={() => setP(BEZ_PRAVKI)} data-testid="c2-red-reset">
            {T.editor.reset}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            {T.editor.cancel}
          </Button>
          <Button onClick={() => onDone(p)} data-testid="c2-red-save">
            {T.editor.save}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
