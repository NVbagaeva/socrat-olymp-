'use client';

import { clsx } from 'clsx';
import { Tex } from '@/components/ui/Tex';
import { TRENAZHER_7 } from '@/content/zadanie7';
import type { ProtoInfo7 } from '@/lib/zadanie7/protoInfo';
import { SKOLKO, type Istochnik, type Nastroyki7 } from '@/lib/zadanie7/trenazher';

const T = TRENAZHER_7;

/**
 * Выбор тренировки №7: источник (только ФИПИ / сгенерированные /
 * вперемешку), группы и прототипы, число задач. Группа отмечается
 * целиком своим флажком.
 */
export function Vybor7({
  prototipy,
  gruppy,
  n,
  izmenit,
  zagruzka,
  onStart,
}: {
  prototipy: ProtoInfo7[];
  gruppy: { id: string; title: string }[];
  n: Nastroyki7;
  izmenit: (patch: Partial<Nastroyki7>) => void;
  zagruzka: boolean;
  onStart: () => void;
}) {
  return (
    <div className="z7-tr">
      <h2 className="t-h3">{T.vybor}</h2>
      <div className="z7-tr__istochnik" role="radiogroup" aria-label={T.istochnik}>
        {T.istochniki.map((i) => (
          <button
            type="button"
            role="radio"
            aria-checked={n.istochnik === i.id}
            key={i.id}
            className={clsx('z7-tr__pereklyuchatel', n.istochnik === i.id ? 'is-active' : '')}
            onClick={() => izmenit({ istochnik: i.id as Istochnik })}
          >
            {i.label}
          </button>
        ))}
      </div>
      {gruppy.map((g) => {
        const pg = prototipy.filter((p) => p.group === g.id);
        const vse = pg.every((p) => n.tipy.includes(p.id));
        return (
          <fieldset key={g.id} className="z7-tr__gruppa">
            <legend>
              <label>
                <input
                  type="checkbox"
                  checked={vse}
                  onChange={() =>
                    izmenit({
                      tipy: vse
                        ? n.tipy.filter((t) => !pg.some((p) => p.id === t))
                        : [...new Set([...n.tipy, ...pg.map((p) => p.id)])],
                    })
                  }
                />{' '}
                Группа {g.id}. {g.title}
              </label>
            </legend>
            <div className="z7-tr__chipy">
              {pg.map((p) => (
                <label
                  key={p.id}
                  className={clsx('z7-tr__chip', n.tipy.includes(p.id) ? 'is-active' : '')}
                >
                  <input
                    type="checkbox"
                    checked={n.tipy.includes(p.id)}
                    onChange={() =>
                      izmenit({
                        tipy: n.tipy.includes(p.id)
                          ? n.tipy.filter((t) => t !== p.id)
                          : [...n.tipy, p.id],
                      })
                    }
                  />
                  <span>
                    {p.kod} <Tex text={p.title} />
                  </span>
                  {p.bezFipi ? <span className="z7-metka">{T.bezFipi}</span> : null}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
      <div className="z7-tr__start">
        <label>
          {T.zadach}:{' '}
          <select value={n.skolko} onChange={(e) => izmenit({ skolko: Number(e.target.value) })}>
            {SKOLKO.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn--primary"
          disabled={n.tipy.length === 0 || zagruzka}
          onClick={onStart}
        >
          {T.nachat}
        </button>
        {n.tipy.length === 0 ? <span className="z7-tr__pusto">{T.pusto}</span> : null}
      </div>
    </div>
  );
}
