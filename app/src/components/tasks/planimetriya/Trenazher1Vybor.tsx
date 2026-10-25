'use client';

import { clsx } from 'clsx';
import { useMemo, useState } from 'react';
import { Button, Checkbox, Details, Radio } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { TRENAZHER_1 } from '@/content/zadanie1';
import { plural } from '@/lib/plural';
import { progress1 } from '@/lib/planimetriya/progress';
import { zakryto, type Pauza } from '@/lib/planimetriya/trenazher/pauza';
import {
  primernoeVremya,
  vTrenirovke,
  type Istochnik,
  type Level,
  type Nastroyki,
  type PodtipInfo,
  type RazdelInfo,
} from '@/lib/planimetriya/trenazher/sessiya';
import type { StoreProgress } from '@/lib/progressStore';
import type { Blok } from '@/lib/planimetriya/stseny/dsl';
import { Piktogramma, Zvezdy } from '../zadanie11/Piktogrammy';
import { IkonkaBloka1 } from './IkonkaBloka1';

const IKONKA_ISTOCHNIKA: Record<Istochnik, string> = { bank: 'doc', mix: 'layers', new: 'sparkle' };

export interface Trenazher1VyborProps {
  razdely: RazdelInfo[];
  n: Nastroyki;
  izmenit: (patch: Partial<Nastroyki>) => void;
  /** Сколько задач банка есть по выбранным типам. */
  vBankeVsego: number;
  /** Прототипы из списка ошибок и сколько там задач. */
  oshibki: string[];
  oshibokZadach: number;
  progress: StoreProgress;
  zagruzka: boolean;
  onStart: () => void;
  /** Тренировка на паузе и что с ней сделать. */
  pauza: Pauza | null;
  onProdolzhit: () => void;
  onZavershit: () => void;
}

/** Текст для поиска: название без TeX. */
function prostoy(t: string): string {
  return t
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[$^_{}\\]/g, '')
    .toLowerCase();
}

function podkhodit(p: PodtipInfo, needle: string): boolean {
  return needle === '' || prostoy(p.title).includes(needle) || p.kod.includes(needle);
}

/**
 * Экран выбора тренировки №1 — экран выбора №11 (Trenazher11Vybor):
 * источник задач, быстрые настройки, поиск, аккордеон блоков I–X с
 * прототипами и правая карточка «Выбранная тренировка». Сверху —
 * тренировка на паузе, если она есть.
 */
