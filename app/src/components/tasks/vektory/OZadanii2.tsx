import { Tex } from '@/components/ui/Tex';
import { O_ZADANII } from '@/content/vektory';
import { BANK } from '@/lib/vektory/bank';
import { generate } from '@/lib/vektory/generate';
import { PROTOTYPES } from '@/lib/vektory/prototypes';
import type { Prototype, Risunok as RisunokConfig } from '@/lib/vektory/types';
import { Phrases } from '../theory/Phrases';
import { phrases } from '../theory/quadratic/markup';
import { Formula } from '../vychisleniya/Formula';
import { Risunok } from './Risunok';

/**
 * Мини-рисунок прототипа: первый вариант банка, окно по векторам.
 * У прототипов по координатам рисунка нет — там формула.
 */
function miniRisunok(p: Prototype): RisunokConfig | null {
  const entry = BANK.find((e) => e.prototype === p.id);
  const variant = entry?.variants[0];
  if (variant === undefined) {
    return null;
  }
  const task = generate(p.id, variant.seed);
  if (task.risunok === null) {
    return null;
  }
  return { ...task.risunok, window: 'tight', alt: `Пример рисунка к прототипу ${p.id}` };
}

/**
 * Вкладка «О задании» задания №2.
 *
 * Что проверяет задание и как записать ответ, три группы прототипов
 * с карточкой на каждый из девятнадцати (код, название, мини-рисунок
 * движка или формула) и четыре типичные ошибки. Тексты — только из
 * content/vektory.ts; формулы набирает KaTeX на сборке.
 */
export function OZadanii2() {
  return (
    <div className="z2-about">
      <section className="z2-about__lead">
        <h2 className="t-h2 z2-about__title">{O_ZADANII.title}</h2>
        <p className="z2-about__text">{O_ZADANII.lead}</p>
      </section>

      <section className="z2-format" aria-labelledby="z2-format-title">
        <h3 className="t-h4 z2-about__sub" id="z2-format-title">
          {O_ZADANII.format.title}
        </h3>
        <p className="z2-format__text">
          <Phrases parts={phrases(O_ZADANII.format.text)} />
        </p>
      </section>

      <section className="z2-about__groups" aria-labelledby="z2-gruppy-title">
        <h3 className="t-h4 z2-about__sub" id="z2-gruppy-title">
          {O_ZADANII.gruppyTitle}
        </h3>
        {O_ZADANII.gruppy.map((gruppa) => (
          <div className="z2-group" key={gruppa.id}>
            <h4 className="z2-group__title">
              <span className="z2-group__code" aria-hidden="true">
                {gruppa.id}
              </span>
              {gruppa.title}
            </h4>
            <p className="z2-group__lead">{gruppa.lead}</p>
            <ul className="z2-protos">
              {PROTOTYPES.filter((p) => p.gruppa === gruppa.id).map((p) => {
                const mini = miniRisunok(p);
                return (
                  <li className="z2-proto" key={p.id}>
                    <span className="z2-proto__head">
                      <span className="z2-proto__code">{p.id}</span>
                      <Tex className="z2-proto__title" text={p.nazvanie} />
                    </span>
                    {mini === null ? (
                      <Formula className="z2-proto__formula" tex={p.formula} />
                    ) : (
                      <Risunok className="z2-proto__pic" config={mini} />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <section className="z2-oshibki" aria-labelledby="z2-oshibki-title">
        <h3 className="t-h4 z2-about__sub" id="z2-oshibki-title">
          {O_ZADANII.oshibkiTitle}
        </h3>
        <ul className="z2-oshibki__list">
          {O_ZADANII.oshibki.map((o) => (
            <li className="z2-oshibka" key={o.id}>
              <h4 className="z2-oshibka__title">{o.title}</h4>
              <p className="z2-oshibka__text">
                <Phrases parts={phrases(o.text)} />
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
