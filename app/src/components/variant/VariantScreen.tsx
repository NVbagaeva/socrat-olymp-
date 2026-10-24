'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { VARIANT_SCREEN as T, WORK_KINDS, standardInstruction } from '@/content/variant';
import { useSessionUser } from '@/lib/auth/session';
import { newSeed } from '@/lib/variant/code';
import { loadConfig, loadMeta, openSheet, saveConfig, saveMeta } from '@/lib/variant/handoff';
import { SECTIONS, sectionInfo } from '@/lib/variant/sections';
import {
  buildSet,
  currentVersion,
  defaultConfig,
  defaultMeta,
  readCode,
  sanitizeConfig,
  sanitizeMeta,
} from '@/lib/variant/session';
import { instructionFor, workTitle, type SheetChoice } from '@/lib/variant/sheets';
import { zamenaKey } from '@/lib/variant/build';
import {
  EGE_NUMBERS,
  MAX_VARIANTS,
  type EgeNo,
  type Stars,
  type VariantConfig,
  type VariantMeta,
  type VariantSet,
} from '@/lib/variant/types';
import { BlankiEge } from '@/components/blanki/BlankiEge';
import { VariantPreview } from './VariantPreview';

function Segment<I extends string>({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: readonly { id: I; label: string }[];
  value: I;
  onPick: (id: I) => void;
}) {
  return (
    <div className="var-field">
      <p className="var-field__label">{label}</p>
      <div className="var-seg" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            className={clsx('var-seg__btn', value === o.id && 'is-active')}
            onClick={() => onPick(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function sameConfig(a: VariantConfig, b: VariantConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Экран «Собрать вариант»: панель фильтров сверху, ниже — предпросмотр
 * листа ученика. Набор вариантов (`VariantSet`) живёт в состоянии и
 * меняется только кнопками «Сформировать», «Перегенерировать»,
 * «заменить» и вводом кода. Все листы печатаются из него же.
 */
export function VariantScreen() {
  const [config, setConfig] = useState<VariantConfig>(defaultConfig);
  const [meta, setMeta] = useState<VariantMeta>(defaultMeta);
  const [open, setOpen] = useState<EgeNo | null>(null);
  const [set, setSet] = useState<VariantSet | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [codeText, setCodeText] = useState('');
  const [copied, setCopied] = useState(false);
  const [dev, setDev] = useState(false);
  const restored = useRef(false);
  const user = useSessionUser();

  /* Настройки и шапка — из прошлого раза; режим разработчика — ?dev=1.
     Читаются после гидратации (разметка сборки — с настройками по
     умолчанию), одним кадром позже. */
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setConfig(sanitizeConfig(loadConfig()));
      setMeta(sanitizeMeta(loadMeta()));
      setDev(
        process.env.NODE_ENV === 'development' ||
          new URLSearchParams(window.location.search).get('dev') === '1',
      );
      restored.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (restored.current) saveConfig(config);
  }, [config]);
  useEffect(() => {
    if (restored.current) saveMeta(meta);
  }, [meta]);

  /* Учитель вошёл в кабинет — его имя в шапке, пока поле не заполнено. */
  const tutorName = user?.role === 'tutor' ? user.name.trim() : '';
  const shown: VariantMeta = meta.teacher === '' ? { ...meta, teacher: tutorName } : meta;

  const stale = set !== null && !sameConfig(set.config, config);
  const title = workTitle(shown, WORK_KINDS);

  async function run(next: VariantConfig, seed: string, zameny: Record<string, number>) {
    setBusy(true);
    setError(null);
    try {
      const built = await buildSet(next, seed, zameny);
      setSet(built.set);
      if (built.failed.length > 0) setError(T.failed(built.failed.map((n) => `№${n}`).join(', ')));
    } catch {
      setError(T.failed(next.tasks.map((n) => `№${n}`).join(', ')));
    } finally {
      setBusy(false);
    }
  }

  function sformirovat() {
    setNotice(null);
    void run(config, newSeed(), {});
  }

  function zamenit(variant: number, ege: EgeNo) {
    if (set === null) return;
    const key = zamenaKey(variant, ege);
    const zameny = { ...set.zameny, [key]: (set.zameny[key] ?? 0) + 1 };
    void run(set.config, set.seed, zameny);
  }

  function otkrytKod() {
    const d = readCode(codeText);
    if (d === null) {
      setNotice(T.codeBad);
      return;
    }
    const now = currentVersion();
    setNotice(d.version === now ? null : T.codeOld(d.version, now));
    setConfig(d.config);
    void run(d.config, d.seed, d.zameny);
  }

  function pechat(choice: SheetChoice) {
    if (set === null) return;
    const ok = openSheet(choice, { set, meta: shown, workTitle: title });
    setNotice(ok ? null : T.popupBlocked);
  }

  function copyCode() {
    if (set === null) return;
    void navigator.clipboard?.writeText(set.code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  function toggleTask(n: EgeNo) {
    setConfig((c) => {
      const on = c.tasks.includes(n);
      const tasks = on
        ? c.tasks.filter((x) => x !== n)
        : EGE_NUMBERS.filter((x) => x === n || c.tasks.includes(x));
      return { ...c, tasks };
    });
  }

  function toggleSubtype(n: EgeNo, id: string) {
    setConfig((c) => {
      const all = sectionInfo(n).subtypes.map((s) => s.id);
      const cur = c.subtypes[n] ?? all;
      const next = cur.includes(id)
        ? cur.filter((x) => x !== id)
        : all.filter((x) => x === id || cur.includes(x));
      const subtypes = { ...c.subtypes };
      if (next.length === 0 || next.length === all.length) delete subtypes[n];
      else subtypes[n] = next;
      return { ...c, subtypes };
    });
  }

  function toggleStar(s: Stars) {
    setConfig((c) => ({
      ...c,
      stars: c.stars.includes(s)
        ? c.stars.filter((x) => x !== s)
        : ([1, 2, 3] as Stars[]).filter((x) => x === s || c.stars.includes(x)),
    }));
  }

  const openInfo = open === null ? null : sectionInfo(open);
  const summary = T.summary(config.tasks.length, config.count);
  const sectionsNoLevel = useMemo(
    () => SECTIONS.filter((s) => !s.capabilities.difficulty).map((s) => s.egeNumber),
    [],
  );

  return (
    <div className="var">
      {/* ── Фильтры ─────────────────────────────────────────── */}
      <section className="var-panel" aria-labelledby="var-sostav-h">
        <div className="var-panel__head">
          <h2 id="var-sostav-h" className="var-panel__title">
            {T.sostav}
          </h2>
          <span className="var-panel__summary">{summary}</span>
          <span className="var-panel__actions">
            <button
              type="button"
              className="var-link"
              onClick={() => setConfig((c) => ({ ...c, tasks: [...EGE_NUMBERS] }))}
            >
              {T.all}
            </button>
            <button
              type="button"
              className="var-link"
              onClick={() => setConfig((c) => ({ ...c, tasks: [] }))}
            >
              {T.none}
            </button>
          </span>
        </div>
        <p className="var-panel__note">{T.sostavNote}</p>
        <ul className="var-chips">
          {SECTIONS.map((s) => {
            const n = s.egeNumber;
            const on = config.tasks.includes(n);
            const partial = config.subtypes[n] !== undefined;
            return (
              <li key={n} className={clsx('var-chip', on && 'is-on', open === n && 'is-open')}>
                <button
                  type="button"
                  className="var-chip__main"
                  aria-pressed={on}
                  title={s.title}
                  onClick={() => toggleTask(n)}
                >
                  <span className="var-chip__no">{n}</span>
                  <span className="var-chip__label">{T.short[n] ?? s.title}</span>
                  {partial ? <span className="var-chip__dot" aria-hidden="true" /> : null}
                </button>
                {s.subtypes.length > 1 ? (
                  <button
                    type="button"
                    className="var-chip__more"
                    aria-expanded={open === n}
                    aria-label={T.subtypesOf(n)}
                    onClick={() => setOpen(open === n ? null : n)}
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M4 6l4 4 4-4" />
                    </svg>
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
        {openInfo === null ? null : (
          <div className="var-subtypes">
            <p className="var-subtypes__title">
              {T.subtypesOf(openInfo.egeNumber)} · {openInfo.title}
              {openInfo.capabilities.difficulty ? null : (
                <span className="var-tag">{T.noLevel}</span>
              )}
              {openInfo.capabilities.fipi ? null : <span className="var-tag">{T.noFipi}</span>}
            </p>
            <div className="var-subtypes__list">
              {openInfo.subtypes.map((st) => {
                const chosen = config.subtypes[openInfo.egeNumber];
                const on = chosen === undefined || chosen.includes(st.id);
                return (
                  <button
                    key={st.id}
                    type="button"
                    aria-pressed={on}
                    className={clsx('var-sub', on && 'is-on')}
                    onClick={() => toggleSubtype(openInfo.egeNumber, st.id)}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="var-row">
          <Segment
            label={T.source}
            options={T.sources}
            value={config.source}
            onPick={(id) => setConfig((c) => ({ ...c, source: id }))}
          />
          <div className="var-field var-field--note">
            <p className="var-field__label">{T.level}</p>
            <div className="var-seg" role="group" aria-label={T.level}>
              {([1, 2, 3] as Stars[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={config.stars.includes(s)}
                  className={clsx(
                    'var-seg__btn var-stars',
                    config.stars.includes(s) && 'is-active',
                  )}
                  onClick={() => toggleStar(s)}
                >
                  {'★'.repeat(s)}
                </button>
              ))}
            </div>
            <p className="var-field__note">
              {T.levelNote} ({sectionsNoLevel.map((n) => `№${n}`).join(', ')}).
            </p>
          </div>
          <div className="var-field">
            <p className="var-field__label">{T.count}</p>
            <div className="var-count">
              <button
                type="button"
                className="var-count__btn"
                aria-label="Меньше"
                disabled={config.count <= 1}
                onClick={() => setConfig((c) => ({ ...c, count: Math.max(1, c.count - 1) }))}
              >
                −
              </button>
              <span className="var-count__value" aria-live="polite">
                {config.count}
              </span>
              <button
                type="button"
                className="var-count__btn"
                aria-label="Больше"
                disabled={config.count >= MAX_VARIANTS}
                onClick={() =>
                  setConfig((c) => ({ ...c, count: Math.min(MAX_VARIANTS, c.count + 1) }))
                }
              >
                +
              </button>
            </div>
          </div>
          <div className="var-field var-field--note">
            <label className="var-switch">
              <input
                type="checkbox"
                checked={config.parallel}
                onChange={(e) => setConfig((c) => ({ ...c, parallel: e.target.checked }))}
              />
              <span className="var-switch__track" aria-hidden="true" />
              <span className="var-switch__label">{T.parallel}</span>
            </label>
            <p className="var-field__note">{T.parallelNote}</p>
          </div>
          <Segment
            label={T.numbering}
            options={T.numberings}
            value={meta.numbering}
            onPick={(id) => setMeta((m) => ({ ...m, numbering: id }))}
          />
        </div>

        {/* ── Шапка работы ──────────────────────────────────── */}
        <details className="var-header">
          <summary className="var-header__summary">
            {T.header}
            <span className="var-header__current">{title}</span>
          </summary>
          <p className="var-panel__note">{T.headerNote}</p>
          <div className="var-form">
            <label className="var-field">
              <span className="var-field__label">{T.kind}</span>
              <Select
                value={meta.kind}
                onChange={(e) => setMeta((m) => ({ ...m, kind: e.target.value }))}
              >
                {WORK_KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </Select>
            </label>
            {meta.kind === 'custom' ? (
              <label className="var-field">
                <span className="var-field__label">{T.customTitle}</span>
                <Input
                  value={meta.customTitle}
                  maxLength={80}
                  onChange={(e) => setMeta((m) => ({ ...m, customTitle: e.target.value }))}
                />
              </label>
            ) : null}
            <label className="var-field">
              <span className="var-field__label">{T.topic}</span>
              <Input
                value={meta.topic}
                maxLength={120}
                onChange={(e) => setMeta((m) => ({ ...m, topic: e.target.value }))}
              />
            </label>
            <label className="var-field">
              <span className="var-field__label">{T.group}</span>
              <Input
                value={meta.group}
                maxLength={20}
                onChange={(e) => setMeta((m) => ({ ...m, group: e.target.value }))}
              />
            </label>
            <label className="var-field">
              <span className="var-field__label">{T.date}</span>
              <Input
                type="date"
                value={meta.date}
                onChange={(e) => setMeta((m) => ({ ...m, date: e.target.value }))}
              />
            </label>
            <label className="var-field">
              <span className="var-field__label">{T.duration}</span>
              <Input
                value={meta.duration}
                maxLength={40}
                placeholder={T.durationPlaceholder}
                onChange={(e) => setMeta((m) => ({ ...m, duration: e.target.value }))}
              />
            </label>
            <label className="var-field">
              <span className="var-field__label">{T.teacher}</span>
              <Input
                value={shown.teacher}
                maxLength={60}
                onChange={(e) => setMeta((m) => ({ ...m, teacher: e.target.value }))}
              />
            </label>
            <Segment
              label={T.variantLabels}
              options={T.variantLabelOptions}
              value={meta.variantLabels}
              onPick={(id) => setMeta((m) => ({ ...m, variantLabels: id }))}
            />
          </div>
          <div className="var-field var-field--wide">
            <label className="var-switch">
              <input
                type="checkbox"
                checked={meta.instruction}
                onChange={(e) => setMeta((m) => ({ ...m, instruction: e.target.checked }))}
              />
              <span className="var-switch__track" aria-hidden="true" />
              <span className="var-switch__label">{T.instruction}</span>
            </label>
            <p className="var-field__note">{T.instructionNote}</p>
            {meta.instruction ? (
              <>
                <textarea
                  className="var-textarea"
                  rows={3}
                  value={instructionFor(meta)}
                  maxLength={600}
                  aria-label={T.instruction}
                  onChange={(e) => {
                    const v = e.target.value;
                    /* Совпала со стандартной — хранится пустой: тогда она
                       следует за типом работы (с бланком № 1 или без). */
                    setMeta((m) => ({
                      ...m,
                      instructionText: v.trim() === standardInstruction(m.kind) ? '' : v,
                    }));
                  }}
                />
                {meta.instructionText !== '' ? (
                  <button
                    type="button"
                    className="var-link"
                    onClick={() => setMeta((m) => ({ ...m, instructionText: '' }))}
                  >
                    {T.instructionReset}
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </details>

        {/* ── Кнопки ────────────────────────────────────────── */}
        <div className="var-actions">
          <Button size="lg" onClick={sformirovat} disabled={busy || config.tasks.length === 0}>
            {set === null ? T.build : T.rebuild}
          </Button>
          <div className="var-code-in">
            <Input
              value={codeText}
              placeholder={T.codeInput}
              aria-label={T.codeInput}
              maxLength={60}
              onChange={(e) => setCodeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') otkrytKod();
              }}
            />
            <Button
              variant="secondary"
              onClick={otkrytKod}
              disabled={busy || codeText.trim() === ''}
            >
              {T.codeOpen}
            </Button>
          </div>
        </div>
        {busy ? (
          <p className="var-status" role="status">
            {T.building}
          </p>
        ) : null}
        {error === null ? null : (
          <p className="var-status var-status--error" role="alert">
            {error}
          </p>
        )}
        {notice === null ? null : (
          <p className="var-status" role="status">
            {notice}
          </p>
        )}
        {stale ? <p className="var-status var-status--warn">{T.stale}</p> : null}
      </section>

      {/* ── Набор: код и листы; рядом — бланки ЕГЭ (на телефоне — под
          кнопками вариантов). Бланки в листы не входят никогда. */}
      <div className={clsx('var-out', set !== null && 'var-out--two')}>
        {set === null ? null : (
          <section className="var-panel var-kit" aria-label={T.downloads}>
            <div className="var-kit__code">
              <span className="var-field__label">{T.code}</span>
              <code className="var-kit__value">{set.code}</code>
              <button type="button" className="var-link" onClick={copyCode}>
                {copied ? T.codeCopied : T.codeCopy}
              </button>
              <span className="var-field__note">{T.codeNote}</span>
            </div>
            <div className="var-kit__buttons">
              <Button onClick={() => pechat('uchenik')}>{T.pdf.uchenik}</Button>
              <Button variant="secondary" onClick={() => pechat('uchitel')}>
                {T.pdf.uchitel}
              </Button>
              <Button variant="secondary" onClick={() => pechat('razbor')}>
                {T.pdf.razbor}
              </Button>
              <Button variant="secondary" onClick={() => pechat('vse')}>
                {T.pdf.vse}
              </Button>
              <Button variant="ghost" onClick={() => pechat('uchenik')}>
                {T.print}
              </Button>
            </div>
            <p className="var-field__note">{T.downloadsNote}</p>
          </section>
        )}
        <BlankiEge defaultCopies={set?.variants.length ?? config.count} />
      </div>

      {/* ── Предпросмотр ──────────────────────────────────── */}
      <VariantPreview
        set={set}
        meta={shown}
        title={title}
        busy={busy}
        dev={dev}
        onReplace={zamenit}
      />
    </div>
  );
}
