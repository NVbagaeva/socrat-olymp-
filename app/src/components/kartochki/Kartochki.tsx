'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Button, Checkbox, ProgressBar } from '@/components/ui';
import { KARTOCHKI_UI as T } from '@/content/kartochkiUi';
import {
  itog,
  menyaetKorobki,
  neznakoma,
  novayaSessiya,
  otmetit,
  otsenit,
  sobratOchered,
  tekushchaya,
  vyuchenoPoTemam,
  zakonchena,
  type Rezhim,
  type Sessiya,
} from '@/lib/kartochki/leitner';
import type { KolodaGotovaya } from '@/lib/kartochki/podgotovka';
import { sbrositProgress, useProgressKolody, zapisatProgress } from '@/lib/kartochki/progress';
import { persistent, type PersistentStore } from '@/lib/storage';
import { KartochkaFlip } from './KartochkaFlip';

/** Начатая сессия: переживает переход в теорию и перезагрузку. */
interface Nachataya {
  s: Sessiya;
  /** Сдвиг вариантов чертежа: повороты у разных сессий разные. */
  seed: number;
}

const sessii = new Map<number, PersistentStore<Nachataya | null>>();
function sessiyaStore(task: number): PersistentStore<Nachataya | null> {
  let s = sessii.get(task);
  if (s === undefined) {
    s = persistent<Nachataya | null>(`kartochki:${task}:sessiya:v1`, null);
    sessii.set(task, s);
  }
  return s;
}

/** Запись из хранилища годится, только если все карточки ещё в колоде. */
function godnaya(n: Nachataya | null, ids: ReadonlySet<string>): n is Nachataya {
  return (
    n !== null &&
    typeof n === 'object' &&
    Array.isArray(n.s?.ochered) &&
    typeof n.s.poz === 'number' &&
    n.s.ochered.every((id) => typeof id === 'string' && ids.has(id)) &&
    !zakonchena(n.s)
  );
}

type Ekran = { vid: 'start' } | { vid: 'sessiya' } | { vid: 'itog'; s: Sessiya };

const REZHIMY: readonly Rezhim[] = ['vse', 'temy', 'neznakomye', 'bystro'];

/**
 * Вкладка «Карточки»: проверка теории номера по системе Лейтнера.
 * Один экран на все номера — всё своё у номера в колоде.
 */
