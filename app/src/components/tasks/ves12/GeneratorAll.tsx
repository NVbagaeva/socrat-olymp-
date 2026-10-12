'use client';

import { useId, useState } from 'react';
import { generatorAllText, zachyotText } from '@/content/ves12';
import {
  generatorPage,
  sheetLayouts,
  sheetThemes,
  variantCounts,
  workKinds,
  type SheetLayoutId,
  type SheetThemeId,
} from '@/content/generator';
import { sheetQuery } from '@/lib/generatorQuery';
import { firstSets, planWork, tasksLabel } from '@/lib/ves12/work';
import type { Ves12Catalog } from '@/lib/ves12/types';
import { counted } from '@/lib/plural';
import { Note, Option, OptionGroup, StepHead } from '../configurator';
import { KitBar } from '../generator/KitBar';
import { TypePicker } from './TypePicker';
import { GENERATOR_ALL_HREF } from './paths';

export interface GeneratorAllProps {
  catalog: Ves12Catalog;
}

const PER_SET = [1, 2, 3, 4, 5];
const EXAMPLES = [0, 1, 2];

/**
 * Генератор по всем типам №12: лист для отработки из любых типов и
 * прототипов, с рамками теории и разобранными примерами каждого типа.
 *
 * Лист собирает тот же генератор, что у разделов (lib/generatorSheet.ts):
 * лист ученика и лист учителя одного комплекта — из одних задач, код
 * комплекта в адресе. Отличие от зачётной работы — здесь есть теория и
 * разборы, а источник — все задачи прототипов (банк и аналоги).
 */
