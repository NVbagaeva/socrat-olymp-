'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Button, Checkbox } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { BLOKI_UROKA_1, REPETITORY_1, UROKI_1, ZAMETKI_1 } from '@/content/repetitory1';
import { generatorVersion, newKitId } from '@/lib/komplekt';
import { sheetQuery1 } from '@/lib/planimetriya/sheet1';
import type { Blok } from '@/lib/planimetriya/stseny/dsl';
import {
  klyuchProto,
  type RazdelInfo,
  type UslovieBanka,
} from '@/lib/planimetriya/trenazher/sessiya';
import {
  kodSeriiText,
  kolichestvoUroka,
  NASTROYKI_PO_UMOLCHANIYU,
  parseKodSerii,
  planUroka,
  seriya,
  zadachUroka,
  type KodSerii,
  type NastroykiUroka,
} from '@/lib/planimetriya/uroki';
import { Piktogramma, Zvezdy } from '../zadanie11/Piktogrammy';
import { IkonkaBloka1 } from './IkonkaBloka1';

/* Код серии — в адресе вкладки (?kod=…): ссылка открывает ту же
   серию. Адрес — внешнее хранилище: подписка на «назад/вперёд» и на
   свои записи. */
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

function zapisatVAdres(k: KodSerii): void {
  const url = new URL(window.location.href);
  url.searchParams.set('kod', kodSeriiText(k));
  window.history.replaceState(null, '', url.toString());
  slushateli.forEach((l) => l());
}

function novyyKod(): KodSerii {
  return { osnova: `${newKitId()}${generatorVersion('1')}`, regen: {} };
}

/**
 * Вкладка «Для репетиторов» задания №1: серия из 12 уроков по коду
 * комплекта (lib/planimetriya/uroki.ts), методические заметки по
 * блокам I–X.
 *
 * Код восстанавливает всю серию на любом устройстве: он в адресе
 * вкладки и печатается на каждом листе; в браузере ничего не
 * хранится. У каждого урока — блоки (мини-проверка прошлого урока,
 * разминка, шпаргалка, разбор, самостоятельно, ДЗ): учитель выключает
 * любой и меняет число задач, «Перегенерировать урок» берёт
 * неиспользованные задачи и меняет хвост кода. Листы ученика и
 * учителя — из одного набора: один адрес, разный вид.
 */
