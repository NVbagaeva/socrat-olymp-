'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui';
import { GenIcon } from '@/components/generator/GenIcons';
import { GenSheet } from '@/components/generator/GenOverlay';
import { FILTRY, SLOVA_FILTRA } from '@/content/trenazherFiltry';
import {
  ISTOCHNIKI,
  MOI,
  PORYADKI,
  REZHIMY,
  SKOLKO,
  aktivnye,
  chislaChipov,
  dopAktivnye,
  dopZnachenie,
  etoNabor,
  izmenit,
  kRazdelu,
  nabor,
  naborRazdela,
  naydeno,
  pereklyuchitTemu,
  pereklyuchitTip,
  pereklyuchitUroven,
  rasshirit,
  sbrositVse,
  skolkoAktivnyh,
  skolkoVozmyot,
  snyat,
  snyatDop,
  vSsylku,
  vyborTemy,
  type ChisloChipa,
  type NaborId,
} from '@/lib/trenazher/filtr';
import type {
  Filtr,
  FiltrPodtip,
  FiltrTema,
  Statistika,
  TrenazherConfig,
  Uroven,
  ZadachaRef,
} from '@/lib/trenazher/types';
import { AktivnyeFiltry, KnopkaFiltrov, Pole, Segm, Zvyozdy } from './chasti';
import './filtry.css';

export interface FiltrPanelProps {
  config: TrenazherConfig;
  refs: readonly ZadachaRef[];
  stat: Statistika;
  filtr: Filtr;
  onChange: (next: Filtr) => void;
  onStart: () => void;
  starting: boolean;
  /** Тренировка на паузе: плашка «Продолжить» над фильтрами. */
  pauza?: { resheno: number; vsego: number; onResume: () => void } | null;
  /** Ссылка на эти фильтры: учитель отправляет её ученику. */
  ssylka?: () => string;
}

const NABORY: NaborId[] = ['bystryy', 'oshibki', 'slozhnye'];

/**
 * Панель фильтров тренажёра — сверху, без колонки слева. Всё
 * применяется сразу, счётчик «Найдено N» живой. На телефоне — строка
 * чипов типов и «Фильтры (N)», остальное в нижнем листе; «Начать
 * тренировку» — липкой кнопкой внизу экрана.
 */