export function GeneratorAll({ catalog }: GeneratorAllProps) {
  const ids = { types: useId(), params: useId() };
  const [selected, setSelected] = useState<string[]>(() => firstSets(catalog));
  const [perSet, setPerSet] = useState(2);
  const [order, setOrder] = useState<'types' | 'mix'>('types');
  const [theory, setTheory] = useState(true);
  const [examples, setExamples] = useState(1);
  const [kind, setKind] = useState(generatorAllText.kind);
  const [variants, setVariants] = useState(1);
  const [layout, setLayout] = useState<SheetLayoutId>('single');
  const [theme, setTheme] = useState<SheetThemeId>('color');

  /* Типы выбранных прототипов — по каталогу, тем же планом, что у зачётной. */
  const plan = planWork(
    {
      sets: selected,
      perType: 1,
      variants: 1,
      source: 'all',
      minutes: 0,
      grades: { five: 90, four: 70, three: 50 },
      title: '',
      teacher: '',
      code: 'plan',
    },
    catalog,
  );
  const count = selected.length * perSet;
  const ready = count > 0;
  const kinds = [generatorAllText.kind, ...workKinds];

  const sheetHrefs = (seed: string) => {
    const query = sheetQuery({
      skills: selected,
      count,
      level: null,
      seed,
      theme,
      layout,
      kind,
      date: '',
      variants,
      order,
      theory,
      examples,
    });
    return {
      student: `${GENERATOR_ALL_HREF}pechat/?${query}`,
      teacher: `${GENERATOR_ALL_HREF}pechat/otvety/?${query}`,
    };
  };

  return (
    <section className="cfg ves-setup">
      <div className="cfg__layout">
        <div className="cfg__steps">
          <section className="cfg-step" aria-labelledby={ids.types}>
            <StepHead id={ids.types} {...generatorAllText.steps.types} />
            <TypePicker
              catalog={catalog}
              source="all"
              selected={selected}
              onChange={setSelected}
              labelledBy={ids.types}
            />
          </section>

          <section className="cfg-step" aria-labelledby={ids.params}>
            <StepHead id={ids.params} {...generatorAllText.steps.params} />
            <div className="cfg-params">
              <OptionGroup id={`${ids.params}-k`} label={generatorPage.kind.title}>
                {kinds.map((item) => (
                  <Option key={item} checked={kind === item} onSelect={() => setKind(item)} title={item} />
                ))}
              </OptionGroup>
              <OptionGroup id={`${ids.params}-n`} label={generatorAllText.perSet} compact>
                {PER_SET.map((n) => (
                  <Option key={n} checked={perSet === n} onSelect={() => setPerSet(n)} title={n} />
                ))}
              </OptionGroup>
              <OptionGroup id={`${ids.params}-o`} label={generatorAllText.order}>
                {(['types', 'mix'] as const).map((item) => (
                  <Option
                    key={item}
                    checked={order === item}
                    onSelect={() => setOrder(item)}
                    title={generatorAllText.orders[item].title}
                    lead={generatorAllText.orders[item].lead}
                  />
                ))}
              </OptionGroup>
              <OptionGroup id={`${ids.params}-t`} label={generatorAllText.theory}>
                <Option checked={theory} onSelect={() => setTheory(true)} title={generatorAllText.theoryOn} />
                <Option checked={!theory} onSelect={() => setTheory(false)} title={generatorAllText.theoryOff} />
              </OptionGroup>
              <OptionGroup id={`${ids.params}-e`} label={generatorAllText.examples} compact>
                {EXAMPLES.map((n) => (
                  <Option key={n} checked={examples === n} onSelect={() => setExamples(n)} title={n} />
                ))}
              </OptionGroup>
              <OptionGroup id={`${ids.params}-v`} label={generatorPage.params.variants} compact>
                {variantCounts.map((n) => (
                  <Option key={n} checked={variants === n} onSelect={() => setVariants(n)} title={n} />
                ))}
              </OptionGroup>
              <OptionGroup id={`${ids.params}-l`} label={generatorPage.params.layout}>
                {sheetLayouts.map((item) => (
                  <Option key={item.id} checked={layout === item.id} onSelect={() => setLayout(item.id)} title={item.title} />
                ))}
              </OptionGroup>
              <OptionGroup id={`${ids.params}-th`} label={generatorPage.params.theme}>
                {sheetThemes.map((item) => (
                  <Option key={item.id} checked={theme === item.id} onSelect={() => setTheme(item.id)} title={item.title} />
                ))}
              </OptionGroup>
            </div>
          </section>
        </div>

        <aside className="cfg-summary ves-summary" aria-label={generatorAllText.summaryTitle}>
          <h3 className="cfg-summary__title">{generatorAllText.summaryTitle}</h3>
          <p className="cfg-summary__skill">{kind}</p>
          {plan.types.length === 0 ? (
            <Note tone="warning">{zachyotText.empty}</Note>
          ) : (
            <ul className="cfg-summary__list">
              {plan.types.map((item) => {
                const own = selected.filter((id) => item.type.sets.some((set) => set.id === id)).length;
                return (
                  <li key={item.type.id}>
                    {item.type.title}{' '}
                    <span className="cfg-summary__code">· {tasksLabel(own * perSet)}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="cfg-summary__count" data-testid="generator-all-count">
            {tasksLabel(count)}
            {variants > 1 ? ` · ${counted(variants, 'вариант', 'варианта', 'вариантов')}` : ''}
            <br />
            {theory ? generatorAllText.theoryOn : generatorAllText.theoryOff}
            {examples > 0 ? ` · примеров на тип: ${examples}` : ''}
          </p>
          <Note>{generatorAllText.note}</Note>
        </aside>
      </div>

      <KitBar
        scope="12"
        slot={GENERATOR_ALL_HREF}
        section="№12 · Все типы функций"
        count={count * variants}
        ready={ready}
        hrefs={sheetHrefs}
        summary={
          <>
            {kind} · {plan.types.map((item) => item.type.title).join(', ')} · {tasksLabel(count)}
            {variants > 1 ? ` · ${counted(variants, 'вариант', 'варианта', 'вариантов')}` : ''}
          </>
        }
      />
    </section>
  );
}
