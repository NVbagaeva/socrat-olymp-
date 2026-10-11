import Link from 'next/link';
import { Tex } from '@/components/ui/Tex';
import { O_ZADANII_7, PRIMER_GRUPPY_7 } from '@/content/zadanie7';
import { zadachiPrototipa } from '@/lib/zadanie7/bank/index';
import { GROUPS, kodNaSayte, prototype, prototypesOfGroup } from '@/lib/zadanie7/prototypes';

/**
 * Вкладка «О задании» №7: что за задание, с чего начать и пять групп
 * уравнений. Карточка группы кликабельна целиком — открывает
 * разобранный пример (задача ФИПИ с разбором по шагам); под ней — все
 * прототипы группы, у каждого свой пример.
 */
export function OZadanii7({ base }: { base: string }) {
  return (
    <div className="z7-o">
      <section className="z7-o__intro">
        <h2 className="t-h2">{O_ZADANII_7.title}</h2>
        <p className="z7-o__lead">{O_ZADANII_7.lead}</p>
        <p>
          <Tex text={O_ZADANII_7.about} />
        </p>
        <ol className="z7-o__shagi">
          {O_ZADANII_7.shagi.map((s) => (
            <li key={s.title}>
              <b>{s.title}.</b> {s.text}
            </li>
          ))}
        </ol>
      </section>
      <h2 className="t-h3 z7-o__h">{O_ZADANII_7.gruppy}</h2>
      <p className="z7-o__lead">{O_ZADANII_7.gruppyLead}</p>
      <ul className="z7-o__gruppy">
        {GROUPS.map((g) => {
          const pid = PRIMER_GRUPPY_7[g.id] ?? prototypesOfGroup(g.id)[0]?.id ?? '';
          const { fipi, analogi } = zadachiPrototipa(pid);
          const z = fipi[0] ?? analogi[0];
          return (
            <li key={g.id} className="z7-o__gruppa">
              <Link className="z7-o__karta" href={`${base}/razbor/${pid}/`}>
                <span className="z7-o__gruppa-no">{g.id}</span>
                <span className="z7-o__gruppa-title">{g.title}</span>
                <span className="z7-o__gruppa-lead">
                  <Tex text={g.lead} />
                </span>
                {z ? (
                  <span className="z7-o__uravnenie">
                    <Tex text={`$${prototype(pid).uravnenie(z.params)}$`} />
                  </span>
                ) : null}
                <span className="z7-o__primer">{O_ZADANII_7.primer} →</span>
              </Link>
              <ul className="z7-o__prototipy">
                {prototypesOfGroup(g.id).map((p) => (
                  <li key={p.id}>
                    <Link href={`${base}/razbor/${p.id}/`}>
                      {kodNaSayte(p.id)} <Tex text={p.title} />
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
