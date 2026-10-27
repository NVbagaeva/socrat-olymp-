'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Button, Checkbox, Select } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { REPETITORY_13, UROKI_13, ZAMETKI_13, type Urok13 } from '@/content/repetitory13';
import { generatorVersion, kitCode, newKitId, parseKitCode, withKit } from '@/lib/komplekt';
import { GEN_PARAMS_13, listHref13, minut13, vsegoZadach13 } from '@/lib/zadanie13/gen/params';
import type { TypeCode } from '@/lib/zadanie13/types';
import { Piktogramma } from '../zadanie11/Piktogrammy';

export interface BlokKratko13 {
  id: string;
  slug: string;
  nazvanie: string;
}

export interface ProtoKratko13 {
  id: string;
  title: string;
  hard: boolean;
}

/* Код серии — в адресе вкладки (?kod=…), как у №1: ссылка открывает
   ту же серию на любом устройстве. Адрес — внешнее хранилище. */
const slushateli = new Set<() => void>();

function podpisatsya(l: () => void): () => void {
  slushateli.add(l);
  window.addEventListener('popstate', l);
  return () => {
    slushateli.delete(l);
    window.removeEventListener('popstate', l);
  };
}

const kodVAdrese = () => new URLSearchParams(window.location.search).get('kod') ?? '';

function zapisatVAdres(kod: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set('kod', kod);
  window.history.replaceState(null, '', url.toString());
  slushateli.forEach((l) => l());
}

function novyyKod(): string {
  return kitCode(newKitId(), generatorVersion('13'));
}

/** Код из адреса, если он настоящий: «7K3F-2E». */
function chistyyKod(text: string): string | null {
  const p = parseKitCode(text);
  return p === null ? null : kitCode(p.id, p.version);
}

const TIPY: readonly TypeCode[] = ['A', 'B', 'C', 'D'];

/**
 * Вкладка «Для репетиторов» задания №13 (02-design.md, § 6): шесть
 * уроков (опорные → банк → новые), заметки по каждому типу, карточки
 * «Определи тип» и быстрый лист.
 *
 * Листы уроков собирает генератор №13 по адресу (?u=…): у всех
 * уроков серии общий код комплекта, он в адресе вкладки и в подвале
 * каждого листа — по нему листы собираются заново, без Date.now.
 */
