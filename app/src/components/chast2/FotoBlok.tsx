'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import { Button } from '@/components/ui';
import { CHAST2_TEXT as T } from '@/content/variantOnline/chast2Text';
import { FotoError, gotovoDlyaOtpravki, otkryt, type Pravka } from '@/lib/chast2/foto';
import type { Ochered, QItem } from '@/lib/chast2/ochered';
import type { RabotyApi } from '@/lib/raboty/api';
import { MAX_PHOTOS } from '@/lib/raboty/localApi';
import type { Photo } from '@/lib/raboty/types';
import { FotoRedaktor } from './FotoRedaktor';

export interface FotoBlokProps {
  workId: string;
  taskNo: number;
  /** Отправленные фото задания по порядку. */
  photos: readonly Photo[];
  ochered: Ochered;
  api: Pick<RabotyApi, 'photoUrl' | 'deletePhoto' | 'orderPhotos'>;
  editable: boolean;
  /** Что-то изменилось на сервере — перечитать работу. */
  onChange: () => void;
}

const EMPTY: readonly QItem[] = [];

/** Элементы очереди этого задания — с подпиской на изменения. */
function useQueue(q: Ochered, workId: string, taskNo: number): readonly QItem[] {
  const all = useSyncExternalStore(
    (fn) => q.subscribe(fn),
    () => q.items(),
    () => EMPTY,
  );
  return useMemo(
    () => all.filter((i) => i.workId === workId && i.taskNo === taskNo),
    [all, workId, taskNo],
  );
}

/** Ссылка на отправленное фото (временная) или на файл в очереди. */
function useSrc(api: FotoBlokProps['api'], photo: Photo | null, blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const blobUrl = useMemo(() => (blob === null ? null : URL.createObjectURL(blob)), [blob]);
  useEffect(
    () => () => {
      if (blobUrl !== null) URL.revokeObjectURL(blobUrl);
    },
    [blobUrl],
  );
  useEffect(() => {
    let alive = true;
    if (photo !== null && blob === null) {
      void api.photoUrl(photo.id).then(
        (u) => alive && setUrl(u),
        () => alive && setUrl(null),
      );
    }
    return () => {
      alive = false;
    };
  }, [api, photo, blob]);
  return blobUrl ?? url;
}

type Shag =
  | { kind: 'idle' }
  | { kind: 'busy'; text: string }
  | { kind: 'edit'; img: HTMLImageElement; rest: File[]; zamena: Photo | null };

/**
 * Фото решения к заданию 14–20: снять или выбрать (до 6), поправить в
 * редакторе, поменять порядок перетаскиванием (или кнопками «Раньше /
 * Позже»), удалить. Отправка — через очередь: прогресс, «Повторить»,
 * ожидание связи.
 */
