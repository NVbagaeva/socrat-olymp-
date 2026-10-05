import { OPORNYE } from '@/content/opornye';
import { Chart } from '@/components/graph/Chart';
import { prepOverview } from '@/lib/prep';
import { prepSkillScene } from '@/lib/scenes';
import { PrepShell } from './PrepShell';
import { PrepSkillsScreen } from './PrepSkillsScreen';

export interface PrepSkillsProps {
  /** Подтема: её список навыков. */
  type: string;
  /** Адрес подтемы: от него считаются ссылки на тренажёры. */
  base: string;
}

/**
 * Список навыков подготовительных задач, собранный на сервере.
 *
 * Чертежи-миниатюры рисует движок graph/ на сборке: вниз уходит
 * готовая разметка, и клиентскому экрану движок не нужен. Формул на
 * карточке блока нет — правило всех разделов (docs/razdel-pravila.md):
 * на телефоне формула не помещалась и наезжала на заголовок.
 */
export function PrepSkills({ type, base }: PrepSkillsProps) {
  const overview = prepOverview(type);

  const items = overview.skills.map((view) => ({
    id: view.skill.id,
    no: view.skill.no,
    title: view.skill.title,
    lead: view.skill.lead,
    total: view.total,
    href: `${base}/${OPORNYE.tail}${view.skill.id}/`,
    chart: <Chart className="prep-card__svg" scene={prepSkillScene(view.skill.id)} />,
  }));

  return (
    <PrepShell type={type} base={base} active="all">
      <PrepSkillsScreen items={items} />
    </PrepShell>
  );
}
