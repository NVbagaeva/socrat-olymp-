'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chast2Itog } from '@/components/chast2/Chast2Itog';
import { Button } from '@/components/ui';
import { ballyChast2, pustoyChast2, type Chast2Ui } from '@/lib/chast2/sostoyanie';
import { TrainerSessionHost } from '@/components/tasks/session';
import { POV_HREF, POV_TITLE, POV_VERSION_LABEL } from '@/content/povyshennye';
import { WORK_KINDS } from '@/content/variant';
import { ONLINE_TEXT as T } from '@/content/variantOnline/text';
import { povNomer, versiyaText } from '@/lib/povyshennye/kod';
import { archiveVolatile, saveWork, type ArchivedWork } from '@/lib/variant/online/archive';
import {
  ONLINE_PATHS,
  oshibkiScope,
  reshatHref,
  seriyaHref,
  workScope,
  type WorkLink,
} from '@/lib/variant/online/link';
import { normalizeAnswer, sameAnswer } from '@/lib/variant/online/normalize';
import {
  localProverka,
  scoreWork,
  type Proverka,
  type WorkCheck,
} from '@/lib/variant/online/proverka';
import { encodeResult, type ResultData } from '@/lib/variant/online/resultCode';
import {
  buildWork,
  isWorkPayload,
  packWork,
  readWorkUi,
  unpackWork,
  type WorkPayload,
  type WorkUi,
} from '@/lib/variant/online/sessionUi';
import type { KabinetApi } from '@/lib/kabinet/api';
import { kabinetProverka } from '@/lib/variant/online/kabinetProverka';
import {
  packKabinet,
  rabotaScope,
  unpackKabinet,
  withSolutions,
} from '@/lib/variant/online/kabinetWork';
import type { VariantTask } from '@/lib/variant/types';
import { WorkResult } from './WorkResult';
import { WorkScreen } from './WorkScreen';

export interface WorkRunProps {
  link: WorkLink;
  /** Задания варианта, уже собранные по коду. */
  initial: WorkPayload;
  /** Партия собрана другой версией генератора. */
  outdated: boolean;
  /** Ссылка открыта со страницы серии: в итогах — «К серии». */
  series: boolean;
  /**
   * Работа, выданная через кабинет (этап 2): проверка на сервере, попытка
   * начинается на сервере кнопкой «Начать», черновик контрольной уходит
   * туда же. Нет — вариант по коду, проверка в браузере.
   */
  kabinet?: {
    api: KabinetApi;
    workId: string;
    /** Начать попытку на сервере и получить задания с её номером. */
    start: () => Promise<WorkPayload>;
    /** Страница работы в кабинете. */
    backHref: string;
  };
}

type KabinetProps = NonNullable<WorkRunProps['kabinet']>;

/** Проверка: работа из кабинета — на сервере, вариант по коду — в браузере. */
function proverkaOf(payload: WorkPayload, kabinet: KabinetProps | undefined): Proverka {
  return payload.kabinet !== undefined && kabinet !== undefined
    ? kabinetProverka(kabinet.api, payload.kabinet.attemptId)
    : localProverka(payload.tasks);
}

/** Черновик контрольной — на сервер, не чаще раза в 3 с. */
function useDraftSync(kabinet: KabinetProps | undefined) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef('');
  return useCallback(
    (payload: WorkPayload, ui: WorkUi) => {
      if (kabinet === undefined || payload.kabinet === undefined || payload.mode !== 'kontrol')
        return;
      const draft = { answers: ui.answers, later: ui.later, times: ui.times };
      const json = JSON.stringify(draft);
      if (json === last.current) return;
      last.current = json;
      if (timer.current !== null) clearTimeout(timer.current);
      const attemptId = payload.kabinet.attemptId;
      timer.current = setTimeout(() => {
        void kabinet.api.variantSaveDraft(attemptId, draft).catch(() => undefined);
      }, 3000);
    },
    [kabinet],
  );
}

