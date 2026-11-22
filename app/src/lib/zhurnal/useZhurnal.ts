'use client';

import { useEffect, useRef } from 'react';
import { nachat, type OpisanieZadachi, type ZapisZhurnala } from './index';

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
    const zapis = nachat(tekushchee);
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
      return nachat({ klyuch: '', source: 'trainer', taskNo: -1 });
    }
    /* Событие до эффекта (первый кадр): запись начинается здесь же. */
    if (ref.current === null || ref.current.klyuch !== tekushchee.klyuch) {
      ref.current = { klyuch: tekushchee.klyuch, zapis: nachat(tekushchee) };
    }
    return ref.current.zapis;
  };
}
