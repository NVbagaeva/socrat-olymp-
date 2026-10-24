'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, Input, ProgressBar } from '@/components/ui';
import { TRENAZHER_13 } from '@/content/zadanie13';
import type { TaskMark } from '@/lib/trainerSession/types';
import { checkSealed, type Verdict } from '@/lib/zadanie13/edinicy';
import type { Razbor13, ShagHtml } from '@/lib/zadanie13/opornye/seal';
import { trenazher13 } from '@/lib/zadanie13/progress';
import { answerMatches, choiceMatches, openText } from '@/lib/zadanie13/secret';
import { klyuch13, type Rezhim13 } from '@/lib/zadanie13/trenazher/plan';
import type { Oformlenie13, Zadacha13T } from '@/lib/zadanie13/trenazher/zadacha';
import { TYPE_NAMES, type TypeCode } from '@/lib/zadanie13/types';
import { useSessionReport } from '../session/useSessionReport';
import { HintFlow11 } from '../zadanie11/HintFlow11';
import type { Trenazher13Ui } from './trenazher13Sessiya';

/** Куда вести из задачи: глава теории и первый опорный блок схемы. */
const SSYLKI: Record<TypeCode, { teoriya: string; opornyy: string }> = {
  A: { teoriya: 'dif', opornyy: 'pereplata' },
  B: { teoriya: 'polomannyy', opornyy: 'dve-stavki' },
  C: { teoriya: 'annuitet', opornyy: 'ravnye-platezhi' },
  D: { teoriya: 'vklady', opornyy: 'celyy-vklad' },
};

export function otkryt13<T>(z: Zadacha13T, blob: string): T | null {
  try {
    return JSON.parse(openText(blob, z.seal)) as T;
  } catch {
    return null;
  }
}

export interface Trenazher13ResheniePropsy {
  zadachi: Zadacha13T[];
  rezhim: Rezhim13;
  base: string;
  restored: Trenazher13Ui | null;
  report: (ui: Trenazher13Ui) => void;
  elapsed: () => number;
  onKonets: () => void;
}

/** Шаг-вопрос с кнопками: неверная гаснет, верная ведёт дальше. */
function ShagVybor({
  title,
  shag,
  onVerno,
  onMimo,
}: {
  title: string;
  shag: ShagHtml;
  onVerno: () => void;
  onMimo: () => void;
}) {
  const [mimo, setMimo] = useState<number[]>([]);
  return (
    <section className="z13-of__shag">
      <p className="z13-of__no">{title}</p>
      <p className="z13-of__q" dangerouslySetInnerHTML={{ __html: shag.question }} />
      <div className="z11-hint__opts">
        {shag.options.map((o, k) => (
          <button
            key={k}
            type="button"
            className={clsx('z11-hint__opt', mimo.includes(k) && 'is-wrong')}
            disabled={mimo.includes(k)}
            onClick={() => {
              if (k === shag.correct) {
                onVerno();
              } else {
                setMimo([...mimo, k]);
                onMimo();
              }
            }}
            dangerouslySetInnerHTML={{ __html: o }}
          />
        ))}
      </div>
      {mimo.length > 0 ? <p className="z11-hint__oops">{TRENAZHER_13.nevernoHint}</p> : null}
    </section>
  );
}

/** Пройденный шаг-вопрос: вопрос, верный ответ и комментарий. */
function ShagProyden({ shag }: { shag: ShagHtml }) {
  return (
    <div className="z13-of__done">
      <span dangerouslySetInnerHTML={{ __html: shag.question }} />{' '}
      <b dangerouslySetInnerHTML={{ __html: shag.options[shag.correct] ?? '' }} />
      {shag.comment === null ? null : (
        <span
          className="z13-of__comment"
          dangerouslySetInnerHTML={{ __html: ` ${shag.comment}` }}
        />
      )}
    </div>
  );
}

/** Решение по шагам: на экране задачи и в разборе на итогах. */
export function Razbor13Blok({ razbor }: { razbor: Razbor13 }) {
  return (
    <section className="z13-oreshenie" aria-label={TRENAZHER_13.reshenie}>
      <p className="z13-oreshenie__title">{TRENAZHER_13.reshenie}</p>
      <ol className="z13-shagi">
        {razbor.shagi.map((s, i) => (
          <li key={i}>
            <b className="z13-shagi__title" dangerouslySetInnerHTML={{ __html: `${s.title}.` }} />{' '}
            <span dangerouslySetInnerHTML={{ __html: s.text }} />
            {s.formula === null ? null : (
              <div className="z13-formula" dangerouslySetInnerHTML={{ __html: s.formula }} />
            )}
            {s.tablitsa === null ? null : <div dangerouslySetInnerHTML={{ __html: s.tablitsa }} />}
          </li>
        ))}
      </ol>
      <p className="z13-otvet">
        {TRENAZHER_13.otvet}: {razbor.otvet}
      </p>
    </section>
  );
}

