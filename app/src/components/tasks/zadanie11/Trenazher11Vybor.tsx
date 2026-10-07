'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, Checkbox, Details, Radio } from '@/components/ui';
import { TRENAZHER_11 } from '@/content/zadanie11';
import { plural } from '@/lib/plural';
import type { StoreProgress } from '@/lib/progressStore';
import type { SsylkiRazdela } from '@/lib/zadanie11/trenazher/dannye';
import { trenazher11 } from '@/lib/zadanie11/progress';
import {
  primernoeVremya,
  vTrenirovke,
  type Istochnik,
  type Nastroyki,
  type PodtipInfo,
  type RazdelInfo,
} from '@/lib/zadanie11/trenazher/sessiya';
import type { Level, SectionId } from '@/lib/zadanie11/types';
import { IkonkaRazdela, Piktogramma, tsvetRazdela, Zvezdy } from './Piktogrammy';

const IKONKA_ISTOCHNIKA: Record<Istochnik, string> = { bank: 'doc', mix: 'layers', new: 'sparkle' };

const DVIZHENIE: SectionId[] = ['DP', 'PT', 'VD', 'OK'];

export interface Trenazher11VyborProps {
  razdely: RazdelInfo[];
  /** Ссылки раздела: якорь теории — для кнопки «Теория» в шапке раздела. */
  ssylki: Record<SectionId, SsylkiRazdela>;
  base: string;
  n: Nastroyki;
  izmenit: (patch: Partial<Nastroyki>) => void;
  /** Сколько задач банка есть по выбранным типам. */
  vBankeVsego: number;
  /** Подтипы из списка ошибок и сколько там задач. */
  oshibki: string[];
  oshibokZadach: number;
  progress: StoreProgress;
  zagruzka: boolean;
  onStart: () => void;
}

/** Подходит ли подтип под строку поиска: название, код, сюжетные слова. */
function podkhodit(p: PodtipInfo, needle: string): boolean {
  if (needle === '') {
    return true;
  }
  return (
    p.title.toLowerCase().includes(needle) ||
    p.kod.toLowerCase().includes(needle) ||
    p.keywords.some((k) => k.toLowerCase().includes(needle))
  );
}

/**
 * Экран выбора тренировки (макет trenazher-vybor.png): источник
 * задач, быстрые настройки, поиск, аккордеон разделов с подтипами
 * и правая карточка «Выбранная тренировка».
 */
