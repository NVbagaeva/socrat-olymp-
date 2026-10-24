'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import { MetkiSloy } from '@/components/chast2/Metki';
import type { RabotyApi } from '@/lib/raboty/api';
import type { MarkItem, MarkLayer, Photo } from '@/lib/raboty/types';
import { fotoText as T } from './text';

type Tool = 'move' | 'pen' | 'ok' | 'no' | 'text';

export interface FotoProverkaProps {
  api: Pick<RabotyApi, 'photoUrl' | 'savePhotoMarks'>;
  photos: readonly Photo[];
  marks: Readonly<Record<string, MarkLayer>>;
  /** Можно ставить пометки (проверка открыта). */
  editable: boolean;
  testId?: string;
}

const ZOOMS = [1, 1.5, 2, 3, 4];

/**
 * Фото решения на проверке: листание, масштаб, поворот, во весь экран.
 * Пометки учителя — отдельный слой (координаты в долях фото): ручка,
 * «верно», «ошибка», текст. Сохраняются сами через секунду после правки.
 */
export function FotoProverka({ api, photos, marks, editable, testId }: FotoProverkaProps) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(0);
  const [rot, setRot] = useState(0);
  const [full, setFull] = useState(false);
  const [tool, setTool] = useState<Tool>('move');
  const [text, setText] = useState('');
  const [layers, setLayers] = useState<Record<string, MarkItem[]>>(() =>
    Object.fromEntries(Object.entries(marks).map(([k, v]) => [k, v.items])),
  );
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [src, setSrc] = useState<Record<string, string>>({});
  const img = useRef<HTMLDivElement>(null);
  const stroke = useRef<[number, number][] | null>(null);
  const [draft, setDraft] = useState<[number, number][] | null>(null);
  const dirty = useRef<Set<string>>(new Set());

  const photo = photos[Math.min(i, photos.length - 1)];

  useEffect(() => {
    if (photo === undefined || src[photo.id] !== undefined) return undefined;
    let alive = true;
    void api.photoUrl(photo.id).then((u) => alive && setSrc((s) => ({ ...s, [photo.id]: u })));
    return () => {
      alive = false;
    };
  }, [api, photo, src]);

  /* Сохранение пометок: через секунду после последней правки. */
  useEffect(() => {
    if (dirty.current.size === 0) return undefined;
    const t = window.setTimeout(() => {
      const ids = [...dirty.current];
      dirty.current.clear();
      setState('saving');
      void Promise.all(
        ids.map((id) => api.savePhotoMarks(id, { v: 1, items: layers[id] ?? [] })),
      ).then(
        () => setState('saved'),
        () => setState('idle'),
      );
    }, 1000);
    return () => window.clearTimeout(t);
  }, [api, layers]);

  useEffect(() => {
    if (!full) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFull(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [full]);

  if (photo === undefined) return null;
  const items = layers[photo.id] ?? [];
  const change = (next: MarkItem[]) => {
    dirty.current.add(photo.id);
    setLayers((l) => ({ ...l, [photo.id]: next }));
  };

  /** Точка указателя → доли фото с учётом поворота на экране. */
  function toPhoto(e: RPointerEvent): [number, number] | null {
    const el = img.current;
    if (el === null) return null;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    for (let k = 0; k < rot; k += 1) [dx, dy] = [dy, -dx];
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const x = dx / w + 0.5;
    const y = dy / h + 0.5;
    return x < 0 || x > 1 || y < 0 || y > 1 ? null : [round(x), round(y)];
  }

  function down(e: RPointerEvent<HTMLDivElement>) {
    if (!editable || tool === 'move') return;
    const pt = toPhoto(e);
    if (pt === null) return;
    e.preventDefault();
    if (tool === 'pen') {
      e.currentTarget.setPointerCapture(e.pointerId);
      stroke.current = [pt];
      setDraft([pt]);
    } else if (tool === 'text') {
      if (text.trim() === '') return;
      change([...items, { t: 'text', x: pt[0], y: pt[1], s: text.trim().slice(0, 200) }]);
    } else {
      change([...items, { t: tool, x: pt[0], y: pt[1] }]);
    }
  }
  function move(e: RPointerEvent) {
    if (stroke.current === null) return;
    const pt = toPhoto(e);
    if (pt === null) return;
    const last = stroke.current[stroke.current.length - 1]!;
    if (Math.hypot(pt[0] - last[0], pt[1] - last[1]) < 0.003) return;
    stroke.current.push(pt);
    setDraft([...stroke.current]);
  }
  function up() {
    const s = stroke.current;
    stroke.current = null;
    setDraft(null);
    if (s !== null && s.length > 1) change([...items, { t: 'pen', pts: s.slice(0, 2000) }]);
  }

  const z = ZOOMS[zoom]!;
  const layer: MarkLayer = {
    v: 1,
    items: draft === null ? items : [...items, { t: 'pen', pts: draft }],
  };
  return (
    <div className={clsx('fp', full && 'fp--full')} data-testid={testId}>
      <div className="fp-bar">
        <button
          type="button"
          className="c2-mini"
          disabled={i === 0}
          onClick={() => setI(i - 1)}
          aria-label={T.prev}
        >
          ←
        </button>
        <span className="fp-page" aria-live="polite">
          {T.page(i + 1, photos.length)}
        </span>
        <button
          type="button"
          className="c2-mini"
          disabled={i >= photos.length - 1}
          onClick={() => setI(i + 1)}
          aria-label={T.next}
          data-testid="fp-next"
        >
          →
        </button>
        <span className="fp-sep" />
        <button
          type="button"
          className="c2-mini"
          disabled={zoom === 0}
          onClick={() => setZoom(zoom - 1)}
          aria-label={T.zoomOut}
        >
          −
        </button>
        <span className="fp-page">{Math.round(z * 100)}%</span>
        <button
          type="button"
          className="c2-mini"
          disabled={zoom === ZOOMS.length - 1}
          onClick={() => setZoom(zoom + 1)}
          aria-label={T.zoomIn}
          data-testid="fp-zoom"
        >
          +
        </button>
        <button
          type="button"
          className="c2-mini"
          onClick={() => setRot((rot + 1) % 4)}
          aria-label={T.rotate}
          data-testid="fp-rot"
        >
          ⟳
        </button>
        <button
          type="button"
          className="c2-mini"
          onClick={() => setFull(!full)}
          aria-pressed={full}
          data-testid="fp-full"
        >
          {full ? T.exitFull : T.full}
        </button>
      </div>
      {editable ? (
        <div className="fp-bar fp-tools" role="toolbar" aria-label={T.tools}>
          {(['move', 'pen', 'ok', 'no', 'text'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={clsx('c2-mini', `fp-tool--${t}`, tool === t && 'is-on')}
              aria-pressed={tool === t}
              onClick={() => setTool(t)}
              data-testid={`fp-tool-${t}`}
            >
              {t === 'ok' ? '✓ ' : t === 'no' ? '✗ ' : ''}
              {T[t]}
            </button>
          ))}
          {tool === 'text' ? (
            <input
              className="fp-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={T.textPlaceholder}
              maxLength={200}
              data-testid="fp-text"
            />
          ) : null}
          <button
            type="button"
            className="c2-mini"
            disabled={items.length === 0}
            onClick={() => change(items.slice(0, -1))}
          >
            {T.undo}
          </button>
          <button
            type="button"
            className="c2-mini"
            disabled={items.length === 0}
            onClick={() => change([])}
          >
            {T.clear}
          </button>
          <span className="fp-state" aria-live="polite">
            {state === 'saving' ? T.saving : state === 'saved' ? T.saved : ''}
          </span>
        </div>
      ) : null}
      <div className={clsx('fp-stage', tool !== 'move' && editable && 'is-drawing')}>
        <div
          className="fp-rot"
          style={{
            width: `${z * 100}%`,
            transform: `rotate(${rot * 90}deg)`,
          }}
        >
          <div
            ref={img}
            className="fp-img"
            style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            data-testid="fp-img"
          >
            {src[photo.id] === undefined ? null : (
              <img src={src[photo.id]} alt={T.page(i + 1, photos.length)} draggable={false} />
            )}
            <MetkiSloy layer={layer} width={photo.width} height={photo.height} />
          </div>
        </div>
      </div>
    </div>
  );
}

const round = (v: number) => Math.round(v * 10000) / 10000;
