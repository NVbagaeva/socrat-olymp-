import Link from 'next/link';
import { Tex } from '@/components/ui/Tex';
import { O_ZADANII_10 } from '@/content/zadanie10';
import { GROUPS, kodNaSayte, prototypesOfGroup } from '@/lib/zadanie10/prototypes';
import { Illyustraciya10 } from './Illyustraciya10';

/**
 * Вкладка «О задании» №10: что за задание, с чего начать и пять групп
 * сюжетов. Карточка сюжета — картинка (если уже есть), название и
 * формула; ведёт на разобранный пример прототипа.
 */
export function OZadanii10({ base }: { base: string }) {
  return (
    <div className="z10-o">
      <section className="z10-o__intro">
        <h2 className="t-h2">{O_ZADANII_10.title}</h2>
        <p className="z10-o__lead">{O_ZADANII_10.lead}</p>
        <p>
          <Tex text={O_ZADANII_10.about} />
        </p>
        <ol className="z10-o__shagi">
          {O_ZADANII_10.shagi.map((s) => (
            <li key={s.title}>
              <b>{s.title}.</b> {s.text}
            </li>
          ))}
        </ol>
      </section>
      <h2 className="t-h3 z10-o__h">{O_ZADANII_10.gruppy}</h2>
      <p className="z10-o__lead">{O_ZADANII_10.gruppyLead}</p>
      {GROUPS.map((g) => (
        <section key={g.id} className="z10-o__gruppa">
          <h3 className="z10-o__gruppa-title">
            <span className="z10-o__gruppa-no">{g.id}</span> {g.title}
          </h3>
          <p className="z10-o__gruppa-lead">{g.lead}</p>
          <ul className="z10-o__setka">
            {prototypesOfGroup(g.id).map((p) => (
              <li key={p.id}>
                <Link className="z10-o__karta" href={`${base}/razbor/${p.id}/`}>
                  <Illyustraciya10 id={p.id} className="z10-o__ill" />
                  <span className="z10-o__kod">{kodNaSayte(p.id)}</span>
                  <span className="z10-o__name">{p.title}</span>
                  <span className="z10-o__formula">
                    <Tex text={`$${p.formula}$`} />
                  </span>
                  {p.fipiNos ? null : <span className="z10-metka">не из открытого банка</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