export function Repetitory13({
  base,
  bloki,
  prototipy,
  tipy,
  priznaki,
}: {
  base: string;
  bloki: BlokKratko13[];
  prototipy: ProtoKratko13[];
  tipy: Record<TypeCode, string>;
  priznaki: Record<TypeCode, string>;
}) {
  const tekst = useSyncExternalStore(podpisatsya, kodVAdrese, () => '');
  const kod = chistyyKod(tekst);
  const [vvod, setVvod] = useState('');
  const [oshibkaKoda, setOshibkaKoda] = useState(false);
  const [skopirovano, setSkopirovano] = useState(false);
  const [otkryt, setOtkryt] = useState<number | null>(null);
  const [tip, setTip] = useState<TypeCode>('A');
  const [urok, setUrok] = useState(1);
  const [variantov, setVariantov] = useState(1);
  const [sUchitelem, setSUchitelem] = useState(true);

  /* Без кода (или с испорченным) — новая серия. Смотрим сам адрес: при
     гидратации снимок ещё пустой, а код в ссылке уже есть. */
  useEffect(() => {
    if (kod === null && chistyyKod(kodVAdrese()) === null) zapisatVAdres(novyyKod());
  }, [kod]);

  const blok = (id: string) => bloki.find((b) => b.id === id);
  const proto = (id: string) => prototipy.find((p) => p.id === id);

  function href(no: number, vid: 'uchenik' | 'uchitel' | 'vse', variants = 1): string {
    if (kod === null) return '#';
    const seed = kod.slice(0, 4);
    const p = { ...GEN_PARAMS_13, sostav: {}, title: '', urok: no, seed, variants };
    return withKit(listHref13(p, vid), kod);
  }

  function otkrytList(no: number, vid: 'uchenik' | 'uchitel' | 'vse', variants = 1) {
    if (kod === null) return;
    window.open(href(no, vid, variants), '_blank', 'noopener');
  }

  function kartochkiHref(): string {
    if (kod === null) return '#';
    return `${base}/pechat/kartochki/?${new URLSearchParams({ seed: kod.slice(0, 4), kit: kod }).toString()}`;
  }

  function vvestiKod() {
    const k = chistyyKod(vvod);
    setOshibkaKoda(k === null);
    if (k !== null) {
      zapisatVAdres(k);
      setVvod('');
    }
  }

  async function skopirovat() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setSkopirovano(true);
      window.setTimeout(() => setSkopirovano(false), 2000);
    } catch {
      /* Буфер обмена недоступен — ссылка остаётся в адресной строке. */
    }
  }

  const obyom = (u: Urok13) => {
    const p = { sostav: {}, urok: u.no };
    return { n: vsegoZadach13(p), minut: minut13(p) };
  };
  const m = UROKI_13.find((x) => x.no === otkryt);
  const zametki = ZAMETKI_13[tip];

  return (
    <div className="z11-rep z13-rep">
      <div className="z11-rep__main">
        <header className="z11-rep__head">
          <h2 className="t-h2">{REPETITORY_13.title}</h2>
          <p className="z11-rep__lead">{REPETITORY_13.lead}</p>
        </header>

        <section className="z11-card z13-rep__kod" aria-labelledby="z13-rep-kod">
          <div className="z13-rep__kod-head">
            <h3 className="z11-card__title" id="z13-rep-kod">
              {REPETITORY_13.kod}: <span className="z13-rep__kod-text">{kod ?? '…'}</span>
            </h3>
            <span className="z13-rep__kod-btns">
              <Button variant="secondary" size="sm" onClick={() => void skopirovat()}>
                {skopirovano ? REPETITORY_13.skopirovano : REPETITORY_13.skopirovat}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => zapisatVAdres(novyyKod())}>
                {REPETITORY_13.kodNovyy}
              </Button>
            </span>
          </div>
          <p className="z11-istochnik__note">{REPETITORY_13.kodLead}</p>
          <form
            className="z13-rep__kod-form"
            onSubmit={(e) => {
              e.preventDefault();
              vvestiKod();
            }}
          >
            <label className="sr-only" htmlFor="z13-rep-vvod">
              {REPETITORY_13.kodVvod}
            </label>
            <input
              id="z13-rep-vvod"
              className="input"
              value={vvod}
              placeholder={REPETITORY_13.kodVvod}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                setVvod(e.target.value);
                setOshibkaKoda(false);
              }}
            />
            <Button type="submit" variant="secondary" size="sm">
              {REPETITORY_13.kodPrimenit}
            </Button>
          </form>
          {oshibkaKoda ? (
            <p className="z13-rep__oshibka" role="alert">
              {REPETITORY_13.kodOshibka}
            </p>
          ) : null}
        </section>

        <section>
          <h3 className="z11-blok-title">{REPETITORY_13.uroki}</h3>
          <ul className="z11-rep__marshruty">
            {UROKI_13.map((x) => {
              const { n, minut } = obyom(x);
              return (
                <li key={x.no} className={clsx('z11-urok', otkryt === x.no && 'is-open')}>
                  <p className="z11-urok__title">
                    <b>{REPETITORY_13.urok(x.no)}</b> {x.title}
                  </p>
                  <span className="z11-urok__count">{REPETITORY_13.zadachMinut(n, minut)}</span>
                  <span className="z11-urok__polosa" aria-hidden="true">
                    <span style={{ flexGrow: x.opornye.length / n }} className="is-o" />
                    <span style={{ flexGrow: x.bank.length / n }} className="is-b" />
                    <span style={{ flexGrow: x.novye.length / n }} className="is-n" />
                    {x.tip > 0 ? <span style={{ flexGrow: x.tip / n }} className="is-t" /> : null}
                  </span>
                  <span className="z11-urok__legend">
                    <span>{REPETITORY_13.polosa.opornye}</span>
                    <span>{REPETITORY_13.polosa.bank}</span>
                    <span>{REPETITORY_13.polosa.novye}</span>
                    {x.tip > 0 ? <span>{REPETITORY_13.polosa.tip}</span> : null}
                  </span>
                  <span className="z11-urok__btns">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-expanded={otkryt === x.no}
                      onClick={() => setOtkryt(otkryt === x.no ? null : x.no)}
                    >
                      {otkryt === x.no ? REPETITORY_13.skryt : REPETITORY_13.otkryt}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => otkrytList(x.no, 'uchenik')}>
                      {REPETITORY_13.sgenerirovat}
                    </Button>
                  </span>
                </li>
              );
            })}
          </ul>

          {m === undefined ? null : (
            <div className="z11-card z11-urok-plan">
              <h4 className="z11-card__title">
                {REPETITORY_13.urok(m.no)} {m.title}
              </h4>
              <div className="z11-urok-plan__cols">
                <div>
                  <p className="z11-urok-plan__h">1. {REPETITORY_13.polosa.opornye}</p>
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
                      {i + 2}. {REPETITORY_13.polosa[k]}
                    </p>
                    <ul>
                      {m[k].map((id, j) => {
                        const p = proto(id);
                        return p === undefined ? null : (
                          <li key={`${id}-${j}`}>
                            <span>
                              <Tex text={p.title} />
                            </span>
                          </li>
                        );
                      })}
                      {k === 'novye' && m.tip > 0 ? (
                        <li>
                          <span>
                            <b>{REPETITORY_13.polosa.tip}:</b> {REPETITORY_13.tipZadach(m.tip)}
                          </span>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="z11-urok-plan__btns">
                <Link
                  className="btn btn--secondary btn--sm"
                  href={`${base}/trenazher/?t=${m.chto}`}
                >
                  {REPETITORY_13.vTrenazhere}
                </Link>
                <Button variant="secondary" size="sm" onClick={() => otkrytList(m.no, 'uchitel')}>
                  {REPETITORY_13.uchitel}
                </Button>
                <Button size="sm" onClick={() => otkrytList(m.no, 'uchenik')}>
                  {REPETITORY_13.sgenerirovat}
                </Button>
              </div>
            </div>
          )}
        </section>

        <section>
          <h3 className="z11-blok-title">{REPETITORY_13.zametki}</h3>
          <div className="z11-zametki">
            <ul className="z11-zametki__list">
              {TIPY.map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    className={clsx('z11-zametki__item', tip === t && 'is-active')}
                    aria-pressed={tip === t}
                    onClick={() => setTip(t)}
                  >
                    {tipy[t]}
                  </button>
                </li>
              ))}
            </ul>
            <div className="z11-card z11-zametki__body">
              <div className="z11-zametki__head">
                <span>
                  <b>{tipy[tip]}</b>
                  <span className="z11-zametki__lead">{REPETITORY_13.zametkiLead}</span>
                </span>
              </div>
              <div className="z11-zametki__cards">
                <div className="z11-zametka z11-zametka--kak">
                  <p className="z11-zametka__title">
                    <Piktogramma name="book" />
                    {REPETITORY_13.kakObyasnyat}
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
                    {REPETITORY_13.oshibki}
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
                    {REPETITORY_13.priznak}
                  </p>
                  <p className="z13-rep__priznak">{priznaki[tip]}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="z11-card z13-rep__kartochki" aria-labelledby="z13-rep-kartochki">
          <h3 className="z11-card__title" id="z13-rep-kartochki">
            {REPETITORY_13.kartochki}
          </h3>
          <p className="z11-istochnik__note">{REPETITORY_13.kartochkiLead}</p>
          <a
            className="btn btn--primary btn--sm"
            href={kartochkiHref()}
            target="_blank"
            rel="noopener"
          >
            <Piktogramma name="doc" />
            {REPETITORY_13.kartochkiKnopka}
          </a>
        </section>
      </div>

      <aside className="z11-rep__side">
        <div className="z11-vybrannaya">
          <h3 className="z11-vybrannaya__title">{REPETITORY_13.bystryy}</h3>
          <p className="z11-istochnik__note">{REPETITORY_13.bystryyLead}</p>
          <label className="z11-rep__label" htmlFor="z13-rep-urok">
            {REPETITORY_13.vyberiteUrok}
          </label>
          <Select
            id="z13-rep-urok"
            value={String(urok)}
            onChange={(e) => setUrok(Number(e.target.value))}
          >
            {UROKI_13.map((x) => (
              <option key={x.no} value={String(x.no)}>
                {REPETITORY_13.urok(x.no)} {x.title}
              </option>
            ))}
          </Select>
          <div className="z11-vybrannaya__row">
            <span>{REPETITORY_13.variantov}</span>
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
                disabled={variantov >= 4}
                onClick={() => setVariantov(variantov + 1)}
              >
                +
              </button>
            </span>
          </div>
          <Checkbox checked={sUchitelem} onChange={(e) => setSUchitelem(e.target.checked)}>
            {REPETITORY_13.sOtvetami}
          </Checkbox>
          <Button
            className="z11-vybrannaya__start"
            onClick={() => otkrytList(urok, sUchitelem ? 'vse' : 'uchenik', variantov)}
          >
            <Piktogramma name="doc" />
            {REPETITORY_13.pdf}
          </Button>
          <p className="z11-istochnik__note">
            {REPETITORY_13.pdfNote}
            {sUchitelem ? REPETITORY_13.pdfNoteOtvety : ''}.
          </p>
        </div>
      </aside>
    </div>
  );
}
