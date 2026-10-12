'use client';

import { useId, useState, useSyncExternalStore } from 'react';
import { Badge, Button, Input } from '@/components/ui';
import { zachyotText } from '@/content/ves12';
import {
  DEFAULT_GRADES,
  DEFAULT_TITLE,
  MAX_VARIANTS,
  MINUTES_PER_TASK,
  PER_TYPE,
  defaultSets,
  minutesLabel,
  newWorkCode,
  planWork,
  tasksLabel,
  usableSets,
  workQuery,
  type Grades,
  type WorkParams,
  type WorkSource,
} from '@/lib/ves12/work';
import type { Ves12Catalog } from '@/lib/ves12/types';
import { counted } from '@/lib/plural';
import { Note, Option, OptionGroup, StepHead } from '../configurator';
import { TypePicker } from './TypePicker';
import { CopyLink } from './CopyLink';
import { ZACHYOT_PRINT_HREF, ZACHYOT_RUN_HREF } from './paths';

export interface ZachyotSetupProps {
  catalog: Ves12Catalog;
}

/* Первый код страницы — один на её жизнь в браузере. */
let pageCode: string | null = null;
const noSubscribe = () => () => {};
const browserCode = () => (pageCode ??= newWorkCode());
const serverCode = () => '';

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * Экран учителя: настройка зачётной работы по всем типам №12.
 *
 * Всё выбранное сразу складывается в адрес работы: из него собираются и
 * листы печати, и онлайн-режим ученика. Код работы — часть адреса:
 * «Другие задачи» выдаёт новый код, состав прототипов остаётся.
 */
