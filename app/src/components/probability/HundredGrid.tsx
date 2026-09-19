import { clsx } from 'clsx';
import type { RisunokState } from './OutcomeTiles';
import { Znaki } from './Znaki';

/**
 * Сетка удобного числа — метод 5.
 *
 * Берём 100 (1000, 10 000) объектов и раскладываем их сеткой 10×10.
 * Проценты и доли становятся клетками, и дальше задача считается как
 * обычная классика: посчитать клетки и поделить.
 *
 * Искомых групп может быть несколько: в формуле полной вероятности
 * бракованные детали складываются с двух заводов. Тогда подсвечены
 * все искомые группы, а строка перевода складывает их штуки.
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
  /** Несколько искомых групп сразу: их штуки складываются. */
  highlightedGroups?: readonly number[];
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

/** Целое с разбивкой на тысячи от пяти знаков: «10 000», но «1000». */
export function tselo(value: number): string {
  const s = String(Math.round(value));
  return s.length >= 5 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s;
}

export function HundredGrid({
  baseNumber = 100,
  groups,
  highlightedGroup,
  highlightedGroups,
  showConversion = false,
  unit,
  state = 'default',
  alt,
  className,
}: HundredGridProps) {
  /* Клетка одна и та же при любом удобном числе: при 1000 в клетке
     десять объектов, при 10 000 — сто; сетка остаётся 10×10. */
  const naKletku = baseNumber / (COLS * COLS);

  /* Искомые группы по порядку: список важнее одиночного индекса. */
  const iskomye = highlightedGroups ?? (highlightedGroup === undefined ? [] : [highlightedGroup]);
  const iskoma = new Set(iskomye);
  const podsvetka = iskoma.size > 0;

  /* Раскладываем группы по клеткам подряд. Доли считаем в клетках,
     чтобы сетка всегда заполнялась ровно. */
  const kletok: number[] = [];
  groups.forEach((g, i) => {
    const skolko = Math.round((g.share * baseNumber) / naKletku);
    for (let k = 0; k < skolko; k += 1) {
      kletok.push(i);
    }
  });

  const gridW = COLS * (CELL + GAP) - GAP;
  const gridH = Math.ceil((COLS * COLS) / COLS) * (CELL + GAP) - GAP;
  const height = gridH + groups.length * LEGEND_H + (showConversion ? LEGEND_H : 0) + 14;

  const shtuk = (g: HundredGroup): number => Math.round(g.share * baseNumber);

  /* Строка перевода: одна группа — «0,93 → 93»; несколько —
     «0,03 + 0,01 → 300 + 100 = 400». */
  const nuzhnye = iskomye.map((i) => groups[i]).filter((g): g is HundredGroup => g !== undefined);
  const [odna] = nuzhnye;
  const perevod =
    odna === undefined
      ? null
      : nuzhnye.length === 1
        ? `${chislo(odna.share)} → ${tselo(shtuk(odna))}`
        : `${nuzhnye.map((g) => chislo(g.share)).join(' + ')} → ` +
          `${nuzhnye.map((g) => tselo(shtuk(g))).join(' + ')} = ` +
          tselo(nuzhnye.reduce((s, g) => s + shtuk(g), 0));

  /* Ширина — по самой длинной строке легенды или перевода: подпись
     «9306 — исправные, прошли контроль» шире самой сетки. */
  const ZNAK = 8.5;
  const stroki = [
    ...groups.map((g) => `${tselo(shtuk(g))} — ${g.label}`.length + 4),
    perevod === null || !showConversion ? 0 : perevod.length + (unit?.length ?? 0) + 1,
  ];
  /* Плюс отступ легенды от левого края: квадратик и зазор. */
  const width = Math.max(gridW, 260, Math.round(Math.max(...stroki) * ZNAK) + CELL + 8);

  return (
    <svg
      className={clsx('pr-hundred', `pr-is-${state}`, className)}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={
        alt ??
        `Сетка из ${tselo(baseNumber)} объектов: ` +
          groups.map((g) => `${g.label} — ${tselo(shtuk(g))}`).join(', ')
      }
    >
      {Array.from({ length: COLS * COLS }, (_, i) => {
        const gruppa = kletok[i];
        const podsvechena = gruppa !== undefined && iskoma.has(gruppa);
        const priglushena = podsvetka && gruppa !== undefined && !iskoma.has(gruppa);
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
            iskoma.has(i) && 'pr-legend--highlighted',
            podsvetka && !iskoma.has(i) && 'pr-legend--dimmed',
          )}
        >
          <rect
            className={clsx(
              'pr-unit',
              `pr-unit--${g.tone ?? 'mid'}`,
              iskoma.has(i) && 'pr-unit--highlighted',
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
            {`${tselo(shtuk(g))} — ${g.label}`}
          </text>
        </g>
      ))}

      {/* Перевод доли в штуки — та самая мысль метода. */}
      {showConversion && perevod !== null ? (
        <text className="pr-math pr-total" x="0" y={height - 6}>
          <Znaki text={perevod + (unit === undefined ? '' : ` ${unit}`)} />
        </text>
      ) : null}
    </svg>
  );
}
