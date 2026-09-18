import { clsx } from 'clsx';
import type { RisunokState } from './OutcomeTiles';

/**
 * Двухуровневая координатная прямая — метод 3, случай отрезка.
 *
 * Логика уровней задана референсом и не меняется:
 *   x > c — верхний уровень, область вправо;
 *   x < d — нижний уровень, область влево.
 * Обе области полупрозрачные и обе доходят до оси, поэтому там, где они
 * налагаются, цвет темнее сам собой — это и есть благоприятный
 * промежуток l. Никаких дуг и третьего прямоугольника.
 *
 * Строгие и нестрогие границы на вероятность не влияют, а на рисунок
 * влияют: пустой кружок при строгой, закрашенный при нестрогой.
 */

/** Что уже показано ученику. */
export type HighlightMode = 'condition' | 'intersection' | 'answer';

/** Граница промежутка: строгая (пустой кружок) или нестрогая. */
export type Boundary = 'strict' | 'inclusive';

export interface CoordinateLineProps {
  /** Концы всего отрезка — a и b. */
  min: number;
  max: number;
  /** Левая граница благоприятного промежутка. */
  c: number;
  /** Правая граница. Не задана — благоприятен весь хвост от c до max. */
  d?: number;
  leftBoundary?: Boundary;
  rightBoundary?: Boundary;
  /** Подписи l и L. */
  showLength?: boolean;
  highlightMode?: HighlightMode;
  /** Подпись оси: по умолчанию x. */
  axisLabel?: string;
  /** Единица измерения в подписях делений: «г», «мин». */
  unit?: string;
  state?: RisunokState;
  alt?: string;
  className?: string;
}

/* Геометрия в единицах viewBox. */
const X0 = 62;
const X1 = 662;
const OVERHANG = 22;
const UPPER_Y = 18;
const LOWER_Y = 62;
const AXIS_Y = 120;
const VB_W = 760;
const VB_H = 186;

/** Число с запятой вместо точки — как принято в русской записи. */
function chislo(value: number): string {
  return String(value).replace('.', ',');
}

export function CoordinateLine({
  min,
  max,
  c,
  d,
  leftBoundary = 'strict',
  rightBoundary = 'strict',
  showLength = false,
  highlightMode = 'answer',
  axisLabel = 'x',
  unit,
  state = 'default',
  alt,
  className,
}: CoordinateLineProps) {
  /* Значение на оси → координата рисунка. */
  const px = (value: number): number => X0 + ((value - min) / (max - min)) * (X1 - X0);

  const xc = px(c);
  /* Правой границы может не быть: тогда благоприятен хвост до конца. */
  const pravaya = d ?? max;
  const xd = px(pravaya);

  const L = max - min;
  const l = pravaya - c;

  const vidnoPeresechenie = highlightMode !== 'condition';
  const videnOtvet = highlightMode === 'answer';

  const podpis =
    alt ??
    `Координатная прямая от ${chislo(min)} до ${chislo(max)}, ` +
      `благоприятный промежуток от ${chislo(c)} до ${chislo(pravaya)}`;

  /* Кружок границы: пустой при строгой, закрашенный при нестрогой. */
  const kruzhok = (x: number, vid: Boundary, key: string) => (
    <circle
      key={key}
      className={clsx('pr-bound', vid === 'inclusive' && 'pr-bound--inclusive')}
      cx={x}
      cy={AXIS_Y}
      r="7"
    />
  );

  const delenie = (value: number, key: string) => (
    <g key={key} className="pr-tick">
      <line x1={px(value)} y1={AXIS_Y - 7} x2={px(value)} y2={AXIS_Y + 7} />
      <text x={px(value)} y={AXIS_Y + 26} textAnchor="middle">
        {chislo(value)}
        {unit === undefined ? '' : ` ${unit}`}
      </text>
    </g>
  );

  return (
    <svg
      className={clsx('pr-line', `pr-is-${state}`, className)}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width={VB_W}
      height={VB_H}
      role="img"
      aria-label={podpis}
    >
      {/* Верхний уровень: условие x > c, область вправо. */}
      <rect
        className="pr-band"
        x={xc}
        y={UPPER_Y}
        width={X1 + OVERHANG - xc}
        height={AXIS_Y - UPPER_Y}
      />
      <line className="pr-band-edge" x1={xc} y1={UPPER_Y} x2={X1 + OVERHANG} y2={UPPER_Y} />
      <line className="pr-band-rule" x1={xc} y1={UPPER_Y} x2={xc} y2={AXIS_Y} />
      <text className="pr-math pr-band-label" x={xc + 10} y={UPPER_Y - 8}>
        {`${axisLabel} > ${chislo(c)}`}
      </text>

      {/* Нижний уровень: условие x < d, область влево. Его нет, когда
          правая граница не задана: одно условие — один уровень. */}
      {d === undefined ? null : (
        <>
          <rect
            className="pr-band"
            x={X0 - OVERHANG}
            y={LOWER_Y}
            width={xd - (X0 - OVERHANG)}
            height={AXIS_Y - LOWER_Y}
          />
          <line className="pr-band-edge" x1={X0 - OVERHANG} y1={LOWER_Y} x2={xd} y2={LOWER_Y} />
          <line className="pr-band-rule" x1={xd} y1={LOWER_Y} x2={xd} y2={AXIS_Y} />
          <text className="pr-math pr-band-label" x={xd - 10} y={LOWER_Y - 8} textAnchor="end">
            {`${axisLabel} < ${chislo(d)}`}
          </text>
        </>
      )}

      {/* Ось со стрелкой и её имя. */}
      <line className="pr-axis-line" x1={X0 - 34} y1={AXIS_Y} x2={X1 + 46} y2={AXIS_Y} />
      <path className="pr-axis-arrow" d={`M${X1 + 46} ${AXIS_Y} l-10 -5 v10 z`} />
      <text className="pr-math pr-axis-name" x={X1 + 62} y={AXIS_Y + 5}>
        {axisLabel}
      </text>

      {/* Благоприятный отрезок на оси: оранжевый и толще. */}
      {videnOtvet ? (
        <line className="pr-favorable" x1={xc} y1={AXIS_Y} x2={xd} y2={AXIS_Y} />
      ) : null}

      {[min, c, ...(d === undefined ? [] : [d]), max]
        .filter((value, i, all) => all.indexOf(value) === i)
        .map((value, i) => delenie(value, `t${i}`))}

      {vidnoPeresechenie
        ? [
            kruzhok(xc, leftBoundary, 'bc'),
            ...(d === undefined ? [] : [kruzhok(xd, rightBoundary, 'bd')]),
          ]
        : null}

      {/* Длина благоприятного промежутка — внутри пересечения. */}
      {showLength && vidnoPeresechenie ? (
        <text
          className="pr-math pr-length"
          x={(xc + xd) / 2}
          y={(LOWER_Y + AXIS_Y) / 2 + 5}
          textAnchor="middle"
        >
          {`l = ${chislo(l)}`}
        </text>
      ) : null}

      {/* Длина всего отрезка — под осью. */}
      {showLength && videnOtvet ? (
        <text className="pr-math pr-total" x={(X0 + X1) / 2} y={VB_H - 10} textAnchor="middle">
          {`L = ${chislo(max)} − ${chislo(min)} = ${chislo(L)}`}
        </text>
      ) : null}
    </svg>
  );
}
