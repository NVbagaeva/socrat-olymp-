import { Tex } from '@/components/ui/Tex';
import { GLAVY_19 } from '@/content/teoriya19';
import { BLOKI_19, OPORNYE_19 } from '@/content/zadanie19';
import { Opornaya } from './Bloki19';

/** Вкладка «Опорные задачи» №19: опорные задачи открытых глав, по методам. */
export function Opornye19({ vkladka }: { vkladka: string }) {
  const glavy = GLAVY_19.filter((g) => g.metod !== undefined && g.opornye.length > 0);
  return (
    <>
      <h2 className="t-h2 vtab__title">{vkladka}</h2>
      <p className="z16-glava__lead">{OPORNYE_19.lead}</p>
      <div className="z16-punkty">
        {glavy.map((g) => (
          <section className="z16-punkt" key={g.id}>
            <h3 className="z16-punkt__title">
              <span className="z16-punkt__no">{g.metod}</span>
              <Tex text={`${BLOKI_19.metod(g.metod!)}. ${g.title}`} />
            </h3>
            <div className="z16-grid">
              {g.opornye.map((o, i) => (
                <Opornaya o={o} no={i + 1} key={o.id} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
