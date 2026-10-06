/**
 * Опорные задачи задания №2: по одной полностью разобранной задаче на
 * прототип плюс блок повышенной сложности (косинус с тремя знаками).
 *
 * Задачи зафиксированы seed «<id>#opornaya» и собираются тем же
 * генератором, что тренажёр и банк: условие, рисунок в режиме
 * подсказки (катеты — только здесь и в листе учителя) и разбор по
 * шагам с заголовками. Страница серверная, ответ на ней показан
 * намеренно — это разобранный образец, а не задача для проверки.
 * Модуль только серверный (node:fs — страховка от клиентского бандла).
 */

import fs from 'node:fs';
import { typeset } from '../tex';
import { generate, opornayaSeed } from './generate';
import { OPORNYE_KOSINUS_TRI_ZNAKA, POYASNENIE_TRI_ZNAKA } from './opornye-kosinus';
import { PROTOTYPES } from './prototypes';
import { renderVectorPlane } from './render';
import type { Generated, Gruppa } from './types';

export { opornayaSeed };

export interface ShagHtml {
  zagolovokHtml: string;
  strokiHtml: string[];
}

export interface OpornayaZadacha {
  prototype: string;
  gruppa: Gruppa;
  nazvanieHtml: string;
  uslovieHtml: string;
  /** Рисунок с катетами или null. */
  risunokSvg: string | null;
  shagi: ShagHtml[];
}

export function opornayaIz(task: Generated, gruppa: Gruppa, nazvanie: string): OpornayaZadacha {
  return {
    prototype: task.prototype,
    gruppa,
    nazvanieHtml: typeset(nazvanie),
    uslovieHtml: typeset(task.uslovie),
    risunokSvg: task.risunok === null ? null : renderVectorPlane({ ...task.risunok, hints: true }),
    shagi: task.shagi.map((s) => ({
      zagolovokHtml: typeset(s.zagolovok),
      strokiHtml: s.stroki.map((line) => typeset(line)),
    })),
  };
}

export interface OpornyePool {
  /** Девятнадцать задач по прототипам, в порядке каталога. */
  zadachi: OpornayaZadacha[];
  /** Блок повышенной сложности: пояснение и три задачи. */
  triZnaka: { poyasnenieHtml: string[]; zadachi: OpornayaZadacha[] };
}

export function opornyePool(): OpornyePool {
  if (!fs.existsSync(process.cwd())) {
    throw new Error('Пул опорных задач собирается только на сервере');
  }
  return {
    zadachi: PROTOTYPES.map((p) =>
      opornayaIz(generate(p.id, opornayaSeed(p.id)), p.gruppa, p.nazvanie),
    ),
    triZnaka: {
      poyasnenieHtml: POYASNENIE_TRI_ZNAKA.map((t) => typeset(t)),
      zadachi: OPORNYE_KOSINUS_TRI_ZNAKA.map((t, i) =>
        opornayaIz(t, 'C', `Косинус с тремя знаками, задача ${i + 1}`),
      ),
    },
  };
}
