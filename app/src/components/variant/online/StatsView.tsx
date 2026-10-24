'use client';

import { BarChart } from '@/components/ui';
import { ONLINE_TEXT as T } from '@/content/variantOnline/text';
import type { ArchivedWork } from '@/lib/variant/online/archive';
import { computeStats, heatLevel, type TrendPoint } from '@/lib/variant/online/stats';
import { secondsText } from './format';

const W = 620;
const H = 220;
const PAD = { l: 36, r: 16, t: 16, b: 32 };

/** Линия баллов по вариантам: тестовый балл (или процент) по порядку. */
function TrendChart({ points }: { points: TrendPoint[] }) {
  const n = points.length;
  const x = (i: number) =>
    PAD.l + (n <= 1 ? (W - PAD.l - PAD.r) / 2 : (i * (W - PAD.l - PAD.r)) / (n - 1));
  const y = (v: number) => PAD.t + ((100 - v) * (H - PAD.t - PAD.b)) / 100;
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(' ');
  const caption = points.map((p) => `${p.label}: ${p.value}`).join(', ');
  return (
    <svg
      className="vo-trend"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${T.stats.trend}: ${caption}`}
    >
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line className="vo-trend__grid" x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} />
          <text className="vo-trend__axis" x={PAD.l - 6} y={y(g) + 4} textAnchor="end">
            {g}
          </text>
        </g>
      ))}
      {n > 1 ? <path className="vo-trend__line" d={path} /> : null}
      {points.map((p, i) => (
        <g key={`${p.label}-${i}`}>
          <circle className="vo-trend__dot" cx={x(i)} cy={y(p.value)} r={5} />
          <text className="vo-trend__val" x={x(i)} y={y(p.value) - 10} textAnchor="middle">
            {p.value}
          </text>
          <text className="vo-trend__axis" x={x(i)} y={H - 10} textAnchor="middle">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/**
 * Статистика ученика: график баллов, тепловая карта решаемости по
 * номерам 1–13, среднее время на номер и слабые номера. По серии
 * (`code`) или за всё время.
 */
export function StatsView({
  works,
  code,
}: {
  works: readonly ArchivedWork[];
  code: string | null;
}) {
  const s = computeStats(works, code);
  if (s.works === 0) return <p className="vo-note">{T.stats.empty}</p>;
  const anyTest = s.trend.some((p) => p.test);
  const maxAvg = Math.max(1, ...s.numbers.map((n) => n.avgSeconds ?? 0));
  return (
    <div className="vo-stats" data-testid="vo-stats">
      <p className="vo-note">
        {T.stats.works(s.works)} · {T.stats.local}
      </p>

      <section className="vo-stats__block">
        <h3 className="vo-h3">
          {T.stats.trend}{' '}
          <span className="vo-mini">{anyTest ? T.stats.trendTest : T.stats.trendPercent}</span>
        </h3>
        <TrendChart points={s.trend} />
      </section>

      <section className="vo-stats__block">
        <h3 className="vo-h3">{T.stats.heat}</h3>
        <div className="vo-heat" role="table" aria-label={T.stats.heat}>
          <div className="vo-heat__row" role="row">
            {s.numbers.map((n) => (
              <span key={n.egeNumber} className="vo-heat__head" role="columnheader">
                {n.egeNumber}
              </span>
            ))}
          </div>
          <div className="vo-heat__row" role="row">
            {s.numbers.map((n) => (
              <span
                key={n.egeNumber}
                role="cell"
                className="vo-heat__cell heat__cell"
                data-l={n.rate === null ? undefined : heatLevel(n.rate)}
                data-empty={n.rate === null ? '' : undefined}
                title={n.rate === null ? '—' : `${n.right} из ${n.total}`}
              >
                {n.rate === null ? '—' : `${Math.round(n.rate * 100)}%`}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="vo-stats__block">
        <h3 className="vo-h3">{T.stats.time}</h3>
        <BarChart
          className="vo-bars"
          caption={s.numbers
            .map(
              (n) => `№${n.egeNumber}: ${n.avgSeconds === null ? '—' : secondsText(n.avgSeconds)}`,
            )
            .join(', ')}
          bars={s.numbers.map((n) => ({
            label: String(n.egeNumber),
            value: n.avgSeconds === null ? 0 : Math.round((n.avgSeconds / maxAvg) * 100),
          }))}
        />
        <ul className="vo-times">
          {s.numbers
            .filter((n) => n.avgSeconds !== null)
            .map((n) => (
              <li key={n.egeNumber}>
                №{n.egeNumber} — {secondsText(n.avgSeconds ?? 0)}
              </li>
            ))}
        </ul>
      </section>

      <section className="vo-stats__block">
        <h3 className="vo-h3">{T.stats.weak}</h3>
        {s.weak.length === 0 ? (
          <p className="vo-note">{T.stats.weakNone}</p>
        ) : (
          <ul className="vo-weak">
            {s.weak.map((n) => (
              <li key={n.egeNumber}>
                {T.stats.weakRow(n.egeNumber, Math.round((n.rate ?? 0) * 100))}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
