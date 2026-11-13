'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { TRENAZHER11 } from '@/content/tekstovye11';
import { teoriyaHref11, zadachaHref11 } from '@/lib/zadanie11/links';
import { YAKOR_11 } from '@/lib/zadanie11/teoriya-yakorya';
import type { ZadachaLite11 } from '@/lib/zadanie11/trening/dannye';
import { readChoice11, readSealed11 } from '@/lib/zadanie11/trening/otvet11';
import { log11, vybor11 } from '@/lib/zadanie11/trening/progress';
import type { Razbor11 } from '@/lib/zadanie11/trening/reshatel';
import { KLYUCH11, razobratZapis11 } from '@/lib/zadanie11/trening/session';
import type { KatalogBanka } from '@/lib/trening/bank';
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
 * Ответ выбором (РЗ-17 «что больше»): кнопки-варианты вместо поля — как
 * «Определи тип» у №13 (те же классы .trn-vybor__knopka).
 */
function VyborVarianta({
  varianty,
  value,
  onValue,
  zakryto,
  verno,
}: {
  varianty: readonly string[];
  value: string;
  onValue: (value: string) => void;
  zakryto: boolean;
  verno: boolean | null;
}) {
  return (
    <div className="trn-vybor" role="radiogroup" aria-label={T.otvet}>
      {varianty.map((label, i) => {
        const nomer = String(i + 1);
        const vybran = value === nomer;
        return (
          <button
            key={nomer}
            type="button"
            role="radio"
            aria-checked={vybran}
            className={clsx(
              'trn-vybor__knopka',
              vybran && 'is-on',
              vybran && verno === true && 'is-right',
              vybran && verno === false && 'is-wrong',
            )}
            disabled={zakryto}
            onClick={() => onValue(nomer)}
          >
            <span className="z11-variant__no">{nomer}</span>{' '}
            <span dangerouslySetInnerHTML={{ __html: ZAGRUZKA11.nabrat(label) }} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * №11 для общего тренажёра по банку (components/tasks/trening/bank):
 * ключи задач, хранилища, загрузчик файлов подтипов, проверка ответа
 * (числом или выбором), подсказка-вопросы с таблицей модели, разбор
 * этапами. Чтение записи понимает прежний тренажёр №11 (каталог нужен,
 * чтобы подставить задачу банка вместо задачи прежнего генератора).
 */
export function razdel11(
  ssylki: Record<string, SsylkiTipa11>,
  katalog: KatalogBanka,
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
    pole: (z, _rezhim, ui) =>
      z.vybory === undefined ? null : <VyborVarianta varianty={z.vybory} {...ui} />,
    pod: (z) => <Pod11 z={z} ssylki={ssylki[z.prototypeId]} />,
    shagi: shagi11,
    voprosy: voprosy11,
    podskazka: (s, ui) => <Podskazka11 razbor={s} otkryto={ui.otkryto} dalshe={ui.dalshe} />,
    zadachaHref: zadachaHref11,
    prezhnyayaZapis: (packed) => razobratZapis11(packed, katalog),
  };
}