export function Trenazher11Vybor({
  razdely,
  ssylki,
  base,
  n,
  izmenit,
  vBankeVsego,
  oshibki,
  oshibokZadach,
  progress,
  zagruzka,
  onStart,
}: Trenazher11VyborProps) {
  const [poisk, setPoisk] = useState('');
  const [otkryty, setOtkryty] = useState<Set<SectionId>>(new Set());
  const needle = poisk.trim().toLowerCase();
  const vidimye = razdely.filter((r) => !(n.istochnik === 'bank' && r.id === 'RZ'));
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

  function preset(ids: string[], patch: Partial<Nastroyki> = {}) {
    izmenit({ podtipy: ids, uroven: 0, ...patch });
  }

  const izRazdelov = (sekcii: SectionId[]) =>
    vse.filter((p) => sekcii.includes(p.section)).map((p) => p.id);
  const bezRazminki = vse.filter((p) => p.section !== 'RZ').map((p) => p.id);
  const presety: { id: string; label: React.ReactNode; ikonka: string; ids: string[] }[] = [
    { id: 'vse', label: TRENAZHER_11.presety.vse, ikonka: 'grid', ids: bezRazminki },
    {
      id: 'pr',
      label: TRENAZHER_11.presety.procenty,
      ikonka: 'percent',
      ids: izRazdelov(['PR', 'SM']),
    },
    { id: 'dv', label: TRENAZHER_11.presety.dvizhenie, ikonka: 'car', ids: izRazdelov(DVIZHENIE) },
    { id: 'vd', label: TRENAZHER_11.presety.voda, ikonka: 'ship', ids: izRazdelov(['VD']) },
    { id: 'rb', label: TRENAZHER_11.presety.rabota, ikonka: 'gear', ids: izRazdelov(['RB']) },
    {
      id: 'tr',
      label: (
        <>
          {TRENAZHER_11.presety.trudnye} <Zvezdy level={3} />
        </>
      ),
      ikonka: '',
      ids: vse.filter((p) => p.level === 3).map((p) => p.id),
    },
  ];

  const vsegoResheno = Object.values(progress.kinds).reduce((s, k) => s + (k?.done ?? 0), 0);
  const vsegoVerno = Object.values(progress.kinds).reduce((s, k) => s + (k?.right ?? 0), 0);
  const osvoeno = vse.filter((p) => (progress.kinds[p.id]?.right ?? 0) > 0).length;

  return (
    <div className="z11-tr">
      <div className="z11-tr__main">
        <section className="z11-tr__progress" aria-label={TRENAZHER_11.progress.title}>
          <div className="z11-tr__progress-text">
            <p className="z11-tr__progress-title">{TRENAZHER_11.progress.title}</p>
            {vsegoResheno === 0 ? (
              <p className="z11-tr__progress-lead">{TRENAZHER_11.progress.pusto}</p>
            ) : (
              <p className="z11-tr__progress-lead">
                {TRENAZHER_11.progress.resheno(vsegoVerno, vsegoResheno)} ·{' '}
                {TRENAZHER_11.progress.tipov(osvoeno, vse.length)}
                {oshibokZadach > 0 ? ` · ${TRENAZHER_11.progress.oshibok(oshibokZadach)}` : ''}
              </p>
            )}
          </div>
          <div className="z11-tr__progress-btns">
            <button
              type="button"
              className="z11-preset z11-preset--oshibki"
              disabled={oshibki.length === 0}
              onClick={() => preset(oshibki)}
            >
              <Piktogramma name="alert" />
              {TRENAZHER_11.presety.oshibki}
              {oshibokZadach > 0 ? (
                <span className="z11-preset__badge">{oshibokZadach}</span>
              ) : null}
            </button>
          </div>
          <Statistika razdely={razdely} progress={progress} />
        </section>

        <section className="z11-tr__blok">
          <h2 className="z11-blok-title">{TRENAZHER_11.otkuda}</h2>
          <div className="z11-istochnik" role="radiogroup" aria-label={TRENAZHER_11.otkuda}>
            {TRENAZHER_11.istochniki.map((i) => (
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
            {TRENAZHER_11.istochniki.find((i) => i.id === n.istochnik)?.note}
          </p>
        </section>

        <section className="z11-tr__blok">
          <h2 className="z11-blok-title">{TRENAZHER_11.bystrye}</h2>
          <div className="z11-presety">
            {presety.map((p) => (
              <button key={p.id} type="button" className="z11-preset" onClick={() => preset(p.ids)}>
                {p.ikonka === '' ? null : <Piktogramma name={p.ikonka} />}
                {p.label}
              </button>
            ))}
          </div>
          <label className="z11-poisk">
            <Piktogramma name="search" />
            <input
              type="search"
              value={poisk}
              placeholder={TRENAZHER_11.poisk}
              aria-label={TRENAZHER_11.poisk}
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
              <li
                key={r.id}
                className={clsx('z11-akk__razdel', tsvetRazdela(r.id), otkryt && 'is-open')}
              >
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
                    <IkonkaRazdela section={r.id} className="z11-akk__ikonka" />
                    <span className="z11-akk__name">{r.nazvanie}</span>
                    <span className={clsx('z11-akk__count', k > 0 && 'is-on')}>
                      {TRENAZHER_11.vybrano(k, r.podtipy.length)}
                    </span>
                    <Piktogramma name="chevron" className="z11-akk__chevron" />
                  </button>
                  {ssylki[r.id]?.teoriya ? (
                    <Link
                      className="z11-akk__teoriya"
                      href={`${base}/teoriya/#teoriya-${ssylki[r.id].teoriya}`}
                      title={`${TRENAZHER_11.teoriyaRazdela}: ${r.nazvanie}`}
                    >
                      <Piktogramma name="book" />
                      <span>{TRENAZHER_11.teoriyaRazdela}</span>
                    </Link>
                  ) : null}
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
                    {TRENAZHER_11.vesRazdel}
                  </Checkbox>
                </div>
                {otkryt ? (
                  <ul className="z11-akk__list">
                    {podtipy.map((p) => (
                      <li key={p.id} className="z11-akk__podtip" title={p.kod}>
                        <Checkbox
                          checked={vybrano.has(p.id)}
                          onChange={(e) => pereklyuchit([p.id], e.target.checked)}
                        >
                          {p.title}
                        </Checkbox>
                        <span className="z11-akk__bank">
                          {novye
                            ? TRENAZHER_11.generiruyutsya
                            : r.id === 'RZ'
                              ? TRENAZHER_11.vRazminke(p.vBanke)
                              : TRENAZHER_11.vBanke(p.vBanke)}
                        </span>
                        <Zvezdy level={p.level} section={p.section} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
        {needle !== '' && vidimye.every((r) => !r.podtipy.some((p) => podkhodit(p, needle))) ? (
          <p className="z11-tr__pusto">{TRENAZHER_11.nichego}</p>
        ) : null}
      </div>

      <aside className="z11-tr__side">
        <div className="z11-vybrannaya">
          <h2 className="z11-vybrannaya__title">{TRENAZHER_11.vybrannaya}</h2>
          <div className="z11-vybrannaya__top">
            <span className="z11-vybrannaya__pill">
              {itog.length} {plural(itog.length, ...TRENAZHER_11.tipov)}
            </span>
            {n.podtipy.length > 0 ? (
              <button
                type="button"
                className="z11-vybrannaya__clear"
                onClick={() => izmenit({ podtipy: [] })}
              >
                <Piktogramma name="trash" />
                {TRENAZHER_11.ochistit}
              </button>
            ) : null}
          </div>
          {itog.length === 0 ? (
            <p className="z11-vybrannaya__pusto">{TRENAZHER_11.pustoVybor}</p>
          ) : (
            <ul className="z11-vybrannaya__list">
              {itog.map((p) => (
                <li key={p.id} className="z11-vybrannaya__item">
                  <IkonkaRazdela section={p.section} className="z11-vybrannaya__ikonka" />
                  <span className="z11-vybrannaya__text">
                    <span className="z11-vybrannaya__name">{p.title}</span>
                    <Zvezdy level={p.level} section={p.section} />
                  </span>
                  <button
                    type="button"
                    className="z11-vybrannaya__x"
                    aria-label={`Убрать «${p.title}»`}
                    onClick={() => pereklyuchit([p.id], false)}
                  >
                    <Piktogramma name="close" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="z11-vybrannaya__row">
            <span>{TRENAZHER_11.kolichestvo}</span>
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
            <legend>{TRENAZHER_11.uroven}</legend>
            {([0, 1, 2, 3] as const).map((u) => (
              <Radio
                key={u}
                name="z11-uroven"
                checked={n.uroven === u}
                onChange={() => izmenit({ uroven: u })}
              >
                {u === 0 ? (
                  TRENAZHER_11.vseUrovni
                ) : (
                  <>
                    {TRENAZHER_11.tolko} <Zvezdy level={u as Level} />
                  </>
                )}
              </Radio>
            ))}
            <p className="z11-uroven__note">{TRENAZHER_11.urovenNote}</p>
          </fieldset>

          <Checkbox
            className="z11-vybrannaya__podskazki"
            checked={n.podskazki}
            onChange={(e) => izmenit({ podskazki: e.target.checked })}
          >
            {TRENAZHER_11.podskazki}
          </Checkbox>

          {malo ? (
            <div className="z11-malo" role="status">
              <p className="z11-malo__title">{TRENAZHER_11.malo(vBankeVsego)}</p>
              <p className="z11-malo__text">{TRENAZHER_11.maloNote}</p>
              <Button variant="secondary" size="sm" onClick={() => izmenit({ istochnik: 'mix' })}>
                {TRENAZHER_11.dobavitNovye}
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
            {zagruzka ? TRENAZHER_11.gotovim : TRENAZHER_11.start}
          </Button>
          {itog.length > 0 && doo > 0 ? (
            <p className="z11-vybrannaya__vremya">
              <Piktogramma name="clock" />
              {TRENAZHER_11.vremya(ot, doo)}
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

/** Статистика по подтипам: сколько решено и сколько верно. */
function Statistika({ razdely, progress }: { razdely: RazdelInfo[]; progress: StoreProgress }) {
  const stroki = razdely
    .flatMap((r) => r.podtipy)
    .filter((p) => (progress.kinds[p.id]?.done ?? 0) > 0);
  if (stroki.length === 0) {
    return null;
  }
  return (
    <Details title={TRENAZHER_11.statistika} className="z11-stat">
      <table className="z11-stat__table">
        <tbody>
          {stroki.map((p) => {
            const t = progress.kinds[p.id];
            return (
              <tr key={p.id} title={p.kod}>
                <th scope="row">{p.title}</th>
                <td>
                  {t?.right ?? 0} из {t?.done ?? 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Button variant="ghost" size="sm" onClick={() => trenazher11.reset()}>
        {TRENAZHER_11.sbros}
      </Button>
    </Details>
  );
}
