'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { MARSHRUTY_11, REPETITORY_11, ZAMETKI_11, type Marshrut11 } from '@/content/repetitory11';
import { Tex } from '@/components/ui/Tex';
import type { PodtipInfo, RazdelInfo } from '@/lib/zadanie11/trenazher/sessiya';
import type { Level, SectionId } from '@/lib/zadanie11/types';
import { IkonkaBloka, IkonkaRazdela, Piktogramma, tsvetRazdela, Zvezdy } from './Piktogrammy';

export interface BlokKratko {
  id: string;
  slug: string;
  nazvanie: string;
  razdel: SectionId | 'OB';
}

const MINUT: Record<Level, number> = { 1: 2, 2: 3, 3: 5 };

/** Задачи и минуты урока: опорная — полторы минуты, остальные по уровню. */
function obyom(m: Marshrut11, podtip: (id: string) => PodtipInfo | undefined) {
  const n = m.opornye.length + m.bank.length + m.novye.length;
  const t =
    m.opornye.length * 1.5 +
    [...m.bank, ...m.novye].reduce((s, id) => s + MINUT[podtip(id)?.level ?? 2], 0);
  return { n, minut: Math.max(10, Math.round(t / 5) * 5) };
}

/**
 * Вкладка «Для репетиторов» задания №11: пять готовых уроков
 * (опорные → банк → новые) и методические заметки по разделу.
 * Листы не собираются здесь: урок открывается в генераторе
 * пресетом «Готовый урок» (адрес generator/?urok=N) — там варианты,
 * замена задач и печать. У заметок — ссылки в теорию раздела,
 * опорные блоки, тренажёр и лист урока по разделу.
 */
