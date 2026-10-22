'use client';

import { useId, useState } from 'react';
import { RazdelIkonka } from '@/components/tasks/razdely/RazdelIkonka';
import type { IkonkaRazdela } from '@/components/tasks/razdely/types';
import { Badge, Input } from '@/components/ui';
import { Note, Option, OptionGroup, StepHead, countLabel, type SkillItem } from '../configurator';
import { SostavPicker, type SostavValue } from '../ves12/SostavPicker';
import {
  generatorPage,
  sheetLayouts,
  sheetThemes,
  variantCounts,
  workKinds,
  type SheetLayoutId,
  type SheetThemeId,
} from '@/content/generator';
import { firstLevel, skillLevels, type SkillLevel, type SkillLevelId }
  from '@/content/skills12';
import { counted } from '@/lib/plural';
import { sheetQuery, subtitleOf } from '@/lib/generatorQuery';
import { TitleText } from '../TitleText';
import { KitBar } from './KitBar';

export interface GeneratorScreenProps {
  /** Адрес подтемы: страницы печати лежат под ним. */
  base: string;
  /** Название семейства: в подзаголовке, бейдже и сводке. */
  family: string;
  /** Иконка раздела рядом с названием в сводке. */
  familyIcon?: IkonkaRazdela | undefined;
  skills: SkillItem[];
  /** Подписи уровней подтемы. Не заданы — общие. */
  levels?: readonly SkillLevel[];
  /** Плашка под сводкой: откуда взяты задания. Не задана — общая. */
  note?: string;
}

/** «2 варианта» для сводки. */
function variantsLabel(n: number): string {
  return counted(n, 'вариант', 'варианта', 'вариантов');
}

/** Значение «своё название» в группе видов работы. */
const CUSTOM = '';

/**
 * Экран вкладки «Генератор»: вид работы, навыки, параметры листа.
 *
 * Выбор живёт в памяти страницы. Листы печатает блок комплекта
 * (KitBar): лист ученика и лист учителя одного комплекта собраны из
 * одних заданий, код комплекта и адреса листов хранятся в браузере,
 * а новые задания даёт только «Новый комплект».
 */