export function Repetitory1({
  razdely,
  bank,
  base,
}: {
  razdely: RazdelInfo[];
  bank: UslovieBanka[];
  base: string;
}) {
  const vse = razdely.flatMap((r) => r.podtipy);
  const podtip = (n: number) => vse.find((p) => p.id === klyuchProto(n));
  const tekst = useSyncExternalStore(podpisatsya, kodVAdrese, () => '');
  const kod = useMemo(() => (tekst === '' ? null : parseKodSerii(tekst)), [tekst]);
  const [vvod, setVvod] = useState('');
  const [oshibkaKoda, setOshibkaKoda] = useState(false);
  const [skopirovano, setSkopirovano] = useState(false);
  const [otkryt, setOtkryt] = useState<number | null>(1);
  const [nastroyki, setNastroyki] = useState<Record<number, NastroykiUroka>>({});
  const [razdel, setRazdel] = useState<Blok>('I');

  /* Без кода (или с испорченным) — новый комплект. */
  useEffect(() => {
    if (kod === null) zapisatVAdres(novyyKod());
  }, [kod]);

  const s = useMemo(() => (kod === null ? null : seriya(kod, bank)), [kod, bank]);

  function primenit(k: KodSerii) {
    zapisatVAdres(k);
    setNastroyki({});
  }

  function nast(no: number): NastroykiUroka {
    return nastroyki[no] ?? NASTROYKI_PO_UMOLCHANIYU;
  }

  function izmenit(no: number, patch: (n: NastroykiUroka) => NastroykiUroka) {
    setNastroyki({ ...nastroyki, [no]: patch(nast(no)) });
  }

  function list(no: number, uchitel: boolean) {
    if (kod === null) return;
    const q = sheetQuery1({
      rezhim: 'urok',
      istochnik: 'mix',
      sostav: [],
      variants: 1,
      seed: kodSeriiText(kod),
      zameny: {},
      urok: no,
      kod: kodSeriiText(kod),
      nastroyki: nast(no),
      theme: 'color',
      ramka: -1,
    });
    window.open(`${base}/pechat/${uchitel ? 'otvety/' : ''}?${q}`, '_blank', 'noopener');
  }

  const zametki = ZAMETKI_1[razdel];
  const info = razdely.find((r) => r.id === razdel);
  const kodText = kod === null ? '' : kodSeriiText(kod);

  return (
    <div className="z11-rep z1-rep">
      <div className="z11-rep__main">
        <header className="z11-rep__head">
          <h2 className="t-h2">{REPETITORY_1.title}</h2>
          <p className="z11-rep__lead">{REPETITORY_1.lead}</p>
        </header>

        <section className="z11-card z1-kod" aria-labelledby="z1-kod-title">
          <div className="z1-kod__row">
            <h3 className="z1-kod__title" id="z1-kod-title">
              {REPETITORY_1.kod}
            </h3>
            <output className="z1-kod__value" aria-live="polite">
              {kodText}
            </output>
            <Button
              variant="secondary"
              size="sm"
              disabled={kod === null}
              onClick={() => {
                void navigator.clipboard?.writeText(kodText).then(() => setSkopirovano(true));
              }}
            >
              {skopirovano ? REPETITORY_1.skopirovano : REPETITORY_1.kopirovat}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => primenit(novyyKod())}>
              {REPETITORY_1.novyyKomplekt}
            </Button>
          </div>
          <p className="z11-istochnik__note">{REPETITORY_1.kodLead}</p>
          <form
            className="z1-kod__vvod"
            onSubmit={(e) => {
              e.preventDefault();
              const k = parseKodSerii(vvod);
              setOshibkaKoda(k === null);
              if (k !== null) {
                primenit(k);
                setVvod('');
              }
            }}
          >
            <label className="z11-rep__label" htmlFor="z1-kod-vvod">
              {REPETITORY_1.kodVvesti}
            </label>
            <input
              id="z1-kod-vvod"
              className="input"
              value={vvod}
              placeholder={REPETITORY_1.kodPlaceholder}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                setVvod(e.target.value);
                setOshibkaKoda(false);
              }}
            />
            <Button type="submit" size="sm" variant="secondary">
              {REPETITORY_1.kodPrimenit}
            </Button>
            {oshibkaKoda ? (
              <p className="z1-kod__oshibka" role="alert">
                {REPETITORY_1.kodNeveren}
              </p>
            ) : null}
          </form>
        </section>

        <section>
          <h3 className="z11-blok-title">{REPETITORY_1.uroki}</h3>
          <ul className="z1-uroki">
            {UROKI_1.map((u) => {
              const n = nast(u.no);
              const plan = s === null ? null : planUroka(s, u.no, n);
              const k = kolichestvoUroka(n);
              const g = kod?.regen[u.no] ?? 0;
              const otkrytUrok = otkryt === u.no;
              const bloki = BLOKI_UROKA_1.filter((b) =>
                u.no === 1
                  ? b.id !== 'proverka' && b.id !== 'razminka'
                  : u.no === 12
                    ? b.id === 'proverka'
                    : true,
              );
              return (
                <li key={u.no} className={clsx('z11-card z1-urok', otkrytUrok && 'is-open')}>
                  <div className="z1-urok__head">
                    <p className="z1-urok__title">
                      <b>{REPETITORY_1.urok(u.no)}</b> {u.title}
                    </p>
                    <span className="z1-urok__count">
                      {plan === null ? '' : REPETITORY_1.zadach(zadachUroka(plan))}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-expanded={otkrytUrok}
                      onClick={() => setOtkryt(otkrytUrok ? null : u.no)}
                    >
                      {otkrytUrok ? REPETITORY_1.skryt : REPETITORY_1.otkryt}
                    </Button>
                  </div>
                  {u.bank.length + u.dop.length === 0 ? null : (
                    <p className="z1-urok__protos">
                      <span className="z1-urok__label">{REPETITORY_1.prototipy}:</span>
                      {u.bank.map((x) => (
                        <span key={x} className="z1-gde__chip" title={podtip(x)?.title}>
                          {x}
                        </span>
                      ))}
                      {u.dop.map((x) => (
                        <span
                          key={x}
                          className="z1-gde__chip z1-gde__chip--dop"
                          title={`${podtip(x)?.title ?? ''} — ${REPETITORY_1.neIzBanka}`}
                        >
                          {x}
                        </span>
                      ))}
                    </p>
                  )}
                  {!otkrytUrok ? null : (
                    <div className="z1-urok__body">
                      <p className="z1-urok__h">{REPETITORY_1.bloki}</p>
                      <ul className="z1-urok__bloki">
                        {bloki.map((b) => {
                          const vkl = !n.vykl.includes(b.id);
                          const x = k[b.id];
                          const sStepper = b.id !== 'shpargalka';
                          const zadachBloka =
                            plan?.bloki.find((pb) => pb.id === b.id)?.pozicii.length ?? 0;
                          return (
                            <li key={b.id} className={clsx('z1-urok__blok', !vkl && 'is-off')}>
                              <Checkbox
                                checked={vkl}
                                onChange={(e) =>
                                  izmenit(u.no, (m) => ({
                                    ...m,
                                    vykl: e.target.checked
                                      ? m.vykl.filter((v) => v !== b.id)
                                      : [...m.vykl, b.id],
                                  }))
                                }
                              >
                                <b>{b.id === 'proverka' ? b.sheetTitle(u.no - 1) : b.title}</b>
                              </Checkbox>
                              <span className="z1-urok__note">{b.note}</span>
                              {sStepper ? (
                                <span className="z1-urok__n">
                                  <span className="z11-stepper">
                                    <button
                                      type="button"
                                      aria-label={`${REPETITORY_1.menshe}: ${b.title}`}
                                      disabled={!vkl || x <= (b.poProto ? 0 : 1)}
                                      onClick={() =>
                                        izmenit(u.no, (m) => ({
                                          ...m,
                                          n: { ...m.n, [b.id]: x - 1 },
                                        }))
                                      }
                                    >
                                      −
                                    </button>
                                    <output>{x}</output>
                                    <button
                                      type="button"
                                      aria-label={`${REPETITORY_1.bolshe}: ${b.title}`}
                                      disabled={!vkl || x >= b.max}
                                      onClick={() =>
                                        izmenit(u.no, (m) => ({
                                          ...m,
                                          n: { ...m.n, [b.id]: x + 1 },
                                        }))
                                      }
                                    >
                                      +
                                    </button>
                                  </span>
                                  <span className="z1-urok__ed">
                                    {b.poProto ? REPETITORY_1.naProto : REPETITORY_1.vsego}
                                    {vkl && b.poProto
                                      ? ` · ${REPETITORY_1.zadach(zadachBloka)}`
                                      : ''}
                                  </span>
                                </span>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                      {g === 0 ? null : (
                        <p className="z11-istochnik__note">{REPETITORY_1.peregenerirovatNote(g)}</p>
                      )}
                      <div className="z1-urok__btns">
                        <Button size="sm" onClick={() => list(u.no, false)}>
                          <Piktogramma name="doc" />
                          {REPETITORY_1.listUchenika}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => list(u.no, true)}>
                          <Piktogramma name="doc" />
                          {REPETITORY_1.listUchitelya}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={kod === null}
                          onClick={() => {
                            if (kod === null) return;
                            primenit({ ...kod, regen: { ...kod.regen, [u.no]: g + 1 } });
                          }}
                        >
                          {REPETITORY_1.peregenerirovat}
                        </Button>
                        {u.bank.length + u.dop.length === 0 ? null : (
                          <Link
                            className="btn btn--ghost btn--sm"
                            href={`${base}/trenazher/?tipy=${[...u.bank, ...u.dop].map(klyuchProto).join(',')}`}
                          >
                            {REPETITORY_1.vTrenazhere}
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
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
    </div>
  );
}
