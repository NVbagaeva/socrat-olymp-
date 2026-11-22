/**
 * Перенесённые задачи тренажёра №18: 18 задач, составленных для сайта в
 * формате задания 18, по три набора чисел. Здесь они становятся типами
 * банка (TipZadachi18); чертёж —
 * lib/zadanie18/trenazher/dop, проверка — scripts/verify_schemes/trenazherDop
 * (pnpm test:trenazher-18): ответ б) пересчитан по данным в координатах
 * без кода сайта, утверждение а) — на 1000 случайных фигурах.
 *
 * Подсказка — вопросы «какая схема здесь»: верный вариант — схема из
 * «Какие схемы здесь», два других — схемы, которых в задаче нет; после
 * ответа — чем схема помогает, в конце — наводящая мысль задачи.
 */

import type { ShagVoprosa } from '@/components/trenazher/ShagiVoprosy';
import { SOBRANNYE } from '../spisok';
import type { TipZadachi18 } from '../trenazher';
import {
  KS18_DVE_KASATELNYE,
  KS18_OTREZKI,
  KS18_PRYAM_TRAP,
  KS18_VNUTR_KASANIE,
} from './kasatelnye';
import { OK18_BRAHMAGUPTA, OK18_ORTOCENTR, OK18_SEKUSHCHIE } from './okruzhnost';
import { OT18_CHEVA, OT18_MEDIANY, OT18_MENELAY, OT18_PARALLELOGRAMM } from './otnosheniya';
import { PL18_BISSEKTRISA, PL18_OBSHCHAYA_VYSOTA } from './ploshchadi';
import { poNaboru, type ZadachaDop18 } from './tipy';
import { TP18_BABOCHKA, TP18_RAVNOBOKAYA, TP18_UGOL_90 } from './trapeciya';
import { TR18_INCENTR, TR18_SREDLIN } from './treugolnik';

export const ZADACHI_DOP_18: readonly ZadachaDop18[] = [
  TR18_SREDLIN,
  TR18_INCENTR,
  OK18_ORTOCENTR,
  OK18_SEKUSHCHIE,
  OK18_BRAHMAGUPTA,
  KS18_OTREZKI,
  KS18_DVE_KASATELNYE,
  KS18_VNUTR_KASANIE,
  KS18_PRYAM_TRAP,
  TP18_RAVNOBOKAYA,
  TP18_BABOCHKA,
  TP18_UGOL_90,
  OT18_MEDIANY,
  OT18_MENELAY,
  OT18_CHEVA,
  OT18_PARALLELOGRAMM,
  PL18_OBSHCHAYA_VYSOTA,
  PL18_BISSEKTRISA,
];

/** Строка → неотрицательное целое: выбор неверных вариантов подсказки не меняется от сборки к сборке. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

/** Предложение с заглавной буквы и точкой в конце. */
function predlozhenie(s: string): string {
  const t = s.charAt(0).toUpperCase() + s.slice(1);
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/**
 * Две схемы, которых в задаче нет: сначала из группы верной схемы
 * (их легче спутать), потом из остальных.
 */
function chuzhie(z: ZadachaDop18, verna: string, zerno: string): string[] {
  const svoi = new Set(z.skhemy.map((s) => s.id));
  const gruppa = SOBRANNYE.find((s) => s.id === verna)?.gruppa;
  const kandidaty = SOBRANNYE.filter((s) => !svoi.has(s.id));
  const blizkie = kandidaty.filter((s) => s.gruppa === gruppa);
  const dalnie = kandidaty.filter((s) => s.gruppa !== gruppa);
  const h = hash(zerno);
  const pervaya = blizkie.length > 0 ? blizkie[h % blizkie.length]! : dalnie[h % dalnie.length]!;
  const ostalnye = kandidaty.filter((s) => s.id !== pervaya.id);
  const vtoraya = ostalnye[(h >>> 8) % ostalnye.length]!;
  return [pervaya.nazvanie, vtoraya.nazvanie];
}

function podskazka(z: ZadachaDop18): ShagVoprosa[] {
  return z.skhemy.map((s, i) => {
    const nazvanie = SOBRANNYE.find((x) => x.id === s.id)?.nazvanie ?? s.id;
    const posledniy = i === z.skhemy.length - 1;
    return {
      question: i === 0 ? 'Какая ключевая схема здесь?' : 'Какая схема понадобится ещё?',
      options: [nazvanie, ...chuzhie(z, s.id, `${z.id}/${i}`)],
      correct: 0,
      comment: predlozhenie(s.zachem) + (posledniy ? ` ${z.podskazka}` : ''),
    };
  });
}

export const TIPY_DOP_18: readonly TipZadachi18[] = ZADACHI_DOP_18.map((z) => ({
  id: z.id,
  nazvanie: z.nazvanie,
  skhema: z.skhemy[0]!.id,
  uroven: z.uroven,
  varianty: z.varianty,
  tekst: (p) => ({
    uslovie: poNaboru(z.uslovie, p),
    a: poNaboru(z.a, p),
    b: poNaboru(z.b, p),
  }),
  otvet: (p) => poNaboru(z.otvet, p),
  podskazka: () => podskazka(z),
  reshenieA: (p) => [...poNaboru(z.dokazatelstvo, p)],
  reshenieB: (p) => [...poNaboru(z.reshenieB, p)],
}));
