'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChertezhSkhemy } from '@/components/skhemy/ChertezhSkhemy';
import { Tex } from '@/components/ui/Tex';
import { KARTOCHKI_18, SKHEMA_18 } from '@/content/zadanie18';
import { SOBRANNYE, skhema18 } from '@/content/zadanie18/spisok';
import type { Sostoyanie } from '@/lib/skhemy/ekran';
import { VID_ISHODNYY, type Tochki, type Vid } from '@/lib/skhemy/tipy';
import {
  SOBYTIE_UCHIT,
  kPovtoreniyu,
  neznakomye,
  otmetit18,
  poryadokKolody,
  useProgress18,
  type PodborKolody,
} from '@/lib/zadanie18/progress';
import { trebuetsyaSkhema18 } from '@/lib/zadanie18/skhemy';
import { YAKOR_KARTOCHEK } from './Vvodnaya18';

type Rezhim = 'uznay' | 'vspomni';

/** Порог свайпа, px. */
const SVAYP = 80;

const BEZ_PODPISEY: Sostoyanie = { lit: new Set(), shag: null, podpisi: false };
const S_PODPISYAMI: Sostoyanie = { lit: new Set(), shag: null, podpisi: true };

interface Karta {
  id: string;
  /** Положение и вид чертежа лицевой стороны «Узнай схему»: случайные. */
  t: Tochki;
  vid: Vid;
}

interface Sessiya {
  rezhim: Rezhim;
  karty: Karta[];
  i: number;
  perevernuta: boolean;
  /** id → ответ «Знаю» в этой сессии. */
  otvety: Record<string, boolean>;
}

function sobratKartu(id: string): Karta {
  const skhema = trebuetsyaSkhema18(id);
  return {
    id,
    t: skhema.sluchaynaya(Math.random),
    vid: { ugol: Math.random() * 360, otrazhenie: Math.random() < 0.5 ? -1 : 1 },
  };
}

/**
 * Карточки на запоминание: два режима, переворот, «Знаю / Не знаю»
 * кнопками или свайпом, итог сессии и повтор незнакомых. Порядок
 * колоды — по коробкам Лейтнера (lib/zadanie18/progress): ответы
 * пишутся в общее хранилище, поэтому статусы на плитках и в плашке
 * меняются сразу.
 */
