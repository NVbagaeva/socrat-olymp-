'use client';

import { clsx } from 'clsx';
import { useState, type ReactNode } from 'react';
import { Metka, Polosa, Znak } from '../steklo';
import type { StrokaGruppy } from './types';

export type Otmetka = 'right' | 'wrong' | 'hinted' | 'skipped';

export interface ItogZadacha {
  kindHtml: string;
  uslovieHtml: string;
  mark: Otmetka;
  razbor?: (() => ReactNode) | undefined;
}

export interface ItogiLabels {
  title: string;
  lead: string;
  poTipam: string;
  rabota: string | null;
  rabotaLead: string;
  eshcheRaz: string;
  kVyboru: string;
  zadachi: string;
  razbor: string;
  skrytRazbor: string;
  otmetki: Record<Otmetka, string>;
}

export interface ItogiSessiiProps {
  verno: number;
  vsego: number;
  stroki: StrokaGruppy[];
  zadachi: ItogZadacha[];
  onRabota?: (() => void) | undefined;
  rabotaBusy?: boolean;
  onEshcheRaz: () => void;
  onVybor: () => void;
  labels: ItogiLabels;
}

function Stroka({ z, no, labels }: { z: ItogZadacha; no: number; labels: ItogiLabels }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={clsx('trn-itog-zadacha', `trn-itog-zadacha--${z.mark}`)}>
      <div className="trn-itog-zadacha__head">
        <span className="trn-itog-zadacha__no">{no}</span>
        <Metka ton={z.mark === 'right' ? 'green' : z.mark === 'wrong' ? 'terra' : 'grey'}>
          {labels.otmetki[z.mark]}
        </Metka>
        <span className="trn-itog-zadacha__kind" dangerouslySetInnerHTML={{ __html: z.kindHtml }} />
      </div>
      <div
        className="trn-itog-zadacha__uslovie"
        dangerouslySetInnerHTML={{ __html: z.uslovieHtml }}
      />
      {z.razbor === undefined ? null : (
        <>
          <button
            type="button"
            className="stk-ssylka"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? labels.skrytRazbor : labels.razbor}
          </button>
          {open ? <div className="trn-itog-zadacha__razbor">{z.razbor()}</div> : null}
        </>
      )}
    </li>
  );
}

/** Итоги сессии: верно/всего, время, разбивка по группам, кнопки, список задач. */
export function ItogiSessii({
  verno,
  vsego,
  stroki,
  zadachi,
  onRabota,
  rabotaBusy = false,
  onEshcheRaz,
  onVybor,
  labels,
}: ItogiSessiiProps) {
  const dolya = vsego === 0 ? 0 : verno / vsego;
  return (
    <section className="trn-itogi stk-glass" aria-labelledby="trn-itogi-title">
      <div className="trn-itogi__glavnoe">
        <p
          className="trn-itogi__schet"
          style={{ ['--dolya' as string]: `${Math.round(dolya * 100)}%` }}
        >
          <b>{verno}</b>
          <span>из {vsego}</span>
        </p>
        <div>
          <h3 className="stk-h3" id="trn-itogi-title">
            {labels.title}
          </h3>
          <p className="stk-lead">{labels.lead}</p>
        </div>
      </div>

      {stroki.length === 0 ? null : (
        <div className="trn-itogi__tipy">
          <p className="stk-podpis">{labels.poTipam}</p>
          <ul className="trn-razbivka">
            {stroki.map((s) => {
              const d = s.vsego === 0 ? 0 : s.verno / s.vsego;
              return (
                <li key={s.id} className={clsx(s.metka !== undefined && 'is-slabo')}>
                  <Znak html={s.znakHtml} ton={s.ton} size="sm" />
                  <span className="trn-razbivka__nazvanie">{s.nazvanie}</span>
                  <Polosa dolya={d} ton={s.metka !== undefined ? 'terra' : 'green'} />
                  <span className="trn-razbivka__schet">
                    {s.verno} из {s.vsego}
                  </span>
                  {s.metka === undefined ? null : <Metka ton="terra">{s.metka}</Metka>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="trn-knopki">
        {onRabota === undefined || labels.rabota === null ? null : (
          <button
            type="button"
            className="stk-btn stk-btn--warm stk-btn--lg"
            onClick={onRabota}
            disabled={rabotaBusy}
            aria-busy={rabotaBusy || undefined}
          >
            {labels.rabota}
          </button>
        )}
        <button type="button" className="stk-btn stk-btn--tihaya" onClick={onEshcheRaz}>
          {labels.eshcheRaz}
        </button>
        <button type="button" className="stk-btn stk-btn--tihaya" onClick={onVybor}>
          {labels.kVyboru}
        </button>
      </div>
      {onRabota === undefined || labels.rabota === null ? null : (
        <p className="trn-snoska">{labels.rabotaLead}</p>
      )}

      {/* Строки итогов в разметке общей оболочки (.tdone__rows): по ним
          проверки сайта читают «Верно / Неверно / Пропущено». */}
      <dl className="tdone__rows trn-itogi__rows">
        {(['right', 'wrong', 'hinted', 'skipped'] as const).map((mark) => (
          <div className="tdone__row" key={mark}>
            <dt>{labels.otmetki[mark]}</dt>
            <dd>{zadachi.filter((z) => z.mark === mark).length}</dd>
          </div>
        ))}
      </dl>

      <section className="trn-itogi__spisok">
        <p className="stk-podpis">{labels.zadachi}</p>
        <ol className="trn-itog-zadachi">
          {zadachi.map((z, i) => (
            <Stroka key={i} z={z} no={i + 1} labels={labels} />
          ))}
        </ol>
      </section>
    </section>
  );
}
