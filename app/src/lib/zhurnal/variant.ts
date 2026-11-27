'use client';

/**
 * Вариант в журнале решения задач (docs/kabinet-zhurnal.md): «Собрать
 * вариант», серии, «Варианты повышенной сложности», работа от учителя.
 *
 * Пишется при завершении: сам вариант (дата, первичный и тестовый балл,
 * время) и каждая задача — ответ ученика, верный ответ, время, подсказки.
 * Задачи — только разделов журнала (флаг). Вариант пишется, если в нём
 * есть хоть одна задача раздела журнала: в пробный период на №5 и №8
 * учитель видит варианты с ними — баллы целиком, разбор по задачам этих
 * разделов.
 */

import { MAX_BALL } from '@/content/variantOnline/bally';
import { punktKey, vvodEst, vvodTex, type Chast2Ui } from '@/lib/chast2/sostoyanie';
import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';
import { urovenZadachi } from '@/lib/zhurnal/uroven';
import type { ZapisChast2, ZapisVarianta, ZapisZadachi } from './model';
import { idIz, novayaZapis, sPopytkoy, sShagomPodskazki, zakryta } from './model';
import { zapisatVariant, zapisatZadachu } from './ochered';
import { pishetsya } from './zapis';

export interface ZadachaVarianta {
  /** Номер хранения раздела. */
  taskNo: number;
  taskId: string;
  prototypeId: string;
}

export interface ResheniyeVarianta {
  code: string;
  variant: number;
  mode: 'trening' | 'kontrol';
  title: string;
  source: ZapisVarianta['source'];
  tasks: readonly ZadachaVarianta[];
  /** Первая попытка (в контрольной — единственный ответ) и вторая попытка тренировки. */
  answers: Readonly<Record<number, string>>;
  second: Readonly<Record<number, string>>;
  v1: Readonly<Record<number, 'right' | 'wrong'>>;
  v2: Readonly<Record<number, 'right' | 'wrong'>>;
  hinted: readonly number[];
  steps: Readonly<Record<number, number>>;
  /** Активное время на задание, мс. */
  times: Readonly<Record<number, number>>;
  /** Итог проверки: верно ли (первая попытка) и верные ответы. */
  right: readonly boolean[];
  key: readonly string[];
  primary: number;
  max: number;
  test: number | null;
  startedAt: number;
  finishedAt: number;
  /** Активное время всей работы, с. */
  seconds: number;
}

/** Сложность задачи варианта (решение В-7, lib/zhurnal/uroven.ts). */
function uroven(t: ZadachaVarianta): 1 | 2 | 3 {
  return urovenZadachi(t.taskNo, t.taskId.endsWith('|advanced'));
}

/** Записи журнала по варианту: чистая функция (проверка — scripts/check-zhurnal.mjs). */
export function zapisiVarianta(r: ResheniyeVarianta): {
  variant: ZapisVarianta;
  zadachi: ZapisZadachi[];
} {
  const variantId = idIz(`variant|${r.code}|${r.variant}|${r.mode}|${r.startedAt}`);
  const variant: ZapisVarianta = {
    id: variantId,
    source: r.source,
    set_code: r.code.slice(0, 200),
    variant_no: r.variant,
    title: r.title.slice(0, 120),
    started_at: new Date(r.startedAt).toISOString(),
    finished_at: new Date(r.finishedAt).toISOString(),
    primary_score: r.primary,
    max_score: r.max,
    ...(r.test === null ? {} : { test_score: r.test }),
    active_ms: Math.round(r.seconds * 1000),
    total_ms: Math.max(Math.round(r.seconds * 1000), r.finishedAt - r.startedAt),
  };
  const zadachi = r.tasks.map((t, i) => {
    let z = novayaZapis(
      {
        id: idIz(`${variantId}|${i}`),
        task_no: t.taskNo,
        kind: t.prototypeId,
        task_ref: t.taskId,
        place: 'variant',
        place_ref: variantId,
        level: uroven(t),
      },
      r.startedAt,
    );
    const first = r.answers[i] ?? '';
    const ok1 =
      r.mode === 'trening' && r.v1[i] !== undefined ? r.v1[i] === 'right' : r.right[i] === true;
    if (r.hinted.includes(i)) z = sShagomPodskazki(z, Math.max(1, r.steps[i] ?? 1));
    if (first !== '') z = sPopytkoy(z, first, ok1, 'answer', r.finishedAt);
    const vtoraya = r.second[i] ?? '';
    if (vtoraya !== '') z = sPopytkoy(z, vtoraya, r.v2[i] === 'right', 'answer', r.finishedAt);
    const ms = Math.round(r.times[i] ?? 0);
    z = { ...z, active_ms: ms, total_ms: ms };
    const iskhod =
      first === '' ? 'skipped' : ok1 ? (r.hinted.includes(i) ? 'hinted' : 'right') : 'wrong';
    return zakryta(z, iskhod, r.finishedAt, r.key[i]);
  });
  return { variant, zadachi };
}

