'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { Button, Input } from '@/components/ui';
import { ONLINE_TEXT as T } from '@/content/variantOnline/text';
import { qrSvg } from '@/lib/qr';
import { storage } from '@/lib/storage';
import {
  MAX_MINUTES,
  defaultSettings,
  reshatHref,
  seriyaHref,
  type Mode,
  type WorkSettings,
} from '@/lib/variant/online/link';
import { SERIES_DEFAULT, seriesRepeats } from '@/lib/variant/online/work';
import { MAX_VARIANTS, type VariantMeta, type VariantSet } from '@/lib/variant/types';

export interface OnlinePanelProps {
  set: VariantSet | null;
  meta: VariantMeta;
  /** Настройки на экране поменялись после сборки: ссылка — на старый набор. */
  stale: boolean;
  busy: boolean;
  /** Собрать серию: N разных вариантов без повторов. */
  onSeries: (count: number) => void;
}

const KEY = 'variant:online';

/** Режим и таймер, выбранные учителем в прошлый раз. */
export function readSettings(): Pick<WorkSettings, 'mode' | 'timer'> {
  const raw = storage.get<unknown>(KEY, null);
  const d = defaultSettings();
  if (typeof raw !== 'object' || raw === null) return d;
  const r = raw as Record<string, unknown>;
  const t = r['timer'] as Record<string, unknown> | undefined;
  return {
    mode: r['mode'] === 'kontrol' ? 'kontrol' : 'trening',
    timer:
      t?.['kind'] === 'up'
        ? { kind: 'up' }
        : t?.['kind'] === 'down' && typeof t['minutes'] === 'number'
          ? { kind: 'down', minutes: t['minutes'] }
          : { kind: 'none' },
  };
}

