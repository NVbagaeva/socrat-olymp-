'use client';

import katex from 'katex';
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type Construction, type ObjId, type PlaneRef, rat, toArray } from '@/lib/zadanie15/core';
import {
  type Camera,
  DEFAULT_CAMERA,
  type Mode,
  type P2,
  type Scene2D,
  type Vec,
  buildScene,
  facingPlane,
  lerpCamera,
  orbit,
} from '@/lib/zadanie15/scene';
import { typeset } from '@/lib/tex';
import { Shagi15 } from './Shagi15';
import { ANIM, type Ages, StsenaSvg } from './StsenaSvg';

export interface Stsena15Props {
  /** Построение и продлённые грани — из сценария. */
  build: () => { c: Construction; facePlanes: number[] };
  mode: Mode;
  /** Тренажёр после проверки: показать линии и кандидатов для сравнения. */
  reveal?: boolean;
  /** Служебно: отдать замер кадров перетаскивания. */
  onFps?: (fps: number) => void;
}

/** Шаг перетаскивания по ребру: 1/24 — делятся и половины, и трети, и четверти. */
const DRAG_STEPS = 24;
/** Длительность доворота камеры на плоскость. */
const CAMERA_TURN = 600;
/** Пауза между шагами при воспроизведении. */
const PLAY_STEP = 1400;
/** Сколько держать сообщение о параллельных плоскостях. */
const NOTICE_MS = 2600;
/** Плоскостей на сцене одновременно, построенных и граней вместе. */
const MAX_PLANES = 4;

const tex = (() => {
  const cache = new Map<string, string>();
  return (s: string): string => {
    const hit = cache.get(s);
    if (hit !== undefined) return hit;
    const html = katex.renderToString(s, { throwOnError: false, displayMode: false });
    cache.set(s, html);
    return html;
  };
})();

/** Прямые пересечения всех пар видимых плоскостей; возвращает добавленные. */
function syncMeets(c: Construction, facePlanes: Iterable<number>, auto: boolean): ObjId[] {
  if (!auto) return [];
  const refs: PlaneRef[] = [
    ...c
      .all()
      .flatMap((o) => (o.kind === 'plane' ? [{ kind: 'plane', id: o.id } as PlaneRef] : [])),
    ...[...facePlanes].map((face) => ({ kind: 'face', face }) as PlaneRef),
  ];
  const added: ObjId[] = [];
  for (let i = 0; i < refs.length; i++) {
    for (let j = i + 1; j < refs.length; j++) {
      const a = refs[i] as PlaneRef;
      const b = refs[j] as PlaneRef;
      /* Две плоскости граней пересекаются по ребру — оно и так на чертеже. */
      if (a.kind === 'face' && b.kind === 'face') continue;
      if (c.findMeet(a, b) !== null) continue;
      const r = c.planeMeet(a, b);
      if (r.ok) added.push(r.value);
    }
  }
  return added;
}

interface Gesture {
  kind: 'orbit' | 'drag';
  id: number;
  x: number;
  y: number;
  moved: boolean;
  cam: Camera;
  point?: ObjId;
  edge?: number;
  target: Element | null;
  frames: number;
  t0: number;
}

/**
 * Сцена задания №15: многогранник, плоскости и линии их пересечения.
 *
 * Состояние построения живёт в Construction из ядра (мутируется на
 * месте), React видит его через счётчик версии. Сцена пересобирается
 * на каждую отрисовку: это сотни операций над дробями, укладывается
 * в кадр и на телефоне.
 */
