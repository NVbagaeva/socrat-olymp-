'use client';

/**
 * Ученик решает ДЗ: пункты по порядку, у каждого метка источника
 * (Карточки / Опорная / Тренажёр) и статус, переключение свободное.
 * Задачи — на общем экране задачи тренажёра (components/tasks/trening,
 * EkranZadachi), карточки — на общей карточке (components/kartochki,
 * KartochkaFlip); ответ проверяет база, попытки считает она же.
 * Сделанное хранится в базе сразу после ответа, набранное и не
 * проверенное — в браузере: незаконченное ДЗ открывается с того же места.
 *
 * После сдачи, закрытия репетитором и срока — только просмотр.
 */

import Link from 'next/link';
import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KartochkaFlip } from '@/components/kartochki/KartochkaFlip';
import { Ikonka, Metka, type Shag } from '@/components/tasks/steklo';
import { EkranZadachi, PodskazkaVoprosy, type SostoyanieZadachi } from '@/components/tasks/trening';
import { TRENAZHER7 } from '@/content/uravneniya7';
import { DZ, dueRu, dzError } from '@/content/dz';
import { DZK, ISTOCHNIK } from '@/content/dzIstochniki';
import type { HwFull } from '@/lib/dz/api';
import { delaUchenika } from '@/lib/dz/api';
import { DZ_HREF } from '@/lib/dz/links';
import { tasksOf } from '@/lib/dz/results';
import { sanitizeHtml } from '@/lib/dz/sanitize';
import type { HwAnswerView, HwPartView, HwState, HwTaskView, RazborDz } from '@/lib/dz/types';
import { formatHint, fractionRightHint, normalizeAnswer } from '@/lib/otvet';
import type { KartochkaGotovaya } from '@/lib/kartochki/podgotovka';
import { browserStorage } from '@/lib/storage';
import { Confirm, dzApi, errorCode } from '../common';
import '@/components/kartochki/kartochki.css';
import './reshenie.css';

const DRAFT = 'budetege-dz:otvet:';

function readDraft(task: string): string {
  try {
    return browserStorage()?.getItem(DRAFT + task) ?? '';
  } catch {
    return '';
  }
}

function writeDraft(task: string, value: string): void {
  try {
    if (value === '') browserStorage()?.removeItem(DRAFT + task);
    else browserStorage()?.setItem(DRAFT + task, value);
  } catch {
    /* Черновик не сохранился — ответ в поле остаётся до перезагрузки. */
  }
}

/** Решение из базы → шаги сцены, вся вёрстка — после очистки. */
export function shagiDz(r: RazborDz): Shag[] {
  return r.shagi.map((s) => ({
    chtoHtml: s.chto.startsWith('<') ? sanitizeHtml(s.chto) : `<p>${sanitizeHtml(s.chto)}</p>`,
    formulaHtml: sanitizeHtml(s.tex),
    ...(s.zag === undefined ? {} : { zagolovok: s.zag, zagolovokHtml: sanitizeHtml(s.zag) }),
    ...(s.ton === undefined ? {} : { ton: s.ton }),
  }));
}

type StatusPunkta = 'ne' | 'nachato' | 'gotovo';

function statusPunkta(units: readonly HwTaskView[], stateOf: (id: string) => HwState, tried: (id: string) => boolean): StatusPunkta {
  const closed = units.filter((u) => stateOf(u.id) !== 'open').length;
  if (closed === units.length && units.length > 0) return 'gotovo';
  return closed > 0 || units.some((u) => tried(u.id)) ? 'nachato' : 'ne';
}

