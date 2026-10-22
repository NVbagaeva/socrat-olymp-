'use client';

import { useSyncExternalStore } from 'react';

/*
 * Выбор «С примерами / Без примеров» справочника №1 — общий для панели
 * «Скачать справочник» и маленькой кнопки «Скачать» в липкой строке
 * «Содержание»: обе отдают один и тот же файл. В адресе не хранится,
 * после перезагрузки — снова «с примерами».
 */
let sPrimerami = true;
const slushateli = new Set<() => void>();

function podpisatsya(f: () => void): () => void {
  slushateli.add(f);
  return () => slushateli.delete(f);
}

export function useVyborPdf1(): [boolean, (v: boolean) => void] {
  const v = useSyncExternalStore(
    podpisatsya,
    () => sPrimerami,
    () => true,
  );
  return [
    v,
    (novoe: boolean) => {
      sPrimerami = novoe;
      slushateli.forEach((f) => f());
    },
  ];
}
