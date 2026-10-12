import type { SkillItem } from '../configurator';
import { TabScrollOnMount } from '../TabScroll';
import { tasksPage } from '@/content/tasks';
import { trainerPage } from '@/content/trainerModes';
import { OPEN_BANK } from '@/lib/proizvodnaya/otkrytyj-bank';
import { generate } from '@/lib/proizvodnaya/generate';
import { renderFigura } from '@/lib/proizvodnaya/render';
import { GRUPPY, gruppaOfPrototype, prototypesOfGroup } from '@/lib/proizvodnaya/skills';
import { typeset } from '@/lib/tex';
import { Trenazher9 } from './Trenazher9';

/** Формула группы на карточке, если у группы нет рисунка. */
const GROUP_FORMULA: Record<string, string> = {
  I: "$v(t)=x'(t)$",
  II: "$k=f'(x_0)$",
  III: "$f'(x_0)\\ \\gtrless\\ 0$",
  IV: "$f'(x)=0$",
  V: "$F'(x)=f(x)$",
};

/** Миниатюра группы: рисунок первой задачи с графиком, иначе формула. */
function chartOf(groupId: string): string {
  const withPicture = prototypesOfGroup(groupId as 'I').find((p) => p.risunok);
  if (withPicture !== undefined) {
    try {
      const task = generate(withPicture.id, `${withPicture.id}#1`);
      if (task.risunok !== null) {
        return renderFigura(task.risunok, { rezhim: 'student' });
      }
    } catch {
      /* Прототип не собрал рисунок — на карточке будет формула. */
    }
  }
  return `<span class="z9-formula">${typeset(GROUP_FORMULA[groupId] ?? '')}</span>`;
}

/**
 * Вкладка «Тренажёр» задания №9: заголовок и конфигуратор.
 *
 * Карточки групп собираются на сервере: рисунок рисует движок на
 * сборке, формулы набирает KaTeX. Число задач — по реестру
 * прототипов и открытому банку.
 */
export function Trenazher9Tab() {
  const prototypesOf: Record<string, number> = {};
  const openOf: Record<string, number> = {};
  const groups: SkillItem[] = GRUPPY.map((group) => {
    prototypesOf[group.id] = prototypesOfGroup(group.id).length;
    openOf[group.id] = OPEN_BANK.filter(
      (item) => gruppaOfPrototype(item.prototype)?.id === group.id,
    ).length;
    return {
      id: group.id,
      title: group.nazvanie,
      count: prototypesOf[group.id] ?? 0,
      levels: [],
      chart: <span className="z9-chart" dangerouslySetInnerHTML={{ __html: chartOf(group.id) }} />,
    };
  });

  return (
    <section className="trainer">
      <header className="trainer__head">
        <h2 className="t-h2 trainer__title">{trainerPage.title}</h2>
      </header>
      <TabScrollOnMount />
      <Trenazher9
        backHref={tasksPage.href}
        groups={groups}
        prototypesOf={prototypesOf}
        openOf={openOf}
      />
    </section>
  );
}
