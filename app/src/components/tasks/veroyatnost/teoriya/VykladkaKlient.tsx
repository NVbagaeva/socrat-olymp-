'use client';

import { clsx } from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';

export interface VykladkaKlientProps {
  /** Вся формула одной строкой — готовая вёрстка KaTeX. */
  odnoy: string;
  /** Та же формула строками автора — вёрстка каждой строки. */
  stroki: readonly string[];
}

/**
 * Выбор записи по ширине колонки.
 *
 * Однострочная запись всегда есть в разметке, но до примерки она
 * невидима и из потока вынута — по ней меряется, влезает ли формула
 * в колонку. Влезает — показывается она, строки прячутся. Не
 * влезает — остаются строки автора с двойным знаком на разрыве.
 * Примерка повторяется при каждом изменении ширины колонки: раздел
 * перестраивается по ширине контейнера, и ответ меняется вместе с
 * ним.
 *
 * До примерки (и без скриптов) стоят строки: они не могут вылезти
 * за край, а однострочная запись на телефоне — может.
 */
export function VykladkaKlient({ odnoy, stroki }: VykladkaKlientProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [vOdnu, setVOdnu] = useState(false);

  useLayoutEffect(() => {
    const blok = ref.current;
    const proba = blok?.querySelector<HTMLElement>('.vteor-vykladka__odnoy');
    if (blok === null || proba === null || proba === undefined) {
      return undefined;
    }
    /* Коробка примерки сжата в точку, и её scrollWidth — это ширина
       формулы одной строкой. */
    const primerit = () => {
      setVOdnu(proba.scrollWidth <= blok.clientWidth);
    };
    primerit();
    const nablyudatel = new ResizeObserver(primerit);
    nablyudatel.observe(blok);
    return () => nablyudatel.disconnect();
  }, []);

  return (
    <div ref={ref} className={clsx('vteor-vykladka', vOdnu && 'is-odnoy')}>
      <span
        className="vteor-vykladka__odnoy"
        aria-hidden={vOdnu ? undefined : true}
        dangerouslySetInnerHTML={{ __html: odnoy }}
      />
      {stroki.map((html, i) => (
        <span
          // Строки могут повторяться дословно, поэтому ключ — место.
          key={i}
          className="vteor-vykladka__stroka"
          aria-hidden={vOdnu ? true : undefined}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ))}
    </div>
  );
}
