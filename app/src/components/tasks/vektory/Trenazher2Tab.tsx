import { trainerPage } from '@/content/trainerModes';
import { TabScrollOnMount } from '../TabScroll';
import { protoKartochki } from './ProtoKartochki';
import { Trenazher2 } from './Trenazher2';

/**
 * Вкладка «Тренажёр» задания №2: заголовок и конфигуратор.
 * Карточки прототипов собираются на сервере.
 */
export function Trenazher2Tab({ base }: { base: string }) {
  const skills = protoKartochki();
  const total = skills.reduce((sum, item) => sum + item.count, 0);
  return (
    <section className="trainer">
      <header className="trainer__head">
        <h2 className="t-h2 trainer__title">{trainerPage.title}</h2>
      </header>
      <TabScrollOnMount />
      <Trenazher2 base={base} skills={skills} total={total} />
    </section>
  );
}
