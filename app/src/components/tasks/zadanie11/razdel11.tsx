'use client';

import Link from 'next/link';
import { TRENAZHER11 } from '@/content/tekstovye11';
import { teoriyaHref11, zadachaHref11 } from '@/lib/zadanie11/links';
import { YAKOR_11 } from '@/lib/zadanie11/teoriya-yakorya';
import type { ZadachaLite11 } from '@/lib/zadanie11/trening/dannye';
import { readChoice11, readSealed11 } from '@/lib/zadanie11/trening/otvet11';
import { log11, vybor11 } from '@/lib/zadanie11/trening/progress';
import type { Razbor11 } from '@/lib/zadanie11/trening/reshatel';
import { KLYUCH11, razobratZapis11 } from '@/lib/zadanie11/trening/session';
import { ZAGRUZKA11 } from '@/lib/zadanie11/trening/zagruzka';
import type { LifehackId } from '@/lib/zadanie11/types';
import type { RazdelBanka } from '../trening/bank/types';
import { Podskazka11 } from './Podskazka11';
import { shagi11, voprosy11 } from './shagi11';

/** Куда ведут «Материалы к задаче» у подтипа: теория и опорный блок (адреса). */
export interface SsylkiTipa11 {
  teoriya?: string;
  opornye?: string;
}

const T = TRENAZHER11.ekran;

/**
 * Под условием задачи №11: откуда задача и «Материалы к задаче» —
 * лайфхак, теория раздела, опорный блок (как в прежнем тренажёре).
 */
function Pod11({ z, ssylki }: { z: ZadachaLite11; ssylki: SsylkiTipa11 | undefined }) {
  const layfhak = z.lh?.[0] as LifehackId | undefined;
  return (
    <>
      <p className="trn-istochnik">
        {z.source === 'fipi' ? T.fipi : z.source === 'razminka' ? T.razminka : T.analog}
      </p>
      <nav className="z11-materialy" aria-label={T.materialy}>
        {layfhak === undefined ? null : (
          <Link className="z11-materialy__ssylka" href={teoriyaHref11(YAKOR_11.layfhak(layfhak))}>
            {T.layfhak}
          </Link>
        )}
        {ssylki?.teoriya === undefined ? null : (
          <Link className="z11-materialy__ssylka" href={ssylki.teoriya}>
            {T.teoriya}
          </Link>
        )}
        {ssylki?.opornye === undefined ? null : (
          <Link className="z11-materialy__ssylka" href={ssylki.opornye}>
            {T.opornyy}
          </Link>
        )}
      </nav>
    </>
  );
}

/**
 * №11 для общего тренажёра по банку (components/tasks/trening/bank):
 * ключи задач, хранилища, загрузчик файлов подтипов, проверка ответа
 * (числом или выбором), подсказка-вопросы с таблицей модели, разбор
 * этапами. Чтение записи понимает прежний тренажёр №11.
 */
export function razdel11(
  ssylki: Record<string, SsylkiTipa11>,
): RazdelBanka<ZadachaLite11, Razbor11> {
  return {
    razdel: '11',
    klyuch: KLYUCH11,
    log: log11,
    vybor: vybor11,
    zagruzka: ZAGRUZKA11,
    T: TRENAZHER11,
    proverit: (vvod, seal, z) =>
      z.vybory === undefined ? readSealed11(vvod, seal) : readChoice11(vvod, seal),
    vybory: (z) =>
      z.vybory?.map((label, i) => ({
        number: String(i + 1),
        labelHtml: ZAGRUZKA11.nabrat(label),
      })),
    pod: (z) => <Pod11 z={z} ssylki={ssylki[z.prototypeId]} />,
    shagi: shagi11,
    voprosy: voprosy11,
    podskazka: (s, ui) => <Podskazka11 razbor={s} otkryto={ui.otkryto} dalshe={ui.dalshe} />,
    zadachaHref: zadachaHref11,
    zapis: razobratZapis11,
  };
}