export function FotoBlok({
  workId,
  taskNo,
  photos,
  ochered,
  api,
  editable,
  onChange,
}: FotoBlokProps) {
  const queued = useQueue(ochered, workId, taskNo);
  const [shag, setShag] = useState<Shag>({ kind: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const drag = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  /* Порядок с сервера; пока тянут фото — свой, до ответа сервера. */
  const key = photos.map((p) => p.id).join();
  const [local, setLocal] = useState<{ key: string; order: string[] } | null>(null);
  const order =
    local !== null && local.key === key ? local.order : key === '' ? [] : key.split(',');
  const setOrder = (fn: string[] | ((o: string[]) => string[])) =>
    setLocal((l) => {
      const cur = l !== null && l.key === key ? l.order : key === '' ? [] : key.split(',');
      return { key, order: typeof fn === 'function' ? fn(cur) : fn };
    });

  const byId = new Map(photos.map((p) => [p.id, p]));
  const sorted = order.map((id) => byId.get(id)).filter((p): p is Photo => p !== undefined);
  const count = sorted.length + queued.length;
  const left = MAX_PHOTOS - count;
  const offline = queued.some((q) => q.offline);

  async function nachat(files: File[], zamena: Photo | null = null) {
    const [file, ...rest] = files;
    if (file === undefined) {
      setShag({ kind: 'idle' });
      return;
    }
    setError(null);
    setShag({ kind: 'busy', text: T.foto.opening });
    try {
      const img = await otkryt(file);
      setShag({ kind: 'edit', img, rest, zamena });
    } catch (e) {
      setError(e instanceof FotoError ? T.foto.errors[e.code] : T.foto.errors.decode);
      void nachat(rest);
    }
  }

  async function gotovo(img: HTMLImageElement, p: Pravka, rest: File[], zamena: Photo | null) {
    setShag({ kind: 'busy', text: T.foto.preparing });
    try {
      const out = await gotovoDlyaOtpravki(img, p);
      await ochered.add({
        workId,
        taskNo,
        blob: out.blob,
        width: out.width,
        height: out.height,
        ...(zamena === null ? {} : { zamena: zamena.id }),
      });
    } catch {
      setError(T.foto.errors.decode);
    }
    void nachat(rest);
  }

  async function izmenit(photo: Photo) {
    setShag({ kind: 'busy', text: T.foto.opening });
    try {
      const url = await api.photoUrl(photo.id);
      const blob = await (await fetch(url)).blob();
      await nachat([new File([blob], 'foto.jpg', { type: 'image/jpeg' })], photo);
    } catch {
      setError(T.foto.errors.decode);
      setShag({ kind: 'idle' });
    }
  }

  async function sohranitPoryadok(next: string[]) {
    if (next.join() === key) return;
    setOrder(next);
    try {
      await api.orderPhotos(workId, taskNo, next);
    } finally {
      onChange();
    }
  }
  const sdvinut = (id: string, d: -1 | 1) => {
    const i = order.indexOf(id);
    const j = i + d;
    if (i < 0 || j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j]!, next[i]!];
    void sohranitPoryadok(next);
  };

  /* Перетаскивание за ручку: мышь и палец одинаково (pointer events). */
  function pDown(e: RPointerEvent<HTMLElement>) {
    const id = e.currentTarget.dataset['handle'];
    if (!editable || id === undefined) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id, x: e.clientX, y: e.clientY, moved: false };
  }
  function pMove(e: RPointerEvent) {
    const d = drag.current;
    if (d === null) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
    d.moved = true;
    setDragId(d.id);
    const over = document
      .elementsFromPoint(e.clientX, e.clientY)
      .map((el) => el.closest<HTMLElement>('[data-foto-id]'))
      .find((el) => el !== null && el.dataset['fotoId'] !== d.id);
    const target = over?.dataset['fotoId'];
    if (target === undefined) return;
    setOrder((o) => {
      const from = o.indexOf(d.id);
      const to = o.indexOf(target);
      if (from < 0 || to < 0) return o;
      const next = [...o];
      next.splice(from, 1);
      next.splice(to, 0, d.id);
      return next;
    });
  }
  function pUp() {
    const d = drag.current;
    drag.current = null;
    setDragId(null);
    if (d?.moved) void sohranitPoryadok(order);
  }

  async function udalit(id: string) {
    if (!window.confirm(T.foto.removeAsk)) return;
    try {
      await api.deletePhoto(id);
    } finally {
      onChange();
    }
  }

  const onFiles = (list: FileList | null) => {
    const files = [...(list ?? [])].slice(0, Math.max(0, left));
    if ((list?.length ?? 0) > files.length) setError(T.foto.limit(MAX_PHOTOS));
    if (files.length > 0) void nachat(files);
  };

  return (
    <section className="c2-foto" aria-label={T.foto.title} data-testid={`c2-foto-${taskNo}`}>
      <h4 className="c2-h">{T.foto.title}</h4>
      {editable ? <p className="c2-hint">{T.foto.lead}</p> : null}
      {count === 0 ? (
        <p className="c2-foto__warn" data-testid={`c2-foto-warn-${taskNo}`}>
          {T.foto.noPhoto}
        </p>
      ) : null}
      {offline ? <p className="c2-hint">{T.foto.offlineNote}</p> : null}

      {count > 0 ? (
        <ol className="c2-foto__list" onPointerMove={pMove} onPointerUp={pUp} onPointerCancel={pUp}>
          {sorted.map((p, i) => (
            <Thumb
              key={p.id}
              n={i + 1}
              photo={p}
              api={api}
              dragging={dragId === p.id}
              editable={editable}
              first={i === 0}
              last={i === sorted.length - 1}
              onHandle={pDown}
              onMove={(d) => sdvinut(p.id, d)}
              onEdit={() => void izmenit(p)}
              onRemove={() => void udalit(p.id)}
            />
          ))}
          {queued.map((q, i) => (
            <Thumb
              key={q.id}
              n={sorted.length + i + 1}
              item={q}
              api={api}
              editable={editable}
              onRetry={() => ochered.retry(q.id)}
              onRemove={() => void ochered.remove(q.id)}
            />
          ))}
        </ol>
      ) : null}

      {error === null ? null : (
        <p className="c2-foto__error" role="alert">
          {error}
        </p>
      )}
      {shag.kind === 'busy' ? (
        <p className="c2-hint" role="status">
          {shag.text}
        </p>
      ) : null}

      {editable && left > 0 ? (
        <div className="c2-foto__add">
          <Button
            variant="secondary"
            onClick={() => camera.current?.click()}
            data-testid={`c2-foto-camera-${taskNo}`}
          >
            {T.foto.camera}
          </Button>
          <Button
            variant="ghost"
            onClick={() => gallery.current?.click()}
            data-testid={`c2-foto-gallery-${taskNo}`}
          >
            {T.foto.gallery}
          </Button>
          <input
            ref={camera}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            ref={gallery}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            hidden
            data-testid={`c2-foto-input-${taskNo}`}
            onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      ) : editable ? (
        <p className="c2-hint">{T.foto.limit(MAX_PHOTOS)}</p>
      ) : null}

      {shag.kind === 'edit' ? (
        <FotoRedaktor
          img={shag.img}
          onCancel={() => void nachat(shag.rest)}
          onDone={(p) => void gotovo(shag.img, p, shag.rest, shag.zamena)}
        />
      ) : null}
    </section>
  );
}

