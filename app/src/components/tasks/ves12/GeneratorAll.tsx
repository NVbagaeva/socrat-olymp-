'use client';

import { useState } from 'react';
import { RazdelIkonka } from '@/components/tasks/razdely/RazdelIkonka';
import { generatorAllText, sostavText, zachyotText } from '@/content/ves12';
import {
  sheetLayouts,
  sheetThemes,
  variantCounts,
  workKinds,
  type SheetLayoutId,
  type SheetThemeId,
} from '@/content/generator';
import { sheetQuery } from '@/lib/generatorQuery';
import {
  DEFAULT_GRADES,
  matchTemplate,
  openTypes,
  planWork,
  tasksLabel,
  templates as workTemplates,
  variantsLabel,
  type WorkOrder,
} from '@/lib/ves12/work';
import type { Ves12Catalog } from '@/lib/ves12/types';
import { Note } from '../configurator';
import { KitBar } from '../generator/KitBar';
import { SostavPicker, type SostavRow, type SostavTemplate, type SostavValue } from './SostavPicker';
import { Segmented } from './Segmented';
import { TemplateIcon, type TemplateIconName } from './icons';
import { GENERATOR_ALL_HREF } from './paths';

export interface GeneratorAllProps {
  catalog: Ves12Catalog;
}

const ICONS: Record<string, TemplateIconName> = {
  ege: 'sheet',
  short: 'shield',
  'lin-quad': 'parabola',
  'exp-log': 'exp',
  'rat-sqrt': 'hyperbola',
  trig: 'wave',
};

/**
 * Генератор по всем типам №12: лист для отработки из любых типов, с
 * рамками теории и разобранными примерами каждого типа.
 *
 * Выбор состава — тот же компонент, что у зачётной: шаблон → счётчики по
 * типам → прототипы по желанию. Лист собирает генератор разделов
 * (lib/generatorSheet.ts): задачи каждого прототипа — по счётчикам, лист
 * ученика и лист учителя одного комплекта — из одних задач.
 */
export function GeneratorAll({ catalog }: GeneratorAllProps) {
  const base = workTemplates(catalog).map(
    (item): SostavTemplate => ({
      ...item,
      title:
        item.id === 'ege' ? generatorAllText.tplAll2 : item.id === 'short' ? generatorAllText.tplAll1 : item.title,
      icon: ICONS[item.id] ?? 'sheet',
    }),
  );
  const [value, setValue] = useState<SostavValue>(() => ({ counts: { ...(base[1]?.counts ?? {}) }, off: [] }));
  const [order, setOrder] = useState<WorkOrder>('types');
  const [theory, setTheory] = useState(true);
  const [examples, setExamples] = useState(1);
  const [kind, setKind] = useState(generatorAllText.kind);
  const [variants, setVariants] = useState(1);
  const [layout, setLayout] = useState<SheetLayoutId>('single');
  const [theme, setTheme] = useState<SheetThemeId>('color');

  /* Задачи каждого прототипа — тем же планом, что у зачётной (один вариант). */
  const plan = planWork(
    {
      ...value,
      analogs: [],
      variants: 1,
      source: 'all',
      minutes: 0,
      grades: DEFAULT_GRADES,
      order,
      title: '',
      teacher: '',
    },
    catalog,
  );
  const per: Record<string, number> = {};
  (plan.variants[0] ?? []).forEach((slot) => {
    per[slot.setId] = (per[slot.setId] ?? 0) + 1;
  });
  const skills = Object.keys(per);
  const count = plan.perVariant;

  const rows: SostavRow[] = openTypes(catalog).map((type) => ({
    id: type.id,
    title: type.title,
    icon: type.icon,
    sets: type.sets.map((set) => ({ id: set.id, title: set.title, titleHtml: set.titleHtml, bank: set.count })),
  }));

  const sheetHrefs = (seed: string) => {
    const query = sheetQuery({
      skills,
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
      per,
    });
    return {
      student: `${GENERATOR_ALL_HREF}pechat/?${query}`,
      teacher: `${GENERATOR_ALL_HREF}pechat/otvety/?${query}`,
    };
  };

  return (
    <section className="zs">
      <div className="zs__layout">
        <div className="zs__steps">
          <div className="zs-panel">
            <SostavPicker
              rows={rows}
              soon={catalog.types.filter((type) => type.soon).map((type) => type.title)}
              templates={base}
              activeTemplate={matchTemplate(base, value.counts)}
              value={value}
              onChange={setValue}
              listTitle={sostavText.types}
            />
          </div>
          <div className="zs-panel">
            <h3 className="zs-panel__title">{generatorAllText.steps.params.title}</h3>
            <div className="zs-format zs-format--wrap">
              <Segmented
                label={generatorAllText.theory}
                value={theory ? 'on' : 'off'}
                onChange={(next) => setTheory(next === 'on')}
                options={[
                  { value: 'on', title: generatorAllText.theoryOnShort },
                  { value: 'off', title: generatorAllText.theoryOff },
                ]}
              />
              <Segmented
                label={generatorAllText.examples}
                value={examples}
                onChange={setExamples}
                options={[0, 1, 2].map((n) => ({ value: n, title: n }))}
              />
              <Segmented
                label={generatorAllText.order}
                value={order}
                onChange={setOrder}
                options={[
                  { value: 'types', title: generatorAllText.orders.types.title },
                  { value: 'mix', title: generatorAllText.orders.mix.title },
                ]}
              />
              <Segmented
                label={zachyotText.variants}
                value={variants}
                onChange={setVariants}
                options={variantCounts.map((n) => ({ value: n, title: n }))}
              />
              <Segmented
                label={generatorAllText.layout}
                value={layout}
                onChange={setLayout}
                options={sheetLayouts.map((item) => ({ value: item.id, title: item.title }))}
              />
              <Segmented
                label={generatorAllText.theme}
                value={theme}
                onChange={setTheme}
                options={sheetThemes.map((item) => ({ value: item.id, title: item.title }))}
              />
              <Segmented
                label={generatorAllText.kindLabel}
                value={kind}
                onChange={setKind}
                options={[generatorAllText.kind, ...workKinds.slice(0, 3)].map((item) => ({ value: item, title: item }))}
              />
            </div>
          </div>
        </div>

        <aside className="zs-sum" aria-label={generatorAllText.summaryTitle}>
          <h3 className="zs-sum__title">{generatorAllText.summaryTitle}</h3>
          <div className="zs-stats">
            <span className="zs-stat">
              <TemplateIcon name="sheet" />
              <b data-testid="generator-all-count">{count}</b> {tasksLabel(count).split(' ')[1]}
            </span>
            <span className="zs-stat">
              <TemplateIcon name="sliders" />
              <b>{variants}</b> {variantsLabel(variants).split(' ')[1]}
            </span>
          </div>
          <h4 className="zs-sum__sub">{zachyotText.included}</h4>
          {plan.types.length === 0 ? (
            <p className="zs-hint">{zachyotText.emptyHint}</p>
          ) : (
            <ul className="zs-sum__types">
              {plan.types.map((item) => (
                <li key={item.type.id}>
                  <RazdelIkonka icon={item.type.icon} sizes="32px" className="zs-sum__ico" />
                  <span className="zs-sum__name">{item.type.title}</span>
                  <span className="zs-sum__n">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="zs-hint">
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
        ready={count > 0}
        hrefs={sheetHrefs}
        summary={
          <>
            {kind} · {plan.types.map((item) => item.type.title).join(', ')} · {tasksLabel(count)}
            {variants > 1 ? ` · ${variantsLabel(variants)}` : ''}
          </>
        }
      />
    </section>
  );
}
