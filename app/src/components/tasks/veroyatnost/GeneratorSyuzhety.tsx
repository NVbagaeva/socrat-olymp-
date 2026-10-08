'use client';

import { clsx } from 'clsx';
import { useId, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui';
import {
  CountPicker,
  Note,
  Option,
  OptionGroup,
  StepHead,
  countOf,
  useCountChoice,
} from '@/components/tasks/configurator';
import {
  generatorPage,
  sheetLayouts,
  sheetThemes,
  variantCounts,
  workKinds,
  type SheetLayoutId,
  type SheetThemeId,
} from '@/content/generator';
import type { Zadanie } from '@/content/veroyatnost';
import { GENERATOR_SLOVA, type KartinkaSyuzheta } from '@/content/veroyatnost-syuzhety';
import { assetUrl } from '@/lib/assetUrl';
import { dateText, sheetQuery } from '@/lib/generatorQuery';
import { counted } from '@/lib/plural';
import { randomSeed } from '@/lib/randomSeed';
import { planCounts } from '@/lib/sheetPlan';
import { MetodIkonka } from './MetodIkonka';
import { MetodKartinka } from './MetodKartinka';
import type { Navyk } from './metody';
import type { Syuzhet } from './navyki';

export interface GeneratorSyuzhetyProps {
  zadanie: Zadanie;
  /** Адрес раздела: страницы печати лежат под ним. */
  base: string;
  /** Методы задания в порядке автора: по ним сгруппированы сюжеты. */
  metody: readonly Navyk[];
  /** Сюжеты — прототипы банка. */
  syuzhety: readonly Syuzhet[];
  /** Картинки сюжетов по коду. Нет записи — значок метода. */
  kartinki: Record<string, KartinkaSyuzheta>;
}

/** Значение «своё название» в группе видов работы. */
const CUSTOM = '';

/**
 * Список методов слева: у №5 — объёмные картинки методов, те же, что
 * на карточках тренажёра; у №4 пока значки.
 */
const KARTINKI_V_SPISKE: Record<Zadanie, boolean> = { 4: false, 5: true };

/** Карандаш: изменить дату. */
function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
      <path d="M13.5 8.5l3 3" />
    </svg>
  );
}

/** Лист: кнопки листов. */
function SheetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

/** Глаз: предпросмотр. */
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M7 7l10 10M17 7 7 17" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5.5 12.5l4 4 9-9" />
    </svg>
  );
}

/**
 * Экран генератора заданий №4 и №5 — по макету generator.png.
 *
 * Шаг 1 — вид работы и дата. Шаг 2 — сюжеты по методам: слева список
 * методов со счётчиком выбранного, справа карточки сюжетов открытого
 * метода с картинкой (или значком метода), кодом прототипа и
 * чекбоксом. Шаг 3 — количество заданий, вариантов, колонки, печать.
 * Справа закреплённая сводка: вид работы и дата, выбранные сюжеты со
 * значками методов и крестиками, итог и кнопки листов.
 *
 * Выбор живёт в памяти страницы. Кнопки открывают страницы печати в
 * новой вкладке; все параметры — в адресе. Seed варианта один на
 * набор параметров: лист ученика и лист с ответами по нему совпадают,
 * а смена сюжетов или количества даёт новый вариант.
 */