export function FiltrPanel({
  config,
  refs,
  stat,
  filtr: f,
  onChange,
  onStart,
  starting,
  pauza = null,
  ssylka,
}: FiltrPanelProps) {
  const [sheet, setSheet] = useState(false);
  const [copied, setCopied] = useState(false);
  const found = naydeno(refs, f, stat);
  const vozmyom = skolkoVozmyot(f, found.length);
  const chisla = chislaChipov(config, refs, f, stat);
  const active = aktivnye(f, config, SLOVA_FILTRA);
  const mnogoTem = config.temy.length > 1;
  const oshibok = refs.filter((r) => stat.oshibki.has(r.key)).length;

  function copy() {
    if (ssylka === undefined) return;
    void navigator.clipboard?.writeText(ssylka()).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      },
      () => undefined,
    );
  }

  const chipsTipov = <TipyChips config={config} f={f} chisla={chisla} onChange={onChange} />;

  const naboryBlock = (
    <div className="flt-nabory" role="group" aria-label={FILTRY.nabory}>
      {NABORY.map((id) => {
        const next = nabor(id, f, config);
        if (next === null) return null;
        const words = FILTRY.naboryVarianty[id];
        return (
          <button
            key={id}
            type="button"
            className="flt-nabor"
            aria-pressed={etoNabor(id, f, config)}
            disabled={id === 'oshibki' && oshibok === 0}
            onClick={() => onChange(next)}
          >
            <b>{words.title}</b>
            <small>{words.sub}</small>
          </button>
        );
      })}
      {(config.nabory ?? []).map((n) => {
        const next = naborRazdela(n, f, config);
        return (
          <button
            key={n.id}
            type="button"
            className="flt-nabor"
            aria-pressed={vSsylku(next) === vSsylku(f)}
            onClick={() => onChange(next)}
          >
            <b>{n.title}</b>
            <small>{n.sub}</small>
          </button>
        );
      })}
    </div>
  );

  const nastroyki = (
    <div className="flt-grid">
      {config.istochnik ? (
        <Pole label={FILTRY.istochnik}>
          <Segm
            label={FILTRY.istochnik}
            value={f.istochnik}
            options={ISTOCHNIKI.map((id) => ({ id, title: FILTRY.istochniki[id] }))}
            onPick={(istochnik) => onChange(izmenit(f, { istochnik }))}
          />
        </Pole>
      ) : null}
      {config.urovni.length > 0 ? (
        <Pole label={FILTRY.slozhnost}>
          <Zvyozdy
            urovni={config.urovni}
            vybrany={f.urovni}
            onToggle={(u) => onChange(pereklyuchitUroven(f, u as Uroven))}
            onLyubaya={() => onChange(izmenit(f, { urovni: [] }))}
          />
        </Pole>
      ) : null}
      <Pole label={FILTRY.skolko}>
        <Segm
          label={FILTRY.skolko}
          value={f.skolko}
          options={SKOLKO.map((id) => ({ id, title: FILTRY.skolkoVarianty[id] }))}
          onPick={(skolko) => onChange(izmenit(f, { skolko }))}
        />
      </Pole>
      <Pole label={FILTRY.rezhim}>
        <Segm
          label={FILTRY.rezhim}
          value={f.rezhim}
          options={REZHIMY.map((id) => ({
            id,
            title: FILTRY.rezhimy[id].title,
            hint: FILTRY.rezhimy[id].lead,
          }))}
          onPick={(rezhim) => onChange(izmenit(f, { rezhim }))}
        />
      </Pole>
      {(config.dop ?? []).map((pole) => (
        <Pole key={pole.id} label={pole.title}>
          <Segm
            label={pole.title}
            value={dopZnachenie(f, pole)}
            options={pole.varianty}
            onPick={(v) => onChange(kRazdelu({ ...f, dop: { ...f.dop, [pole.id]: v } }, config))}
          />
        </Pole>
      ))}
      <Pole label={FILTRY.poryadok}>
        <Segm
          label={FILTRY.poryadok}
          value={f.poryadok}
          options={PORYADKI.map((id) => ({ id, title: FILTRY.poryadki[id] }))}
          onPick={(poryadok) => onChange(izmenit(f, { poryadok }))}
        />
      </Pole>
      <Pole label={FILTRY.moi}>
        <Segm
          label={FILTRY.moi}
          value={f.moi}
          options={MOI.map((id) => ({ id, title: FILTRY.moiVarianty[id] }))}
          onPick={(moi) => onChange(izmenit(f, { moi }))}
        />
      </Pole>
    </div>
  );

  const aktivnyeBlock = (
    <AktivnyeFiltry
      items={[
        ...active.map((a) => ({
          id: a.pole,
          label: a.label,
          onSnyat: () => onChange(snyat(f, a.pole)),
        })),
        ...dopAktivnye(f, config).map((d) => ({
          id: `dop:${d.id}`,
          label: d.label,
          onSnyat: () => onChange(snyatDop(f, d.id)),
        })),
      ]}
      onSbrosit={() => onChange(sbrositVse(f))}
    />
  );

  const pusto =
    found.length > 0 ? null : (
      <div className="flt-empty" role="status">
        <p className="flt-empty__title">{FILTRY.pusto.title}</p>
        <p className="flt-empty__text">
          {f.moi === 'oshibki' && oshibok === 0 ? FILTRY.pusto.oshibok : FILTRY.pusto.text}
        </p>
        <div className="flt-empty__actions">
          {rasshirit(f) === null ? null : (
            <Button
              variant="secondary"
              onClick={() => {
                /* Снимать, пока не найдётся хоть что-то: одного снятия
                   бывает мало (ошибок нет ни в одном типе). */
                let next = rasshirit(f);
                while (next !== null && naydeno(refs, next, stat).length === 0) {
                  const more = rasshirit(next);
                  if (more === null) break;
                  next = more;
                }
                if (next !== null) onChange(next);
              }}
            >
              {FILTRY.pusto.rasshirit}
            </Button>
          )}
          <Button variant="ghost" onClick={() => onChange(sbrositVse(f))}>
            {FILTRY.pusto.sbrosit}
          </Button>
        </div>
      </div>
    );

  const startButton = (
    <Button onClick={onStart} disabled={found.length === 0 || starting} aria-busy={starting}>
      {starting ? FILTRY.sobirayu : FILTRY.nachat}
    </Button>
  );

  const schyotchik = (
    <p className="flt-count" aria-live="polite">
      <b>{FILTRY.naydeno(found.length)}</b>
      {found.length > 0 && vozmyom < found.length ? <span>{FILTRY.vozmyom(vozmyom)}</span> : null}
    </p>
  );

  return (
    <section className="flt" aria-label={FILTRY.filtry}>
      {pauza === null ? null : (
        <div className="flt-pause" role="status">
          <div>
            <p className="flt-pause__title">{FILTRY.pauza.title}</p>
            <p className="flt-pause__text">{FILTRY.pauza.text(pauza.resheno, pauza.vsego)}</p>
          </div>
          <Button onClick={pauza.onResume}>{FILTRY.pauza.prodolzhit}</Button>
        </div>
      )}

      {/* Телефон: чипы типов в одну строку и «Фильтры (N)». */}
      <div className="flt-phone">
        <KnopkaFiltrov n={skolkoAktivnyh(f)} onClick={() => setSheet(true)} />
        <div className="flt-phone__chips">{chipsTipov}</div>
      </div>

      {/* Компьютер и планшет: всё на виду. */}
      <div className="flt-card">
        {naboryBlock}
        <div className="flt-block">
          <p className="flt-label">{FILTRY.tipy}</p>
          {chipsTipov}
          {mnogoTem ? (
            <PodtipyTem config={config} f={f} chisla={chisla} onChange={onChange} />
          ) : null}
        </div>
        {nastroyki}
      </div>

      {aktivnyeBlock}
      {pusto}

      <div className="flt-go">
        {schyotchik}
        <div className="flt-go__actions">
          {ssylka === undefined ? null : (
            <button type="button" className="flt-link" onClick={copy}>
              <GenIcon name="link" />
              {copied ? FILTRY.skopirovano : FILTRY.ssylka}
            </button>
          )}
          {startButton}
        </div>
      </div>

      {sheet ? (
        <GenSheet
          title={FILTRY.filtry}
          onClose={() => setSheet(false)}
          foot={
            <Button
              className="flt-wide"
              onClick={() => setSheet(false)}
              disabled={found.length === 0}
            >
              {FILTRY.pokazat(found.length)}
            </Button>
          }
        >
          <div className="flt-sheet">
            {naboryBlock}
            <div className="flt-block">
              <p className="flt-label">{FILTRY.tipy}</p>
              {chipsTipov}
              {mnogoTem ? (
                <PodtipyTem config={config} f={f} chisla={chisla} onChange={onChange} />
              ) : null}
            </div>
            {nastroyki}
            {aktivnyeBlock}
          </div>
        </GenSheet>
      ) : null}
    </section>
  );
}

