'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import { ikonkiTem } from '@/components/generator/IkonkiTem';
import { config8, engine8 } from '@/lib/vychisleniya/generator8';
import { IssueHomeworkGenerator8 } from '@/components/dz/Razdel8Dz';

/**
 * Вкладка «Генератор» задания №8: общий генератор (components/generator/)
 * с конфигом и движком №8 (lib/vychisleniya/generator8.ts). Задачи
 * считает движок в браузере.
 */
export function Generator8({ base }: { base: string }) {
  const config = useMemo(() => config8(base), [base]);
  const engine = useMemo(() => engine8(config, base), [config, base]);
  /* Значки тем — рисунки в стеклянном круге, как у тел №3. */
  const icons = useMemo(() => ikonkiTem('8', config.topics), [config]);
  return (
    <>
      <Generator config={config} engine={engine} icons={icons} />
      {/* Репетитору со входом: выбранные типы — домашним заданием. */}
      <IssueHomeworkGenerator8 />
    </>
  );
}
