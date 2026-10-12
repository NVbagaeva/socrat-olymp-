import type { Metadata } from 'next';
import { GeneratorScreen } from '@/components/tasks/generator/GeneratorScreen';
import { GeneratorSyuzhety } from '@/components/tasks/veroyatnost/GeneratorSyuzhety';
import { GeneratorRezhim5 } from '@/components/tasks/veroyatnost/dz5/GeneratorRezhim5';
import { shablonyItems } from '@/components/tasks/veroyatnost/dz5/shablonyItems';
import { navykiZadaniya } from '@/components/tasks/veroyatnost/metody';
import { syuzhetyPrototipov } from '@/components/tasks/veroyatnost/navyki';
import { KOROTKO_5, veroyatnostTitle, vkladka } from '@/content/veroyatnost';
import { bank5Pool } from '@/lib/veroyatnost/pool';
import { ZADANIYA } from '@/lib/paths';
import '@/components/tasks/veroyatnost/dz5/dz5.css';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', vkladka('5', 'generator')),
};

/**
 * Вкладка «Генератор» задания №5.
 *
 * Основной экран — генератор по шаблонам, устроенный как генератор
 * графиков №12 (GeneratorScreen): вид работы и дата, карточки
 * шаблонов, параметры листа, блок комплекта с seed. Шаблоны — типы
 * задач ДЗ №9 (lib/veroyatnost/dz5): ответ считается точно, листы
 * ученика и учителя — /zadaniya/5/shablony/pechat/.
 *
 * Прежний генератор по прототипам банка оставлен вторым режимом.
 */
export default function Generator5Tab() {
  return (
    <>
      {/* Название вкладки — H2 панели; у экрана генератора свой заголовок ниже. */}
      <h2 className="t-h2 vtab__title">{vkladka('5', 'generator')}</h2>
      <GeneratorRezhim5
        shablony={
          <GeneratorScreen
            base={`${ZADANIYA}/5/shablony`}
            family={KOROTKO_5}
            skills={shablonyItems()}
            levels={[]}
            note="Задачи собираются из шаблонов: числа и сюжеты меняются от комплекта к комплекту, ответ считается точно и записывается по правилам ЕГЭ."
            scope="5"
            section={`№5 · Шаблоны задач`}
          />
        }
        prototipy={
          <GeneratorSyuzhety
            zadanie={5}
            base={`${ZADANIYA}/5`}
            metody={navykiZadaniya(5)}
            syuzhety={syuzhetyPrototipov(bank5Pool())}
            kartinki={{}}
          />
        }
      />
    </>
  );
}
