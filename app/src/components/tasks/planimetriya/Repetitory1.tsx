'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useState } from 'react';
import { Button, Checkbox, Select } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { MARSHRUTY_1, REPETITORY_1, ZAMETKI_1, type Marshrut1 } from '@/content/repetitory1';
import type { Blok } from '@/lib/planimetriya/stseny/dsl';
import {
  klyuchProto,
  type Level,
  type PodtipInfo,
  type RazdelInfo,
} from '@/lib/planimetriya/trenazher/sessiya';
import { Piktogramma, Zvezdy } from '../zadanie11/Piktogrammy';
import { IkonkaBloka1 } from './IkonkaBloka1';

export interface BlokKratko1 {
  id: string;
  slug: string;
  nazvanie: string;
}

const MINUT: Record<Level, number> = { 1: 1.5, 2: 2, 3: 3 };

/** Задачи и минуты урока: опорная — минута, остальные по уровню. */
function obyom(m: Marshrut1, podtip: (id: string) => PodtipInfo | undefined) {
  const n = m.opornye.length + m.bank.length + m.novye.length;
  const t =
    m.opornye.length +
    [...m.bank, ...m.novye].reduce((s, id) => s + MINUT[podtip(klyuchProto(id))?.level ?? 2], 0);
  return { n, minut: Math.max(10, Math.round(t / 5) * 5) };
}

function seed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Вкладка «Для репетиторов» задания №1 — устройство №11
 * (Repetitory11): девять уроков (опорные → банк → новые) с листом на
 * урок, методические заметки по блокам I–X и «Быстрый лист». Лист
 * урока собирается тем же движком, что генератор: адрес печати
 * /zadaniya/1/pechat/?m=r&r=N.
 */
