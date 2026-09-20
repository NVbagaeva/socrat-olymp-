import { OPORNYE } from '@/content/opornye';
import { Chart } from '@/components/graph/Chart';
import { katex } from '@/lib/graph/katex';
import { prepOverview } from '@/lib/prep';
import { prepSkillScene } from '@/lib/scenes';
import { PrepShell } from './PrepShell';
import { PrepSkillsScreen } from './PrepSkillsScreen';

export interface PrepSkillsProps {
  /** Адрес подтемы: от него считаются ссылки на тренажёры. */
  base: string;
}

/**
 * Список навыков подготовительных задач, собранный на сервере.
 *
 * Чертежи-миниатюры рисует движок graph/ на сборке, формулы набирает
 * KaTeX там же: вниз уходит готовая разметка, и клиентскому экрану
 * ни движок, ни KaTeX не нужны.
 */
export function PrepSkills({ base }: PrepSkillsProps) {
  const overview = prepOverview();

  const items = overview.skills.map((view) => ({
    id: view.skill.id,
    no: view.skill.no,
    title: view.skill.title,
    lead: view.skill.lead,
    total: view.total,
    href: `${base}/${OPORNYE.tail}${view.skill.id}/`,
    chart: <Chart className="prep-card__svg" scene={prepSkillScene(view.skill.id)} />,
    formula:
      view.skill.formula === undefined ? null : (
        <span
          className="prep-card__formula"
          /* Разметка своя, из конфига проекта: KaTeX собирает её
             на сборке и сам кладёт внутрь MathML для скринридера. */
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(view.skill.formula, {
              throwOnError: false,
              displayMode: false,
            }),
          }}
        />
      ),
  }));

  return (
    <PrepShell base={base} active="all">
      <PrepSkillsScreen items={items} />
    </PrepShell>
  );
}
