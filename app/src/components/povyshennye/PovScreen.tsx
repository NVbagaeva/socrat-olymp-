'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { StatsView } from '@/components/variant/online/StatsView';
import { useArchive } from '@/components/variant/online/useArchive';
import { TESTOVYJ_33 } from '@/content/variantOnline/shkala';
import { useActiveTrainerScopes } from '@/lib/trainerSession/store';
import { PRINT_PATH } from '@/lib/variant/handoff';
import type { ArchivedWork } from '@/lib/variant/online/archive';
import { reshatHref, workScope, type Mode } from '@/lib/variant/online/link';
import { PovInfo } from './PovInfo';
import { PovShtorka } from './PovShtorka';
import { RAZDELY_EKRANA, type RazdelEkrana } from './razdelEkrana';
import './povyshennye.css';

type Filtr = 'all' | 'nereshennye' | 'oshibki';
/** Статус версии на экране: «завершена» делится на чистую и с ошибками. */
export type PovStatus = 'new' | 'progress' | 'done' | 'oshibki';

interface Sostoyanie {
  status: 'new' | 'progress' | 'done';
  /** Последняя завершённая попытка версии. */
  last: ArchivedWork | null;
}

interface Versiya {
  v: number;
  s: Sostoyanie;
  /** Цвет точки и подписи. */
  vid: PovStatus;
  /** Проходит фильтр «Показать». */
  vidna: boolean;
}

/* «Весь комплект» первым: ученик, учитель и разбор одним файлом. */
const LISTY = ['vse', 'uchenik', 'uchitel', 'razbor'] as const;

/** Таймер режима «Как на ЕГЭ», минуты: часть 1 — 1 ч 30 мин, весь вариант — 3 ч 55 мин. */
const MINUT_KONTROL = 90;
const MINUT_KONTROL_VSE = 235;

/** Телефон: версии — в нижней шторке; шире — аккордеоном на месте. */
const TELEFON = '(max-width: 767.98px)';

function useTelefon(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(TELEFON);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(TELEFON).matches,
    () => false,
  );
}

const imeetOshibki = (w: ArchivedWork) => w.primary < w.max;

/**
 * Баллы последней попытки: первичный и тестовый. У варианта с частью 2
 * тестовый — по шкале на 33, когда вторая часть проверена целиком.
 */
function bally(
  chast2: readonly number[],
  k: number,
  w: ArchivedWork,
): { primary: number; test: number | null; proverka: boolean } {
  if (!chast2.includes(k)) return { primary: w.primary, test: w.test, proverka: false };
  const c = w.chast2;
  if (c === undefined) return { primary: w.primary, test: null, proverka: false };
  if (c.oceneno < c.vsego) return { primary: w.primary, test: null, proverka: true };
  const vsego = w.primary + c.summa;
  return { primary: vsego, test: TESTOVYJ_33[vsego] ?? null, proverka: false };
}

function ballyText(r: RazdelEkrana, k: number, w: ArchivedWork): string {
  const b = bally(r.chast2, k, w);
  return b.proverka ? r.T.ballyNaProverke(b.primary) : r.T.bally(b.primary, b.test);
}

function printHref(
  r: RazdelEkrana,
  k: number,
  v: number,
  list: (typeof LISTY)[number],
  mesto2 = true,
): string {
  const q = new URLSearchParams({ kod: r.kod(k), v: String(v), list });
  if (!mesto2) q.set('m2', '0');
  return `${PRINT_PATH}?${q.toString()}`;
}

function Tochki({ versii }: { versii: readonly Versiya[] }) {
  return (
    <span className="pov-tochki" aria-hidden="true">
      {versii.map((x) => (
        <span key={x.v} className={clsx('pov-tochka', `is-${x.vid}`, !x.vidna && 'is-dim')} />
      ))}
    </span>
  );
}

