import Link from 'next/link';
import { Tex } from '@/components/ui/Tex';
import { O_ZADANII_9, PROIZVODNAYA } from '@/content/proizvodnaya';
import { prototypesOfGroup } from '@/lib/proizvodnaya/skills';
import { typeset } from '@/lib/tex';
import { ZADANIYA } from '@/lib/paths';
import { ProtoKarta9 } from './ProtoKarta9';

/**
 * Вкладка «О задании» задания №9: что в ответе, два вопроса перед
 * решением, пять групп с карточками типов (клик раскрывает
 * разобранный пример) и типичные ошибки. На карточке формул нет —
 * они внутри раскрытого примера. Страница серверная: примеры
 * собираются на сборке.
 */
export function OZadanii9() {
  const base = `${ZADANIYA}/${PROIZVODNAYA.slug}`;
  return (
    <div className="z9-about">
      <section className="z9-about__lead">
        <h2 className="t-h2">{O_ZADANII_9.title}</h2>
        <p className="z9-about__text">{O_ZADANII_9.lead}</p>
      </section>

      <section className="z9-format" aria-labelledby="z9-format-title">
        <h3 className="t-h4 z9-about__sub" id="z9-format-title">
          {O_ZADANII_9.format.title}
        </h3>
        <p className="z9-format__text">
          <Tex text={O_ZADANII_9.format.text} />
        </p>
      </section>

      <section aria-labelledby="z9-dva-title">
        <h3 className="t-h4 z9-about__sub" id="z9-dva-title">
          {O_ZADANII_9.dvaVoprosa.title}
        </h3>
        <ul className="z9-dva">
          {O_ZADANII_9.dvaVoprosa.items.map((item, i) => (
            <li className="z9-dva__item" key={item.id}>
              <span className="z9-dva__no" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <span className="z9-dva__title">{item.title}</span>
                <span className="z9-dva__text">
                  <Tex text={item.text} />
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="z9-about__groups" aria-labelledby="z9-gruppy-title">
        <h3 className="t-h4 z9-about__sub" id="z9-gruppy-title">
          {O_ZADANII_9.gruppyTitle}
        </h3>
        <p className="z9-about__hint">{O_ZADANII_9.gruppyLead}</p>
        {O_ZADANII_9.gruppy.map((gruppa) => {
          const protos = prototypesOfGroup(gruppa.id);
          return (
            <div className="z9-group" key={gruppa.id}>
              <h4 className="z9-group__title">
                <span className="z9-group__code" aria-hidden="true">
                  {gruppa.id}
                </span>
                {gruppa.title}
              </h4>
              <p className="z9-group__lead">{gruppa.lead}</p>
              {protos.length === 0 ? null : (
                <ul className="z9-protos">
                  {protos.map((p) => (
                    <ProtoKarta9
                      key={p.id}
                      code={p.id}
                      titleHtml={typeset(p.nazvanie)}
                      primerTitle={`Разобранный пример ${p.id}`}
                    />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      <section aria-labelledby="z9-oshibki-title">
        <h3 className="t-h4 z9-about__sub" id="z9-oshibki-title">
          {O_ZADANII_9.oshibkiTitle}
        </h3>
        <ul className="z9-oshibki">
          {O_ZADANII_9.oshibki.map((o) => (
            <li className="z9-oshibka" key={o.id}>
              <h4 className="z9-oshibka__title">
                <Tex text={o.title} />
              </h4>
              <p className="z9-oshibka__text">
                <Tex text={o.text} />
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="z9-dalshe-title">
        <h3 className="t-h4 z9-about__sub" id="z9-dalshe-title">
          {O_ZADANII_9.dalshe.title}
        </h3>
        <ul className="z9-dalshe">
          {O_ZADANII_9.dalshe.items.map((item) => (
            <li key={item.id}>
              <Link className="z9-dalshe__link" href={`${base}/${item.tail}`}>
                <span className="z9-dalshe__label">{item.label} →</span>
                <span className="z9-dalshe__text">{item.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
