'use client';

import { clsx } from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
import { IkonkaTemy } from '@/components/generator/IkonkiTem';
import { Tex } from '@/components/ui/Tex';
import { TRENAZHER_6 } from '@/content/zadanie6';
import type { TrainerKindTally } from '@/lib/trainerProgress';
import { trenazher6 } from '@/lib/zadanie6/progress';
import type { ProtoInfo6 } from '@/lib/zadanie6/protoInfo';
import { SHABLONY_6, type Stil } from '@/lib/zadanie6/shablony';
import {
  SKOLKO,
  type IstochnikVybora,
  type Nastroyki6,
  type Rezhim6,
} from '@/lib/zadanie6/trenazher';

const T = TRENAZHER_6;

/**
 * Переключатель из кнопок-сегментов. Внутри — настоящие радиокнопки:
 * стрелки, Tab и чтение с экрана работают сами.
 */
export function Pereklyuchatel<V extends string>({
  label,
  punkty,
  znachenie,
  izmenit,
}: {
  label: string;
  punkty: readonly { id: string; label: string }[];
  znachenie: V;
  izmenit: (v: V) => void;
}) {
  const name = useId();
  return (
    <div className="z6t-seg" role="radiogroup" aria-label={label}>
      {punkty.map((i) => (
        <label key={i.id} className={clsx('z6t-seg__item', znachenie === i.id && 'is-active')}>
          <input
            type="radio"
            className="sr-only"
            name={name}
            checked={znachenie === i.id}
            onChange={() => izmenit(i.id as V)}
          />
          {i.label}
        </label>
      ))}
    </div>
  );
}

/** Точность по прототипам из хранилища тренажёра: «точность 80% · 5 реш.». */
function tochnost(t: TrainerKindTally | undefined): string {
  if (t === undefined || t.done === 0) {
    return T.netStatistiki;
  }
  return T.tochnost(Math.round((t.right / t.done) * 100), t.done);
}

function summa(kinds: Record<string, TrainerKindTally>, ids: string[]): TrainerKindTally {
  return ids.reduce<TrainerKindTally>(
    (a, id) => {
      const k = kinds[id];
      return k ? { done: a.done + k.done, right: a.right + k.right, seconds: 0 } : a;
    },
    { done: 0, right: 0, seconds: 0 },
  );
}

/** Флажок группы: «отмечены не все» — промежуточное состояние. */
function FlazhokGruppy({
  checked,
  chast,
  onChange,
  label,
}: {
  checked: boolean;
  chast: boolean;
  onChange: () => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = chast;
    }
  }, [chast]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="z6t-check"
      checked={checked}
      onChange={onChange}
      aria-label={label}
    />
  );
}

