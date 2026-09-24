'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { zagruzka as fayl } from '@/content/zagruzka';
import { normalizovat, prichinyBezSrochnosti, type Zakaz } from '@/lib/usluga/raschet';
import { useKlientskoe } from '@/lib/usluga/klient';
import { prochitat, type Zagruzka } from '@/lib/usluga/zagruzka';

let zagruzkaKesh: Zagruzka | null = null;
const zagruzkaSnimok = () => (zagruzkaKesh ??= prochitat(fayl, new Date()));

/**
 * Общее состояние заказа на странице услуги: калькулятор, кнопки
 * пакетов и форма работают с одним и тем же заказом. Меняешь число
 * задач в форме — меняется и расчёт в калькуляторе, и наоборот.
 *
 * Здесь же загрузка: она зависит от сегодняшней даты, поэтому
 * считается в браузере, а не при сборке — иначе застыла бы на дне сборки.
 */

const NACHALNYY: Zakaz = {
  zadach: 10,
  uroven: 'otvety',
  variantov: 4,
  rukopis: false,
  slozhnyhChertezhey: 0,
  srochnost: 'bazovyy',
};

interface ZakazState {
  zakaz: Zakaz;
  izmenit: (chto: Partial<Zakaz>) => void;
  /** Посчитал ли посетитель заказ сам: тогда расчёт идёт в форму. */
  poschital: boolean;
  /** null — ещё не прочитано в браузере. */
  zagruzka: Zagruzka | null;
}

const Ctx = createContext<ZakazState | null>(null);

/** Срочность, которая заказу больше не подходит, сбрасывается на обычный срок. */
function dopustimyy(z: Zakaz, mesto: boolean): Zakaz {
  const n = normalizovat(z);
  if (n.srochnost !== 'bazovyy' && prichinyBezSrochnosti(n, n.srochnost, mesto).length > 0) {
    return { ...n, srochnost: 'bazovyy' };
  }
  return n;
}

export function ZakazProvider({ children }: { children: ReactNode }) {
  const [vvod, setVvod] = useState<Zakaz>(NACHALNYY);
  const [poschital, setPoschital] = useState(false);
  const zagruzka = useKlientskoe<Zagruzka | null>(zagruzkaSnimok, null);
  const mesto = zagruzka?.srochnoeSvobodno ?? true;

  /* Допустимость срочности считается при отрисовке: занятое место
     узнаётся уже в браузере, и выбранная срочность сразу сбрасывается. */
  const zakaz = useMemo(() => dopustimyy(vvod, mesto), [vvod, mesto]);

  const value = useMemo<ZakazState>(
    () => ({
      zakaz,
      poschital,
      zagruzka,
      izmenit: (chto) => {
        setPoschital(true);
        setVvod((prev) => dopustimyy({ ...prev, ...chto }, mesto));
      },
    }),
    [zakaz, poschital, zagruzka, mesto],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useZakaz(): ZakazState {
  const value = useContext(Ctx);
  if (value === null) {
    throw new Error('useZakaz вызван вне ZakazProvider');
  }
  return value;
}
