'use client';

import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { kitTexts as T } from '@/content/generator';
import { counted } from '@/lib/plural';
import {
  bothHref,
  currentKit,
  findKit,
  generatorVersion,
  isDownloaded,
  loadKits,
  makeKit,
  markDownloaded,
  NO_KITS,
  parseKitCode,
  sameKit,
  setCurrentKit,
  settingsOf,
  subscribeKits,
  type Kit,
  type KitScope,
  type SheetWhich,
} from '@/lib/komplekt';

export interface KitBarProps {
  /** Чей генератор: по области считается версия в коде комплекта. */
  scope: KitScope;
  /** Экран генератора: у каждого свой текущий комплект. */
  slot: string;
  /** Раздел в «Моих комплектах»: «№12 · Линейная функция». */
  section: string;
  /** Заданий на листе, во всех вариантах. */
  count: number;
  /** Настройки собирают лист: false — новый комплект не собрать. */
  ready: boolean;
  /** Адреса обоих листов по seed: у каждого генератора свои параметры. */
  hrefs: (seed: string) => { student: string; teacher: string };
  /** Сводка настроек под кнопками. */
  summary?: ReactNode;
  /** Seed для первого комплекта экрана: у №11 лист уже собран по нему. */
  seed?: string;
  /** Seed текущего комплекта сменился: экрану с превью — пересобрать. */
  onSeed?: (seed: string) => void;
}

function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
}

