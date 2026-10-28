'use client';

import Link from 'next/link';
import { useId, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Button, Input } from '@/components/ui';
import { OPORNYE_3 } from '@/content/stereo/opornye3';
import { nextUnsolved, type TaskStatus } from '@/lib/prepOrder';
import { scrollTabTo } from '@/lib/tabScroll';
import { itog3, opornye3, zapisat3 } from '@/lib/stereo/opornye3/progress';
import type { RazborOp3, ShagPodskazkiHtml, ZadachaOp3Sealed } from '@/lib/stereo/opornye3/seal';
import { answerMatches, choiceMatches, openText } from '@/lib/stereo/opornye3/secret';
import { IkGalochka, IkInfo, IkLampa, IkNazad, IkVpered, IkZadacha } from '../metodika/Ikonki';
import { ItogBloka } from './ItogBloka';
import { NazhmiRisunok, NazhmiVarianty } from './NazhmiChertezh';
import { PodskazkaShagi } from './PodskazkaShagi';

export interface OpornyeStereoScreenProps {
  blokId: string;
  no: number;
  title: string;
  umenie: string;
  tasks: ZadachaOp3Sealed[];
  /** Живые чертежи задач, собранные на сборке (у «нажми» — свой, интерактивный). */
  risunki: ReactNode[];
  /** Миниатюры чертежей задач для плиток итога (SVG без подписей). */
  miniatyury: string[];
  listHref: string;
  teoriyaHref: string;
  /** Название главы теории блока: в итоге. */
  glava: string;
  trenazherHref: string;
}

function izJson<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function firstOpen(status: TaskStatus[]): number {
  const found = status.findIndex((item) => item === null || item === 'skipped');
  return found === -1 ? 0 : found;
}

/**
 * Экран блока опорных задач №3 (макеты этапа 1). Задача — карточкой:
 * метка «Задача k из n», условие с оранжевой чертой, крупный чертёж,
 * плашка-инструкция, ответ (число, выбор, касание чертежа или плоский
 * чертёж), «Проверить» и «Подсказка», точки прогресса. Подсказка по
 * шагам ①–⑤ — панелью справа (на телефоне — под чертежом). Когда все
 * задачи закрыты — итог блока.
 */