/** Записать решённый вариант: ученику, который вошёл, при флаге журнала. */
export function zapisatResheniyeVarianta(r: ResheniyeVarianta): void {
  if (typeof window === 'undefined' || !r.tasks.some((t) => pishetsya(t.taskNo))) {
    /* Ни одного раздела журнала в варианте: в пробный период (№5, №8) такие
       варианты не пишутся вовсе, иначе учитель увидел бы пустой вариант. */
    return;
  }
  const { variant, zadachi } = zapisiVarianta(r);
  zapisatVariant(variant);
  for (const z of zadachi) zapisatZadachu(z);
}

/* ── Часть 2: самопроверка ученика ─────────────────────────────── */

/**
 * Часть 2 варианта для журнала: по каждому заданию — ответ по пунктам,
 * итог «Сверить ответ», открыто ли решение и балл по критериям.
 * Чистая функция (проверка — scripts/check-zhurnal.mjs).
 */
export function zapisiChast2(zadachi: readonly Chast2Zadacha[], st: Chast2Ui): ZapisChast2[] {
  return zadachi.map((z) => {
    const kuski: string[] = [];
    const sverki: string[] = [];
    z.punkty.forEach((p, i) => {
      const key = punktKey(z.no, i);
      const s = st.sverka[key];
      if (s !== undefined) sverki.push(s);
      if (p.pole === null) return;
      const vvod = st.vvod[key] ?? null;
      if (!vvodEst(vvod)) return;
      const tex = vvodTex(p.pole, vvod);
      if (tex !== '') kuski.push(p.bukva === null ? tex : `\\text{${p.bukva})}\\ ${tex}`);
    });
    const sverka = sverki.includes('ne-sovpadaet')
      ? 'ne-sovpadaet'
      : sverki.includes('uchitel')
        ? 'uchitel'
        : sverki.length > 0
          ? 'sovpadaet'
          : undefined;
    const ball = st.ball[z.no];
    return {
      no: z.no,
      shablon: z.shablon.slice(0, 80),
      ...(kuski.length === 0 ? {} : { otvet: kuski.join(';\\ ').slice(0, 300) }),
      verno: z.otvet.slice(0, 300),
      ...(sverka === undefined ? {} : { sverka }),
      ...(st.reshenie.includes(z.no) ? { reshenie: true } : {}),
      ...(ball === undefined ? {} : { ball: Math.min(ball, MAX_BALL[z.no]) }),
      max: MAX_BALL[z.no],
    };
  });
}

/**
 * Дописать к уже записанному варианту часть 2. Вызывается после итогов
 * части 1 и при каждой правке самопроверки: в очереди и в базе остаётся
 * последняя. Варианты, которые не пишутся (нет разделов журнала), — нет.
 */
export function zapisatChast2Varianta(r: ResheniyeVarianta, chast2: ZapisChast2[]): void {
  if (typeof window === 'undefined' || chast2.length === 0 || !r.tasks.some((t) => pishetsya(t.taskNo))) return;
  zapisatVariant({ ...zapisiVarianta(r).variant, chast2 });
}
