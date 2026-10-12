import { GRUPPY, prototypesOfGroup } from '@/lib/proizvodnaya/skills';
import type { SkillItem } from '../configurator';
import { Generator9Screen } from './Generator9Screen';
import { GroupGlyph } from './GroupGlyph';

/** Вкладка «Генератор» задания №9: вариант для печати. */
export function Generator9Tab({ base }: { base: string }) {
  const skills: SkillItem[] = GRUPPY.map((gruppa) => ({
    id: gruppa.id,
    title: gruppa.nazvanie,
    code: `Группа ${gruppa.id}`,
    count: prototypesOfGroup(gruppa.id).length,
    levels: [],
    chart: <GroupGlyph gruppa={gruppa.id} />,
  })).filter((item) => item.count > 0);
  return <Generator9Screen base={base} skills={skills} />;
}
