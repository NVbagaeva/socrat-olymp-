'use client';

import { useId, useMemo, useState } from 'react';
import { Badge, Input } from '@/components/ui';
import { Note, Option, OptionGroup, SkillCards, StepHead, type SkillItem } from '../configurator';
import {
  generatorPage,
  sheetLayouts,
  sheetThemes,
  workKinds,
  type SheetLayoutId,
  type SheetThemeId,
} from '@/content/generator';
import { VYCHISLENIYA } from '@/content/vychisleniya';
import { counted } from '@/lib/plural';
import { randomSeed } from '@/lib/vychisleniya/session';
import { sheetQuery8, subtitleOf8 } from '@/lib/vychisleniya/sheet8';
import { LEVELS } from '@/lib/vychisleniya/skills';
import type { Level } from '@/lib/vychisleniya/types';

export interface Generator8ScreenProps {
  /** Адрес раздела: страницы печати лежат под ним. */
  base: string;
  skills: SkillItem[];
}

const CUSTOM = '';

/**
 * Экран вкладки «Генератор» задания №8: вид работы, навыки, параметры
 * листа. Тот же порядок шагов, что у №12, свой компонент: словарь
 * видов работы, колонок и тем — content/generator.ts, он предметно
 * нейтрален и используется как есть.
 */
