import { OPORNYE_9, O_ZADANII_9 } from '@/content/proizvodnaya';
import { prototypesOfGroup } from '@/lib/proizvodnaya/skills';
import { typeset } from '@/lib/tex';
import { ProtoKarta9 } from './ProtoKarta9';

/**
 * Разобранные задачи по типам: по одной на каждый прототип, группами
 * I–V. Карточка раскрывается по клику (с клавиатуры тоже): рисунок
 * с построениями и решение по шагам собираются в браузере при
 * первом раскрытии — тот же пример, что на вкладке «О задании».
 */
export function RazobrannyeZadachi9() {
  return (
    <section className="z9-razobrannye" aria-labelledby="z9-razobrannye-title">
      <h3 className="t-h3 z9-razobrannye__title" id="z9-razobrannye-title">
        {OPORNYE_9.razobrannyeTitle}
      </h3>
      <p className="z9-about__hint">{OPORNYE_9.razobrannyeLead}</p>
      {O_ZADANII_9.gruppy.map((gruppa) => {
        const protos = prototypesOfGroup(gruppa.id);
        return protos.length === 0 ? null : (
          <div className="z9-group" key={gruppa.id}>
            <h4 className="z9-group__title">
              <span className="z9-group__code" aria-hidden="true">
                {gruppa.id}
              </span>
              {gruppa.title}
            </h4>
            <ul className="z9-protos">
              {protos.map((p) => (
                <ProtoKarta9
                  key={p.id}
                  code={p.id}
                  label="Решение"
                  titleHtml={typeset(p.nazvanie)}
                  primerTitle={`Разобранная задача ${p.id}`}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
