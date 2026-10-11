/**
 * Микрозадача опорных задач №9 в закрытом виде: то, что уходит на экран.
 *
 * Модуль изоморфный: на сборке им запечатываются зафиксированные
 * варианты, в браузере — свежие по кнопке «Ещё вариант». Условие
 * и рисунок условия открыты; разбор, подсказка-лесенка (в её итогах
 * есть ответ) и рисунки с построениями закрыты отпечатком ответа и
 * открываются только по просьбе ученика.
 */

import { typeset } from '../../tex';
import { sealAnswer, sealChoice, sealText } from '../secret';
import { renderFigura } from '../render';
import { generatePrepById } from './generate';
import type { PrepMicro } from './types';

export interface PrepVariantHtml {
  html: string;
  verno: boolean;
  pochemuHtml: string;
}

export interface PrepVoprosHtml {
  voprosHtml: string;
  knopki: PrepVariantHtml[];
  itogHtml: string;
  /** С какого шага показывать построения: ключ в PrepZakryto.risunki. */
  shag: number;
}

/** То, что открывается по кнопкам «Подсказка» и «Показать решение». */
export interface PrepZakryto {
  razborHtml: string[];
  /** Рисунок с построениями (режим учителя); null — у задачи нет рисунка. */
  risunokRazbora: string | null;
  podskazka: PrepVoprosHtml[];
  /** Рисунки подсказки по шагам: ключ — номер шага. */
  risunkiPodskazki: Record<string, string>;
}

export interface PrepSealed {
  id: string;
  seed: string;
  nazvanie: string;
  uslovieHtml: string;
  /** Рисунок условия (режим ученика); null — рисунка нет. */
  risunokSvg: string | null;
  answerType: 'number' | 'choice';
  /** Варианты кнопок: набранные подписи. У числового ответа — null. */
  knopki: string[] | null;
  /** Отпечаток ответа. */
  seal: string;
  /** JSON PrepZakryto, закрытый отпечатком. */
  zakryto: string;
}

export function sealPrep(micro: PrepMicro, seed: string): PrepSealed {
  const task = generatePrepById(micro.id, seed);
  const seal =
    micro.answerType === 'choice' ? sealChoice(String(task.otvet)) : sealAnswer(task.otvet);
  const fig = task.risunok;
  const risunki: Record<string, string> = {};
  if (fig !== null) {
    for (const q of task.podskazka) {
      const s = q.shag ?? 0;
      if (risunki[String(s)] === undefined) {
        risunki[String(s)] = renderFigura(fig, { rezhim: 'hint', shag: s });
      }
    }
  }
  const zakryto: PrepZakryto = {
    razborHtml: task.razbor.map((line) => typeset(line)),
    risunokRazbora: fig === null ? null : renderFigura(fig, { rezhim: 'teacher' }),
    podskazka: task.podskazka.map((q) => ({
      voprosHtml: typeset(q.vopros),
      itogHtml: typeset(q.itog ?? ''),
      shag: q.shag ?? 0,
      knopki: q.knopki.map((v) => ({
        html: typeset(v.tekst),
        verno: v.verno,
        pochemuHtml: typeset(v.pochemu ?? ''),
      })),
    })),
    risunkiPodskazki: risunki,
  };
  return {
    id: micro.id,
    seed,
    nazvanie: micro.nazvanie,
    uslovieHtml: typeset(task.uslovie),
    risunokSvg: fig === null ? null : renderFigura(fig, { rezhim: 'student' }),
    answerType: micro.answerType,
    knopki: task.knopki === undefined ? null : task.knopki.map((v) => typeset(v)),
    seal,
    zakryto: sealText(JSON.stringify(zakryto), seal),
  };
}
