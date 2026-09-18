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
   шириной контейнера. Ось лежит внизу, условия — «ступеньками» над
   ней: линия «x > c» на верхнем уровне, линия «x < d» на нижнем,
   вполовину ниже. Подписи условий — над своими линиями. */
const W = 720;
const H = 232;
/** Высота оси. */
const OS = 168;
/** Начало оси и кончик стрелки. */
const X0 = 36;
const X1 = 688;
const STRELKA = 14;
/** Куда ложатся концы отрезка распределения. */
const A_X = 96;
const B_X = 620;
/** Верхний уровень: линия условия «x > c». */
const VERH = 52;
/** Нижний уровень: линия условия «x < d», на половине высоты верхнего. */
const NIZ = OS - (OS - VERH) / 2;
/** Подпись условия стоит на столько выше своей линии. */
const NAD = 10;
/** Базовая линия чисел под осью. */
const CHISLA = OS + 34;
const R = 6.5;

/** Ширина подписи на глаз: антиква курсивом, кегль 20. */
function shirina(text: string): number {
  return text.length * 9.5;
}

/**
 * Координатная прямая к задаче на геометрическую вероятность.
 *
 * Синяя ось со стрелкой вправо; под ней числа: концы отрезка
 * распределения и границы благоприятного промежутка. Условие «x > c»
 * нарисовано на верхнем уровне: пунктир от c вверх, от него
 * горизонталь вправо до стрелки, область под ней залита
 * полупрозрачным оранжевым. Условие «x < d» — на нижнем уровне,
 * вполовину ниже: пунктир от d вверх, горизонталь влево до начала
 * оси, та же заливка. На промежутке [c; d] заливки легли одна на
 * другую, и цвет там гуще — это благоприятная область. Сам отрезок
 * оси от c до d оранжевый и толще, подпись длины стоит внутри тёмной
 * области.
 *
 * Только прямые линии и прямоугольники: никаких дуг. Строгие
 * неравенства — пустые кружки на границах, нестрогие — закрашенные.
 * Если одной из границ нет, рисуется один уровень.
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

  /* Подписи условий: «x > c» над верхней линией у её левого края,
     «x < d» над нижней у её правого края. Они на разной высоте, но
     в узком промежутке оказались бы друг под другом — тогда каждая
     отодвигается за чужую границу, и по горизонтали они расходятся. */
  const podpisC = cx === null ? null : usloviePodpis(p, 'c');
  const podpisD = dx === null ? null : usloviePodpis(p, 'd');
  let podpisCx = cx === null ? 0 : cx + 10;
  let podpisDx = dx === null ? 0 : dx - 10;
  if (cx !== null && dx !== null && podpisC !== null && podpisD !== null) {
    const tesno = podpisCx + shirina(podpisC) > podpisDx - shirina(podpisD);
    if (tesno) {
      podpisCx = Math.max(podpisCx, dx + 12);
      podpisDx = Math.min(podpisDx, cx - 12);
    }
  }

  const dlina = dlinaPodpis(p);
  const otX = px(ot);
  const doX = px(do_);
  /* Подпись длины — внутри самой тёмной области: в полосе под нижним
     уровнем, где заливки наложились; при одной границе — в середине
     единственной заливки. В узком промежутке ей там не поместиться,
     и она уходит под числа оси. */
  const dlinaTesno = dlina !== null && doX - otX < shirina(dlina) + 12;
  const dlinaY = dlinaTesno
    ? CHISLA + 26
    : cx !== null && dx !== null
      ? (NIZ + OS) / 2 + 7
      : (VERH + OS) / 2 + 7;

  const x = p.peremennaya ?? 'x';
  const opisanie =
    `Координатная прямая от ${podpis(p, 'a')} до ${podpis(p, 'b')}; ` +
    `благоприятный промежуток от ${podpis(p, 'c') || podpis(p, 'a')} ` +
    `до ${podpis(p, 'd') || podpis(p, 'b')}` +
    (dlina === null ? '' : `, ${dlina}`);

  return (
    <svg
      className={clsx('kp', className)}
      viewBox={`0 0 ${W} ${dlinaTesno ? H + 26 : H}`}
      role="img"
      aria-label={opisanie}
    >
      {/* Заливки первыми: всё остальное рисуется поверх. Верхняя — от
          c до стрелки на всю высоту верхнего уровня, нижняя — от
          начала оси до d на высоту нижнего. */}
      {cx !== null ? (
        <rect className="kp__zalivka" x={cx} y={VERH} width={konecLinii - cx} height={OS - VERH} />
      ) : null}
      {dx !== null ? (
        <rect className="kp__zalivka" x={X0} y={NIZ} width={dx - X0} height={OS - NIZ} />
      ) : null}

      {/* Условие «x > c»: пунктир вверх до верхнего уровня и линия вправо. */}
      {cx !== null ? (
        <g>
          <line className="kp__shtrih" x1={cx} y1={OS - R} x2={cx} y2={VERH} />
          <line className="kp__liniya" x1={cx} y1={VERH} x2={konecLinii} y2={VERH} />
        </g>
      ) : null}
      {/* Условие «x < d»: пунктир вверх до нижнего уровня и линия влево. */}
      {dx !== null ? (
        <g>
          <line className="kp__shtrih" x1={dx} y1={OS - R} x2={dx} y2={NIZ} />
          <line className="kp__liniya" x1={X0} y1={NIZ} x2={dx} y2={NIZ} />
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

      {/* Подписи условий над своими линиями. */}
      {podpisC !== null ? (
        <text className="kp__uslovie" x={podpisCx} y={VERH - NAD} textAnchor="start">
          {podpisC}
        </text>
      ) : null}
      {podpisD !== null ? (
        <text className="kp__uslovie" x={podpisDx} y={NIZ - NAD} textAnchor="end">
          {podpisD}
        </text>
      ) : null}

      {dlina !== null ? (
        <text className="kp__dlina" x={(otX + doX) / 2} y={dlinaY} textAnchor="middle">
          {dlina}
        </text>
      ) : null}
    </svg>
  );
}
