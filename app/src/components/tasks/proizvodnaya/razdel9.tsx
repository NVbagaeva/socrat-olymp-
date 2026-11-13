'use client';

import { useMemo } from 'react';
import type { RazdelBanka, SostoyaniePod } from '../trening/bank/types';
import { TRENAZHER9 } from '@/content/proizvodnaya9';
import { zadachaHref9 } from '@/lib/proizvodnaya/links';
import { readSealed9 } from '@/lib/proizvodnaya/trening/otvet9';
import { log9, vybor9 } from '@/lib/proizvodnaya/trening/progress';
import { KLYUCH9, razobratZapis9 } from '@/lib/proizvodnaya/trening/session';
import {
  ZAGRUZKA9,
  risovat9,
  type Reshenie9,
  type Zadacha9,
} from '@/lib/proizvodnaya/trening/zagruzka';
import { FiguraSvg9 } from './FiguraSvg9';
import { shagiIz9, voprosy9 } from './shagi9';

const T = TRENAZHER9;

/**
 * Чертёж условия №9 — как у прежнего тренажёра: пока задача решается —
 * без построений; с открытой подсказкой достраивается по вопросам
 * (каждый верный ответ открывает следующее построение); когда задача
 * закрыта — все построения. В режиме без подсказок построений нет до
 * итогов.
 */
function Chertezh9({ z, ui }: { z: Zadacha9; ui: SostoyaniePod }) {
  const { risunok, shagiRisunka } = z;
  const rezhim =
    ui.bezPodskazok || (!ui.zakryta && !ui.podskazka) ? 'student' : ui.zakryta ? 'teacher' : 'hint';
  const shag =
    rezhim !== 'hint'
      ? undefined
      : ui.shag - 1 >= shagiRisunka.length
        ? Number.POSITIVE_INFINITY
        : (shagiRisunka[Math.max(0, ui.shag - 1)] ?? 0);
  const svg = useMemo(
    () =>
      risunok === null ? '' : risovat9(risunok, shag === undefined ? { rezhim } : { rezhim, shag }),
    [risunok, rezhim, shag],
  );
  if (svg === '') {
    return null;
  }
  return (
    <div className="trn-risunok trn-risunok--z9">
      <FiguraSvg9 svg={svg} label={T.ekran.risunok} />
    </div>
  );
}

/**
 * №9 для общего тренажёра по банку (components/tasks/trening/bank):
 * ключи задач, хранилища, генератор в браузере вместо файлов задач,
 * проверка ответа по отпечатку, чертёж, который достраивается по
 * подсказке, решение шагами и подсказка-вопросы с пояснениями неверных
 * кнопок. Источника задач нет — все задачи строит генератор.
 */
export const RAZDEL9: RazdelBanka<Zadacha9, Reshenie9> = {
  razdel: '9',
  klyuch: KLYUCH9,
  log: log9,
  vybor: vybor9,
  zagruzka: ZAGRUZKA9,
  T,
  proverit: readSealed9,
  pod: (z, ui) => <Chertezh9 z={z} ui={ui} />,
  shagi: (s) => shagiIz9(s.shagi),
  voprosy: (s) => voprosy9(s.podskazka),
  zadachaHref: zadachaHref9,
  bezIstochnika: true,
  razobrat: razobratZapis9,
};