export function Stsena15({ build, mode, reveal = false, onFps }: Stsena15Props) {
  const auto = mode === 'learn' || reveal;
  const [state] = useState(() => {
    const built = build();
    syncMeets(built.c, built.facePlanes, auto);
    return built;
  });
  const c = state.c;
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const [camera, setCamera] = useState<Camera>(DEFAULT_CAMERA);
  const [facePlanes, setFacePlanes] = useState<ReadonlySet<number>>(
    () => new Set(state.facePlanes),
  );
  const [selected, setSelected] = useState<ObjId | null>(null);
  const [upTo, setUpTo] = useState<number>(() => c.steps().length - 1);
  const [playing, setPlaying] = useState(false);
  const [dragging, setDragging] = useState<ObjId | null>(null);
  const [facingId, setFacingId] = useState<string>('');

  /* Когда объект появился: по этому элемент при первой отрисовке
     берёт отступ анимации и дальше идёт сам. Часы — состояние, которое
     тикает по кадрам, пока есть недавно появившиеся объекты. */
  const [born, setBorn] = useState<ReadonlyMap<string, number>>(() => new Map());
  const [now, setNow] = useState(0);
  const markBorn = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const at = performance.now();
    setBorn((prev) => {
      const next = new Map(prev);
      for (const id of ids) next.set(id, at);
      return next;
    });
    setNow(at);
  }, []);
  useEffect(() => {
    if (born.size === 0) return;
    let frame = 0;
    const ttl = ANIM.plane + ANIM.flash + ANIM.line;
    const loop = () => {
      const t = performance.now();
      const alive = [...born].filter(([, at]) => t - at <= ttl);
      if (alive.length !== born.size) setBorn(new Map(alive));
      setNow(t);
      if (alive.length > 0) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [born]);

  const steps = useMemo(
    () => c.steps().map((id) => ({ id, html: typeset(c.describe(id)) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [c, version],
  );

  const scene: Scene2D = useMemo(
    () =>
      buildScene(c, {
        camera,
        mode,
        reveal,
        facePlanes: [...facePlanes],
        upTo,
        selected,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [c, camera, mode, reveal, facePlanes, upTo, selected, version],
  );

  /* Сообщение о параллельных плоскостях: показывается, пока они на
     сцене, но не дольше NOTICE_MS с момента появления. */
  const [noticeSeen, setNoticeSeen] = useState(false);
  const noticeOn = scene.notice !== null;
  useEffect(() => {
    if (!noticeOn) return;
    const t = window.setTimeout(() => setNoticeSeen(true), NOTICE_MS);
    return () => window.clearTimeout(t);
  }, [noticeOn, facePlanes]);
  const notice = noticeOn && !noticeSeen ? scene.notice : null;

  const ages: Ages = useMemo(() => {
    const m = new Map<string, number>();
    for (const [id, at] of born) m.set(id, Math.max(0, now - at));
    return m;
  }, [born, now]);

  /* ── Камера: поворот и доворот на плоскость ───────────────── */

  const camAnim = useRef<number>(0);
  const turnTo = useCallback(
    (target: Camera) => {
      cancelAnimationFrame(camAnim.current);
      const from = camera;
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / CAMERA_TURN);
        setCamera(lerpCamera(from, target, k));
        if (k < 1) camAnim.current = requestAnimationFrame(step);
      };
      camAnim.current = requestAnimationFrame(step);
    },
    [camera],
  );
  useEffect(() => () => cancelAnimationFrame(camAnim.current), []);

  const lookAt = (sheetId: string) => {
    const sheet = scene.sheets.find((s) => s.id === sheetId);
    if (sheet === undefined) return;
    const n = toArray(c.planeOf(sheet.ref).n) as Vec;
    turnTo(facingPlane(n, camera));
  };

  /* ── Указатель: поворот, перетаскивание, тапы ─────────────── */

  const stageRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const dragFrame = useRef(0);
  const fpsFrame = useRef(0);

  const toView = (e: { clientX: number; clientY: number }): P2 => {
    const el = stageRef.current?.querySelector('svg');
    if (!el) return [0, 0];
    const r = el.getBoundingClientRect();
    return [
      ((e.clientX - r.left) / r.width) * scene.size,
      ((e.clientY - r.top) / r.height) * scene.size,
    ];
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target as Element;
    const pointEl = target.closest<SVGElement>('[data-point]');
    setPlaying(false);
    e.currentTarget.setPointerCapture(e.pointerId);
    const base = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      moved: false,
      cam: camera,
      target,
      frames: 0,
      t0: performance.now(),
    };
    if (pointEl !== null) {
      const point = pointEl.getAttribute('data-point') as ObjId;
      const edge = Number(pointEl.getAttribute('data-edge'));
      const g: Gesture = { kind: 'drag', point, edge, ...base };
      gesture.current = g;
      setDragging(point);
      /* Счётчик кадров на время перетаскивания — для замера частоты. */
      const tick = () => {
        if (gesture.current !== g) return;
        g.frames += 1;
        fpsFrame.current = requestAnimationFrame(tick);
      };
      fpsFrame.current = requestAnimationFrame(tick);
    } else {
      gesture.current = { kind: 'orbit', ...base };
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (g === null || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.moved && Math.hypot(dx, dy) < 4) return;
    g.moved = true;
    if (g.kind === 'orbit') {
      setCamera(orbit(g.cam, dx, dy));
      return;
    }
    /* Точка по ребру: ближайшая к пальцу позиция на проекции ребра,
       округлённая до 1/24 — чтобы отношения оставались простыми.
       Параметр ядра идёт от первого конца ребра, экранное ребро тоже. */
    const edge = scene.edges[g.edge as number];
    const point = g.point as ObjId;
    if (edge === undefined) return;
    const q = toView(e);
    const ex = edge.b[0] - edge.a[0];
    const ey = edge.b[1] - edge.a[1];
    const len2 = ex * ex + ey * ey || 1;
    const raw = ((q[0] - edge.a[0]) * ex + (q[1] - edge.a[1]) * ey) / len2;
    const k = Math.max(1, Math.min(DRAG_STEPS - 1, Math.round(raw * DRAG_STEPS)));
    const cur = c.point(point).origin;
    if (cur.op !== 'onEdge') return;
    if (cur.t.d === BigInt(DRAG_STEPS) && cur.t.n === BigInt(k)) return;
    cancelAnimationFrame(dragFrame.current);
    dragFrame.current = requestAnimationFrame(() => {
      const r = c.setEdgeParam(point, rat(k, DRAG_STEPS));
      if (r.ok) bump();
    });
  };

  const toggleFace = (face: number) => {
    /* Построение меняется здесь, а не внутри обновителя состояния:
       обновитель React может вызвать дважды. */
    const next = new Set(facePlanes);
    if (next.has(face)) {
      next.delete(face);
      for (const lid of c.linesOfFace(face)) c.remove(lid);
      if (selected !== null && !c.has(selected)) setSelected(null);
    } else {
      const planesNow = c.all().filter((o) => o.kind === 'plane').length;
      if (next.size + planesNow >= MAX_PLANES) return;
      next.add(face);
      const added = syncMeets(c, next, auto);
      markBorn([`face:${face}`, ...added]);
      setUpTo(c.steps().length - 1);
    }
    setNoticeSeen(false);
    setFacePlanes(next);
    bump();
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (g === null || g.id !== e.pointerId) return;
    gesture.current = null;
    cancelAnimationFrame(fpsFrame.current);
    setDragging(null);
    if (g.kind === 'drag' && g.moved && onFps) {
      const sec = (performance.now() - g.t0) / 1000;
      if (sec > 0.3) onFps(g.frames / sec);
    }
    if (g.moved) return;
    /* Тап. */
    const t = g.target;
    const lineEl = t?.closest<SVGElement>('[data-line]');
    const faceEl = t?.closest<SVGElement>('[data-face]');
    if (lineEl) {
      const id = lineEl.getAttribute('data-line') as ObjId;
      setSelected((s) => (s === id ? null : id));
      return;
    }
    if (faceEl) {
      toggleFace(Number(faceEl.getAttribute('data-face')));
      return;
    }
    setSelected(null);
  };

  /* ── Пошаговый показ ──────────────────────────────────────── */

  const goTo = useCallback(
    (next: number) => {
      const n = c.steps().length;
      const clamped = Math.max(-1, Math.min(n - 1, next));
      setUpTo((prev) => {
        if (clamped > prev) markBorn(c.steps().slice(prev + 1, clamped + 1));
        return clamped;
      });
      setSelected(null);
    },
    [c, markBorn],
  );

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => {
      const n = c.steps().length;
      if (upTo + 1 >= n - 1) setPlaying(false);
      goTo(upTo + 1);
    }, PLAY_STEP);
    return () => window.clearTimeout(t);
  }, [playing, upTo, goTo, c]);

  const play = (on: boolean) => {
    if (on && upTo >= c.steps().length - 1) goTo(-1);
    setPlaying(on);
  };

  const selectedText = selected !== null && c.has(selected) ? typeset(c.describe(selected)) : null;
  const pct = (v: number) => `${(v / scene.size) * 100}%`;

  return (
    <div className="s15">
      <div className="s15-tools">
        <label className="s15-tools__look">
          <span className="s15-tools__label">Смотреть на плоскость прямо</span>
          <select
            className="input s15-tools__select"
            value={facingId}
            onChange={(e) => {
              setFacingId(e.target.value);
              if (e.target.value !== '') lookAt(e.target.value);
            }}
          >
            <option value="">— выбрать —</option>
            {scene.sheets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.isFace ? `грань ${c.planeName(s.ref)}` : `плоскость ${c.planeName(s.ref)}`}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn--ghost s15-tools__reset"
          onClick={() => {
            setFacingId('');
            turnTo(DEFAULT_CAMERA);
          }}
        >
          Исходный вид
        </button>
      </div>

      <div
        ref={stageRef}
        className={['s15-stage', dragging !== null ? 'is-dragging' : ''].join(' ')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <StsenaSvg scene={scene} ages={ages} dragging={dragging} />
        <div className="s15-labels" aria-hidden="true">
          {scene.points.map((p) => (
            <span
              key={p.id}
              className={['s15-label', 's15-label--point', p.highlighted ? 'is-hl' : ''].join(' ')}
              style={{ left: pct(p.label[0]), top: pct(p.label[1]) }}
              dangerouslySetInnerHTML={{ __html: tex(p.tex) }}
            />
          ))}
          {scene.sheets.map((s) => (
            <span
              key={s.id}
              className={['s15-label', 's15-label--plane', s.isFace ? 's15-label--face' : ''].join(
                ' ',
              )}
              style={
                { left: pct(s.label.p[0]), top: pct(s.label.p[1]), '--c': s.color } as CSSProperties
              }
              dangerouslySetInnerHTML={{ __html: tex(s.label.tex) }}
            />
          ))}
          {scene.lines.map((l) =>
            l.label === null ? null : (
              <span
                key={l.id}
                className={['s15-label', `s15-label--${l.kind}`, l.selected ? 'is-hl' : ''].join(
                  ' ',
                )}
                style={
                  {
                    left: pct(l.label.p[0]),
                    top: pct(l.label.p[1]),
                    '--c': l.color,
                  } as CSSProperties
                }
                dangerouslySetInnerHTML={{ __html: tex(l.label.tex) }}
              />
            ),
          )}
        </div>
        {notice !== null ? (
          <div className="s15-notice" role="status">
            {notice}
          </div>
        ) : null}
      </div>

      <p className="s15-hint">
        Поворот — перетаскиванием пустого места; точки на рёбрах тянутся пальцем или мышью; тап по
        грани продлевает её плоскость; тап по линии пересечения — обоснование.
      </p>

      {selectedText !== null ? (
        <div className="s15-why" role="note">
          <span className="s15-why__title">Почему это линия пересечения</span>
          <span className="s15-why__text" dangerouslySetInnerHTML={{ __html: selectedText }} />
        </div>
      ) : null}

      <Shagi15 steps={steps} upTo={upTo} playing={playing} onChange={goTo} onPlay={play} />
    </div>
  );
}