export function Trenazher1Vybor({
  razdely,
  n,
  izmenit,
  vBankeVsego,
  oshibki,
  oshibokZadach,
  progress,
  zagruzka,
  onStart,
  pauza,
  onProdolzhit,
  onZavershit,
}: Trenazher1VyborProps) {
  const [poisk, setPoisk] = useState('');
  const [otkryty, setOtkryty] = useState<Set<Blok>>(new Set());
  const needle = poisk.trim().toLowerCase();
  const vidimye = razdely.filter(
    (r) => !(n.istochnik === 'bank' && r.podtipy.every((p) => p.vBanke === 0)),
  );
  const vse = useMemo(() => razdely.flatMap((r) => r.podtipy), [razdely]);
  const vybrano = new Set(n.podtipy);
  const itog = vTrenirovke(n, vse);
  const novye = n.istochnik === 'new';
  const malo = n.istochnik === 'bank' && itog.length > 0 && vBankeVsego < n.count;
  const [ot, doo] = primernoeVremya(
    itog.map((p) => p.level),
    Math.min(n.count, n.istochnik === 'bank' ? vBankeVsego : n.count),
  );

  function pereklyuchit(ids: string[], on: boolean) {
    const s = new Set(n.podtipy);
    for (const id of ids) {
      if (on) s.add(id);
      else s.delete(id);
    }
    izmenit({ podtipy: vse.filter((p) => s.has(p.id)).map((p) => p.id) });
  }

  function preset(ids: string[]) {
    izmenit({ podtipy: ids, uroven: 0 });
  }

  const izBlokov = (bloki: Blok[]) => vse.filter((p) => bloki.includes(p.section)).map((p) => p.id);
  const presety: { id: string; label: React.ReactNode; ikonka: string; ids: string[] }[] = [
    {
      id: 'vse',
      label: TRENAZHER_1.presety.vse,
      ikonka: 'grid',
      ids: vse.filter((p) => p.vBanke > 0).map((p) => p.id),
    },
    { id: 'tr', label: TRENAZHER_1.presety.treugolniki, ikonka: '', ids: izBlokov(['I']) },
    {
      id: 'ch',
      label: TRENAZHER_1.presety.chetyrehugolniki,
      ikonka: '',
      ids: izBlokov(['II', 'III', 'IV']),
    },
    {
      id: 'trig',
      label: TRENAZHER_1.presety.trigonometriya,
      ikonka: '',
      ids: izBlokov(['V', 'IX']),
    },
    {
      id: 'okr',
      label: TRENAZHER_1.presety.okruzhnost,
      ikonka: '',
      ids: izBlokov(['VI', 'VII', 'VIII']),
    },
    {
      id: 'tr3',
      label: (
        <>
          {TRENAZHER_1.presety.trudnye} <Zvezdy level={3} />
        </>
      ),
      ikonka: '',
      ids: vse.filter((p) => p.level === 3).map((p) => p.id),
    },
  ];

  return (
    <div className="z11-tr">
      <div className="z11-tr__main">
        {pauza === null ? null : (
          <section className="z11-card z1-pauza" aria-labelledby="z1-pauza-title">
            <span className="z1-pauza__ikonka" aria-hidden="true">
              <Piktogramma name="clock" />
            </span>
            <div className="z1-pauza__text">
              <h2 className="z1-pauza__title" id="z1-pauza-title">
                {TRENAZHER_1.naPauze}
              </h2>
              <p>{TRENAZHER_1.naPauzeText(pauza.index + 1, pauza.plan.length, zakryto(pauza))}</p>
            </div>
            <div className="z1-pauza__btns">
              <Button onClick={onProdolzhit} disabled={zagruzka}>
                <Piktogramma name="play" />
                {TRENAZHER_1.prodolzhit}
              </Button>
              <Button variant="ghost" onClick={onZavershit} disabled={zagruzka}>
                {TRENAZHER_1.zavershit}
              </Button>
            </div>
          </section>
        )}

        <section className="z11-tr__blok">
          <h2 className="z11-blok-title">{TRENAZHER_1.otkuda}</h2>
          <div className="z11-istochnik" role="radiogroup" aria-label={TRENAZHER_1.otkuda}>
            {TRENAZHER_1.istochniki.map((i) => (
              <button
                key={i.id}
                type="button"
                role="radio"
                aria-checked={n.istochnik === i.id}
                className={clsx('z11-istochnik__btn', n.istochnik === i.id && 'is-active')}
                onClick={() => izmenit({ istochnik: i.id })}
              >
                <Piktogramma name={IKONKA_ISTOCHNIKA[i.id]} />
                {i.label}
              </button>
            ))}
          </div>
          <p className="z11-istochnik__note">
            {TRENAZHER_1.istochniki.find((i) => i.id === n.istochnik)?.note}
          </p>
        </section>

        <section className="z11-tr__blok">
          <h2 className="z11-blok-title">{TRENAZHER_1.bystrye}</h2>
          <div className="z11-presety">
            {presety.map((p) => (
              <button key={p.id} type="button" className="z11-preset" onClick={() => preset(p.ids)}>
                {p.ikonka === '' ? null : <Piktogramma name={p.ikonka} />}
                {p.label}
              </button>
            ))}
            <button
              type="button"
              className="z11-preset z11-preset--oshibki"
              disabled={oshibki.length === 0}
              onClick={() => preset(oshibki)}
            >
              <Piktogramma name="alert" />
              {TRENAZHER_1.presety.oshibki}
              {oshibokZadach > 0 ? (
                <span className="z11-preset__badge">{oshibokZadach}</span>
              ) : null}
            </button>
          </div>
          <label className="z11-poisk">
            <Piktogramma name="search" />
            <input
              type="search"
              value={poisk}
              placeholder={TRENAZHER_1.poisk}
              aria-label={TRENAZHER_1.poisk}
              onChange={(e) => setPoisk(e.target.value)}
            />
          </label>
        </section>

        <ul className="z11-akk">
          {vidimye.map((r) => {
            const podtipy = r.podtipy.filter((p) => podkhodit(p, needle));
            if (podtipy.length === 0) {
              return null;
            }
            const k = r.podtipy.filter((p) => vybrano.has(p.id)).length;
            const ves = k === r.podtipy.length;
            const otkryt = needle !== '' || otkryty.has(r.id);
            return (
              <li key={r.id} className={clsx('z11-akk__razdel', otkryt && 'is-open')}>
                <div className="z11-akk__head">
                  <button
                    type="button"
                    className="z11-akk__toggle"
                    aria-expanded={otkryt}
                    onClick={() =>
                      setOtkryty((prev) => {
                        const s = new Set(prev);
                        if (s.has(r.id)) s.delete(r.id);
                        else s.add(r.id);
                        return s;
                      })
                    }
                  >
                    <IkonkaBloka1 blok={r.id} className="z11-akk__ikonka" />
                    <span className="z11-akk__name">
                      <Tex text={r.nazvanie} />
                    </span>
                    <span className={clsx('z11-akk__count', k > 0 && 'is-on')}>
                      {TRENAZHER_1.vybrano(k, r.podtipy.length)}
                    </span>
                    <Piktogramma name="chevron" className="z11-akk__chevron" />
                  </button>
                  <Checkbox
                    className="z11-akk__ves"
                    checked={ves}
                    indeterminate={k > 0 && !ves}
                    onChange={(e) =>
                      pereklyuchit(
                        r.podtipy.map((p) => p.id),
                        e.target.checked,
                      )
                    }
                  >
                    {TRENAZHER_1.vesRazdel}
                  </Checkbox>
                </div>
                {otkryt ? (
                  <ul className="z11-akk__list">
                    {podtipy.map((p) => (
                      <li key={p.id} className="z11-akk__podtip">
                        <Checkbox
                          checked={vybrano.has(p.id)}
                          onChange={(e) => pereklyuchit([p.id], e.target.checked)}
                        >
                          <span className="z11-akk__kod">{p.kod}</span> <Tex text={p.title} />
                        </Checkbox>
                        <span className="z11-akk__bank">
                          {novye
                            ? TRENAZHER_1.generiruyutsya
                            : p.vBanke === 0
                              ? TRENAZHER_1.neIzBanka
                              : TRENAZHER_1.vBanke(p.vBanke)}
                        </span>
                        <Zvezdy level={p.level} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
        {needle !== '' && vidimye.every((r) => !r.podtipy.some((p) => podkhodit(p, needle))) ? (
          <p className="z11-tr__pusto">{TRENAZHER_1.nichego}</p>
        ) : null}

        <Statistika razdely={razdely} progress={progress} />
      </div>

      <aside className="z11-tr__side">
        <div className="z11-vybrannaya">
          <h2 className="z11-vybrannaya__title">{TRENAZHER_1.vybrannaya}</h2>
          <div className="z11-vybrannaya__top">
            <span className="z11-vybrannaya__pill">
              {itog.length} {plural(itog.length, ...TRENAZHER_1.tipov)}
            </span>
            {n.podtipy.length > 0 ? (
              <button
                type="button"
                className="z11-vybrannaya__clear"
                onClick={() => izmenit({ podtipy: [] })}
              >
                <Piktogramma name="trash" />
                {TRENAZHER_1.ochistit}
              </button>
            ) : null}
          </div>
          {itog.length === 0 ? (
            <p className="z11-vybrannaya__pusto">{TRENAZHER_1.pustoVybor}</p>
          ) : (
            <ul className="z11-vybrannaya__list">
              {itog.map((p) => (
                <li key={p.id} className="z11-vybrannaya__item">
                  <IkonkaBloka1 blok={p.section} className="z11-vybrannaya__ikonka" />
                  <span className="z11-vybrannaya__text">
                    <span className="z11-vybrannaya__name">
                      <Tex text={p.title} />
                    </span>
                    <Zvezdy level={p.level} />
                  </span>
                  <button
                    type="button"
                    className="z11-vybrannaya__x"
                    aria-label={`Убрать тип ${p.kod}`}
                    onClick={() => pereklyuchit([p.id], false)}
                  >
                    <Piktogramma name="close" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="z11-vybrannaya__row">
            <span>{TRENAZHER_1.kolichestvo}</span>
            <span className="z11-stepper">
              <button
                type="button"
                aria-label="Меньше задач"
                disabled={n.count <= 1}
                onClick={() => izmenit({ count: Math.max(1, n.count - 1) })}
              >
                −
              </button>
              <output aria-live="polite">{n.count}</output>
              <button
                type="button"
                aria-label="Больше задач"
                disabled={n.count >= 50}
                onClick={() => izmenit({ count: Math.min(50, n.count + 1) })}
              >
                +
              </button>
            </span>
          </div>

          <fieldset className="z11-vybrannaya__uroven">
            <legend>{TRENAZHER_1.uroven}</legend>
            {([0, 1, 2, 3] as const).map((u) => (
              <Radio
                key={u}
                name="z1-uroven"
                checked={n.uroven === u}
                onChange={() => izmenit({ uroven: u })}
              >
                {u === 0 ? (
                  TRENAZHER_1.vseUrovni
                ) : (
                  <>
                    {TRENAZHER_1.tolko} <Zvezdy level={u as Level} />
                  </>
                )}
              </Radio>
            ))}
          </fieldset>

          <Checkbox
            className="z11-vybrannaya__podskazki"
            checked={n.podskazki}
            onChange={(e) => izmenit({ podskazki: e.target.checked })}
          >
            {TRENAZHER_1.podskazki}
          </Checkbox>

          {malo ? (
            <div className="z11-malo" role="status">
              <p className="z11-malo__title">{TRENAZHER_1.malo(vBankeVsego)}</p>
              <p className="z11-malo__text">{TRENAZHER_1.maloNote}</p>
              <Button variant="secondary" size="sm" onClick={() => izmenit({ istochnik: 'mix' })}>
                {TRENAZHER_1.dobavitNovye}
              </Button>
            </div>
          ) : null}

          <Button
            className="z11-vybrannaya__start"
            disabled={
              itog.length === 0 || zagruzka || (n.istochnik === 'bank' && vBankeVsego === 0)
            }
            onClick={onStart}
          >
            <Piktogramma name="play" />
            {zagruzka ? TRENAZHER_1.gotovim : TRENAZHER_1.start}
          </Button>
          {itog.length > 0 && doo > 0 ? (
            <p className="z11-vybrannaya__vremya">
              <Piktogramma name="clock" />
              {TRENAZHER_1.vremya(ot, doo)}
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

/** Статистика по прототипам: сколько решено и сколько верно. */
function Statistika({ razdely, progress }: { razdely: RazdelInfo[]; progress: StoreProgress }) {
  const stroki = razdely
    .flatMap((r) => r.podtipy)
    .filter((p) => (progress.kinds[p.id]?.done ?? 0) > 0);
  if (stroki.length === 0) {
    return null;
  }
  return (
    <Details title={TRENAZHER_1.statistika} className="z11-stat">
      <table className="z11-stat__table">
        <tbody>
          {stroki.map((p) => {
            const t = progress.kinds[p.id];
            return (
              <tr key={p.id}>
                <th scope="row">
                  <span className="z11-akk__kod">{p.kod}</span> <Tex text={p.title} />
                </th>
                <td>
                  {t?.right ?? 0} из {t?.done ?? 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Button variant="ghost" size="sm" onClick={() => progress1.reset()}>
        {TRENAZHER_1.sbros}
      </Button>
    </Details>
  );
}