export function GeneratorSyuzhety({ zadanie, base, metody, syuzhety, kartinki }: GeneratorSyuzhetyProps) {
  const slova = GENERATOR_SLOVA;
  const id = useId();
  const dateId = useId();
  const customId = useId();
  const dateInput = useRef<HTMLInputElement>(null);

  /* Методы, у которых в банке есть сюжеты, в порядке автора. */
  const gruppy = useMemo(
    () =>
      metody
        .map((m) => ({ metod: m, syuzhety: syuzhety.filter((s) => s.metod === m.id) }))
        .filter((g) => g.syuzhety.length > 0),
    [metody, syuzhety],
  );

  const [kind, setKind] = useState(workKinds[0] ?? CUSTOM);
  const [customKind, setCustomKind] = useState('');
  const [date, setDate] = useState('');
  const [otkryt, setOtkryt] = useState(gruppy[0]?.metod.id ?? '');
  const [vybrano, setVybrano] = useState<string[]>([]);
  const [count, setCount] = useCountChoice();
  const [variants, setVariants] = useState(1);
  const [layout, setLayout] = useState<SheetLayoutId>('single');
  const [theme, setTheme] = useState<SheetThemeId>('color');

  const vybrannye = syuzhety.filter((s) => vybrano.includes(s.id));
  const allCount = vybrannye.reduce((sum, s) => sum + s.count, 0);
  const chosenCount = countOf(count, allCount);
  const selectedKey = vybrano.join(',');
  /* Seed считается заново при смене того, что влияет на задачи. */
  const seed = useMemo(
    () => randomSeed(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedKey, chosenCount],
  );
  const kindTitle = kind === CUSTOM ? customKind.trim() : kind;
  const query = sheetQuery({
    skills: vybrano,
    count: chosenCount ?? 0,
    level: null,
    seed,
    theme,
    layout,
    kind: kindTitle,
    date,
    variants,
  });
  const plan = planCounts(
    vybrannye.map((s) => ({ id: s.id, capacity: s.count })),
    chosenCount ?? 0,
  );
  const warnings = [
    ...(plan.overflow > 0 ? [] : plan.shortages).map((item) => {
      const title = vybrannye.find((s) => s.id === item.id)?.title ?? item.id;
      return generatorPage.params.shortage
        .replace('{title}', title)
        .replace('{have}', counted(item.have, 'задача', 'задачи', 'задач'))
        .replace('{give}', String(item.want - item.have));
    }),
    ...(plan.overflow > 0
      ? [
          generatorPage.params.overflow
            .replace('{have}', counted(allCount, 'задача', 'задачи', 'задач'))
            .replace('{want}', String(chosenCount ?? 0)),
        ]
      : []),
  ];
  const ready = vybrano.length > 0 && chosenCount !== null;
  const studentHref = `${base}/pechat/?${query}`;
  const teacherHref = `${base}/pechat/otvety/?${query}`;
  const previewHref = `${studentHref}&preview=1`;

  const tekushchaya = gruppy.find((g) => g.metod.id === otkryt) ?? gruppy[0];

  function pereklyuchit(syuzhetId: string) {
    setVybrano((bylo) =>
      bylo.includes(syuzhetId) ? bylo.filter((s) => s !== syuzhetId) : [...bylo, syuzhetId],
    );
  }
  function vseVMetode() {
    if (tekushchaya === undefined) {
      return;
    }
    const ids = tekushchaya.syuzhety.map((s) => s.id);
    setVybrano((bylo) => [...bylo, ...ids.filter((s) => !bylo.includes(s))]);
  }
  function snyatVse() {
    if (tekushchaya === undefined) {
      return;
    }
    const ids = new Set(tekushchaya.syuzhety.map((s) => s.id));
    setVybrano((bylo) => bylo.filter((s) => !ids.has(s)));
  }
  function kDate() {
    const node = dateInput.current;
    if (node === null) {
      return;
    }
    node.focus();
    /* Календарь браузера, где он есть; иначе хватит фокуса на поле. */
    try {
      (node as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
    } catch {
      /* Поле вне видимой области или без календаря — остаётся фокус. */
    }
  }

  const metodIkonka = (metod: string) => <MetodIkonka zadanie={zadanie} metod={metod} size="sm" />;

  return (
    <section className="cfg vgen" aria-label={slova.title}>
      <div className="cfg__layout vgen__layout">
        <div className="cfg__steps">
          {/* Шаг 1: вид работы и дата. */}
          <section className="cfg-step" aria-labelledby={`${id}-kind`}>
            <StepHead
              id={`${id}-kind`}
              no={generatorPage.kind.step}
              title={generatorPage.kind.title}
              lead={generatorPage.kind.lead}
            />
            <div className="vgen-vid">
              <div className="cfg-params">
                <div className="cfg-param" role="radiogroup" aria-labelledby={`${id}-kind`}>
                  <div className="cfg-param__options">
                    {workKinds.map((item) => (
                      <Option
                        key={item}
                        checked={kind === item}
                        onSelect={() => setKind(item)}
                        title={item}
                      />
                    ))}
                    <Option
                      checked={kind === CUSTOM}
                      onSelect={() => setKind(CUSTOM)}
                      title={generatorPage.kind.custom}
                    />
                  </div>
                </div>
                {kind === CUSTOM ? (
                  <div className="cfg-param">
                    <label className="sr-only" htmlFor={customId}>
                      {generatorPage.kind.custom}
                    </label>
                    <Input
                      id={customId}
                      className="cfg-input"
                      value={customKind}
                      onChange={(event) => setCustomKind(event.target.value)}
                      placeholder={generatorPage.kind.placeholder}
                      autoComplete="off"
                    />
                  </div>
                ) : null}
              </div>
              <div className="cfg-param vgen-vid__data">
                <label className="cfg-param__label" htmlFor={dateId}>
                  {generatorPage.kind.date}
                </label>
                <Input
                  ref={dateInput}
                  id={dateId}
                  className="cfg-input cfg-input--date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Шаг 2: сюжеты по методам. */}
          <section className="cfg-step" aria-labelledby={`${id}-zadachi`}>
            <StepHead
              id={`${id}-zadachi`}
              no={slova.zadachi.step}
              title={slova.zadachi.title}
              lead={slova.zadachi.lead}
            />
            <div className="vgen-vybor">
              <div className="vgen-metody" role="tablist" aria-label={slova.zadachi.title}>
                {gruppy.map((g) => {
                  const vMetode = g.syuzhety.filter((s) => vybrano.includes(s.id)).length;
                  const aktiven = tekushchaya?.metod.id === g.metod.id;
                  return (
                    <button
                      key={g.metod.id}
                      type="button"
                      role="tab"
                      aria-selected={aktiven}
                      className={clsx('vgen-metod', aktiven && 'is-active', vMetode > 0 && 'has-chosen')}
                      onClick={() => setOtkryt(g.metod.id)}
                    >
                      {KARTINKI_V_SPISKE[zadanie] ? (
                        <MetodKartinka zadanie={zadanie} metod={g.metod.id} nazvanie={g.metod.nazvanie} />
                      ) : (
                        metodIkonka(g.metod.id)
                      )}
                      <span className="vgen-metod__name">{g.metod.nazvanie}</span>
                      <span className="vgen-metod__schet">
                        {slova.zadachi.vybrano(vMetode, g.syuzhety.length)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {tekushchaya === undefined ? null : (
                <div className="vgen-syuzhety" role="tabpanel">
                  <header className="vgen-syuzhety__head">
                    <h4 className="vgen-syuzhety__title">{tekushchaya.metod.nazvanie}</h4>
                    <p className="vgen-syuzhety__links">
                      <button type="button" className="vgen-link" onClick={vseVMetode}>
                        {slova.zadachi.vseVMetode}
                      </button>
                      <span aria-hidden="true">|</span>
                      <button type="button" className="vgen-link" onClick={snyatVse}>
                        {slova.zadachi.snyat}
                      </button>
                    </p>
                  </header>
                  <div className="vgen-karty" role="group" aria-label={tekushchaya.metod.nazvanie}>
                    {tekushchaya.syuzhety.map((s) => {
                      const checked = vybrano.includes(s.id);
                      const kartinka = kartinki[s.id];
                      return (
                        /* Карточка — колонка из двух частей: сверху зона картинки
                           своей высоты, под ней текст. Текст стоит в потоке, а не
                           поверх картинки; поверх зоны лежит только чекбокс. */
                        <button
                          key={s.id}
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          className={clsx('vgen-karta', checked && 'is-checked')}
                          title={s.title}
                          onClick={() => pereklyuchit(s.id)}
                        >
                          <span className="vgen-karta__pic" aria-hidden="true">
                            {kartinka === undefined ? (
                              <MetodIkonka zadanie={zadanie} metod={s.metod} size="lg" />
                            ) : (
                              <img
                                className="vgen-karta__img"
                                src={assetUrl(kartinka.src)}
                                alt=""
                                loading="lazy"
                                decoding="async"
                              />
                            )}
                          </span>
                          <span className={clsx('vgen-karta__box', checked && 'is-checked')} aria-hidden="true">
                            {checked ? <CheckIcon /> : null}
                          </span>
                          <span className="vgen-karta__text">
                            <span className="vgen-karta__title">{s.title}</span>
                            <span className="vgen-karta__code">{s.id}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Шаг 3: параметры листа. */}
          <section className="cfg-step" aria-labelledby={`${id}-params`}>
            <StepHead
              id={`${id}-params`}
              no={slova.params.step}
              title={slova.params.title}
              lead={slova.params.lead}
            />
            <div className="vgen-params">
              <div className="cfg-params">
                <CountPicker
                  id={`${id}-count`}
                  label={slova.params.count}
                  max={allCount}
                  value={count}
                  onChange={setCount}
                  allWord={slova.params.all}
                />
              </div>
              <OptionGroup id={`${id}-variants`} label={slova.params.variants} compact>
                {variantCounts.map((item) => (
                  <Option
                    key={item}
                    checked={variants === item}
                    onSelect={() => setVariants(item)}
                    title={item}
                  />
                ))}
              </OptionGroup>
              <OptionGroup id={`${id}-layout`} label={slova.params.layout}>
                {sheetLayouts.map((item) => (
                  <Option
                    key={item.id}
                    checked={layout === item.id}
                    onSelect={() => setLayout(item.id)}
                    title={item.id === 'single' ? 'Одна' : 'Две'}
                  />
                ))}
              </OptionGroup>
              <OptionGroup id={`${id}-theme`} label={slova.params.theme}>
                {sheetThemes.map((item) => (
                  <Option
                    key={item.id}
                    checked={theme === item.id}
                    onSelect={() => setTheme(item.id)}
                    title={item.title}
                  />
                ))}
              </OptionGroup>
            </div>
            {warnings.map((text) => (
              <Note key={text} tone="warning">
                {text}
              </Note>
            ))}
          </section>
        </div>

        {/* Сводка справа. */}
        <aside className="cfg-summary vgen-svodka" aria-labelledby={`${id}-svodka`}>
          <h3 className="cfg-summary__title" id={`${id}-svodka`}>
            {slova.svodka.title}
          </h3>

          <div className="vgen-svodka__vid">
            <span className="vgen-svodka__ico" aria-hidden="true">
              <SheetIcon />
            </span>
            <span className="vgen-svodka__text">
              <b>{kindTitle === '' ? generatorPage.kind.custom : kindTitle}</b>
              <small>{date === '' ? slova.svodka.bezDaty : slova.svodka.data(dateText(date))}</small>
            </span>
            <button
              type="button"
              className="vgen-svodka__edit"
              aria-label={slova.svodka.izmenitDatu}
              onClick={kDate}
            >
              <PencilIcon />
            </button>
          </div>

          <p className="vgen-svodka__label">{slova.svodka.syuzhety(vybrannye.length)}</p>
          {vybrannye.length === 0 ? (
            <p className="vgen-svodka__pusto">{slova.zadachi.pusto}</p>
          ) : (
            <ul className="vgen-svodka__list">
              {vybrannye.map((s) => (
                <li key={s.id} className="vgen-svodka__row">
                  {metodIkonka(s.metod)}
                  <span className="vgen-svodka__name">{s.title}</span>
                  <button
                    type="button"
                    className="vgen-svodka__x"
                    aria-label={`${slova.svodka.ubrat}: ${s.title}`}
                    onClick={() => pereklyuchit(s.id)}
                  >
                    <CrossIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="vgen-svodka__label">{slova.svodka.itogo}</p>
          <p className="vgen-svodka__itogo">
            {!ready ? '—' : counted(chosenCount, 'задача', 'задачи', 'задач')}
            {' · '}
            {counted(variants, 'вариант', 'варианта', 'вариантов')}
          </p>

          {/* Ссылки, а не кнопки: лист открывается в новой вкладке, адрес
              можно скопировать и открыть снова — лист будет тем же. */}
          <a
            className={clsx('btn btn--primary btn--lg vgen-svodka__list-btn', ready || 'is-disabled')}
            href={ready ? studentHref : undefined}
            aria-disabled={!ready || undefined}
            target="_blank"
            rel="noopener"
          >
            <SheetIcon />
            {generatorPage.student} →
          </a>
          <a
            className={clsx('btn btn--secondary btn--lg vgen-svodka__list-btn', ready || 'is-disabled')}
            href={ready ? teacherHref : undefined}
            aria-disabled={!ready || undefined}
            target="_blank"
            rel="noopener"
          >
            <SheetIcon />
            {generatorPage.teacher}
          </a>
          <a
            className={clsx('vgen-svodka__preview', ready || 'is-disabled')}
            href={ready ? previewHref : undefined}
            aria-disabled={!ready || undefined}
            target="_blank"
            rel="noopener"
          >
            <EyeIcon />
            {slova.svodka.preview}
          </a>
        </aside>
      </div>

      {/* На узком экране сводка под шагами: кнопки листов липнут снизу. */}
      <div className="cfg-bar cfg-bar--two vgen-bar">
        <a
          className={clsx('btn btn--primary btn--lg cfg-bar__start', ready || 'is-disabled')}
          href={ready ? studentHref : undefined}
          aria-disabled={!ready || undefined}
          target="_blank"
          rel="noopener"
        >
          {generatorPage.student}
        </a>
        <a
          className={clsx('btn btn--secondary btn--lg cfg-bar__start', ready || 'is-disabled')}
          href={ready ? teacherHref : undefined}
          aria-disabled={!ready || undefined}
          target="_blank"
          rel="noopener"
        >
          {generatorPage.teacher}
        </a>
        <p className="cfg-bar__summary">
          {slova.svodka.syuzhety(vybrannye.length)} ·{' '}
          {!ready ? '—' : counted(chosenCount, 'задача', 'задачи', 'задач')}
        </p>
      </div>
    </section>
  );
}
