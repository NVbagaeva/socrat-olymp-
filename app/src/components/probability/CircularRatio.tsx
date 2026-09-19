import { clsx } from 'clsx';
import type { RisunokState } from './OutcomeTiles';
import type { HighlightMode } from './CoordinateLine';

/**
 * Отношение мер на круге — метод 3, случаи дуги и площади.
 *
 * Тот же принцип, что у координатной прямой: вероятность равна
 * отношению меры благоприятного к мере всего. Отличается только сама
 * мера — не длина отрезка, а длина дуги или площадь фигуры. Поэтому
 * компонент отдельный и лёгкий, а CoordinateLine остаётся как есть.
 *
 *   mode="arc"  — циферблат: круг разбит на равные доли, благоприятен
 *                 сектор от одной отметки до другой;
 *   mode="area" — вложенные фигуры: радиус внутренней считается по
 *                 площади, r = R · √(S / S₀), поэтому картинка не врёт.
 */

interface Obshchee {
  /** Подписи мер и самого отношения. */
  showLength?: boolean;
  highlightMode?: HighlightMode;
  state?: RisunokState;
  alt?: string;
  className?: string;
}

export type CircularRatioProps = Obshchee &
  (
    | {
        mode: 'arc';
        /** На сколько равных долей разбит круг: 12 у циферблата. */
        divisions: number;
        /** Благоприятная дуга: от отметки from до отметки to по часовой. */
        from: number;
        to: number;
        /** Подписывать отметки числами. */
        showMarks?: boolean;
      }
    | {
        mode: 'area';
        /** Мера всей фигуры и благоприятной части, в одних единицах. */
        total: number;
        favorable: number;
        /** Единица измерения для подписей: «м²». */
        unit?: string;
      }
  );

const VB = 260;
const CX = VB / 2;
const CY = VB / 2;
const R = 96;

function chislo(value: number): string {
  return String(Math.round(value * 1000) / 1000).replace('.', ',');
}

/** Точка на окружности по номеру доли: нулевая доля — вверху. */
function tochka(dolya: number, divisions: number, radius: number): [number, number] {
  const ugol = ((dolya / divisions) * 360 - 90) * (Math.PI / 180);
  return [CX + radius * Math.cos(ugol), CY + radius * Math.sin(ugol)];
}

export function CircularRatio(props: CircularRatioProps) {
  const { showLength = false, highlightMode = 'answer', state = 'default', alt, className } = props;
  const vidnoBlago = highlightMode !== 'condition';

  let figura: React.ReactNode;
  let mery: string | null = null;
  let podpis: string;

  if (props.mode === 'arc') {
    const { divisions, from, to, showMarks = true } = props;
    /* Дуга может перехлёстывать через ноль: с 10 до 1 — это три доли,
       а не минус девять. */
    const doley = (to - from + divisions) % divisions;
    const [x1, y1] = tochka(from, divisions, R);
    const [x2, y2] = tochka(to, divisions, R);
    const bolshaya = doley > divisions / 2 ? 1 : 0;

    figura = (
      <>
        <circle className="pr-whole" cx={CX} cy={CY} r={R} />
        {vidnoBlago ? (
          <path
            className="pr-part"
            d={`M${CX} ${CY} L${x1} ${y1} A${R} ${R} 0 ${bolshaya} 1 ${x2} ${y2} Z`}
          />
        ) : null}
        {Array.from({ length: divisions }, (_, i) => {
          const [ax, ay] = tochka(i, divisions, R);
          const [bx, by] = tochka(i, divisions, R - 10);
          const [tx, ty] = tochka(i, divisions, R + 18);
          return (
            <g key={i} className="pr-mark">
              <line x1={ax} y1={ay} x2={bx} y2={by} />
              {showMarks ? (
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central">
                  {i === 0 ? divisions : i}
                </text>
              ) : null}
            </g>
          );
        })}
      </>
    );
    mery = showLength && vidnoBlago ? `${doley} из ${divisions}` : null;
    podpis =
      alt ??
      `Круг из ${divisions} равных долей, благоприятная дуга от отметки ${from} до отметки ${to}`;
  } else {
    const { total, favorable, unit } = props;
    /* Радиус по площади, а не по мере: иначе доля на глаз врёт. */
    const r = R * Math.sqrt(Math.max(0, favorable) / total);
    figura = (
      <>
        <circle className="pr-whole" cx={CX} cy={CY} r={R} />
        {vidnoBlago ? <circle className="pr-part pr-part--area" cx={CX} cy={CY} r={r} /> : null}
      </>
    );
    mery =
      showLength && vidnoBlago
        ? `${chislo(favorable)} из ${chislo(total)}${unit === undefined ? '' : ` ${unit}`}`
        : null;
    podpis =
      alt ??
      `Фигура площадью ${chislo(total)}${unit === undefined ? '' : ` ${unit}`}, ` +
        `благоприятная часть — ${chislo(favorable)}`;
  }

  return (
    <svg
      className={clsx('pr-circle', `pr-is-${state}`, className)}
      viewBox={`0 0 ${VB} ${VB + (mery === null ? 0 : 26)}`}
      width={VB}
      height={VB + (mery === null ? 0 : 26)}
      role="img"
      aria-label={podpis}
    >
      {figura}
      {mery === null ? null : (
        <text className="pr-math pr-total" x={CX} y={VB + 16} textAnchor="middle">
          {mery}
        </text>
      )}
    </svg>
  );
}