function dateText(iso: string | null): string {
  if (iso === null) {
    return '';
  }
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function statusOf(kit: Kit): string {
  if (kit.downloaded.student && kit.downloaded.teacher) return T.downloadedBoth;
  if (kit.downloaded.student) return T.downloadedStudent;
  if (kit.downloaded.teacher) return T.downloadedTeacher;
  return T.draft;
}

/**
 * Блок комплекта под настройками генератора.
 *
 * Комплект — лист ученика и лист учителя из одних и тех же заданий
 * с общим кодом (lib/komplekt.ts). Пока комплект не скачан, он
 * следует за настройками; первый скачанный лист его замораживает.
 * Новые задания даёт только «Новый комплект» — с подтверждением,
 * если текущий ещё не скачан. Текущий комплект и «Мои комплекты»
 * живут в localStorage: переход на другую вкладку и перезагрузка их
 * не теряют.
 */
export function KitBar({
  scope,
  slot,
  section,
  count,
  ready,
  hrefs,
  summary,
  seed: firstSeed,
  onSeed,
}: KitBarProps) {
  const history = useSyncExternalStore(subscribeKits, loadKits, () => NO_KITS);
  const stored = useSyncExternalStore(
    subscribeKits,
    () => currentKit(slot),
    () => null,
  );
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ text: string; kit?: Kit } | null>(null);
  const codeId = useId();
  /* Адрес по пробному seed — ключ настроек: по нему черновик следует
     за экраном, а скачанный комплект узнаёт, что настройки ушли. */
  const settings = ready ? settingsOf(hrefs('0000').student) : '';

  const build = (id?: string): Kit =>
    makeKit({ scope, slot, section, count, hrefs, ...(id === undefined ? {} : { id }) });

  /* Текущий комплект. Скачанный заморожен; черновик следует за
     настройками на экране — тот же seed, новые адреса. */
  const kit: Kit | null =
    stored !== null && !isDownloaded(stored) && ready ? build(stored.id) : stored;
  const kitKey = kit === null ? '' : `${kit.code}|${kit.settings}|${kit.count}|${kit.section}`;

  /* Черновик — в хранилище: переживает переход и перезагрузку. Первый
     комплект экрана получает seed здесь, после монтирования: на
     сборке хранилища нет. */
  useEffect(() => {
    if (!ready) {
      return;
    }
    if (stored === null) {
      setCurrentKit(
        build(
          firstSeed !== undefined && parseKitCode(`${firstSeed}-00`) !== null
            ? firstSeed
            : undefined,
        ),
      );
    } else if (kit !== null && !isDownloaded(stored) && !sameKit(stored, kit)) {
      setCurrentKit(kit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, stored, kitKey]);

  const seed = kit?.id ?? null;
  useEffect(() => {
    if (seed !== null) {
      onSeed?.(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const download = (which: SheetWhich[]) => {
    if (kit === null) {
      return;
    }
    let next = kit;
    which.forEach((one) => {
      next = markDownloaded(next, one);
    });
    setCurrentKit(next);
  };

  const fresh = () => {
    if (!ready) {
      return;
    }
    if (
      kit !== null &&
      !isDownloaded(kit) &&
      !window.confirm(fill(T.confirmFresh, { code: kit.code }))
    ) {
      return;
    }
    setMessage(null);
    setCurrentKit(build());
  };

  const restore = () => {
    const parsed = parseKitCode(code);
    if (parsed === null) {
      setMessage({ text: T.restoreBad });
      return;
    }
    const wanted = `${parsed.id}-${parsed.version}`;
    const found = findKit(wanted);
    if (found !== null) {
      if (found.slot === slot) {
        setCurrentKit(found);
        setMessage({ text: fill(T.restoreFound, { code: wanted }) });
      } else {
        setMessage({
          text: fill(T.restoreElsewhere, { code: wanted, section: found.section }),
          kit: found,
        });
      }
      return;
    }
    const now = generatorVersion(scope);
    if (parsed.version !== now) {
      setMessage({ text: fill(T.restoreOld, { code: wanted, old: parsed.version, now }) });
      return;
    }
    if (ready) {
      setCurrentKit(build(parsed.id));
      setMessage({ text: fill(T.restoreSeed, { code: wanted }) });
    }
  };

  const frozen = kit !== null && isDownloaded(kit) && ready && kit.settings !== settings;
  const active = kit !== null && (ready || isDownloaded(kit));

  return (
    <div className="kit">
      <div className="cfg-bar kit-bar">
        <p className="kit-bar__code" aria-live="polite">
          {T.label}{' '}
          <b className="kit-code" data-kit-code={kit?.code ?? ''}>
            {kit?.code ?? '····-··'}
          </b>
          {kit === null ? null : (
            <span className={clsx('kit-bar__status', isDownloaded(kit) && 'is-done')}>
              {statusOf(kit)}
            </span>
          )}
        </p>
        <div className="kit-bar__actions">
          {/* Ссылки, а не кнопки: лист открывается в новой вкладке,
              адрес можно скопировать — лист будет тем же. */}
          <a
            className={clsx('btn btn--primary kit-bar__btn', active || 'is-disabled')}
            href={active ? kit.studentHref : undefined}
            aria-disabled={!active || undefined}
            target="_blank"
            rel="noopener"
            onClick={() => download(['student'])}
          >
            {T.student}
          </a>
          <a
            className={clsx('btn btn--secondary kit-bar__btn', active || 'is-disabled')}
            href={active ? kit.teacherHref : undefined}
            aria-disabled={!active || undefined}
            target="_blank"
            rel="noopener"
            onClick={() => download(['teacher'])}
          >
            {T.teacher}
          </a>
          <a
            className={clsx('btn btn--secondary kit-bar__btn', active || 'is-disabled')}
            href={active ? bothHref(kit) : undefined}
            aria-disabled={!active || undefined}
            target="_blank"
            rel="noopener"
            onClick={() => download(['student', 'teacher'])}
          >
            {T.both}
          </a>
          <button
            type="button"
            className="btn btn--ghost kit-bar__btn kit-bar__fresh"
            disabled={!ready}
            onClick={fresh}
          >
            {T.fresh}
          </button>
        </div>
        {summary === undefined ? null : (
          <p className="cfg-bar__summary kit-bar__summary">{summary}</p>
        )}
        {frozen ? (
          <p className="kit-bar__note" role="status">
            {fill(T.frozen, { code: kit.code })}
          </p>
        ) : null}
      </div>

      <details className="kit-history">
        <summary className="kit-history__title">
          {T.historyTitle}
          {history.length === 0 ? null : (
            <span className="kit-history__count">{history.length}</span>
          )}
        </summary>
        <form
          className="kit-restore"
          onSubmit={(event) => {
            event.preventDefault();
            restore();
          }}
        >
          <label className="kit-restore__label" htmlFor={codeId}>
            {T.restoreLabel}
          </label>
          <input
            id={codeId}
            className="input kit-restore__input"
            value={code}
            placeholder={T.restorePlaceholder}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setCode(event.target.value)}
          />
          <button type="submit" className="btn btn--secondary btn--sm">
            {T.restore}
          </button>
        </form>
        {message === null ? null : (
          <p className="kit-restore__message" role="status">
            {message.text}
            {message.kit === undefined ? null : (
              <>
                {' '}
                <a href={message.kit.studentHref} target="_blank" rel="noopener">
                  {T.historyStudent}
                </a>{' '}
                ·{' '}
                <a href={message.kit.teacherHref} target="_blank" rel="noopener">
                  {T.historyTeacher}
                </a>
              </>
            )}
          </p>
        )}
        {history.length === 0 ? (
          <p className="kit-history__empty">{T.historyEmpty}</p>
        ) : (
          <ul className="kit-history__list">
            {history.map((item) => (
              <li className="kit-history__row" key={item.code}>
                <span className="kit-history__section">{item.section}</span>
                <span className="kit-history__date">{dateText(item.createdAt)}</span>
                <span className="kit-history__code">
                  <b className="kit-code">{item.code}</b>
                  {item.version === generatorVersion(item.scope) ? null : (
                    <span className="kit-history__changed" title={T.historyChangedTitle}>
                      {T.historyChanged}
                    </span>
                  )}
                </span>
                <span className="kit-history__count-cell">
                  {counted(item.count, 'задание', 'задания', 'заданий')}
                </span>
                <span className="kit-history__links">
                  <a href={item.studentHref} target="_blank" rel="noopener">
                    {T.historyStudent}
                  </a>
                  <a href={item.teacherHref} target="_blank" rel="noopener">
                    {T.historyTeacher}
                  </a>
                  <a href={bothHref(item)} target="_blank" rel="noopener">
                    {T.both}
                  </a>
                </span>
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}
