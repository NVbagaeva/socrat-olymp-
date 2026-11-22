'use client';

import { useEffect, useRef } from 'react';
import type * as ZhurnalModul from './index';
import type { OpisanieZadachi, ZapisZhurnala } from './index';
import { currentUser } from '../auth/session';

/* Сам журнал (очередь, счётчик времени, отправка) грузится отдельным
   куском и только вошедшему ученику в сборке с флагом: первая загрузка
   страниц от него не тяжелеет. Пока кусок едет, действия копятся здесь
   и передаются записи по порядку. */
type Zhurnal = typeof ZhurnalModul;
let zhurnal: Zhurnal | null = null;
let zagruzka: Promise<Zhurnal> | null = null;

function zagruzit(): Promise<Zhurnal> | null {
  if (process.env.KAB2_ZHURNAL !== '1' || typeof window === 'undefined') {
    return null;
  }
  if (currentUser()?.role !== 'student') {
    return null;
  }
  zagruzka ??= import('./index').then((m) => {
    zhurnal = m;
    return m;
  });
  return zagruzka;
}

type Vyzov = (zapis: ZapisZhurnala) => void;

/** Запись, которая ждёт загрузки журнала и потом повторяет вызовы. */
function otlozhennaya(opis: OpisanieZadachi): ZapisZhurnala {
  let nastoyashchaya: ZapisZhurnala | null = zhurnal === null ? null : zhurnal.nachat(opis);
  let ochered: Vyzov[] | null = [];
  if (nastoyashchaya === null) {
    const idet = zagruzit();
    if (idet === null) {
      ochered = null;
    } else {
      void idet.then((m) => {
        nastoyashchaya = m.nachat(opis);
        for (const vyzov of ochered ?? []) vyzov(nastoyashchaya);
        ochered = null;
      });
    }
  }
  const vyzvat = (vyzov: Vyzov) => {
    if (nastoyashchaya !== null) vyzov(nastoyashchaya);
    else ochered?.push(vyzov);
  };
  return {
    id: null,
    popytka: (answer, ok) => vyzvat((z) => z.popytka(answer, ok)),
    podskazka: () => vyzvat((z) => z.podskazka()),
    shagPodskazki: (step) => vyzvat((z) => z.shagPodskazki(step)),
    oshibkaPodskazki: (step) => vyzvat((z) => z.oshibkaPodskazki(step)),
    svoystvo: () => vyzvat((z) => z.svoystvo()),
    reshenie: () => vyzvat((z) => z.reshenie()),
    propusk: () => vyzvat((z) => z.propusk()),
    pohozhaya: () => vyzvat((z) => z.pohozhaya()),
    zakryt: (outcome) => vyzvat((z) => z.zakryt(outcome)),
    ostavit: () => vyzvat((z) => z.ostavit()),
  };
}

const PUSTAYA: ZapisZhurnala = {
  id: null,
  popytka() {},
  podskazka() {},
  shagPodskazki() {},
  oshibkaPodskazki() {},
  svoystvo() {},
  reshenie() {},
  propusk() {},
  pohozhaya() {},
  zakryt() {},
  ostavit() {},
};

/**
 * Запись журнала для задачи на экране. Меняется ключ показа — прежняя
 * запись остаётся (её время останавливается), начинается новая.
 * Возвращает функцию: запись текущей задачи. До появления задачи и при
 * выключенном журнале — пустая запись с теми же методами.
 */
export function useZhurnal(opis: OpisanieZadachi | null): () => ZapisZhurnala {
  const ref = useRef<{ klyuch: string; zapis: ZapisZhurnala } | null>(null);
  const opisRef = useRef(opis);
  /* Описание читают эффект ниже и обработчики событий — после кадра. */
  useEffect(() => {
    opisRef.current = opis;
  });
  const klyuch = opis?.klyuch ?? null;

  useEffect(() => {
    const tekushchee = opisRef.current;
    if (klyuch === null || tekushchee === null) {
      return undefined;
    }
    const zapis = otlozhennaya(tekushchee);
    ref.current = { klyuch, zapis };
    return () => {
      zapis.ostavit();
      if (ref.current?.zapis === zapis) {
        ref.current = null;
      }
    };
  }, [klyuch]);

  return () => {
    const tekushchee = opisRef.current;
    if (tekushchee === null) {
      return PUSTAYA;
    }
    /* Событие до эффекта (первый кадр): запись начинается здесь же. */
    if (ref.current === null || ref.current.klyuch !== tekushchee.klyuch) {
      ref.current = { klyuch: tekushchee.klyuch, zapis: otlozhennaya(tekushchee) };
    }
    return ref.current.zapis;
  };
}