export function Repetitory1({
  razdely,
  bloki,
  base,
}: {
  razdely: RazdelInfo[];
  bloki: BlokKratko1[];
  base: string;
}) {
  const vse = razdely.flatMap((r) => r.podtipy);
  const podtip = (id: string) => vse.find((p) => p.id === id);
  const blok = (id: string) => bloki.find((b) => b.id === id);
  const [otkryt, setOtkryt] = useState<number | null>(null);
  const [razdel, setRazdel] = useState<Blok>('I');
  const [urok, setUrok] = useState(1);
  const [variantov, setVariantov] = useState(1);
  const [sOtvetami, setSOtvetami] = useState(true);
  const [sRamkoy, setSRamkoy] = useState(true);

  function list(no: number, n: number, otvety: boolean, ramka: boolean) {
    const q = new URLSearchParams({ m: 'r', i: 'm', r: String(no), seed: seed() });
    if (n > 1) q.set('v', String(n));
    if (ramka) q.set('f', '1');
    window.open(`${base}/pechat/${otvety ? 'vse/' : ''}?${q.toString()}`, '_blank', 'noopener');
  }

  const m = MARSHRUTY_1.find((x) => x.no === otkryt);
  const zametki = ZAMETKI_1[razdel];
  const info = razdely.find((r) => r.id === razdel);

  return (
    <div className="z11-rep">
      <div className="z11-rep__main">
        <header className="z11-rep__head">
          <h2 className="t-h2">{REPETITORY_1.title}</h2>
          <p className="z11-rep__lead">{REPETITORY_1.lead}</p>
        </header>

        <section>
          <h3 className="z11-blok-title">{REPETITORY_1.marshruty}</h3>
          <ul className="z11-rep__marshruty">
            {MARSHRUTY_1.map((x) => {
              const { n, minut } = obyom(x, podtip);
              return (
                <li key={x.no} className={clsx('z11-urok', otkryt === x.no && 'is-open')}>
                  <p className="z11-urok__title">
                    <b>{REPETITORY_1.urok(x.no)}</b> {x.title}
                  </p>
                  <span className="z11-urok__ikonki">
                    {x.bloki.map((b) => (
                      <IkonkaBloka1 key={b} blok={b} />
                    ))}
                  </span>
                  <span className="z11-urok__count">{REPETITORY_1.zadachMinut(n, minut)}</span>
                  <span className="z11-urok__polosa" aria-hidden="true">
                    <span style={{ flexGrow: x.opornye.length / n }} className="is-o" />
                    <span style={{ flexGrow: x.bank.length / n }} className="is-b" />
                    <span style={{ flexGrow: x.novye.length / n }} className="is-n" />
                  </span>
                  <span className="z11-urok__legend">
                    <span>{REPETITORY_1.polosa.opornye}</span>
                    <span>{REPETITORY_1.polosa.bank}</span>
                    <span>{REPETITORY_1.polosa.novye}</span>
                  </span>
                  <span className="z11-urok__btns">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-expanded={otkryt === x.no}
                      onClick={() => setOtkryt(otkryt === x.no ? null : x.no)}
                    >
                      {otkryt === x.no ? REPETITORY_1.skryt : REPETITORY_1.otkryt}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => list(x.no, 1, false, true)}>
                      {REPETITORY_1.sgenerirovat}
                    </Button>
                  </span>
                </li>
              );
            })}
          </ul>

          {m === undefined ? null : (
            <div className="z11-card z11-urok-plan">
              <h4 className="z11-card__title">
                {REPETITORY_1.urok(m.no)} {m.title}
              </h4>
              <div className="z11-urok-plan__cols">
                <div>
                  <p className="z11-urok-plan__h">1. {REPETITORY_1.polosa.opornye}</p>
                  <ul>
                    {[...new Set(m.opornye)].map((id) => {
                      const b = blok(id);
                      return b === undefined ? null : (
                        <li key={id}>
                          <Link href={`${base}/opornye-zadachi/${b.slug}/`}>{b.nazvanie}</Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                {(['bank', 'novye'] as const).map((k, i) => (
                  <div key={k}>
                    <p className="z11-urok-plan__h">
                      {i + 2}. {REPETITORY_1.polosa[k]}
                    </p>
                    <ul>
                      {m[k].map((n, j) => {
                        const p = podtip(klyuchProto(n));
                        return p === undefined ? null : (
                          <li key={`${n}-${j}`}>
                            <span>
                              <span className="z11-akk__kod">{p.kod}</span> <Tex text={p.title} />
                            </span>
                            <Zvezdy level={p.level} />
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
                  href={`${base}/trenazher/?tipy=${[...new Set([...m.bank, ...m.novye])].map(klyuchProto).join(',')}`}
                >
                  {REPETITORY_1.vTrenazhere}
                </Link>
                <Button size="sm" onClick={() => list(m.no, 1, true, true)}>
                  {REPETITORY_1.sgenerirovat}
                </Button>
              </div>
            </div>
          )}
        </section>

        <section>
          <h3 className="z11-blok-title">{REPETITORY_1.zametki}</h3>
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
                    <IkonkaBloka1 blok={r.id} className="z11-zametki__ikonka" />
                    <Tex text={r.nazvanie} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="z11-card z11-zametki__body">
              <div className="z11-zametki__head">
                <IkonkaBloka1 blok={razdel} />
                <span>
                  <b>
                    <Tex text={info?.nazvanie ?? ''} />
                  </b>
                  <span className="z11-zametki__lead">{REPETITORY_1.zametkiLead}</span>
                </span>
              </div>
              <div className="z11-zametki__cards">
                <div className="z11-zametka z11-zametka--kak">
                  <p className="z11-zametka__title">
                    <Piktogramma name="book" />
                    {REPETITORY_1.kakObyasnyat}
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
                    {REPETITORY_1.oshibki}
                  </p>
                  <ol>
                    {zametki.oshibki.map((t) => (
                      <li key={t}>
                        <Tex text={t} />
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="z11-zametka z11-zametka--poryadok">
                  <p className="z11-zametka__title">
                    <Piktogramma name="chart" />
                    {REPETITORY_1.poryadok}
                  </p>
                  <ol>
                    {[...(info?.podtipy ?? [])]
                      .sort((a, b) => a.level - b.level)
                      .map((p) => (
                        <li key={p.id}>
                          <span>
                            <span className="z11-akk__kod">{p.kod}</span> <Tex text={p.title} />
                          </span>
                          <Zvezdy level={p.level} />
                        </li>
                      ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside className="z11-rep__side">
        <div className="z11-vybrannaya">
          <h3 className="z11-vybrannaya__title">{REPETITORY_1.bystryy}</h3>
          <p className="z11-istochnik__note">{REPETITORY_1.bystryyLead}</p>
          <label className="z11-rep__label" htmlFor="z1-rep-urok">
            {REPETITORY_1.vyberiteUrok}
          </label>
          <Select
            id="z1-rep-urok"
            value={String(urok)}
            onChange={(e) => setUrok(Number(e.target.value))}
          >
            {MARSHRUTY_1.map((x) => (
              <option key={x.no} value={String(x.no)}>
                {REPETITORY_1.urok(x.no)} {x.title}
              </option>
            ))}
          </Select>
          <div className="z11-vybrannaya__row">
            <span>{REPETITORY_1.variantov}</span>
            <span className="z11-stepper">
              <button
                type="button"
                aria-label="Меньше вариантов"
                disabled={variantov <= 1}
                onClick={() => setVariantov(variantov - 1)}
              >
                −
              </button>
              <output>{variantov}</output>
              <button
                type="button"
                aria-label="Больше вариантов"
                disabled={variantov >= 8}
                onClick={() => setVariantov(variantov + 1)}
              >
                +
              </button>
            </span>
          </div>
          <Checkbox checked={sOtvetami} onChange={(e) => setSOtvetami(e.target.checked)}>
            {REPETITORY_1.sOtvetami}
          </Checkbox>
          <Checkbox checked={sRamkoy} onChange={(e) => setSRamkoy(e.target.checked)}>
            {REPETITORY_1.sRamkoy}
          </Checkbox>
          <Button
            className="z11-vybrannaya__start"
            onClick={() => list(urok, variantov, sOtvetami, sRamkoy)}
          >
            <Piktogramma name="doc" />
            {REPETITORY_1.pdf}
          </Button>
          <p className="z11-istochnik__note">
            {REPETITORY_1.pdfNote}
            {sOtvetami ? REPETITORY_1.pdfNoteOtvety : ''}.
          </p>
        </div>
      </aside>
    </div>
  );
}
