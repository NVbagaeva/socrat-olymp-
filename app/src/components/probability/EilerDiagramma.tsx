import { clsx } from 'clsx';
import { EILER, raskladkaEilera } from './eilerRaskladka';
import type { RisunokState } from './OutcomeTiles';

/**
 * Диаграмма Эйлера с точками-исходами — задание №6.
 *
 * Прямоугольник — случайный опыт $S$, точки — элементарные события.
 * Над точкой — значение случайной величины, справа снизу мелко —
 * вероятность элементарного события (если задана; у равновозможных
 * исходов её нет). Раскладку точек делает eilerRaskladka.ts: подписи
 * не налезают друг на друга, на чужие точки и на край.
 *
 * Выделение точек (`highlighted`) — как и у остальных рисунков, только
 * вместе с решением: на листе ученика его нет.
 */

export interface EilerTochka {
  /** Значение величины: «6», «−2», «1,5» — уже с запятой и минусом. */
  x: string;
  /** Вероятность: «0,05». Нет — исходы равновозможны. */
  p?: string;
}

export interface EilerDiagrammaProps {
  tochki: readonly EilerTochka[];
  /** Зерно раскладки: одна задача — один рисунок. */
  zerno: string;
  /** Номера выделенных точек (с нуля). */
  highlighted?: readonly number[];
  /** Буква опыта. */
  opyt?: string;
  state?: RisunokState;
  alt?: string;
  className?: string;
}

export function EilerDiagramma({
  tochki,
  zerno,
  highlighted,
  opyt = 'S',
  state = 'default',
  alt,
  className,
}: EilerDiagrammaProps) {
  const r = raskladkaEilera(tochki, zerno);
  const vyd = new Set(highlighted ?? []);
  const est = highlighted !== undefined;
  return (
    <svg
      data-engine="veroyatnost"
      className={clsx('pr-eiler', `pr-is-${state}`, className)}
      viewBox={`0 0 ${r.w} ${r.h}`}
      width={r.w}
      height={r.h}
      role="img"
      aria-label={
        alt ??
        `Диаграмма Эйлера: опыт ${opyt}, ${tochki.length} элементарных событий; ` +
          tochki.map((t) => (t.p ? `${t.x} (вероятность ${t.p})` : t.x)).join(', ')
      }
    >
      <rect
        className="pr-eiler__opyt"
        x={EILER.pole}
        y={EILER.pole}
        width={r.w - 2 * EILER.pole}
        height={r.h - 2 * EILER.pole}
        rx="3"
      />
      <text className="pr-math pr-eiler__s" x={r.s.x} y={r.s.y + r.s.halfH - 2} textAnchor="middle">
        {opyt}
      </text>
      {r.tochki.map((t, i) => {
        const dano = tochki[i] as EilerTochka;
        return (
          <g
            key={i}
            className={clsx(
              'pr-eiler__tochka',
              vyd.has(i) && 'is-vydelena',
              est && !vyd.has(i) && 'is-priglushena',
            )}
          >
            {/* Выделенная точка крупнее и цветом акцента: кольцо задевало бы подписи. */}
            <circle cx={t.cx} cy={t.cy} r={vyd.has(i) ? EILER.r + 1.6 : EILER.r} />
            <text
              className="pr-eiler__x"
              x={t.znachenie.x}
              y={t.znachenie.y + t.znachenie.halfH - 1}
              textAnchor="middle"
            >
              {dano.x}
            </text>
            {t.veroyatnost && dano.p ? (
              <text
                className="pr-eiler__p"
                x={t.veroyatnost.x - t.veroyatnost.halfW + 1}
                y={t.veroyatnost.y + t.veroyatnost.halfH - 1}
              >
                {dano.p}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
