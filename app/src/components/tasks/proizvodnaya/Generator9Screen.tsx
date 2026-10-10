'use client';

import { useId, useState } from 'react';
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
import { PROIZVODNAYA } from '@/content/proizvodnaya';
import { ekran } from '@/content/sheet9.js';
import { counted } from '@/lib/plural';
import { sheetQuery9, subtitleOf9, RAMKI_DEFAULT } from '@/lib/proizvodnaya/sheet9';
import type { Gruppa } from '@/lib/proizvodnaya/types';
import { KitBar } from '../generator/KitBar';

export interface Generator9ScreenProps {
  /** Адрес раздела: страницы печати лежат под ним. */
  base: string;
  skills: SkillItem[];
}

const CUSTOM = '';
const RAMKI_OPTIONS = ekran.ramki.options as { n: 0 | 1 | 2; title: string; lead: string }[];

/**
 * Экран вкладки «Генератор» задания №9: вид работы, группы задач,
 * параметры листа. Тот же порядок шагов, что у №8 и №2; словарь видов
 * работы, колонок и тем — content/generator.ts.
 */
export function Generator9Screen({ base, skills }: Generator9ScreenProps) {
  const customId = useId();
  const dateId = useId();
  const [kind, setKind] = useState(workKinds[0] ?? CUSTOM);
  const [customKind, setCustomKind] = useState('');
  const [date, setDate] = useState('');
  const [selected, setSelected] = useState<string[]>(skills.map((item) => item.id));
  const [count, setCount] = useState(10);
  const [ramki, setRamki] = useState<0 | 1 | 2>(RAMKI_DEFAULT);
  const [layout, setLayout] = useState<SheetLayoutId>('single');
  const [theme, setTheme] = useState<SheetThemeId>('color');

  const chosen = skills.filter((item) => selected.includes(item.id));
  const kindTitle = kind === CUSTOM ? customKind.trim() : kind;
  const subtitle = subtitleOf9({ kind: kindTitle, date });
  const layoutTitle = sheetLayouts.find((item) => item.id === layout)?.title ?? '';
  const themeTitle = sheetThemes.find((item) => item.id === theme)?.title ?? '';
  const ramkiTitle = RAMKI_OPTIONS.find((item) => item.n === ramki)?.title ?? '';

  /* Адреса листов по seed комплекта: его выдаёт KitBar. */
  const sheetHrefs = (seed: string) => {
    const query = sheetQuery9({
      groups: chosen.map((item) => item.id as Gruppa),
      prototypes: [],
      count,
      seed,
      theme,
      layout,
      kind: kindTitle,
      date,
      ramki,
    });
    return { student: `${base}/pechat/?${query}`, teacher: `${base}/pechat/otvety/?${query}` };
  };

  function toggleGroup(id: string) {
    /* Последнюю выбранную группу снять нельзя: пустой вариант не собирается. */
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
          <section className="cfg-step" aria-labelledby="z9-gen-step-kind">
            <StepHead
              id="z9-gen-step-kind"
              no={generatorPage.kind.step}
              title={generatorPage.kind.title}
              lead={generatorPage.kind.lead}
            />
            <div className="cfg-params">
              <div className="cfg-param" role="radiogroup" aria-labelledby="z9-gen-step-kind">
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
              <div className="cfg-param">
                <label className="cfg-param__label" htmlFor={dateId}>
                  {generatorPage.kind.date}
                </label>
                <Input
                  id={dateId}
                  className="cfg-input cfg-input--date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="cfg-step" aria-labelledby="z9-gen-step-groups">
            <StepHead
              id="z9-gen-step-groups"
              no={generatorPage.skills.step}
              title={ekran.groups.title}
              lead={ekran.groups.lead}
            />
            <div className="z9-groups">
              <SkillCards
                items={skills}
                selected={selected}
                onToggle={toggleGroup}
                multiple
                labelledBy="z9-gen-step-groups"
              />
            </div>
          </section>

          <section className="cfg-step" aria-labelledby="z9-gen-step-params">
            <StepHead
              id="z9-gen-step-params"
              no={generatorPage.params.step}
              title={generatorPage.params.title}
              lead={generatorPage.params.lead}
            />
            <div className="cfg-params">
              <OptionGroup id="z9-gen-param-count" label={ekran.count} compact>
                {[5, 10, 15, 20].map((item) => (
                  <Option
                    key={item}
                    checked={count === item}
                    onSelect={() => setCount(item)}
                    title={item}
                  />
                ))}
              </OptionGroup>

              <OptionGroup id="z9-gen-param-ramki" label={ekran.ramki.label}>
                {RAMKI_OPTIONS.map((item) => (
                  <Option
                    key={item.n}
                    checked={ramki === item.n}
                    onSelect={() => setRamki(item.n)}
                    title={item.title}
                    lead={item.lead}
                  />
                ))}
              </OptionGroup>

              <OptionGroup id="z9-gen-param-layout" label={generatorPage.params.layout}>
                {sheetLayouts.map((item) => (
                  <Option
                    key={item.id}
                    checked={layout === item.id}
                    onSelect={() => setLayout(item.id)}
                    title={item.title}
                  />
                ))}
              </OptionGroup>

              <OptionGroup id="z9-gen-param-theme" label={generatorPage.params.theme}>
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
          </section>
        </div>

        <aside className="cfg-summary" aria-labelledby="z9-gen-summary-title">
          <h3 className="cfg-summary__title" id="z9-gen-summary-title">
            {generatorPage.summary.title}
          </h3>
          <Badge tone="info">{PROIZVODNAYA.title}</Badge>
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
            {counted(count, 'задание', 'задания', 'заданий')} · {ramkiTitle} · {layoutTitle} ·{' '}
            {themeTitle}
          </p>
          <Note>{ekran.summaryNote}</Note>
        </aside>
      </div>

      <KitBar
        scope="9"
        slot={base}
        section={`№9 · ${PROIZVODNAYA.title}`}
        count={count}
        ready
        hrefs={sheetHrefs}
        summary={
          <>
            {PROIZVODNAYA.title}
            {subtitle === '' ? '' : ` · ${subtitle}`} ·{' '}
            {chosen.map((item) => item.title).join(', ')} ·{' '}
            {counted(count, 'задание', 'задания', 'заданий')}
          </>
        }
      />
    </section>
  );
}
