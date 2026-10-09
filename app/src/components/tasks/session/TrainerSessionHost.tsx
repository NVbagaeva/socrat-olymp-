'use client';

import { Component, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button, Modal } from '@/components/ui';
import { ErrorFallback } from '@/components/ErrorFallback';
import { isBaseUi, normalizeBase } from '@/lib/trainerSession/restore';
import {
  TAB_ID,
  clearSession,
  encodeSession,
  newSessionId,
  notifySessionsChanged,
  peekHead,
  readSession,
  sessionKey,
  storageAvailable,
  writeRaw,
} from '@/lib/trainerSession/store';
import { TRAINER_SCHEMA_VERSION, type BaseUi } from '@/lib/trainerSession/types';
import { SessionBar } from './SessionBar';
import { TrainerSummary, type SummaryData, type SummaryItem } from './TrainerSummary';
import { sessionText } from './text';
import './session.css';

/**
 * Что экран задания получает от оболочки сессии.
 *
 * Экран сам хранит своё состояние, как и раньше. Оболочка нужна ему
 * ровно для двух вещей: взять сохранённое состояние при входе и
 * сообщать о новом при каждом действии.
 */
export interface ScreenContext<P, U extends BaseUi> {
  /** Задания тренировки в том виде, в каком их собрал тренажёр. */
  payload: P;
  /** Идентификатор тренировки: годится как ключ подхода (trainerRound). */
  sessionId: string;
  /** Состояние экрана из хранилища. null — тренировка только началась. */
  restored: U | null;
  /** Сообщить о состоянии экрана. Звать при каждом его изменении. */
  report: (ui: U) => void;
  /** Сколько мс активного времени прошло с начала тренировки. */
  elapsed: () => number;
  /** Ученик решил последнее задание и жмёт «Смотреть результат». */
  finish: () => void;
}

/** Как тренажёр описывает задание на экране итогов. */
export interface DescribedTask {
  /** Название типа задания: по нему строится статистика по типам. */
  kind: string;
  /** Условие, уже набранное KaTeX. */
  html: string;
  /** Разбор по нажатию «Показать разбор». Нет — кнопки нет. */
  review?: () => ReactNode;
}

export interface ConfiguratorApi<P> {
  /**
   * Начать тренировку. Если в этом тренажёре уже есть незавершённая,
   * оболочка сама спросит, что с ней делать.
   */
  start: (payload: P) => void;
}

export interface TrainerSessionHostProps<P, U extends BaseUi> {
  /**
   * Раздел тренажёра: «8», «12:linear». Часть ключа в localStorage и
   * то, по чему вкладка «Тренажёр» узнаёт о незавершённой тренировке.
   */
  scope: string;
  /** Проверка формата заданий из хранилища. Не прошла — тренировка сбрасывается. */
  isPayload: (value: unknown) => value is P;
  /** Сколько заданий в тренировке. */
  count: (payload: P) => number;
  /** Описание задания пула для экрана итогов. */
  describe: (payload: P, poolIndex: number) => DescribedTask;
  /**
   * Тренировка из части заданий пула — для «Прорешать ошибки». Не
   * задана — кнопки нет.
   */
  subset?: (payload: P, poolIndexes: number[]) => P;
  /** Куда ведёт ссылка с экрана итогов. */
  backHref?: string;
  /** Экран выбора тренировки. */
  configurator: (api: ConfiguratorApi<P>) => ReactNode;
  /** Экран заданий. */
  screen: (context: ScreenContext<P, U>) => ReactNode;
  /** Что внутри, для сообщения об ошибке. */
  what?: string;
}

/** Идущая тренировка. */
interface Run<P> {
  id: string;
  payload: P;
  payloadJson: string;
  createdAt: number;
  /** Состояние экрана при входе. null — новая тренировка. */
  restored: BaseUi | null;
  /** Растёт, когда экран нужно собрать заново (вкладка забрала тренировку). */
  epoch: number;
}

type View<P> =
  | { kind: 'config' }
  | { kind: 'run'; run: Run<P> }
  | { kind: 'summary'; data: SummaryData };

/** Почему эта вкладка больше не пишет в тренировку. */
type Blocked = 'taken' | 'replaced' | 'gone';

/** Что показать над выбором тренировки. */
type Notice = 'version' | 'broken' | 'restore';

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/* Ловит ошибку отрисовки экрана. Для восстановленной тренировки это
   значит «сохранённое не подошло»: оболочка сбросит её и предложит новую. */
