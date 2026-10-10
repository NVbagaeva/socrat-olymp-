'use client';

import { useId, useState } from 'react';
import { Badge, Button, Input } from '@/components/ui';
import { Note, Option, OptionGroup, SkillCards, StepHead, type SkillItem } from '../configurator';
import {
  generatorPage,
  sheetLayouts,
  sheetThemes,
  variantCounts,
  workKinds,
  type SheetLayoutId,
  type SheetThemeId,
} from '@/content/generator';
import { GENERATOR_2, O_ZADANII, VEKTORY } from '@/content/vektory';
import { counted } from '@/lib/plural';
import { sheetQuery2, subtitleOf2 } from '@/lib/vektory/sheet2';
import { KitBar } from '../generator/KitBar';

export interface Generator2ScreenProps {
  /** Адрес раздела: страницы печати лежат под ним. */
  base: string;
  skills: SkillItem[];
}

const CUSTOM = '';

/**
 * Экран вкладки «Генератор» задания №2: вид работы, прототипы,
 * параметры листа. Тот же порядок шагов, что у №8 и №12. Листы
 * печатает блок комплекта (KitBar): код комплекта — seed листа, и
 * только «Новый комплект» даёт новые задания. До четырёх вариантов
 * одной структуры.
 */
export function Generator2Screen({ base, skills }: Generator2ScreenProps) {
  const customId = useId();
  const dateId = useId();
  const [kind, setKind] = useState(workKinds[0] ?? CUSTOM);
  const [customKind, setCustomKind] = useState('');
  const [date, setDate] = useState('');
  const [selected, setSelected] = useState<string[]>(skills[0] === undefined ? [] : [skills[0].id]);
  const [count, setCount] = useState<number>(10);
  const [variants, setVariants] = useState<number>(1);
  const [layout, setLayout] = useState<SheetLayoutId>('single');
  const [theme, setTheme] = useState<SheetThemeId>('color');

  const chosen = skills.filter((item) => selected.includes(item.id));
  const kindTitle = kind === CUSTOM ? customKind.trim() : kind;
  const subtitle = subtitleOf2({ kind: kindTitle, date, bank: false });
  const layoutTitle = sheetLayouts.find((item) => item.id === layout)?.title ?? '';
  const themeTitle = sheetThemes.find((item) => item.id === theme)?.title ?? '';
  /* Адреса листов по seed комплекта: его выдаёт KitBar. */
  const sheetHrefs = (seed: string) => {
    const query = sheetQuery2({
      prototypes: chosen.map((item) => item.id),
      count,
      variants,
      seed,
      theme,
      layout,
      kind: kindTitle,
      date,
      bank: false,
    });
    return { student: `${base}/pechat/?${query}`, teacher: `${base}/pechat/otvety/?${query}` };
  };

  function toggleSkill(id: string) {
    /* Последний выбранный прототип снять нельзя: пустой вариант не собирается. */
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    if (next.length === 0) {
      return;
    }
    setSelected(next);
  }

  function vsyaGruppa(gruppa: string) {
    const ids = skills.filter((item) => item.id.startsWith(gruppa)).map((item) => item.id);
    const all = ids.every((id) => selected.includes(id));
    const next = all
      ? selected.filter((id) => !ids.includes(id))
      : [...new Set([...selected, ...ids])];
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
          <section className="cfg-step" aria-labelledby="z2-gen-step-kind">
            <StepHead
              id="z2-gen-step-kind"
              no={generatorPage.kind.step}
              title={generatorPage.kind.title}
              lead={generatorPage.kind.lead}
            />
            <div className="cfg-params">
              <div className="cfg-param" role="radiogroup" aria-labelledby="z2-gen-step-kind">
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

          <section className="cfg-step" aria-labelledby="z2-gen-step-skills">
            <StepHead
              id="z2-gen-step-skills"
              no={generatorPage.skills.step}
              title={generatorPage.skills.title}
              lead={generatorPage.skills.lead.replace('{family}', VEKTORY.title)}
            />
            {O_ZADANII.gruppy.map((gruppa) => (
              <div className="z2-skills" key={gruppa.id}>
                <p className="z2-skills__group" id={`z2-gen-skill-${gruppa.id}`}>
                  <span className="z2-group__code" aria-hidden="true">
                    {gruppa.id}
                  </span>
                  {gruppa.title}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="z2-skills__all"
                    onClick={() => vsyaGruppa(gruppa.id)}
                  >
                    {GENERATOR_2.vse}
                  </Button>
                </p>
                <SkillCards
                  items={skills.filter((item) => item.id.startsWith(gruppa.id))}
                  selected={selected}
                  onToggle={toggleSkill}
                  multiple
                  labelledBy={`z2-gen-skill-${gruppa.id}`}
                />
              </div>
            ))}
          </section>

          <section className="cfg-step" aria-labelledby="z2-gen-step-params">
            <StepHead
              id="z2-gen-step-params"
              no={generatorPage.params.step}
              title={generatorPage.params.title}
              lead={generatorPage.params.lead}
            />
            <div className="cfg-params">
              <OptionGroup id="z2-gen-param-count" label={generatorPage.params.count} compact>
                {[5, 10, 15, 20].map((item) => (
                  <Option
                    key={item}
                    checked={count === item}
                    onSelect={() => setCount(item)}
                    title={item}
                  />
                ))}
              </OptionGroup>

              <OptionGroup id="z2-gen-param-variants" label={generatorPage.params.variants} compact>
                {variantCounts.map((item) => (
                  <Option
                    key={item}
                    checked={variants === item}
                    onSelect={() => setVariants(item)}
                    title={item}
                  />
                ))}
              </OptionGroup>

              <OptionGroup id="z2-gen-param-layout" label={generatorPage.params.layout}>
                {sheetLayouts.map((item) => (
                  <Option
                    key={item.id}
                    checked={layout === item.id}
                    onSelect={() => setLayout(item.id)}
                    title={item.title}
                  />
                ))}
              </OptionGroup>

              <OptionGroup id="z2-gen-param-theme" label={generatorPage.params.theme}>
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

        <aside className="cfg-summary" aria-labelledby="z2-gen-summary-title">
          <h3 className="cfg-summary__title" id="z2-gen-summary-title">
            {generatorPage.summary.title}
          </h3>
          <Badge tone="info">{VEKTORY.title}</Badge>
          {subtitle === '' ? null : <p className="cfg-summary__skill">{subtitle}</p>}
          <ul className="cfg-summary__list">
            {chosen.map((item) => (
              <li key={item.id}>
                <span dangerouslySetInnerHTML={{ __html: item.titleHtml ?? item.title }} />
                <span className="cfg-summary__code"> {item.id}</span>
              </li>
            ))}
          </ul>
          <p className="cfg-summary__count">
            {counted(count, 'задание', 'задания', 'заданий')}
            {variants > 1
              ? ` × ${counted(variants, 'вариант', 'варианта', 'вариантов')}`
              : ''} · {layoutTitle} · {themeTitle}
          </p>
          <Note>{generatorPage.summary.note}</Note>
        </aside>
      </div>

      <KitBar
        scope="2"
        slot={base}
        section={`№2 · ${VEKTORY.title}`}
        count={count * variants}
        ready
        hrefs={sheetHrefs}
        summary={
          <span className="no-math-check">
            {VEKTORY.title}
            {subtitle === '' ? '' : ` · ${subtitle}`} · {chosen.map((item) => item.id).join(', ')} ·{' '}
            {counted(count, 'задание', 'задания', 'заданий')}
          </span>
        }
      />
    </section>
  );
}
