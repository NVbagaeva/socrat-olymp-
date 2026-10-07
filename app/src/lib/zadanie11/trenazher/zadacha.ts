/**
 * Задача тренажёра №11 в закрытом виде — собирается в браузере.
 *
 * Условие задачи банка приходит без ответа (номер, подтип,
 * параметры); новая задача — подтип и seed. Решение считает движок
 * подтипа здесь же, ответ тут же закрывается отпечатком: в состояние
 * экрана уходят условие, отпечаток и два закрытых блока — подсказки
 * с таблицей модели и разбор по этапам. Числа ответа нигде нет.
 *
 * Модуль тяжёлый (движок всех подтипов и KaTeX), поэтому экран
 * тренажёра подгружает его только по кнопке «Начать тренировку».
 */

import { typesetKrupno as typeset } from '../../tex';
import { generateBez, pohozhaNa, type Pohozha } from '../gen/core';
import { strokaHtml } from '../proporciya/html';
import { subtype } from '../prototypes';
import { sealAnswer, sealChoice, sealText } from '../secret';
import type { Level, LifehackId, SectionId, Solved, Tablitsa } from '../types';
import type { MikroVybor } from '../prep/types';
import type { ShagHtml } from '../prep/seal';
import { klyuchZadachi, type UslovieBanka, type ZadachaPlan } from './sessiya';

export interface Zadacha11 {
  /** Ключ: подтип и откуда задача (ДП-07 из банка №… или seed). */
  key: string;
  id: string;
  vid: ZadachaPlan['vid'];
  section: SectionId;
  level: Level;
  title: string;
  uslovieHtml: string;
  answerType: 'number' | 'choice';
  vybory: MikroVybor[] | null;
  seal: string;
  /** Подсказки и таблица модели: JSON Podskazki11, закрыт отпечатком. */
  podskazki: string;
  /** Разбор по этапам с таблицами: JSON Razbor11, закрыт отпечатком. */
  razbor: string;
  lifehacks: LifehackId[];
}

export interface Podskazki11 {
  shagi: ShagHtml[];
  tables: Tablitsa[];
}

export interface Razbor11 {
  etapy: { title: string; stroki: string[] }[];
  tables: Tablitsa[];
}

/** Решение задачи плана: банк — по параметрам, новая — генератором. */
function reshit(plan: ZadachaPlan, bank: readonly UslovieBanka[], pohozha: Pohozha): Solved {
  if (plan.vid === 'new') {
    return generateBez(plan.id, plan.seed, pohozha).solved;
  }
  const b = bank.find((item) => item.no === plan.no);
  if (b === undefined) {
    throw new Error(`Нет задачи банка №${plan.no}`);
  }
  return subtype(b.id).solve(b.params);
}

/* Проверка похожести строится по банку один раз. */
let pamyat: { bank: readonly UslovieBanka[]; pohozha: Pohozha } | null = null;
function pohozhaDlya(bank: readonly UslovieBanka[]): Pohozha {
  if (pamyat?.bank !== bank) {
    pamyat = { bank, pohozha: pohozhaNa(bank) };
  }
  return pamyat.pohozha;
}

/** Решение задачи плана целиком — для листа учителя (lib/zadanie11/sheet11.ts). */
export function reshitPlan(plan: ZadachaPlan, bank: readonly UslovieBanka[]): Solved {
  return reshit(plan, bank, pohozhaDlya(bank));
}

export function sobratZadachu(plan: ZadachaPlan, bank: readonly UslovieBanka[]): Zadacha11 {
  const st = subtype(plan.id);
  const s = reshit(plan, bank, pohozhaDlya(bank));
  /* У аналога условие написано вручную; решение — то же solve. */
  const analog = plan.vid === 'new' ? undefined : bank.find((b) => b.no === plan.no)?.analog;
  const choice = s.vybor !== undefined;
  const seal = choice ? sealChoice(String((s.vybor?.correct ?? 0) + 1)) : sealAnswer(s.answer);
  const podskazki: Podskazki11 = {
    shagi: s.hints.map((h) => ({
      question: typeset(h.question),
      options: h.options.map((o) => typeset(o)),
      correct: h.correct,
      comment: h.comment === undefined ? null : typeset(h.comment),
    })),
    tables: s.tables ?? [],
  };
  const razbor: Razbor11 = {
    etapy: s.etapy.map((e) => ({
      title: typeset(e.title),
      stroki: e.lines.map((line) => strokaHtml(line, { typeset })),
    })),
    tables: s.tables ?? [],
  };
  return {
    key: klyuchZadachi(plan),
    id: plan.id,
    vid: plan.vid,
    section: st.section,
    level: st.level,
    title: st.title,
    uslovieHtml: typeset(analog?.tekst ?? s.uslovie),
    answerType: choice ? 'choice' : 'number',
    vybory: choice
      ? (s.vybor?.options ?? []).map((o, i) => ({ number: String(i + 1), label: typeset(o) }))
      : null,
    seal,
    podskazki: sealText(JSON.stringify(podskazki), seal),
    razbor: sealText(JSON.stringify(razbor), seal),
    lifehacks: s.lifehacks,
  };
}