export function Generator8Screen({ base, skills }: Generator8ScreenProps) {
  const customId = useId();
  const [kind, setKind] = useState(workKinds[0] ?? CUSTOM);
  const [customKind, setCustomKind] = useState('');
  const [date, setDate] = useState('');
  const dateId = useId();
  const [selected, setSelected] = useState<string[]>(skills[0] === undefined ? [] : [skills[0].id]);
  const [count, setCount] = useState<number | null>(10);
  const [level, setLevel] = useState<Level | null>('base');
  const [layout, setLayout] = useState<SheetLayoutId>('single');
  const [theme, setTheme] = useState<SheetThemeId>('color');

  const chosen = skills.filter((item) => selected.includes(item.id));
  const selectedKey = selected.join(',');
  const seed = useMemo(
    () => randomSeed(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedKey, count, level],
  );
  const allCount = chosen.reduce((sum, item) => sum + item.count, 0);
  const chosenCount = count ?? allCount;
  const kindTitle = kind === CUSTOM ? customKind.trim() : kind;
  const subtitle = subtitleOf8({ kind: kindTitle, date });
  const layoutTitle = sheetLayouts.find((item) => item.id === layout)?.title ?? '';
  const query = sheetQuery8({
    skills: chosen.map((item) => item.id),
    count: chosenCount,
    level,
    seed,
    theme,
    layout,
    kind: kindTitle,
    date,
  });
  const studentHref = `${base}/pechat/?${query}`;
  const teacherHref = `${base}/pechat/otvety/?${query}`;
  const themeTitle = sheetThemes.find((item) => item.id === theme)?.title ?? '';

  function toggleSkill(id: string) {
    /* Последний выбранный навык снять нельзя: пустой вариант не собирается. */
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    if (next.length === 0) {
      return;
    }
    setSelected(next);
  }

  return (
    <section className="cfg">
      <h2 className="t-h2 cfg__title">{generatorPage.title}</h2>

      <div className="cfg__layout">
        <div className="cfg__steps">
          <section className="cfg-step" aria-labelledby="z8-gen-step-kind">
            <StepHead id="z8-gen-step-kind" no={generatorPage.kind.step} title={generatorPage.kind.title} lead={generatorPage.kind.lead} />
            <div className="cfg-params">
              <div className="cfg-param" role="radiogroup" aria-labelledby="z8-gen-step-kind">
                <div className="cfg-param__options">
                  {workKinds.map((item) => (
                    <Option key={item} checked={kind === item} onSelect={() => setKind(item)} title={item} />
                  ))}
                  <Option checked={kind === CUSTOM} onSelect={() => setKind(CUSTOM)} title={generatorPage.kind.custom} />
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
              <div className="cfg-param">
                <label className="cfg-param__label" htmlFor={dateId}>
                  {generatorPage.kind.date}
                </label>
                <Input id={dateId} className="cfg-input cfg-input--date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>
            </div>
          </section>

          <section className="cfg-step" aria-labelledby="z8-gen-step-skills">
            <StepHead
              id="z8-gen-step-skills"
              no={generatorPage.skills.step}
              title={generatorPage.skills.title}
              lead={generatorPage.skills.lead.replace('{family}', VYCHISLENIYA.title)}
            />
            <div className="z8-skills">
              <SkillCards items={skills} selected={selected} onToggle={toggleSkill} multiple labelledBy="z8-gen-step-skills" />
            </div>
          </section>

          <section className="cfg-step" aria-labelledby="z8-gen-step-params">
            <StepHead id="z8-gen-step-params" no={generatorPage.params.step} title={generatorPage.params.title} lead={generatorPage.params.lead} />
            <div className="cfg-params">
              <OptionGroup id="z8-gen-param-count" label={generatorPage.params.count} compact>
                {[5, 10, 20, null].map((item) => (
                  <Option
                    key={item ?? 'all'}
                    checked={count === item}
                    onSelect={() => setCount(item)}
                    title={item === null ? `${generatorPage.params.all} (${allCount})` : item}
                  />
                ))}
              </OptionGroup>

              <OptionGroup id="z8-gen-param-level" label={generatorPage.params.level}>
                {LEVELS.map((item) => (
                  <Option key={item.id} checked={level === item.id} onSelect={() => setLevel(item.id)} title={item.nazvanie} lead={item.lead} />
                ))}
              </OptionGroup>

              <OptionGroup id="z8-gen-param-layout" label={generatorPage.params.layout}>
                {sheetLayouts.map((item) => (
                  <Option key={item.id} checked={layout === item.id} onSelect={() => setLayout(item.id)} title={item.title} />
                ))}
              </OptionGroup>

              <OptionGroup id="z8-gen-param-theme" label={generatorPage.params.theme}>
                {sheetThemes.map((item) => (
                  <Option key={item.id} checked={theme === item.id} onSelect={() => setTheme(item.id)} title={item.title} />
                ))}
              </OptionGroup>
            </div>
          </section>
        </div>

        <aside className="cfg-summary" aria-labelledby="z8-gen-summary-title">
          <h3 className="cfg-summary__title" id="z8-gen-summary-title">
            {generatorPage.summary.title}
          </h3>
          <Badge tone="info">{VYCHISLENIYA.title}</Badge>
          {subtitle === '' ? null : <p className="cfg-summary__skill">{subtitle}</p>}
          <ul className="cfg-summary__list">
            {chosen.map((item) => (
              <li key={item.id}>
                {item.title}
                <span className="cfg-summary__code"> {item.id}</span>
              </li>
            ))}
          </ul>
          <p className="cfg-summary__count">
            {counted(chosenCount, 'задание', 'задания', 'заданий')} · {layoutTitle} · {themeTitle}
          </p>
          <Note>{generatorPage.summary.note}</Note>
        </aside>
      </div>

      <div className="cfg-bar cfg-bar--two">
        <a className="btn btn--primary btn--lg cfg-bar__start" href={studentHref} target="_blank" rel="noopener">
          {generatorPage.student}
        </a>
        <a className="btn btn--secondary btn--lg cfg-bar__start" href={teacherHref} target="_blank" rel="noopener">
          {generatorPage.teacher}
        </a>
        <p className="cfg-bar__summary">
          {VYCHISLENIYA.title}
          {subtitle === '' ? '' : ` · ${subtitle}`} · {chosen.map((item) => item.title).join(', ')} · {counted(chosenCount, 'задание', 'задания', 'заданий')}
        </p>
      </div>
    </section>
  );
}