export function Repetitory11({
  razdely,
  bloki,
  teoriya,
  base,
}: {
  razdely: RazdelInfo[];
  bloki: BlokKratko[];
  /** Якорь раздела теории по разделу задач. */
  teoriya: Record<SectionId, string>;
  base: string;
}) {
  const vse = razdely.flatMap((r) => r.podtipy);
  const podtip = (id: string) => vse.find((p) => p.id === id);
  const blok = (id: string) => bloki.find((b) => b.id === id);
  const [otkryt, setOtkryt] = useState<number | null>(null);
  const [razdel, setRazdel] = useState<SectionId>('DP');

  const m = MARSHRUTY_11.find((x) => x.no === otkryt);
  const zametki = ZAMETKI_11[razdel];
  const info = razdely.find((r) => r.id === razdel);
  const tipyRazdela = (info?.podtipy ?? []).map((p) => p.id);

  return (
    <div className="z11-rep">
      <div className="z11-rep__main">
        <header className="z11-rep__head">
          <h2 className="t-h2">{REPETITORY_11.title}</h2>
          <p className="z11-rep__lead">{REPETITORY_11.lead}</p>
        </header>

        <section>
          <h3 className="z11-blok-title">{REPETITORY_11.marshruty}</h3>
          <p className="z11-rep__lead">{REPETITORY_11.marshrutyLead}</p>
          <ul className="z11-rep__marshruty">
            {MARSHRUTY_11.map((x) => {
              const { n, minut } = obyom(x, podtip);
              const all = n;
              return (
                <li key={x.no} className={clsx('z11-urok', otkryt === x.no && 'is-open')}>
                  <p className="z11-urok__title">
                    <b>{REPETITORY_11.urok(x.no)}</b> {x.title}
                  </p>
                  <span className="z11-urok__ikonki">
                    {x.razdely.map((r) => (
                      <IkonkaRazdela key={r} section={r} />
                    ))}
                  </span>
                  <span className="z11-urok__count">{REPETITORY_11.zadachMinut(n, minut)}</span>
                  <span className="z11-urok__polosa" aria-hidden="true">
                    <span style={{ flexGrow: x.opornye.length / all }} className="is-o" />
                    <span style={{ flexGrow: x.bank.length / all }} className="is-b" />
                    <span style={{ flexGrow: x.novye.length / all }} className="is-n" />
                  </span>
                  <span className="z11-urok__legend">
                    <span>{REPETITORY_11.polosa.opornye}</span>
                    <span>{REPETITORY_11.polosa.bank}</span>
                    <span>{REPETITORY_11.polosa.novye}</span>
                  </span>
                  <span className="z11-urok__btns">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-expanded={otkryt === x.no}
                      onClick={() => setOtkryt(otkryt === x.no ? null : x.no)}
                    >
                      {otkryt === x.no ? REPETITORY_11.skryt : REPETITORY_11.otkryt}
                    </Button>
                    <Link
                      className="btn btn--primary btn--sm"
                      href={`${base}/generator/?urok=${x.no}`}
                    >
                      <Piktogramma name="doc" />
                      {REPETITORY_11.vGeneratore}
                    </Link>
                  </span>
                </li>
              );
            })}
          </ul>

          {m === undefined ? null : (
            <div className="z11-card z11-urok-plan">
              <h4 className="z11-card__title">
                {REPETITORY_11.urok(m.no)} {m.title}
              </h4>
              <div className="z11-urok-plan__cols">
                <div>
                  <p className="z11-urok-plan__h">1. {REPETITORY_11.polosa.opornye}</p>
                  <ul>
                    {[...new Set(m.opornye)].map((id) => {
                      const b = blok(id);
                      return b === undefined ? null : (
                        <li key={id}>
                          <IkonkaBloka razdel={b.razdel} className="z11-urok-plan__ikonka" />
                          <Link href={`${base}/opornye-zadachi/${b.slug}/`}>{b.nazvanie}</Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                {(['bank', 'novye'] as const).map((k, i) => (
                  <div key={k}>
                    <p className="z11-urok-plan__h">
                      {i + 2}. {REPETITORY_11.polosa[k]}
                    </p>
                    <ul>
                      {m[k].map((id, j) => {
                        const p = podtip(id);
                        return p === undefined ? null : (
                          <li key={`${id}-${j}`} title={p.kod}>
                            <span>{p.title}</span>
                            <Zvezdy level={p.level} section={p.section} />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="z11-urok-plan__btns">
                <Link
                  className="btn btn--secondary btn--sm"
                  href={`${base}/trenazher/?tipy=${[...new Set([...m.bank, ...m.novye])].join(',')}`}
                >
                  <Piktogramma name="play" />
                  {REPETITORY_11.vTrenazhere}
                </Link>
                <Link className="btn btn--primary btn--sm" href={`${base}/generator/?urok=${m.no}`}>
                  <Piktogramma name="doc" />
                  {REPETITORY_11.vGeneratore}
                </Link>
              </div>
            </div>
          )}
        </section>

        <section>
          <h3 className="z11-blok-title">{REPETITORY_11.zametki}</h3>
          <div className="z11-zametki">
            <ul className="z11-zametki__list">
              {razdely.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className={clsx('z11-zametki__item', razdel === r.id && 'is-active')}
                    aria-pressed={razdel === r.id}
                    onClick={() => setRazdel(r.id)}
                  >
                    <IkonkaRazdela section={r.id} className="z11-zametki__ikonka" />
                    {r.nazvanie}
                  </button>
                </li>
              ))}
            </ul>
            <div className={clsx('z11-card z11-zametki__body', tsvetRazdela(razdel))}>
              <div className="z11-zametki__head">
                <IkonkaRazdela section={razdel} />
                <span>
                  <b>{info?.nazvanie}</b>
                  <span className="z11-zametki__lead">{REPETITORY_11.zametkiLead}</span>
                </span>
              </div>
              <div className="z11-zametki__ssylki">
                <Link
                  className="btn btn--secondary btn--sm"
                  href={`${base}/teoriya/#${teoriya[razdel]}`}
                >
                  <Piktogramma name="book" />
                  {REPETITORY_11.ssylki.teoriya}
                </Link>
                <Link
                  className="btn btn--secondary btn--sm"
                  href={`${base}/opornye-zadachi/?razdel=${razdel}`}
                >
                  <Piktogramma name="tools" />
                  {REPETITORY_11.ssylki.opornye}
                </Link>
                <Link
                  className="btn btn--secondary btn--sm"
                  href={`${base}/trenazher/?tipy=${tipyRazdela.join(',')}`}
                >
                  <Piktogramma name="play" />
                  {REPETITORY_11.ssylki.trenazher}
                </Link>
                <Link
                  className="btn btn--primary btn--sm"
                  href={`${base}/generator/?razdel=${razdel}`}
                >
                  <Piktogramma name="doc" />
                  {REPETITORY_11.ssylki.urok}
                </Link>
              </div>
              <div className="z11-zametki__cards">
                <div className="z11-zametka z11-zametka--kak">
                  <p className="z11-zametka__title">
                    <Piktogramma name="book" />
                    {REPETITORY_11.kakObyasnyat}
                  </p>
                  <ol>
                    {zametki.kakObyasnyat.map((t) => (
                      <li key={t}>
                        <Tex text={t} />
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="z11-zametka z11-zametka--oshibki">
                  <p className="z11-zametka__title">
                    <Piktogramma name="alert" />
                    {REPETITORY_11.oshibki}
                  </p>
                  <ol>
                    {zametki.oshibki.map((t) => (
                      <li key={t}>
                        <Tex text={t} />
                      </li>
                    ))}
                  </ol>
                  <p className="z11-zametka__note">{REPETITORY_11.oshibkiNote}</p>
                </div>
                <div className="z11-zametka z11-zametka--poryadok">
                  <p className="z11-zametka__title">
                    <Piktogramma name="chart" />
                    {REPETITORY_11.poryadok}
                  </p>
                  <ol>
                    {[...(info?.podtipy ?? [])]
                      .sort((a, b) => a.level - b.level)
                      .map((p) => (
                        <li key={p.id} title={p.kod}>
                          <span>{p.title}</span>
                          <Zvezdy level={p.level} section={p.section} />
                        </li>
                      ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