function Shevron({ vniz = false }: { vniz?: boolean }) {
  return (
    <svg className={clsx('pov-shevron', vniz && 'is-vniz')} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/**
 * Экран раздела: шапка с кнопкой «i» (пояснения — в шторке), сводка
 * прогресса, липкие фильтры и список 36 вариантов. Версии варианта на
 * телефоне открываются нижней шторкой, шире — раскрываются на месте.
 *
 * Решение версии — общий онлайн-режим «Собрать вариант» (/variant/reshat/
 * с кодом раздела PV-07): лента номеров, клавиатура, режимы, пауза,
 * итоги, работа над ошибками и шкала — те же. Статус и баллы берутся из
 * его архива завершённых работ и записей незавершённых сессий.
 *
 * Тот же экран служит «Ежемесячным вариантам» (`razdel`): у них четыре
 * варианта по одной версии, код EV-01.
 */
export function PovScreen({ razdel = 'pov' }: { razdel?: keyof typeof RAZDELY_EKRANA }) {
  const r = RAZDELY_EKRANA[razdel];
  const T = r.T;
  const works = useArchive();
  const active = useActiveTrainerScopes();
  const telefon = useTelefon();
  const [filtr, setFiltr] = useState<Filtr>('all');
  const [mode, setMode] = useState<Mode>('trening');
  const [otkryt, setOtkryt] = useState<number | null>(null);
  const [pechat, setPechat] = useState(false);
  const [mesto2, setMesto2] = useState(true);
  const [info, setInfo] = useState(false);

  const nashi = useMemo(() => (works ?? []).filter((w) => r.nomer(w.code) !== null), [works, r]);

  const sostoyanie = (k: number, v: number): Sostoyanie => {
    const code = r.kod(k);
    const done = nashi
      .filter((w) => w.code === code && w.variant === v)
      .sort((a, b) => b.finishedAt - a.finishedAt);
    const idet = (['trening', 'kontrol'] as const).some((m) =>
      active.includes(workScope(code, v, m)),
    );
    const last = done[0] ?? null;
    return { status: idet ? 'progress' : last !== null ? 'done' : 'new', last };
  };

  const pokazat = (s: Sostoyanie): boolean => {
    if (filtr === 'nereshennye') return s.status !== 'done';
    if (filtr === 'oshibki') return s.last !== null && imeetOshibki(s.last);
    return true;
  };

  const kartochki = Array.from({ length: r.variantov }, (_, i) => i + 1).map((k) => {
    const gotov = r.gotovy.includes(k);
    const versii: Versiya[] = Array.from({ length: r.versiy }, (_, i) => i + 1).map((v) => {
      const s: Sostoyanie = gotov ? sostoyanie(k, v) : { status: 'new', last: null };
      const vid: PovStatus =
        s.status === 'done' && s.last !== null && imeetOshibki(s.last) ? 'oshibki' : s.status;
      return { v, s, vid, vidna: pokazat(s) };
    });
    return { k, gotov, versii, chast2: r.chast2.includes(k) };
  });
  const vidimye = kartochki.filter(
    (c) => filtr === 'all' || (c.gotov && c.versii.some((x) => x.vidna)),
  );

  /* Сводка: решённые версии и средний тестовый балл последних попыток. */
  const vse = kartochki.flatMap((c) => c.versii.map((x) => ({ k: c.k, x })));
  const resheno = vse.filter(({ x }) => x.s.status === 'done').length;
  const vsegoVersiy = r.variantov * r.versiy;
  const testy = vse
    .filter(({ x }) => x.s.status === 'done' && x.s.last !== null)
    .map(({ k, x }) => bally(r.chast2, k, x.s.last!).test)
    .filter((t): t is number => t !== null);
  const srednij =
    testy.length === 0 ? null : Math.round(testy.reduce((a, b) => a + b, 0) / testy.length);
  const procent = Math.round((resheno / vsegoVersiy) * 100);

  const href = (k: number, v: number) =>
    reshatHref({
      code: r.kod(k),
      variant: v,
      mode,
      timer:
        mode === 'kontrol'
          ? { kind: 'down', minutes: r.chast2.includes(k) ? MINUT_KONTROL_VSE : MINUT_KONTROL }
          : { kind: 'none' },
      kind: 'ege',
      title: '',
    });

  const otkrytVariant = (k: number) => {
    setPechat(false);
    setOtkryt(otkryt === k && !telefon ? null : k);
  };

  /** Версии варианта и печать — общие для шторки и аккордеона. */
  const versiiVarianta = (c: (typeof kartochki)[number], vid: 'shtorka' | 'akkordeon') => (
    <>
      <ol className={clsx('pov-versii', `pov-versii--${vid}`)} aria-label={T.card.versii}>
        {c.versii
          .filter((x) => x.vidna)
          .map(({ v, s, vid: st }) => {
            const kv = r.versiya(c.k, v);
            const ball = s.last === null ? null : ballyText(r, c.k, s.last);
            const label = `${kv}: ${T.status[st]}${ball === null ? '' : `, ${ball}`}`;
            const deystvie = s.status === 'done' ? T.pereReshat : T.reshat;
            const tekst = (
              <>
                <span className="pov-v__no">{r.stroka(c.k, v)}</span>
                <span className={clsx('pov-tochka', `is-${st}`)} aria-hidden="true" />
                <span className="pov-v__info">
                  <span className={clsx('pov-v__status', `is-${st}`)}>{T.status[st]}</span>
                  {ball === null ? null : (
                    <span className="pov-v__score" title={T.scoreTitle}>
                      {ball}
                    </span>
                  )}
                </span>
              </>
            );
            return (
              <li key={v} className={clsx('pov-v', `is-${st}`)}>
                {vid === 'shtorka' ? (
                  <>
                    {tekst}
                    <a
                      className="pov-v__btn"
                      href={href(c.k, v)}
                      data-testid={`pov-v-${kv}`}
                      aria-label={`${deystvie} ${label}`}
                    >
                      {deystvie}
                    </a>
                  </>
                ) : (
                  <a
                    className="pov-v__row"
                    href={href(c.k, v)}
                    data-testid={`pov-v-${kv}`}
                    aria-label={`${deystvie} ${label}`}
                  >
                    {tekst}
                    <Shevron />
                  </a>
                )}
              </li>
            );
          })}
      </ol>
      <div className="pov-print">
        <button
          type="button"
          className="pov-print__toggle"
          aria-expanded={pechat}
          data-testid={`pov-print-${c.k}`}
          onClick={() => setPechat(!pechat)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v6H7z" />
          </svg>
          {T.card.print}
          <Shevron vniz />
        </button>
        {pechat && c.chast2 ? (
          <div
            className="pov-seg pov-print__mesto"
            role="radiogroup"
            aria-label={T.card.mesto2.label}
          >
            <span className="pov-print__label">{T.card.mesto2.label}</span>
            {([true, false] as const).map((m) => (
              <button
                key={String(m)}
                type="button"
                role="radio"
                aria-checked={mesto2 === m}
                className={clsx('pov-seg__btn', mesto2 === m && 'is-on')}
                data-testid={`pov-mesto2-${m ? 'stranica' : 'net'}`}
                onClick={() => setMesto2(m)}
              >
                {m ? T.card.mesto2.stranica : T.card.mesto2.net}
              </button>
            ))}
          </div>
        ) : null}
        {pechat ? (
          <table className="pov-print__table">
            <tbody>
              {c.versii.map(({ v }) => (
                <tr key={v}>
                  <th scope="row">{r.versiya(c.k, v)}</th>
                  {LISTY.map((l) => (
                    <td key={l}>
                      <a
                        href={printHref(r, c.k, v, l, mesto2)}
                        target="_blank"
                        rel="noopener"
                        aria-label={`${T.card.printFor(r.versiya(c.k, v))}: ${T.card.sheets[l]}`}
                      >
                        {T.card.sheets[l]}
                      </a>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </>
  );

  const vShtorke = telefon && otkryt !== null ? kartochki.find((c) => c.k === otkryt) : undefined;

  return (
    <div className="pov">
      <header className="pov-head">
        <Link className="pov-head__back" href="/">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          <span className="pov-head__back-tekst">{T.back}</span>
        </Link>
        <h1 className="pov-head__title">{T.title}</h1>
        <button
          type="button"
          className="pov-head__info"
          aria-label={T.infoButton}
          data-testid="pov-info"
          onClick={() => setInfo(true)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v6M12 7.5v.5" />
          </svg>
        </button>
        <p className="pov-head__sub">{T.sub}</p>
      </header>

      <section className="pov-svodka" aria-label={T.svodka.resheno}>
        <div className="pov-glass pov-svodka__card" data-testid="pov-resheno">
          <svg className="pov-svodka__ikonka is-blue" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 19v-5M12 19V9M18 19V5" />
          </svg>
          <div className="pov-svodka__tekst">
            <span className="pov-svodka__label">{T.svodka.resheno}</span>
            <span className="pov-svodka__value">{T.svodka.iz(resheno, vsegoVersiy)}</span>
          </div>
          <div className="pov-svodka__bar">
            <span
              className="pov-svodka__polosa"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={vsegoVersiy}
              aria-valuenow={resheno}
              aria-label={T.svodka.resheno}
            >
              <span style={{ width: `${(resheno / vsegoVersiy) * 100}%` }} />
            </span>
            <span className="pov-svodka__procent">{T.svodka.procent(procent)}</span>
          </div>
        </div>
        <div
          className="pov-glass pov-svodka__card"
          data-testid="pov-srednij"
          title={T.svodka.srednijTitle}
        >
          <svg className="pov-svodka__ikonka is-kubok" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8.5 20h7M10 17h4v3h-4z" />
          </svg>
          <div className="pov-svodka__tekst">
            <span className="pov-svodka__label">{T.svodka.srednij}</span>
            <span className="pov-svodka__value">{srednij === null ? T.svodka.net : srednij}</span>
          </div>
        </div>
      </section>

      <div className="pov-filtry" role="group" aria-label={T.filtry}>
        <div className="pov-seg pov-seg--full" role="radiogroup" aria-label={T.filter.label}>
          {(['all', 'nereshennye', 'oshibki'] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={filtr === f}
              className={clsx('pov-seg__btn', filtr === f && 'is-on')}
              onClick={() => setFiltr(f)}
            >
              {T.filter[f]}
            </button>
          ))}
        </div>
        <div className="pov-seg pov-seg--full" role="radiogroup" aria-label={T.mode.label}>
          {(['trening', 'kontrol'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              className={clsx('pov-seg__btn', mode === m && 'is-on')}
              onClick={() => setMode(m)}
            >
              {T.mode[m]}
            </button>
          ))}
        </div>
      </div>

      {vidimye.length === 0 ? (
        <p className="pov-empty">{filtr === 'oshibki' ? T.empty.oshibki : T.empty.nereshennye}</p>
      ) : (
        <ul className="pov-list" data-testid="pov-grid">
          {vidimye.map((c) => {
            const nachato = c.versii.filter((x) => x.s.status !== 'new').length;
            const raskryt = !telefon && otkryt === c.k;
            return (
              <li
                key={c.k}
                className={clsx(
                  'pov-glass',
                  'pov-card',
                  !c.gotov && 'is-soon',
                  raskryt && 'is-open',
                )}
                data-testid={`pov-card-${c.k}`}
              >
                {c.gotov ? (
                  <button
                    type="button"
                    className="pov-card__head"
                    aria-expanded={telefon ? undefined : raskryt}
                    aria-haspopup={telefon ? 'dialog' : undefined}
                    aria-label={T.otkryt(c.k)}
                    data-testid={`pov-open-${c.k}`}
                    onClick={() => otkrytVariant(c.k)}
                  >
                    <span className="pov-card__title">
                      {T.card.title(c.k)}
                      {c.chast2 ? <span className="pov-badge">{T.chast2}</span> : null}
                    </span>
                    <span className="pov-card__meta">
                      <span className="pov-card__count">{T.versiiCount(nachato)}</span>
                      <Tochki versii={c.versii} />
                    </span>
                    <Shevron vniz={raskryt} />
                  </button>
                ) : (
                  <div className="pov-card__head">
                    <span className="pov-card__title">{T.card.title(c.k)}</span>
                    <span className="pov-card__meta">
                      <span className="pov-card__count">{T.card.soon}</span>
                    </span>
                  </div>
                )}
                {raskryt ? (
                  <div className="pov-card__body" data-testid={`pov-akkordeon-${c.k}`}>
                    {versiiVarianta(c, 'akkordeon')}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <section className="pov-stats" aria-labelledby="pov-stats-title">
        <h2 id="pov-stats-title" className="pov-stats__title">
          {T.stats.title}
        </h2>
        {works === null ? null : nashi.length === 0 ? (
          <p className="pov-note">{T.stats.none}</p>
        ) : (
          <StatsView
            works={nashi}
            code={null}
            label={(w) => r.versiya(r.nomer(w.code) ?? 0, w.variant)}
          />
        )}
      </section>

      <PovShtorka
        open={vShtorke !== undefined}
        onClose={() => setOtkryt(null)}
        closeLabel={T.zakryt}
        testId="pov-shtorka"
        title={
          vShtorke === undefined ? null : (
            <>
              {T.card.title(vShtorke.k)}
              {vShtorke.chast2 ? <span className="pov-badge">{T.chast2Dostupna}</span> : null}
            </>
          )
        }
      >
        {vShtorke === undefined ? null : versiiVarianta(vShtorke, 'shtorka')}
      </PovShtorka>

      <PovShtorka
        open={info}
        onClose={() => setInfo(false)}
        closeLabel={T.zakryt}
        testId="pov-info-shtorka"
        title={T.info.title}
      >
        <PovInfo T={T} chast2={r.chast2} onAction={() => setInfo(false)} />
      </PovShtorka>
    </div>
  );
}