/**
 * Стартовый экран тренажёра №6: быстрый выбор → группы и прототипы
 * со статистикой → число задач и режим → «Начать». Кнопка «Начать»
 * с итогом выбора прилипает к низу экрана.
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
  const { kinds } = trenazher6.useProgress();
  /* Раскрытые группы: сначала те, где выбор частичный. */
  const [otkryty, setOtkryty] = useState<Record<string, boolean>>({});
  const pustoId = useId();
  const vse = prototipy.map((p) => p.id);
  const sovpadaet = (tipy: string[], stil: Stil) =>
    n.stil === stil && tipy.length === n.tipy.length && tipy.every((t) => n.tipy.includes(t));

  const pereklyuchit = (ids: string[]) => {
    const vseVybrany = ids.every((id) => n.tipy.includes(id));
    izmenit({
      tipy: vseVybrany ? n.tipy.filter((t) => !ids.includes(t)) : [...new Set([...n.tipy, ...ids])],
    });
  };

  return (
    <div className="z6t">
      <header className="z6t__head">
        <h2 className="t-h3">{T.vybor}</h2>
        <p className="z6t__lead">{T.vyborLead}</p>
      </header>

      <section className="z6t-card" aria-labelledby="z6t-shablony">
        <h3 id="z6t-shablony" className="z6t-card__title">
          {T.shablony}
        </h3>
        <div className="z6t-shablony">
          {SHABLONY_6.map((sh) => (
            <button
              type="button"
              key={sh.id}
              className="z6t-shablon"
              aria-pressed={sovpadaet(sh.tipy, sh.stil)}
              onClick={() => izmenit({ tipy: sh.tipy, stil: sh.stil })}
            >
              <b>{sh.title}</b>
              <span>{sh.opisanie}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="z6t-card" aria-labelledby="z6t-temy">
        <div className="z6t-card__row">
          <h3 id="z6t-temy" className="z6t-card__title">
            {T.temy}
          </h3>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => izmenit({ tipy: n.tipy.length === vse.length ? [] : vse })}
          >
            {n.tipy.length === vse.length ? T.snyat : T.vseGruppy}
          </button>
        </div>
        <ul className="z6t-gruppy">
          {gruppy.map((g) => {
            const pg = prototipy.filter((p) => p.group === g.id);
            const ids = pg.map((p) => p.id);
            const vybrano = ids.filter((id) => n.tipy.includes(id)).length;
            const otkryta = otkryty[g.id] ?? (vybrano > 0 && vybrano < ids.length);
            const spisokId = `z6t-g-${g.id}`;
            return (
              <li
                key={g.id}
                className={clsx('z6t-gruppa', vybrano > 0 && 'is-on', otkryta && 'is-open')}
              >
                <div className="z6t-gruppa__head">
                  <label className="z6t-gruppa__label">
                    <FlazhokGruppy
                      checked={vybrano === ids.length}
                      chast={vybrano > 0 && vybrano < ids.length}
                      onChange={() => pereklyuchit(ids)}
                      label={`Группа ${g.id}. ${g.title}`}
                    />
                    <IkonkaTemy zadanie="6" tema={g.id} />
                    <span className="z6t-gruppa__text">
                      <b>
                        Группа {g.id}. {g.title}
                      </b>
                      <small>
                        {T.prototipov(vybrano, ids.length)} · {tochnost(summa(kinds, ids))}
                      </small>
                    </span>
                  </label>
                  <button
                    type="button"
                    className="z6t-iconbtn"
                    aria-expanded={otkryta}
                    aria-controls={spisokId}
                    aria-label={T.razvernut(g.id)}
                    onClick={() => setOtkryty((o) => ({ ...o, [g.id]: !otkryta }))}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </div>
                <div id={spisokId} className="z6t-gruppa__body" hidden={!otkryta}>
                  <ul className="z6t-chipy">
                    {pg.map((p) => {
                      const on = n.tipy.includes(p.id);
                      return (
                        <li key={p.id}>
                          <label className={clsx('z6t-chip', on && 'is-on')}>
                            <input
                              type="checkbox"
                              className="z6t-check"
                              checked={on}
                              onChange={() => pereklyuchit([p.id])}
                            />
                            <span className="z6t-chip__text">
                              <span>
                                <b>{p.kod}</b> <Tex text={p.title} />
                              </span>
                              <small>{tochnost(kinds[p.id])}</small>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="z6t-card z6t-nastroyki" aria-label={T.rezhim}>
        <div className="z6t-pole">
          <h3 className="z6t-card__title" id="z6t-skolko">
            {T.zadach}
          </h3>
          <Pereklyuchatel<string>
            label={T.zadach}
            punkty={SKOLKO.map((k) => ({ id: String(k), label: String(k) }))}
            znachenie={String(n.skolko)}
            izmenit={(v) => izmenit({ skolko: Number(v) })}
          />
        </div>
        <div className="z6t-pole">
          <h3 className="z6t-card__title">{T.rezhim}</h3>
          <div className="z6t-rezhimy" role="radiogroup" aria-label={T.rezhim}>
            {T.rezhimy.map((r) => (
              <label key={r.id} className={clsx('z6t-rezhim', n.rezhim === r.id && 'is-active')}>
                <input
                  type="radio"
                  className="sr-only"
                  name="z6t-rezhim"
                  checked={n.rezhim === r.id}
                  onChange={() => izmenit({ rezhim: r.id as Rezhim6 })}
                />
                <b>{r.label}</b>
                <span>{r.opisanie}</span>
              </label>
            ))}
          </div>
        </div>
        <details className="z6t-dop">
          <summary>{T.dopolnitelno}</summary>
          <div className="z6t-dop__body">
            <div className="z6t-pole">
              <p className="z6t-pole__label">{T.istochnik}</p>
              <Pereklyuchatel<IstochnikVybora>
                label={T.istochnik}
                punkty={T.istochniki}
                znachenie={n.istochnik}
                izmenit={(istochnik) => izmenit({ istochnik })}
              />
              <p className="z6t__hint">{T.istochnikPoyasnenie}</p>
            </div>
            <div className="z6t-pole">
              <p className="z6t-pole__label">{T.stil}</p>
              <Pereklyuchatel<Stil>
                label={T.stil}
                punkty={T.stili}
                znachenie={n.stil}
                izmenit={(stil) => izmenit({ stil })}
              />
            </div>
          </div>
        </details>
      </section>

      <div className="z6t-start">
        <p className="z6t-start__itog" id={pustoId} aria-live="polite">
          {n.tipy.length === 0 ? T.pusto : T.nachatPodpis(n.skolko, n.tipy.length)}
        </p>
        <button
          type="button"
          className={clsx('btn btn--primary btn--lg z6t-start__btn', zagruzka && 'is-loading')}
          disabled={n.tipy.length === 0 || zagruzka}
          aria-describedby={pustoId}
          onClick={onStart}
        >
          {T.nachat}
        </button>
      </div>
    </div>
  );
}
