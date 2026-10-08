'use client';

import { clsx } from 'clsx';
import { useId, useState, type ReactNode } from 'react';
import { Button, CheckIcon, NavIcon } from '@/components/ui';
import { CountPicker, StepHead, countOf, useCountChoice } from '@/components/tasks/configurator';
import { TRENAZHER_SLOVA, type Rezhim, type RezhimOpisanie } from '@/content/veroyatnost';
import type { Zadanie } from '@/content/veroyatnost';
import type { TrainerKindTally } from '@/lib/trainerProgress';
import { counted } from '@/lib/plural';
import { HintIcon, TaskCountIcon } from '../prep/PrepIcons';
import { MetodIkonka } from './MetodIkonka';
import { MetodKartinka } from './MetodKartinka';
import type { MetodKarta } from './navyki';

/** Режим в конфигураторе: описание плюс состояние из банка и хранилища. */
export interface RezhimPlitka extends RezhimOpisanie {
  /** Сколько задач в режиме всего — число за словом «Все». */
  total: number;
  /** Режим сейчас недоступен: «Повтор ошибок» без ошибок. */
  locked?: boolean;
}

/** Что выбрано при заходе по ярлыку адреса. */
export interface TrenazherPreset {
  skill: string | null;
  mode: Rezhim;
}

/** Что собрал ученик. */
export interface TrenazherZapros {
  metody: string[];
  rezhim: Rezhim;
  count: number;
  podskazki: boolean;
}

export interface TrenazherKonfiguratorProps {
  zadanie: Zadanie;
  metody: MetodKarta[];
  rezhimy: readonly RezhimPlitka[];
  /** Счётчики тренажёра по методам: кружок на карточке метода. */
  tally: Record<string, TrainerKindTally>;
  preset?: TrenazherPreset | null;
  /** Средняя длительность задачи в секундах — для «≈ N минут». */
  sekundNaZadachu: number;
  onStart: (zapros: TrenazherZapros) => void;
  /** Прогресс по методам — под конфигуратором. */
  stats?: ReactNode;
}

/** Перемешанные стрелки: режим «Вперемешку». */
function ShuffleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 7h3.5c1.5 0 2.6.7 3.4 1.9l4.2 6.2c.8 1.2 1.9 1.9 3.4 1.9H21" />
      <path d="M3 17h3.5c1.5 0 2.6-.7 3.4-1.9l.6-.9M14.1 9.8l.6-.9c.8-1.2 1.9-1.9 3.4-1.9H21" />
      <path d="M18.5 4.5 21 7l-2.5 2.5M18.5 14.5 21 17l-2.5 2.5" />
    </svg>
  );
}

/** Крестик кнопки «убрать метод». */
function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M7 7l10 10M17 7 7 17" />
    </svg>
  );
}

/** Маленькое кольцо доли верных на карточке метода. */
function MiniRing({ value }: { value: number }) {
  const r = 8;
  const dlina = 2 * Math.PI * r;
  const dolya = Math.min(100, Math.max(0, value));
  return (
    <svg className="vtr-karta__ring" viewBox="0 0 22 22" aria-hidden="true">
      <circle className="vtr-karta__ring-track" cx="11" cy="11" r={r} />
      <circle
        className="vtr-karta__ring-fill"
        cx="11"
        cy="11"
        r={r}
        strokeDasharray={dlina.toFixed(2)}
        strokeDashoffset={(dlina * (1 - dolya / 100)).toFixed(2)}
      />
    </svg>
  );
}

/** Значок плитки режима. */
function rezhimIkonka(id: Rezhim): ReactNode {
  switch (id) {
    case 'practice':
      return <NavIcon name="target" />;
    case 'mixed':
      return <ShuffleIcon />;
    case 'mistakes':
      return <TaskCountIcon />;
    case 'uznay':
      return <HintIcon />;
  }
}

/* Режимы, в которых выбор методов не участвует: задачи идут по всему банку. */
function bezVybora(rezhim: Rezhim): boolean {
  return rezhim !== 'practice';
}

/**
 * Конфигуратор тренировки заданий №4 и №5 — по макету trenazher.png.
 *
 * Три шага слева: карточки методов с числом задач в банке и кружком
 * доли верных (плитка «Выбрать все» в конце), четыре плитки режима,
 * чипы количества. Справа — закреплённая сводка: выбранные методы с
 * крестиками, режим и количество (их можно поменять, но не убрать),
 * переключатель подсказок, кнопка запуска и оценка времени. Последний
 * выбранный метод снять нельзя: пустую тренировку не собрать.
 */
