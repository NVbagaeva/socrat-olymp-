'use client';

import { clsx } from 'clsx';
import { TRENAZHER13 } from '@/content/ekonomicheskie13';
import { estPi } from '@/lib/zadanie7/otvet';
import { zadachaHref13 } from '@/lib/zadanie13/links';
import { TYPE_NAMES, type TypeCode } from '@/lib/zadanie13/types';
import { proverit13 } from '@/lib/zadanie13/trening/otvet13';
import { log13, vybor13 } from '@/lib/zadanie13/trening/progress';
import {
  gotovOformlenie,
  proveritOformlenie,
  razobratOformlenie,
} from '@/lib/zadanie13/trening/oformlenie13';
import {
  KLYUCH13,
  prezhnyayaZapis13,
  REZHIM_OFORMLENIE,
  REZHIM_TIP,
} from '@/lib/zadanie13/trening/session';
import {
  oformlenie13,
  ZAGRUZKA13,
  type Reshenie13,
  type Zadacha13,
} from '@/lib/zadanie13/trening/zagruzka';
import type { RazdelBanka } from '../trening/bank/types';
import { Oformlenie13Pole } from './Oformlenie13';
import { shagi13, voprosy13 } from './shagi13';

const TIPY: TypeCode[] = ['A', 'B', 'C', 'D'];

/**
 * Под условием задачи №13: таблица условия (график долга) и откуда задача
 * («не из открытого банка», «повышенный уровень»).
 */
function Pod13({ z }: { z: Zadacha13 }) {
  return (
    <>
      {z.tablitsaHtml === null ? null : (
        <div
          className="trn-risunok trn-risunok--shirokiy z13-reshenie"
          dangerouslySetInnerHTML={{ __html: z.tablitsaHtml }}
        />
      )}
      {z.metki.length === 0 ? null : <p className="trn-istochnik">{z.metki.join(' · ')}</p>}
    </>
  );
}

/** «Определи тип»: четыре схемы кнопками. Значение — номер схемы, как у отпечатка. */
function VyborShemy({
  value,
  onValue,
  zakryto,
  verno,
}: {
  value: string;
  onValue: (value: string) => void;
  zakryto: boolean;
  verno: boolean | null;
}) {
  return (
    <div className="trn-vybor" role="radiogroup" aria-label={TRENAZHER13.ekran.tipVopros}>
      {TIPY.map((type, i) => {
        const nomer = String(i + 1);
        const vybran = value === nomer;
        return (
          <button
            key={type}
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
            {TYPE_NAMES[type]}
          </button>
        );
      })}
    </div>
  );
}

const tip = (rezhim: string | undefined) => rezhim === REZHIM_TIP;
const oform = (rezhim: string | undefined) => rezhim === REZHIM_OFORMLENIE;

/**
 * №13 для общего тренажёра по банку (components/tasks/trening/bank):
 * ключи задач, хранилища, загрузчик (движок задач в браузере), проверка
 * ответа с вердиктом «число верное, единицы нет», таблица условия,
 * разбор шагами и подсказки-вопросы. Четвёртая карточка режима —
 * «Определи тип»: назвать схему по условию.
 */
export const RAZDEL13: RazdelBanka<Zadacha13, Reshenie13> = {
  razdel: '13',
  klyuch: KLYUCH13,
  log: log13,
  vybor: vybor13,
  zagruzka: ZAGRUZKA13,
  T: TRENAZHER13,
  proverit: (vvod, _seal, z, rezhim) => {
    if (oform(rezhim)) {
      return estPi(razobratOformlenie(vvod).o)
        ? { kind: 'pi' }
        : proveritOformlenie(vvod, z, oformlenie13(z));
    }
    return !tip(rezhim) && estPi(vvod) ? { kind: 'pi' } : proverit13(vvod, z, tip(rezhim));
  },
  pod: (z) => <Pod13 z={z} />,
  shagi: (s, rezhim) => shagi13(tip(rezhim) ? s.tip.shagi : s.shagi),
  posle: (s, rezhim) => (
    <p className="trn-otvet-stroka">
      <b>{TRENAZHER13.ekran.otvet}:</b> {tip(rezhim) ? s.tip.otvet : s.otvet}
    </p>
  ),
  voprosy: (s, rezhim) => voprosy13(tip(rezhim) ? s.tip.voprosy : s.voprosy),
  pole: (z, rezhim, ui) =>
    tip(rezhim) ? (
      <VyborShemy {...ui} />
    ) : oform(rezhim) ? (
      <Oformlenie13Pole of={oformlenie13(z)} {...ui} />
    ) : null,
  gotov: (z, rezhim, value) =>
    oform(rezhim) ? gotovOformlenie(oformlenie13(z), value) : value.trim() !== '',
  dopRezhimy: [
    {
      id: REZHIM_TIP,
      ikonka: 'tip',
      zag: TRENAZHER13.rezhimy.tip.zag,
      lead: TRENAZHER13.rezhimy.tip.lead,
    },
    {
      id: REZHIM_OFORMLENIE,
      ikonka: 'tablica',
      zag: TRENAZHER13.rezhimy.oformlenie.zag,
      lead: TRENAZHER13.rezhimy.oformlenie.lead,
    },
  ],
  otvetVybora: TRENAZHER13.vybor.otvet,
  urovni: TRENAZHER13.vybor.urovni,
  prezhnyayaZapis: prezhnyayaZapis13,
  zadachaHref: zadachaHref13,
};