export function OpornyeStereoScreen({
  blokId,
  no,
  title,
  umenie,
  tasks,
  risunki,
  miniatyury,
  listHref,
  teoriyaHref,
  glava,
  trenazherHref,
}: OpornyeStereoScreenProps) {
  const progress = opornye3.useProgress();
  const labelId = useId();
  const [attempts, setAttempts] = useState<Record<string, 'wrong' | 'skipped'>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [shagi, setShagi] = useState<ShagPodskazkiHtml[] | null>(null);
  const [razbor, setRazbor] = useState<RazborOp3 | null>(null);
  /* Итог блока виден, пока ученик сам не открыл задачу. */
  const [vZadache, setVZadache] = useState(false);

  const status: TaskStatus[] = tasks.map((t) => {
    const itog = itog3(progress, t.id);
    if (itog === 'right') return 'right';
    if (itog !== null) return 'wrong';
    return attempts[t.id] ?? null;
  });
  const index = picked ?? firstOpen(status);
  const task = tasks[index];
  if (task === undefined) return null;
  const total = tasks.length;
  const nextOpen = nextUnsolved(status, index);
  const done = status.every((s) => s === 'right' || s === 'wrong');
  const solved = checked === 'right';
  const ready = value.trim() !== '';
  const pokazatItog = done && !vZadache;

  function reset() {
    setValue('');
    setChecked(null);
    setShagi(null);
    setRazbor(null);
  }

  function open(next: number) {
    setPicked(next);
    setVZadache(true);
    reset();
    scrollTabTo('.o3-zad');
  }

  function check() {
    if (!ready || task === undefined) return;
    const ok =
      task.vid === 'chislo' ? answerMatches(value, task.seal) : choiceMatches(value, task.seal);
    setPicked(index);
    setVZadache(true);
    setChecked(ok ? 'right' : 'wrong');
    zapisat3(blokId, task.id, ok ? 'right' : 'wrong');
    if (!ok) setAttempts((prev) => ({ ...prev, [task.id]: 'wrong' }));
  }

  function skip() {
    if (task === undefined) return;
    setAttempts((prev) => ({ ...prev, [task.id]: 'skipped' }));
    if (nextOpen !== null) open(nextOpen);
  }

  function showSolution() {
    if (task === undefined) return;
    setRazbor(izJson<RazborOp3>(openText(task.razbor, task.id)));
    if (status[index] !== 'right') zapisat3(blokId, task.id, 'revealed');
  }

  function kItogu() {
    setVZadache(false);
    reset();
    scrollTabTo('.o3-blok');
  }

  const pick = (v: string) => {
    if (solved) return;
    setValue(v);
    setChecked(null);
  };

  const podskazka =
    shagi === null ? null : (
      <PodskazkaShagi
        key={task.id}
        shagi={shagi}
        model={task.model}
        onClose={() => setShagi(null)}
      />
    );

  return (
    <section className="o3-blok">
      <p className="o3-blok__umenie">
        {OPORNYE_3.umenie}: <b>{umenie}</b>
      </p>

      {pokazatItog ? (
        <ItogBloka
          nazvanie={`${no}. ${title}`}
          plitki={tasks.map((t, i) => ({
            no: t.no,
            kratkoHtml: t.kratkoHtml,
            miniatyura: miniatyury[i] ?? '',
            verno: status[i] === 'right',
          }))}
          teoriyaHref={teoriyaHref}
          glava={glava}
          listHref={listHref}
          trenazherHref={trenazherHref}
          onOtkryt={open}
        />
      ) : (
        <div className={clsx('o3-zad', podskazka !== null && 'has-pod')}>
          <div className="o3-zad__verh">
            <div className="o3-zad__metki">
              <p className="o3-plashka o3-zad__nomer">
                <IkZadacha className="o3-plashka__ik" />
                {OPORNYE_3.zadacha(task.no, total)}
              </p>
              <span className="o3-zad__lv" aria-label={`Уровень ${task.uroven} из 3`}>
                {OPORNYE_3.uroven(task.uroven)}
              </span>
              <span className="o3-zad__src">{OPORNYE_3.istochnik[task.istochnik]}</span>
              <span className="o3-zad__strelki">
                <button
                  type="button"
                  className="o3-schet__btn"
                  aria-label={OPORNYE_3.nazad}
                  disabled={index === 0}
                  onClick={() => open(index - 1)}
                >
                  <IkNazad />
                </button>
                <button
                  type="button"
                  className="o3-schet__btn"
                  aria-label={OPORNYE_3.vpered}
                  disabled={index === total - 1}
                  onClick={() => open(index + 1)}
                >
                  <IkVpered />
                </button>
              </span>
            </div>
            <div
              className="o3-zad__uslovie"
              dangerouslySetInnerHTML={{ __html: task.uslovieHtml }}
            />
            <div className="o3-zad__ris">
              {task.vid === 'nazhmi' ? (
                <NazhmiRisunok
                  task={task}
                  value={value}
                  onPick={pick}
                  disabled={solved}
                  proverka={checked}
                />
              ) : (
                risunki[index]
              )}
            </div>
          </div>

          {podskazka}

          <div className="o3-zad__niz">
            <p className="o3-info">
              <IkInfo className="o3-info__ik" />
              <span>{OPORNYE_3.instruktsiya[task.vid]}</span>
            </p>
            <p className="o3-zad__label" id={labelId}>
              {OPORNYE_3.vid[task.vid]}
            </p>

            {task.vid === 'chislo' ? (
              <Input
                className="o3-zad__input"
                value={value}
                state={checked === null ? 'default' : solved ? 'success' : 'error'}
                inputMode="decimal"
                autoComplete="off"
                aria-labelledby={labelId}
                readOnly={solved}
                onChange={(event) => pick(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') check();
                }}
              />
            ) : null}

            {task.vid === 'nazhmi' ? (
              <NazhmiVarianty
                task={task}
                value={value}
                onPick={pick}
                disabled={solved}
                proverka={checked}
                labelId={labelId}
              />
            ) : null}

            {task.vid === 'vybor' ? (
              <ul className="o3-var o3-var--odna" aria-labelledby={labelId}>
                {(task.varianty ?? []).map((html, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className={clsx(
                        'o3-var__btn',
                        value === String(i) && 'is-chosen',
                        value === String(i) && checked !== null && `is-${checked}`,
                      )}
                      aria-pressed={value === String(i)}
                      disabled={solved}
                      onClick={() => pick(String(i))}
                    >
                      <span className="o3-var__box" aria-hidden="true" />
                      <span className="o3-var__t" dangerouslySetInnerHTML={{ __html: html }} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {task.vid === 'ploskiy' ? (
              <ul className="o3-ploskie" aria-labelledby={labelId}>
                {(task.ploskie ?? []).map((svg, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className={clsx(
                        'o3-plosk',
                        value === String(i) && 'is-chosen',
                        value === String(i) && checked !== null && `is-${checked}`,
                      )}
                      aria-pressed={value === String(i)}
                      disabled={solved}
                      onClick={() => pick(String(i))}
                    >
                      <span className="o3-plosk__no">{OPORNYE_3.plosk(i + 1)}</span>
                      <span className="o3-plosk__svg" dangerouslySetInnerHTML={{ __html: svg }} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {checked === null ? null : (
              <div className={clsx('pverdict', `pverdict--${checked}`)} role="status">
                <p className="pverdict__title">
                  {checked === 'right' ? OPORNYE_3.verno.title : OPORNYE_3.neverno.title}
                </p>
                <p className="pverdict__lead">
                  {checked === 'right' ? OPORNYE_3.verno.lead : OPORNYE_3.neverno.lead}
                </p>
              </div>
            )}

            {razbor === null ? null : (
              <div className="o3-reshenie" role="region" aria-label={OPORNYE_3.uchenik}>
                <p className="o3-reshenie__title">{OPORNYE_3.uchenik}</p>
                <ol
                  className="o3-razbor"
                  dangerouslySetInnerHTML={{ __html: razbor.uchenikHtml }}
                />
                <details className="o3-uchitel">
                  <summary>{OPORNYE_3.uchitel}</summary>
                  <div dangerouslySetInnerHTML={{ __html: razbor.uchitelHtml }} />
                </details>
                <p className="o3-otvet">
                  {OPORNYE_3.otvet}: <span dangerouslySetInnerHTML={{ __html: razbor.otvetHtml }} />
                </p>
              </div>
            )}

            <div className="o3-zad__knopki">
              {!solved ? (
                <>
                  <Button className="o3-btn-glavnaya" onClick={check} disabled={!ready}>
                    <IkGalochka />
                    {OPORNYE_3.proverit}
                  </Button>
                  <Button
                    variant="secondary"
                    className="o3-btn-podskazka"
                    aria-expanded={shagi !== null}
                    onClick={() =>
                      setShagi(
                        shagi === null
                          ? izJson<ShagPodskazkiHtml[]>(openText(task.podskazki, task.id))
                          : null,
                      )
                    }
                  >
                    <IkLampa />
                    {shagi === null ? OPORNYE_3.podskazka : OPORNYE_3.skrytPodskazku}
                  </Button>
                  {checked !== null ? (
                    <Button variant="ghost" onClick={showSolution} disabled={razbor !== null}>
                      {OPORNYE_3.reshenie}
                    </Button>
                  ) : (
                    <Button variant="ghost" onClick={skip}>
                      {OPORNYE_3.propustit}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {done ? (
                    <Button className="o3-btn-glavnaya" onClick={kItogu}>
                      {OPORNYE_3.kItogu}
                    </Button>
                  ) : nextOpen === null ? (
                    <Link className="btn btn--primary" href={listHref}>
                      {OPORNYE_3.kListu}
                    </Link>
                  ) : (
                    <Button className="o3-btn-glavnaya" onClick={() => open(nextOpen)}>
                      {nextOpen === index + 1 ? OPORNYE_3.dalshe : OPORNYE_3.dalsheNereshennaya}
                      <IkVpered />
                    </Button>
                  )}
                  <Button variant="ghost" onClick={showSolution} disabled={razbor !== null}>
                    {OPORNYE_3.reshenie}
                  </Button>
                </>
              )}
            </div>

            <nav className="o3-tochki" aria-label="Задачи блока">
              <span className="o3-tochki__t" aria-hidden="true">
                {OPORNYE_3.izN(task.no, total)}
              </span>
              <ol className="o3-tochki__list">
                {tasks.map((t, i) => {
                  const s = status[i] ?? null;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        className={clsx(
                          'o3-tochka',
                          s !== null && `is-${s}`,
                          i === index && 'is-current',
                        )}
                        aria-current={i === index ? 'step' : undefined}
                        onClick={() => open(i)}
                      >
                        <span className="sr-only">
                          {OPORNYE_3.zadacha(t.no, total)}
                          {s === 'right' ? ' — решено верно' : null}
                          {s === 'wrong' ? ' — решено неверно' : null}
                          {s === 'skipped' ? ' — пропущено' : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              {done ? (
                <button type="button" className="o3-tochki__itog" onClick={kItogu}>
                  {OPORNYE_3.kItogu}
                </button>
              ) : null}
            </nav>
          </div>
        </div>
      )}
    </section>
  );
}
