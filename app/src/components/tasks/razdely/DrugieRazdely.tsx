'use client';

import Link from 'next/link';
import { useId } from 'react';
import { RazdelKartochka, StrelkaVpravo } from './RazdelKartochka';
import type { RazdelyData } from './types';
import { adresVkladki, zapomnitVkladku } from './vkladka';
import './razdely.css';

export interface DrugieRazdelyProps extends RazdelyData {
  /** Вкладка, открытая сейчас: в другом разделе откроется она же. */
  vkladka: string;
}

/**
 * «Другие разделы №12» в конце каждой вкладки раздела: карточки всех
 * разделов, кроме текущего. Разделов «Скоро» здесь нет — звать в них
 * незачем, они видны в меню разделов.
 */
export function DrugieRazdely({ no, razdely, current, podzagolovok, vkladka }: DrugieRazdelyProps) {
  const titleId = useId();
  const items = razdely.filter((razdel) => razdel.id !== current && !razdel.soon);
  if (items.length === 0) {
    return null;
  }
  return (
    <section className="drugie-razdely" aria-labelledby={titleId}>
      <h2 className="drugie-razdely__title" id={titleId}>
        Другие разделы №{no}
      </h2>
      <p className="drugie-razdely__lead">{podzagolovok}</p>
      <ul className="drugie-razdely__list">
        {items.map((razdel) => (
          <li key={razdel.id}>
            <Link
              className="razdel-karta razdel-karta--krupno"
              href={adresVkladki(razdel, vkladka)}
              /* «Назад» из нового раздела вернёт на ту же вкладку. */
              onClick={() => zapomnitVkladku(vkladka)}
            >
              <RazdelKartochka
                razdel={razdel}
                sizes="(min-width: 768px) 112px, 104px"
                end={<StrelkaVpravo />}
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
