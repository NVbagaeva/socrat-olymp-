import type { SkillItem } from '../configurator';
import { TabScrollOnMount } from '../TabScroll';
import { trainerPage } from '@/content/trainerModes';
import { SKILL_FORMULA } from '@/content/vychisleniya';
import { BANK } from '@/lib/vychisleniya/bank';
import { SKILLS } from '@/lib/vychisleniya/skills';
import { Formula } from './Formula';
import { Trenazher8 } from './Trenazher8';

/**
 * Вкладка «Тренажёр» задания №8: заголовок и конфигуратор.
 *
 * Карточки навыков собираются на сервере: формулы набирает KaTeX
 * на сборке, число заданий — размер банка навыка (десять вариантов
 * на прототип), уровни у всех навыков оба.
 */
export function Trenazher8Tab({ base }: { base: string }) {
  const perPrototype = new Map(BANK.map((entry) => [entry.prototype, entry.variants.length]));
  const skills: SkillItem[] = SKILLS.map((skill) => ({
    id: skill.id,
    title: skill.nazvanie,
    count: skill.prototypes.reduce((sum, id) => sum + (perPrototype.get(id) ?? 0), 0),
    levels: ['base', 'advanced'],
    chart: <Formula className="z8-formula" tex={SKILL_FORMULA[skill.id] ?? ''} />,
  }));
  const total = skills.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="trainer">
      <header className="trainer__head">
        <h2 className="t-h2 trainer__title">{trainerPage.title}</h2>
      </header>
      <TabScrollOnMount />
      <Trenazher8 base={base} skills={skills} total={total} />
    </section>
  );
}