export function TrenazherKonfigurator({
  zadanie,
  metody,
  rezhimy,
  tally,
  preset = null,
  sekundNaZadachu,
  onStart,
  stats,
}: TrenazherKonfiguratorProps) {
  const slova = TRENAZHER_SLOVA;
  const id = useId();
  const pervyy = metody.find((m) => m.id === preset?.skill) ?? metody[0];
  const [vybrano, setVybrano] = useState<string[]>(pervyy === undefined ? [] : [pervyy.id]);
  const [rezhim, setRezhim] = useState<Rezhim>(preset?.mode ?? rezhimy[0]?.id ?? 'practice');
  const [count, setCount] = useCountChoice();
  const [podskazki, setPodskazki] = useState(true);

  const vybrannye = metody.filter((m) => vybrano.includes(m.id));
  const vsegoVBanke = metody.reduce((sum, m) => sum + m.count, 0);
  const vseVybrany = vybrannye.length === metody.length;
  const tekushchiy = rezhimy.find((r) => r.id === rezhim);
  const maksimum = bezVybora(rezhim)
    ? (tekushchiy?.total ?? 0)
    : vybrannye.reduce((sum, m) => sum + m.count, 0);
  const vybranoZadach = countOf(count, maksimum);
  const minut = Math.max(1, Math.round(((vybranoZadach ?? 0) * sekundNaZadachu) / 60));

  function pereklyuchit(metodId: string) {
    const dalshe = vybrano.includes(metodId)
      ? vybrano.filter((m) => m !== metodId)
      : [...vybrano, metodId];
    if (dalshe.length === 0) {
      return;
    }
    setVybrano(dalshe);
  }

  function vybratVse() {
    setVybrano(vseVybrany ? (pervyy === undefined ? [] : [pervyy.id]) : metody.map((m) => m.id));
  }

  function start() {
    if (vybranoZadach === null || vybrannye.length === 0) {
      return;
    }
    onStart({ metody: vybrannye.map((m) => m.id), rezhim, count: vybranoZadach, podskazki });
  }

  const knopka = (
    <Button className="vtr-svodka__start" size="lg" onClick={start} disabled={vybranoZadach === null}>
      {slova.svodka.start} →
    </Button>
  );

  return (
    <div className="cfg vtr">
      <div className="cfg__layout vtr__layout">
        <div className="cfg__steps vtr__steps">
          {/* Шаг 1: методы. */}
          <section className="cfg-step vtr-step" aria-labelledby={`${id}-metody`}>
            <StepHead
              id={`${id}-metody`}
              no={slova.metody.step}
              title={slova.metody.title}
              lead={slova.metody.lead}
            />
            <div className="vtr-karty" role="group" aria-labelledby={`${id}-metody`}>
              {metody.map((m) => {
                const checked = vybrano.includes(m.id);
                const t = tally[m.id];
                const dolya = t === undefined || t.done === 0 ? 0 : (t.right / t.done) * 100;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    className={clsx('vtr-karta', checked && 'is-checked')}
                    onClick={() => pereklyuchit(m.id)}
                  >
                    {checked ? (
                      <span className="vtr-karta__check" aria-hidden="true">
                        <CheckIcon />
                      </span>
                    ) : null}
                    <MetodKartinka zadanie={zadanie} metod={m.id} nazvanie={m.title} />
                    <span className="vtr-karta__title">{m.title}</span>
                    <span className="vtr-karta__count">{slova.metody.vBanke(m.count)}</span>
                    <span className="vtr-karta__dolya">
                      <MiniRing value={dolya} />
                      <span>
                        {Math.round(dolya)}%
                        <span className="sr-only"> {slova.metody.progress}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                className={clsx('vtr-karta', 'vtr-karta--vse', vseVybrany && 'is-checked')}
                aria-pressed={vseVybrany}
                onClick={vybratVse}
              >
                <span className="vtr-karta__plus" aria-hidden="true">
                  +
                </span>
                <span className="vtr-karta__title">{slova.metody.vse}</span>
                <span className="vtr-karta__count">{slova.metody.vseLead(vsegoVBanke)}</span>
              </button>
            </div>
          </section>

          <div className="vtr-dva">
            {/* Шаг 2: режим. */}
            <section className="cfg-step vtr-step" aria-labelledby={`${id}-rezhim`}>
              <StepHead
                id={`${id}-rezhim`}
                no={slova.rezhim.step}
                title={slova.rezhim.title}
                lead={slova.rezhim.lead}
              />
              <div className="vtr-rezhimy" role="radiogroup" aria-labelledby={`${id}-rezhim`}>
                {rezhimy.map((r) => {
                  const locked = r.locked === true;
                  const checked = rezhim === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      className={clsx('vtr-rezhim', checked && 'is-checked')}
                      disabled={locked}
                      onClick={() => setRezhim(r.id)}
                    >
                      {checked ? (
                        <span className="vtr-rezhim__check" aria-hidden="true">
                          <CheckIcon />
                        </span>
                      ) : null}
                      {r.id === 'mistakes' && r.total > 0 ? (
                        <span className="vtr-rezhim__schet" aria-hidden="true">
                          {r.total}
                        </span>
                      ) : null}
                      {r.id === 'uznay' ? (
                        <span className="vtr-rezhim__novoe">{slova.rezhim.novoe}</span>
                      ) : null}
                      <span className="vtr-rezhim__ico" aria-hidden="true">
                        {rezhimIkonka(r.id)}
                      </span>
                      <span className="vtr-rezhim__title">{r.title}</span>
                      <span className="vtr-rezhim__lead">
                        {r.id === 'mistakes'
                          ? locked
                            ? slova.rezhim.netOshibok
                            : slova.rezhim.oshibok(r.total)
                          : r.lead}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Шаг 3: сколько задач. */}
            <section className="cfg-step vtr-step" aria-labelledby={`${id}-skolko`}>
              <StepHead
                id={`${id}-skolko`}
                no={slova.skolko.step}
                title={slova.skolko.title}
                lead={slova.skolko.lead}
              />
              <div className="cfg-params vtr-skolko">
                <CountPicker
                  id={`${id}-count`}
                  label={slova.skolko.title}
                  max={maksimum}
                  value={count}
                  onChange={setCount}
                  allWord={slova.skolko.all}
                />
              </div>
            </section>
          </div>
        </div>

        {/* Сводка справа: закреплена на широком экране. */}
        <aside className="cfg-summary vtr-svodka" aria-labelledby={`${id}-svodka`}>
          <h3 className="cfg-summary__title" id={`${id}-svodka`}>
            {slova.svodka.title}
          </h3>

          <p className="vtr-svodka__label">
            {bezVybora(rezhim) ? slova.svodka.vseMetody : slova.svodka.metody(vybrannye.length)}
          </p>
          <ul className="vtr-svodka__list">
            {(bezVybora(rezhim) ? metody : vybrannye).map((m) => (
              <li key={m.id} className="vtr-svodka__row">
                <MetodIkonka zadanie={zadanie} metod={m.id} size="sm" />
                <span className="vtr-svodka__name">{m.title}</span>
                {/* Крестик — только у методов в отработке и не у последнего. */}
                {!bezVybora(rezhim) && vybrannye.length > 1 ? (
                  <button
                    type="button"
                    className="vtr-svodka__x"
                    aria-label={`${slova.svodka.ubrat}: ${m.title}`}
                    onClick={() => pereklyuchit(m.id)}
                  >
                    <CrossIcon />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>

          <p className="vtr-svodka__label">{slova.svodka.rezhim}</p>
          <div className="vtr-svodka__row vtr-svodka__row--plashka">
            <span className="vtr-svodka__ico" aria-hidden="true">
              {rezhimIkonka(rezhim)}
            </span>
            <span className="vtr-svodka__name">
              <b>{tekushchiy?.title}</b>
              <small>{tekushchiy?.lead}</small>
            </span>
          </div>

          <p className="vtr-svodka__label">{slova.svodka.skolko}</p>
          <div className="vtr-svodka__row vtr-svodka__row--plashka">
            <span className="vtr-svodka__ico" aria-hidden="true">
              <TaskCountIcon />
            </span>
            <span className="vtr-svodka__name">
              <b>
                {vybranoZadach === null
                  ? '—'
                  : counted(vybranoZadach, 'задача', 'задачи', 'задач')}
              </b>
            </span>
          </div>

          <label className="vtr-toggle">
            <span className="vtr-toggle__label">{slova.svodka.podskazki}</span>
            <input
              type="checkbox"
              role="switch"
              checked={podskazki}
              onChange={(event) => setPodskazki(event.target.checked)}
            />
            <span className="vtr-toggle__track" aria-hidden="true" />
          </label>

          {knopka}
          <p className="vtr-svodka__minut">{slova.svodka.minut(minut)}</p>
        </aside>
      </div>

      {/* На узком экране сводка уходит под шаги — кнопка запуска липнет снизу. */}
      <div className="cfg-bar vtr-bar">
        {knopka}
        <p className="cfg-bar__summary">
          {tekushchiy?.title} · {vybranoZadach === null ? '—' : counted(vybranoZadach, 'задача', 'задачи', 'задач')} · {slova.svodka.minut(minut)}
        </p>
      </div>

      {stats}
    </div>
  );
}
