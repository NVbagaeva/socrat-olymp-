'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge, Button, Input } from '@/components/ui';
import { persistent } from '@/lib/storage';
import { sostavText, zachyotText } from '@/content/ves12';
import {
  DEFAULT_GRADES,
  DEFAULT_TITLE,
  MAX_VARIANTS,
  MINUTES_PER_TASK,
  compositionLead,
  matchTemplate,
  newWorkCode,
  normalCode,
  openTypes,
  parseSettings,
  planWork,
  settingsQuery,
  templates as workTemplates,
  typeSource,
  workQuery,
  type Grades,
  type WorkOrder,
  type WorkParams,
  type WorkSource,
} from '@/lib/ves12/work';
import type { Ves12Catalog } from '@/lib/ves12/types';
import type { WorkPreview } from '@/lib/ves12/build';
import { Note } from '../configurator';
import { SostavPicker, type SostavRow, type SostavTemplate, type SostavValue } from './SostavPicker';
import { Segmented } from './Segmented';
import { StepTabs } from './StepTabs';
import { WorkSummary } from './WorkSummary';
import { CopyLink } from './CopyLink';
import { ZACHYOT_PRINT_HREF, ZACHYOT_RUN_HREF } from './paths';
import type { TemplateIconName } from './icons';

export interface ZachyotSetupProps {
  catalog: Ves12Catalog;
}

/* Последний собранный набор и имя учителя — удобство одного браузера:
   работа сама по себе в хранилище не живёт, её задаёт адрес. */
const lastStore = persistent<string | null>('zachyot12:last', null);
const teacherStore = persistent<string>('zachyot12:teacher', '');

const ICONS: Record<string, TemplateIconName> = {
  ege: 'sheet',
  short: 'shield',
  'lin-quad': 'parabola',
  'exp-log': 'exp',
  'rat-sqrt': 'hyperbola',
  trig: 'wave',
};

type Settings = Omit<WorkParams, 'code'>;

function defaults(catalog: Ves12Catalog): Settings {
  const ege = workTemplates(catalog)[0];
  return {
    counts: { ...(ege?.counts ?? {}) },
    off: [],
    analogs: [],
    variants: 1,
    source: 'fipi',
    minutes: 0,
    grades: DEFAULT_GRADES,
    order: 'types',
    title: DEFAULT_TITLE,
    teacher: '',
  };
}

/**
 * Экран учителя: зачётная работа по всем типам №12 в три шага.
 *
 * 1. Что включить — шаблон быстрого старта, счётчики по типам,
 *    прототипы по желанию. 2. Формат — варианты, время, источник.
 *    3. Оформление и выдача — заголовок, учитель, после сборки — код,
 *    ссылка для учеников, печать.
 *
 * Главная кнопка одна: «Собрать работу», после сборки — «Скачать для
 * печати»; изменили настройки — снова «Собрать работу», а прежний код
 * помечен «устарел». Настройки всегда в адресе страницы: ссылкой на
 * экран можно поделиться.
 */