export function ReshenieDz({
  full,
  userId,
  reload,
}: {
  full: HwFull;
  userId: string;
  reload: () => Promise<void>;
}) {
  const hw = full.hw;
  const mine = full.recipients.find((r) => r.userId === userId) ?? full.recipients[0];
  const units = useMemo(() => tasksOf(full.tasks, userId), [full.tasks, userId]);
  /* Пункты, в которых у ученика что-то есть (в «каждому свои» бывает пусто). */
  const parts = useMemo(
    () =>
      [...full.parts]
        .sort((a, b) => a.position - b.position)
        .filter((p) => units.some((u) => u.partId === p.id)),
    [full.parts, units],
  );
  const [answers, setAnswers] = useState<Map<string, HwAnswerView>>(
    () => new Map(full.answers.filter((a) => a.userId === userId).map((a) => [a.taskId, a])),
  );
  const stateOf = useCallback((id: string): HwState => answers.get(id)?.state ?? 'open', [answers]);
  const tried = useCallback((id: string) => (answers.get(id)?.attempts ?? 0) > 0, [answers]);
  const [current, setCurrent] = useState(() => {
    const i = parts.findIndex((p) => units.some((u) => u.partId === p.id && (answers.get(u.id)?.state ?? 'open') === 'open'));
    return i === -1 ? 0 : i;
  });
  const [error, setError] = useState<string | null>(null);
  const [ask, setAsk] = useState(false);

  const submittedAt = mine?.submittedAt ?? null;
  const expired = hw.dueAt !== null && Date.parse(hw.dueAt) < full.loadedAt;
  const readOnly = submittedAt !== null || hw.closedAt !== null || expired;

  useEffect(() => {
    if (mine !== undefined && mine.startedAt === null && !readOnly) {
      void dzApi().then((api) => api.startHomework(hw.id).catch(() => undefined));
    }
  }, [hw.id, mine, readOnly]);

  const cardParts = useMemo(() => new Set(full.parts.filter((p) => p.source === 'kartochki').map((p) => p.id)), [full.parts]);
  const closed = useMemo(() => new Set([...answers.values()].filter((a) => a.state !== 'open').map((a) => a.taskId)), [answers]);
  const dela = delaUchenika(units, cardParts, userId, closed);
  const verno = units.filter((u) => stateOf(u.id) === 'right').length;

  const zapisat = useCallback(
    (taskId: string, patch: Partial<HwAnswerView> & { entry?: HwAnswerView['entries'][number] }) =>
      setAnswers((m) => {
        const prev = m.get(taskId) ?? { taskId, userId, state: 'open' as HwState, attempts: 0, entries: [], seconds: 0 };
        const { entry, ...rest } = patch;
        return new Map(m).set(taskId, {
          ...prev,
          ...rest,
          entries: entry === undefined ? prev.entries : [...prev.entries, entry],
        });
      }),
    [userId],
  );

  async function sdat() {
    setAsk(false);
    try {
      await (await dzApi()).submitHomework(hw.id);
      await reload();
    } catch (e) {
      setError(dzError(errorCode(e)));
    }
  }

  const part = parts[current];

  return (
    <div className="rdz" data-page="domashka-uchenik">
      <Link className="dz-back" href={DZ_HREF.kabinet}>
        {DZ.solve.back}
      </Link>
      <header className="rdz-head stk-glass">
        <h1 className="rdz-title">{hw.title}</h1>
        <p className="rdz-meta">
          {hw.dueAt === null ? null : <span>{DZ.solve.due(dueRu(hw.dueAt))} · </span>}
          <span data-block="dz-sdelano">{DZK.uchenik.sdelano(dela.sdelano, dela.vsego)}</span>
        </p>
        {hw.note === '' ? null : (
          <aside className="rdz-note" data-note="hw">
            <b>{DZ.solve.tutorNote}:</b> {hw.note}
          </aside>
        )}
        {submittedAt !== null ? (
          <p className="rdz-banner is-ok" role="status" data-state="submitted">
            {DZ.solve.submittedAt(dueRu(submittedAt))} · {DZ.solve.summary(verno, units.length)}
          </p>
        ) : hw.closedAt !== null ? (
          <p className="rdz-banner" role="status">
            {DZ.solve.closedByTutor}
          </p>
        ) : expired ? (
          <p className="rdz-banner is-warn" role="status" data-state="expired">
            {DZK.uchenik.tolkoProsmotr}
          </p>
        ) : null}
      </header>

      <nav className="rdz-punkty" aria-label={DZK.uchenik.punkty}>
        <ol>
          {parts.map((p, i) => {
            const st = statusPunkta(units.filter((u) => u.partId === p.id), stateOf, tried);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={clsx('rdz-punkt', `is-${st}`, i === current && 'is-current')}
                  aria-current={i === current ? 'step' : undefined}
                  data-istochnik={p.source}
                  onClick={() => setCurrent(i)}
                >
                  <span className="rdz-punkt__no">{i + 1}</span>
                  <span className="rdz-punkt__telo">
                    <span className={`rdz-metka rdz-metka--${p.source}`}>{ISTOCHNIK[p.source]}</span>
                    <span className="rdz-punkt__nazvanie" dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.titleHtml) }} />
                  </span>
                  <span className="rdz-punkt__status">{DZK.uchenik.status[st]}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {part === undefined ? null : (
        <section className="rdz-tekushchiy" aria-label={`Пункт ${current + 1}`} data-part={part.id} data-istochnik={part.source}>
          {part.comment === null ? null : (
            <aside className="rdz-note" data-note="part">
              <b>{DZ.solve.taskNote}:</b> {part.comment}
            </aside>
          )}
          {part.source === 'kartochki' ? (
            <NaborKartochek
              key={part.id}
              part={part}
              units={units.filter((u) => u.partId === part.id)}
              stateOf={stateOf}
              answers={answers}
              readOnly={readOnly}
              onZapis={zapisat}
              onError={setError}
              onDalshe={current < parts.length - 1 ? () => setCurrent(current + 1) : null}
            />
          ) : (
            <Zadachi
              key={part.id}
              full={full}
              part={part}
              units={units.filter((u) => u.partId === part.id)}
              answers={answers}
              readOnly={readOnly}
              onZapis={zapisat}
              onError={setError}
              reload={reload}
              onDalshe={current < parts.length - 1 ? () => setCurrent(current + 1) : null}
            />
          )}
        </section>
      )}

      {error === null ? null : (
        <p className="rdz-banner is-warn" role="alert">
          {error}
        </p>
      )}

      {readOnly ? null : (
        <div className="rdz-sdat stk-glass">
          <p className="rdz-muted">{DZ.solve.saved}</p>
          <button type="button" className="stk-btn stk-btn--primary stk-btn--lg" data-action="sdat" onClick={() => setAsk(true)}>
            {DZK.uchenik.sdat}
          </button>
        </div>
      )}

      <Confirm
        open={ask}
        title={DZK.uchenik.sdatVopros}
        text={DZK.uchenik.sdatText(dela.sdelano, dela.vsego, verno)}
        action={DZK.uchenik.sdat}
        onCancel={() => setAsk(false)}
        onConfirm={() => void sdat()}
      />
    </div>
  );
}

