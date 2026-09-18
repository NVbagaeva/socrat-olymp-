import { clsx } from 'clsx';
import type { RisunokState } from './OutcomeTiles';

/**
 * Сетка удобного числа — метод 5.
 *
 * Берём 100 (или 1000) объектов и раскладываем их сеткой 10×10.
 * Проценты и доли становятся клетками, и дальше задача считается как
 * обычная классика: посчитать клетки и поделить.
 */

/** Насыщенность группы. Значения берут цвет из токенов, а не свой. */
export type GroupTone = 'soft' | 'mid' | 'strong';

export interface HundredGroup {
  /** Название группы для легенды. */
  label: string;
  /** Доля от целого: 0,87 — это 87 объектов из 100. */
  share: number;
  tone?: GroupTone;
}

export interface HundredGridProps {
  /** Удобное число: 100, 1000 или 10 000 — сетка всегда 10×10, меняется цена клетки. */
  baseNumber?: 100 | 1000 | 10000;
  groups: readonly HundredGroup[];
  /**
   * Индекс искомой группы. Как и у остальных компонентов — приходит
   * вместе с решением: подсвеченная группа и есть ответ.
   */
  highlightedGroup?: number;
  /** Строка перевода «0,93 → 93». */
  showConversion?: boolean;
  /** Что считаем штуками: «чайника», «жителей». */
  unit?: string;
  state?: RisunokState;
  alt?: string;
  className?: string;
}

const COLS = 10;
const CELL = 22;
const GAP = 3;
const LEGEND_H = 26;

function chislo(value: number): string {
  return String(Math.round(value * 1e6) / 1e6).replace('.', ',');
}

export function HundredGrid({
  baseNumber = 100,
  groups,
  highlightedGroup,
  showConversion = false,
  unit,
  state = 'default',
  alt,
  className,
}: HundredGridProps) {
  /* Клетка одна и та же при любом удобном числе: при 1000 в клетке
     десять объектов, сетка остаётся 10×10. */
  const naKletku = baseNumber / (COLS * COLS);

  /* Раскладываем группы по клеткам подряд. Доли считаем в клетках,
     чтобы сетка всегда заполнялась ровно. */
  const kletok: number[] = [];
  groups.forEach((g, i) => {
    const skolko = Math.round((g.share * baseNumber) / naKletku);
    for (let k = 0; k < skolko; k += 1) {
      kletok.push(i);
    }
  });

  const width = COLS * (CELL + GAP) - GAP;
  const gridH = Math.ceil((COLS * COLS) / COLS) * (CELL + GAP) - GAP;
  const height = gridH + groups.length * LEGEND_H + (showConversion ? LEGEND_H : 0) + 14;

  const shtuk = (g: HundredGroup): number => Math.round(g.share * baseNumber);

  return (
    <svg
      className={clsx('pr-hundred', `pr-is-${state}`, className)}
      viewBox={`0 0 ${Math.max(width, 260)} ${height}`}
      width={Math.max(width, 260)}
      height={height}
      role="img"
      aria-label={
        alt ??
        `Сетка из ${baseNumber} объектов: ` +
          groups.map((g) => `${g.label} — ${shtuk(g)}`).join(', ')
      }
    >
      {Array.from({ length: COLS * COLS }, (_, i) => {
        const gruppa = kletok[i];
        const podsvechena = gruppa !== undefined && gruppa === highlightedGroup;
        const priglushena =
          highlightedGroup !== undefined && gruppa !== undefined && gruppa !== highlightedGroup;
        return (
          <rect
            key={i}
            className={clsx(
              'pr-unit',
              gruppa === undefined ? 'pr-unit--empty' : `pr-unit--${groups[gruppa]?.tone ?? 'mid'}`,
              podsvechena && 'pr-unit--highlighted',
              priglushena && 'pr-unit--dimmed',
            )}
            x={(i % COLS) * (CELL + GAP)}
            y={Math.floor(i / COLS) * (CELL + GAP)}
            width={CELL}
            height={CELL}
            rx="4"
          />
        );
      })}

      {/* Легенда: сколько штук в каждой группе. */}
      {groups.map((g, i) => (
        <g
          key={i}
          className={clsx(
            'pr-legend',
            i === highlightedGroup && 'pr-legend--highlighted',
            highlightedGroup !== undefined && i !== highlightedGroup && 'pr-legend--dimmed',
          )}
        >
          <rect
            className={clsx(
              'pr-unit',
              `pr-unit--${g.tone ?? 'mid'}`,
              i === highlightedGroup && 'pr-unit--highlighted',
            )}
            x="0"
            y={gridH + 14 + i * LEGEND_H}
            width={CELL - 4}
            height={CELL - 4}
            rx="4"
          />
          <text
            x={CELL + 6}
            y={gridH + 14 + i * LEGEND_H + (CELL - 4) / 2}
            dominantBaseline="central"
          >
            {`${shtuk(g)} — ${g.label}`}
          </text>
        </g>
      ))}

      {/* Перевод доли в штуки — та самая мысль метода. */}
      {showConversion &&
      highlightedGroup !== undefined &&
      groups[highlightedGroup] !== undefined ? (
        <text className="pr-math pr-total" x="0" y={height - 6}>
          {`${chislo(groups[highlightedGroup].share)} → ${shtuk(groups[highlightedGroup])}` +
            (unit === undefined ? '' : ` ${unit}`)}
        </text>
      ) : null}
    </svg>
  );
}
