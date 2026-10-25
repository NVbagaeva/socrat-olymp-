'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Button, Input } from '@/components/ui';
import { newKitId } from '@/lib/komplekt';
import { KitBar } from '../generator/KitBar';
import type {
  GenDopV2,
  GenPreviewTaskV2,
  GenSegmentV2,
  GenStateV2,
  GeneratorConfigV2,
} from './types';
import './generator-v2.css';

const nichego = () => () => {};

function Segmenty<S>({
  seg,
  value,
  onPick,
}: {
  seg: GenSegmentV2<S>;
  value: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="gv2-field">
      <p className="gv2-field__label">{seg.label}</p>
      <div className="gv2-seg" role="radiogroup" aria-label={seg.label}>
        {seg.options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            className={clsx('gv2-seg__btn', value === o.id && 'is-active')}
            onClick={() => onPick(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {seg.note === undefined ? null : <p className="gv2-field__note">{seg.note}</p>}
    </div>
  );
}

/**
 * Генератор v2: три шага на одном экране (02-design.md, § 5.2).
 *
 * Быстрый старт — пресеты; 1. Что — типы со счётчиками; 2. Как —
 * сегменты раздела; «Дополнительно» свёрнуто; 3. Сгенерировать —
 * комплект (KitBar: код, листы, «Мои комплекты»), QR и ссылка на
 * онлайн-набор. Справа (на телефоне — ниже) — предпросмотр первых
 * задач сразу по составу; после генерации у задачи есть «↻ заменить».
 * На телефоне главная кнопка — в нижней панели под большим пальцем.
 */
export function GeneratorV2<S extends GenStateV2>({ config }: { config: GeneratorConfigV2<S> }) {
  const T = config.texts;
  const [s, setS] = useState<S>(config.initial);
  const [preset, setPreset] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const [preview, setPreview] = useState<GenPreviewTaskV2[][] | null>(null);
  const [zagruzka, setZagruzka] = useState(false);
  const [vkladka, setVkladka] = useState<'uchenik' | 'uchitel'>('uchenik');
  const [variant, setVariant] = useState(0);
  const [skopirovano, setSkopirovano] = useState(false);
  const [kitSeed, setKitSeed] = useState<string | null>(null);
  /* Адрес сайта для QR: в браузере — свой, на сервере — пусто. */
  const origin = useSyncExternalStore(
    nichego,
    () => window.location.origin,
    () => '',
  );

  const vsego = config.kinds.reduce((n, k) => n + (s.sostav[k.id] ?? 0), 0);
  const minut = config.kinds.reduce((n, k) => n + (s.sostav[k.id] ?? 0) * k.minut, 0);
  /* Предпросмотр до генерации — на постоянном seed: состав виден сразу. */
  const sPreview = useMemo(
    () => (generated ? s : { ...s, seed: s.seed || 'predprosmotr', zameny: {} }),
    [s, generated],
  );

  useEffect(() => {
    if (vsego === 0) {
      return;
    }
    let alive = true;
    const timer = window.setTimeout(() => {
      setZagruzka(true);
      config
        .preview(sPreview)
        .then((p) => {
          if (alive) setPreview(p);
        })
        .catch(() => {
          if (alive) setPreview(null);
        })
        .finally(() => {
          if (alive) setZagruzka(false);
        });
    }, 150);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [config, sPreview, vsego]);

  function izmenit(patch: Partial<S>) {
    setS((prev) => ({ ...prev, ...patch, zameny: {} }));
    setPreset(null);
    setGenerated(false);
  }

  function postavit(id: string, n: number) {
    izmenit({ sostav: { ...s.sostav, [id]: n } } as Partial<S>);
  }

  function vsemPo(n: number) {
    izmenit({
      sostav: Object.fromEntries(config.kinds.map((k) => [k.id, Math.min(n, k.max)])),
    } as Partial<S>);
  }

  /* Seed — у текущего комплекта KitBar: листы по его ссылкам и
     предпросмотр должны совпадать. Новый набор того же состава —
     кнопка KitBar «Новый комплект» (onSeed). */
  function sgenerirovat() {
    const seed = kitSeed ?? newKitId();
    setKitSeed(seed);
    setS((prev) => ({ ...prev, seed, zameny: {} }));
    setGenerated(true);
    setVariant(0);
  }

  function zamenit(pos: string) {
    setS((prev) => ({ ...prev, zameny: { ...prev.zameny, [pos]: (prev.zameny[pos] ?? 0) + 1 } }));
  }

  /* Комплект сменился в KitBar («Новый комплект», код из «Моих комплектов»). */
  function smenitSeed(seed: string) {
    setKitSeed(seed);
    if (seed !== s.seed) {
      setS((prev) => ({ ...prev, seed, zameny: {} }));
      setGenerated(true);
    }
  }

  const hrefs = config.hrefs(s);
  const online = hrefs.online === null ? null : `${origin}${hrefs.online}`;
  const pokaz = vsego === 0 ? null : preview;
  const zadachi = pokaz?.[variant] ?? [];

  function dopPole(d: GenDopV2<S>) {
    const value = s[d.key];
    if (d.kind === 'segment') {
      return (
        <Segmenty<S>
          key={d.key}
          seg={d}
          value={String(value)}
          onPick={(id) => izmenit({ [d.key]: id } as Partial<S>)}
        />
      );
    }
    if (d.kind === 'number') {
      return (
        <Segmenty<S>
          key={d.key}
          seg={{ ...d, options: d.options.map((n) => ({ id: String(n), label: String(n) })) }}
          value={String(value)}
          onPick={(id) => izmenit({ [d.key]: Number(id) } as Partial<S>)}
        />
      );
    }
    return (
      <label key={d.key} className="gv2-field">
        <span className="gv2-field__label">{d.label}</span>
        <Input
          value={String(value ?? '')}
          maxLength={d.maxLength}
          onChange={(e) => izmenit({ [d.key]: e.target.value } as Partial<S>)}
        />
      </label>
    );
  }

  return (
    <div className="gv2">
      <div className="gv2__side">
        <section className="gv2-card">
          <h2 className="gv2-card__h">{T.bystryy}</h2>
          <p className="gv2-card__note">{T.bystryyNote}</p>
          <div className="gv2-presety">
            {config.presets.map((p) => (
              <button
                key={p.id}
                type="button"
                className={clsx('gv2-preset', preset === p.id && 'is-active')}
                aria-pressed={preset === p.id}
                onClick={() => {
                  setS((prev) => ({ ...p.apply(prev), zameny: {} }));
                  setPreset(p.id);
                  setGenerated(false);
                }}
              >
                <span className="gv2-preset__label">{p.label}</span>
                <span className="gv2-preset__note">{p.note}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="gv2-card">
          <h2 className="gv2-card__h">
            <span className="gv2-card__no">1</span>
            {T.chto}
          </h2>
          <p className="gv2-card__note">{T.chtoNote}</p>
          <ul className="gv2-kinds">
            {config.kinds.map((k) => {
              const n = s.sostav[k.id] ?? 0;
              return (
                <li key={k.id} className={clsx('gv2-kind', n > 0 && 'is-on')}>
                  <span className="gv2-kind__text">
                    <span className="gv2-kind__label">{k.label}</span>
                    <span className="gv2-kind__note">{k.note}</span>
                  </span>
                  <span className="gv2-kind__count">
                    <button
                      type="button"
                      className="gv2-kind__btn"
                      aria-label={`Меньше: ${k.label}`}
                      disabled={n === 0}
                      onClick={() => postavit(k.id, n - 1)}
                    >
                      −
                    </button>
                    <span className="gv2-kind__n" aria-live="polite">
                      {n}
                    </span>
                    <button
                      type="button"
                      className="gv2-kind__btn"
                      aria-label={`Больше: ${k.label}`}
                      disabled={n >= k.max}
                      onClick={() => postavit(k.id, n + 1)}
                    >
                      +
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="gv2-bystro">
            <button type="button" className="gv2-chip" onClick={() => vsemPo(1)}>
              {T.vsemPo(1)}
            </button>
            <button type="button" className="gv2-chip" onClick={() => vsemPo(2)}>
              {T.vsemPo(2)}
            </button>
            <button type="button" className="gv2-chip" onClick={() => vsemPo(0)}>
              {T.ochistit}
            </button>
          </div>
          <p className="gv2-itog">
            <b>{T.vListe(vsego * s.variants)}</b>
            <span>{T.minut(minut)}</span>
          </p>
        </section>

        <section className="gv2-card">
          <h2 className="gv2-card__h">
            <span className="gv2-card__no">2</span>
            {T.kak}
          </h2>
          <p className="gv2-card__note">{T.kakNote}</p>
          {config.segments.map((seg) => (
            <Segmenty<S>
              key={seg.key}
              seg={seg}
              value={String(s[seg.key])}
              onPick={(id) => izmenit({ [seg.key]: id } as Partial<S>)}
            />
          ))}
          <details className="gv2-dop">
            <summary>{T.dop}</summary>
            <div className="gv2-dop__body">{config.dop.map(dopPole)}</div>
          </details>
        </section>

        <section className="gv2-card">
          <h2 className="gv2-card__h">
            <span className="gv2-card__no">3</span>
            {T.shag3}
          </h2>
          <Button className="gv2-go" size="lg" disabled={vsego === 0} onClick={sgenerirovat}>
            {T.sgenerirovat}
            <span className="gv2-go__n">{T.vListe(vsego * s.variants)}</span>
          </Button>
          {generated ? (
            <>
              <KitBar
                scope={config.scope}
                slot={config.slot}
                section={config.section}
                count={vsego * s.variants}
                ready={vsego > 0}
                hrefs={(seed) => config.hrefs({ ...s, seed })}
                seed={s.seed}
                onSeed={smenitSeed}
              />
              {online === null || config.qr === undefined || origin === '' ? null : (
                <div className="gv2-qr">
                  <span
                    className="gv2-qr__img"
                    dangerouslySetInnerHTML={{ __html: config.qr(online) }}
                  />
                  <span className="gv2-qr__text">
                    <span>{T.qr}</span>
                    <a href={hrefs.online ?? '#'} target="_blank" rel="noopener">
                      {T.onlayn}
                    </a>
                    <button
                      type="button"
                      className="gv2-chip"
                      onClick={() => {
                        void navigator.clipboard?.writeText(online).then(() => {
                          setSkopirovano(true);
                          window.setTimeout(() => setSkopirovano(false), 2000);
                        });
                      }}
                    >
                      {skopirovano ? T.ssylkaGotova : T.ssylka}
                    </button>
                  </span>
                </div>
              )}
            </>
          ) : null}
        </section>
      </div>

      <section className="gv2__preview" aria-label={T.predprosmotr}>
        <div className="gv2-toolbar">
          <div className="gv2-seg" role="tablist">
            {(['uchenik', 'uchitel'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={vkladka === v}
                className={clsx('gv2-seg__btn', vkladka === v && 'is-active')}
                onClick={() => setVkladka(v)}
              >
                {v === 'uchenik' ? T.uchenik : T.uchitelTab}
              </button>
            ))}
          </div>
          {pokaz !== null && pokaz.length > 1 ? (
            <div className="gv2-varianty">
              {pokaz.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={clsx('gv2-seg__btn', variant === i && 'is-active')}
                  aria-pressed={variant === i}
                  onClick={() => setVariant(i)}
                >
                  {T.variant} {i + 1}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <p className="gv2-card__note">{T.predprosmotrNote}</p>
        <div className={clsx('gv2-a4', zagruzka && 'is-loading')}>
          {pokaz === null ? (
            <p className="gv2-a4__pusto">{T.pusto}</p>
          ) : (
            <ol className="gv2-a4__list">
              {zadachi.map((z) => (
                <li key={z.pos} className="gv2-a4__task">
                  <span className="gv2-a4__no">{z.no}</span>
                  <div className="gv2-a4__body">
                    {/* Тип — только учителю: на листе ученика его нет. */}
                    {vkladka === 'uchitel' ? (
                      <span className="gv2-a4__kind">{z.kindLabel}</span>
                    ) : null}
                    <div dangerouslySetInnerHTML={{ __html: z.html }} />
                    {vkladka === 'uchitel' ? (
                      <div
                        className="gv2-a4__teacher"
                        dangerouslySetInnerHTML={{ __html: z.teacherHtml }}
                      />
                    ) : null}
                  </div>
                  <span className="gv2-a4__aside">
                    {z.badge === null || vkladka === 'uchenik' ? null : (
                      <span className="gv2-a4__badge">{z.badge}</span>
                    )}
                    {generated ? (
                      <button
                        type="button"
                        className="gv2-a4__zamena"
                        aria-label={`${T.zamenit} ${z.no}`}
                        title={T.zamenit}
                        onClick={() => zamenit(z.pos)}
                      >
                        ↻
                      </button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <div className="gv2-bar" aria-hidden={vsego === 0}>
        <span className="gv2-bar__text">
          <b>{T.vListe(vsego * s.variants)}</b>
          <span>{T.minut(minut)}</span>
        </span>
        <Button disabled={vsego === 0} onClick={sgenerirovat}>
          {T.sgenerirovat}
        </Button>
      </div>
    </div>
  );
}
