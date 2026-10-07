'use client';

import { type CSSProperties, useState } from 'react';
import type { P2, Scene2D, SceneLine, SceneSheet } from '@/lib/zadanie15/scene';

/** Длительности появления, мс. Одно место на компонент и стили. */
export const ANIM = {
  /** Лист плоскости вырастает из трёх точек. */
  plane: 600,
  /** Вспышка общих точек перед прочерчиванием линии. */
  flash: 350,
  /** Линия прочерчивается в обе стороны до края рамки. */
  line: 500,
} as const;

/** Возраст объекта на экране, если он ещё в анимации появления. */
export type Ages = ReadonlyMap<string, number>;

export interface StsenaSvgProps {
  scene: Scene2D;
  /** Для недавно появившихся объектов: сколько мс назад — чтобы анимация шла с нужного места. */
  ages: Ages;
  /** Точка, которую сейчас тащат. */
  dragging: string | null;
}

const r1 = (x: number): string => (Math.round(x * 10) / 10).toString();
const pts = (list: readonly P2[]): string => list.map((p) => `${r1(p[0])},${r1(p[1])}`).join(' ');
const seg = (a: P2, b: P2): string => `M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}`;
const gradId = (sheetId: string) => `s15g-${sheetId.replace(/[^a-z0-9]/gi, '')}`;

/**
 * Возраст объекта замораживается при первой отрисовке: с него
 * начинается анимация появления, а дальше она идёт сама, и
 * перерисовки сцены (поворот камеры) её не сбивают.
 */
function useMountAge(age: number | undefined): number | undefined {
  const [frozen] = useState(age);
  return frozen;
}

function Sheet({ s, age: liveAge }: { s: SceneSheet; age: number | undefined }) {
  const age = useMountAge(liveAge);
  const grad = gradId(s.id);
  const cx = s.points.reduce((a, p) => a + p[0], 0) / (s.points.length || 1);
  const cy = s.points.reduce((a, p) => a + p[1], 0) / (s.points.length || 1);
  const rr = Math.max(...s.points.map((p) => Math.hypot(p[0] - cx, p[1] - cy)), 1);
  const style: Record<string, string> = {
    '--c': s.color,
    transformOrigin: `${r1(s.origin[0])}px ${r1(s.origin[1])}px`,
  };
  if (age !== undefined) style.animationDelay = `-${Math.round(age)}ms`;
  return (
    <g
      className={[
        's15-sheet',
        s.isFace ? 's15-sheet--face' : '',
        s.highlighted ? 'is-hl' : '',
        age !== undefined ? 'is-new' : '',
      ].join(' ')}
      style={style as CSSProperties}
    >
      <defs>
        <radialGradient id={grad} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={rr}>
          <stop offset="0" className="s15-sheet__stop s15-sheet__stop--in" />
          <stop offset="0.62" className="s15-sheet__stop s15-sheet__stop--mid" />
          <stop offset="1" className="s15-sheet__stop s15-sheet__stop--out" />
        </radialGradient>
      </defs>
      <polygon className="s15-sheet__body" points={pts(s.points)} fill={`url(#${grad})`} />
      <polygon className="s15-sheet__rim" points={pts(s.points)} />
    </g>
  );
}

/** Куски листа перед телом — поверх граней, тем же градиентом. */
function SheetFront({ s }: { s: SceneSheet }) {
  const grad = gradId(s.id);
  return (
    <g
      className={['s15-sheet s15-sheet--front', s.isFace ? 's15-sheet--face' : ''].join(' ')}
      style={{ '--c': s.color } as CSSProperties}
    >
      {s.frontParts.map((part, i) => (
        <polygon key={i} className="s15-sheet__body" points={pts(part)} fill={`url(#${grad})`} />
      ))}
    </g>
  );
}

function Line({ l, age: liveAge }: { l: SceneLine; age: number | undefined }) {
  const age = useMountAge(liveAge);
  const clip = `s15c-${l.id}`;
  const R = Math.max(
    ...l.runs.flatMap((s) => [
      Math.hypot(s.a[0] - l.origin[0], s.a[1] - l.origin[1]),
      Math.hypot(s.b[0] - l.origin[0], s.b[1] - l.origin[1]),
    ]),
    1,
  );
  const fresh = age !== undefined && l.kind === 'meet';
  /* Прочерчивание начинается после вспышки точек; отрицательное
     begin продолжает анимацию с нужного места после перерисовки. */
  const begin = fresh ? `${((ANIM.flash - (age ?? 0)) / 1000).toFixed(3)}s` : undefined;
  return (
    <g
      className={[
        's15-line',
        `s15-line--${l.kind}`,
        l.selected ? 'is-selected' : '',
        fresh ? 'is-new' : '',
      ].join(' ')}
      data-line={l.id}
      style={{ '--c': l.color } as CSSProperties}
    >
      {fresh ? (
        <clipPath id={clip}>
          <circle cx={l.origin[0]} cy={l.origin[1]} r={0}>
            <animate
              attributeName="r"
              from="0"
              to={R.toFixed(1)}
              dur={`${ANIM.line / 1000}s`}
              begin={begin}
              fill="freeze"
            />
          </circle>
        </clipPath>
      ) : null}
      <g clipPath={fresh ? `url(#${clip})` : undefined}>
        {/* Широкая прозрачная зона нажатия: по тонкой линии пальцем не попасть. */}
        {l.runs.map((s, i) => (
          <path key={`h${i}`} className="s15-line__hit" d={seg(s.a, s.b)} />
        ))}
        {l.runs.map((s, i) => (
          <path
            key={i}
            className={s.visible ? 's15-line__vis' : 's15-line__hid'}
            d={seg(s.a, s.b)}
          />
        ))}
      </g>
    </g>
  );
}

