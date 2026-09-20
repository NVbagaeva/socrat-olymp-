import { OPORNYE } from '@/content/opornye';
import type { PrepSkill } from '@/content/prepSkills';
import { buildPrepTasks } from '@/lib/prep';
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
  return (
    <PrepShell base={base} active={skill.id}>
      <PrepTaskScreen
        skillId={skill.id}
        title={skill.title}
        tasks={buildPrepTasks(skill)}
        listHref={`${base}/${OPORNYE.tail}`}
        tip={skill.tip}
      />
    </PrepShell>
  );
}
