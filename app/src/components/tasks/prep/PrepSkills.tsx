import { Chart } from '@/components/graph/Chart';
import { prepOverview } from '@/lib/prep';
import { prepSkillScene } from '@/lib/scenes';
import { PrepSkillsScreen } from './PrepSkillsScreen';

export interface PrepSkillsProps {
  /** Адрес подтемы: от него считаются ссылки на тренажёры. */
  base: string;
}

/**
 * Список навыков подготовительных задач, собранный на сервере.
 *
 * Чертежи-миниатюры рисует движок graph/ на сборке и уходят вниз
 * готовой разметкой: клиентскому экрану движок не нужен.
 */
export function PrepSkills({ base }: PrepSkillsProps) {
  const overview = prepOverview();

  const items = overview.skills.map((view) => ({
    id: view.skill.id,
    no: view.skill.no,
    title: view.skill.title,
    lead: view.skill.lead,
    total: view.total,
    solved: view.solved,
    percent: view.percent,
    href: `${base}/podgotovka/${view.skill.id}/`,
    chart: <Chart className="prep-card__svg" scene={prepSkillScene(view.skill.id)} />,
  }));

  return (
    <PrepSkillsScreen
      items={items}
      solved={overview.solved}
      total={overview.total}
      percent={overview.percent}
    />
  );
}