/* ── Задачи пункта (тренажёр, опорные) ────────────────────────── */

type Zapis = (taskId: string, patch: Partial<HwAnswerView> & { entry?: HwAnswerView['entries'][number] }) => void;

function Zadachi({
  full,
  part,
  units,
  answers,
  readOnly,
  onZapis,
  onError,
  reload,
  onDalshe,
}: {
  full: HwFull;
  part: HwPartView;
  units: HwTaskView[];
  answers: Map<string, HwAnswerView>;
  readOnly: boolean;
  onZapis: Zapis;
  onError: (e: string | null) => void;
  reload: () => Promise<void>;
  onDalshe: (() => void) | null;
}) {
  const hw = full.hw;
  const [i, setI] = useState(() => {
    const open = units.findIndex((u) => (answers.get(u.id)?.state ?? 'open') === 'open');
    return open === -1 ? 0 : open;
  });
  const u = units[i];
  if (u === undefined) return null;
  return (
    <>
      {units.length > 1 ? (
        <div className="rdz-poloska" role="group" aria-label="Задачи пункта">
          {units.map((x, j) => {
            const s = answers.get(x.id)?.state ?? 'open';
            return (
              <button
                key={x.id}
                type="button"
                className={clsx('rdz-nomer', `is-${s}`, j === i && 'is-current')}
                aria-current={j === i ? 'step' : undefined}
                aria-label={`Задача ${j + 1} из ${units.length}`}
                onClick={() => setI(j)}
              >
                {j + 1}
              </button>
            );
          })}
        </div>
      ) : null}
      <Zadacha
        key={u.id}
        full={full}
        u={u}
        nomer={i + 1}
        vsego={units.length}
        answer={answers.get(u.id)}
        readOnly={readOnly}
        onZapis={onZapis}
        onError={onError}
        reload={reload}
        isOpornaya={part.source === 'opornye'}
        onNext={() => {
          if (i < units.length - 1) setI(i + 1);
          else onDalshe?.();
        }}
        last={i === units.length - 1 && onDalshe === null}
        noHints={hw.noHints}
      />
    </>
  );
}

