/**
 * Описания сцен для чертежей движка graph/.
 *
 * Здесь только данные: окно, кривые, точки. Рисует их renderGraph —
 * своего SVG для чертежей в проекте нет.
 *
 * Движок умеет одно семейство кривых — прямую (registerCurve('line')).
 * Поэтому сцены строятся только для линейных функций; для остальных
 * подтем чертежа не будет, пока в движок не добавят их семейство.
 */

/** Квадратное симметричное окно — иного renderGraph не принимает. */
function squareWindow(half: number) {
  return { xmin: -half, xmax: half, ymin: -half, ymax: half };
}

export interface LineSceneOptions {
  k: number;
  b: number;
  /** Половина стороны окна в клетках. */
  half?: number;
  /** Подпись чертежа для скринридера. Без неё чертёж считается декором. */
  alt?: string;
  /** Подпись самой прямой на поле. */
  label?: string | null;
}

/** Сцена с одной прямой: используется и как декор, и как миниатюра. */
export function lineScene({ k, b, half = 6, alt, label = null }: LineSceneOptions) {
  return {
    window: squareWindow(half),
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    axisLabels: 'minimal',
    curves: [{ type: 'line', k, b, color: 'lineA', label }],
    points: [],
    ...(alt === undefined ? {} : { alt }),
  };
}
