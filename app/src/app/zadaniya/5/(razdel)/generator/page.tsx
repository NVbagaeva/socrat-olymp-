import type { Metadata } from 'next';
import { GeneratorScreen } from '@/components/tasks/generator/GeneratorScreen';
import { navykiPrototipov } from '@/components/tasks/veroyatnost/navyki';
import { tasksPage } from '@/content/tasks';
import { veroyatnostFamily, veroyatnostTitle } from '@/content/veroyatnost';
import { bank5Pool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', 'Генератор'),
};

/**
 * Вкладка «Генератор» задания №5: вариант для печати.
 *
 * Экран — тот же GeneratorScreen, что у заданий №12 и №4, без правок.
 * Навыки — двенадцать прототипов банка №5: название, число вариантов
 * и миниатюра по модели первого варианта. Кнопки ведут на страницы
 * печати раздела: там лист собирается из тех же прототипов по
 * параметрам адреса.
 */
export default function Generator5Tab() {
  return (
    <GeneratorScreen
      base={`${tasksPage.href}/5`}
      family={veroyatnostFamily('5')}
      skills={navykiPrototipov(bank5Pool())}
    />
  );
}
