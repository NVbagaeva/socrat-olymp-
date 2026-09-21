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
 * Граница может быть одна: только c («больше 210») или только d
 * («не больше 750»). Тогда уровень один, а край отрезка, в который
 * упирается промежуток, — просто конец оси: без подписи условия
 * и без области.
 *
 * До ответа рисунок — заготовка: ось, деления и кружки границ.
 * Области условий и их пересечение — подсказка, они открываются
 * вместе с решением (highlightMode 'intersection' и 'answer').
 *
 * Строгие и нестрогие границы на вероятность не влияют, а на рисунок
 * влияют: пустой кружок при строгой, закрашенный при нестрогой, и
 * знак в подписи уровня тот же — «x > c» при строгой, «x ≥ c» при
 * нестрогой. Кружок и подпись берут вид границы из одного поля, и
 * разойтись им негде.
 */

/**
 * Что уже показано ученику: 'condition' — только ось и границы,
 * 'intersection' — области условий и длина l, 'answer' — ещё
 * благоприятный отрезок на оси и длина L, 'segment' — один
 * благоприятный отрезок без областей: так рисунок стоит в теории,
 * где показывают саму мысль, а не разбор задачи.
 */
export type HighlightMode = 'condition' | 'intersection' | 'answer' | 'segment';

/** Граница промежутка: строгая (пустой кружок) или нестрогая. */
export type Boundary = 'strict' | 'inclusive';

/**
 * В какую сторону от границы лежит область уровня. По умолчанию
 * верхний идёт вправо, нижний влево — случай отрезка из референса.
 */
export type BandSide = 'right' | 'left';

/**
 * Уровень условия целиком: от какого числа, в какую сторону и что
 * приписано в скобках.
 *
 * Без этого поля уровни берутся из границ промежутка, как в
 * тренажёре: верхний — «x > c» вправо, нижний — «x < d» влево.
 * Задают его там, где эта пара не подходит: два условия одного
 * знака («X > 1» и «X > 2») или вероятность рядом с условием.
 */
export interface Band {
  value: number;
  side: BandSide;
  /** Что в скобках после условия: «(0,96)». */
  note?: string;
  /**
   * Граница условия: строгая даёт знак «>» или «<», нестрогая — «≥»
   * или «≤». По умолчанию строгая. У уровней, взятых из границ
   * промежутка, — та же граница, что закрашивает кружок.
   */
  boundary?: Boundary;
}

/**
 * Деление оси. Числом — подпись сама собой; парой — когда под
 * делением стоит буква, а не число: «0» и «x» у отрезка в теории.
 */
export type Tick = number | { value: number; label: string };

/** Скоба под осью с итогом промежутка: «1 < X ≤ 2». */
export interface Brace {
  from: number;
  to: number;
  label: string;
}

/**
 * Событие-промежуток на прямой — для теории, где события рисуют без
 * чисел: отрезок между from и to, луч, если одного конца нет, вся
 * прямая, если нет обоих. Закрашивается полосой над осью; где
 * полосы налегают, цвет темнее сам собой — это общая часть.
 */
export interface Promezhutok {
  from?: number;
  to?: number;
  /** Имя события над полосой: «A», «B». */
  label?: string;
  /** Черта над именем — противоположное событие. */
  cherta?: boolean;
  /** Второй цвет для второго события; первый — по умолчанию. */
  ton?: 'a' | 'b';
  /**
   * Концы промежутка: строгая граница — пустой кружок, нестрогая —
   * закрашенный; по умолчанию нестрогие. У двух соседних лучей общая
   * точка одна: она закрашена, если хоть у одного луча граница
   * нестрогая.
   */
  fromBoundary?: Boundary;
  toBoundary?: Boundary;
}

/** Отмеченная точка на оси — исход опыта: «выпало 4». */
export interface Tochka {
  value: number;
  /** Чьё это событие: первого, второго или обоих сразу. */
  ton?: 'a' | 'b' | 'obshchee';
  label?: string;
}

