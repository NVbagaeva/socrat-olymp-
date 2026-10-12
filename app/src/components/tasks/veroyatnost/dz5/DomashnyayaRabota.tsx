'use client';

import { clsx } from 'clsx';
import { useId, useMemo, useSyncExternalStore } from 'react';
import { Note, Option, OptionGroup, StepHead } from '@/components/tasks/configurator';
import { Badge, Input } from '@/components/ui';
import { counted } from '@/lib/plural';
import { randomSeed } from '@/lib/randomSeed';
import { shablonyTipa, type PlanDz } from '@/lib/veroyatnost/dz5/generator';
import { nabory5 } from '@/lib/veroyatnost/dz5/nabory';
import { TIPY_5, tipOpisanie, type Tip5 } from '@/lib/veroyatnost/dz5/tipy';
import {
  dataTekst,
  dzQuery,
  dzZadachi,
  sZavisimymi,
  type DzZapros,
} from '@/lib/veroyatnost/dz5/zapros';
import type { VidLista } from '@/lib/veroyatnost/dz5/list';
import { DZ5_SLOVA as T } from '@/content/veroyatnost-dz5';
import { Tex } from '@/components/ui/Tex';
import { ZadachaDz5 } from './ZadachaDz5';

export interface DomashnyayaRabotaProps {
  /** Адрес раздела: страница печати ДЗ лежит под ним. */
  base: string;
}

type Etap = 'start' | 'vybor' | 'vydano';

/** План генератора по умолчанию: по типу ДЗ №9, 9 задач. */
const PLAN_START: PlanDz = { 'hotya-by': 2, bernulli: 1, polnaya: 2, bayes: 2, kost: 1, eyler: 1 };
const MAX_TIPA = 6;

/**
 * Состояние экрана — в браузере (localStorage): выданное ДЗ и выбор
 * переживают перезагрузку и переход на другую вкладку. Хранилище —
 * внешнее для React (useSyncExternalStore), как «Мои комплекты»
 * генератора (lib/komplekt.ts). Закрытое хранилище — состояние живёт
 * в памяти страницы.
 */
const KLYUCH = 'dz5:sostoyanie';

interface Sostoyanie {
  etap: Etap;
  istochnik: 'nabor' | 'gen';
  nabor: string;
  zadachi: number[];
  plan: PlanDz;
  seed: string;
  date: string;
}

function segodnya(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nachalnoe(seed: string, date: string): Sostoyanie {
  const pervyy = nabory5()[0];
  return {
    etap: 'start',
    istochnik: 'nabor',
    nabor: pervyy?.id ?? '',
    zadachi: pervyy === undefined ? [] : pervyy.zadachi.map((_, i) => i + 1),
    plan: PLAN_START,
    seed,
    date,
  };
}

/* На сборке и до гидратации — состояние без даты и случайности. */
const NA_SERVERE = JSON.stringify(nachalnoe('dz5', ''));

let pamyat: string | null = null;
const slushateli = new Set<() => void>();

function snimok(): string {
  if (pamyat === null) {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(KLYUCH);
    } catch {
      raw = null;
    }
    pamyat = raw ?? JSON.stringify(nachalnoe(randomSeed(), segodnya()));
  }
  return pamyat;
}

function zapisat(s: Sostoyanie) {
  pamyat = JSON.stringify(s);
  try {
    window.localStorage.setItem(KLYUCH, pamyat);
  } catch {
    /* Хранилище закрыто — состояние остаётся в памяти страницы. */
  }
  slushateli.forEach((f) => f());
}

function podpiska(f: () => void) {
  slushateli.add(f);
  return () => {
    slushateli.delete(f);
  };
}

/**
 * Вкладка «Домашняя работа» задания №5.
 *
 * «Выдать ДЗ» → источник: готовый набор (задачи отмечаются галочками)
 * или генератор (типы и количество, «Сгенерировать заново» — новый
 * seed). Выданное ДЗ — шапка с датой, кнопки трёх листов (ученику без
 * ответов, ответы, решения) и задачи со сквозной нумерацией. Пометка
 * типа у задачи — только на экране учителя: на листы она не попадает
 * и при печати экрана прячется.
 *
 * Задачи считаются в браузере из шаблонов (lib/veroyatnost/dz5) —
 * тем же кодом, что и страница печати, поэтому лист и экран всегда
 * совпадают.
 */
