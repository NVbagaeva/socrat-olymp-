import type { ReactNode } from 'react';
import { IkonkaVKruge, IT } from '@/components/ui/IkonkaVKruge';

/**
 * Значки тем генераторов №2, №6–№11, №13 — рисунок темы в стеклянном круге,
 * как значки тел №3 и блоков №1: та же рамка (ui/IkonkaVKruge), те же
 * линии (синие 1,6; пунктир 1; акцент оранжевым), то же стекло.
 *
 * Ключ — номер задания и id темы из конфига генератора
 * (lib/…/generator*.ts). Тема без рисунка остаётся с меткой в кружке,
 * как раньше. Все рисунки — в viewBox 0 0 40 40, в рамке ≈ 24×24.
 */

type Risunok = (fill: string) => ReactNode;

const { v: V, h: H, a: A, ah: AH, t: T, p: P, o: O, w: W, x: TX, xa: TXA, xr: TXR } = IT;

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Наконечник стрелки в точке (x, y), направление (dx, dy). */
function nakonechnik(x: number, y: number, dx: number, dy: number, dlina = 4): string {
  const l = Math.hypot(dx, dy);
  const ux = dx / l;
  const uy = dy / l;
  const bx = x - ux * dlina;
  const by = y - uy * dlina;
  const s = dlina * 0.6;
  return `M${r2(bx + uy * s)} ${r2(by - ux * s)} L${r2(x)} ${r2(y)} L${r2(bx - uy * s)} ${r2(by + ux * s)}`;
}

/** Отрезок со стрелкой на конце. */
function strelka(x1: number, y1: number, x2: number, y2: number): string {
  return `M${x1} ${y1} L${x2} ${y2} ${nakonechnik(x2, y2, x2 - x1, y2 - y1)}`;
}

/** Точка на окружности: угол в градусах против часовой. */
function tochka(cx: number, cy: number, r: number, ugol: number): [number, number] {
  const t = (ugol * Math.PI) / 180;
  return [r2(cx + r * Math.cos(t)), r2(cy - r * Math.sin(t))];
}

/**
 * Координатная рамка: математические x ∈ [x0, x1], y ∈ [y0, y1]
 * на квадрат 8…32. Кривая обрывается за краем рамки.
 */
function ramka(x0: number, x1: number, y0: number, y1: number) {
  const X = (x: number) => r2(8 + ((x - x0) / (x1 - x0)) * 24);
  const Y = (y: number) => r2(32 - ((y - y0) / (y1 - y0)) * 24);
  const vnutri = (y: number) => Number.isFinite(y) && y >= y0 - 1e-9 && y <= y1 + 1e-9;
  return {
    X,
    Y,
    kriva(f: (x: number) => number, a = x0, b = x1, n = 64): string {
      let d = '';
      let pero = false;
      for (let i = 0; i <= n; i++) {
        const x = a + ((b - a) * i) / n;
        const y = f(x);
        if (vnutri(y)) {
          d += `${pero ? 'L' : 'M'}${X(x)} ${Y(y)} `;
          pero = true;
        } else {
          pero = false;
        }
      }
      return d.trim();
    },
    /** Область между кривой и осью x на [a, b]. */
    oblast(f: (x: number) => number, a: number, b: number, n = 48): string {
      let d = `M${X(a)} ${Y(0)}`;
      for (let i = 0; i <= n; i++) {
        const x = a + ((b - a) * i) / n;
        d += ` L${X(x)} ${Y(Math.min(y1, Math.max(y0, f(x))))}`;
      }
      return `${d} L${X(b)} ${Y(0)} Z`;
    },
    osi(): string {
      return `M8 ${Y(0)} H32 M${X(0)} 8 V32`;
    },
    /** Корни f(x) = c на [x0, x1]. */
    korni(f: (x: number) => number, c: number): number[] {
      const out: number[] = [];
      const n = 240;
      let pa = x0;
      let pf = f(pa) - c;
      for (let i = 1; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n;
        const fx = f(x) - c;
        /* Только там, где кривая видна: на разрыве (1/x у нуля) знак
           тоже меняется, но корня нет. */
        if (vnutri(pf + c) && vnutri(fx + c) && pf * fx <= 0) {
          let lo = pa;
          let hi = x;
          for (let k = 0; k < 40; k++) {
            const m = (lo + hi) / 2;
            if ((f(lo) - c) * (f(m) - c) <= 0) hi = m;
            else lo = m;
          }
          out.push((lo + hi) / 2);
        }
        pa = x;
        pf = fx;
      }
      return out;
    },
  };
}