function Chislo({ c }: { c: ChisloChipa | undefined }) {
  const n = c?.n ?? 0;
  const r = c?.resheno ?? 0;
  return (
    <span className="flt-chip__n" aria-label={r > 0 ? FILTRY.resheno(r, n) : undefined}>
      {r > 0 ? `${r}/${n}` : n}
    </span>
  );
}

function Nazvanie({ p }: { p: FiltrPodtip }) {
  return p.titleHtml === undefined ? (
    <span className="flt-chip__t">{p.title}</span>
  ) : (
    <span className="flt-chip__t" dangerouslySetInnerHTML={{ __html: p.titleHtml }} />
  );
}

/**
 * Чипы типов: у раздела с одной темой — её подтипы, у нескольких —
 * темы целиком (подтипы выбранной темы — строкой ниже). «Все» снимает
 * выбор. Чип без задач при остальных фильтрах — неактивен.
 */
function TipyChips({
  config,
  f,
  chisla,
  onChange,
}: {
  config: TrenazherConfig;
  f: Filtr;
  chisla: Record<string, ChisloChipa>;
  onChange: (next: Filtr) => void;
}) {
  const mnogoTem = config.temy.length > 1;
  const vsego = Object.entries(chisla)
    .filter(([id]) => config.temy.some((t) => t.id === id))
    .reduce((s, [, c]) => s + c.n, 0);
  return (
    <div className="flt-chips" role="group" aria-label={FILTRY.tipy}>
      <button
        type="button"
        className="flt-chip"
        aria-pressed={f.tipy.length === 0}
        onClick={() => onChange(izmenit(f, { tipy: [] }))}
      >
        <span className="flt-chip__t">{FILTRY.vse}</span>
        <span className="flt-chip__n">{vsego}</span>
      </button>
      {mnogoTem
        ? config.temy.map((t) => {
            const c = chisla[t.id];
            const sel = vyborTemy(t, f);
            return (
              <button
                key={t.id}
                type="button"
                className={clsx('flt-chip', sel === 'chast' && 'is-part')}
                aria-pressed={sel !== 'net'}
                disabled={(c?.n ?? 0) === 0 && sel === 'net'}
                title={(c?.n ?? 0) === 0 ? FILTRY.nolChip : undefined}
                onClick={() => onChange(pereklyuchitTemu(f, t))}
              >
                <span className="flt-chip__t">{t.title}</span>
                <Chislo c={c} />
              </button>
            );
          })
        : config.temy
            .flatMap((t) => t.podtipy)
            .map((p) => <PodtipChip key={p.id} p={p} f={f} chisla={chisla} onChange={onChange} />)}
    </div>
  );
}

