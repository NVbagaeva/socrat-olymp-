'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { VARIANT_SCREEN as T, WORK_KINDS, standardInstruction } from '@/content/variant';
import { useSessionUser } from '@/lib/auth/session';
import { newSeed } from '@/lib/variant/code';
import { SpaceOption } from '@/components/tasks/space/SpaceOption';
import {
  DEFAULT as SPACE_DEFAULT,
  decodeSpace,
  encodeSpace,
  type SheetSpace,
} from '@/lib/sheet/space.js';
import { codeWithSpace } from '@/lib/variant/code';
import {
  loadConfig,
  loadMeta,
  loadSpace,
  openSheet,
  saveConfig,
  saveMeta,
  saveSpace,
} from '@/lib/variant/handoff';
import { SECTIONS, sectionInfo } from '@/lib/variant/sections';
import { VARIANT_NUMBERS, VARIANT_SKORO, podpis1 } from '@/lib/variant/struktura';
import { nomerEge } from '@/content/struktura';
import { vseRazdely } from '@/content/tasks';
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
import { BlankiVybor } from '@/components/blanki/BlankiVybor';
import { BLANKI_TEXT } from '@/content/blanki';
import { Okno } from './okno/Okno';
import { Piktogramma } from './okno/Piktogramma';
import './variant-steklo.css';
import { VariantPreview } from './VariantPreview';
import { OnlinePanel, readSettings } from './online/OnlinePanel';
import { ONLINE_TEXT } from '@/content/variantOnline/text';
import { reshatHref } from '@/lib/variant/online/link';

function Segment<I extends string>({
  label,
  options,
  value,
  note,
  onPick,
}: {
  label: string;
  options: readonly { id: I; label: string }[];
  value: I;
  note?: string;
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
      {note === undefined ? null : <p className="var-field__note">{note}</p>}
    </div>
  );
}

/** Плитки заданий: первая часть экзамена по действующей структуре. */
const PLITKI = SECTIONS.filter((s) => VARIANT_NUMBERS.includes(s.egeNumber));

