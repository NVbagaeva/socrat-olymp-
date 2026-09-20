import type { Metadata } from 'next';
import { GeneratorScreen } from '@/components/tasks/generator/GeneratorScreen';
import { navykiPrototipov } from '@/components/tasks/veroyatnost/navyki';
import { tasksPage } from '@/content/tasks';
import { veroyatnostFamily, veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { bank5Pool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', vkladka('5', 'generator')),
};

/**
 * Вкладка «Генератор» задания №5: вариант для печати.
 *
 * Экран — тот же GeneratorScreen, что у заданий №12 и №4, без правок.
 * Навыки — тринадцать прототипов банка №5: название, число вариантов
 * и миниатюра по модели первого варианта. Кнопки ведут на страницы
 * печати раздела: там лист собирается из тех же прототипов по
 * параметрам адреса.
 */
export default function Generator5Tab() {
  return (
    <>
      {/* Название вкладки — H2 панели; у экрана генератора свой
          заголовок ниже, общий с заданием №12. */}
      <h2 className="t-h2 vtab__title">{vkladka('5', 'generator')}</h2>
      <GeneratorScreen
        base={`${tasksPage.href}/5`}
        family={veroyatnostFamily('5')}
        skills={navykiPrototipov(bank5Pool())}
      />
    </>
  );
}
