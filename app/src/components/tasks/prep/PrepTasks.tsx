import type { PrepSkill } from '@/content/prepSkills';
import { buildPrepTasks, prepSkillView } from '@/lib/prep';
import { PrepShell } from './PrepShell';
import { PrepTaskScreen } from './PrepTaskScreen';

export interface PrepTasksProps {
  skill: PrepSkill;
  /** Адрес подтемы: от него считается ссылка на список навыков. */
  base: string;
}

/**
 * Задачи навыка, собранные на сервере.
 *
 * Движок graph/ и KaTeX работают здесь, на сборке: вниз уходит
 * готовая разметка условий, чертежей и разборов. Клиентскому экрану
 * ни движок, ни KaTeX не нужны.
 */
export function PrepTasks({ skill, base }: PrepTasksProps) {
  /* Витринное «решено» приходит из того же места, что и число
     на карточке навыка: второго источника у этой пары нет. */
  const view = prepSkillView(skill.id);

  return (
    <PrepShell base={base} active={skill.id}>
      <PrepTaskScreen
        title={skill.title}
        tasks={buildPrepTasks(skill)}
        listHref={`${base}/podgotovka/`}
        tip={skill.tip}
        solved={view === undefined ? 0 : view.solved}
      />
    </PrepShell>
  );
}
