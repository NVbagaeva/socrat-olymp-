'use client';

import { useId, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Badge, Input } from '@/components/ui';
import {
  CountPicker,
  Note,
  Option,
  OptionGroup,
  SkillCards,
  StepHead,
  countLabel,
  countOf,
  useCountChoice,
  type SkillItem,
} from '../configurator';
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
import { planCounts } from '@/lib/sheetPlan';
import { randomSeed } from '@/lib/trainerSession';
import { sheetQuery, subtitleOf } from '@/lib/generatorSheet';
import { TitleText } from '../TitleText';

export interface GeneratorScreenProps {
  /** Адрес подтемы: страницы печати лежат под ним. */
  base: string;
  /** Название семейства: в подзаголовке, бейдже и сводке. */
  family: string;
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
 * Выбор живёт в памяти страницы. Кнопки открывают страницы печати
 * в новой вкладке; все параметры — в адресе. Seed варианта один на
 * набор параметров: лист ученика и лист с ответами по нему
 * совпадают, а смена любого параметра даёт новый вариант.
 */
export function GeneratorScreen({
  base,
  family,
  skills,
  levels = skillLevels,
  note = generatorPage.summary.note,
}: GeneratorScreenProps) {
  const customId = useId();
  const [kind, setKind] = useState(workKinds[0] ?? CUSTOM);
  const [customKind, setCustomKind] = useState('');
  const [date, setDate] = useState('');
  const dateId = useId();
  const [selected, setSelected] = useState<string[]>(skills[0] === undefined ? [] : [skills[0].id]);
  const [count, setCount] = useCountChoice();
  const [level, setLevel] = useState<SkillLevelId | null>(firstLevel(skills[0]?.levels ?? []));
  const [layout, setLayout] = useState<SheetLayoutId>('single');
  const [theme, setTheme] = useState<SheetThemeId>('color');
  const [variants, setVariants] = useState(1);

  const chosen = skills.filter((item) => selected.includes(item.id));
  /* «Все» — сколько задач в выбранных наборах на самом деле. */
  const allCount = chosen.reduce((sum, item) => sum + item.count, 0);
  /* null — в поле «Своё» пусто: лист не собирается. */
  const chosenCount = countOf(count, allCount);
  /* Seed считается заново при любой смене того, что влияет на задачи:
     тот же выбор — тот же вариант, другой выбор — другой. Вид работы,
     колонки и тема на задачи не влияют, поэтому в зависимостях их нет. */
  const selectedKey = selected.join(',');
  const seed = useMemo(
    () => randomSeed('', 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedKey, chosenCount, level],
  );
  const levelsOfChosen = chosen.flatMap((item) => item.levels);
  const shownLevels = levels.filter((item) => levelsOfChosen.includes(item.id));
  const kindTitle = kind === CUSTOM ? customKind.trim() : kind;
  const subtitle = subtitleOf({ kind: kindTitle, date });
  const layoutTitle = sheetLayouts.find((item) => item.id === layout)?.title ?? '';
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
  });
  /* Доли навыков на листе — тот же план, что у страницы печати:
     нехватку у навыка учитель видит до печати. */
  const plan = planCounts(
    chosen.map((item) => ({ id: item.id, capacity: item.count })),
    chosenCount ?? 0,
  );
  /* Банк кончился у всех навыков — отдавать некому, и про отдачу
     говорить нечего: одна фраза о том, сколько всего есть. */
  const warnings = [
    ...(plan.overflow > 0 ? [] : plan.shortages).map((item) => {
      const title = chosen.find((skill) => skill.id === item.id)?.title ?? item.id;
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
  /* Пустое поле «Своё» — листа нет, ссылки выключены. */
  const ready = chosenCount !== null;
  const studentHref = `${base}/pechat/?${query}`;
  const teacherHref = `${base}/pechat/otvety/?${query}`;
  const themeTitle = sheetThemes.find((item) => item.id === theme)?.title ?? '';

  function toggleSkill(id: string) {
    /* Последний выбранный навык снять нельзя: пустой вариант не
       собирается, и кнопка без выбора обещала бы то, чего нет. */
    const next = selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id];
    if (next.length === 0) {
      return;
    }
    setSelected(next);
    const levels = skills.filter((item) => next.includes(item.id)).flatMap((item) => item.levels);
    if (level === null || !levels.includes(level)) {
      setLevel(firstLevel(levels));
    }
  }

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
            <SkillCards
              items={skills}
              selected={selected}
              onToggle={toggleSkill}
              multiple
              labelledBy="gen-step-skills"
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
              <CountPicker
                id="gen-param-count"
                label={generatorPage.params.count}
                max={allCount}
                value={count}
                onChange={setCount}
                allWord={generatorPage.params.all}
              />
              {warnings.map((text) => (
                <Note key={text} tone="warning">
                  {text}
                </Note>
              ))}

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
          <Badge tone="info">{family}</Badge>
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

      <div className="cfg-bar cfg-bar--two">
        {/* Ссылки, а не кнопки: лист открывается в новой вкладке, адрес
            можно скопировать и открыть снова — лист будет тем же. */}
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
          {family}
          {subtitle === '' ? '' : ` · ${subtitle}`} ·{' '}
          {chosen.map((item, index) => (
            <span key={item.id}>
              {index === 0 ? '' : ', '}
              <TitleText title={item.title} html={item.titleHtml} />
            </span>
          ))}{' '}
          ·{' '}
          {countLabel(chosenCount)}
          {variants > 1 ? ` · ${variantsLabel(variants)}` : ''}
        </p>
      </div>
    </section>
  );
}
