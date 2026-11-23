'use client';

/**
 * «В домашку» для разделов: тренажёр (выбранные типы), блок опорных
 * задач №8 и №5, карточки, глава теории. Ответы и разборы открываются
 * только в момент нажатия — у учителя; генератор грузится тогда же.
 */

import { DZ2 } from '@/content/dz2';
import type { PrepSealed } from '@/lib/vychisleniya/prep/seal';
import type { PrepPoolZadacha } from '@/lib/veroyatnost/pool';
import type { ZadachaDz } from '@/lib/dz2/model';
import { zadachaOpornaya5, zadachaOpornaya8 } from '@/lib/dz2/zadachi';
import { nomerEgeRazdela } from '@/lib/zhurnal/vid';
import { VDomashku } from './VDomashku';

/** Тренажёр: выбранные типы (пусто — все), запас 10 задач, цель «решить все». */
export function VDomashkuTrenazher({
  taskNo,
  tipy,
  vse = false,
}: {
  taskNo: number;
  tipy: readonly string[];
  /** Выбраны все типы раздела — в названии «все типы». */
  vse?: boolean;
}) {
  const sorted = [...tipy].sort();
  return (
    <VDomashku
      taskNo={taskNo}
      klyuch={`trenazher:${taskNo}:${sorted.join(',')}`}
      element={() => ({
        key: `trenazher:${taskNo}:${sorted.join(',')}`,
        vid: 'trenazher',
        task_no: taskNo,
        title: DZ2.elementy.trenazher(nomerEgeRazdela(taskNo), vse ? 0 : sorted.length),
        spec: { tipy: sorted },
        tipy: sorted,
        zapas: 10,
        goal_kind: 'all',
      })}
    />
  );
}

/** Блок опорных №8: задачи с числами блока, ответ — генератором, разбор — тем же отпечатком. */
export function VDomashkuOpornye8({
  blockId,
  title,
  tasks,
}: {
  blockId: string;
  title: string;
  tasks: readonly PrepSealed[];
}) {
  return (
    <VDomashku
      taskNo={8}
      klyuch={`opornye:8:${blockId}`}
      element={async () => {
        const [{ generatePrep }, { openText }] = await Promise.all([
          import('@/lib/vychisleniya/prep/generate'),
          import('@/lib/vychisleniya/secret'),
        ]);
        /* Задачи с выбором варианта ответа в ДЗ не идут: база сверяет число. */
        const zadachi = tasks
          .filter((t) => t.answerType === 'number')
          .map((t) => {
            let razbor = null;
            try {
              razbor = JSON.parse(openText(t.razbor, t.seal)) as { shagi: { chto: string; tex: string }[] };
            } catch {
              razbor = null;
            }
            return zadachaOpornaya8(t, generatePrep(t.id, t.seed).otvet, razbor);
          })
          .filter((z): z is ZadachaDz => z !== null);
        if (zadachi.length === 0) throw new Error('pusto');
        return {
          key: `opornye:8:${blockId}`,
          vid: 'opornye',
          task_no: 8,
          title: DZ2.elementy.opornye(nomerEgeRazdela(8), title),
          spec: { blok: blockId },
          tasks: zadachi,
        };
      }}
    />
  );
}

/** Блок опорных №5: задачи банка, ответ и шаги — из закрытого разбора. */
export function VDomashkuOpornye5({
  blok,
  nazvanie,
  zadachi,
}: {
  blok: string;
  nazvanie: string;
  zadachi: readonly PrepPoolZadacha[];
}) {
  return (
    <VDomashku
      taskNo={5}
      klyuch={`opornye:5:${blok}`}
      element={async () => {
        const [{ otkrytRazbor }, { typeset, typesetText }] = await Promise.all([
          import('@/lib/veroyatnost/razbor'),
          import('@/lib/tex'),
        ]);
        const nabor = { tekst: typesetText, formula: (tex: string) => typeset(`$${tex}$`) };
        const tasks = zadachi
          .map((z) => {
            try {
              return zadachaOpornaya5(z, otkrytRazbor(z.steps, z.seal), nabor);
            } catch {
              return null;
            }
          })
          .filter((z): z is ZadachaDz => z !== null);
        if (tasks.length === 0) throw new Error('pusto');
        return {
          key: `opornye:5:${blok}`,
          vid: 'opornye',
          task_no: 5,
          title: DZ2.elementy.opornye(nomerEgeRazdela(5), nazvanie),
          spec: { blok },
          tasks,
        };
      }}
    />
  );
}

/** Карточки раздела: пройти весь набор. */
export function VDomashkuKartochki({ taskNo, kartochek }: { taskNo: number; kartochek: number }) {
  return (
    <VDomashku
      taskNo={taskNo}
      klyuch={`kartochki:${taskNo}`}
      element={() => ({
        key: `kartochki:${taskNo}`,
        vid: 'kartochki',
        task_no: taskNo,
        title: DZ2.elementy.kartochki(nomerEgeRazdela(taskNo), kartochek),
        spec: { kartochek },
      })}
    />
  );
}

/** Глава теории: отметка «прочитано». */
export function VDomashkuTeoriya({ taskNo, glava, nazvanie }: { taskNo: number; glava: string; nazvanie: string }) {
  return (
    <VDomashku
      taskNo={taskNo}
      klyuch={`teoriya:${taskNo}:${glava}`}
      element={() => ({
        key: `teoriya:${taskNo}:${glava}`,
        vid: 'teoriya',
        task_no: taskNo,
        title: DZ2.elementy.teoriya(nomerEgeRazdela(taskNo), nazvanie),
        spec: { glava },
      })}
    />
  );
}
