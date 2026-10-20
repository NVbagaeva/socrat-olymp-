'use client';

import { clsx } from 'clsx';
import { Tex } from '@/components/ui/Tex';
import { TRENAZHER_6 } from '@/content/zadanie6';
import type { ProtoInfo6 } from '@/lib/zadanie6/protoInfo';
import { SHABLONY_6, type Stil } from '@/lib/zadanie6/shablony';
import { SKOLKO, type IstochnikVybora, type Nastroyki6 } from '@/lib/zadanie6/trenazher';

const T = TRENAZHER_6;

/** Переключатель из кнопок (радиогруппа): источник, формулировка. */
export function Pereklyuchatel<V extends string>({
  label,
  varianty,
  znachenie,
  izmenit,
}: {
  label: string;
  varianty: readonly { id: string; label: string }[];
  znachenie: V;
  izmenit: (v: V) => void;
}) {
  return (
    <div className="z6-tr__istochnik" role="radiogroup" aria-label={label}>
      {varianty.map((i) => (
        <button
          type="button"
          role="radio"
          aria-checked={znachenie === i.id}
          key={i.id}
          className={clsx('z6-tr__pereklyuchatel', znachenie === i.id ? 'is-active' : '')}
          onClick={() => izmenit(i.id as V)}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

/** Шаблоны: одна кнопка — готовый набор прототипов (и стиль). */
export function Shablony6({ vybrat }: { vybrat: (tipy: string[], stil: Stil) => void }) {
  return (
    <div className="z6-tr__shablony" role="group" aria-label={T.shablony}>
      {SHABLONY_6.map((sh) => (
        <button
          type="button"
          key={sh.id}
          className="z6-tr__shablon"
          onClick={() => vybrat(sh.tipy, sh.stil)}
        >
          <b>{sh.title}</b>
          <span>{sh.opisanie}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Выбор тренировки №6: шаблон → источник и формулировка → группы и
 * прототипы → число задач. Группа отмечается целиком своим флажком;
 * после шаблона прототипы можно поправить вручную.
 */
export function Vybor6({
  prototipy,
  gruppy,
  n,
  izmenit,
  zagruzka,
  onStart,
}: {
  prototipy: ProtoInfo6[];
  gruppy: { id: string; title: string }[];
  n: Nastroyki6;
  izmenit: (patch: Partial<Nastroyki6>) => void;
  zagruzka: boolean;
  onStart: () => void;
}) {
  return (
    <div className="z6-tr">
      <h2 className="t-h3">{T.vybor}</h2>
      <h3 className="z6-tr__podzag">{T.shablony}</h3>
      <Shablony6 vybrat={(tipy, stil) => izmenit({ tipy, stil })} />
      <h3 className="z6-tr__podzag">{T.istochnik}</h3>
      <Pereklyuchatel<IstochnikVybora>
        label={T.istochnik}
        varianty={T.istochniki}
        znachenie={n.istochnik}
        izmenit={(istochnik) => izmenit({ istochnik })}
      />
      <p className="z6-tr__poyasnenie">{T.istochnikPoyasnenie}</p>
      <h3 className="z6-tr__podzag">{T.stil}</h3>
      <Pereklyuchatel<Stil>
        label={T.stil}
        varianty={T.stili}
        znachenie={n.stil}
        izmenit={(stil) => izmenit({ stil })}
      />
      {gruppy.map((g) => {
        const pg = prototipy.filter((p) => p.group === g.id);
        const vse = pg.every((p) => n.tipy.includes(p.id));
        return (
          <fieldset key={g.id} className="z6-tr__gruppa">
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
            <div className="z6-tr__chipy">
              {pg.map((p) => (
                <label
                  key={p.id}
                  className={clsx('z6-tr__chip', n.tipy.includes(p.id) ? 'is-active' : '')}
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
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
      <div className="z6-tr__start">
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
        {n.tipy.length === 0 ? <span className="z6-tr__pusto">{T.pusto}</span> : null}
      </div>
    </div>
  );
}
