/**
 * Страница блока и файлы закрытой части №13 — на сборке (zakrytoe.ts).
 * Версия файла — отпечаток его содержимого: задачи банка собираются
 * детерминированно, поэтому страница и файл сходятся.
 */

import { fingerprint } from '@/lib/secret';
import { prepPool13, type PoolBlok13 } from './pool';
import { putZakrytogo13, type Zadacha13Bloka, type Zakrytoe13 } from './zakrytoe';

let kesh: PoolBlok13[] | null = null;

/** Пул блоков считается один раз на процесс: его зовут страница и каждый файл. */
export function pool13(): PoolBlok13[] {
  kesh ??= prepPool13();
  return kesh;
}

function zakrytoeZadachi(task: Zakrytoe13): Zakrytoe13 {
  return { podskazki: task.podskazki, razbor: task.razbor };
}

/** Задачи блока для страницы: без разбора и подсказок, с адресом их файла. */
export function zadachiStranitsy13(blok: PoolBlok13): Zadacha13Bloka[] {
  return blok.zadachi.map((task) => {
    const v = fingerprint('z13-op:', JSON.stringify(zakrytoeZadachi(task))).slice(0, 10);
    return {
      ...task,
      podskazki: '',
      razbor: '',
      zakryto: `${putZakrytogo13(blok.slug, task.no)}?v=${v}`,
    };
  });
}

export interface ParametryFayla13 {
  blok: string;
  fail: string;
}

export function vseFayly13(): ParametryFayla13[] {
  return pool13().flatMap((b) => b.zadachi.map((t) => ({ blok: b.slug, fail: `${t.no}.json` })));
}

export async function otvetFayla13(params: Promise<ParametryFayla13>): Promise<Response> {
  const { blok, fail } = await params;
  const m = /^(\d+)\.json$/.exec(fail);
  const task =
    m === null
      ? undefined
      : pool13()
          .find((b) => b.slug === blok)
          ?.zadachi.find((t) => t.no === Number(m[1]));
  return task === undefined
    ? new Response('нет такой задачи', { status: 404 })
    : Response.json(zakrytoeZadachi(task));
}