export function GeneratorScreen({
  base,
  family,
  familyIcon,
  skills,
  levels = skillLevels,
  note = generatorPage.summary.note,
}: GeneratorScreenProps) {
  const customId = useId();
  const [kind, setKind] = useState(workKinds[0] ?? CUSTOM);
  const [customKind, setCustomKind] = useState('');
  const [date, setDate] = useState('');
  const dateId = useId();
  /* Задачи по прототипам — счётчиками общего выбора состава (тот же, что у
     зачётной и генератора по всем типам №12). По умолчанию — по 2. */
  const [sostav, setSostav] = useState<SostavValue>(() => ({
    counts: Object.fromEntries(skills.map((item) => [item.id, Math.min(2, item.count)])),
    off: [],
  }));
  const selected = skills.filter((item) => (sostav.counts[item.id] ?? 0) > 0).map((item) => item.id);
  const [levelChoice, setLevel] = useState<SkillLevelId | null>(firstLevel(skills[0]?.levels ?? []));
  const [layout, setLayout] = useState<SheetLayoutId>('single');
  const [theme, setTheme] = useState<SheetThemeId>('color');
  const [variants, setVariants] = useState(1);

  const chosen = skills.filter((item) => selected.includes(item.id));
  const per = Object.fromEntries(chosen.map((item) => [item.id, sostav.counts[item.id] ?? 0]));
  const total = chosen.reduce((sum, item) => sum + (sostav.counts[item.id] ?? 0), 0);
  /* null — задач нет: лист не собирается. */
  const chosenCount = total > 0 ? total : null;
  const levelsOfChosen = chosen.flatMap((item) => item.levels);
  const shownLevels = levels.filter((item) => levelsOfChosen.includes(item.id));
  /* Уровень, которого у выбранных прототипов нет, не держится. */
  const level =
    levelChoice !== null && levelsOfChosen.includes(levelChoice) ? levelChoice : firstLevel(levelsOfChosen);
  const kindTitle = kind === CUSTOM ? customKind.trim() : kind;
  const subtitle = subtitleOf({ kind: kindTitle, date });
  const layoutTitle = sheetLayouts.find((item) => item.id === layout)?.title ?? '';
  /* Адреса листов по seed комплекта: seed выдаёт блок комплекта
     (KitBar), и только «Новый комплект» его меняет. */
  const sheetHrefs = (seed: string) => {
    const query = sheetQuery({
      skills: chosen.map((item) => item.id),
      count: chosenCount ?? 0,
      level,
      seed,
      theme,
      layout,
      kind: kindTitle,
      date,
      variants,
      per,
    });
    return { student: `${base}/pechat/?${query}`, teacher: `${base}/pechat/otvety/?${query}` };
  };
  /* Шаблон «Каждый по N», которому соответствуют счётчики. */
  const activeEach = [2, 3, 5].find((n) =>
    skills.every((item) => (sostav.counts[item.id] ?? 0) === Math.min(n, item.count)),
  );
  /* Задач нет — листа нет, ссылки выключены. */
  const ready = chosenCount !== null;
  const themeTitle = sheetThemes.find((item) => item.id === theme)?.title ?? '';

  return (
    <section className="cfg">
      <h2 className="t-h2 cfg__title">{generatorPage.title}</h2>

      <div className="cfg__layout">
        <div className="cfg__steps">
          <section className="cfg-step" aria-labelledby="gen-step-kind">
            <StepHead
              id="gen-step-kind"
              no={generatorPage.kind.step}
              title={generatorPage.kind.title}
              lead={generatorPage.kind.lead}
            />
            <div className="cfg-params">
              <div className="cfg-param" role="radiogroup" aria-labelledby="gen-step-kind">
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
              {/* Дата — по желанию: пустое поле, и на листе даты нет. */}
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

          <section className="cfg-step" aria-labelledby="gen-step-skills">
            <StepHead
              id="gen-step-skills"
              no={generatorPage.skills.step}
              title={generatorPage.skills.title}
              lead={generatorPage.skills.lead.replace('{family}', family)}
            />
            <SostavPicker
              rows={skills.map((item) => ({
                id: item.id,
                title: item.title,
                ...(item.titleHtml === undefined ? {} : { titleHtml: item.titleHtml }),
                code: item.code ?? item.id,
                media: item.chart,
                max: item.count,
                sets: [],
              }))}
              soon={[]}
              templates={[2, 3, 5].map((n) => ({
                id: `po-${n}`,
                title: generatorPage.skills.each(n),
                lead: generatorPage.skills.eachLead(n * skills.length),
                icon: 'sheet',
                counts: Object.fromEntries(skills.map((item) => [item.id, Math.min(n, item.count)])),
              }))}
              activeTemplate={activeEach === undefined ? null : `po-${activeEach}`}
              value={sostav}
              onChange={setSostav}
              listTitle={generatorPage.skills.list}
              max={10}
            />
          </section>

          <section className="cfg-step" aria-labelledby="gen-step-params">
            <StepHead
              id="gen-step-params"
              no={generatorPage.params.step}
              title={generatorPage.params.title}
              lead={generatorPage.params.lead}
            />
            <div className="cfg-params">
              {shownLevels.length === 0 ? null : (
                <OptionGroup id="gen-param-level" label={generatorPage.params.level}>
                  {shownLevels.map((item) => (
                    <Option
                      key={item.id}
                      checked={level === item.id}
                      onSelect={() => setLevel(item.id)}
                      title={item.title}
                      lead={<TitleText title={item.lead} html={item.leadHtml} />}
                    />
                  ))}
                </OptionGroup>
              )}

              <OptionGroup id="gen-param-variants" label={generatorPage.params.variants} compact>
                {variantCounts.map((item) => (
                  <Option
                    key={item}
                    checked={variants === item}
                    onSelect={() => setVariants(item)}
                    title={item}
                  />
                ))}
              </OptionGroup>

              <OptionGroup id="gen-param-layout" label={generatorPage.params.layout}>
                {sheetLayouts.map((item) => (
                  <Option
                    key={item.id}
                    checked={layout === item.id}
                    onSelect={() => setLayout(item.id)}
                    title={item.title}
                  />
                ))}
              </OptionGroup>

              <OptionGroup id="gen-param-theme" label={generatorPage.params.theme}>
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

        <aside className="cfg-summary" aria-labelledby="gen-summary-title">
          <h3 className="cfg-summary__title" id="gen-summary-title">
            {generatorPage.summary.title}
          </h3>
          <div className="cfg-summary__family">
            <RazdelIkonka icon={familyIcon} sizes="56px" className="cfg-summary__ico" />
            <Badge tone="info">{family}</Badge>
          </div>
          {subtitle === '' ? null : <p className="cfg-summary__skill">{subtitle}</p>}
          <ul className="cfg-summary__list">
            {chosen.map((item) => (
              <li key={item.id}>
                <TitleText title={item.title} html={item.titleHtml} />
                <span className="cfg-summary__code"> {item.code ?? item.id}</span>
              </li>
            ))}
          </ul>
          <p className="cfg-summary__count">
            {countLabel(chosenCount)}
            {variants > 1 ? ` · ${variantsLabel(variants)}` : ''} · {layoutTitle} · {themeTitle}
          </p>
          <Note>{note}</Note>
        </aside>
      </div>

      <KitBar
        scope="12"
        slot={base}
        section={`№12 · ${family}`}
        count={(chosenCount ?? 0) * variants}
        ready={ready}
        hrefs={sheetHrefs}
        summary={
          <>
            {family}
            {subtitle === '' ? '' : ` · ${subtitle}`} ·{' '}
            {chosen.map((item, index) => (
              <span key={item.id}>
                {index === 0 ? '' : ', '}
                <TitleText title={item.title} html={item.titleHtml} />
              </span>
            ))}{' '}
            · {countLabel(chosenCount)}
            {variants > 1 ? ` · ${variantsLabel(variants)}` : ''}
          </>
        }
      />
    </section>
  );
}