export function Kartochki({ koloda }: { koloda: KolodaGotovaya }) {
  const { task } = koloda;
  const progress = useProgressKolody(task);
  const store = sessiyaStore(task);
  const sohranennaya = useSyncExternalStore(store.subscribe, store.read, store.initial);

  const ids = useMemo(() => new Set(koloda.kartochki.map((k) => k.id)), [koloda]);
  const poId = useMemo(() => new Map(koloda.kartochki.map((k) => [k.id, k])), [koloda]);
  const temaPo = useMemo(() => new Map(koloda.podtemy.map((t) => [t.id, t.title])), [koloda]);
  const nachataya = godnaya(sohranennaya, ids) ? sohranennaya : null;

  const [ekran, setEkran] = useState<Ekran>({ vid: 'start' });
  const [rezhim, setRezhim] = useState<Rezhim>('vse');
  const [temy, setTemy] = useState<readonly string[]>([]);
  const [sbros, setSbros] = useState(false);
  const verh = useRef<HTMLElement>(null);

  /* Смена экрана (старт → карточки → итог) — к началу экрана карточек:
     над ним шапка раздела, и карточка иначе оставалась бы ниже сгиба. */
  const [smena, setSmena] = useState(0);
  useEffect(() => {
    if (smena === 0) return;
    const node = verh.current;
    if (node === null) return;
    const top = node.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.35) {
      const plavno = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      node.scrollIntoView({ block: 'start', behavior: plavno ? 'smooth' : 'auto' });
    }
  }, [smena]);
  function pokazat(e: Ekran) {
    setEkran(e);
    setSmena((n) => n + 1);
  }

  const vyucheno = vyuchenoPoTemam(koloda.kartochki, progress);
  const vsego = koloda.kartochki.length;
  const neznakomykh = koloda.kartochki.filter((k) => neznakoma(progress, k.id)).length;

  function nachat(r: Rezhim, sostav?: readonly string[]) {
    const ochered =
      sostav === undefined
        ? sobratOchered(r, koloda.kartochki, progress, Math.random, temy)
        : sobratOchered(
            'vse',
            koloda.kartochki.filter((k) => sostav.includes(k.id)),
            progress,
            Math.random,
          );
    if (ochered.length === 0) return;
    store.write({ s: novayaSessiya(r, ochered), seed: Math.floor(Math.random() * 1000) });
    pokazat({ vid: 'sessiya' });
  }

  function zavershit(s: Sessiya) {
    store.write(null);
    pokazat(s.poz === 0 ? { vid: 'start' } : { vid: 'itog', s });
  }

  function otvet(znayu: boolean) {
    if (nachataya === null) return;
    const id = tekushchaya(nachataya.s);
    if (id === null) return;
    if (menyaetKorobki(nachataya.s)) zapisatProgress(task, otsenit(progress, id, znayu));
    const dalshe = otmetit(nachataya.s, znayu);
    if (zakonchena(dalshe)) zavershit(dalshe);
    else store.write({ ...nachataya, s: dalshe });
  }

  /* ── Сессия ── */
  if (ekran.vid === 'sessiya' && nachataya !== null) {
    const { s, seed } = nachataya;
    const id = tekushchaya(s);
    const k = id === null ? undefined : poId.get(id);
    if (k !== undefined) {
      return (
        <section ref={verh} className="kart" aria-label={T.title}>
          <div className="kart-top">
            <span className="kart-top__rezhim">{T.rezhimy[s.rezhim].title}</span>
            <span className="kart-top__schyot t-caption">
              {T.schyot(s.poz + 1, s.ochered.length)}
            </span>
            <Button variant="ghost" size="sm" onClick={() => zavershit(s)}>
              {T.zakonchit}
            </Button>
          </div>
          <ProgressBar
            className="kart-top__bar"
            value={(s.poz / s.ochered.length) * 100}
            label={T.sessiyaAria}
          />
          <KartochkaFlip
            key={`${s.poz}:${k.id}`}
            k={k}
            tema={temaPo.get(k.topic) ?? ''}
            variant={seed + s.poz}
            onOtvet={otvet}
          />
          <p className="kart-klavishi t-caption">{T.klavishi}</p>
        </section>
      );
    }
  }

  /* ── Итог ── */
  if (ekran.vid === 'itog') {
    const it = itog(ekran.s, koloda.kartochki);
    return (
      <section ref={verh} className="kart" aria-labelledby="kart-itog-title">
        <div className="card kart-itog">
          <h2 className="t-h3" id="kart-itog-title">
            {T.itogTitle}
          </h2>
          <div className="kart-itog__chisla">
            <p className="kart-itog__chislo kart-itog__chislo--da">
              <span className="t-data-lg">{it.znayu}</span>
              <span className="t-caption">{T.itogZnayu}</span>
            </p>
            <p className="kart-itog__chislo kart-itog__chislo--ne">
              <span className="t-data-lg">{it.povtorit}</span>
              <span className="t-caption">{T.itogPovtorit}</span>
            </p>
          </div>
          {it.slabye.length === 0 ? (
            <p className="kart-itog__note">{T.itogVseZnayu}</p>
          ) : (
            <>
              <h3 className="t-label kart-itog__sub">{T.itogSlabye}</h3>
              <ul className="kart-itog__temy">
                {it.slabye.map((t) => (
                  <li key={t.topic}>
                    <span dangerouslySetInnerHTML={{ __html: temaPo.get(t.topic) ?? t.topic }} />
                    <span className="kart-itog__count">{t.oshibok}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {ekran.s.rezhim === 'bystro' ? (
            <p className="kart-itog__note t-caption">{T.itogBystro}</p>
          ) : null}
          <div className="kart-itog__knopki">
            {it.povtorit > 0 ? (
              <Button
                onClick={() =>
                  nachat(ekran.s.rezhim === 'bystro' ? 'bystro' : 'vse', it.povtoritIds)
                }
              >
                {T.povtoritNeznakomye}
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => pokazat({ vid: 'start' })}>
              {T.gotovo}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  /* ── Старт ── */
  const nechego =
    rezhim === 'temy' && temy.length === 0
      ? T.nechego.temy
      : rezhim === 'neznakomye' && neznakomykh === 0
        ? T.nechego.neznakomye
        : null;
  const skolko: Record<Rezhim, number> = {
    vse: vsego,
    temy: koloda.kartochki.filter((k) => temy.includes(k.topic)).length,
    neznakomye: neznakomykh,
    bystro: Math.min(10, vsego),
  };

  return (
    <section ref={verh} className="kart" aria-labelledby="kart-title">
      <div className="kart-start">
        <div className="card kart-start__main">
          <h2 className="t-h3" id="kart-title">
            {T.title}
          </h2>
          <p className="kart-start__lead">{T.lead}</p>
          <div className="kart-vyucheno">
            <p className="kart-vyucheno__text">
              <strong>{T.vyucheno(task, vyucheno.vsego, vsego)}</strong>
            </p>
            <ProgressBar
              value={(vyucheno.vsego / vsego) * 100}
              label={T.vyucheno(task, vyucheno.vsego, vsego)}
            />
            <p className="t-caption kart-vyucheno__note">{T.vyuchenoPoyasnenie}</p>
          </div>

          {nachataya !== null ? (
            <Button className="kart-start__prodolzhit" onClick={() => pokazat({ vid: 'sessiya' })}>
              {T.prodolzhit(nachataya.s.ochered.length - nachataya.s.poz)}
            </Button>
          ) : null}

          <fieldset className="kart-rezhimy">
            <legend className="t-label">{T.rezhimTitle}</legend>
            {REZHIMY.map((r) => (
              <label className={clsx('kart-rezhim', rezhim === r && 'is-active')} key={r}>
                <input
                  type="radio"
                  name="kart-rezhim"
                  value={r}
                  checked={rezhim === r}
                  onChange={() => setRezhim(r)}
                />
                <span className="kart-rezhim__text">
                  <span className="kart-rezhim__title">
                    {T.rezhimy[r].title}
                    <span className="kart-rezhim__count">{T.kartochek(skolko[r])}</span>
                  </span>
                  <span className="kart-rezhim__lead">{T.rezhimy[r].lead}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {rezhim === 'temy' ? (
            <fieldset className="kart-temy">
              <legend className="sr-only">{T.rezhimy.temy.title}</legend>
              <button
                type="button"
                className="kart-temy__vse"
                onClick={() =>
                  setTemy(
                    temy.length === koloda.podtemy.length ? [] : koloda.podtemy.map((t) => t.id),
                  )
                }
              >
                {temy.length === koloda.podtemy.length ? T.snyatVse : T.vybratVse}
              </button>
              {koloda.podtemy.map((t) => (
                <Checkbox
                  key={t.id}
                  checked={temy.includes(t.id)}
                  onChange={(e) =>
                    setTemy(e.target.checked ? [...temy, t.id] : temy.filter((x) => x !== t.id))
                  }
                >
                  <span dangerouslySetInnerHTML={{ __html: t.title }} />
                </Checkbox>
              ))}
            </fieldset>
          ) : null}

          {nechego === null ? null : (
            <p className="kart-start__nechego" role="status">
              {nechego}
            </p>
          )}
          <Button size="lg" disabled={nechego !== null} onClick={() => nachat(rezhim)}>
            {T.nachat}
          </Button>
          <p className="kart-klavishi t-caption">{T.klavishi}</p>
        </div>

        <div className="card kart-start__temy">
          <h3 className="card__title">{T.poTemamTitle}</h3>
          <ul className="kart-pbar">
            {koloda.podtemy.map((t) => {
              const p = vyucheno.temy[t.id] ?? { vyucheno: 0, vsego: 0 };
              return (
                <li className="kart-pbar__item" key={t.id}>
                  <span className="kart-pbar__row">
                    <span dangerouslySetInnerHTML={{ __html: t.title }} />
                    <span className="kart-pbar__n">{T.vyuchenoKorotko(p.vyucheno, p.vsego)}</span>
                  </span>
                  <ProgressBar
                    value={p.vsego === 0 ? 0 : (p.vyucheno / p.vsego) * 100}
                    label={t.podpis}
                  />
                </li>
              );
            })}
          </ul>
          {sbros ? (
            <div className="kart-sbros">
              <p className="t-caption">{T.sbrosPodtverdit}</p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  sbrositProgress(task);
                  store.write(null);
                  setSbros(false);
                }}
              >
                {T.sbrosDa}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSbros(false)}>
                {T.sbrosNet}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="kart-sbros__open"
              onClick={() => setSbros(true)}
            >
              {T.sbros}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