function Thumb({
  n,
  photo = null,
  item = null,
  api,
  editable,
  dragging = false,
  first = true,
  last = true,
  onHandle,
  onMove,
  onEdit,
  onRetry,
  onRemove,
}: {
  n: number;
  photo?: Photo | null;
  item?: QItem | null;
  api: FotoBlokProps['api'];
  editable: boolean;
  dragging?: boolean;
  first?: boolean;
  last?: boolean;
  onHandle?: (e: RPointerEvent<HTMLElement>) => void;
  onMove?: (d: -1 | 1) => void;
  onEdit?: () => void;
  onRetry?: () => void;
  onRemove: () => void;
}) {
  const src = useSrc(api, photo, item?.blob ?? null);
  const status =
    item === null
      ? T.foto.status.done
      : item.status === 'up'
        ? T.foto.status.up(item.progress)
        : item.status === 'err'
          ? T.foto.status.err
          : item.offline
            ? T.foto.status.offline
            : T.foto.status.wait;
  return (
    <li
      className={clsx('c2-thumb', dragging && 'is-dragging', item?.status === 'err' && 'is-err')}
      data-foto-id={photo?.id}
      data-testid={photo ? `c2-thumb-${photo.id}` : 'c2-thumb-q'}
    >
      <div className="c2-thumb__img">
        {src === null ? null : <img src={src} alt={T.foto.photo(n)} draggable={false} />}
        <span className="c2-thumb__n">{n}</span>
        {photo !== null && editable ? (
          <span
            className="c2-thumb__handle"
            role="img"
            aria-label={T.foto.drag}
            title={T.foto.drag}
            data-handle={photo.id}
            onPointerDown={onHandle}
          >
            ⠿
          </span>
        ) : null}
      </div>
      {item !== null && item.status === 'up' ? (
        <progress className="c2-thumb__progress" max={1} value={item.progress} />
      ) : null}
      <span
        className={clsx('c2-thumb__status', item?.status === 'err' && 'is-err')}
        data-testid="c2-thumb-status"
      >
        {status}
        {item?.status === 'err' && item.error !== null ? `: ${item.error}` : ''}
      </span>
      {editable ? (
        <div className="c2-thumb__tools">
          {photo !== null ? (
            <>
              <button
                type="button"
                className="c2-mini"
                disabled={first}
                onClick={() => onMove?.(-1)}
                aria-label={`${T.foto.photo(n)}: ${T.foto.left}`}
              >
                ←
              </button>
              <button
                type="button"
                className="c2-mini"
                disabled={last}
                onClick={() => onMove?.(1)}
                aria-label={`${T.foto.photo(n)}: ${T.foto.right}`}
              >
                →
              </button>
              <button type="button" className="c2-mini" onClick={onEdit}>
                {T.foto.edit}
              </button>
            </>
          ) : null}
          {item?.status === 'err' ? (
            <button
              type="button"
              className="c2-mini"
              onClick={onRetry}
              data-testid="c2-thumb-retry"
            >
              {T.foto.retry}
            </button>
          ) : null}
          <button
            type="button"
            className="c2-mini"
            onClick={onRemove}
            aria-label={`${T.foto.photo(n)}: ${T.foto.remove}`}
          >
            ×
          </button>
        </div>
      ) : null}
    </li>
  );
}