function Seg<I extends string>({
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

/**
 * «Решать онлайн» на экране «Собрать вариант»: режим и таймер учителя,
 * ссылка и QR-код для ученика, серия вариантов. Ссылка ведёт на тот же
 * набор, что печатается: код партии + номер варианта.
 */
export function OnlinePanel({ set, meta, stale, busy, onSeries }: OnlinePanelProps) {
  const [settings, setSettings] = useState(defaultSettings);
  const [minutes, setMinutes] = useState(90);
  const [variant, setVariant] = useState(1);
  const [seriesN, setSeriesN] = useState(SERIES_DEFAULT);
  const [copied, setCopied] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const s = readSettings();
      setSettings((x) => ({ ...x, ...s }));
      if (s.timer.kind === 'down') setMinutes(s.timer.minutes);
      setOrigin(window.location.origin);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const full: WorkSettings = {
    ...settings,
    timer: settings.timer.kind === 'down' ? { kind: 'down', minutes } : settings.timer,
    kind: meta.kind,
    title: meta.kind === 'custom' ? meta.customTitle : '',
  };
  const saved = JSON.stringify({ mode: full.mode, timer: full.timer });
  useEffect(() => {
    storage.set(KEY, JSON.parse(saved) as unknown);
  }, [saved]);

  const count = set?.variants.length ?? 0;
  const v = Math.min(variant, Math.max(1, count));
  const link =
    set === null ? null : `${origin}${reshatHref({ code: set.code, variant: v, ...full })}`;
  const seriesLink = set === null || count < 2 ? null : `${origin}${seriyaHref(set.code, full)}`;
  const qr = useMemo(() => (link === null ? null : qrSvg(link, T.panel.qr(v))), [link, v]);
  const seriesQr = useMemo(
    () => (seriesLink === null ? null : qrSvg(seriesLink, T.seriya.title)),
    [seriesLink],
  );
  const repeats = set === null || count < 2 ? [] : seriesRepeats(set);

  const copy = (text: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(text);
      window.setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <section className="var-panel vo-panel" aria-labelledby="vo-panel-h" data-testid="vo-panel">
      <div className="var-panel__head">
        <h2 id="vo-panel-h" className="var-panel__title">
          {T.panel.title}
        </h2>
      </div>
      <p className="var-panel__note">{T.panel.lead}</p>

      <div className="vo-panel__row">
        <Seg<Mode>
          label={T.panel.mode}
          options={T.panel.modes}
          value={settings.mode}
          onPick={(id) => setSettings((s) => ({ ...s, mode: id }))}
        />
        <Seg<'none' | 'up' | 'down'>
          label={T.panel.timer}
          options={T.panel.timers}
          value={settings.timer.kind}
          onPick={(id) =>
            setSettings((s) => ({
              ...s,
              timer:
                id === 'down'
                  ? { kind: 'down', minutes }
                  : id === 'up'
                    ? { kind: 'up' }
                    : { kind: 'none' },
            }))
          }
        />
        {settings.timer.kind === 'down' ? (
          <label className="vo-field">
            <span className="var-field__label">{T.panel.minutes}</span>
            <Input
              type="number"
              min={1}
              max={MAX_MINUTES}
              value={minutes}
              onChange={(e) => {
                const n = Math.round(Number(e.target.value));
                setMinutes(Number.isFinite(n) ? Math.min(MAX_MINUTES, Math.max(1, n)) : 90);
              }}
            />
          </label>
        ) : null}
        {count > 1 ? (
          <label className="vo-field">
            <span className="var-field__label">{T.panel.variant}</span>
            <Input
              type="number"
              min={1}
              max={count}
              value={v}
              onChange={(e) =>
                setVariant(Math.min(count, Math.max(1, Math.round(Number(e.target.value)) || 1)))
              }
            />
          </label>
        ) : null}
      </div>
      <p className="var-field__note">{T.panel.modeNote[settings.mode]}</p>

      {set === null || link === null ? null : (
        <div className="vo-panel__share">
          <div className="vo-panel__link">
            <span className="var-field__label">{T.panel.link}</span>
            <code className="vo-panel__url" data-testid="vo-link">
              {link}
            </code>
            <span className="vo-actions">
              <a
                className="btn btn--primary"
                href={link}
                target="_blank"
                rel="noreferrer"
                data-testid="vo-open"
              >
                {T.panel.open}
              </a>
              <button type="button" className="vo-link" onClick={() => copy(link)}>
                {copied === link ? T.panel.copied : T.panel.copy}
              </button>
            </span>
          </div>
          {qr === null ? null : <div className="vo-qr" dangerouslySetInnerHTML={{ __html: qr }} />}
        </div>
      )}
      {stale ? <p className="var-status var-status--warn">{T.panel.stale}</p> : null}

      <div className="vo-panel__series">
        <span className="var-field__label">{T.panel.series}</span>
        <p className="var-field__note">{T.panel.seriesLead}</p>
        <div className="vo-panel__row">
          <label className="vo-field">
            <span className="var-field__label">{T.panel.seriesCount}</span>
            <Input
              type="number"
              min={2}
              max={MAX_VARIANTS}
              value={seriesN}
              onChange={(e) =>
                setSeriesN(
                  Math.min(
                    MAX_VARIANTS,
                    Math.max(2, Math.round(Number(e.target.value)) || SERIES_DEFAULT),
                  ),
                )
              }
              data-testid="vo-series-n"
            />
          </label>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => onSeries(seriesN)}
            data-testid="vo-series"
          >
            {T.panel.series}
          </Button>
        </div>
        {repeats.length > 0 ? (
          <p className="var-status var-status--error" role="alert">
            {T.panel.seriesRepeats(repeats.map((n) => `№${n}`).join(', '))}
          </p>
        ) : null}
        {seriesLink === null || repeats.length > 0 ? null : (
          <div className="vo-panel__share">
            <div className="vo-panel__link">
              <span className="var-field__label">{T.panel.seriesLink}</span>
              <code className="vo-panel__url" data-testid="vo-series-link">
                {seriesLink}
              </code>
              <span className="vo-actions">
                <a
                  className="btn btn--secondary"
                  href={seriesLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  {T.panel.seriesOpen}
                </a>
                <button type="button" className="vo-link" onClick={() => copy(seriesLink)}>
                  {copied === seriesLink ? T.panel.copied : T.panel.copy}
                </button>
              </span>
            </div>
            {seriesQr === null ? null : (
              <div className="vo-qr" dangerouslySetInnerHTML={{ __html: seriesQr }} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
