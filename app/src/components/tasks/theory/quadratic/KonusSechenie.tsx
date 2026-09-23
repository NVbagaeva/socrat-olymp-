import { chertyozh } from '@/lib/graph/konus3d.js';
import { istoriya } from '@/content/theoryQuadratic';

/**
 * Конус, секущая плоскость и парабола сечения — одним чертежом.
 *
 * Ни одной координаты здесь нет: всю геометрию считает lib/graph/konus3d.js
 * — конус в трёх измерениях, плоскость, параллельная образующей (это
 * и есть условие параболы), линия их пересечения точками и одна общая
 * проекция на все элементы. Проверка геометрии числами — в
 * scripts/check-konus.mjs.
 *
 * Порядок слоёв: заливка плоскости, заливка конуса, рёбра конуса,
 * контур плоскости и сверху парабола. Контур плоскости идёт поверх
 * конуса, а заливка — под ним: так читается стекло, у которого
 * видно и то, что за ним.
 */
export function KonusSechenie({ className }: { className?: string }) {
  const c = chertyozh({});

  return (
    <svg
      className={className === undefined ? 'konus' : `konus ${className}`}
      viewBox={c.viewBox}
      role="img"
      aria-label={istoriya.konus.alt}
    >
      <path className="konus__ploskost-fon" d={c.ploskost.zalivka} />
      <path className="konus__fon" d={c.konus.zalivka} />
      {c.konus.obrazuyushchie.map((d: string) => (
        <path className="konus__rebro" d={d} key={d} />
      ))}
      {c.konus.obodVidno.map((d: string) => (
        <path className="konus__rebro" d={d} key={d} />
      ))}
      {c.konus.obodSkryto.map((d: string) => (
        <path className="konus__rebro konus__rebro--za" d={d} key={d} />
      ))}
      <path className="konus__ploskost" d={c.ploskost.zalivka} />
      {c.parabola.skryto.map((d: string) => (
        <path className="konus__parabola konus__parabola--za" d={d} key={d} />
      ))}
      {c.parabola.vidno.map((d: string) => (
        <path className="konus__parabola" d={d} key={d} />
      ))}
    </svg>
  );
}