function PodtipChip({
  p,
  f,
  chisla,
  onChange,
}: {
  p: FiltrPodtip;
  f: Filtr;
  chisla: Record<string, ChisloChipa>;
  onChange: (next: Filtr) => void;
}) {
  const c = chisla[p.id];
  const on = f.tipy.includes(p.id);
  return (
    <button
      type="button"
      className="flt-chip"
      aria-pressed={on}
      disabled={(c?.n ?? 0) === 0 && !on}
      title={(c?.n ?? 0) === 0 ? FILTRY.nolChip : undefined}
      onClick={() => onChange(pereklyuchitTip(f, p.id))}
    >
      <span className="flt-chip__code">{p.code}</span>
      <Nazvanie p={p} />
      <Chislo c={c} />
    </button>
  );
}

/** Подтипы выбранных тем — у раздела с несколькими темами. */
function PodtipyTem({
  config,
  f,
  chisla,
  onChange,
}: {
  config: TrenazherConfig;
  f: Filtr;
  chisla: Record<string, ChisloChipa>;
  onChange: (next: Filtr) => void;
}) {
  const temy: FiltrTema[] = config.temy.filter((t) => vyborTemy(t, f) !== 'net');
  if (temy.length === 0) return null;
  return (
    <div className="flt-subs">
      {temy.map((t) => (
        <div key={t.id} className="flt-subs__row">
          <p className="flt-subs__title">{t.title}</p>
          <div className="flt-chips flt-chips--sub">
            {t.podtipy.map((p) => (
              <PodtipChip key={p.id} p={p} f={f} chisla={chisla} onChange={onChange} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