function Zadacha({
  full,
  u,
  nomer,
  vsego,
  answer,
  readOnly,
  onZapis,
  onError,
  reload,
  onNext,
  last,
  noHints,
  isOpornaya,
}: {
  full: HwFull;
  u: HwTaskView;
  nomer: number;
  vsego: number;
  answer: HwAnswerView | undefined;
  readOnly: boolean;
  onZapis: Zapis;
  onError: (e: string | null) => void;
  reload: () => Promise<void>;
  onNext: () => void;
  last: boolean;
  noHints: boolean;
  isOpornaya: boolean;
}) {
  const hw = full.hw;
  const state = answer?.state ?? 'open';
  const lastEntry = answer?.entries[answer.entries.length - 1];
  const [value, setValue] = useState(() => (state === 'open' ? readDraft(u.id) : (lastEntry?.a ?? '')));
  const [hint, setHint] = useState<string | null>(null);
  const [wrongNow, setWrongNow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [voprosOtkryto, setVoprosOtkryto] = useState(1);
  const [mimo, setMimo] = useState<number[]>([]);
  const [solution, setSolution] = useState<RazborDz | null>(null);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [revealAsk, setRevealAsk] = useState(false);
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const canAnswer = !readOnly && state === 'open';
  const left = hw.attemptsLimit === null ? null : Math.max(0, hw.attemptsLimit - (answer?.attempts ?? 0));

  /* Решение: закрыта задача, сдано, срок прошёл — если база его отдаёт. */
  useEffect(() => {
    if (solution !== null || (state === 'open' && !readOnly)) return;
    let alive = true;
    void dzApi()
      .then((api) => api.loadSolution(u.id))
      .then((s) => {
        if (alive && s !== null) setSolution(s.razbor);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [u.id, state, readOnly, solution]);

  async function check() {
    if (!canAnswer || busy) return;
    onError(null);
    setHint(null);
    const n = normalizeAnswer(value);
    if (u.answerKind === 'number' && !n.ok && n.problem !== 'fraction') {
      if (n.problem !== 'empty') setHint(formatHint(n.problem, n.meant));
      return;
    }
    setBusy(true);
    const seconds = (Date.now() - shownAt.current) / 1000;
    shownAt.current = Date.now();
    try {
      const r = await (await dzApi()).checkAnswer(u.id, value, seconds);
      if (r.kind === 'format') setHint(formatHint('other', null));
      else if (r.kind === 'fractionRight') setHint(fractionRightHint(r.decimal));
      else if (r.kind === 'closed') await reload();
      else {
        const ok = r.kind === 'right';
        onZapis(u.id, {
          state: r.state,
          attempts: r.attempts,
          entry: { a: value, n: n.ok ? n.value : null, ok, at: new Date().toISOString() },
        });
        setWrongNow(!ok);
        if (r.solution !== null) setSolution(r.solution);
        if (ok) writeDraft(u.id, '');
      }
    } catch (e) {
      onError(dzError(errorCode(e)));
    } finally {
      setBusy(false);
    }
  }

  async function reveal() {
    setRevealAsk(false);
    try {
      const r = await (await dzApi()).revealSolution(u.id);
      onZapis(u.id, { state: 'revealed' });
      setSolution(r);
      setSolutionOpen(true);
    } catch (e) {
      onError(dzError(errorCode(e)));
    }
  }

  const sost: SostoyanieZadachi =
    state === 'right' ? 'verno' : state === 'revealed' ? 'razbor' : state === 'wrong' || wrongNow ? 'neverno' : 'vvod';
  const v = u.view;
  const podskazka =
    noHints || readOnly
      ? null
      : v.voprosy !== undefined && v.voprosy.length > 0
        ? {
            html: '',
            telo: (
              <PodskazkaVoprosy
                voprosy={v.voprosy.map((q) => ({
                  ...q,
                  voprosHtml: sanitizeHtml(q.voprosHtml),
                  variantyHtml: q.variantyHtml.map(sanitizeHtml),
                  ...(q.kommentariyHtml === undefined ? {} : { kommentariyHtml: sanitizeHtml(q.kommentariyHtml) }),
                }))}
                otkryto={voprosOtkryto}
                mimo={mimo}
                onVerno={() => {
                  setVoprosOtkryto((n) => n + 1);
                  setMimo([]);
                }}
                onMimo={(variant) => setMimo((m) => [...m, variant])}
                labels={TRENAZHER7.ekran.voprosy}
              />
            ),
            open: hintOpen,
            onOpen: () => setHintOpen(true),
          }
        : v.podskazka !== undefined
          ? { html: sanitizeHtml(v.podskazka), open: hintOpen, onOpen: () => setHintOpen(true) }
          : null;
  const shagi = solution === null ? null : shagiDz(solution);

  return (
    <div className="rdz-zadacha" data-task={u.id} data-state={state}>
      {hw.showMemo && v.zapomni !== undefined ? (
        <aside className="op-zapomni stk-glass rdz-zapomni" data-block="memo">
          <b>{DZK.uchenik.zapomni}:</b> <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(v.zapomni) }} />
        </aside>
      ) : null}
      {hw.showExample && v.primer !== undefined ? (
        <details className="rdz-primer stk-glass" data-block="example">
          <summary className="stk-summary">
            {DZK.uchenik.primer}
            <span className="stk-shevron" aria-hidden="true" />
          </summary>
          <div className={clsx('trn-uslovie', v.tekst === true && 'trn-uslovie--tekst')} dangerouslySetInnerHTML={{ __html: sanitizeHtml(v.primer.uslovieHtml) }} />
          <ShagiPrimera razbor={v.primer.razbor} />
        </details>
      ) : null}
      <EkranZadachi
        taskId={u.id}
        nomer={nomer}
        vsego={vsego}
        tipHtml={sanitizeHtml(v.tipHtml ?? (isOpornaya ? ISTOCHNIK.opornye : ISTOCHNIK.trenazher))}
        uslovieHtml={sanitizeHtml(u.questionHtml)}
        tekst={v.tekst === true}
        value={value}
        onValue={(next) => {
          if (!canAnswer) return;
          setValue(next);
          writeDraft(u.id, next);
          setHint(null);
          setWrongNow(false);
        }}
        sostoyanie={sost}
        onCheck={() => void check()}
        formatHint={hint}
        podskazka={podskazka}
        reshenie={
          shagi === null || shagi.length === 0
            ? null
            : {
                shagi,
                ...(solution?.posle === undefined ? {} : { posle: <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(solution.posle) }} /> }),
                open: solutionOpen,
                onToggle: () => setSolutionOpen((o) => !o),
              }
        }
        onNext={onNext}
        last={last}
        bezPodskazok={noHints}
        pod={
          <>
            {u.answerKind === 'choice' && v.varianty !== undefined ? (
              <div className="rdz-vybor" role="group" aria-label={DZK.uchenik.vybor}>
                {v.varianty.map((c) => (
                  <button
                    key={c.number}
                    type="button"
                    className={clsx('stk-btn', value === c.number && 'stk-btn--primary')}
                    disabled={!canAnswer}
                    aria-pressed={value === c.number}
                    onClick={() => {
                      setValue(c.number);
                      writeDraft(u.id, c.number);
                      setWrongNow(false);
                    }}
                  >
                    {c.number} — {c.label}
                  </button>
                ))}
              </div>
            ) : null}
            {u.comment === null ? null : (
              <p className="rdz-note">
                <b>{DZ.solve.taskNote}:</b> {u.comment}
              </p>
            )}
          </>
        }
        labels={{
          ...DZK.ekran,
          nevernoLead: state === 'wrong' ? DZK.ekran.nevernoKonec : DZK.ekran.nevernoLead,
        }}
      />
      <div className="rdz-pod-zadachey">
        {canAnswer ? <p className="rdz-muted" data-left={left ?? 'inf'}>{left === null ? DZ.solve.unlimited : DZK.uchenik.popytki(left)}</p> : null}
        {canAnswer && hw.solutionsWhen === 'instant' ? (
          <button type="button" className="stk-btn stk-btn--tihaya" onClick={() => setRevealAsk(true)}>
            <Ikonka name="lampa" /> {DZK.uchenik.pokazatReshenie}
          </button>
        ) : null}
        {state !== 'open' && solution === null && hw.solutionsWhen !== 'instant' && !readOnly ? (
          <p className="rdz-muted">
            {hw.solutionsWhen === 'after_due' ? DZK.uchenik.reshenieOtkroetsyaSrok : DZK.uchenik.reshenieOtkroetsya}
          </p>
        ) : null}
      </div>
      <Confirm
        open={revealAsk}
        title={DZ.solve.reveal}
        text={DZ.solve.revealConfirm}
        action={DZ.solve.reveal}
        onCancel={() => setRevealAsk(false)}
        onConfirm={() => void reveal()}
      />
    </div>
  );
}

