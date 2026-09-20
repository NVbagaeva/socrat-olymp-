import type { Metadata } from 'next';
import { GeneratorScreen } from '@/components/tasks/generator/GeneratorScreen';
import { navykiPrototipov } from '@/components/tasks/veroyatnost/navyki';
import { tasksPage } from '@/content/tasks';
import { veroyatnostFamily, veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { bank4Pool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', vkladka('4', 'generator')),
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
  return (
    <>
      {/* Название вкладки — H2 панели; у экрана генератора свой
          заголовок ниже, общий с заданием №12. */}
      <h2 className="t-h2 vtab__title">{vkladka('4', 'generator')}</h2>
      <GeneratorScreen
        base={`${tasksPage.href}/4`}
        family={veroyatnostFamily('4')}
        skills={navykiPrototipov(bank4Pool())}
      />
    </>
  );
}
