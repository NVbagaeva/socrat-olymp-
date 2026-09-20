import type { SkillItem } from '@/components/tasks/configurator';
import { Vizualizatsiya } from '@/components/tasks/card';
import { YARLYKI_REZHIMOV, type Rezhim, type Zadanie } from '@/content/veroyatnost';
import type { Pool } from '@/lib/veroyatnost/pool';
import { navykKind, navykiZadaniya } from './metody';

/**
 * Навыки тренажёра и генератора — методы, под которые в банке есть
 * задачи: у №4 пять методов рисунка, у №5 десять методов автора.
 * Карточка навыка собирается на сервере: название и номер метода из
 * каталога, число задач из банка, миниатюра — рисунок первого
 * варианта первого прототипа этого метода по его модели. У задачи
 * без рисунка карточка идёт без миниатюры.
 *
 * Метод без задач в банке карточки не получает: тренировать по нему
 * нечего.
 */
export function navykiMetodov(pool: Pool, zadanie: Zadanie): SkillItem[] {
  return navykiZadaniya(zadanie).flatMap((m): SkillItem[] => {
    const kinds = pool.kinds.filter((kind) => navykKind(kind, zadanie) === m.id);
    if (kinds.length === 0) {
      return [];
    }
    const model = kinds[0]?.variants[0]?.model;
    return [
      {
        id: m.id,
        title: m.nazvanie,
        code: `Метод ${m.nomer}`,
        count: kinds.reduce((sum, kind) => sum + kind.variants.length, 0),
        levels: [],
        chart:
          model === undefined || model.parametry.method === 'formula' ? null : (
            <span className="z4-skill-chart">
              <Vizualizatsiya parametry={model.parametry} />
            </span>
          ),
      },
    ];
  });
}

/**
 * Навыки генератора — прототипы банка: название, число вариантов и
 * миниатюра по модели первого варианта. У прототипа без рисунка
 * (метод «Формула») карточка идёт без миниатюры.
 */
export function navykiPrototipov(pool: Pool): SkillItem[] {
  return pool.kinds.map((kind): SkillItem => {
    const model = kind.variants[0]?.model;
    return {
      id: kind.id,
      title: kind.title,
      count: kind.variants.length,
      levels: [],
      chart:
        model === undefined || model.parametry.method === 'formula' ? null : (
          <span className="z4-skill-chart">
            <Vizualizatsiya parametry={model.parametry} />
          </span>
        ),
    };
  });
}

/** Ярлык к конфигуратору: адрес /trenazher/{id}/ и что в нём выбрано. */
export interface Yarlyk {
  id: string;
  title: string;
  skill: string | null;
  mode: Rezhim;
}

/**
 * Ярлыки тренажёра задания: по одному на метод с задачами, смешанная
 * тренировка и «Узнай метод». Из них собираются адреса страниц.
 */
export function yarlyki(pool: Pool, zadanie: Zadanie): Yarlyk[] {
  const poMetodam = navykiMetodov(pool, zadanie).map((skill): Yarlyk => ({
    id: skill.id,
    title: skill.title,
    skill: skill.id,
    mode: 'practice',
  }));
  return [...poMetodam, ...YARLYKI_REZHIMOV.map((item): Yarlyk => ({ ...item, skill: null }))];
}