function Flash({ p, color, age: liveAge }: { p: P2; color: string; age: number }) {
  const age = useMountAge(liveAge) ?? 0;
  return (
    <circle
      className="s15-flash"
      cx={p[0]}
      cy={p[1]}
      r={6}
      style={{ '--c': color, animationDelay: `-${Math.round(age)}ms` } as CSSProperties}
    />
  );
}

export function StsenaSvg({ scene, ages, dragging }: StsenaSvgProps) {
  const { size } = scene;
  const pointAt = new Map<string, P2>();
  for (const p of scene.points) pointAt.set(p.id, p.p);
  return (
    <svg
      className="s15-svg"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Многогранник, плоскости и линии их пересечения"
    >
      {/* 1. Листы плоскостей за телом */}
      {scene.sheets.map((s) => (
        <Sheet key={s.id} s={s} age={ages.get(s.id)} />
      ))}
      {/* 2. Сечения */}
      {scene.sections.map((s) => (
        <polygon
          key={s.planeId}
          className="s15-section"
          points={pts(s.points)}
          style={{ '--c': s.color } as CSSProperties}
        />
      ))}
      {/* 3. Передние грани — по ним же тап продлевает плоскость грани */}
      {scene.faces
        .filter((f) => f.front)
        .map((f) => (
          <polygon key={f.index} className="s15-face" data-face={f.index} points={pts(f.points)} />
        ))}
      {/* 4. Листы перед телом */}
      {scene.sheets.map((s) => (
        <SheetFront key={`${s.id}:front`} s={s} />
      ))}
      {/* 5. Скрытые рёбра и скрытые куски контура сечения */}
      <g className="s15-edges">
        {scene.edges
          .filter((e) => !e.visible)
          .map((e) => (
            <path key={e.index} className="s15-edge s15-edge--hid" d={seg(e.a, e.b)} />
          ))}
      </g>
      {scene.sections.map((s) => (
        <g
          key={`${s.planeId}:hid`}
          className="s15-section-outline"
          style={{ '--c': s.color } as CSSProperties}
        >
          {s.outline
            .filter((o) => !o.visible)
            .map((o, i) => (
              <path key={i} className="s15-section__hid" d={seg(o.a, o.b)} />
            ))}
        </g>
      ))}
      {/* 6. Линии построения и пересечения, с видимостью */}
      {scene.lines.map((l) => (
        <Line key={l.id} l={l} age={ages.get(l.id)} />
      ))}
      {/* 7. Видимые рёбра и видимый контур сечения */}
      <g className="s15-edges">
        {scene.edges
          .filter((e) => e.visible)
          .map((e) => (
            <path key={e.index} className="s15-edge" d={seg(e.a, e.b)} />
          ))}
      </g>
      {scene.sections.map((s) => (
        <g
          key={`${s.planeId}:vis`}
          className="s15-section-outline"
          style={{ '--c': s.color } as CSSProperties}
        >
          {s.outline
            .filter((o) => o.visible)
            .map((o, i) => (
              <path key={i} className="s15-section__vis" d={seg(o.a, o.b)} />
            ))}
        </g>
      ))}
      {/* 8. Кандидаты в вершины сечения — пустые кружки */}
      {scene.candidates.map((cd, i) => {
        const line = scene.lines.find((l) => l.id === cd.lineId);
        return (
          <circle
            key={`${cd.lineId}:${i}`}
            className={['s15-cand', cd.onSegment ? '' : 's15-cand--ext'].join(' ')}
            cx={cd.p[0]}
            cy={cd.p[1]}
            r={6}
            style={{ '--c': line?.color ?? 'var(--color-primary)' } as CSSProperties}
          />
        );
      })}
      {/* 9. Вспышка общих точек появившейся линии */}
      {scene.lines
        .filter((l) => l.kind === 'meet' && ages.has(l.id))
        .flatMap((l) =>
          l.through.map((pid) => {
            const p = pointAt.get(pid);
            return p === undefined ? null : (
              <Flash key={`${l.id}:${pid}`} p={p} color={l.color} age={ages.get(l.id) ?? 0} />
            );
          }),
        )}
      {/* 10. Точки */}
      {scene.points.map((p) => (
        <g
          key={p.id}
          className={[
            's15-point',
            `s15-point--${p.kind}`,
            p.draggable ? 'is-drag' : '',
            p.highlighted ? 'is-hl' : '',
            dragging === p.id ? 'is-active' : '',
          ].join(' ')}
          data-point={p.draggable ? p.id : undefined}
          data-name={p.tex}
          data-edge={p.edge ?? undefined}
        >
          {p.draggable ? (
            <circle className="s15-point__hit" cx={p.p[0]} cy={p.p[1]} r={22} />
          ) : null}
          {p.highlighted ? (
            <circle className="s15-point__ring" cx={p.p[0]} cy={p.p[1]} r={11} />
          ) : null}
          <circle
            className="s15-point__dot"
            cx={p.p[0]}
            cy={p.p[1]}
            r={dragging === p.id ? 8 : p.draggable ? 6 : 4.5}
          />
        </g>
      ))}
    </svg>
  );
}