export interface CoordinateLineProps {
  /** Концы всего отрезка — a и b. */
  min: number;
  max: number;
  /**
   * События-промежутки вместо условий задачи: рисунок теории.
   * С ними границ c и d, уровней условий и делений нет; на оси
   * выделяется только промежуток `vydelit`, если он задан.
   */
  promezhutki?: readonly Promezhutok[];
  /** Промежуток на оси, о котором речь: пересечение или объединение. */
  vydelit?: { from: number; to: number };
  /** Отмеченные точки-исходы с подписями под осью — рисунок теории. */
  tochki?: readonly Tochka[];
  /** Левая граница благоприятного промежутка. Не задана — от min. */
  c?: number;
  /** Правая граница. Не задана — благоприятен весь хвост от c до max. */
  d?: number;
  leftBoundary?: Boundary;
  rightBoundary?: Boundary;
  /** Подписи l и L. */
  showLength?: boolean;
  highlightMode?: HighlightMode;
  /** Верхний уровень целиком. Без него — «x > c» вправо. */
  upper?: Band;
  /** Нижний уровень целиком. Без него — «x < d» влево. */
  lower?: Band;
  /** Свои деления: без них подписываются края и обе границы. */
  ticks?: readonly Tick[];
  /** Скоба под осью с итогом промежутка. */
  brace?: Brace;
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

/**
 * Подпись как в наборе формул: буквы-переменные отдельно от цифр
 * и знаков. В формуле KaTeX буква идёт курсивом математического
 * шрифта, а цифры, скобки и знаки сравнения — прямым основным;
 * подпись на чертеже собирается так же, чтобы теория могла
 * набрать её той же гарнитурой (.pr-var). Без своих стилей
 * обёртка ничего не меняет: тренажёр видит прежнюю подпись.
 */
function podpisMat(text: string) {
  return text.split(/([A-Za-z]+)/).map((kusok, i) =>
    i % 2 === 1 ? (
      <tspan key={i} className="pr-var">
        {kusok}
      </tspan>
    ) : (
      kusok
    ),
  );
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
  upper,
  lower,
  ticks,
  brace,
  axisLabel = 'x',
  unit,
  state = 'default',
  alt,
  className,
  promezhutki,
  vydelit,
  tochki,
}: CoordinateLineProps) {
  /* Значение на оси → координата рисунка. */
  const px = (value: number): number => X0 + ((value - min) / (max - min)) * (X1 - X0);

  /* Рисунок теории: события полосами или точками, без условий и границ. */
  const sobytiya = promezhutki !== undefined || tochki !== undefined;
  if (c === undefined && d === undefined && !sobytiya) {
    throw new Error('У координатной прямой нет ни одной границы промежутка');
  }
  /* Границы может не быть с любой стороны: тогда благоприятен хвост
     до края отрезка, а сам край остаётся концом оси. */
  const levaya = c ?? min;
  const pravaya = d ?? max;
  const xc = px(levaya);
  const xd = px(pravaya);

  const L = max - min;
  const l = pravaya - levaya;

  /* Один отрезок без областей: рисунок теории. */
  const tolkoOtrezok = highlightMode === 'segment';
  /* Скоба живёт ниже подписей делений, и под неё рисунок подрастает.
     Без скобы высота прежняя — рисунки тренажёра не меняются. */
  const nizhneePole = brace === undefined ? 0 : 60;
  /* Уровни: свои, если заданы, иначе пара из границ промежутка —
     тот самый случай отрезка, что рисует тренажёр. Вид границы
     уровня — тот же, что у кружка на оси: строгая — «x > c»,
     нестрогая — «x ≥ c». */
  const verhniy: Band | null =
    upper ??
    (c === undefined || sobytiya ? null : { value: c, side: 'right', boundary: leftBoundary });
  const nizhniy: Band | null =
    lower ??
    (d === undefined || sobytiya ? null : { value: d, side: 'left', boundary: rightBoundary });
  /* С вероятностью в скобках подпись условия длиннее и крупнее, и
     ей нужно место над верхним уровнем: в теории рисунок сжат в узкую
     колонку, а кегль задан в единицах рисунка. Там, где скобок нет
     (тренажёр, лист), поля нет и рисунок прежний. */
  const verhneePole = verhniy?.note === undefined && nizhniy?.note === undefined ? 0 : 34;
  /* У рисунка событий верхнего уровня и подписей делений нет: он
     сдвигается вверх и укорачивается, чтобы не нести пустые поля.
     Над именами событий остаётся место под черту противоположного
     события — иначе она уходит за верхний край рисунка. */
  const sdvigSobytiy = sobytiya ? 16 : 0;
  /* Под точками стоят их подписи — рисунок с точками ниже. */
  const vysota = sobytiya
    ? AXIS_Y - sdvigSobytiy + (tochki === undefined ? 22 : 44)
    : VB_H + verhneePole + nizhneePole;
  const vidnoPeresechenie = highlightMode !== 'condition' && !tolkoOtrezok;
  const videnOtvet = (highlightMode === 'answer' || tolkoOtrezok) && !sobytiya;

  const podpis =
    alt ??
    `Координатная прямая от ${chislo(min)} до ${chislo(max)}, ` +
      `благоприятный промежуток от ${chislo(levaya)} до ${chislo(pravaya)}`;

  /* Событие-промежуток: полоса над осью, имя над ней и точки на
     концах. Луч уходит за край оси, как и область условия. */
  const sobytie = (pr: Promezhutok, key: string) => {
    const levo = pr.from === undefined ? X0 - OVERHANG : px(pr.from);
    const pravo = pr.to === undefined ? X1 + OVERHANG : px(pr.to);
    return (
      <g key={key} className={clsx('pr-sobytie', pr.ton === 'b' && 'pr-sobytie--b')}>
        <rect
          className="pr-sobytie__polosa"
          x={levo}
          y={LOWER_Y}
          width={pravo - levo}
          height={AXIS_Y - LOWER_Y}
        />
        {pr.label === undefined ? null : (
          <text
            className={clsx('pr-math pr-sobytie__label', pr.cherta && 'pr-sobytie__label--cherta')}
            x={(levo + pravo) / 2}
            y={LOWER_Y - 10}
            textAnchor="middle"
          >
            <tspan className="pr-var">{pr.label}</tspan>
          </text>
        )}
      </g>
    );
  };
  /* Концы промежутков — по одной точке на каждое значение: у двух
     соседних лучей общая граница — одна точка, закрашенная, если
     хоть у одного из них она нестрогая. */
  const kontsy = new Map<number, Boundary>();
  for (const pr of promezhutki ?? []) {
    for (const [value, vid] of [
      [pr.from, pr.fromBoundary ?? 'inclusive'],
      [pr.to, pr.toBoundary ?? 'inclusive'],
    ] as const) {
      if (value !== undefined && (kontsy.get(value) !== 'inclusive' || vid === 'inclusive')) {
        kontsy.set(value, vid);
      }
    }
  }
  /* Точка-исход: кружок цвета своего события и подпись под осью. */
  const tochka = (t: Tochka, key: string) => (
    <g key={key} className={clsx('pr-tochka', t.ton !== undefined && `pr-tochka--${t.ton}`)}>
      <circle cx={px(t.value)} cy={AXIS_Y} r="9" />
      <text className="pr-tochka__label" x={px(t.value)} y={AXIS_Y + 34} textAnchor="middle">
        {t.label ?? chislo(t.value)}
      </text>
    </g>
  );

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

  const delenie = (tick: Tick, key: string) => {
    const value = typeof tick === 'number' ? tick : tick.value;
    const podpisDeleniya =
      typeof tick === 'number'
        ? chislo(value) + (unit === undefined ? '' : ` ${unit}`)
        : tick.label;
    return (
      <g key={key} className="pr-tick">
        <line x1={px(value)} y1={AXIS_Y - 7} x2={px(value)} y2={AXIS_Y + 7} />
        <text x={px(value)} y={AXIS_Y + 26} textAnchor="middle">
          {podpisDeleniya}
        </text>
      </g>
    );
  };

  /**
   * Уровень условия: полупрозрачная область от границы в свою
   * сторону, её верхний край, отвес к оси и подпись условия.
   */
  const uroven = (band: Band, y: number) => {
    const { value, side, note, boundary = 'strict' } = band;
    const x = px(value);
    const kray = side === 'right' ? X1 + OVERHANG : X0 - OVERHANG;
    /* Знак — по виду границы: нестрогая даёт ≥ и ≤. */
    const znak =
      side === 'right'
        ? boundary === 'inclusive'
          ? '≥'
          : '>'
        : boundary === 'inclusive'
          ? '≤'
          : '<';
    const text = `${axisLabel} ${znak} ${chislo(value)}${note === undefined ? '' : ` (${note})`}`;
    /* Вправо — выравнивание по умолчанию, и атрибут не пишется:
       разметка уровня совпадает с прежней до знака. */
    const vyravnivanie = side === 'right' ? {} : { textAnchor: 'end' as const };
    return (
      <>
        <rect
          className="pr-band"
          x={Math.min(x, kray)}
          y={y}
          width={Math.abs(kray - x)}
          height={AXIS_Y - y}
        />
        <line
          className="pr-band-edge"
          x1={Math.min(x, kray)}
          y1={y}
          x2={Math.max(x, kray)}
          y2={y}
        />
        <line className="pr-band-rule" x1={x} y1={y} x2={x} y2={AXIS_Y} />
        <text
          className="pr-math pr-band-label"
          x={side === 'right' ? x + 10 : x - 10}
          y={y - 8}
          {...vyravnivanie}
        >
          {podpisMat(text)}
        </text>
      </>
    );
  };

  const risunok = (
    <>
      {/* События-промежутки: полосы над осью, рисунок теории. */}
      {promezhutki?.map((pr, i) => sobytie(pr, `s${i}`))}

      {/* Верхний уровень: по умолчанию условие x > c, область вправо.
          Его нет, когда левая граница не задана, и нет до ответа. */}
      {verhniy === null || !vidnoPeresechenie ? null : uroven(verhniy, UPPER_Y)}

      {/* Нижний уровень: по умолчанию условие x < d, область влево.
          Его нет, когда правая граница не задана: одно условие —
          один уровень. */}
      {nizhniy === null || !vidnoPeresechenie ? null : uroven(nizhniy, LOWER_Y)}

      {/* Ось со стрелкой и её имя. */}
      <line className="pr-axis-line" x1={X0 - 34} y1={AXIS_Y} x2={X1 + 46} y2={AXIS_Y} />
      <path className="pr-axis-arrow" d={`M${X1 + 46} ${AXIS_Y} l-10 -5 v10 z`} />
      <text className="pr-math pr-axis-name" x={X1 + 62} y={AXIS_Y + 5}>
        {podpisMat(axisLabel)}
      </text>

      {/* Благоприятный отрезок на оси: оранжевый и толще. */}
      {videnOtvet ? (
        <line className="pr-favorable" x1={xc} y1={AXIS_Y} x2={xd} y2={AXIS_Y} />
      ) : null}
      {/* Промежуток, о котором речь в рисунке событий: пересечение
          или объединение. */}
      {vydelit === undefined ? null : (
        <line
          className="pr-favorable"
          x1={px(vydelit.from)}
          y1={AXIS_Y}
          x2={px(vydelit.to)}
          y2={AXIS_Y}
        />
      )}
      {[...kontsy].map(([v, vid]) => kruzhok(px(v), vid, `k${v}`))}
      {tochki?.map((t, i) => tochka(t, `t${i}`))}

      {(
        ticks ??
        (sobytiya
          ? []
          : [min, ...(c === undefined ? [] : [c]), ...(d === undefined ? [] : [d]), max].filter(
              (value, i, all) => all.indexOf(value) === i,
            ))
      ).map((tick, i) => delenie(tick, `t${i}`))}

      {/* Скоба под осью: итоговый промежуток словами условия. */}
      {brace === undefined ? null : (
        <g className="pr-brace">
          {/* «П» под отрезком: концы вниз, перекладина под подписями
              делений. */}
          <path d={`M${px(brace.from)} ${AXIS_Y + 34} v10 H${px(brace.to)} v-10`} />
          <text
            className="pr-math"
            x={(px(brace.from) + px(brace.to)) / 2}
            y={AXIS_Y + 72}
            textAnchor="middle"
          >
            {podpisMat(brace.label)}
          </text>
        </g>
      )}

      {/* Кружки границ видны всегда: это часть условия, а не ответа. */}
      {c === undefined || sobytiya ? null : kruzhok(xc, leftBoundary, 'bc')}
      {d === undefined || sobytiya ? null : kruzhok(xd, rightBoundary, 'bd')}

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
    </>
  );

  return (
    <svg
      className={clsx('pr-line', `pr-is-${state}`, className)}
      viewBox={`0 0 ${VB_W} ${vysota}`}
      width={VB_W}
      height={vysota}
      role="img"
      aria-label={podpis}
    >
      {/* Верхнее поле сдвигает рисунок вниз. Поля нет — нет и
          обёртки: разметка та же, что была до появления теории. */}
      {verhneePole === 0 && sdvigSobytiy === 0 ? (
        risunok
      ) : (
        <g transform={`translate(0 ${verhneePole - sdvigSobytiy})`}>{risunok}</g>
      )}
    </svg>
  );
}
