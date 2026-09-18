import { clsx } from 'clsx';
import {
  dlinaPodpis,
  podpis,
  promezhutok,
  usloviePodpis,
  type Pryamaya,
} from '@/lib/veroyatnost/pryamaya';

export interface KoordinatnayaPryamayaProps {
  pryamaya: Pryamaya;
  className?: string;
}

/* Размеры в единицах viewBox; на странице рисунок масштабируется
   шириной контейнера. Ось лежит в нижней трети, штрихи от границ
   поднимаются на треть высоты рисунка, подписи условий — над линиями. */
const W = 720;
const H = 220;
/** Высота оси. */
const OS = 156;
/** Начало оси и кончик стрелки. */
const X0 = 36;
const X1 = 688;
const STRELKA = 14;
/** Куда ложатся концы отрезка распределения. */
const A_X = 96;
const B_X = 620;
/** Высота горизонтальных линий условий. */
const VERH = 76;
/** Базовая линия подписей условий. */
const PODPIS = 60;
/** Базовая линия чисел под осью. */
const CHISLA = OS + 34;
const R = 6.5;

/** Ширина подписи на глаз: антиква курсивом, кегль 19. */
function shirina(text: string): number {
  return text.length * 9.5;
}

/**
 * Координатная прямая к задаче на геометрическую вероятность.
 *
 * Синяя ось со стрелкой вправо; под ней числа: концы отрезка
 * распределения и границы благоприятного промежутка. От каждой
 * границы вверх идёт штрих, от его верха — горизонтальная линия в
 * сторону, куда смотрит неравенство: «x > c» вправо до стрелки,
 * «x < d» влево до начала оси. Область под каждой линией залита
 * полупрозрачным оранжевым, и там, где заливки легли одна на другую,
 * цвет гуще — это и есть благоприятный промежуток. Сам отрезок оси
 * от c до d оранжевый и толще, над ним подпись длины.
 *
 * Только прямые линии и прямоугольники: никаких дуг. Строгие
 * неравенства — пустые кружки на границах, нестрогие — закрашенные.
 */