function ShagiPrimera({ razbor }: { razbor: RazborDz }) {
  return (
    <ol className="rdz-primer__shagi">
      {shagiDz(razbor).map((s, i) => (
        <li key={i}>
          {s.zagolovokHtml === undefined ? null : <b dangerouslySetInnerHTML={{ __html: s.zagolovokHtml }} />}
          <div dangerouslySetInnerHTML={{ __html: s.chtoHtml }} />
          {s.formulaHtml === '' ? null : <div dangerouslySetInnerHTML={{ __html: s.formulaHtml }} />}
        </li>
      ))}
    </ol>
  );
}

/* ── Набор карточек ───────────────────────────────────────────── */

function kartochkaIzDz(u: HwTaskView): KartochkaGotovaya {
  const k = u.view.kartochka;
  return {
    id: u.id,
    topic: '',
    type: k?.tip ?? 'formula',
    level: k?.level ?? '',
    front: sanitizeHtml(u.questionHtml),
    back: sanitizeHtml(k?.back ?? ''),
    ...(k?.pochemu === undefined ? {} : { pochemu: sanitizeHtml(k.pochemu) }),
    figury: (k?.figury ?? []).map(sanitizeHtml),
    ...(k?.figuryOborota === undefined ? {} : { figuryOborota: k.figuryOborota.map(sanitizeHtml) }),
    figuraNaLitse: k?.figuraNaLitse ?? false,
    ...(k?.teoriya === undefined ? {} : { teoriya: k.teoriya }),
  };
}

