'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { GEN_UI } from '@/content/generatorUi';
import {
  changeLevelAt,
  countsByTopic,
  defaultState,
  extrasOn,
  filterBySource,
  indexOfPos,
  levelsText,
  matchPreset,
  moveSlot,
  posKey,
  pruneZameny,
  relayout,
  removeAt,
  setSubtypeCount,
  setTopicCount,
  stateFromPreset,
  subtypeById,
  summary,
  tasksText,
  topicAllowed,
  topicHasLevels,
  urovniPodtipa,
  variantsText,
} from '@/lib/generator/obshchiy/state';
import type {
  GenConfig,
  GenEngine,
  GenExtras,
  GenSheet,
  GenSlot,
  GenState,
  GenTopic,
  Level,
  SourceId,
} from '@/lib/generator/obshchiy/types';
import {
  currentKit,
  makeKit,
  markDownloaded,
  newKitId,
  setCurrentKit,
  type Kit,
  type SheetWhich,
} from '@/lib/komplekt';
import { adresListaUchenika, qrSvg } from '@/lib/generator/qr';
import { GenIcon } from './GenIcons';
import { GenKits } from './GenKits';
import { GenPopover, GenToast, GenSheet as GenWindow } from './GenOverlay';
import { GenSheetView, type TaskAction } from './GenSheetView';
import './generator.css';

/** Seed демонстрационного листа: один и тот же у всех. */
const DEMO_SEED = 'PRMR';

type Overlay =
  | null
  | { kind: 'filters' }
  | { kind: 'task'; pos: string }
  | { kind: 'level'; pos: string }
  | { kind: 'actions' }
  | { kind: 'kits' }
  | { kind: 'link'; href: string };

export interface GeneratorProps {
  config: GenConfig;
  engine: GenEngine;
  /** Значки тем: id темы → элемент. */
  icons?: Partial<Record<string, ReactNode>>;
}

function isPhone(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 759.98px)').matches;
}