/** Название раздела, для которого задач варианта ещё нет. */
function nazvanieRazdela(hranenie: number): string {
  const task = vseRazdely.find((t) => t.hranenie === hranenie);
  return task?.shortTitle ?? task?.name ?? '';
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
  /* Место для решения: не меняет задачи, хранится хвостом кода. */
  const [space, setSpace] = useState<SheetSpace>(SPACE_DEFAULT);
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
      setSpace(loadSpace());
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
  useEffect(() => {
    if (restored.current) saveSpace(space);
  }, [space]);

  /* Учитель вошёл в кабинет — его имя в шапке, пока поле не заполнено. */
  const tutorName = user?.role === 'tutor' ? user.name.trim() : '';
  const shown: VariantMeta = meta.teacher === '' ? { ...meta, teacher: tutorName } : meta;

  const stale = set !== null && !sameConfig(set.config, config);
  /* Код набора с настройкой места для решения: по нему лист — тот же. */
  const fullCode = set === null ? '' : codeWithSpace(set.code, encodeSpace(space));
  const title = workTitle(shown, WORK_KINDS);

  async function run(next: VariantConfig, seed: string, zameny: Record<string, number>) {
    setBusy(true);
    setError(null);
    try {
      const built = await buildSet(next, seed, zameny);
      setSet(built.set);
      if (built.failed.length > 0)
        setError(T.failed(built.failed.map((n) => `№${podpis1(n)}`).join(', ')));
    } catch {
      setError(T.failed(next.tasks.map((n) => `№${podpis1(n)}`).join(', ')));
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
    /* Код с хвостом места для решения — лист воспроизводится тем же. */
    if (d.space !== undefined && d.space !== '') setSpace(decodeSpace(d.space));
    void run(d.config, d.seed, d.zameny);
  }

  function pechat(choice: SheetChoice) {
    if (set === null) return;
    const ok = openSheet(choice, { set, meta: shown, workTitle: title }, fullCode);
    setNotice(ok ? null : T.popupBlocked);
  }

  /* Серия: N разных вариантов без повторов задач, фильтры — те же. */
  function seriya(n: number) {
    setNotice(null);
    const next = { ...config, count: Math.min(MAX_VARIANTS, Math.max(2, n)), parallel: false };
    setConfig(next);
    void run(next, newSeed(), {});
  }

  /* «Решать онлайн» рядом с листами: вариант 1 с режимом и таймером из
     панели ниже. */
  function onlayn() {
    if (set === null) return;
    const s = readSettings();
    const href = reshatHref({
      code: set.code,
      variant: 1,
      ...s,
      kind: shown.kind,
      title: shown.kind === 'custom' ? shown.customTitle : '',
    });
    window.open(href, '_blank', 'noopener');
  }

  function copyCode() {
    if (set === null) return;
    void navigator.clipboard?.writeText(fullCode).then(() => {
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
      /* Порядок — по номерам хранения: он же порядок номеров ЕГЭ. */
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
  const summary = T.summaryNbsp(config.tasks.length, config.count);
  const sectionsNoLevel = useMemo(
    () => PLITKI.filter((s) => !s.capabilities.difficulty).map((s) => s.egeNumber),
    [],
  );

  /* Окна: настройки листов (с группой, к которой прокрутить), бланки, код. */
  const [okno, setOkno] = useState<'nastroyki' | 'blanki' | 'kod' | null>(null);
  const [gruppa, setGruppa] = useState<string | undefined>(undefined);
  const nastroyki = (g?: string) => {
    setGruppa(g);
    setOkno('nastroyki');
  };

  /* Долгое нажатие на плитку — подтипы (дополнительно к «⋯»). */
  const dolgo = useRef<{ t: number; n: EgeNo; srabotalo: boolean } | null>(null);
  const nachaloNazhatiya = (n: EgeNo, est: boolean) => {
    if (!est) return;
    const t = window.setTimeout(() => {
      if (dolgo.current !== null) dolgo.current.srabotalo = true;
      setOpen(n);
    }, 550);
    dolgo.current = { t, n, srabotalo: false };
  };
  const konecNazhatiya = () => {
    if (dolgo.current !== null) window.clearTimeout(dolgo.current.t);
  };

  function otkrytIzOkna() {
    if (readCode(codeText) === null) {
      setNotice(T.codeBad);
      return;
    }
    setOkno(null);
    otkrytKod();
  }

  const levelValue =
    config.stars.length === 0 || config.stars.length === 3
      ? T.bystro.levelAny
      : config.stars.map((s) => '★'.repeat(s)).join(', ');
  const countValue =
    config.count > 1 && config.parallel
      ? `${config.count} · ${T.bystro.countParallel}`
      : String(config.count);

  const openChosen =
    openInfo === null
      ? []
      : (config.subtypes[openInfo.egeNumber] ?? openInfo.subtypes.map((st) => st.id));

  return (
    <div className="var var--steklo">
      {/* ── Состав: плитки заданий ─────────────────────────────── */}
      <section className="var-panel var-sostav" aria-labelledby="var-sostav-h">
        <div className="var-sostav__head">
          <h2 id="var-sostav-h" className="var-sostav__title">
            {T.sostav}
            <span className="var-sostav__count">
              {' · '}
              {summary.split(' · ')[0]}
            </span>
          </h2>
          <span className="var-sostav__actions">
            <button
              type="button"
              className="var-link"
              aria-label="Выбрать все задания"
              onClick={() => setConfig((c) => ({ ...c, tasks: [...VARIANT_NUMBERS] }))}
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
        <p className="var-sostav__note">{T.sostavNote}</p>
        <ul className="var-plitki">
          {PLITKI.map((s) => {
            const n = s.egeNumber;
            const on = config.tasks.includes(n);
            const chosen = config.subtypes[n];
            const est = s.subtypes.length > 1;
            const name = T.short[n] ?? s.title;
            return (
              <li key={n} className={clsx('var-plitka', on && 'is-on')}>
                <button
                  type="button"
                  className="var-plitka__main"
                  aria-pressed={on}
                  title={s.title}
                  onPointerDown={() => nachaloNazhatiya(n, est)}
                  onPointerUp={konecNazhatiya}
                  onPointerLeave={konecNazhatiya}
                  onPointerCancel={konecNazhatiya}
                  onContextMenu={(e) => {
                    if (est) e.preventDefault();
                  }}
                  onClick={() => {
                    if (dolgo.current?.srabotalo === true) {
                      dolgo.current = null;
                      return;
                    }
                    toggleTask(n);
                  }}
                >
                  <span className="var-plitka__no">{podpis1(n)}</span>
                  <span className="var-plitka__name">{name}</span>
                  {chosen === undefined ? null : (
                    <span className="var-plitka__metka">{T.podtipovMetka(chosen.length)}</span>
                  )}
                </button>
                {est ? (
                  <button
                    type="button"
                    className="var-plitka__more"
                    aria-label={T.podtipyKnopka(podpis1(n), s.title)}
                    aria-haspopup="dialog"
                    onClick={() => setOpen(n)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="6" cy="12" r="1.6" />
                      <circle cx="12" cy="12" r="1.6" />
                      <circle cx="18" cy="12" r="1.6" />
                    </svg>
                  </button>
                ) : null}
              </li>
            );
          })}
          {/* Раздел первой части, для которого задач ещё нет: плитка без нажатия. */}
          {VARIANT_SKORO.map((hranenie) => (
            <li key={`skoro-${hranenie}`} className="var-plitka is-skoro">
              <span className="var-plitka__main" aria-disabled="true">
                <span className="var-plitka__no">{nomerEge(hranenie)}</span>
                <span className="var-plitka__name">{nazvanieRazdela(hranenie)}</span>
                <span className="var-plitka__metka">{T.skoro}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Быстрые настройки: текущие значения, окно по нажатию ── */}
      <div className="var-bystro">
        <ul className="var-bystro__chipy">
          {(
            [
              [
                'source',
                'var-g-source',
                T.bystro.source,
                T.bystro.sourceValue[config.source] ?? '',
              ],
              ['level', 'var-g-level', T.bystro.level, levelValue],
              ['count', 'var-g-count', T.bystro.count, countValue],
              ['listy', 'var-g-figures', T.bystro.listy, T.bystro.listyValue[meta.figures] ?? ''],
            ] as const
          ).map(([id, g, label, value]) => (
            <li key={id}>
              <button
                type="button"
                className={clsx('var-bystro__chip', `var-bystro__chip--${id}`)}
                aria-haspopup="dialog"
                onClick={() => nastroyki(g)}
              >
                <span className="var-bystro__label">{label}:</span>
                <span className="var-bystro__value">
                  {value}
                  <span aria-hidden="true"> ›</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="var-link var-bystro__eshche"
          aria-haspopup="dialog"
          onClick={() => nastroyki('var-g-numbering')}
        >
          {T.bystro.eshche}
          <span aria-hidden="true"> ›</span>
        </button>
      </div>

      {/* ── Бланки ЕГЭ: свёрнутая плашка, всё — в окне ─────────── */}
      <button
        type="button"
        className="var-blanki"
        aria-haspopup="dialog"
        onClick={() => setOkno('blanki')}
      >
        <svg className="var-blanki__ik" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
        <span>{BLANKI_TEXT.title}</span>
        <span aria-hidden="true" className="var-blanki__strelka">
          ›
        </span>
      </button>

      {/* ── Статус ────────────────────────────────────────────── */}
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
      {notice === null || okno === 'kod' ? null : (
        <p className="var-status" role="status">
          {notice}
        </p>
      )}
      {stale ? <p className="var-status var-status--warn">{T.stale}</p> : null}

      {/* ── Набор: код и листы ─────────────────────────────────── */}
      {set === null ? null : (
        <section className="var-panel var-kit" aria-label={T.downloads}>
          <div className="var-kit__code">
            <span className="var-field__label">{T.code}</span>
            <code className="var-kit__value">{fullCode}</code>
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
            <Button variant="secondary" onClick={onlayn} data-testid="vo-kit-online">
              {ONLINE_TEXT.panel.open}
            </Button>
          </div>
          <p className="var-field__note">{T.downloadsNote}</p>
        </section>
      )}

      {set === null ? null : (
        <OnlinePanel set={set} meta={shown} stale={stale} busy={busy} onSeries={seriya} />
      )}

      {/* ── Предпросмотр: «призрачный» лист до первого набора ───── */}
      {set === null ? (
        <div className="var-prizrak" aria-hidden={busy ? undefined : true}>
          <div className="var-prizrak__list">
            <span className="var-prizrak__stroka var-prizrak__stroka--w60" />
            <span className="var-prizrak__stroka" />
            <span className="var-prizrak__stroka var-prizrak__stroka--w80" />
            <svg className="var-prizrak__ris" viewBox="0 0 80 50">
              <path d="M6 44 L40 6 L74 44 Z M40 6 L48 44" />
            </svg>
            <span className="var-prizrak__stroka var-prizrak__stroka--w70" />
          </div>
          <p className="var-prizrak__text">{busy ? T.building : T.prizrak}</p>
        </div>
      ) : (
        <VariantPreview
          set={set}
          meta={shown}
          title={title}
          busy={busy}
          dev={dev}
          space={space}
          onReplace={zamenit}
        />
      )}

      {/* ── Панель снизу: счёт и «Сформировать» ─────────────────── */}
      <div className="var-bar">
        <div className="var-bar__row">
          <p className="var-bar__summary" aria-live="polite">
            {summary}
          </p>
          <button
            type="button"
            className="var-btn var-btn--tyoplyy"
            onClick={sformirovat}
            disabled={busy || config.tasks.length === 0}
          >
            {set === null ? T.build : T.rebuild}
          </button>
        </div>
        <button
          type="button"
          className="var-link var-bar__kod"
          aria-haspopup="dialog"
          onClick={() => {
            setNotice(null);
            setOkno('kod');
          }}
        >
          {T.kodOtkryt}
        </button>
      </div>

      {/* ── Окно «Настройки листов» ─────────────────────────────── */}
      <Okno
        open={okno === 'nastroyki'}
        onClose={() => setOkno(null)}
        title={T.nastroyki}
        closeLabel={T.zakryt}
        scrollTo={gruppa}
        testId="var-okno-nastroyki"
        footer={
          <button
            type="button"
            className="var-btn var-btn--tyoplyy var-btn--block"
            onClick={() => setOkno(null)}
          >
            {T.gotovo}
          </button>
        }
      >
        <div className="var-nastroyki">
          <div id="var-g-source">
            <Segment
              label={T.source}
              options={T.sources}
              value={config.source}
              onPick={(id) => setConfig((c) => ({ ...c, source: id }))}
            />
          </div>
          <div id="var-g-level" className="var-field">
            <p className="var-field__label">{T.level}</p>
            <div className="var-seg var-seg--stars" role="group" aria-label={T.level}>
              {([1, 2, 3] as Stars[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={config.stars.includes(s)}
                  aria-label={`${T.level}: ${s} из 3`}
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
              {T.levelNote} ({sectionsNoLevel.map((n) => `№${podpis1(n)}`).join(', ')}).
            </p>
          </div>
          <div id="var-g-count" className="var-field">
            <p className="var-field__label">{T.count}</p>
            <div className="var-count-row">
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
              <label className="var-switch">
                <input
                  type="checkbox"
                  checked={config.parallel}
                  onChange={(e) => setConfig((c) => ({ ...c, parallel: e.target.checked }))}
                />
                <span className="var-switch__track" aria-hidden="true" />
                <span className="var-switch__label">{T.parallel}</span>
              </label>
            </div>
            <p className="var-field__note">{T.parallelNote}</p>
          </div>
          <div id="var-g-numbering">
            <Segment
              label={T.numbering}
              options={T.numberings}
              value={meta.numbering}
              onPick={(id) => setMeta((m) => ({ ...m, numbering: id }))}
            />
          </div>
          <div id="var-g-figures">
            <Segment
              label={T.figures}
              options={T.figureSizes}
              value={meta.figures}
              note={T.figuresNote}
              onPick={(id) => setMeta((m) => ({ ...m, figures: id }))}
            />
          </div>
          <div id="var-g-space">
            <SpaceOption
              className="var-field var-space"
              value={space}
              onChange={setSpace}
              numbers={config.tasks}
            />
          </div>
          <div id="var-g-header" className="var-field">
            <p className="var-field__label">{T.header}</p>
            <p className="var-field__note">{T.headerNote}</p>
            <div className="var-form">
              <label className="var-field">
                <span className="var-field__sub">{T.kind}</span>
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
                  <span className="var-field__sub">{T.customTitle}</span>
                  <Input
                    value={meta.customTitle}
                    maxLength={80}
                    onChange={(e) => setMeta((m) => ({ ...m, customTitle: e.target.value }))}
                  />
                </label>
              ) : null}
              <label className="var-field">
                <span className="var-field__sub">{T.topic}</span>
                <Input
                  value={meta.topic}
                  maxLength={120}
                  onChange={(e) => setMeta((m) => ({ ...m, topic: e.target.value }))}
                />
              </label>
              <label className="var-field">
                <span className="var-field__sub">{T.group}</span>
                <Input
                  value={meta.group}
                  maxLength={20}
                  onChange={(e) => setMeta((m) => ({ ...m, group: e.target.value }))}
                />
              </label>
              <label className="var-field">
                <span className="var-field__sub">{T.date}</span>
                <Input
                  type="date"
                  value={meta.date}
                  onChange={(e) => setMeta((m) => ({ ...m, date: e.target.value }))}
                />
              </label>
              <label className="var-field">
                <span className="var-field__sub">{T.duration}</span>
                <Input
                  value={meta.duration}
                  maxLength={40}
                  placeholder={T.durationPlaceholder}
                  onChange={(e) => setMeta((m) => ({ ...m, duration: e.target.value }))}
                />
              </label>
              <label className="var-field">
                <span className="var-field__sub">{T.teacher}</span>
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
          </div>
        </div>
      </Okno>

      {/* ── Окно подтипов ───────────────────────────────────────── */}
      <Okno
        open={openInfo !== null}
        onClose={() => setOpen(null)}
        title={
          openInfo === null
            ? ''
            : T.podtipy.title(
                podpis1(openInfo.egeNumber),
                T.short[openInfo.egeNumber] ?? openInfo.title,
              )
        }
        subtitle={
          openInfo === null
            ? undefined
            : T.podtipy.vybrano(openChosen.length, openInfo.subtypes.length)
        }
        closeLabel={T.zakryt}
        testId="var-okno-podtipy"
        footer={
          <button
            type="button"
            className="var-btn var-btn--tyoplyy var-btn--block"
            onClick={() => setOpen(null)}
          >
            {T.podtipy.primenit}
          </button>
        }
      >
        {openInfo === null ? null : (
          <div className="var-podtipy">
            {openInfo.capabilities.difficulty && openInfo.capabilities.fipi ? null : (
              <p className="var-podtipy__tegi">
                {openInfo.capabilities.difficulty ? null : (
                  <span className="var-tag">{T.noLevel}</span>
                )}
                {openInfo.capabilities.fipi ? null : <span className="var-tag">{T.noFipi}</span>}
              </p>
            )}
            <ul className="var-podtipy__list">
              {openInfo.subtypes.map((st) => {
                const on = openChosen.includes(st.id);
                const poslednij = on && openChosen.length === 1;
                return (
                  <li key={st.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      aria-disabled={poslednij || undefined}
                      title={poslednij ? T.podtipy.poslednij : undefined}
                      className={clsx('var-podtip', on && 'is-on')}
                      onClick={() => {
                        if (!poslednij) toggleSubtype(openInfo.egeNumber, st.id);
                      }}
                    >
                      <Piktogramma ege={openInfo.egeNumber} id={st.id} />
                      <span className="var-podtip__label">{st.label}</span>
                      <span className="var-podtip__check" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path d="m6 12.5 4 4 8-9" />
                        </svg>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {openChosen.length < openInfo.subtypes.length ? (
              <button
                type="button"
                className="var-link"
                onClick={() =>
                  setConfig((c) => {
                    const subtypes = { ...c.subtypes };
                    delete subtypes[openInfo.egeNumber];
                    return { ...c, subtypes };
                  })
                }
              >
                {T.podtipy.vse}
              </button>
            ) : null}
          </div>
        )}
      </Okno>

      {/* ── Окно бланков ────────────────────────────────────────── */}
      <Okno
        open={okno === 'blanki'}
        onClose={() => setOkno(null)}
        title={BLANKI_TEXT.title}
        closeLabel={T.zakryt}
        testId="var-okno-blanki"
      >
        <BlankiVybor
          defaultCopies={set?.variants.length ?? config.count}
          skachatLabel={T.blankiSkachat}
        />
      </Okno>

      {/* ── Окно «Открыть по коду» ──────────────────────────────── */}
      <Okno
        open={okno === 'kod'}
        onClose={() => setOkno(null)}
        title={T.kodTitle}
        closeLabel={T.zakryt}
        small
        testId="var-okno-kod"
      >
        <form
          className="var-kod"
          onSubmit={(e) => {
            e.preventDefault();
            otkrytIzOkna();
          }}
        >
          <p className="var-field__note">{T.codeNote}</p>
          <Input
            value={codeText}
            placeholder={T.codeInput}
            aria-label={T.codeInput}
            maxLength={60}
            autoComplete="off"
            onChange={(e) => setCodeText(e.target.value)}
            onKeyDown={(e) => {
              /* Как в прежнем поле кода: Enter открывает сам — не полагаемся
                 на отправку формы, её на сайте может перехватить чужой
                 обработчик клавиш. */
              if (e.key === 'Enter') {
                e.preventDefault();
                otkrytIzOkna();
              }
            }}
          />
          {notice === null ? null : (
            <p className="var-status" role="status">
              {notice}
            </p>
          )}
          <button
            type="submit"
            className="var-btn var-btn--tyoplyy var-btn--block"
            disabled={busy || codeText.trim() === ''}
          >
            {T.codeOpen}
          </button>
        </form>
      </Okno>
    </div>
  );
}
