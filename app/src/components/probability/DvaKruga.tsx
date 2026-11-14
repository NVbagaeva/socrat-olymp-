import { clsx } from 'clsx';
import { useId } from 'react';

/**
 * Два пересекающихся круга — события A и B внутри прямоугольника всех
 * исходов. Для теории сложения вероятностей: общая часть AB закрашена
 * своим цветом, потому что именно её сумма P(A) + P(B) считает дважды.
 *
 * Цвета — язык остальных рисунков: первое событие цвета оси (синий),
 * второе — акцента (оранжевый), общая часть — терракотовый. Подписи —
 * курсивом математического шрифта, как в формулах (.pr-math .pr-var).
 *
 * Поле рисунка узкое (300 × 170): на телефоне он идёт почти один к
 * одному, и подписи не мельчают. Имена стоят в середине своих частей —
 * в «полумесяцах» и в линзе, — и друг на друга не налезают: между
 * центрами подписей не меньше 56 единиц при кегле 22.
 */

export interface DvaKrugaProps {
  /** Имена частей: «A», «B», «AB». */
  podpisi?: { a: string; b: string; ab: string };
  alt: string;
  className?: string;
}

/* Геометрия в единицах viewBox. */
const W = 300;
const H = 170;
const R = 62;
const CY = 85;
const XA = 116;
const XB = 184;

export function DvaKruga({
  podpisi = { a: 'A', b: 'B', ab: 'AB' },
  alt,
  className,
}: DvaKrugaProps) {
  /* Свой id у каждой копии: на странице рисунков может быть несколько. */
  const klip = `pr-krugi-${useId().replace(/:/g, '')}`;
  return (
    <svg
      className={clsx('pr-krugi', className)}
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      role="img"
      aria-label={alt}
    >
      <defs>
        <clipPath id={klip}>
          <circle cx={XA} cy={CY} r={R} />
        </clipPath>
      </defs>
      <rect className="pr-krugi__pole" x="4" y="4" width={W - 8} height={H - 8} rx="10" />
      <circle className="pr-krugi__krug pr-krugi__krug--a" cx={XA} cy={CY} r={R} />
      <circle className="pr-krugi__krug pr-krugi__krug--b" cx={XB} cy={CY} r={R} />
      {/* Общая часть: второй круг, обрезанный первым. */}
      <circle className="pr-krugi__obshchee" cx={XB} cy={CY} r={R} clipPath={`url(#${klip})`} />
      <circle className="pr-krugi__kontur pr-krugi__kontur--a" cx={XA} cy={CY} r={R} />
      <circle className="pr-krugi__kontur pr-krugi__kontur--b" cx={XB} cy={CY} r={R} />
      <text className="pr-math pr-krugi__imya" x={XA - 32} y={CY + 8} textAnchor="middle">
        <tspan className="pr-var">{podpisi.a}</tspan>
      </text>
      <text className="pr-math pr-krugi__imya" x={XB + 32} y={CY + 8} textAnchor="middle">
        <tspan className="pr-var">{podpisi.b}</tspan>
      </text>
      <text
        className="pr-math pr-krugi__imya pr-krugi__imya--ab"
        x={(XA + XB) / 2}
        y={CY + 8}
        textAnchor="middle"
      >
        <tspan className="pr-var">{podpisi.ab}</tspan>
      </text>
    </svg>
  );
}