export function KoordinatnayaPryamaya({ pryamaya: p, className }: KoordinatnayaPryamayaProps) {
  const { ot, do: do_ } = promezhutok(p);
  const px = (v: number): number => A_X + ((v - p.a) / (p.b - p.a)) * (B_X - A_X);

  const cx = p.c === undefined ? null : px(p.c);
  const dx = p.d === undefined ? null : px(p.d);
  const konecLinii = X1 - STRELKA;

  /* Числа под осью: одна засечка на одно значение, даже если граница
     промежутка совпала с концом отрезка. */
  const zasechki = (['a', 'c', 'd', 'b'] as const)
    .filter((k) => p[k] !== undefined)
    .filter((k, i, all) => all.findIndex((other) => p[other] === p[k]) === i)
    .map((k) => ({ k, x: px(p[k] as number), text: podpis(p, k) }));

  /* Подписи условий стоят у своих границ: «x > c» сразу справа от c,
     «x < d» сразу слева от d. Если промежуток узок и они бы
     столкнулись, обе уходят к дальним концам своих линий. */
  const podpisC = cx === null ? null : usloviePodpis(p, 'c');
  const podpisD = dx === null ? null : usloviePodpis(p, 'd');
  const tesno =
    cx !== null &&
    dx !== null &&
    podpisC !== null &&
    podpisD !== null &&
    cx + 10 + shirina(podpisC) > dx - 10 - shirina(podpisD);

  const dlina = dlinaPodpis(p);
  const otX = px(ot);
  const doX = px(do_);
  /* Подпись длины — посередине промежутка, между линией и осью. В
     узком промежутке ей там не поместиться, и она уходит наверх. */
  const dlinaTesno = dlina !== null && doX - otX < shirina(dlina) + 12;

  const x = p.peremennaya ?? 'x';
  const opisanie =
    `Координатная прямая от ${podpis(p, 'a')} до ${podpis(p, 'b')}; ` +
    `благоприятный промежуток от ${podpis(p, 'c') || podpis(p, 'a')} ` +
    `до ${podpis(p, 'd') || podpis(p, 'b')}` +
    (dlina === null ? '' : `, ${dlina}`);

  return (
    <svg
      className={clsx('kp', className)}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={opisanie}
    >
      {/* Заливки первыми: всё остальное рисуется поверх. */}
      {cx !== null ? (
        <rect className="kp__zalivka" x={cx} y={VERH} width={konecLinii - cx} height={OS - VERH} />
      ) : null}
      {dx !== null ? (
        <rect className="kp__zalivka" x={X0} y={VERH} width={dx - X0} height={OS - VERH} />
      ) : null}

      {/* Линии условий: штрих вверх от границы и горизонталь от его верха. */}
      {cx !== null ? (
        <g className="kp__uslovie-linii">
          <line className="kp__shtrih" x1={cx} y1={OS - R} x2={cx} y2={VERH} />
          <line className="kp__liniya" x1={cx} y1={VERH} x2={konecLinii} y2={VERH} />
        </g>
      ) : null}
      {dx !== null ? (
        <g className="kp__uslovie-linii">
          <line className="kp__shtrih" x1={dx} y1={OS - R} x2={dx} y2={VERH} />
          <line className="kp__liniya" x1={X0} y1={VERH} x2={dx} y2={VERH} />
        </g>
      ) : null}

      {/* Ось со стрелкой и засечками. */}
      <line className="kp__os" x1={X0} y1={OS} x2={X1 - STRELKA + 2} y2={OS} />
      <polygon
        className="kp__strelka"
        points={`${X1},${OS} ${X1 - STRELKA},${OS - 6} ${X1 - STRELKA},${OS + 6}`}
      />
      {zasechki.map((z) => (
        <g key={z.k}>
          <line className="kp__zasechka" x1={z.x} y1={OS - 7} x2={z.x} y2={OS + 7} />
          <text className="kp__chislo" x={z.x} y={CHISLA} textAnchor="middle">
            {z.text}
          </text>
        </g>
      ))}
      <text className="kp__x" x={X1 + 16} y={CHISLA + 2} textAnchor="middle">
        {x}
      </text>

      {/* Благоприятный промежуток: отрезок оси толще и оранжевый. */}
      <line className="kp__otrezok" x1={otX} y1={OS} x2={doX} y2={OS} />
      {cx !== null ? (
        <circle
          className={clsx('kp__tochka', p.nestrogo && 'kp__tochka--zakrashena')}
          cx={cx}
          cy={OS}
          r={R}
        />
      ) : null}
      {dx !== null ? (
        <circle
          className={clsx('kp__tochka', p.nestrogo && 'kp__tochka--zakrashena')}
          cx={dx}
          cy={OS}
          r={R}
        />
      ) : null}

      {/* Подписи условий над линиями. */}
      {cx !== null && podpisC !== null ? (
        <text
          className="kp__uslovie"
          x={tesno ? konecLinii : cx + 10}
          y={PODPIS}
          textAnchor={tesno ? 'end' : 'start'}
        >
          {podpisC}
        </text>
      ) : null}
      {dx !== null && podpisD !== null ? (
        <text
          className="kp__uslovie"
          x={tesno ? X0 : dx - 10}
          y={PODPIS}
          textAnchor={tesno ? 'start' : 'end'}
        >
          {podpisD}
        </text>
      ) : null}

      {dlina !== null ? (
        <text
          className="kp__dlina"
          x={(otX + doX) / 2}
          y={dlinaTesno ? PODPIS : (VERH + OS) / 2 + 7}
          textAnchor="middle"
        >
          {dlina}
        </text>
      ) : null}
    </svg>
  );
}