export function DomashnyayaRabota({ base }: DomashnyayaRabotaProps) {
  const id = useId();
  const nabory = useMemo(() => nabory5(), []);
  const pervyy = nabory[0];
  const tekst = useSyncExternalStore(podpiska, snimok, () => NA_SERVERE);
  const sost = useMemo(() => JSON.parse(tekst) as Sostoyanie, [tekst]);
  const { etap, istochnik, plan, seed, date } = sost;
  const naborId = nabory.some((n) => n.id === sost.nabor) ? sost.nabor : (pervyy?.id ?? '');
  const otmecheno = sost.zadachi;
  const obnovit = (chto: Partial<Sostoyanie>) => zapisat({ ...sost, ...chto });
  const setEtap = (e: Etap) => obnovit({ etap: e });
  const setIstochnik = (i: 'nabor' | 'gen') => obnovit({ istochnik: i });
  const setOtmecheno = (z: number[]) => obnovit({ zadachi: z });
  const setDate = (d: string) => obnovit({ date: d });

  const nabor = nabory.find((n) => n.id === naborId) ?? pervyy;
  const zapros: Omit<DzZapros, 'vid' | 'theme' | 'date'> = {
    istochnik,
    nabor: nabor?.id ?? '',
    zadachi: otmecheno,
    plan,
    seed,
  };
  const naborKod = nabor?.id ?? '';
  const zadachi = useMemo(
    () => dzZadachi({ istochnik, nabor: naborKod, zadachi: otmecheno, plan, seed }),
    [istochnik, naborKod, otmecheno, plan, seed],
  );
  /* Задачи, добавленные сами: «в условиях предыдущей задачи». */
  const dobavleno =
    istochnik === 'nabor' && nabor !== undefined
      ? sZavisimymi(otmecheno, nabor.svyazi).filter((n) => !otmecheno.includes(n))
      : [];

  const vsego = zadachi.length;
  const href = (vid: VidLista) =>
    `${base}/dz/pechat/?${dzQuery({ ...zapros, date, vid, theme: 'color' })}`;
  const shapka = [T.shapka, dataTekst(date)].filter(Boolean).join(' · ');

  function vybratNabor(nid: string) {
    const n = nabory.find((x) => x.id === nid);
    obnovit({ nabor: nid, zadachi: n === undefined ? [] : n.zadachi.map((_, i) => i + 1) });
  }
  function pereklyuchit(n: number) {
    setOtmecheno(
      otmecheno.includes(n)
        ? otmecheno.filter((x) => x !== n)
        : [...otmecheno, n].sort((a, b) => a - b),
    );
  }
  function izmenitPlan(tip: Tip5, delta: number) {
    obnovit({
      plan: { ...plan, [tip]: Math.max(0, Math.min(MAX_TIPA, (plan[tip] ?? 0) + delta)) },
    });
  }
  function vydat() {
    setEtap('vydano');
  }
  function zanovo() {
    obnovit({ seed: randomSeed() });
  }

  if (etap === 'start') {
    return (
      <section className="dz5 dz5-start" aria-labelledby={`${id}-start`}>
        <h3 className="t-h3" id={`${id}-start`}>
          {T.title}
        </h3>
        <p className="dz5-start__lead">{T.lead}</p>
        <button type="button" className="btn btn--primary btn--lg" onClick={() => setEtap('vybor')}>
          {T.vydat}
        </button>
      </section>
    );
  }

  if (etap === 'vydano') {
    return (
      <section className="dz5 dz5-vydano" aria-labelledby={`${id}-shapka`}>
        <header className="dz5-shapka">
          <p className="dz5-shapka__chip">{T.chip}</p>
          <h2 className="t-h2 dz5-shapka__title" id={`${id}-shapka`}>
            {shapka}
          </h2>
          <p className="dz5-shapka__meta">
            {counted(vsego, 'задача', 'задачи', 'задач')} ·{' '}
            {istochnik === 'nabor' ? nabor?.nazvanie : T.izGeneratora}
          </p>
        </header>
        <div className="dz5-knopki">
          <a className="btn btn--primary" href={href('uchenik')} target="_blank" rel="noopener">
            {T.pechat}
          </a>
          <a className="btn btn--secondary" href={href('otvety')} target="_blank" rel="noopener">
            {T.otvety}
          </a>
          <a className="btn btn--secondary" href={href('resheniya')} target="_blank" rel="noopener">
            {T.resheniya}
          </a>
          {istochnik === 'gen' ? (
            <button type="button" className="btn btn--ghost" onClick={zanovo}>
              {T.zanovo}
            </button>
          ) : null}
          <button type="button" className="btn btn--ghost" onClick={() => setEtap('vybor')}>
            {T.izmenit}
          </button>
        </div>
        <Note>{T.notaTip}</Note>
        <ol className="dz5-spisok">
          {zadachi.map((z, i) => (
            <ZadachaDz5 key={`${z.id}-${i}`} nomer={i + 1} zadacha={z} />
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section className="cfg dz5" aria-labelledby={`${id}-title`}>
      <h2 className="t-h2 cfg__title" id={`${id}-title`}>
        {T.vyborTitle}
      </h2>
      <div className="cfg__layout">
        <div className="cfg__steps">
          <section className="cfg-step" aria-labelledby={`${id}-src`}>
            <StepHead id={`${id}-src`} no="1" title={T.istochnik.title} lead={T.istochnik.lead} />
            <div className="cfg-params">
              <OptionGroup id={`${id}-src-group`} label={T.istochnik.label}>
                <Option
                  checked={istochnik === 'nabor'}
                  onSelect={() => setIstochnik('nabor')}
                  title={T.istochnik.nabor}
                  lead={T.istochnik.naborLead}
                />
                <Option
                  checked={istochnik === 'gen'}
                  onSelect={() => setIstochnik('gen')}
                  title={T.istochnik.gen}
                  lead={T.istochnik.genLead}
                />
              </OptionGroup>
            </div>
          </section>

          {istochnik === 'nabor' ? (
            <section className="cfg-step" aria-labelledby={`${id}-nabor`}>
              <StepHead id={`${id}-nabor`} no="2" title={T.nabor.title} lead={T.nabor.lead} />
              <div className="cfg-params">
                <OptionGroup id={`${id}-nabory`} label={T.nabor.label}>
                  {nabory.map((n) => (
                    <Option
                      key={n.id}
                      checked={n.id === nabor?.id}
                      onSelect={() => vybratNabor(n.id)}
                      title={n.nazvanie}
                      lead={n.opisanie}
                    />
                  ))}
                </OptionGroup>
                <p className="dz5-ssylki">
                  <button
                    type="button"
                    className="vgen-link"
                    onClick={() => setOtmecheno(nabor?.zadachi.map((_, i) => i + 1) ?? [])}
                  >
                    {T.nabor.vse}
                  </button>
                  <span aria-hidden="true">|</span>
                  <button type="button" className="vgen-link" onClick={() => setOtmecheno([])}>
                    {T.nabor.snyat}
                  </button>
                </p>
                <ul className="dz5-galochki" role="group" aria-label={T.nabor.title}>
                  {nabor?.zadachi.map((z, i) => {
                    const n = i + 1;
                    const checked = otmecheno.includes(n);
                    return (
                      <li key={z.id}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          className={clsx('dz5-galochka', checked && 'is-checked')}
                          onClick={() => pereklyuchit(n)}
                        >
                          <span className="dz5-galochka__box" aria-hidden="true" />
                          <span className="dz5-galochka__no">№ {n}</span>
                          <span className="dz5-galochka__tip">{tipOpisanie(z.tip).metka}</span>
                          <Tex
                            className="dz5-galochka__text"
                            text={z.uslovie.split('\n\n')[0] ?? ''}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {dobavleno.length > 0 ? (
                  <Note tone="warning">{T.nabor.dobavleno(dobavleno)}</Note>
                ) : null}
              </div>
            </section>
          ) : (
            <section className="cfg-step" aria-labelledby={`${id}-gen`}>
              <StepHead id={`${id}-gen`} no="2" title={T.gen.title} lead={T.gen.lead} />
              <ul className="dz5-tipy">
                {TIPY_5.map((t) => {
                  const n = plan[t.id] ?? 0;
                  const shablonov = shablonyTipa(t.id).length;
                  return (
                    <li key={t.id} className={clsx('dz5-tip-row', n > 0 && 'is-on')}>
                      <span className="dz5-tip-row__name">
                        {t.nazvanie}
                        <span className="dz5-tip-row__lead">{T.gen.shablonov(shablonov)}</span>
                      </span>
                      <span className="dz5-stepper" role="group" aria-label={t.nazvanie}>
                        <button
                          type="button"
                          className="dz5-stepper__btn"
                          aria-label={`${T.gen.menshe}: ${t.nazvanie}`}
                          disabled={n === 0}
                          onClick={() => izmenitPlan(t.id, -1)}
                        >
                          −
                        </button>
                        <output className="dz5-stepper__n" aria-live="polite">
                          {n}
                        </output>
                        <button
                          type="button"
                          className="dz5-stepper__btn"
                          aria-label={`${T.gen.bolshe}: ${t.nazvanie}`}
                          disabled={n === MAX_TIPA}
                          onClick={() => izmenitPlan(t.id, 1)}
                        >
                          +
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="dz5-ssylki">
                <button type="button" className="btn btn--secondary btn--sm" onClick={zanovo}>
                  {T.zanovo}
                </button>
              </p>
            </section>
          )}

          <section className="cfg-step" aria-labelledby={`${id}-date`}>
            <StepHead id={`${id}-date`} no="3" title={T.data.title} lead={T.data.lead} />
            <div className="cfg-params">
              <div className="cfg-param">
                <label className="cfg-param__label" htmlFor={`${id}-date-input`}>
                  {T.data.label}
                </label>
                <Input
                  id={`${id}-date-input`}
                  className="cfg-input cfg-input--date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
            </div>
          </section>

          {vsego > 0 ? (
            <section className="cfg-step" aria-labelledby={`${id}-preview`}>
              <StepHead
                id={`${id}-preview`}
                no="4"
                title={T.predprosmotr.title}
                lead={T.predprosmotr.lead}
              />
              <ol className="dz5-spisok dz5-spisok--compact">
                {zadachi.map((z, i) => (
                  <ZadachaDz5 key={`${z.id}-${i}`} nomer={i + 1} zadacha={z} />
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <aside className="cfg-summary" aria-labelledby={`${id}-summary`}>
          <h3 className="cfg-summary__title" id={`${id}-summary`}>
            {T.svodka.title}
          </h3>
          <div className="cfg-summary__family">
            <Badge tone="info">{istochnik === 'nabor' ? nabor?.nazvanie : T.izGeneratora}</Badge>
          </div>
          <p className="cfg-summary__skill">{shapka}</p>
          <ul className="cfg-summary__list">
            {TIPY_5.map((t) => {
              const n = zadachi.filter((z) => z.tip === t.id).length;
              return n === 0 ? null : (
                <li key={t.id}>
                  {t.nazvanie}
                  <span className="cfg-summary__code"> · {n}</span>
                </li>
              );
            })}
          </ul>
          <p className="cfg-summary__count">{counted(vsego, 'задача', 'задачи', 'задач')}</p>
          <button
            type="button"
            className="btn btn--primary dz5-summary__btn"
            disabled={vsego === 0}
            onClick={vydat}
          >
            {T.vydatGotovo}
          </button>
          {vsego === 0 ? <Note tone="warning">{T.pusto}</Note> : null}
        </aside>
      </div>
    </section>
  );
}
