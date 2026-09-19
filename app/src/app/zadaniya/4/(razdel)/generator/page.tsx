import type { Metadata } from 'next';
import { GeneratorScreen } from '@/components/tasks/generator/GeneratorScreen';
import type { SkillItem } from '@/components/tasks/configurator';
import { Vizualizatsiya } from '@/components/tasks/card';
import { tasksPage } from '@/content/tasks';
import { veroyatnostBySlug, veroyatnostTitle } from '@/content/veroyatnost';
import { bank4Pool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', 'Генератор'),
};

/**
 * Вкладка «Генератор» задания №4: вариант для печати.
 *
 * Экран — тот же GeneratorScreen, что у задания №12, без правок.
 * Навыки здесь — прототипы банка №4: название, число вариантов и
 * миниатюра — рисунок первого варианта по его модели, собранный на
 * сервере. Уровней сложности у прототипов нет, и этот шаг экран
 * прячет сам. Кнопки ведут на страницы печати раздела: там лист
 * собирается из тех же прототипов по параметрам адреса.
 */
export default function Generator4Tab() {
  const section = veroyatnostBySlug('4');
  const pool = bank4Pool();
  const skills: SkillItem[] = pool.kinds.map((kind) => {
    const model = kind.variants[0]?.model;
    return {
      id: kind.id,
      title: kind.title,
      count: kind.variants.length,
      levels: [],
      chart:
        model === undefined ? null : (
          <span className="z4-skill-chart">
            <Vizualizatsiya parametry={model.parametry} />
          </span>
        ),
    };
  });

  return (
    <GeneratorScreen base={`${tasksPage.href}/4`} family={section?.title ?? ''} skills={skills} />
  );
}