function Stepper({
  value,
  min,
  max,
  label,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (n: number) => void;
}) {
  return (
    <span className="gen-step">
      <button
        type="button"
        aria-label={`${label}: меньше`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <output aria-label={label}>{value}</output>
      <button
        type="button"
        aria-label={`${label}: больше`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </span>
  );
}

function stars(l: number): string {
  return '★'.repeat(l);
}

/**
 * Общий генератор листов (docs/generator/02-design.md, макет А).
 *
 * Сверху липкая полоса фильтров со сводкой и кнопкой «Сгенерировать»,
 * слева пресеты и состав, справа лист. До первой генерации в рамке
 * демонстрационный лист; после — лист обновляется при любой смене
 * настроек, seed сохраняется. «Перегенерировать всё» — новый seed.
 * Задача привязана к своей позиции в составе: правка состава, порядок
 * и «Убрать» не меняют остальные задачи, замены остаются.
 *
 * Состояние набора живёт в адресе (ссылка на набор) и в текущем
 * комплекте раздела (lib/komplekt.ts): после перезагрузки или
 * возвращения на вкладку открывается тот же лист.
 */
export function Generator({ config, engine, icons }: GeneratorProps) {
  const [st, setSt] = useState<GenState>(() => defaultState(config));
  const [generated, setGenerated] = useState(false);
  const [sheet, setSheet] = useState<GenSheet | null>(null);
  const [demo, setDemo] = useState<GenSheet | null>(null);
  const [variant, setVariant] = useState(0);
  const [teacher, setTeacher] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [srcPop, setSrcPop] = useState(false);
  const [pick, setPick] = useState(false);
  const [dopOpen, setDopOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const pvRef = useRef<HTMLDivElement>(null);
  const buildNo = useRef(0);
  const scrollAfterBuild = useRef(false);

  const say = useCallback((text: string) => setToast(text), []);
  const closeOverlay = useCallback(() => setOverlay(null), []);

  useEffect(() => {
    if (toast === null) return undefined;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  /* Набор из адреса (ссылка на набор, прежние адреса листов) или из
     текущего комплекта раздела; иначе — пресет по умолчанию и пример. */
  useEffect(() => {
    let alive = true;
    /* Адрес и хранилище есть только в браузере: читаем после монтирования,
       чтобы разметка сборки и первая отрисовка совпали. */
    void Promise.resolve().then(() => {
      if (!alive) return;
      let restored = engine.parse(new URLSearchParams(window.location.search));
      if (restored === null) {
        const kit = currentKit(config.slot);
        if (kit !== null)
          restored = engine.parse(new URLSearchParams(kit.studentHref.split('?')[1] ?? ''));
      }
      if (restored !== null) {
        setSt(restored);
        setGenerated(true);
      }
    });
    engine
      .build({ ...defaultState(config), seed: DEMO_SEED })
      .then((d) => {
        if (alive) setDemo(d);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Живой лист: после первой генерации пересобирается при каждом
     изменении состояния с тем же seed. */
  useEffect(() => {
    if (!generated || st.seed === null || st.plan.length === 0) return undefined;
    buildNo.current += 1;
    const no = buildNo.current;
    const state = { ...st, seed: st.seed };
    const t = window.setTimeout(() => {
      engine
        .build(state)
        .then((s) => {
          if (no !== buildNo.current) return;
          setSheet(s);
          setBusy(false);
        })
        .catch(() => setBusy(false));
    }, 60);
    return () => window.clearTimeout(t);
  }, [generated, st, engine]);

  /* Телефон, первая генерация: к листу — когда он уже на странице,
     иначе прокрутка упирается в конец короткой заглушки «Собираем…». */
  useEffect(() => {
    if (sheet === null || !scrollAfterBuild.current) return;
    scrollAfterBuild.current = false;
    pvRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [sheet]);

  const ready = generated && st.seed !== null && st.plan.length > 0;
  const hrefs = useMemo(
    () => (ready && st.seed !== null ? engine.hrefs({ ...st, seed: st.seed }) : null),
    [ready, st, engine],
  );
  const kit: Kit | null = useMemo(
    () =>
      hrefs === null || st.seed === null
        ? null
        : makeKit({
            scope: config.scope,
            slot: config.slot,
            section: config.section,
            count: st.plan.length * st.variants,
            id: st.seed,
            hrefs: () => ({ student: hrefs.student, teacher: hrefs.teacher }),
          }),
    [hrefs, st.seed, st.plan.length, st.variants, config],
  );

  /* QR-код («Дополнительно») — на лист ученика этого набора. */
  const studentHref = hrefs?.student ?? null;
  useEffect(() => {
    if (!st.extras.qr || studentHref === null) return undefined;
    let alive = true;
    qrSvg(adresListaUchenika(new URL(studentHref, window.location.origin).toString()))
      .then((svg) => {
        if (alive) setQr(svg);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [st.extras.qr, studentHref]);

  /* Ссылка на набор — в адресе страницы; текущий комплект — в браузере. */
  useEffect(() => {
    if (hrefs === null || kit === null) return;
    const q = hrefs.link.split('?')[1] ?? '';
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${q}`);
    const cur = currentKit(config.slot);
    if (cur === null || cur.code !== kit.code || cur.settings !== kit.settings) setCurrentKit(kit);
  }, [hrefs, kit, config.slot]);

  /* ── Изменения ─────────────────────────────────────────────────── */

  const counts = countsByTopic(config, st.plan);
  const hasLevels = config.levels.length > 0;
  /* Уровень на весь лист (№8): у задачи «Другого уровня» нет. */
  const taskLevel = hasLevels && config.taskLevel !== false;
  const presetId = matchPreset(config, st);

  /**
   * Правка набора. Замены остаются у своих позиций; ушедшая позиция или
   * вариант забирают свои. Набор с адреса прежнего генератора первая
   * правка переводит на ключи позиций — лист собирается заново.
   */
  function commit(next: GenState) {
    const { legacy, ...rest } = next;
    setSt(
      legacy !== undefined
        ? { ...rest, zameny: {} }
        : { ...rest, zameny: pruneZameny(rest.zameny, rest.plan, rest.variants) },
    );
  }

  function changePlan(plan: GenSlot[], patch: Partial<GenState> = {}) {
    commit({ ...st, ...patch, plan });
    if (generated) say(GEN_UI.toast.obnovlen);
  }

  function applyPreset(id: string) {
    const p = config.presets.find((x) => x.id === id);
    if (p === undefined) return;
    setSt({ ...stateFromPreset(config, p, st.source, st.extras), seed: st.seed });
    setPick(p.pickTopic !== undefined);
    setVariant(0);
    say(GEN_UI.toast.preset);
  }

  function setTopic(topic: GenTopic, n: number) {
    if (pick && (counts[topic.id] ?? 0) === 0) {
      const p = config.presets.find((x) => x.pickTopic !== undefined);
      changePlan(setTopicCount(config, [], topic.id, p?.pickTopic ?? n, st.levels));
      setPick(false);
      return;
    }
    setPick(false);
    changePlan(setTopicCount(config, st.plan, topic.id, n, st.levels));
  }

  function toggleLevel(l: Level) {
    const has = st.levels.includes(l);
    if (has && st.levels.length === 1) {
      say(GEN_UI.urovenNado);
      return;
    }
    const levels = (has ? st.levels.filter((x) => x !== l) : [...st.levels, l]).sort() as Level[];
    changePlan(relayout(config, st.plan, levels), { levels });
  }

  function setSource(source: SourceId) {
    setSrcPop(false);
    changePlan(filterBySource(config, st.plan, source), { source });
  }

  function setVariants(n: number) {
    const variants = Math.max(1, Math.min(config.limits.variantsMax, n));
    commit({ ...st, variants });
    if (variant >= variants) setVariant(0);
  }

  function setExtras(patch: Partial<GenExtras>, quiet = false) {
    commit({ ...st, extras: { ...st.extras, ...patch } });
    if (generated && !quiet) say(GEN_UI.toast.obnovlen);
  }

  function generate() {
    if (st.plan.length === 0) {
      say(GEN_UI.pustoy);
      return;
    }
    const again = generated;
    setBusy(true);
    setVariant(0);
    const { legacy: _legacy, ...rest } = st;
    setSt({ ...rest, seed: newKitId(), zameny: {} });
    setGenerated(true);
    scrollAfterBuild.current = !again && isPhone();
    if (again) say(GEN_UI.toast.novye);
  }

  /* Номер задачи в плане по её ключу; у листа прежней схемы ключ — номер. */
  const indexOf = (pos: string) =>
    st.legacy !== undefined ? Number(pos.split('.')[1] ?? 0) - 1 : indexOfPos(st.plan, pos);

  function move(pos: string, to: number) {
    const from = indexOf(pos);
    if (from < 0 || to < 0 || to >= st.plan.length || to === from) return;
    commit({ ...st, plan: moveSlot(st.plan, from, to) });
    say(GEN_UI.toast.peremeshchena);
  }

  function onTask(pos: string, action: TaskAction) {
    if (action === 'menu') {
      setOverlay({ kind: 'task', pos });
      return;
    }
    if (action === 'level') {
      setOverlay({ kind: 'level', pos });
      return;
    }
    if (action === 'swap') {
      if (st.legacy !== undefined && engine.legacyZameny !== true) {
        /* Прежний лист этого раздела замен не умеет: набор переходит на
           ключи позиций, задача заменяется уже в новой схеме. */
        const slot = st.plan[indexOf(pos)];
        const v = Number(pos.split('.')[0]);
        const { legacy: _old, ...rest } = st;
        commit({ ...rest, zameny: slot === undefined ? {} : { [posKey(v, slot)]: 1 } });
      } else {
        setSt({ ...st, zameny: { ...st.zameny, [pos]: (st.zameny[pos] ?? 0) + 1 } });
      }
      say(GEN_UI.toast.zamenena);
      setOverlay(null);
      return;
    }
    if (action === 'up' || action === 'down') {
      move(pos, indexOf(pos) + (action === 'up' ? -1 : 1));
      return;
    }
    commit({ ...st, plan: removeAt(st.plan, indexOf(pos)) });
    say(GEN_UI.toast.ubrana);
    setOverlay(null);
  }

  function chooseLevel(pos: string, level: Level) {
    commit({ ...st, plan: changeLevelAt(config, st.plan, indexOf(pos), level) });
    say(GEN_UI.toast.uroven(stars(level)));
    setOverlay(null);
  }

  function mark(which: SheetWhich[]) {
    if (kit === null) return;
    setCurrentKit(kit);
    let next = kit;
    for (const w of which) next = markDownloaded(next, w);
  }

  function copyLink() {
    setOverlay(null);
    if (hrefs === null) return;
    const url = new URL(hrefs.link, window.location.origin).toString();
    const manual = () => setOverlay({ kind: 'link', href: url });
    if (navigator.clipboard === undefined) {
      manual();
      return;
    }
    navigator.clipboard.writeText(url).then(() => say(GEN_UI.toast.ssylka), manual);
  }

  function openKit(k: Kit) {
    const parsed = engine.parse(new URLSearchParams(k.studentHref.split('?')[1] ?? ''));
    if (parsed !== null) {
      setSt(parsed);
      setGenerated(true);
      setVariant(0);
    }
    setOverlay(null);
  }

  /* ── Вид ───────────────────────────────────────────────────────── */

  const sum = summary(config, st);
  const source = config.sources.find((s) => s.id === st.source);
  const empty = st.plan.length === 0;
  const tasks = generated
    ? empty
      ? []
      : (sheet?.variants[variant] ?? [])
    : (demo?.variants[0] ?? []);
  const live = generated && sheet !== null && !empty;
  const goLabel =
    busy && !empty ? GEN_UI.sobiraem : generated ? GEN_UI.peregenerirovat : GEN_UI.sgenerirovat;
  const go = (
    <button
      type="button"
      className={clsx('btn btn--primary btn--lg gen-go', busy && 'is-busy')}
      aria-busy={busy || undefined}
      onClick={generate}
    >
      <GenIcon name={generated ? 'refresh' : 'play'} />
      {goLabel}
    </button>
  );

  const levelButtons = (cards: boolean) =>
    config.levels.map(({ level, words }) => (
      <button
        key={level}
        type="button"
        className={cards ? 'gen-lvcard' : undefined}
        aria-pressed={st.levels.includes(level)}
        title={words}
        onClick={() => toggleLevel(level)}
      >
        {cards ? (
          <>
            <b>{stars(level)}</b>
            <small>{words}</small>
          </>
        ) : (
          stars(level)
        )}
      </button>
    ));

  const sourceRadios = config.sources.map((s) => (
    <button
      key={s.id}
      type="button"
      role="radio"
      className="gen-radio"
      aria-checked={st.source === s.id}
      onClick={() => setSource(s.id)}
    >
      <i aria-hidden="true" />
      <span>
        <b>{s.title}</b>
        <small>{s.note}</small>
      </span>
    </button>
  ));

  const overlayTask =
    overlay !== null && (overlay.kind === 'task' || overlay.kind === 'level') ? overlay.pos : null;
  const overlayLevel =
    overlayTask === null
      ? null
      : (subtypeById(config, st.plan[indexOf(overlayTask)]?.id ?? '')?.level ?? null);
  const levelCards = (pos: string) => (
    <div className="gen-lvcards" role="group" aria-label={GEN_UI.drugoyUroven}>
      {config.levels.map(({ level, words }) => (
        <button
          key={level}
          type="button"
          className="gen-lvcard"
          aria-pressed={overlayLevel === level}
          onClick={() => chooseLevel(pos, level)}
        >
          <b>{stars(level)}</b>
          <small>{words}</small>
        </button>
      ))}
    </div>
  );

  const extras = config.extras;
  const dopCount = extrasOn(st.extras);
  const dopControls =
    extras === undefined ? null : (
      <div className="gen-dop__list">
        {extras.theory === false ? null : (
          <div className="gen-opt">
            <span>
              {GEN_UI.dop.teoriya}
              <small>{GEN_UI.dop.teoriyaNote}</small>
            </span>
            <button
              type="button"
              role="switch"
              className="gen-switch"
              aria-checked={st.extras.theory}
              aria-label={GEN_UI.dop.teoriya}
              onClick={() => setExtras({ theory: !st.extras.theory })}
            />
          </div>
        )}
        {extras.examples === false ? null : (
          <div className="gen-opt">
            <span>
              {GEN_UI.dop.primery}
              <small>{GEN_UI.dop.primeryNote}</small>
            </span>
            <div className="gen-segm" role="group" aria-label={GEN_UI.dop.primery}>
              {([0, 1, 2] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={st.extras.examples === k}
                  onClick={() => setExtras({ examples: k })}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}
        {extras.seriya === undefined ? null : (
          <div className="gen-opt">
            <span>
              {GEN_UI.dop.urok}
              <small>{GEN_UI.dop.urokNote}</small>
            </span>
            <Stepper
              value={st.extras.urok + 1}
              min={1}
              max={extras.seriya}
              label={GEN_UI.dop.urok}
              onChange={(v) => setExtras({ urok: v - 1 })}
            />
          </div>
        )}
        <div className="gen-opt">
          <span>
            {GEN_UI.dop.qr}
            <small>{GEN_UI.dop.qrNote}</small>
          </span>
          <button
            type="button"
            role="switch"
            className="gen-switch"
            aria-checked={st.extras.qr}
            aria-label={GEN_UI.dop.qr}
            onClick={() => setExtras({ qr: !st.extras.qr })}
          />
        </div>
        <label className="gen-opt">
          <span>{GEN_UI.dop.vid}</span>
          <select
            className="gen-input"
            value={st.extras.kind ?? ''}
            onChange={(e) => setExtras({ kind: e.target.value === '' ? null : e.target.value })}
          >
            <option value="">{GEN_UI.dop.vidAuto}</option>
            {extras.kinds.map((k) => (
              <option key={k.id} value={k.id}>
                {k.title}
              </option>
            ))}
          </select>
        </label>
        <label className="gen-opt">
          <span>{GEN_UI.dop.data}</span>
          <input
            type="date"
            className="gen-input"
            value={st.extras.date}
            onChange={(e) => setExtras({ date: e.target.value }, true)}
          />
        </label>
        <label className="gen-opt">
          <span>{GEN_UI.dop.uchitel}</span>
          <input
            type="text"
            className="gen-input"
            maxLength={40}
            value={st.extras.teacher}
            onChange={(e) => setExtras({ teacher: e.target.value }, true)}
          />
        </label>
      </div>
    );

  return (
    <section className="gen" aria-label="Генератор">
      <div className="gen-strip">
        <div className="gen-strip__filters">
          {config.sources.length > 1 ? (
            <div className="gen-fld">
              <span className="gen-label">{GEN_UI.istochnik}</span>
              <div className="gen-popwrap">
                <button
                  type="button"
                  className="gen-dd"
                  aria-haspopup="menu"
                  aria-expanded={srcPop}
                  onClick={() => setSrcPop((v) => !v)}
                >
                  {source?.title}
                  <GenIcon name="chevron" />
                </button>
                {srcPop ? (
                  <GenPopover onClose={() => setSrcPop(false)}>
                    {config.sources.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={st.source === s.id}
                        className="gen-pop__opt"
                        onClick={() => setSource(s.id)}
                      >
                        <b>{s.title}</b>
                        <small>{s.note}</small>
                      </button>
                    ))}
                  </GenPopover>
                ) : null}
              </div>
            </div>
          ) : null}
          {hasLevels ? (
            <div className="gen-fld">
              <span className="gen-label">{GEN_UI.slozhnost}</span>
              <div className="gen-stars" role="group" aria-label={GEN_UI.slozhnost}>
                {levelButtons(false)}
              </div>
            </div>
          ) : null}
          <div className="gen-fld">
            <span className="gen-label">{GEN_UI.variantov}</span>
            <Stepper
              value={st.variants}
              min={1}
              max={config.limits.variantsMax}
              label={GEN_UI.variantov}
              onChange={setVariants}
            />
          </div>
        </div>
        <div className="gen-strip__go">
          <span className="gen-sum" title={sum.full}>
            <b>{sum.main}</b>
            <small>{sum.rest}</small>
          </span>
          {go}
        </div>
        <div className="gen-strip__chips">
          <button type="button" className="is-main" onClick={() => setOverlay({ kind: 'filters' })}>
            <GenIcon name="filter" />
            {GEN_UI.filtry}
          </button>
          {config.sources.length > 1 ? (
            <button type="button" onClick={() => setOverlay({ kind: 'filters' })}>
              {source?.title}
            </button>
          ) : null}
          {hasLevels ? (
            <button type="button" onClick={() => setOverlay({ kind: 'filters' })}>
              {levelsText(st.levels)}
            </button>
          ) : null}
          <button type="button" onClick={() => setOverlay({ kind: 'filters' })}>
            {variantsText(st.variants)}
          </button>
        </div>
      </div>

      <div className="gen-cols">
        <div className="gen-cfg">
          <div className="gen-presets__head">
            <span className="gen-label">{GEN_UI.bystryyStart}</span>
            {presetId === null ? <span className="gen-hint">{GEN_UI.svoya}</span> : null}
          </div>
          <div className="gen-presets" role="group" aria-label={GEN_UI.bystryyStart}>
            {config.presets.map((p) => (
              <button
                key={p.id}
                type="button"
                className="gen-preset"
                aria-pressed={presetId === p.id}
                onClick={() => applyPreset(p.id)}
              >
                <b>{p.title}</b>
                <span>{p.sub}</span>
              </button>
            ))}
          </div>

          <section className="gen-card gen-sostav" aria-label={GEN_UI.sostav}>
            <div className="gen-sostav__head">
              <h2>{st.variants > 1 ? GEN_UI.sostavVarianta : GEN_UI.sostav}</h2>
              <span>{tasksText(st.plan.length)}</span>
            </div>
            {pick ? <p className="gen-pick">{GEN_UI.pickHint}</p> : null}
            {config.topics.map((t) => {
              const n = counts[t.id] ?? 0;
              const allowed = topicAllowed(t, st.source);
              const bank = t.subtypes.reduce((a, s) => a + s.bank, 0);
              const meta = !allowed
                ? GEN_UI.netVIstochnike
                : (t.note ?? (st.source === 'new' ? GEN_UI.generiruyutsya : GEN_UI.vBanke(bank)));
              const isOpen = open[t.id] === true;
              return (
                <div key={t.id} className="gen-trow-wrap">
                  <div
                    className={clsx(
                      'gen-trow',
                      n === 0 && 'is-off',
                      !allowed && 'is-disabled',
                      pick && n > 0 && 'is-pick',
                    )}
                  >
                    <span className="gen-trow__icon">
                      {/* Без своего значка — буква темы в кружке (группы A–C №2). */}
                      {icons?.[t.id] ?? (
                        <span className="gen-trow__letter no-math-check" aria-hidden="true">
                          {t.id}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      className="gen-trow__name"
                      aria-expanded={isOpen}
                      onClick={() => setOpen((o) => ({ ...o, [t.id]: !isOpen }))}
                    >
                      {t.titleHtml === undefined ? (
                        <b>{t.title}</b>
                      ) : (
                        <b dangerouslySetInnerHTML={{ __html: t.titleHtml }} />
                      )}
                      <small>
                        {meta} · {GEN_UI.podtipy}
                        <GenIcon name="chevron" className={clsx('gen-chev', isOpen && 'is-open')} />
                      </small>
                    </button>
                    {n === 0 ? (
                      <button
                        type="button"
                        className="gen-add"
                        disabled={!allowed}
                        onClick={() => setTopic(t, 1)}
                      >
                        {GEN_UI.dobavit}
                      </button>
                    ) : (
                      <Stepper
                        value={n}
                        min={0}
                        max={config.limits.maxPerTopic}
                        label={t.title}
                        onChange={(v) => setTopic(t, v)}
                      />
                    )}
                  </div>
                  {hasLevels && n > 0 && !topicHasLevels(t, st.levels) ? (
                    <p className="gen-hint gen-trow__warn">{GEN_UI.netUrovnya}</p>
                  ) : null}
                  {isOpen ? (
                    <div className="gen-subs">
                      {t.subtypes.map((s) => {
                        const k = st.plan.filter((x) => x.id === s.id).length;
                        return (
                          <div key={s.id} className="gen-sub">
                            <span className="gen-sub__name">
                              <span className="gen-sub__code">{s.code}</span>{' '}
                              {s.titleHtml === undefined ? (
                                s.title
                              ) : (
                                <span dangerouslySetInnerHTML={{ __html: s.titleHtml }} />
                              )}{' '}
                              {hasLevels ? (
                                <span
                                  className="gen-sub__lv"
                                  aria-label={`Сложность ${urovniPodtipa(s).join('–')} из ${config.levels.length}`}
                                >
                                  {levelsText(urovniPodtipa(s))}
                                </span>
                              ) : null}
                            </span>
                            <Stepper
                              value={k}
                              min={0}
                              max={config.limits.maxPerTopic}
                              label={s.title}
                              onChange={(v) => {
                                if (allowed) changePlan(setSubtypeCount(config, st.plan, s.id, v));
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
            <p className="gen-hint gen-sostav__limit">{GEN_UI.limit(config.limits.maxPerTopic)}</p>
          </section>
          {dopControls === null ? null : (
            <section className="gen-card gen-dop" aria-label={GEN_UI.dopolnitelno}>
              <button
                type="button"
                className="gen-dop__head"
                aria-expanded={dopOpen}
                onClick={() => setDopOpen((v) => !v)}
              >
                <span>
                  <b>{GEN_UI.dopolnitelno}</b>
                  <small>
                    {extras?.theory === false && extras.examples === false
                      ? GEN_UI.dop.chtoBezRamok
                      : GEN_UI.dop.chto}
                  </small>
                </span>
                {dopCount > 0 ? <span className="gen-dop__n">{dopCount}</span> : null}
                <GenIcon name="chevron" />
              </button>
              {dopOpen ? dopControls : null}
            </section>
          )}
        </div>

        <div className="gen-pv" ref={pvRef}>
          <div className="gen-pv__bar">
            {!generated ? (
              <p className="gen-pv__demo">
                <span className="gen-badge">{GEN_UI.primer}</span>
                <span>{GEN_UI.primerText}</span>
              </p>
            ) : (
              <>
                {st.variants > 1 ? (
                  <div className="gen-vtabs" role="group" aria-label={GEN_UI.variant}>
                    <span>{GEN_UI.variant}</span>
                    {Array.from({ length: st.variants }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={variant === i}
                        onClick={() => setVariant(i)}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="gen-segm" role="group" aria-label={GEN_UI.chey}>
                  <button type="button" aria-pressed={!teacher} onClick={() => setTeacher(false)}>
                    {GEN_UI.uchenik}
                  </button>
                  <button type="button" aria-pressed={teacher} onClick={() => setTeacher(true)}>
                    {GEN_UI.uchitel}
                  </button>
                </div>
                <span className="gen-pv__sp" />
                <a
                  className={clsx(
                    'btn btn--secondary btn--sm gen-pv__pdf',
                    kit === null && 'is-disabled',
                  )}
                  href={kit === null ? undefined : teacher ? kit.teacherHref : kit.studentHref}
                  target="_blank"
                  rel="noopener"
                  aria-disabled={kit === null || undefined}
                  onClick={() => mark([teacher ? 'teacher' : 'student'])}
                >
                  <GenIcon name="pdf" />
                  {GEN_UI.skachatPdf}
                </a>
                <span className="gen-pv__desk">
                  <a
                    className={clsx('btn btn--secondary btn--sm', hrefs === null && 'is-disabled')}
                    href={hrefs?.all}
                    target="_blank"
                    rel="noopener"
                    onClick={() => mark(['student', 'teacher'])}
                  >
                    <GenIcon name="files" />
                    {GEN_UI.vseOdnim}
                  </a>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={copyLink}
                    disabled={hrefs === null}
                  >
                    <GenIcon name="link" />
                    {GEN_UI.ssylka}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setOverlay({ kind: 'kits' })}
                  >
                    <GenIcon name="box" />
                    {GEN_UI.moiKomplekty}
                  </button>
                </span>
                <button
                  type="button"
                  className="gen-iconbtn gen-pv__more"
                  aria-label={GEN_UI.esche}
                  onClick={() => setOverlay({ kind: 'actions' })}
                >
                  <GenIcon name="dots" />
                </button>
              </>
            )}
          </div>
          {generated && sheet?.note ? (
            <p className="gen-pv__note" role="status">
              {sheet.note}
            </p>
          ) : null}
          <div className="gen-pv__scroll">
            {tasks.length > 0 ? (
              <GenSheetView
                config={config}
                tasks={tasks}
                subtitle={engine.subtitle(st)}
                teacher={generated && teacher}
                demo={!generated}
                live={live}
                levels={taskLevel}
                extras={generated ? st.extras : null}
                qr={generated && st.extras.qr ? qr : null}
                onAction={onTask}
                onMove={move}
              />
            ) : (
              <p className="gen-pv__empty">
                {generated && st.plan.length === 0 ? GEN_UI.pustoy : GEN_UI.sobiraem}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="gen-actbar">
        <span className="gen-sum">
          <b>{sum.main}</b>
          {sum.rest === '' ? null : ` · ${sum.rest}`}
        </span>
        {go}
      </div>

      {toast === null ? null : <GenToast text={toast} />}

      {overlay?.kind === 'filters' ? (
        <GenWindow
          title={GEN_UI.filtry}
          onClose={closeOverlay}
          foot={
            <button
              type="button"
              className="btn btn--primary btn--lg gen-wide"
              onClick={closeOverlay}
            >
              {GEN_UI.gotovo(tasksText(st.plan.length))}
            </button>
          }
        >
          {config.sources.length > 1 ? (
            <section className="gen-sec">
              <h3>{GEN_UI.istochnik}</h3>
              <div className="gen-radios" role="radiogroup" aria-label={GEN_UI.istochnik}>
                {sourceRadios}
              </div>
            </section>
          ) : null}
          {hasLevels ? (
            <section className="gen-sec">
              <h3>{GEN_UI.slozhnost}</h3>
              <div className="gen-lvcards" role="group" aria-label={GEN_UI.slozhnost}>
                {levelButtons(true)}
              </div>
              <p className="gen-hint">{GEN_UI.levelsHint}</p>
            </section>
          ) : null}
          <section className="gen-sec">
            <h3>{GEN_UI.variantov}</h3>
            <Stepper
              value={st.variants}
              min={1}
              max={config.limits.variantsMax}
              label={GEN_UI.variantov}
              onChange={setVariants}
            />
          </section>
          {dopControls === null ? null : (
            <section className="gen-sec">
              <h3>{GEN_UI.dopolnitelno}</h3>
              {dopControls}
            </section>
          )}
        </GenWindow>
      ) : null}

      {overlay?.kind === 'task' ? (
        <GenWindow title={GEN_UI.zadacha(indexOf(overlay.pos) + 1)} onClose={closeOverlay}>
          <button
            type="button"
            className="gen-menu-item"
            onClick={() => onTask(overlay.pos, 'swap')}
          >
            <GenIcon name="swap" />
            {GEN_UI.zamenit}
          </button>
          {st.plan.length > 1 ? (
            <div className="gen-menu-row">
              <button
                type="button"
                className="gen-menu-item"
                disabled={indexOf(overlay.pos) <= 0}
                onClick={() => onTask(overlay.pos, 'up')}
              >
                <GenIcon name="up" />
                {GEN_UI.vyshe}
              </button>
              <button
                type="button"
                className="gen-menu-item"
                disabled={indexOf(overlay.pos) >= st.plan.length - 1}
                onClick={() => onTask(overlay.pos, 'down')}
              >
                <GenIcon name="down" />
                {GEN_UI.nizhe}
              </button>
            </div>
          ) : null}
          {taskLevel ? (
            <>
              <div className="gen-menu-item is-static">
                <GenIcon name="star" />
                {GEN_UI.drugoyUroven}
              </div>
              {levelCards(overlay.pos)}
            </>
          ) : null}
          <button
            type="button"
            className="gen-menu-item is-danger"
            onClick={() => onTask(overlay.pos, 'remove')}
          >
            <GenIcon name="x" />
            {GEN_UI.ubrat}
          </button>
        </GenWindow>
      ) : null}

      {overlay?.kind === 'level' ? (
        <GenWindow
          title={`${GEN_UI.drugoyUroven} · ${GEN_UI.zadacha(indexOf(overlay.pos) + 1).toLowerCase()}`}
          onClose={closeOverlay}
        >
          {levelCards(overlay.pos)}
        </GenWindow>
      ) : null}

      {overlay?.kind === 'actions' ? (
        <GenWindow title={GEN_UI.esche} onClose={closeOverlay}>
          <a
            className="gen-menu-item"
            href={hrefs?.all}
            target="_blank"
            rel="noopener"
            onClick={() => {
              mark(['student', 'teacher']);
              closeOverlay();
            }}
          >
            <GenIcon name="files" />
            {GEN_UI.vseOdnim}
          </a>
          <button type="button" className="gen-menu-item" onClick={copyLink}>
            <GenIcon name="link" />
            {GEN_UI.ssylka}
          </button>
          <button
            type="button"
            className="gen-menu-item"
            onClick={() => setOverlay({ kind: 'kits' })}
          >
            <GenIcon name="box" />
            {GEN_UI.moiKomplekty}
          </button>
        </GenWindow>
      ) : null}

      {overlay?.kind === 'kits' ? (
        <GenWindow title={GEN_UI.komplekty.title} onClose={closeOverlay}>
          <GenKits
            scope={config.scope}
            slot={config.slot}
            onOpen={openKit}
            onSeed={(id) => {
              setSt({ ...st, seed: id, zameny: {} });
              setGenerated(true);
            }}
          />
        </GenWindow>
      ) : null}

      {overlay?.kind === 'link' ? (
        <GenWindow title={GEN_UI.ssylka} onClose={closeOverlay}>
          <p className="gen-hint">{GEN_UI.ssylkaRuchnaya}</p>
          <input
            className="input gen-wide"
            readOnly
            value={overlay.href}
            onFocus={(e) => e.currentTarget.select()}
          />
        </GenWindow>
      ) : null}
    </section>
  );
}