/** Название работы по типу из шапки: «Домашняя работа», своё. */
export function kindTitle(kind: string, title: string): string {
  if (kind === 'custom') return title.trim() || 'Работа';
  return WORK_KINDS.find((k) => k.id === kind)?.label ?? 'Вариант в формате ЕГЭ';
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Ответы, введённые не по правилам ЕГЭ, не засчитываются. */
function firstAttempts(payload: WorkPayload, ui: WorkUi): string[] {
  return payload.tasks.map((_, i) => {
    const n = normalizeAnswer(ui.answers[i] ?? '');
    return n.ok ? n.value : '';
  });
}

/**
 * Вариант на сайте: оболочка сессии тренажёров (пауза, возврат после
 * закрытия вкладки, защита от двух вкладок), экран решения и итоги.
 *
 * Проверка — через `Proverka` (lib/variant/online/proverka.ts): на этапе
 * 1 в браузере, на этапе 2 — на сервере, экран тот же.
 */
export function WorkRun({ link, initial, outdated, series, kabinet }: WorkRunProps) {
  const syncDraft = useDraftSync(kabinet);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [mode, setMode] = useState<'work' | 'oshibki'>('work');
  const snapshot = useRef<WorkUi | null>(null);
  const emptyRef = useRef('');
  const onSnapshot = useCallback((ui: WorkUi) => {
    snapshot.current = ui;
  }, []);
  const onEmpty = useCallback((list: string) => {
    emptyRef.current = list;
  }, []);
  const [wrongForOshibki, setWrongForOshibki] = useState<number[] | null>(null);

  /* Версия варианта повышенной сложности называется по разделу: «Вариант 7.3». */
  const pv = povNomer(link.code);
  const title =
    pv === null
      ? `${kindTitle(link.kind, link.title)} · ${T.start.variant(link.variant)}`
      : `${POV_TITLE} · ${POV_VERSION_LABEL(versiyaText(pv, link.variant))}`;

  /* Итоги варианта остаются на месте, пока идёт работа над ошибками:
     «К результатам варианта» возвращает к ним, а не к началу. */
  return (
    <>
      {mode === 'oshibki' && wrongForOshibki !== null ? (
        <OshibkiRun
          link={link}
          wrong={wrongForOshibki}
          title={title}
          onBack={() => setMode('work')}
        />
      ) : null}
      <div hidden={mode === 'oshibki'}>
        <TrainerSessionHost<WorkPayload, WorkUi>
          scope={
            kabinet === undefined
              ? workScope(link.code, link.variant, link.mode)
              : rabotaScope(kabinet.workId, link.variant)
          }
          what="вариант"
          isPayload={isWorkPayload}
          count={(p) => p.tasks.length + (p.chast2?.length ?? 0)}
          describe={(p, i) => {
            const z = i >= p.tasks.length ? p.chast2?.[i - p.tasks.length] : undefined;
            return z === undefined
              ? { kind: `№${p.tasks[i]?.egeNumber ?? ''}`, html: p.tasks[i]?.statement ?? '' }
              : { kind: `№${z.no}`, html: '' };
          }}
          pack={kabinet === undefined ? packWork : packKabinet}
          unpack={
            kabinet === undefined ? unpackWork : (packed) => unpackKabinet(kabinet.api, packed)
          }
          labels={{
            solved: link.mode === 'kontrol' ? T.run.status.answered : T.run.status.right,
            progress:
              link.mode === 'kontrol'
                ? (ui) => Object.values(ui.answers).filter((v) => normalizeAnswer(v).ok).length
                : undefined,
            finish: T.run.finish,
            finishLong: T.run.finish,
            finishTitle: T.run.finishTitle,
            finishText: () =>
              emptyRef.current === '' ? T.run.finishAll : T.run.finishEmpty(emptyRef.current),
            finishCancel: T.run.cancel,
            pausable: link.mode === 'trening',
            clock: link.mode === 'trening' && link.timer.kind === 'up',
          }}
          summaryView={(data) => {
            const payload = data.payload as WorkPayload;
            const ui = snapshot.current;
            if (ui === null) return null;
            return (
              <Finished
                payload={payload}
                ui={ui}
                seconds={data.seconds}
                title={title}
                outdated={outdated}
                series={series}
                link={link}
                kabinet={kabinet}
                onOshibki={(wrong) => {
                  setWrongForOshibki(wrong);
                  setMode('oshibki');
                }}
              />
            );
          }}
          configurator={({ start }) => (
            <StartScreen
              link={link}
              title={title}
              count={initial.tasks.length}
              outdated={outdated}
              busy={starting}
              error={startError}
              onStart={() => {
                if (kabinet === undefined) {
                  start({ ...initial });
                  return;
                }
                setStarting(true);
                setStartError(null);
                kabinet
                  .start()
                  .then((payload) => start(payload))
                  .catch((e: unknown) => setStartError(e instanceof Error ? e.message : String(e)))
                  .finally(() => setStarting(false));
              }}
            />
          )}
          screen={(ctx) => (
            <WorkScreen
              payload={ctx.payload}
              restored={ctx.restored === null ? null : readWorkUi(ctx.restored)}
              report={(ui) => {
                ctx.report(ui);
                syncDraft(ctx.payload, ui);
              }}
              elapsed={ctx.elapsed}
              finish={ctx.finish}
              setBeforeFinish={ctx.setBeforeFinish}
              proverka={proverkaOf(ctx.payload, kabinet)}
              onSnapshot={onSnapshot}
              onEmpty={onEmpty}
            />
          )}
        />
      </div>
    </>
  );
}

/* ── Старт ──────────────────────────────────────────────────────── */

function StartScreen({
  link,
  title,
  count,
  outdated,
  busy = false,
  error = null,
  onStart,
}: {
  link: WorkLink;
  title: string;
  count: number;
  outdated: boolean;
  busy?: boolean;
  error?: string | null;
  onStart: () => void;
}) {
  const timer =
    link.timer.kind === 'none'
      ? T.start.timer.none
      : link.timer.kind === 'up'
        ? T.start.timer.up
        : T.start.timer.down(link.timer.minutes);
  return (
    <section className="vo-start" data-testid="vo-start">
      <h2 className="vo-start__title">{title}</h2>
      <p className="vo-start__meta">
        {T.start.tasks(count)} · <b>{T.start.mode[link.mode]}</b> · {timer}
      </p>
      {outdated ? <p className="vo-warn">{T.start.outdated}</p> : null}
      <ul className="vo-start__rules">
        {T.start.rules[link.mode].map((r) => (
          <li key={r}>{r}</li>
        ))}
        {link.mode === 'kontrol' && link.timer.kind !== 'none' ? (
          <li>{T.start.timer.wallNote}</li>
        ) : null}
        <li>{T.start.answerFormat}</li>
      </ul>
      {error === null ? null : (
        <p className="vo-warn" role="alert">
          {error}
        </p>
      )}
      <Button size="lg" onClick={onStart} loading={busy} data-testid="vo-begin">
        {T.start.begin}
      </Button>
    </section>
  );
}

/* ── Итоги ──────────────────────────────────────────────────────── */

function Finished({
  payload,
  ui,
  seconds,
  title,
  outdated,
  series,
  link,
  kabinet,
  onOshibki,
}: {
  payload: WorkPayload;
  ui: WorkUi;
  seconds: number;
  title: string;
  outdated: boolean;
  series: boolean;
  link: WorkLink;
  kabinet: KabinetProps | undefined;
  onOshibki: (wrong: number[]) => void;
}) {
  const proverka: Proverka = useMemo(() => proverkaOf(payload, kabinet), [payload, kabinet]);
  /* Работа из кабинета: разборы — после завершения, по тому же коду партии. */
  const [shown, setShown] = useState<VariantTask[]>(payload.tasks);
  const [check, setCheck] = useState<WorkCheck | null>(null);
  const [volatile, setVolatile] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  /* Часть 2: самопроверка продолжается на экране итогов. */
  const [c2st, setC2st] = useState<Chast2Ui>(() => ui.c2 ?? pustoyChast2());
  const c2nos = useMemo(() => (payload.chast2 ?? []).map((z) => z.no), [payload]);
  const c2bally = useMemo(
    () => (payload.chast2 === undefined ? null : ballyChast2(c2nos, c2st.ball)),
    [payload, c2nos, c2st],
  );
  const zapis = useRef<ArchivedWork | null>(null);
  const answers = useMemo(() => firstAttempts(payload, ui), [payload, ui]);
  const result: ResultData = useMemo(
    () => ({
      code: payload.code,
      variant: payload.variant,
      mode: payload.mode,
      timer: payload.timer,
      date: todayIso(),
      seconds,
      tasks: payload.tasks.map((_, i) => ({
        answer: answers[i] ?? '',
        seconds: Math.round((ui.times[i] ?? 0) / 1000),
        hinted: ui.hinted.includes(i),
        fixed: ui.v1[i] === 'wrong' && ui.v2[i] === 'right',
      })),
    }),
    [payload, ui, answers, seconds],
  );
  const code = useMemo(() => encodeResult(result), [result]);
  const saved = useRef(false);
  /* Завершение отправляется один раз, даже если эффект перезапустится:
     сервер второй раз ответил бы «работа уже завершена». */
  const finishing = useRef<Promise<WorkCheck> | null>(null);

  useEffect(() => {
    let alive = true;
    const extra = {
      seconds: result.tasks.map((t) => t.seconds),
      hinted: ui.hinted,
    };
    finishing.current ??= proverka.finish(answers, extra);
    void finishing.current.then(
      (c) => {
        if (!alive) return;
        setCheck(c);
        if (payload.kabinet !== undefined) {
          void withSolutions(payload.tasks, payload.code, payload.variant).then((t) => {
            if (alive) setShown(t);
          });
        }
        if (saved.current) return;
        saved.current = true;
        const numbers = payload.tasks.map((t) => t.egeNumber);
        const score = scoreWork(numbers, c.right);
        const finishedAt = Date.now();
        const rec: ArchivedWork = {
          id: `${payload.code}|${payload.variant}|${payload.mode}|${finishedAt}`,
          code: payload.code,
          variant: payload.variant,
          mode: payload.mode,
          title,
          finishedAt,
          resultCode: code,
          primary: score.primary,
          max: score.max,
          test: score.test,
          seconds,
          tasks: payload.tasks.map((t, i) => ({
            egeNumber: t.egeNumber,
            right: c.right[i] === true,
            empty: (answers[i] ?? '') === '',
            seconds: result.tasks[i]?.seconds ?? 0,
          })),
        };
        zapis.current = rec;
        void saveWork(rec).then(() => {
          if (alive) setVolatile(archiveVolatile());
        });
      },
      (e: unknown) => {
        if (alive) setFailed(e instanceof Error ? e.message : String(e));
      },
    );
    return () => {
      alive = false;
    };
  }, [proverka, answers, payload, title, code, seconds, result, ui.hinted]);

  /* Оценки части 2 — в ту же запись архива: карточка версии покажет
     «Часть 2: 14/20» или «на проверке». */
  useEffect(() => {
    const rec = zapis.current;
    if (rec === null || c2bally === null) return;
    const next: ArchivedWork = { ...rec, chast2: { ...c2bally, ui: c2st } };
    zapis.current = next;
    void saveWork(next);
  }, [c2bally, c2st, check]);

  if (failed !== null) {
    return (
      <p className="vo-warn" role="alert">
        {failed}
      </p>
    );
  }
  if (check === null) return <p className="vo-status">{T.start.loading}</p>;
  const wrong = payload.tasks.map((_, i) => i).filter((i) => check.right[i] !== true);
  const again = kabinet?.backHref ?? reshatHref({ ...link });

  return (
    <WorkResult
      tasks={shown}
      data={result}
      rights={check.right}
      correct={check.answers}
      title={title}
      resultCode={code}
      outdated={outdated}
      notice={volatile ? T.result.volatile : null}
      {...(c2bally === null || payload.chast2 === undefined
        ? {}
        : {
            chast2: c2bally,
            posleTablicy: <Chast2Itog zadachi={payload.chast2} st={c2st} update={setC2st} />,
          })}
      actions={
        <>
          {wrong.length > 0 ? (
            <Button onClick={() => onOshibki(wrong)} data-testid="vo-oshibki">
              {T.result.oshibki}
            </Button>
          ) : (
            <p className="vo-note">{T.result.noMistakes}</p>
          )}
          {series ? (
            <Button
              variant="secondary"
              onClick={() => window.location.assign(seriyaHref(link.code, link))}
            >
              {T.result.series}
            </Button>
          ) : null}
          {povNomer(link.code) === null ? null : (
            <Button variant="secondary" onClick={() => window.location.assign(POV_HREF)}>
              {T.result.povyshennye}
            </Button>
          )}
          <Button variant="ghost" onClick={() => window.location.assign(again)}>
            {T.result.again}
          </Button>
          <a className="vo-link" href={ONLINE_PATHS.statistika}>
            {T.result.stats}
          </a>
        </>
      }
    />
  );
}

/* ── Работа над ошибками ────────────────────────────────────────── */

function OshibkiRun({
  link,
  wrong,
  title,
  onBack,
}: {
  link: WorkLink;
  wrong: number[];
  title: string;
  onBack: () => void;
}) {
  const [payload, setPayload] = useState<WorkPayload | null>(null);
  const [failed, setFailed] = useState(false);
  const snapshot = useRef<WorkUi | null>(null);
  const emptyRef = useRef('');

  useEffect(() => {
    let alive = true;
    void buildWork(
      {
        code: link.code,
        variant: link.variant,
        mode: 'trening',
        timer: { kind: 'none' },
        kind: link.kind,
        title: link.title,
      },
      wrong,
    ).then((p) => {
      if (!alive) return;
      if (p === null) setFailed(true);
      else setPayload(p);
    });
    return () => {
      alive = false;
    };
  }, [link, wrong]);

  if (failed) return <p className="vo-warn">{T.start.bad}</p>;
  if (payload === null) return <p className="vo-status">{T.start.loading}</p>;

  return (
    <TrainerSessionHost<WorkPayload, WorkUi>
      scope={oshibkiScope(link.code, link.variant)}
      what="работа над ошибками"
      isPayload={isWorkPayload}
      count={(p) => p.tasks.length}
      describe={(p, i) => ({
        kind: `№${p.tasks[i]?.egeNumber ?? ''}`,
        html: p.tasks[i]?.statement ?? '',
      })}
      pack={packWork}
      unpack={unpackWork}
      labels={{
        solved: T.run.status.right,
        finish: T.run.finish,
        finishLong: T.run.finish,
        finishTitle: T.run.finishTitle,
        finishText: () =>
          emptyRef.current === '' ? T.run.finishAll : T.run.finishEmpty(emptyRef.current),
        finishCancel: T.run.cancel,
        clock: false,
      }}
      summaryView={(data) => {
        const p = data.payload as WorkPayload;
        const ui = snapshot.current;
        if (ui === null) return null;
        const answers = firstAttempts(p, ui);
        const rights = p.tasks.map(
          (t, i) =>
            ui.v1[i] === 'right' ||
            (ui.v1[i] === undefined && sameAnswer(answers[i] ?? '', t.answer)),
        );
        return (
          <WorkResult
            tasks={p.tasks}
            data={{
              code: p.code,
              variant: p.variant,
              mode: 'trening',
              timer: { kind: 'none' },
              date: todayIso(),
              seconds: data.seconds,
              tasks: p.tasks.map((_, i) => ({
                answer: answers[i] ?? '',
                seconds: Math.round((ui.times[i] ?? 0) / 1000),
                hinted: ui.hinted.includes(i),
                fixed: ui.v1[i] === 'wrong' && ui.v2[i] === 'right',
              })),
            }}
            rights={rights}
            correct={p.tasks.map((t) => t.answer)}
            title={`${T.oshibki.title} · ${title}`}
            resultCode={null}
            noScore
            notice={T.oshibki.summary(rights.filter(Boolean).length, rights.length)}
            actions={
              <Button variant="secondary" onClick={onBack}>
                {T.oshibki.back}
              </Button>
            }
          />
        );
      }}
      configurator={({ start }) => (
        <section className="vo-start">
          <h2 className="vo-start__title">{T.oshibki.title}</h2>
          <p className="vo-note">{T.result.oshibkiLead}</p>
          <Button size="lg" onClick={() => start(payload)} data-testid="vo-begin">
            {T.start.begin}
          </Button>
          <Button variant="ghost" onClick={onBack}>
            {T.oshibki.back}
          </Button>
        </section>
      )}
      screen={(ctx) => (
        <WorkScreen
          payload={ctx.payload}
          restored={ctx.restored === null ? null : readWorkUi(ctx.restored)}
          report={ctx.report}
          elapsed={ctx.elapsed}
          finish={ctx.finish}
          setBeforeFinish={ctx.setBeforeFinish}
          proverka={localProverka(ctx.payload.tasks)}
          onSnapshot={(ui) => {
            snapshot.current = ui;
          }}
          onEmpty={(list) => {
            emptyRef.current = list;
          }}
        />
      )}
    />
  );
}