/** Шестерёнка: n зубцов, радиусы впадины и зубца. */
function shesternya(cx: number, cy: number, rVn: number, rZub: number, n: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (360 / n) * i;
    const shag = 360 / n;
    for (const [da, r] of [
      [-shag * 0.32, rVn],
      [-shag * 0.18, rZub],
      [shag * 0.18, rZub],
      [shag * 0.32, rVn],
    ] as const) {
      const [x, y] = tochka(cx, cy, r, a + da);
      pts.push(`${x} ${y}`);
    }
  }
  return `M${pts.join(' L')} Z`;
}

/* ── №7: уравнение f(x) = c — график, прямая y = c, корни ─────────── */

function uravnenie(
  f: (x: number) => number,
  [x0, x1, y0, y1]: [number, number, number, number],
  c: number,
): Risunok {
  const r = ramka(x0, x1, y0, y1);
  const risunok = (fill: string) => (
    <>
      <rect x="8" y="8" width="24" height="24" rx="3" fill={fill} />
      <path className={O} d={r.osi()} />
      <path className={V} d={r.kriva(f)} />
      <path className={A} d={`M8 ${r.Y(c)} H32`} />
      {r.korni(f, c).map((x) => (
        <circle key={x} className={T} cx={r.X(x)} cy={r.Y(c)} r="1.8" />
      ))}
    </>
  );
  return risunok;
}

/* ── Числа и буквы на стекле (№8) ─────────────────────────────────── */

const plashka = (fill: string) => <rect x="9" y="10" width="22" height="20" rx="4" fill={fill} />;

/* ── Столбики (№6, №13) ───────────────────────────────────────────── */

function stolbiki(vysoty: number[], fill: string, cls = V): ReactNode {
  return vysoty.map((h, i) => (
    <rect
      key={i}
      className={cls}
      x={9 + i * 6}
      y={31 - h}
      width="4.5"
      height={h}
      rx="0.8"
      fill={fill}
    />
  ));
}

/* ── Рисунки по номерам ───────────────────────────────────────────── */

const bell =
  (s: number, k = 4) =>
  (x: number) =>
    k * Math.exp(-(x * x) / (2 * s * s));
const R6 = ramka(-3.4, 3.4, -0.4, 4.6);
const R9 = ramka(-0.4, 6.6, -2.2, 2.8);
const R10 = ramka(-0.4, 5, -0.4, 5);