function NaborKartochek({
  part,
  units,
  stateOf,
  answers,
  readOnly,
  onZapis,
  onError,
  onDalshe,
}: {
  part: HwPartView;
  units: HwTaskView[];
  stateOf: (id: string) => HwState;
  answers: Map<string, HwAnswerView>;
  readOnly: boolean;
  onZapis: Zapis;
  onError: (e: string | null) => void;
  onDalshe: (() => void) | null;
}) {
  const [i, setI] = useState(() => {
    const open = units.findIndex((u) => stateOf(u.id) === 'open');
    return open === -1 ? units.length : open;
  });
  const [oborot, setOborot] = useState<Map<string, { back: string; pochemu?: string }>>(new Map());
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);
  const projdeno = units.filter((u) => stateOf(u.id) !== 'open').length;
  const u = units[i];

  /* Пройденная карточка с проверкой: оборот — из базы. */
  useEffect(() => {
    if (u === undefined || u.answerKind === 'self' || stateOf(u.id) === 'open' || oborot.has(u.id)) return;
    let alive = true;
    void dzApi()
      .then((api) => api.loadSolution(u.id))
      .then((s) => {
        if (alive && s?.razbor.oborot !== undefined) setOborot((m) => new Map(m).set(u.id, s.razbor.oborot!));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [u, stateOf, oborot]);

  const next = () => {
    shownAt.current = Date.now();
    setI((n) => n + 1);
  };

  if (u === undefined) {
    return (
      <div className="rdz-kartochki-gotovo stk-glass" data-block="kartochki-gotovo">
        <p>
          <Ikonka name="da" /> {DZK.uchenik.kartochki.gotovo} · {DZK.uchenik.kartochki.progress(projdeno, units.length)}
        </p>
        <div className="rdz-knopki">
          <button type="button" className="stk-btn stk-btn--tihaya" onClick={() => setI(0)}>
            {DZK.uchenik.kartochki.eshcheRaz}
          </button>
          {onDalshe === null ? null : (
            <button type="button" className="stk-btn stk-btn--primary" onClick={onDalshe}>
              {DZK.uchenik.dalshe} <Ikonka name="strelka" />
            </button>
          )}
        </div>
      </div>
    );
  }

  const state = stateOf(u.id);
  const a = answers.get(u.id);
  const sekundy = () => (Date.now() - shownAt.current) / 1000;
  const zakryta = state !== 'open';
  const gotovo =
    u.answerKind !== 'self' && zakryta && oborot.has(u.id)
      ? { prav: state === 'right', vvod: a?.entries[a.entries.length - 1]?.a ?? '', oborot: oborot.get(u.id)! }
      : undefined;

  return (
    <div className="rdz-kartochki" data-block="kartochki" data-task={u.id} data-state={state}>
      <p className="rdz-muted">
        <Metka>{ISTOCHNIK.kartochki}</Metka> {DZK.uchenik.kartochki.progress(Math.min(i + 1, units.length), units.length)}
        {u.answerKind === 'self' && zakryta ? ` · ${state === 'known' ? DZK.uchenik.kartochki.znayu : DZK.uchenik.kartochki.povtorit}` : ''}
      </p>
      {u.answerKind !== 'self' && zakryta && gotovo === undefined ? (
        <p className="rdz-muted">…</p>
      ) : (
        <KartochkaFlip
          key={`${u.id}:${gotovo === undefined ? 'n' : 'g'}`}
          k={kartochkaIzDz(u)}
          tema={sanitizeHtml(part.titleHtml)}
          variant={0}
          podpisi={{ znayu: DZK.uchenik.kartochki.znayu, neZnayu: DZK.uchenik.kartochki.povtorit }}
          {...(gotovo === undefined ? {} : { gotovo })}
          {...(u.answerKind === 'self' || readOnly
            ? {}
            : {
                proverka: async (vvod: string) => {
                  onError(null);
                  try {
                    const r = await (await dzApi()).checkAnswer(u.id, vvod, sekundy());
                    if (r.kind === 'format') return { format: formatHint('other', null) };
                    if (r.kind === 'fractionRight') return { format: fractionRightHint(r.decimal) };
                    if (r.kind === 'closed') return null;
                    onZapis(u.id, {
                      state: r.state,
                      attempts: r.attempts,
                      entry: { a: vvod, n: null, ok: r.kind === 'right', at: new Date().toISOString() },
                    });
                    const ob = r.solution?.oborot ?? { back: '' };
                    const chisto = { back: sanitizeHtml(ob.back), ...(ob.pochemu === undefined ? {} : { pochemu: sanitizeHtml(ob.pochemu) }) };
                    setOborot((m) => new Map(m).set(u.id, chisto));
                    return { prav: r.kind === 'right', oborot: chisto };
                  } catch (e) {
                    onError(dzError(errorCode(e)));
                    return null;
                  }
                },
              })}
          onOtvet={(znayu) => {
            if (u.answerKind !== 'self' || readOnly) {
              next();
              return;
            }
            const mark = znayu ? 'known' : 'repeat';
            onZapis(u.id, { state: mark, attempts: (a?.attempts ?? 0) + 1 });
            void dzApi()
              .then((api) => api.markCard(u.id, mark, sekundy()))
              .catch((e) => onError(dzError(errorCode(e))));
            next();
          }}
        />
      )}
      {zakryta ? (
        <div className="rdz-knopki">
          <button type="button" className="stk-btn stk-btn--tihaya" onClick={next}>
            {DZK.uchenik.dalshe}
          </button>
        </div>
      ) : null}
    </div>
  );
}
