import { ABOUT_GROUPS, VYCHISLENIYA, SKILL_FORMULA } from '@/content/vychisleniya';
import { SKILLS } from '@/lib/vychisleniya/skills';
import { Formula } from './Formula';

/**
 * Вкладка «О задании» задания №8.
 *
 * Короткое описание раздела и пять групп прототипов; в каждой группе —
 * её навыки с формулой. Тексты — только из content/vychisleniya.ts,
 * своей разметки со строками здесь нет.
 */
export function VychisleniyaAbout() {
  return (
    <div className="z8-about">
      <section className="z8-about__lead">
        <h2 className="t-h2 z8-about__title">{VYCHISLENIYA.about.title}</h2>
        <p className="z8-about__text">{VYCHISLENIYA.about.lead}</p>
      </section>

      <section className="z8-about__groups">
        <h3 className="t-h4 z8-about__sub">{VYCHISLENIYA.about.groupsTitle}</h3>
        {ABOUT_GROUPS.map((group) => (
          <div className="z8-group" key={group.id}>
            <h4 className="z8-group__title">{group.title}</h4>
            <p className="z8-group__lead">{group.lead}</p>
            <ul className="z8-group__skills">
              {SKILLS.filter((skill) => skill.group === group.id).map((skill) => (
                <li className="z8-skill-tile" key={skill.id}>
                  <span className="z8-skill-tile__title">{skill.nazvanie}</span>
                  <Formula className="z8-skill-tile__formula" tex={SKILL_FORMULA[skill.id] ?? ''} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
