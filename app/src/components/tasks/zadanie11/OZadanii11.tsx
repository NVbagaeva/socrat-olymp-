import { Tex } from '@/components/ui/Tex';
import { RAZDELY_TEORII_11 } from '@/content/teoriya11';
import { O_ZADANII_11 } from '@/content/zadanie11';
import { sectionsInfo } from '@/lib/zadanie11/taxonomy';
import { IkonkaRazdela, Piktogramma } from './Piktogrammy';
import { KartaRazdelov11, type KartaPunkt } from './KartaRazdelov11';

/**
 * Вкладка «О задании» задания №11 (макет docs/mockups/zadanie-11/
 * o-zadanii.png): карта разделов в порядке изучения, колонка «С чего
 * начать» с советом и порядок изучения с опорными блоками перед
 * каждым разделом. Числа — из данных: подтипы и наибольшая
 * сложность — taxonomy.ts, прогресс — хранилище тренажёра.
 */
export function OZadanii11({ base }: { base: string }) {
  const info = sectionsInfo();
  const teoriya = new Map(RAZDELY_TEORII_11.filter((r) => r.section).map((r) => [r.section, r.id]));
  const punkty: KartaPunkt[] = info.map((s) => ({
    id: s.id,
    nazvanie: s.nazvanie,
    tipov: s.subtypes.length,
    subtypes: s.subtypes.map((st) => st.id),
    maxLevel: s.maxLevel,
    href: `${base}/teoriya/#teoriya-${teoriya.get(s.id) ?? ''}`,
    razminka: s.razminka === true,
  }));
  const { start } = O_ZADANII_11;

  return (
    <div className="z11-about">
      <div className="z11-about__main">
        <section className="z11-about__lead">
          <h2 className="t-h2 z11-about__title">{O_ZADANII_11.title}</h2>
          <p className="z11-about__answer">{O_ZADANII_11.lead}</p>
          <p className="z11-about__text">{O_ZADANII_11.about}</p>
        </section>

        <section aria-label={O_ZADANII_11.kartaTitle}>
          <KartaRazdelov11 punkty={punkty} />
        </section>

        <section className="z11-order" aria-labelledby="z11-order-title">
          <h3 className="t-h4 z11-about__sub" id="z11-order-title">
            Порядок изучения
          </h3>
          <ol className="z11-order__list">
            {info.map((s) => {
              const pered = O_ZADANII_11.pered[s.id] ?? [];
              return (
                <li className="z11-order__item" key={s.id}>
                  <IkonkaRazdela section={s.id} className="z11-order__icon" />
                  <span className="z11-order__body">
                    <span className="z11-order__name">{s.nazvanie}</span>
                    <span className="z11-order__desc">
                      <Tex text={s.opisanie} />
                    </span>
                    {pered.length === 0 ? null : (
                      <span className="z11-order__pered">Перед разделом: {pered.join(', ')}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <aside className="z11-start" aria-labelledby="z11-start-title">
        <h3 className="z11-start__title" id="z11-start-title">
          <Piktogramma name="flag" className="z11-start__flag" />
          {start.title}
        </h3>
        <ol className="z11-start__list">
          {start.shagi.map((shag, i) => (
            <li className="z11-start__step" key={shag.title}>
              <span className="z11-start__no" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <span className="z11-start__step-title">{shag.title}</span>
                <span className="z11-start__step-text">{shag.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="z11-sovet">
          <Piktogramma name="bulb" className="z11-sovet__icon" />
          <div>
            <p className="z11-sovet__title">{start.sovetTitle}</p>
            <p className="z11-sovet__text">{start.sovet}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
