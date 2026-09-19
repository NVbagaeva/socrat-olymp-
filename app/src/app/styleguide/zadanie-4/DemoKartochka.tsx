'use client';

import { useState } from 'react';
import {
  Reshenie,
  Zadacha,
  ZadachaKnopki,
  ZadachaShapka,
  ZadachaUslovie,
} from '@/components/tasks/veroyatnost/ZadachaCard';
import type { Razbor } from '@/lib/veroyatnost/razbor';
import type { Illyustratsiya } from '@/lib/veroyatnost/types';

export interface DemoKartochkaProps {
  id: string;
  nomer: number;
  uslovie: string;
  illyustratsiya?: Illyustratsiya;
  /** Разбор на витрине открыт сразу: ответы здесь показываются намеренно. */
  razbor: Razbor;
  sleduyushchaya?: string;
}

/**
 * Карточка на витрине: та же, что в тренажёре, но разбор раскрыт с
 * самого начала и без поля ответа — здесь смотрят рисунок, а не
 * решают. «Показать ответ» прячет и раскрывает решение, «Следующая»
 * подводит к следующему примеру.
 */
export function DemoKartochka({
  id,
  nomer,
  uslovie,
  illyustratsiya,
  razbor,
  sleduyushchaya,
}: DemoKartochkaProps) {
  const [otkryto, setOtkryto] = useState(true);

  function dalshe(): void {
    if (sleduyushchaya === undefined) {
      return;
    }
    document.getElementById(sleduyushchaya)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <Zadacha id={id}>
      <ZadachaShapka tip="Координатная прямая" znak="pryamaya">
        <span>Пример {nomer}</span>
      </ZadachaShapka>
      <ZadachaUslovie html={uslovie} illyustratsiya={illyustratsiya} />
      {otkryto ? <Reshenie razbor={razbor} /> : null}
      <ZadachaKnopki
        pokazat={{ otkryto, onClick: () => setOtkryto((was) => !was) }}
        dalshe={{ onClick: dalshe, disabled: sleduyushchaya === undefined }}
      />
    </Zadacha>
  );
}