const RISUNKI: Record<string, Record<string, Risunok>> = {
  /* №2. Векторы. */
  '2': {
    /* Длина вектора: вектор — гипотенуза, координаты — катеты пунктиром. */
    A: (fill) => (
      <>
        <path d="M10 30 H30 V12 Z" fill={fill} />
        <path className={H} d="M10 30 H30 V12" />
        <path className={A} d={strelka(10, 30, 30, 12)} />
        <circle className={T} cx="10" cy="30" r="1.8" />
      </>
    ),
    /* Скалярное произведение: проекция одного вектора на другой. */
    B: (fill) => (
      <>
        <path d="M9 29 L22 11 L22 29 Z" fill={fill} />
        <path className={H} d="M22 11 V29" />
        <path className={V} d={strelka(9, 29, 32, 29)} />
        <path className={V} d={strelka(9, 29, 22, 11)} />
        <path className={A} d="M9 29 H22" />
        <circle className={T} cx="9" cy="29" r="1.8" />
      </>
    ),
    /* Косинус угла: два вектора из одной точки и дуга угла. */
    C: (fill) => {
      const [bx, by] = tochka(9, 29, 22, 55);
      const [ax, ay] = tochka(9, 29, 8, 55);
      return (
        <>
          <path d={`M9 29 L17 29 A8 8 0 0 0 ${ax} ${ay} Z`} fill={fill} />
          <path className={V} d={strelka(9, 29, 32, 29)} />
          <path className={V} d={strelka(9, 29, bx, by)} />
          <path className={A} d={`M17 29 A8 8 0 0 0 ${ax} ${ay}`} />
          <circle className={T} cx="9" cy="29" r="1.8" />
        </>
      );
    },
  },

  /* №6. Случайные величины и распределения. */
  '6': {
    /* Диаграмма Эйлера: два круга, пересечение — акцент. */
    I: (fill) => {
      /* Круги с центрами 15,5 и 24,5, r = 9: пересекаются при x = 20. */
      const lens = 'M20 11.94 A9 9 0 0 1 20 28.06 A9 9 0 0 1 20 11.94 Z';
      return (
        <>
          <circle cx="15.5" cy="20" r="9" fill={fill} />
          <circle cx="24.5" cy="20" r="9" fill={fill} />
          <path d={lens} fill={fill} />
          <circle className={V} cx="15.5" cy="20" r="9" />
          <circle className={V} cx="24.5" cy="20" r="9" />
          <path className={A} d={lens} />
        </>
      );
    },
    /* Условная вероятность: дерево, путь к событию — акцент. */
    II: (fill) => (
      <>
        <path d="M9 20 L20 12 L31 8 L31 16 L20 12 Z" fill={fill} />
        <path
          className={V}
          d="M9 20 L20 12 L31 8 M20 12 L31 16 M9 20 L20 28 L31 24 M20 28 L31 32"
        />
        <path className={A} d="M9 20 L20 12 L31 16" />
        {[
          [9, 20],
          [20, 12],
          [20, 28],
          [31, 8],
          [31, 24],
          [31, 32],
        ].map(([x, y]) => (
          <circle key={`${x}:${y}`} className={P} cx={x} cy={y} r="1.5" />
        ))}
        <circle className={T} cx="31" cy="16" r="2" />
      </>
    ),
    /* M(X): распределение столбиками и среднее — акцентом. */
    III: (fill) => (
      <>
        {stolbiki([8, 14, 18, 10], fill)}
        <path className={V} d="M7 31 H33" />
        <path className={A} d="M20.85 9 V31" />
        <circle className={T} cx="20.85" cy="9" r="2" />
      </>
    ),
    /* Оценка вероятности: хвосты распределения за M ± ε — акцент. */
    IV: (fill) => {
      const f = bell(1);
      return (
        <>
          <path d={R6.oblast(f, -3.4, 3.4)} fill={fill} />
          <path
            className={H}
            d={`M${R6.X(-1.6)} ${R6.Y(f(-1.6))} V${R6.Y(0)} M${R6.X(1.6)} ${R6.Y(f(1.6))} V${R6.Y(0)}`}
          />
          <path className={V} d={R6.kriva(f)} />
          <path className={A} d={`${R6.kriva(f, -3.4, -1.6, 16)} ${R6.kriva(f, 1.6, 3.4, 16)}`} />
          <path className={V} d={`M7 ${R6.Y(0)} H33`} />
          <circle className={T} cx="20" cy={R6.Y(0)} r="1.8" />
        </>
      );
    },
    /* Дисперсия: одно среднее, разный разброс — узкий и широкий «колокол». */
    V: (fill) => {
      const uzkiy = bell(0.7);
      const shirokiy = bell(1.5, 2.2);
      return (
        <>
          <path d={R6.oblast(uzkiy, -3.4, 3.4)} fill={fill} />
          <path className={H} d={R6.kriva(shirokiy)} />
          <path className={V} d={R6.kriva(uzkiy)} />
          <path className={V} d={`M7 ${R6.Y(0)} H33`} />
          <path className={AH} d={`M20 8 V${R6.Y(0)}`} />
          <path
            className={A}
            d={`M${R6.X(-1.5)} 26 H${R6.X(1.5)} ${nakonechnik(R6.X(1.5), 26, 1, 0, 3)} ${nakonechnik(R6.X(-1.5), 26, -1, 0, 3)}`}
          />
        </>
      );
    },
  },

  /* №7. Уравнения: график, прямая y = c и корни. */
  '7': {
    I: uravnenie((x) => 3 / x, [-0.6, 6, -0.6, 6], 2),
    II: uravnenie((x) => 2 * Math.sqrt(x), [-0.6, 6, -0.6, 6], 3),
    III: uravnenie((x) => 2 ** x, [-3, 3, -0.6, 6], 4),
    IV: uravnenie((x) => Math.log2(x), [-0.6, 6, -3, 3.6], 1.5),
    V: uravnenie((x) => Math.sin(x), [-0.6, 7.2, -1.7, 1.7], 0.5),
  },

  /* №8. Вычисления. */
  '8': {
    /* Свойства степеней: aⁿ. */
    S1: (fill) => (
      <>
        {plashka(fill)}
        <text className={TX} x="17" y="27" fontSize="17">
          a
        </text>
        <text className={TXA} x="26" y="18.5" fontSize="11">
          n
        </text>
      </>
    ),
    /* Свойства корней: √ над числом. */
    S2: (fill) => (
      <>
        <path d="M19 10 H32 V30 H15 Z" fill={fill} />
        <path className={V} d="M8 22 L11 20.5 L15 30 L19 10 H32" />
        <text className={TXR} x="25.5" y="27" fontSize="14">
          9
        </text>
        <path className={A} d="M19 10 H32" />
      </>
    ),
    /* Сумма и разность логарифмов: log ab. */
    S3: (fill) => (
      <>
        {plashka(fill)}
        <text className={TXR} x="20" y="20" fontSize="11">
          log
        </text>
        <text className={TXA} x="20" y="29.5" fontSize="11">
          ab
        </text>
      </>
    ),
    /* Новое основание: частное логарифмов. */
    S4: (fill) => (
      <>
        {plashka(fill)}
        <text className={TXR} x="20" y="18.5" fontSize="9.5">
          log
        </text>
        <path className={A} d="M12 21.5 H28" />
        <text className={TXR} x="20" y="29.5" fontSize="9.5">
          log
        </text>
      </>
    ),
    /* Синус и косинус по четверти: единичная окружность, вторая четверть. */
    S5: (fill) => {
      const [x, y] = tochka(20, 20, 11, 135);
      return (
        <>
          <path d="M20 20 L9 20 A11 11 0 0 1 20 9 Z" fill={fill} />
          <path className={O} d="M7 20 H33 M20 7 V33" />
          <circle className={V} cx="20" cy="20" r="11" />
          <path className={H} d={`M${x} ${y} V20 M${x} ${y} H20`} />
          <path className={A} d={`M20 20 L${x} ${y}`} />
          <circle className={T} cx={x} cy={y} r="1.8" />
        </>
      );
    },
    /* Тангенс: продолжение радиуса до линии тангенсов. */
    S6: (fill) => {
      const k = Math.tan((40 * Math.PI) / 180);
      const ty = r2(21 - 10 * k);
      return (
        <>
          <circle cx="17" cy="21" r="10" fill={fill} />
          <path className={O} d="M6 21 H30" />
          <circle className={V} cx="17" cy="21" r="10" />
          <path className={V} d="M27 8 V32" />
          <path className={A} d={`M17 21 L27 ${ty}`} />
          <circle className={T} cx="27" cy={ty} r="1.8" />
        </>
      );
    },
    /* Табличные значения: таблица, нужная клетка — акцент. */
    S7: (fill) => (
      <>
        <rect x="8" y="10" width="24" height="6.67" fill={fill} />
        <path
          className={V}
          d="M8 10 H32 V30 H8 Z M8 16.67 H32 M8 23.33 H32 M16 10 V30 M24 10 V30"
        />
        <rect className={A} x="24" y="23.33" width="8" height="6.67" />
      </>
    ),
    /* Двойной угол: угол α и угол 2α. */
    S8: (fill) => {
      const [x1, y1] = tochka(12, 28, 20, 25);
      const [x2, y2] = tochka(12, 28, 20, 50);
      const [a1x, a1y] = tochka(12, 28, 8, 25);
      const [a2x, a2y] = tochka(12, 28, 12, 50);
      return (
        <>
          <path d={`M12 28 L32 28 A20 20 0 0 0 ${x2} ${y2} Z`} fill={fill} />
          <path className={V} d={`M12 28 H32 M12 28 L${x1} ${y1} M12 28 L${x2} ${y2}`} />
          <path className={V} d={`M20 28 A8 8 0 0 0 ${a1x} ${a1y}`} />
          <path className={A} d={`M24 28 A12 12 0 0 0 ${a2x} ${a2y}`} />
          <circle className={T} cx="12" cy="28" r="1.8" />
        </>
      );
    },
    /* Формулы приведения: точки α и π − α симметричны. */
    S9: (fill) => {
      const [x1, y1] = tochka(20, 20, 11, 30);
      const [x2, y2] = tochka(20, 20, 11, 150);
      return (
        <>
          <circle cx="20" cy="20" r="11" fill={fill} />
          <path className={O} d="M7 20 H33 M20 7 V33" />
          <circle className={V} cx="20" cy="20" r="11" />
          <path className={H} d={`M${x1} ${y1} H${x2}`} />
          <path className={V} d={`M20 20 L${x1} ${y1}`} />
          <path className={A} d={`M20 20 L${x2} ${y2}`} />
          <circle className={P} cx={x1} cy={y1} r="1.5" />
          <circle className={T} cx={x2} cy={y2} r="1.8" />
        </>
      );
    },
    /* Буквенные дроби и степени: x над y. */
    S10: (fill) => (
      <>
        {plashka(fill)}
        <text className={TX} x="20" y="19" fontSize="12">
          x
        </text>
        <path className={A} d="M13 21.5 H27" />
        <text className={TX} x="20" y="30" fontSize="12">
          y
        </text>
      </>
    ),
    /* Буквенные корни и логарифмы: √ над буквой. */
    S11: (fill) => (
      <>
        <path d="M19 10 H32 V30 H15 Z" fill={fill} />
        <path className={V} d="M8 22 L11 20.5 L15 30 L19 10 H32" />
        <text className={TXA} x="25.5" y="27" fontSize="15">
          b
        </text>
      </>
    ),
  },

  /* №9. Производная и первообразная. */
  '9': {
    /* Физический смысл: скорость — спидометр. */
    I: (fill) => {
      const [nx, ny] = tochka(20, 26, 9, 50);
      const deleniya = [180, 135, 90, 45, 0]
        .map((u) => {
          const [ax, ay] = tochka(20, 26, 8.5, u);
          const [bx, by] = tochka(20, 26, 11, u);
          return `M${ax} ${ay} L${bx} ${by}`;
        })
        .join(' ');
      return (
        <>
          <path d="M9 26 A11 11 0 0 1 31 26 Z" fill={fill} />
          <path className={V} d="M9 26 A11 11 0 0 1 31 26 Z" />
          <path className={V} d={deleniya} />
          <path className={A} d={`M20 26 L${nx} ${ny}`} />
          <circle className={T} cx="20" cy="26" r="2" />
        </>
      );
    },
    /* Касательная к графику в точке. */
    II: (fill) => {
      const f = (x: number) => 2 - 0.35 * (x - 3.5) ** 2;
      const x0 = 2;
      const k = -0.7 * (x0 - 3.5);
      const kas = (x: number) => f(x0) + k * (x - x0);
      return (
        <>
          <path d={R9.oblast(f, 0.9, 6.1)} fill={fill} />
          <path className={O} d={R9.osi()} />
          <path className={V} d={R9.kriva(f)} />
          <path className={A} d={R9.kriva(kas, -0.4, 5.2, 2)} />
          <circle className={T} cx={R9.X(x0)} cy={R9.Y(f(x0))} r="1.8" />
        </>
      );
    },
    /* Исследование по графику функции: максимум и точки на подъёмах. */
    III: (fill) => {
      const f = (x: number) => 1.6 * Math.sin(x - 0.3);
      return (
        <>
          <path d={R9.oblast(f, 0.3, Math.PI + 0.3)} fill={fill} />
          <path className={O} d={R9.osi()} />
          <path className={V} d={R9.kriva(f)} />
          <circle className={P} cx={R9.X(1)} cy={R9.Y(f(1))} r="1.5" />
          <circle className={P} cx={R9.X(5.4)} cy={R9.Y(f(5.4))} r="1.5" />
          <path className={AH} d={`M${R9.X(Math.PI / 2 + 0.3)} ${R9.Y(1.6)} V${R9.Y(0)}`} />
          <circle className={T} cx={R9.X(Math.PI / 2 + 0.3)} cy={R9.Y(1.6)} r="1.8" />
        </>
      );
    },
    /* Исследование по графику производной: где f′ > 0 — стекло, нули — акцент. */
    IV: (fill) => {
      const g = (x: number) => 1.5 * Math.cos(x);
      const n1 = Math.PI / 2;
      const n2 = (3 * Math.PI) / 2;
      return (
        <>
          <path d={`${R9.oblast(g, -0.4, n1)} ${R9.oblast(g, n2, 6.6)}`} fill={fill} />
          <path className={O} d={R9.osi()} />
          <path className={V} d={R9.kriva(g)} />
          <circle className={T} cx={R9.X(n1)} cy={R9.Y(0)} r="1.8" />
          <circle className={T} cx={R9.X(n2)} cy={R9.Y(0)} r="1.8" />
        </>
      );
    },
    /* Первообразная: площадь под графиком между a и b. */
    V: (fill) => {
      const f = (x: number) => 0.08 * x * x + 0.4;
      const r = ramka(-0.4, 6.6, -0.6, 4.4);
      return (
        <>
          <path d={r.oblast(f, 1.5, 5)} fill={fill} />
          <path className={O} d={r.osi()} />
          <path className={V} d={r.kriva(f)} />
          <path
            className={A}
            d={`M${r.X(1.5)} ${r.Y(0)} V${r.Y(f(1.5))} M${r.X(5)} ${r.Y(0)} V${r.Y(f(5))}`}
          />
        </>
      );
    },
  },

  /* №10. Задачи с прикладным содержанием. */
  '10': {
    /* Подстановка в формулу: цепь — источник и резистор (закон Ома). */
    I: (fill) => (
      <>
        <path d="M10 13 H30 V29 H10 Z" fill={fill} />
        <path
          className={V}
          d="M15 13 H10 V29 H18.5 M21.5 29 H30 V13 H25.5 M18.5 25 V33 M21.5 27 V31"
        />
        <path className={A} d="M15 13 L16.5 10 L19 16 L21.5 10 L24 16 L25.5 13" />
      </>
    ),
    /* Квадратичные зависимости: торможение автомобиля. */
    II: (fill) => (
      <>
        <path className={V} d="M14 27 V22 H17.5 L20.5 17 H28 L31 22 H33 V27 Z" fill={fill} />
        <path className={V} d="M6 30 H34" />
        <circle className={`${V} ${W}`} cx="18" cy="27.5" r="2.4" />
        <circle className={`${V} ${W}`} cx="29" cy="27.5" r="2.4" />
        <path className={A} d="M7 19.5 H12 M8 23.5 H12" />
      </>
    ),
    /* Степени и корни: дальность линии горизонта. */
    III: (fill) => (
      <>
        <path d="M6 32.25 A16 16 0 0 1 34 32.25 Z" fill={fill} />
        <path className={V} d="M6 32.25 A16 16 0 0 1 34 32.25" />
        <path className={V} d="M20 24 V12" />
        <path className={A} d="M20 12 L33.1 30.9" />
        <circle className={T} cx="20" cy="12" r="1.8" />
      </>
    ),
    /* Показательные и логарифмические: радиоактивный распад, период полураспада. */
    IV: (fill) => {
      const f = (x: number) => 4.4 * 0.5 ** x;
      return (
        <>
          <path d={R10.oblast(f, 0, 5)} fill={fill} />
          <path className={O} d={R10.osi()} />
          <path className={V} d={R10.kriva(f, 0, 5)} />
          <path className={AH} d={`M${R10.X(0)} ${R10.Y(2.2)} H${R10.X(1)} V${R10.Y(0)}`} />
          <circle className={T} cx={R10.X(1)} cy={R10.Y(2.2)} r="1.8" />
        </>
      );
    },
    /* Тригонометрические: груз на пружине. */
    V: (fill) => (
      <>
        <path
          className={V}
          d="M12 8 H28 M20 8 V10 L24 12 L16 14.5 L24 17 L16 19.5 L24 22 L20 23.5 V25"
        />
        <rect className={V} x="14" y="25" width="12" height="8" rx="1.5" fill={fill} />
        <path
          className={A}
          d={`M31 19 V32 ${nakonechnik(31, 32, 0, 1, 3)} ${nakonechnik(31, 19, 0, -1, 3)}`}
        />
      </>
    ),
  },

  /* №11. Текстовые задачи. */
  '11': {
    /* Разминка: покупка — ценник. */
    RZ: (fill) => (
      <>
        <path className={V} d="M9 20 L19 10 H30 V21 L20 31 Z" fill={fill} />
        <path className={A} d="M12.5 24.5 L18.5 18.5 M15.5 27.5 L21.5 21.5" />
        <circle className={T} cx="25.5" cy="14.5" r="2" />
      </>
    ),
    /* Проценты: знак процента. */
    PR: (fill) => (
      <>
        <circle className={V} cx="14" cy="13.5" r="4" fill={fill} />
        <circle className={V} cx="26" cy="26.5" r="4" fill={fill} />
        <path className={A} d="M29 9 L11 31" />
      </>
    ),
    /* Смеси и сплавы: колба, уровень раствора — акцент. */
    SM: (fill) => (
      <>
        <path d="M14.04 23 H25.96 L30 30 Q30.5 32 28 32 H12 Q9.5 32 10 30 Z" fill={fill} />
        <path
          className={V}
          d="M15.5 9 H24.5 M17.5 9 V17 L10 30 Q9.5 32 12 32 H28 Q30.5 32 30 30 L22.5 17 V9"
        />
        <path className={A} d="M14.04 23 H25.96" />
        <circle className={P} cx="18" cy="27.5" r="1.1" />
        <circle className={P} cx="22.5" cy="26" r="0.9" />
      </>
    ),
    /* Движение по прямой: из A в B. */
    DP: (fill) => (
      <>
        <path d="M31 13 L25 15.5 L31 18 Z" fill={fill} />
        <path className={V} d="M7 28 H33 M31 28 V13 L25 15.5 L31 18" />
        <path className={A} d={strelka(9, 22, 27, 22)} />
        <circle className={T} cx="9" cy="28" r="2" />
      </>
    ),
    /* Протяжённые тела: поезд у столба. */
    PT: (fill) => (
      <>
        <rect className={V} x="8" y="15" width="11" height="11" rx="1.5" fill={fill} />
        <rect className={V} x="21" y="15" width="10" height="11" rx="1.5" fill={fill} />
        <path className={V} d="M6 30.5 H34 M10.5 18.5 H16.5 M23.5 18.5 H28.5" />
        {[11.5, 16, 24, 28.5].map((x) => (
          <circle key={x} className={`${V} ${W}`} cx={x} cy="28" r="1.8" />
        ))}
        <path className={A} d="M34 30.5 V11" />
        <circle className={T} cx="34" cy="11" r="1.8" />
      </>
    ),
    /* Движение по воде: лодка и течение. */
    VD: (fill) => (
      <>
        <path className={V} d="M8 24 H32 L28 29.5 H12 Z" fill={fill} />
        <path className={V} d="M20 24 V9 L29 21 H20" fill={fill} />
        <path className={A} d="M6 33 Q9.5 30.5 13 33 T20 33 T27 33 T34 33" />
      </>
    ),
    /* Движение по окружности: круговая трасса и обгон. */
    OK: (fill) => {
      /* Точка эллипса rx 12, ry 8 и направление движения по часовой. */
      const e = (u: number): [number, number] => {
        const t = (u * Math.PI) / 180;
        return [r2(20 + 12 * Math.cos(t)), r2(21 - 8 * Math.sin(t))];
      };
      const [sx, sy] = e(110);
      const [ex, ey] = e(25);
      const t = (25 * Math.PI) / 180;
      return (
        <>
          <ellipse cx="20" cy="21" rx="12" ry="8" fill={fill} />
          <ellipse className={V} cx="20" cy="21" rx="12" ry="8" />
          <ellipse className={H} cx="20" cy="21" rx="7.5" ry="4" />
          <path
            className={A}
            d={`M${sx} ${sy} A12 8 0 0 1 ${ex} ${ey} ${nakonechnik(ex, ey, 12 * Math.sin(t), 8 * Math.cos(t), 3.5)}`}
          />
          <circle className={T} cx={sx} cy={sy} r="1.8" />
          <circle className={P} cx="13" cy="27.5" r="1.5" />
        </>
      );
    },
    /* Работа: шестерёнка. */
    RB: (fill) => (
      <>
        <path className={V} d={shesternya(20, 20, 9, 12, 8)} fill={fill} />
        <circle className={A} cx="20" cy="20" r="4" />
      </>
    ),
    /* Прогрессии: ровные ступени. */
    PG: (fill) => (
      <>
        <path className={V} d="M8 31 V26 H14 V21 H20 V16 H26 V11 H32 V31 Z" fill={fill} />
        <path className={A} d="M11 26 L29 11" />
        {[11, 17, 23, 29].map((x, i) => (
          <circle key={x} className={T} cx={x} cy={26 - 5 * i} r="1.6" />
        ))}
      </>
    ),
  },

  /* №13. Экономическая задача. */
  '13': {
    /* Дифференцированный платёж: долг равными частями, проценты убывают. */
    A: (fill) => (
      <>
        {stolbiki([8, 8, 8, 8], fill)}
        {[10, 7, 4, 1.5].map((h, i) => (
          <rect key={i} className={A} x={9 + i * 6} y={23 - h} width="4.5" height={h} rx="0.8" />
        ))}
        <path className={V} d="M7 31 H33" />
      </>
    ),
    /* «Поломанный» дифференцированный: доли неравные. */
    B: (fill) => (
      <>
        {stolbiki([14, 6, 18, 9], fill)}
        <path className={V} d="M7 31 H33" />
        <path className={A} d="M11.25 17 L17.25 25 L23.25 13 L29.25 22" />
        {[
          [11.25, 17],
          [17.25, 25],
          [23.25, 13],
          [29.25, 22],
        ].map(([x, y]) => (
          <circle key={x} className={T} cx={x} cy={y} r="1.5" />
        ))}
      </>
    ),
    /* Аннуитет: равные платежи. */
    C: (fill) => (
      <>
        {stolbiki([13, 13, 13, 13], fill)}
        <path className={V} d="M7 31 H33" />
        <path className={AH} d="M7 18 H33" />
      </>
    ),
    /* Вклады: стопка монет растёт. */
    D: (fill) => (
      <>
        <path d="M8 19 V29 A8 3 0 0 0 24 29 V19 A8 3 0 0 0 8 19 Z" fill={fill} />
        <path
          className={V}
          d="M8 19 V29 A8 3 0 0 0 24 29 V19 M8 22.3 A8 3 0 0 0 24 22.3 M8 25.6 A8 3 0 0 0 24 25.6"
        />
        <ellipse className={V} cx="16" cy="19" rx="8" ry="3" />
        <path className={A} d={strelka(30, 31, 30, 10)} />
      </>
    ),
    /* Определи тип: лупа и вопрос. */
    T: (fill) => (
      <>
        <circle cx="18" cy="18" r="8.5" fill={fill} />
        <circle className={V} cx="18" cy="18" r="8.5" />
        <path className={V} d="M24 24 L31 31" />
        <path className={A} d="M15.3 15.6 A2.8 2.8 0 1 1 19.2 18.1 C18.3 18.6 18 19.2 18 20.2" />
        <circle className={T} cx="18" cy="23" r="1.3" />
      </>
    ),
    /* Таблица руками: таблица и карандаш. */
    P: (fill) => (
      <>
        <rect x="8" y="9" width="18" height="6" fill={fill} />
        <path className={V} d="M8 9 H26 V31 H8 Z M8 15 H26 M8 20.5 H26 M8 26 H26 M17 9 V31" />
        <path className={`${A} ${W}`} d="M31 11 L34 13 L24.5 28.5 L21.8 30.5 L21.6 27.2 Z" />
      </>
    ),
  },
};

/** Есть ли рисунок у темы. */
export function estIkonkaTemy(zadanie: string, tema: string): boolean {
  return RISUNKI[zadanie]?.[tema] !== undefined;
}

/** Значок темы генератора; null — рисунка нет, генератор поставит метку. */
export function IkonkaTemy({ zadanie, tema }: { zadanie: string; tema: string }) {
  const r = RISUNKI[zadanie]?.[tema];
  return r === undefined ? null : <IkonkaVKruge risunok={r} />;
}

/** Значки для пропа icons генератора: тема → значок (только те, у кого есть рисунок). */
export function ikonkiTem(
  zadanie: string,
  temy: readonly { id: string }[],
): Partial<Record<string, ReactNode>> {
  return Object.fromEntries(
    temy
      .filter((t) => estIkonkaTemy(zadanie, t.id))
      .map((t) => [t.id, <IkonkaTemy key={t.id} zadanie={zadanie} tema={t.id} />]),
  );
}

/** Все номера и темы с рисунками — для витрины и проверок. */
export const TEMY_S_IKONKAMI: Record<string, string[]> = Object.fromEntries(
  Object.entries(RISUNKI).map(([z, r]) => [z, Object.keys(r)]),
);
