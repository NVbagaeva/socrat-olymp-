'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DrugieRazdely,
  RazdelyNav,
  type RazdelKarta,
  type RazdelyData,
} from '@/components/tasks/razdely';
import { NAV_STEREO, STEREO, VKLADKI_STEREO, type StereoNo } from '@/content/stereo/zadaniya';
import { ZADANIYA } from '@/lib/paths';

/** Карточка задания в меню: все вкладки — по своим адресам. */
function karta(no: StereoNo): RazdelKarta {
  const z = STEREO[no];
  const base = `${ZADANIYA}/${z.slug}/`;
  return {
    id: z.no,
    title: z.title,
    graphName: z.podpis,
    soon: false,
    vkladki: Object.fromEntries(VKLADKI_STEREO.map((tab) => [tab.id, base + tab.tail])),
    scope: z.slug,
  };
}

function dannye(no: StereoNo): RazdelyData {
  return {
    no,
    chi: NAV_STEREO.chi,
    razdely: [karta('3'), karta('15')],
    current: no,
    podzagolovok: NAV_STEREO.drugoeLead,
  };
}

/** Открытая вкладка по адресу: хвост после /zadaniya/<no>/. */
function useVkladka(no: StereoNo): string {
  const pathname = usePathname();
  const tail = pathname.replace(`${ZADANIYA}/${STEREO[no].slug}`, '').replace(/^\/+/, '');
  const tab =
    VKLADKI_STEREO.find((item) => item.tail !== '' && tail.startsWith(item.tail)) ??
    VKLADKI_STEREO[0];
  return tab?.id ?? 'o-zadanii';
}

/**
 * Плашка «Задание №3 ▾» в строке ленты и меню-шторка со стереометрией
 * обеих частей. Внизу меню — к спискам заданий части 1 и части 2:
 * с телефона это одно касание.
 */
export function StereoNav({ no }: { no: StereoNo }) {
  const vkladka = useVkladka(no);
  return (
    <RazdelyNav
      {...dannye(no)}
      vkladka={vkladka}
      niz={
        <nav className="stereo-chasti" aria-label="Списки заданий">
          {NAV_STEREO.kChasti.map((item) => (
            <Link
              className="btn btn--secondary btn--sm stereo-chasti__link"
              href={item.href}
              key={item.part}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      }
    />
  );
}

/** Блок «Стереометрия в другой части» внизу каждой вкладки. */
export function StereoDrugie({ no }: { no: StereoNo }) {
  const vkladka = useVkladka(no);
  return <DrugieRazdely {...dannye(no)} vkladka={vkladka} zagolovok={NAV_STEREO.drugoe} />;
}
