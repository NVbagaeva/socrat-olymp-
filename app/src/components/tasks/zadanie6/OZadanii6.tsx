import Link from 'next/link';
import { Tex } from '@/components/ui/Tex';
import { O_ZADANII_6, PRIMER_GRUPPY_6 } from '@/content/zadanie6';
import { GROUPS, kodNaSayte, prototype, prototypesOfGroup } from '@/lib/zadanie6/prototypes';

/**
 * Вкладка «О задании» №6: что за задание, с чего начать и пять групп
 * задач. Карточка группы кликабельна целиком — открывает разобранный
 * пример (исходная задача с разбором по шагам); под ней — все прототипы
 * группы, у каждого свой пример.
 */
export function OZadanii6({ base }: { base: string }) {
  return (
    <div className="z6-o">
      <section className="z6-o__intro">
        <h2 className="t-h2">{O_ZADANII_6.title}</h2>
        <p className="z6-o__lead">{O_ZADANII_6.lead}</p>
        <p>
          <Tex text={O_ZADANII_6.about} />
        </p>
        <ol className="z6-o__shagi">
          {O_ZADANII_6.shagi.map((s) => (
            <li key={s.title}>
              <b>{s.title}.</b> {s.text}
            </li>
          ))}
        </ol>
      </section>
      <h2 className="t-h3 z6-o__h">{O_ZADANII_6.gruppy}</h2>
      <p className="z6-o__lead">{O_ZADANII_6.gruppyLead}</p>
      <ul className="z6-o__gruppy">
        {GROUPS.map((g) => {
          const pid = PRIMER_GRUPPY_6[g.id] ?? prototypesOfGroup(g.id)[0]?.id ?? '';
          return (
            <li key={g.id} className="z6-o__gruppa">
              <Link className="z6-o__karta" href={`${base}/razbor/${pid}/`}>
                <span className="z6-o__gruppa-no">{g.id}</span>
                <span className="z6-o__gruppa-title">{g.title}</span>
                <span className="z6-o__gruppa-lead">
                  <Tex text={g.lead} />
                </span>
                <span className="z6-o__formula">
                  <Tex text={prototype(pid).formula} />
                </span>
                <span className="z6-o__primer">{O_ZADANII_6.primer} →</span>
              </Link>
              <ul className="z6-o__prototipy">
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