class RunBoundary extends Component<
  { children: ReactNode; onError: (error: unknown) => void; fallback: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Экран тренажёра не отрисовался', error, info.componentStack);
    this.props.onError(error);
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Оболочка тренажёра: выбор тренировки → задания → итоги, а между ними
 * то, что общее для всех тренажёров сайта.
 *
 * — Сохранение. Задания и состояние экрана пишутся в localStorage при
 *   каждом действии. Ушёл в другой раздел, перезагрузил страницу — при
 *   входе возвращается та же тренировка на том же задании.
 * — Управление. Пауза, продолжить, завершить; таймер считает только
 *   активное время.
 * — Несколько вкладок. Тренировка живёт в одной: вкладка, которую
 *   «обогнала» другая, перестаёт писать и предлагает забрать тренировку.
 * — Без хранилища (приватный режим) тренажёр работает как раньше,
 *   только прогресс не сохраняется — об этом сказано в панели.
 *
 * Сами задания, проверку ответов и подсказки оболочка не трогает: она
 * хранит то, что ей отдал тренажёр, и возвращает это обратно.
 */
export function TrainerSessionHost<P, U extends BaseUi>({
  scope,
  isPayload,
  count,
  describe,
  subset,
  backHref,
  configurator,
  screen,
  what = 'тренажёр',
}: TrainerSessionHostProps<P, U>) {
  const [view, setView] = useState<View<P>>({ kind: 'config' });
  const [paused, setPaused] = useState(false);
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const [available, setAvailable] = useState(true);
  const [saveFailed, setSaveFailed] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  /* Новая тренировка при незавершённой: ждёт ответа ученика. */
  const [pending, setPending] = useState<{ payload: P; solved: number; total: number } | null>(null);
  /* Прогресс для панели: перерисовывается только панель, не экран. */
  const [bar, setBar] = useState({ index: 0, total: 0, solved: 0 });

  /* Изменяемое состояние тренировки живёт в ref: запись в хранилище и
     часы не должны зависеть от перерисовок. */
  const viewRef = useRef(view);
  viewRef.current = view;
  const uiRef = useRef<BaseUi | null>(null);
  const revRef = useRef(0);
  const pausedRef = useRef(false);
  const blockedRef = useRef<Blocked | null>(null);
  const availableRef = useRef(true);
  const failedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clockRef = useRef<{ base: number; since: number | null }>({ base: 0, since: null });
  const epochRef = useRef(0);

  /* ── Часы: идут, пока тренировка не на паузе, вкладка видна и
     никто её не обогнал ───────────────────────────────────────── */

  const elapsed = useCallback((): number => {
    const clock = clockRef.current;
    return clock.base + (clock.since === null ? 0 : Date.now() - clock.since);
  }, []);

  const stopClock = useCallback(() => {
    const clock = clockRef.current;
    clock.base = elapsed();
    clock.since = null;
  }, [elapsed]);

  const canRun = useCallback(
    () =>
      viewRef.current.kind === 'run' &&
      !pausedRef.current &&
      blockedRef.current === null &&
      document.visibilityState === 'visible',
    [],
  );

  const startClock = useCallback(() => {
    const clock = clockRef.current;
    if (clock.since === null && canRun()) {
      clock.since = Date.now();
    }
  }, [canRun]);

  /* ── Запись в хранилище ─────────────────────────────────────── */

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const current = viewRef.current;
    if (current.kind !== 'run' || blockedRef.current !== null || !availableRef.current) {
      return;
    }
    const { run } = current;
    revRef.current += 1;
    const raw = encodeSession(
      {
        scope,
        id: run.id,
        createdAt: run.createdAt,
        updatedAt: Date.now(),
        rev: revRef.current,
        writer: TAB_ID,
        paused: pausedRef.current,
        activeMs: elapsed(),
      },
      JSON.stringify(uiRef.current),
      run.payloadJson,
    );
    const ok = writeRaw(scope, raw);
    if (failedRef.current === ok) {
      failedRef.current = !ok;
      setSaveFailed(!ok);
    }
  }, [scope, elapsed]);

  /* Несколько сообщений экрана в одном такте — одна запись. */
  const scheduleFlush = useCallback(() => {
    if (timerRef.current === null) {
      timerRef.current = setTimeout(flush, 0);
    }
  }, [flush]);

  /* ── Начало, возврат и конец тренировки ─────────────────────── */

  const enter = useCallback(
    (run: Run<P>, activeMs: number, wasPaused: boolean, rev: number) => {
      uiRef.current = run.restored;
      revRef.current = rev;
      pausedRef.current = wasPaused;
      blockedRef.current = null;
      clockRef.current = { base: activeMs, since: null };
      setPaused(wasPaused);
      setBlocked(null);
      setConfirmFinish(false);
      setPending(null);
      /* Каждый вход собирает экран заново: ключ с номером входа не
         повторяется, даже если вкладка забирает ту же тренировку. */
      epochRef.current += 1;
      const entered = { ...run, epoch: epochRef.current };
      viewRef.current = { kind: 'run', run: entered };
      setView({ kind: 'run', run: entered });
      const total = run.restored?.order?.length ?? count(run.payload);
      setBar({
        index: run.restored?.index ?? 0,
        total,
        solved: run.restored === null ? 0 : Object.keys(run.restored.marks).length,
      });
      startClock();
    },
    [count, startClock],
  );

  const begin = useCallback(
    (payload: P) => {
      let payloadJson: string;
      try {
        payloadJson = JSON.stringify(payload);
      } catch {
        payloadJson = 'null';
        availableRef.current = false;
        setAvailable(false);
      }
      const run: Run<P> = {
        id: newSessionId(),
        payload,
        payloadJson,
        createdAt: Date.now(),
        restored: null,
        epoch: 0,
      };
      enter(run, 0, false, 0);
      /* Запись появляется сразу, до первого действия: метка в меню
         загорается, а возврат на экран заданий возможен с первой секунды. */
      flush();
      notifySessionsChanged();
    },
    [enter, flush],
  );

  /** Разобрать запись из хранилища. null — запись не подошла этому тренажёру. */
  const restoreFrom = useCallback(
    (stored: { id: string; createdAt: number; payload: unknown; ui: unknown }): Run<P> | null => {
      if (!isPayload(stored.payload)) {
        return null;
      }
      const payload = stored.payload;
      if (stored.ui !== null && !isBaseUi(stored.ui)) {
        return null;
      }
      return {
        id: stored.id,
        payload,
        payloadJson: JSON.stringify(payload),
        createdAt: stored.createdAt,
        restored: stored.ui === null ? null : normalizeBase(stored.ui, count(payload)),
        epoch: 0,
      };
    },
    [isPayload, count],
  );

  /** Вернуться в сохранённую тренировку. false — возвращаться не во что. */
  const resume = useCallback((): boolean => {
    const read = readSession(scope);
    if (read.status === 'reset') {
      setNotice(read.reason);
      notifySessionsChanged();
      return false;
    }
    if (read.status === 'none') {
      return false;
    }
    const run = restoreFrom(read.session);
    if (run === null) {
      clearSession(scope);
      setNotice('restore');
      return false;
    }
    enter(run, read.session.activeMs, read.session.paused, read.session.rev);
    return true;
  }, [scope, restoreFrom, enter]);

  /* Вход в тренажёр: если есть незавершённая тренировка — сразу в неё.
     Эффект до отрисовки: ученик не видит мелькнувший выбор тренировки. */
  useBrowserLayoutEffect(() => {
    const ok = storageAvailable();
    availableRef.current = ok;
    setAvailable(ok);
    if (ok) {
      resume();
    }
    // Один раз при входе: дальше состоянием управляет сама оболочка.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Итоги по последнему состоянию экрана. */
  const summarize = useCallback(
    (run: Run<P>): SummaryData => {
      const ui = uiRef.current;
      const pool = count(run.payload);
      const order = ui === null ? null : normalizeBase(ui, pool).order;
      const total = order === null ? pool : order.length;
      const items: SummaryItem[] = [];
      for (let position = 0; position < total; position += 1) {
        const poolIndex = order === null ? position : (order[position] ?? position);
        const mark = ui?.marks[position];
        let described: DescribedTask;
        try {
          described = describe(run.payload, poolIndex);
        } catch {
          described = { kind: sessionText.unknownKind, html: '' };
        }
        items.push({
          poolIndex,
          kind: described.kind,
          html: described.html,
          review: described.review,
          mark: mark ?? (ui?.tried[position] === true ? 'wrong' : 'skipped'),
        });
      }
      return { items, seconds: Math.round(elapsed() / 1000), payload: run.payload };
    },
    [count, describe, elapsed],
  );

  const finish = useCallback(() => {
    const current = viewRef.current;
    if (current.kind !== 'run') {
      return;
    }
    stopClock();
    const data = summarize(current.run);
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    /* Закончена — значит удалена: возвращаться в неё больше незачем. */
    if (blockedRef.current === null) {
      clearSession(scope);
    }
    blockedRef.current = null;
    setBlocked(null);
    setConfirmFinish(false);
    viewRef.current = { kind: 'summary', data };
    setView({ kind: 'summary', data });
  }, [scope, stopClock, summarize]);

  /* ── Пауза ──────────────────────────────────────────────────── */

  const pause = useCallback(() => {
    stopClock();
    pausedRef.current = true;
    setPaused(true);
    flush();
  }, [stopClock, flush]);

  const unpause = useCallback(() => {
    pausedRef.current = false;
    setPaused(false);
    startClock();
    flush();
  }, [startClock, flush]);

  /* ── Экран сообщает о себе ──────────────────────────────────── */

  const report = useCallback(
    (ui: U) => {
      uiRef.current = ui;
      const current = viewRef.current;
      if (current.kind !== 'run') {
        return;
      }
      const total = ui.order?.length ?? count(current.run.payload);
      const solved = Object.keys(ui.marks).length;
      setBar((prev) =>
        prev.index === ui.index && prev.total === total && prev.solved === solved
          ? prev
          : { index: ui.index, total, solved },
      );
      scheduleFlush();
    },
    [count, scheduleFlush],
  );

  /* ── Видимость вкладки и закрытие страницы ──────────────────── */

  const running = view.kind === 'run';
  useEffect(() => {
    if (!running) {
      return;
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopClock();
        flush();
      } else {
        startClock();
      }
    };
    const onHide = () => {
      stopClock();
      flush();
    };
    const onShow = () => startClock();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('pageshow', onShow);
    /* Раз в несколько секунд записывается и время: если вкладку убьют
       без предупреждения, потеряется немного. */
    const beat = setInterval(() => {
      if (clockRef.current.since !== null) {
        flush();
      }
    }, 10_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('pageshow', onShow);
      clearInterval(beat);
      /* Ушли в другой раздел: последнее состояние и время сохраняются. */
      stopClock();
      flush();
    };
  }, [running, stopClock, startClock, flush]);

  /* ── Другая вкладка ─────────────────────────────────────────── */

  const runId = view.kind === 'run' ? view.run.id : null;
  useEffect(() => {
    if (runId === null) {
      return;
    }
    const key = sessionKey(scope);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== key) {
        return;
      }
      let reason: Blocked | null = null;
      if (event.key === null || event.newValue === null) {
        reason = 'gone';
      } else {
        const head = peekHead(event.newValue);
        if (head === null || head.schemaVersion !== TRAINER_SCHEMA_VERSION) {
          reason = 'gone';
        } else if (head.id !== runId) {
          reason = 'replaced';
        } else if (head.writer !== TAB_ID && head.rev > revRef.current) {
          reason = 'taken';
        }
      }
      if (reason !== null && blockedRef.current === null) {
        stopClock();
        blockedRef.current = reason;
        setBlocked(reason);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [runId, scope, stopClock]);

  /** Забрать тренировку себе: показать то, что сейчас в хранилище. */
  const takeOver = useCallback(() => {
    blockedRef.current = null;
    setBlocked(null);
    if (!resume()) {
      viewRef.current = { kind: 'config' };
      setView({ kind: 'config' });
    }
  }, [resume]);

  const leaveToConfig = useCallback(() => {
    blockedRef.current = null;
    setBlocked(null);
    viewRef.current = { kind: 'config' };
    setView({ kind: 'config' });
    notifySessionsChanged();
  }, []);

  /* ── Начать тренировку из выбора ────────────────────────────── */

  const start = useCallback(
    (payload: P) => {
      /* Незавершённая могла появиться в другой вкладке уже после того,
         как открыт этот выбор: смотрим в хранилище в момент нажатия. */
      const read = availableRef.current ? readSession(scope) : ({ status: 'none' } as const);
      if (read.status === 'ok') {
        const old = restoreFrom(read.session);
        if (old !== null) {
          setPending({
            payload,
            solved: old.restored === null ? 0 : Object.keys(old.restored.marks).length,
            total: old.restored?.order?.length ?? count(old.payload),
          });
          return;
        }
      }
      begin(payload);
    },
    [scope, restoreFrom, count, begin],
  );

  const retryErrors = useCallback(
    (data: SummaryData) => {
      if (subset === undefined) {
        return;
      }
      const wrong = data.items
        .filter((item) => item.mark === 'wrong' || item.mark === 'hinted')
        .map((item) => item.poolIndex);
      if (wrong.length === 0) {
        return;
      }
      begin(subset(data.payload as P, wrong));
    },
    [subset, begin],
  );

  /* Сохранённое не отрисовалось: сбросить и предложить начать заново. */
  const onScreenError = useCallback(() => {
    const current = viewRef.current;
    if (current.kind === 'run' && current.run.restored !== null) {
      clearSession(scope);
      setNotice('restore');
      viewRef.current = { kind: 'config' };
      setView({ kind: 'config' });
    }
  }, [scope]);

  /* ── Разметка ───────────────────────────────────────────────── */

  const noticeBlock =
    notice === null ? null : (
      <div className="tsess__notice" role="status">
        <span>{notice === 'version' ? sessionText.oldVersion : sessionText.brokenSession}</span>
        <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
          {sessionText.dismiss}
        </Button>
      </div>
    );

  const confirmStart = (
    <Modal
      open={pending !== null}
      onClose={() => setPending(null)}
      title={sessionText.unfinishedTitle}
      description={
        pending === null ? null : sessionText.unfinishedText(pending.solved, pending.total)
      }
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              setPending(null);
              resume();
            }}
          >
            {sessionText.keepOld}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              const next = pending?.payload;
              /* Запись не удаляется, а перезаписывается новой: соседняя
                 вкладка увидит «заменена», а не «завершена». */
              setPending(null);
              if (next !== undefined) {
                begin(next);
              }
            }}
          >
            {sessionText.startNew}
          </Button>
        </>
      }
    />
  );

  if (view.kind === 'summary') {
    return (
      <TrainerSummary
        data={view.data}
        backHref={backHref}
        onNew={() => {
          viewRef.current = { kind: 'config' };
          setView({ kind: 'config' });
        }}
        onRetry={subset === undefined ? undefined : () => retryErrors(view.data)}
      />
    );
  }

  if (view.kind === 'config') {
    return (
      <>
        {noticeBlock}
        {configurator({ start })}
        {confirmStart}
      </>
    );
  }

  const { run } = view;
  return (
    <div className="tsess">
      <SessionBar
        index={bar.index}
        total={bar.total}
        solved={bar.solved}
        paused={paused}
        blocked={blocked !== null}
        elapsed={elapsed}
        onPause={pause}
        onResume={unpause}
        onFinish={() => setConfirmFinish(true)}
      />
      {available && !saveFailed ? null : (
        <p className="tsess__nosave" role="status">
          {sessionText.noSave}
        </p>
      )}

      {blocked === null ? null : (
        <div className="tsess__cover tsess__cover--warn" role="alert">
          <h3 className="tsess__cover-title">{sessionText.blocked[blocked].title}</h3>
          <p className="tsess__cover-text">{sessionText.blocked[blocked].text}</p>
          <Button onClick={blocked === 'gone' ? leaveToConfig : takeOver}>
            {sessionText.blocked[blocked].action}
          </Button>
        </div>
      )}

      {paused && blocked === null ? (
        <div className="tsess__cover" role="status">
          <h3 className="tsess__cover-title">{sessionText.pausedTitle}</h3>
          <p className="tsess__cover-text">{sessionText.pausedText}</p>
          <Button onClick={unpause}>{sessionText.resume}</Button>
        </div>
      ) : null}

      {/* Задания на паузе скрыты, но не убраны: введённое остаётся на месте. */}
      <div
        className="tsess__body"
        hidden={paused || blocked !== null}
        inert={paused || blocked !== null}
      >
        <RunBoundary
          key={`${run.id}:${run.epoch}`}
          onError={onScreenError}
          fallback={
            run.restored !== null ? null : (
              <ErrorFallback variant="block" error={null} what={what} />
            )
          }
        >
          {screen({
            payload: run.payload,
            sessionId: run.id,
            restored: run.restored as U | null,
            report,
            elapsed,
            finish,
          })}
        </RunBoundary>
      </div>

      <Modal
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title={sessionText.finishTitle}
        description={sessionText.finishText}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmFinish(false)}>
              {sessionText.cancel}
            </Button>
            <Button variant="danger" onClick={finish}>
              {sessionText.finish}
            </Button>
          </>
        }
      />
    </div>
  );
}
