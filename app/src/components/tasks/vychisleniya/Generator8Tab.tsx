import type { SkillItem } from '../configurator';
import { SKILL_FORMULA } from '@/content/vychisleniya';
import { BANK } from '@/lib/vychisleniya/bank';
import { SKILLS } from '@/lib/vychisleniya/skills';
import { Formula } from './Formula';
import { Generator8Screen } from './Generator8Screen';

/** Вкладка «Генератор» задания №8: вариант для печати. */
export function Generator8Tab({ base }: { base: string }) {
  const perPrototype = new Map(BANK.map((entry) => [entry.prototype, entry.variants.length]));
  const skills: SkillItem[] = SKILLS.map((skill) => ({
    id: skill.id,
    title: skill.nazvanie,
    count: skill.prototypes.reduce((sum, id) => sum + (perPrototype.get(id) ?? 0), 0),
    levels: ['base', 'advanced'],
    chart: <Formula className="z8-formula" tex={SKILL_FORMULA[skill.id] ?? ''} />,
  }));
  return <Generator8Screen base={base} skills={skills} />;
}