export function ZachyotSetup({ catalog }: ZachyotSetupProps) {
  const ids = {
    types: useId(),
    params: useId(),
    head: useId(),
    minutes: useId(),
    title: useId(),
    teacher: useId(),
  };
  const [source, setSource] = useState<WorkSource>('fipi');
  const [selected, setSelected] = useState<string[]>(() => defaultSets(catalog, 'fipi'));
  const [perType, setPerType] = useState<number>(PER_TYPE.initial);
  const [variants, setVariants] = useState(1);
  const [minutes, setMinutes] = useState<string | null>(null);
  const [grades, setGrades] = useState<Grades>(DEFAULT_GRADES);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [teacher, setTeacher] = useState('');
  /* Код выдаётся в браузере: на сборке случайного кода быть не должно,
     иначе у всех учителей он был бы один. «Другие задачи» — новый код. */
  const firstCode = useSyncExternalStore(noSubscribe, browserCode, serverCode);
  const [freshCode, setCode] = useState<string | null>(null);
  const code = freshCode ?? firstCode;

  function changeSource(next: WorkSource) {
    setSource(next);
    const allowed = new Set(
      catalog.types.flatMap((type) => usableSets(type, next).map((set) => set.id)),
    );
    const kept = selected.filter((id) => allowed.has(id));
    setSelected(kept.length > 0 ? kept : defaultSets(catalog, next));
  }

  const draft: WorkParams = {
    sets: selected,
    perType,
    variants,
    source,
    minutes: 0,
    grades,
    title: title.trim() || DEFAULT_TITLE,
    teacher: teacher.trim(),
    code: code || '0000-00',
  };
  const plan = planWork(draft, catalog);
  const autoMinutes = Math.max(1, plan.perVariant * MINUTES_PER_TASK);
  const minutesValue = minutes === null ? autoMinutes : Math.max(0, Math.floor(Number(minutes)) || 0);
  const params: WorkParams = { ...draft, minutes: minutesValue || autoMinutes };
  const gradesOk = grades.five >= grades.four && grades.four >= grades.three && grades.three >= 1 && grades.five <= 100;
  const ready = code !== '' && plan.perVariant > 0 && plan.shortages.length === 0 && gradesOk;
  const query = ready ? workQuery(params) : '';

  const setGrade = (key: keyof Grades, raw: string) => {
    const n = Math.max(0, Math.min(100, Math.floor(Number(raw)) || 0));
    setGrades({ ...grades, [key]: n });
  };

  return (
    <section className="cfg ves-setup">
      <div className="cfg__layout">
        <div className="cfg__steps">
          <section className="cfg-step" aria-labelledby={ids.types}>
            <StepHead id={ids.types} {...zachyotText.steps.types} />
            <div className="cfg-params ves-source">
              <OptionGroup id={`${ids.types}-src`} label={zachyotText.source}>
                {(['fipi', 'all'] as const).map((item) => (
                  <Option
                    key={item}
                    checked={source === item}
                    onSelect={() => changeSource(item)}
                    title={zachyotText.sources[item].title}
                    lead={zachyotText.sources[item].lead}
                  />
                ))}
              </OptionGroup>
            </div>
            <TypePicker
              catalog={catalog}
              source={source}
              selected={selected}
              onChange={setSelected}
              labelledBy={ids.types}
              fipiCounts
            />
          </section>

          <section className="cfg-step" aria-labelledby={ids.params}>
            <StepHead id={ids.params} {...zachyotText.steps.params} />
            <div className="cfg-params">
              <OptionGroup id={`${ids.params}-n`} label={zachyotText.perType} compact>
                {range(PER_TYPE.min, PER_TYPE.max).map((n) => (
                  <Option key={n} checked={perType === n} onSelect={() => setPerType(n)} title={n} />
                ))}
              </OptionGroup>
              <OptionGroup id={`${ids.params}-v`} label={zachyotText.variants} compact>
                {range(1, MAX_VARIANTS).map((n) => (
                  <Option key={n} checked={variants === n} onSelect={() => setVariants(n)} title={n} />
                ))}
              </OptionGroup>
              {plan.shortages.map((item) => (
                <Note key={item.set.id} tone="warning">
                  {zachyotText.shortage(item.type.title, item.set.id, item.have, item.need)}
                </Note>
              ))}
              <div className="cfg-param">
                <label className="cfg-param__label" htmlFor={ids.minutes}>
                  {zachyotText.minutes}
                </label>
                <Input
                  id={ids.minutes}
                  className="cfg-input ves-input--short"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={minutes ?? String(autoMinutes)}
                  onChange={(event) => setMinutes(event.target.value)}
                />
                <span className="ves-hint">{zachyotText.minutesHint(autoMinutes)}</span>
              </div>
              <div className="cfg-param" role="group" aria-labelledby={`${ids.params}-g`}>
                <span className="cfg-param__label" id={`${ids.params}-g`}>
                  {zachyotText.grades}
                </span>
                <div className="ves-grades">
                  {(['five', 'four', 'three'] as const).map((key, i) => (
                    <label key={key} className="ves-grade">
                      <span>{zachyotText.gradeFrom(5 - i)}</span>
                      <Input
                        className="cfg-input ves-input--short"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={100}
                        value={String(grades[key])}
                        onChange={(event) => setGrade(key, event.target.value)}
                      />
                      <span>%</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="cfg-step" aria-labelledby={ids.head}>
            <StepHead id={ids.head} {...zachyotText.steps.head} />
            <div className="cfg-params">
              <div className="cfg-param">
                <label className="cfg-param__label" htmlFor={ids.title}>
                  {zachyotText.title}
                </label>
                <Input
                  id={ids.title}
                  className="cfg-input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="cfg-param">
                <label className="cfg-param__label" htmlFor={ids.teacher}>
                  {zachyotText.teacher}
                </label>
                <Input
                  id={ids.teacher}
                  className="cfg-input"
                  value={teacher}
                  onChange={(event) => setTeacher(event.target.value)}
                  placeholder={zachyotText.teacherPlaceholder}
                  autoComplete="name"
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="cfg-summary ves-summary" aria-label={zachyotText.summary.title}>
          <h3 className="cfg-summary__title">{zachyotText.summary.title}</h3>
          <p className="cfg-summary__skill">{params.title}</p>
          {plan.types.length === 0 ? (
            <Note tone="warning">{zachyotText.empty}</Note>
          ) : (
            <ul className="cfg-summary__list">
              {plan.types.map((item) => (
                <li key={item.type.id}>
                  {item.type.title} <span className="cfg-summary__code">· {tasksLabel(item.slots.length)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="cfg-summary__count ves-summary__count" data-testid="zachyot-count">
            {zachyotText.summary.perVariant(tasksLabel(plan.perVariant))} ·{' '}
            {counted(variants, 'вариант', 'варианта', 'вариантов')}
            <br />
            {zachyotText.summary.total(tasksLabel(plan.perVariant * variants))}
            <br />
            {zachyotText.summary.time(minutesLabel(params.minutes))}
          </p>
          <div className="ves-code">
            <span className="ves-code__label">{zachyotText.code}</span>
            <Badge tone="info" className="ves-code__value" data-testid="zachyot-code">
              {code || '…'}
            </Badge>
            <p className="ves-hint">{zachyotText.codeLead}</p>
            <Button size="sm" variant="secondary" onClick={() => setCode(newWorkCode())}>
              {zachyotText.regenerate}
            </Button>
          </div>
        </aside>
      </div>

      <div className="ves-actions" aria-live="polite">
        <div className="ves-actions__group">
          <h3 className="ves-actions__title">{zachyotText.print}</h3>
          <div className="ves-actions__row">
            <a
              className={`btn btn--primary${ready ? '' : ' is-disabled'}`}
              href={ready ? `${ZACHYOT_PRINT_HREF}?${query}` : undefined}
              aria-disabled={!ready}
              target="_blank"
              rel="noopener"
              data-testid="zachyot-print-student"
            >
              {zachyotText.printStudent}
            </a>
            <a
              className={`btn btn--secondary${ready ? '' : ' is-disabled'}`}
              href={ready ? `${ZACHYOT_PRINT_HREF}otvety/?${query}` : undefined}
              aria-disabled={!ready}
              target="_blank"
              rel="noopener"
              data-testid="zachyot-print-teacher"
            >
              {zachyotText.printTeacher}
            </a>
          </div>
        </div>
        <div className="ves-actions__group">
          <h3 className="ves-actions__title">{zachyotText.link}</h3>
          <p className="ves-hint">{zachyotText.linkLead}</p>
          {ready ? (
            <div className="ves-links">
              <CopyLink label={zachyotText.linkAll} path={`${ZACHYOT_RUN_HREF}?${query}`} testId="zachyot-link" />
              {variants > 1
                ? range(1, variants).map((n) => (
                    <CopyLink
                      key={n}
                      label={zachyotText.linkVariant(n)}
                      path={`${ZACHYOT_RUN_HREF}?${query}&var=${n}`}
                    />
                  ))
                : null}
            </div>
          ) : null}
          <Note>{zachyotText.later}</Note>
        </div>
      </div>
    </section>
  );
}