export function Trenazher13Review({ zadacha }: { zadacha: Zadacha13T }) {
  const razbor = useMemo(() => otkryt13<Razbor13>(zadacha, zadacha.razbor), [zadacha]);
  return razbor === null ? null : <Razbor13Blok razbor={razbor} />;
}

/**
 * Экран задачи тренажёра №13.
 *
 * «Ответ» — поле числа (или выбор схемы в «Определи тип»), подсказка
 * по шагам по кнопке, решение — после ошибки. «С оформлением» — перед
 * ответом три шага: схема, первая строка таблицы (клетки проверяются
 * сразу), шаги решения вопросами. Ответ в чужих единицах — «Число
 * верное, единицы нет», не засчитывается. Верно без ошибок и подсказок —
 * начисто; иначе задача засчитана с подсказкой и остаётся в ошибках.
 */
export function Trenazher13Reshenie({
  zadachi,
  rezhim,
  base,
  restored,
  report,
  elapsed,
  onKonets,
}: Trenazher13ResheniePropsy) {
  const [index, setIndex] = useState(restored?.index ?? 0);
  const [otmetki, setOtmetki] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});
  const [value, setValue] = useState(restored?.value ?? '');
  const [checked, setChecked] = useState<Verdict | null>(restored?.checked ?? null);
  const [oshibalsya, setOshibalsya] = useState(restored?.oshibalsya ?? false);
  const [hintOpen, setHintOpen] = useState(restored?.hintOpen ?? false);
  const [etap, setEtap] = useState(restored?.etap ?? 0);
  const [kletki, setKletki] = useState<Record<string, string>>(restored?.kletki ?? {});
  const [verno, setVerno] = useState<string[]>(restored?.vernyeKletki ?? []);
  const [razborOtkryt, setRazborOtkryt] = useState(restored?.razborOtkryt ?? false);
  const [nachalo, setNachalo] = useState(() => restored?.taskFrom ?? elapsed());
  const [mimoKletki, setMimoKletki] = useState<string[]>([]);

  const zadacha = zadachi[index];
  const of = useMemo(
    () =>
      zadacha === undefined || zadacha.oformlenie === null || rezhim !== 'oformlenie'
        ? null
        : otkryt13<Oformlenie13>(zadacha, zadacha.oformlenie),
    [zadacha, rezhim],
  );
  const shagiHint = useMemo(
    () =>
      zadacha === undefined || !hintOpen ? null : otkryt13<ShagHtml[]>(zadacha, zadacha.podskazki),
    [zadacha, hintOpen],
  );
  const razbor = useMemo(
    () =>
      zadacha === undefined || !razborOtkryt ? null : otkryt13<Razbor13>(zadacha, zadacha.razbor),
    [zadacha, razborOtkryt],
  );

  useSessionReport<Trenazher13Ui>(report, {
    index,
    marks: otmetki,
    tried,
    order: null,
    value,
    checked,
    oshibalsya,
    hintOpen,
    etap,
    kletki,
    vernyeKletki: verno,
    razborOtkryt,
    taskFrom: nachalo,
  });

  if (zadacha === undefined) {
    return null;
  }
  const z: Zadacha13T = zadacha;
  const total = zadachi.length;
  const zakryta = checked === 'right' || razborOtkryt;
  /* Этапы оформления: 0 — схема, 1 — строка таблицы, 2… — шаги решения. */
  const etapStroki = of !== null && of.stroka !== null;
  const etapOtveta = of === null ? 0 : 2 + of.shagi.length;
  const kOtvetu = of === null || etap >= etapOtveta;
  const tipZadachi = z.vid === 'tip';
  const ssylka = SSYLKI[z.type];

  function sekund(): number {
    return nachalo === null ? 0 : (elapsed() - nachalo) / 1000;
  }

  function zapisat(itog: 'right' | 'wrong' | 'revealed', chisto: boolean) {
    trenazher13.recordAttempt({
      kind: z.prototypeId,
      taskId: klyuch13(z),
      right: itog === 'right',
      clean: chisto,
      seconds: sekund(),
      itog,
    });
  }

  function oshibka() {
    setOshibalsya(true);
    setTried((prev) => ({ ...prev, [index]: true }));
  }

  function proverit() {
    if (value.trim() === '' || zakryta) return;
    const v: Verdict =
      z.vybory === null
        ? checkSealed(value, { answer: z.seal, wrongUnits: z.wrongUnits }, answerMatches)
        : choiceMatches(value, z.seal)
          ? 'right'
          : 'wrong';
    setChecked(v);
    if (v === 'right') {
      const chisto = !oshibalsya && !hintOpen;
      zapisat('right', chisto);
      setOtmetki((prev) =>
        prev[index] === undefined ? { ...prev, [index]: chisto ? 'right' : 'hinted' } : prev,
      );
    } else {
      oshibka();
    }
  }

  function proveritKletku(key: string, seal: string) {
    const input = kletki[key] ?? '';
    if (input.trim() === '' || verno.includes(key)) return;
    if (answerMatches(input, seal)) {
      const next = [...verno, key];
      setVerno(next);
      setMimoKletki((prev) => prev.filter((k) => k !== key));
      dalsheSoStroki(next);
    } else {
      setMimoKletki((prev) => (prev.includes(key) ? prev : [...prev, key]));
      oshibka();
    }
  }

  function pokazatKletku(key: string) {
    const next = [...verno, key];
    setVerno(next);
    setOshibalsya(true);
    dalsheSoStroki(next);
  }

  function dalsheSoStroki(next: string[]) {
    const nuzhno = of?.stroka?.kletki.filter((k) => k.seal !== null).length ?? 0;
    if (next.length >= nuzhno) setEtap(2);
  }

  function pokazatReshenie() {
    setRazborOtkryt(true);
    if (checked !== 'right') {
      zapisat('revealed', false);
      setTried((prev) => ({ ...prev, [index]: true }));
    }
  }

  function dalshe() {
    if (otmetki[index] === undefined && !razborOtkryt) {
      zapisat('wrong', false);
    }
    if (index + 1 >= total) {
      onKonets();
      return;
    }
    setNachalo(elapsed());
    setIndex(index + 1);
    setValue('');
    setChecked(null);
    setOshibalsya(false);
    setHintOpen(false);
    setEtap(0);
    setKletki({});
    setVerno([]);
    setMimoKletki([]);
    setRazborOtkryt(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <section className="z13-resh">
      <header className="z13-resh__top">
        <ProgressBar
          className="z13-resh__bar"
          value={((index + 1) / total) * 100}
          label={TRENAZHER_13.zadacha(index + 1, total)}
        />
        <span className="z13-metka">{TRENAZHER_13.badge[z.istochnik]}</span>
        {z.metki.map((m) => (
          <span key={m} className="z13-metka">
            {m}
          </span>
        ))}
      </header>

      <article className="z13-resh__uslovie">
        <div className="z13-resh__text" dangerouslySetInnerHTML={{ __html: z.uslovieHtml }} />
        {z.tablitsaHtml === null ? null : (
          <div className="z13-ptask__tab" dangerouslySetInnerHTML={{ __html: z.tablitsaHtml }} />
        )}
      </article>

      {of === null ? null : (
        <div className="z13-of" aria-live="polite">
          {etap === 0 ? (
            <ShagVybor
              key={`${index}-shema`}
              title={TRENAZHER_13.shagShema}
              shag={of.shema}
              onVerno={() => setEtap(etapStroki ? 1 : 2)}
              onMimo={oshibka}
            />
          ) : (
            <ShagProyden shag={of.shema} />
          )}

          {etap >= 1 && of.stroka !== null ? (
            <section className="z13-of__shag">
              <p className="z13-of__no">{TRENAZHER_13.shagStroka}</p>
              {etap === 1 ? <p className="z13-of__note">{TRENAZHER_13.shagStrokaNote}</p> : null}
              <div className="z13-of__stroka">
                <p className="z13-of__label">{of.stroka.label}</p>
                {of.stroka.kletki.map((k, i) => {
                  const key = String(i);
                  const gotovo = verno.includes(key);
                  return (
                    <div key={key} className="z13-of__kletka">
                      <span className="z13-of__title">{k.title}</span>
                      {k.seal === null ? (
                        <span
                          className="z13-of__dano"
                          dangerouslySetInnerHTML={{ __html: k.html ?? '' }}
                        />
                      ) : gotovo ? (
                        <span
                          className="z13-of__dano is-right"
                          dangerouslySetInnerHTML={{ __html: k.otvet ?? '' }}
                        />
                      ) : (
                        <span className="z13-of__vvod">
                          <Input
                            value={kletki[key] ?? ''}
                            inputMode="decimal"
                            autoComplete="off"
                            aria-label={`${of.stroka?.label ?? ''}: ${k.title}`}
                            state={mimoKletki.includes(key) ? 'error' : 'default'}
                            onChange={(e) => {
                              setKletki((prev) => ({ ...prev, [key]: e.target.value }));
                              setMimoKletki((prev) => prev.filter((x) => x !== key));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && k.seal !== null) proveritKletku(key, k.seal);
                            }}
                            onBlur={() => {
                              if (k.seal !== null) proveritKletku(key, k.seal);
                            }}
                          />
                          <button
                            type="button"
                            className="z13-of__pokazat"
                            onClick={() => pokazatKletku(key)}
                          >
                            {TRENAZHER_13.pokazatKletku}
                          </button>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {of.shagi.map((s, i) =>
            etap < 2 + i ? null : etap === 2 + i ? (
              <ShagVybor
                key={`${index}-${i}`}
                title={TRENAZHER_13.shagi(i + 1, of.shagi.length)}
                shag={s}
                onVerno={() => setEtap(3 + i)}
                onMimo={oshibka}
              />
            ) : (
              <ShagProyden key={`${index}-${i}`} shag={s} />
            ),
          )}
        </div>
      )}

      {!kOtvetu ? null : (
        <>
          {shagiHint === null || of !== null ? null : (
            <HintFlow11 key={`${index}-hint`} shagi={shagiHint} />
          )}

          {z.vybory !== null ? (
            <ul className="ptask__options z13-resh__vybory" aria-label={TRENAZHER_13.vybor}>
              {z.vybory.map((v) => (
                <li key={v.number}>
                  <button
                    type="button"
                    className={clsx(
                      'popt',
                      value === v.number && 'is-chosen',
                      value === v.number && checked !== null && `is-${checked}`,
                    )}
                    aria-pressed={value === v.number}
                    disabled={zakryta}
                    onClick={() => {
                      setValue(v.number);
                      setChecked(null);
                    }}
                  >
                    <span className="popt__no">{v.number}</span>
                    <span className="popt__text">{v.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="z13-resh__otvet">
            {z.vybory !== null ? null : (
              <Input
                className="z13-resh__input"
                value={value}
                placeholder={TRENAZHER_13.otvet}
                aria-label={TRENAZHER_13.otvet}
                inputMode="decimal"
                autoComplete="off"
                state={checked === null ? 'default' : checked === 'right' ? 'success' : 'error'}
                readOnly={zakryta}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (checked !== null && checked !== 'right') setChecked(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') proverit();
                }}
              />
            )}
            {zakryta ? (
              <Button onClick={dalshe}>
                {index + 1 >= total ? TRENAZHER_13.zavershit : TRENAZHER_13.dalee}
              </Button>
            ) : (
              <Button onClick={proverit} disabled={value.trim() === ''}>
                {TRENAZHER_13.proverit}
              </Button>
            )}
          </div>

          {checked === null ? null : (
            <div
              className={clsx('pverdict', `pverdict--${checked === 'right' ? 'right' : 'wrong'}`)}
              role="status"
            >
              <p className="pverdict__title">
                {
                  {
                    right: 'Верно!',
                    units: 'Число верное, единицы нет',
                    wrong: 'Пока неверно',
                  }[checked]
                }
              </p>
              {checked === 'units' ? (
                <p className="pverdict__lead">
                  Посмотрите, в чём просят ответ в условии. На ЕГЭ такой ответ — 0 баллов.
                </p>
              ) : null}
            </div>
          )}

          {razbor === null ? null : <Razbor13Blok razbor={razbor} />}
        </>
      )}

      <div className="z13-resh__dop">
        {of === null && !tipZadachi && !zakryta ? (
          <Button variant="ghost" onClick={() => setHintOpen(!hintOpen)}>
            {hintOpen ? TRENAZHER_13.skrytPodskazku : TRENAZHER_13.podskazka}
          </Button>
        ) : null}
        {!razborOtkryt && (checked !== null || (of !== null && kOtvetu)) ? (
          <Button variant="ghost" onClick={pokazatReshenie}>
            {TRENAZHER_13.pokazatReshenie}
          </Button>
        ) : null}
        {zakryta ? null : (
          <Button variant="ghost" onClick={dalshe}>
            {index + 1 >= total ? TRENAZHER_13.zavershit : TRENAZHER_13.propustit}
          </Button>
        )}
      </div>

      {/* Ссылки называют схему — показываем их, когда задача закрыта. */}
      {tipZadachi || !zakryta ? null : (
        <nav className="z13-resh__links" aria-label="Материалы к задаче">
          <Link href={`${base}/teoriya/#${ssylka.teoriya}`}>
            {TRENAZHER_13.teoriya}: {TYPE_NAMES[z.type].toLowerCase()}
          </Link>
          <Link href={`${base}/opornye-zadachi/${ssylka.opornyy}/`}>{TRENAZHER_13.opornye}</Link>
        </nav>
      )}
    </section>
  );
}