export function ZachyotSetup({ catalog }: ZachyotSetupProps) {
  const query = useSearchParams();
  const ids = { title: useId(), teacher: useId(), minutes: useId() };
  /* minutes: 0 — время считается само (3 минуты на задачу). */
  const [settings, setSettings] = useState<Settings>(() => {
    const fromUrl = parseSettings(query);
    return fromUrl === null ? defaults(catalog) : { ...fromUrl, minutes: query.has('t') ? fromUrl.minutes : 0 };
  });
  const [step, setStep] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [timeEdit, setTimeEdit] = useState(false);
  const [code, setCode] = useState<string | null>(() => normalCode(query.get('kod') ?? ''));
  const [built, setBuilt] = useState<{ settings: string; code: string } | null>(null);
  const [preview, setPreview] = useState<WorkPreview | null>(null);
  const [building, setBuilding] = useState(false);
  const last = useSyncExternalStore(lastStore.subscribe, lastStore.read, lastStore.initial);
  const savedTeacher = useSyncExternalStore(teacherStore.subscribe, teacherStore.read, teacherStore.initial);
  const [teacherTyped, setTeacherTyped] = useState<string | null>(() =>
    query.has('u') ? (query.get('u') ?? '') : null,
  );
  const teacher = teacherTyped ?? savedTeacher;

  const plan = planWork({ ...settings, teacher }, catalog);
  const autoMinutes = Math.max(1, plan.perVariant * MINUTES_PER_TASK);
  const minutes = settings.minutes > 0 ? settings.minutes : autoMinutes;
  const current: Settings = { ...settings, minutes, teacher, title: settings.title.trim() || DEFAULT_TITLE };
  const settingsKey = settingsQuery(current);
  const fresh = built !== null && built.settings === settingsKey;
  const empty = plan.perVariant === 0;
  const short = plan.shortages.length > 0;

  /* Настройки — в адрес страницы: ссылкой можно поделиться. */
  useEffect(() => {
    const kod = code === null ? '' : `&kod=${encodeURIComponent(code)}`;
    window.history.replaceState(window.history.state, '', `?${settingsKey}${kod}`);
  }, [settingsKey, code]);

  async function build(nextCode: string) {
    setBuilding(true);
    const params: WorkParams = { ...current, code: nextCode };
    const mod = await import('@/lib/ves12/build');
    /* Кадр кнопке: ожидание видно, пока движок считает варианты. */
    await new Promise((resolve) => window.setTimeout(resolve, 20));
    const result = mod.previewOf(params, catalog);
    setPreview(result);
    setCode(nextCode);
    setBuilt({ settings: settingsKey, code: nextCode });
    setBuilding(false);
    setStep(2);
    lastStore.write(settingsQuery({ ...current, teacher: '' }));
    if (teacher !== '') {
      teacherStore.write(teacher);
    }
  }

  /* Пришли по ссылке с кодом — работа собирается сразу. */
  const autoBuilt = useRef(false);
  useEffect(() => {
    if (!autoBuilt.current && code !== null && !empty && !short) {
      autoBuilt.current = true;
      void build(code);
    }
    /* Только при входе: дальше собирает кнопка. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(patch: Partial<Settings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  /* Шаблоны: «Как в прошлый раз» — первым, если сохранён. */
  const lastSettings = last === null ? null : parseSettings(new URLSearchParams(last));
  const base = workTemplates(catalog).map(
    (item): SostavTemplate => ({ ...item, icon: ICONS[item.id] ?? 'sheet' }),
  );
  const tiles: SostavTemplate[] =
    lastSettings === null
      ? base
      : [
          {
            id: 'last',
            title: sostavText.last,
            lead: compositionLead(lastSettings.counts),
            icon: 'clock',
            counts: lastSettings.counts,
            off: lastSettings.off,
          },
          ...base,
        ];
  const active =
    lastSettings !== null &&
    settingsQuery({ ...current, teacher: '' }) === settingsQuery({ ...lastSettings, teacher: '' })
      ? 'last'
      : matchTemplate(base, settings.counts);

  const rows: SostavRow[] = openTypes(catalog).map((type) => {
    const source = typeSource(current, type.id);
    return {
      id: type.id,
      title: type.title,
      icon: type.icon,
      sets: type.sets.map((set) => ({
        id: set.id,
        title: set.title,
        titleHtml: set.titleHtml,
        bank: source === 'fipi' && set.fipi !== null ? set.fipi : set.count,
      })),
    };
  });
  const soon = catalog.types.filter((type) => type.soon).map((type) => type.title);

  const params: WorkParams | null = built === null ? null : { ...current, code: built.code };
  const workQ = params === null ? '' : workQuery(params);
  const studentHref = `${ZACHYOT_PRINT_HREF}?${workQ}`;
  const runHref = `${ZACHYOT_RUN_HREF}?${workQ}`;

  const setGrade = (key: keyof Grades, raw: string) => {
    const n = Math.max(0, Math.min(100, Math.floor(Number(raw)) || 0));
    update({ grades: { ...settings.grades, [key]: n } });
  };

  const main = {
    disabled: empty || short || building,
    hint: empty ? zachyotText.emptyHint : short ? zachyotText.shortageHint : null,
    building,
    downloadHref: fresh ? `${studentHref}&oba=1` : null,
    onBuild: () => void build(code ?? newWorkCode()),
  };

  return (
    <section className="zs">
      <div className="zs__layout">
        <div className="zs__steps">
          <StepTabs steps={zachyotText.steps} current={step} onSelect={setStep} />

          {step === 0 ? (
            <div className="zs-panel" data-panel="1">
              <SostavPicker
                rows={rows}
                soon={soon}
                templates={tiles}
                activeTemplate={active}
                value={{ counts: settings.counts, off: settings.off }}
                onChange={(next: SostavValue) => update({ counts: next.counts, off: next.off })}
                onTemplate={(item) => {
                  if (item.id === 'last' && lastSettings !== null) {
                    update({ ...lastSettings, teacher: '' });
                  }
                }}
                listTitle={sostavText.types}
              />
              <div className="zs-panel__next">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  {zachyotText.next} →
                </Button>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="zs-panel" data-panel="2">
              <h3 className="zs-panel__title">{zachyotText.format}</h3>
              <div className="zs-format">
                <Segmented
                  label={zachyotText.variants}
                  value={settings.variants}
                  onChange={(n) => update({ variants: n })}
                  options={Array.from({ length: MAX_VARIANTS }, (_, i) => ({ value: i + 1, title: i + 1 }))}
                />
                <div className="seg-field">
                  <span className="seg-field__label" id={ids.minutes}>
                    {zachyotText.time}
                  </span>
                  {timeEdit ? (
                    <span className="zs-time">
                      <Input
                        className="zs-time__input"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        aria-labelledby={ids.minutes}
                        value={String(minutes)}
                        autoFocus
                        onChange={(event) =>
                          update({ minutes: Math.max(1, Math.floor(Number(event.target.value)) || 1) })
                        }
                        onBlur={() => setTimeEdit(false)}
                      />
                      мин
                    </span>
                  ) : (
                    <span className="zs-time">
                      <b data-testid="zachyot-minutes">{zachyotText.minutes(minutes)}</b>
                      <button type="button" className="zs-link" onClick={() => setTimeEdit(true)}>
                        ✎ {zachyotText.edit}
                      </button>
                    </span>
                  )}
                  <span className="zs-hint">
                    {settings.minutes > 0 ? (
                      <button type="button" className="zs-link" onClick={() => update({ minutes: 0 })}>
                        {zachyotText.timeAuto}
                      </button>
                    ) : (
                      zachyotText.perTask
                    )}
                  </span>
                </div>
                <Segmented
                  label={zachyotText.source}
                  value={settings.source}
                  onChange={(value: WorkSource) => update({ source: value })}
                  options={[
                    { value: 'fipi', title: zachyotText.sources.fipi },
                    { value: 'all', title: zachyotText.sources.all },
                  ]}
                />
              </div>

              {plan.shortages.map((item) => (
                <div key={item.type.id} className="zs-tip" role="status" data-testid="zachyot-shortage">
                  <span className="zs-tip__ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
                    </svg>
                  </span>
                  <p className="zs-tip__text">{zachyotText.shortage(item.type.title, item.enough)}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => update({ analogs: [...settings.analogs, item.type.id] })}
                    data-testid="zachyot-add-analogs"
                  >
                    {zachyotText.addAnalogs}
                  </Button>
                </div>
              ))}
              {settings.source === 'fipi' && settings.analogs.length > 0 ? (
                <p className="zs-hint">
                  {catalog.types
                    .filter((type) => settings.analogs.includes(type.id))
                    .map((type) => type.title)
                    .join(', ')}
                  : {zachyotText.analogsOn}
                </p>
              ) : null}

              <div className="zs-more">
                <button
                  type="button"
                  className="zs-more__head"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen(!moreOpen)}
                >
                  <b>{zachyotText.more}</b> <span className="zs-hint">({zachyotText.moreLead})</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {moreOpen ? (
                  <div className="zs-more__body">
                    <div className="seg-field" role="group" aria-label={zachyotText.grades}>
                      <span className="seg-field__label">{zachyotText.grades}</span>
                      <div className="zs-grades">
                        {(['five', 'four', 'three'] as const).map((key, i) => (
                          <label key={key} className="zs-grade">
                            <span>{zachyotText.gradeFrom(5 - i)}</span>
                            <Input
                              className="zs-time__input"
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={100}
                              value={String(settings.grades[key])}
                              onChange={(event) => setGrade(key, event.target.value)}
                            />
                            %
                          </label>
                        ))}
                      </div>
                    </div>
                    <Segmented
                      label={zachyotText.order}
                      value={settings.order}
                      onChange={(value: WorkOrder) => update({ order: value })}
                      options={[
                        { value: 'types', title: zachyotText.orders.types },
                        { value: 'mix', title: zachyotText.orders.mix },
                      ]}
                    />
                  </div>
                ) : null}
              </div>
              <div className="zs-panel__next">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  {zachyotText.next} →
                </Button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="zs-panel" data-panel="3">
              <h3 className="zs-panel__title">{zachyotText.design}</h3>
              <div className="zs-design">
                <div className="cfg-param">
                  <label className="cfg-param__label" htmlFor={ids.title}>
                    {zachyotText.title}
                  </label>
                  <Input
                    id={ids.title}
                    value={settings.title}
                    onChange={(event) => update({ title: event.target.value })}
                    autoComplete="off"
                  />
                </div>
                <div className="cfg-param">
                  <label className="cfg-param__label" htmlFor={ids.teacher}>
                    {zachyotText.teacher}
                  </label>
                  <Input
                    id={ids.teacher}
                    value={teacher}
                    onChange={(event) => setTeacherTyped(event.target.value)}
                    placeholder={zachyotText.teacherPlaceholder}
                    autoComplete="name"
                  />
                </div>
              </div>

              {built === null ? null : (
                <div className="zs-out" data-testid="zachyot-out">
                  <div className="zs-out__code">
                    <span className="zs-hint">{zachyotText.code}</span>
                    <Badge tone={fresh ? 'info' : 'warning'} className="zs-code" data-testid="zachyot-code">
                      {built.code}
                    </Badge>
                    {fresh ? (
                      <Button size="sm" variant="ghost" onClick={() => void build(newWorkCode())}>
                        {zachyotText.regenerate}
                      </Button>
                    ) : (
                      <Badge tone="warning" data-testid="zachyot-stale">
                        {zachyotText.stale}
                      </Badge>
                    )}
                  </div>
                  {fresh ? (
                    <>
                      <div className="zs-out__row">
                        <a
                          className="btn btn--secondary btn--sm"
                          href={studentHref}
                          target="_blank"
                          rel="noopener"
                          data-testid="zachyot-print-student"
                        >
                          {zachyotText.printStudent}
                        </a>
                        <a
                          className="btn btn--secondary btn--sm"
                          href={`${ZACHYOT_PRINT_HREF}otvety/?${workQ}`}
                          target="_blank"
                          rel="noopener"
                          data-testid="zachyot-print-teacher"
                        >
                          {zachyotText.printTeacher}
                        </a>
                      </div>
                      <h4 className="zs-out__title">{zachyotText.link}</h4>
                      <p className="zs-hint">{zachyotText.linkLead}</p>
                      <div className="ves-links">
                        <CopyLink label={zachyotText.linkAll} path={runHref} testId="zachyot-link" />
                        {settings.variants > 1
                          ? Array.from({ length: settings.variants }, (_, i) => (
                              <CopyLink
                                key={i}
                                label={zachyotText.linkVariant(i + 1)}
                                path={`${runHref}&var=${i + 1}`}
                              />
                            ))
                          : null}
                      </div>
                      <Note>{zachyotText.later}</Note>
                    </>
                  ) : (
                    <p className="zs-hint">{zachyotText.staleHint}</p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <WorkSummary
          title={current.title}
          plan={plan}
          variants={settings.variants}
          minutes={minutes}
          preview={preview}
          previewFresh={fresh}
          main={main}
        />
      </div>
    </section>
  );
}
