'use client';

import { clsx } from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';

export interface VykladkaKlientProps {
  /**
   * Формула кусками по знаку «=» — вёрстка KaTeX каждого куска со
   * своими знаками по краям: кусок до разрыва кончается на «=»,
   * кусок после начинается с него.
   */
  kuski: readonly string[];
  className?: string;
}

/** Строка выкладки: первый кусок и сколько кусков за ним. */
type Stroka = readonly [nachalo: number, dlina: number];

/** Каждый кусок своей строкой — до примерки и без скриптов. */
function poOdnomu(n: number): Stroka[] {
  return Array.from({ length: n }, (_, i) => [i, 1] as const);
}

/**
 * Вёрстка строки из кусков: первый как есть, у следующих ведущий
 * «=» спрятан стилем (.vykladka__dalshe) — на стыке в одной строке
 * знак пишется один раз, на разрыве — дважды.
 */
function stroka(kuski: readonly string[], [nachalo, dlina]: Stroka): string {
  return kuski
    .slice(nachalo, nachalo + dlina)
    .map((html, i) => (i === 0 ? html : ` <span class="vykladka__dalshe">${html}</span>`))
    .join('');
}

/**
 * Выкладка — формула, которая рвётся только по знаку «=».
 *
 * Куски приходят с сервера; здесь они собираются в строки по ширине
 * колонки: помещается вся формула — она стоит одной строкой без
 * повторных знаков; нет — в строку берётся столько кусков подряд,
 * сколько влезает, и на разрыве знак «=» стоит дважды, в конце
 * строки и в начале следующей. Ни один кусок не рвётся, и ничего не
 * прокручивается.
 *
 * Примерка: для каждого возможного отрезка кусков в разметке стоит
 * невидимая проба, сжатая в точку с обрезкой, — её scrollWidth и
 * есть ширина отрезка одной строкой; за край страницы пробы не
 * высовываются. Примерка повторяется при каждом изменении ширины.
 * До неё (и без скриптов) каждый кусок стоит своей строкой: так
 * ничего не вылезет за край.
 */
export function VykladkaKlient({ kuski, className }: VykladkaKlientProps) {
  const n = kuski.length;
  const ref = useRef<HTMLDivElement>(null);
  const [stroki, setStroki] = useState<Stroka[]>(() => poOdnomu(n));

  useLayoutEffect(() => {
    const blok = ref.current;
    if (blok === null) {
      return undefined;
    }
    const primerit = () => {
      const shirina = blok.clientWidth;
      const vlezaet = (nachalo: number, dlina: number) => {
        const proba = blok.querySelector<HTMLElement>(`[data-proba="${nachalo}-${dlina}"]`);
        return proba !== null && proba.scrollWidth <= shirina;
      };
      const novye: Stroka[] = [];
      let nachalo = 0;
      while (nachalo < n) {
        /* Жадно: строка растёт, пока следующий кусок ещё влезает.
           Кусок, который не влезает даже один, всё равно берётся —
           рвать его негде. */
        let dlina = 1;
        while (nachalo + dlina < n && vlezaet(nachalo, dlina + 1)) {
          dlina += 1;
        }
        novye.push([nachalo, dlina]);
        nachalo += dlina;
      }
      /* Тот же набор строк — то же состояние: иначе наблюдатель
         ширины и отрисовка гоняли бы друг друга по кругу. */
      setStroki((byli) =>
        byli.length === novye.length &&
        byli.every((b, i) => b[0] === novye[i]?.[0] && b[1] === novye[i]?.[1])
          ? byli
          : novye,
      );
    };
    primerit();
    const nablyudatel = new ResizeObserver(primerit);
    nablyudatel.observe(blok);
    return () => nablyudatel.disconnect();
  }, [n]);

  /* Пробы всех отрезков длиннее одного куска: один кусок и так
     стоит строкой, мерить его незачем. */
  const proby: Stroka[] = [];
  for (let nachalo = 0; nachalo < n; nachalo += 1) {
    for (let dlina = 2; nachalo + dlina <= n; dlina += 1) {
      proby.push([nachalo, dlina]);
    }
  }

  return (
    <div ref={ref} className={clsx('vykladka', className)}>
      {proby.map((p) => (
        <span
          key={`p${p[0]}-${p[1]}`}
          className="vykladka__proba"
          data-proba={`${p[0]}-${p[1]}`}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: stroka(kuski, p) }}
        />
      ))}
      {stroki.map((s) => (
        <span
          key={`s${s[0]}-${s[1]}`}
          className="vykladka__stroka"
          dangerouslySetInnerHTML={{ __html: stroka(kuski, s) }}
        />
      ))}
    </div>
  );
}
