import type { Subtopic } from '@/content/sections';
import { VKLADKA_PARAM, type IkonkaRazdela } from '@/components/tasks/razdely/types';
import { config12 } from '@/lib/ves12/generator12';
import { Generator12Lazy } from './Generator12Lazy';

export interface GeneratorTabProps {
  subtopic: Subtopic;
  /** Адрес подтемы: от него считаются адреса страниц печати. */
  base: string;
  /** Иконка раздела для строки темы. */
  icon?: IkonkaRazdela | undefined;
}

/**
 * Вкладка «Генератор» подтемы №12, собранная на сервере: конфиг общего
 * генератора с одним типом функций. В браузер уходят только названия и
 * числа; сам генератор грузится, когда вкладка открыта, а движок graph/ —
 * при сборке листа.
 */
export function GeneratorTab({ subtopic, base, icon }: GeneratorTabProps) {
  const config = config12(base, { tip: subtopic.id, title: subtopic.title });
  return (
    <Generator12Lazy
      config={config}
      base={base}
      ekran={`${base}/?${VKLADKA_PARAM}=generator&`}
      ikonki={{ [subtopic.id]: icon }}
    />
  );
}