export function Kartochki18() {
  const progress = useProgress18();
  const [sessiya, setSessiya] = useState<Sessiya | null>(null);
  const [sdvig, setSdvig] = useState(0);
  const start = useRef<{ x: number; id: number } | null>(null);

  function nachat(rezhim: Rezhim, ids?: readonly string[]): void {
    const koloda = poryadokKolody(ids ?? SOBRANNYE.map((s) => s.id), progress);
    setSessiya({ rezhim, karty: koloda.map(sobratKartu), i: 0, perevernuta: false, otvety: {} });
  }

  /* Колода по умолчанию — схемы, которые пора повторить сегодня; если
     таких нет — вся колода. */
  function nachatPoPodboru(rezhim: Rezhim, podbor: PodborKolody): void {
    const vse = SOBRANNYE.map((s) => s.id);
    const ids =
      podbor === 'neznakomye' ? neznakomye(vse, progress) : kPovtoreniyu(vse, progress, Date.now());
    nachat(rezhim, ids.length > 0 ? ids : vse);
  }

  /* Кнопки вводной плашки запускают сессию событием. */
  const nachatRef = useRef(nachatPoPodboru);
  useEffect(() => {
    nachatRef.current = nachatPoPodboru;
  });
  useEffect(() => {
    const slushat = (e: Event) => {
      const podbor = (e as CustomEvent<PodborKolody>).detail;
      nachatRef.current('uznay', podbor);
      document
        .getElementById(YAKOR_KARTOCHEK)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener(SOBYTIE_UCHIT, slushat);
    return () => window.removeEventListener(SOBYTIE_UCHIT, slushat);
  }, []);

  function otvetit(znayu: boolean): void {
    if (sessiya === null) return;
    const karta = sessiya.karty[sessiya.i];
    if (karta === undefined || !sessiya.perevernuta) return;
    otmetit18(karta.id, znayu);
    setSdvig(0);
    setSessiya({
      ...sessiya,
      i: sessiya.i + 1,
      perevernuta: false,
      otvety: { ...sessiya.otvety, [karta.id]: znayu },
    });
  }

  function perevernut(): void {
    if (sessiya === null) return;
    setSessiya({ ...sessiya, perevernuta: !sessiya.perevernuta });
  }

  function nazhatie(e: PointerEvent<HTMLDivElement>): void {
    start.current = { x: e.clientX, id: e.pointerId };
  }
  function dvizhenie(e: PointerEvent<HTMLDivElement>): void {
    if (start.current === null || start.current.id !== e.pointerId || !sessiya?.perevernuta) return;
    setSdvig(e.clientX - start.current.x);
  }
  function otpuskanie(e: PointerEvent<HTMLDivElement>): void {
    const s = start.current;
    start.current = null;
    if (s === null || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    if (sessiya?.perevernuta && Math.abs(dx) > SVAYP) {
      otvetit(dx > 0);
      return;
    }
    setSdvig(0);
    /* Короткое касание без сдвига — переворот. */
    if (Math.abs(dx) < 6) perevernut();
  }

  return (
    <section id={YAKOR_KARTOCHEK} className="z18-kart" aria-labelledby="z18-kart-title">
      <h2 id="z18-kart-title" className="t-h2">
        {KARTOCHKI_18.title}
      </h2>
      <p className="z18-kart__lead">{KARTOCHKI_18.lead}</p>

      {sessiya === null ? (
        <ul className="z18-kart__rezhimy">
          {KARTOCHKI_18.rezhimy.map((r) => (
            <li key={r.id} className="z18-kart__rezhim">
              <p className="z18-kart__rezhim-title">{r.title}</p>
              <p className="z18-kart__rezhim-tekst">{r.text}</p>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => nachatPoPodboru(r.id as Rezhim, 'segodnya')}
              >
                {KARTOCHKI_18.nachat}
              </button>
            </li>
          ))}
        </ul>
      ) : sessiya.i >= sessiya.karty.length ? (
        <Itog
          sessiya={sessiya}
          povtorit={(ids) => nachat(sessiya.rezhim, ids)}
          zanovo={() => nachat(sessiya.rezhim)}
          zakryt={() => setSessiya(null)}
        />
      ) : (
        <div className="z18-kart__sessiya">
          <div className="z18-kart__verh">
            <span>{KARTOCHKI_18.kartochka(sessiya.i + 1, sessiya.karty.length)}</span>
            <span className="z18-kart__korobka">
              {KARTOCHKI_18.korobka(progress[sessiya.karty[sessiya.i]!.id]?.korobka ?? 1)}
            </span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setSessiya(null)}
            >
              {KARTOCHKI_18.vyyti}
            </button>
          </div>
          <Karta18
            karta={sessiya.karty[sessiya.i]!}
            rezhim={sessiya.rezhim}
            perevernuta={sessiya.perevernuta}
            sdvig={sdvig}
            onPointerDown={nazhatie}
            onPointerMove={dvizhenie}
            onPointerUp={otpuskanie}
            onPointerCancel={() => {
              start.current = null;
              setSdvig(0);
            }}
            onPerevernut={perevernut}
          />
          {sessiya.perevernuta ? (
            <>
              <div className="z18-kart__otvety">
                <button type="button" className="btn btn--secondary" onClick={() => otvetit(false)}>
                  {SKHEMA_18.neZnayu}
                </button>
                <button type="button" className="btn btn--primary" onClick={() => otvetit(true)}>
                  {SKHEMA_18.znayu}
                </button>
              </div>
              <p className="z18-kart__podskazka">{KARTOCHKI_18.svayp}</p>
            </>
          ) : (
            <div className="z18-kart__otvety">
              <button type="button" className="btn btn--primary" onClick={perevernut}>
                {KARTOCHKI_18.perevernut}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

interface Karta18Props {
  karta: Karta;
  rezhim: Rezhim;
  perevernuta: boolean;
  sdvig: number;
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: () => void;
  onPerevernut: () => void;
}

function Karta18({ karta, rezhim, perevernuta, sdvig, onPerevernut, ...ukazatel }: Karta18Props) {
  const s = skhema18(karta.id);
  const skhema = trebuetsyaSkhema18(karta.id);
  if (s === undefined) return null;
  const naklon = Math.max(-12, Math.min(12, sdvig / 14));
  return (
    <div
      className={clsx(
        'z18-karta',
        perevernuta && 'is-perevernuta',
        sdvig > SVAYP && 'is-znayu',
        sdvig < -SVAYP && 'is-ne-znayu',
      )}
      style={sdvig === 0 ? undefined : { transform: `translateX(${sdvig}px) rotate(${naklon}deg)` }}
      {...ukazatel}
    >
      <div className="z18-karta__vnutri">
        {/* Лицевая сторона. */}
        <div
          className="z18-karta__storona z18-karta__storona--lico"
          role="button"
          aria-label={`${KARTOCHKI_18.perevernut}: ${rezhim === 'uznay' ? KARTOCHKI_18.voprosUznay : s.nazvanie}`}
          tabIndex={perevernuta ? -1 : 0}
          aria-hidden={perevernuta}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onPerevernut();
            }
          }}
        >
          {rezhim === 'uznay' ? (
            <>
              <ChertezhSkhemy
                skhema={skhema}
                t={karta.t}
                vid={karta.vid}
                sost={BEZ_PODPISEY}
                opisanie={KARTOCHKI_18.voprosUznay}
                dolyaVysoty={0.66}
                maxVysota={300}
              />
              <p className="z18-karta__vopros">{KARTOCHKI_18.voprosUznay}</p>
            </>
          ) : (
            <>
              <p className="z18-karta__nazvanie">{s.nazvanie}</p>
              <p className="z18-karta__dano">
                <Tex text={s.dano} />
              </p>
              <p className="z18-karta__vopros">{KARTOCHKI_18.voprosVspomni}</p>
            </>
          )}
          <p className="z18-karta__podskazka">{KARTOCHKI_18.podskazkaLitsevaya}</p>
        </div>

        {/* Оборот. */}
        <div className="z18-karta__storona z18-karta__storona--oborot" aria-hidden={!perevernuta}>
          <p className="z18-karta__nazvanie">{s.nazvanie}</p>
          <ul className="z18-karta__spisok">
            {s.kartochka.map((x, i) => (
              <li key={i}>
                <Tex text={x} />
              </li>
            ))}
          </ul>
          {rezhim === 'vspomni' ? (
            <ChertezhSkhemy
              skhema={skhema}
              t={skhema.nachalo}
              vid={VID_ISHODNYY}
              sost={S_PODPISYAMI}
              opisanie={s.nazvanie}
              dolyaVysoty={0.6}
              maxVysota={260}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Itog({
  sessiya,
  povtorit,
  zanovo,
  zakryt,
}: {
  sessiya: Sessiya;
  povtorit: (ids: readonly string[]) => void;
  zanovo: () => void;
  zakryt: () => void;
}) {
  const ids = Object.keys(sessiya.otvety);
  const neznakomye = ids.filter((id) => !sessiya.otvety[id]);
  const znayu = ids.length - neznakomye.length;
  return (
    <div className="z18-kart__itog" role="status">
      <p className="z18-kart__itog-title">{KARTOCHKI_18.itog}</p>
      <p className="z18-kart__itog-chisla">
        <span className="z18-kart__itog-znayu">{KARTOCHKI_18.itogZnayu(znayu)}</span>
        <span className="z18-kart__itog-povtorit">
          {KARTOCHKI_18.itogPovtorit(neznakomye.length)}
        </span>
      </p>
      {neznakomye.length === 0 ? <p>{KARTOCHKI_18.vseZnayu}</p> : null}
      <div className="z18-kart__otvety">
        {neznakomye.length === 0 ? null : (
          <button type="button" className="btn btn--primary" onClick={() => povtorit(neznakomye)}>
            {KARTOCHKI_18.povtoritNeznakomye}
          </button>
        )}
        <button type="button" className="btn btn--secondary" onClick={zanovo}>
          {KARTOCHKI_18.zanovo}
        </button>
        <button type="button" className="btn btn--ghost" onClick={zakryt}>
          {KARTOCHKI_18.vyyti}
        </button>
      </div>
    </div>
  );
}
