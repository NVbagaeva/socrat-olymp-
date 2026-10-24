/**
 * Ответы экрана решения ↔ ответы выданной работы. Экран хранит ответы
 * по индексу задания (часть 1) и по ключу пункта (часть 2), работа —
 * по номеру задания и пункту. Здесь — перевод в обе стороны: чтобы
 * открыть работу на другом устройстве с теми же ответами и чтобы
 * отправлять на сервер только изменившееся.
 */

import { kriteriiZadaniya } from '@/content/variantOnline/kriterii';
import type { Part2No } from '@/content/variantOnline/bally';
import { pustoyChast2, punktKey, readVvod, type Chast2Ui } from '@/lib/chast2/sostoyanie';
import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';
import { readSamo, SAMO } from './localApi';
import type { Answer } from './types';

export interface Zapis {
  taskNo: number;
  punkt: string;
  vvod: unknown;
}

/** Ответы работы → состояние экрана. */
export function izRaboty(
  tasks: readonly { egeNumber: number }[],
  answers: readonly Answer[],
): { answers: Record<number, string>; chast2: Chast2Ui } {
  const out: Record<number, string> = {};
  const c2 = pustoyChast2();
  for (const a of answers) {
    if (a.taskNo <= 13) {
      const i = tasks.findIndex((t) => t.egeNumber === a.taskNo);
      if (i >= 0 && a.punkt === '' && typeof a.vvod === 'string') out[i] = a.vvod;
    } else if (a.punkt === SAMO) {
      const s = readSamo(a.vvod);
      const no = a.taskNo as Part2No;
      if (s !== null) {
        c2.ball[no] = s.ball;
        if (s.ili !== null) c2.stroka[no] = `${s.ball}:${s.ili}`;
        c2.reshenie.push(no);
      }
    } else if (/^\d$/.test(a.punkt)) {
      c2.vvod[`${a.taskNo}.${a.punkt}`] = readVvod(a.vvod);
    }
  }
  return { answers: out, chast2: c2 };
}

/** Что должно лежать в работе по состоянию экрана: ключ «задание|пункт». */
export function vRabotu(
  tasks: readonly { egeNumber: number }[],
  part2: readonly Chast2Zadacha[],
  answers: Readonly<Record<number, string>>,
  chast2: Chast2Ui,
  samo: boolean,
): Map<string, Zapis> {
  const out = new Map<string, Zapis>();
  tasks.forEach((t, i) => {
    const v = answers[i];
    if (v !== undefined) out.set(`${t.egeNumber}|`, { taskNo: t.egeNumber, punkt: '', vvod: v });
  });
  for (const z of part2) {
    z.punkty.forEach((p, i) => {
      const v = chast2.vvod[punktKey(z.no, i)];
      if (p.pole !== null && v !== undefined) {
        out.set(`${z.no}|${i}`, { taskNo: z.no, punkt: String(i), vvod: v });
      }
    });
    const ball = chast2.ball[z.no];
    if (samo && ball !== undefined) {
      const stroka = chast2.stroka[z.no];
      const ili = stroka === undefined ? null : Number(stroka.split(':')[1]);
      const kriteriy = kriteriiZadaniya(z.no).findIndex((k) => k.ball === ball);
      out.set(`${z.no}|${SAMO}`, {
        taskNo: z.no,
        punkt: SAMO,
        vvod: { ball, kriteriy: kriteriy < 0 ? null : kriteriy, ili },
      });
    }
  }
  return out;
}

/** Изменившиеся записи: сравнение по JSON с последним сохранённым. */
export function izmeneniya(
  hochu: ReadonlyMap<string, Zapis>,
  sohraneno: ReadonlyMap<string, string>,
): Zapis[] {
  const out: Zapis[] = [];
  for (const [k, z] of hochu) {
    if (sohraneno.get(k) !== JSON.stringify(z.vvod)) out.push(z);
  }
  return out;
}

export function otpechatok(z: ReadonlyMap<string, Zapis>): Map<string, string> {
  return new Map([...z].map(([k, v]) => [k, JSON.stringify(v.vvod)]));
}
