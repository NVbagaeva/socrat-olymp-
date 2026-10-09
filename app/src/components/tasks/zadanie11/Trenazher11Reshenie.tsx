'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, Input, ProgressBar } from '@/components/ui';
import { useSessionReport } from '../session/useSessionReport';
import type { TaskMark } from '@/lib/trainerSession/types';
import { TRENAZHER_11 } from '@/content/zadanie11';
import { trenazher11 } from '@/lib/zadanie11/progress';
import { answerMatches, choiceMatches, openText } from '@/lib/zadanie11/secret';
import type { SsylkiRazdela } from '@/lib/zadanie11/trenazher/dannye';
import type { Podskazki11, Razbor11, Zadacha11 } from '@/lib/zadanie11/trenazher/zadacha';
import type { SectionId, Tablitsa } from '@/lib/zadanie11/types';
import { HintIcon } from '../prep/PrepIcons';
import { IkonkaRazdela, Piktogramma, tsvetRazdela, Zvezdy } from './Piktogrammy';
import { praviloOdinRaz } from './praviloProporcii';
import { Tablitsa11 } from './Tablitsa11';
import type { Trenazher11Ui } from './trenazher11Sessiya';

export interface Trenazher11ResheniePropsy {
  zadachi: Zadacha11[];
  podskazki: boolean;
  ssylki: Record<SectionId, SsylkiRazdela>;
  nazvaniya: Record<SectionId, string>;
  base: string;
  /** Состояние экрана из сохранённой тренировки. null — тренировка новая. */
  restored: Trenazher11Ui | null;
  /** Сообщить оболочке сессии о новом состоянии (она его сохранит). */
  report: (ui: Trenazher11Ui) => void;
  /** Активное время тренировки, мс: пауза и скрытая вкладка не идут. */
  elapsed: () => number;
  /** Последняя задача закрыта: показать итоги. */
  onKonets: () => void;
}

export function otkryt<T>(z: Zadacha11, blob: string): T | null {
  try {
    return JSON.parse(openText(blob, z.seal)) as T;
  } catch {
    return null;
  }
}

/**
 * Клетки таблиц, которые ученик заполняет сам: в них есть неизвестная
 * (x, y, z) — условие задачи даёт остальные. Порядок — по столбцам
 * слева направо: скорость раньше времени, как в подсказках.
 */
function pustyeKletki(tables: Tablitsa[]): string[] {
  const out: string[] = [];
  tables.forEach((t, ti) => {
    const cols = t.head.length;
    for (let c = 1; c < cols; c += 1) {
      t.rows.forEach((row, r) => {
        const cell = row[c] ?? '';
        const tex = cell.replace(/\\(?:dfrac|tfrac|frac|cdot|text|mathrm|times)/g, '');
        if (/[xyz]/.test(tex)) {
          out.push(`${ti}|${r}:${c}`);
        }
      });
    }
  });
  return out;
}

/**
 * Экран задачи тренажёра №11.
 *
 * Сверху — «Задача 3 из 15» и бейдж (банк ФИПИ / новая / разминка),
 * раздел со звёздами, условие. Подсказка — шаги вопросами с
 * кнопками; с каждым пройденным шагом заполняется часть таблицы
 * модели (пустые клетки пунктирные, их можно открыть нажатием).
 * Внизу закреплена строка ответа: запятая и точка равноправны.
 *
 * Исход задачи пишется в хранилище тренажёра по подтипу: верно без
 * подсказок — начисто; с подсказкой или после ошибки — верно, но
 * задача остаётся в «Моих ошибках»; открыл решение — не решена.
 */
export function Trenazher11Reshenie({
  zadachi,
  podskazki: sPodskazkami,
  ssylki,
  nazvaniya,
  base,
  restored,
  report,
  elapsed,
  onKonets,
}: Trenazher11ResheniePropsy) {
  /* Всё, что ученик успел сделать, приходит из сохранённой тренировки:
     вернувшись в тренажёр, он продолжает с того же места. */
  const [index, setIndex] = useState(restored?.index ?? 0);
  /* Отметки общие для сессии: 'right' — начисто, 'hinted' — с подсказкой
     или после ошибки. Неверные и пропущенные отметки не получают:
     ошибка запоминается в tried, пропуск — отсутствием записи. */
  const [otmetki, setOtmetki] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});
  const [value, setValue] = useState(restored?.value ?? '');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(restored?.checked ?? null);
  const [oshibalsya, setOshibalsya] = useState(restored?.oshibalsya ?? false);
  const [hintOpen, setHintOpen] = useState(restored?.hintOpen ?? false);
  const [shag, setShag] = useState(restored?.shag ?? 0);
  const [mimo, setMimo] = useState<number[]>(restored?.mimo ?? []);
  const [otkrytye, setOtkrytye] = useState<Set<string>>(new Set(restored?.otkrytye ?? []));
  /* Решение открыто: сам разбор достаётся из отпечатка заново. */
  const [razborOtkryt, setRazborOtkryt] = useState(restored?.razborOtkryt ?? false);
  /* Начало задачи (мс активного времени оболочки) — для времени
     в статистике; на следующей задаче ставится при переходе. */
  const [nachalo, setNachalo] = useState(() => restored?.taskFrom ?? elapsed());

  const zadacha = zadachi[index];
  const p = useMemo(
    () => (zadacha === undefined ? null : otkryt<Podskazki11>(zadacha, zadacha.podskazki)),
    [zadacha],
  );
  const razbor = useMemo(
    () =>
      zadacha === undefined || !razborOtkryt ? null : otkryt<Razbor11>(zadacha, zadacha.razbor),
    [zadacha, razborOtkryt],
  );

  /* Всё состояние экрана — оболочке сессии: она сохраняет его при
     каждом изменении, а при возвращении отдаёт обратно (restored). */
  useSessionReport<Trenazher11Ui>(report, {
    index,
    marks: otmetki,
    tried,
    order: null,
    value,
    checked,
    oshibalsya,
    hintOpen,
    shag,
    mimo,
    otkrytye: [...otkrytye],
    razborOtkryt,
    taskFrom: nachalo,
  });

  if (zadacha === undefined) {
    return null;
  }
  const z: Zadacha11 = zadacha;
  const total = zadachi.length;
  const shagi = p?.shagi ?? [];
  const tables = p?.tables ?? [];
  const pustye = pustyeKletki(tables);
  /* Пройдено k шагов из n — открыта такая же доля пустых клеток. */
  const poShagam = shagi.length === 0 ? 0 : Math.round((pustye.length * shag) / shagi.length);
  const zakryto = new Set(
    razborOtkryt || checked === 'right'
      ? []
      : pustye.filter((k, i) => i >= poShagam && !otkrytye.has(k)),
  );
  const podskazkaByla = shag > 0 || otkrytye.size > 0 || mimo.length > 0;
  const zakrytaZadacha = checked === 'right' || razborOtkryt;
  const ssylka = ssylki[z.section];
  const layfhak = z.lifehacks[0];

  function sekund(): number {
    return nachalo === null ? 0 : (elapsed() - nachalo) / 1000;
  }

  function otmetit(o: TaskMark) {
    setOtmetki((prev) => (prev[index] === undefined ? { ...prev, [index]: o } : prev));
  }

  /* Ошибка в задаче: неверный ответ или открытое решение. */
  function oshibka() {
    setTried((prev) => ({ ...prev, [index]: true }));
  }

  function zapisat(itog: 'right' | 'wrong' | 'revealed', chisto: boolean) {
    trenazher11.recordAttempt({
      kind: z.id,
      taskId: z.key,
      right: itog === 'right',
      clean: chisto,
      seconds: sekund(),
      itog,
    });
  }

  function proverit() {
    if (value.trim() === '' || zakrytaZadacha) {
      return;
    }
    const ok =
      z.answerType === 'choice' ? choiceMatches(value, z.seal) : answerMatches(value, z.seal);
    setChecked(ok ? 'right' : 'wrong');
    if (ok) {
      const chisto = !oshibalsya && !podskazkaByla;
      zapisat('right', chisto);
      otmetit(chisto ? 'right' : 'hinted');
    } else {
      setOshibalsya(true);
      oshibka();
    }
  }

  function pokazatReshenie() {
    setRazborOtkryt(true);
    if (checked !== 'right') {
      zapisat('revealed', false);
      oshibka();
    }
  }

  function dalshe() {
    if (otmetki[index] === undefined && !razborOtkryt) {
      /* Ушёл, не решив: задача не засчитана и попадает в ошибки. */
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
    setShag(0);
    setMimo([]);
    setOtkrytye(new Set());
    setRazborOtkryt(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const tekShag = shagi[shag];

  return (
    <section className={clsx('z11-resh', tsvetRazdela(z.section))}>
      <header className="z11-resh__top">
        <ProgressBar
          className="z11-resh__bar"
          value={((index + 1) / total) * 100}
          label={TRENAZHER_11.zadacha(index + 1, total)}
        />
        <span className={clsx('z11-resh__badge', `z11-resh__badge--${z.vid}`)}>
          {TRENAZHER_11.badge[z.vid]}
        </span>
      </header>

      <div className="z11-resh__razdel">
        <IkonkaRazdela section={z.section} />
        <span className="z11-resh__razdel-text">
          <span className="z11-resh__razdel-name">{nazvaniya[z.section]}</span>
          <span className="z11-resh__podtip">{z.title}</span>
        </span>
        <Zvezdy level={z.level} />
      </div>

      <article className="z11-card z11-resh__uslovie">
        <h3 className="z11-resh__h">{TRENAZHER_11.uslovie}</h3>
        <div className="z11-resh__text" dangerouslySetInnerHTML={{ __html: z.uslovieHtml }} />
      </article>

      {sPodskazkami && shagi.length > 0 ? (
        <section
          className={clsx('z11-card z11-resh__hint', hintOpen && 'is-open')}
          aria-live="polite"
        >
          <button
            type="button"
            className="z11-resh__hint-head"
            aria-expanded={hintOpen}
            onClick={() => setHintOpen(!hintOpen)}
          >
            <span className="z11-resh__hint-ico">
              <HintIcon />
            </span>
            <span>
              <b>{TRENAZHER_11.podskazka}</b>
              {hintOpen
                ? ` · ${TRENAZHER_11.shag(Math.min(shag + 1, shagi.length), shagi.length)}`
                : null}
            </span>
            <Piktogramma name="chevron" className="z11-resh__chevron" />
          </button>
          {hintOpen && tekShag !== undefined ? (
            <div className="z11-resh__shag">
              <p className="z11-resh__q" dangerouslySetInnerHTML={{ __html: tekShag.question }} />
              <div className="z11-resh__opts">
                {tekShag.options.map((o, k) => (
                  <button
                    key={k}
                    type="button"
                    className={clsx('z11-resh__opt', mimo.includes(k) && 'is-wrong')}
                    disabled={mimo.includes(k)}
                    onClick={() => {
                      if (k === tekShag.correct) {
                        setShag(shag + 1);
                        setMimo([]);
                      } else {
                        setMimo([...mimo, k]);
                      }
                    }}
                    dangerouslySetInnerHTML={{ __html: o }}
                  />
                ))}
              </div>
              {mimo.length > 0 ? (
                <p className="z11-resh__oops">{TRENAZHER_11.nevernoHint}</p>
              ) : null}
            </div>
          ) : null}
          {hintOpen && shag > 0 ? (
            <PredShag shag={shagi[shag - 1]} posledniy={shag >= shagi.length} />
          ) : null}
        </section>
      ) : null}

      {sPodskazkami && tables.length > 0 && !razborOtkryt ? (
        <section className="z11-card z11-resh__tablitsa">
          <h3 className="z11-resh__h">
            <Piktogramma name="table" />
            {TRENAZHER_11.tablitsa}
          </h3>
          {tables.map((t, ti) => (
            <Tablitsa11
              key={ti}
              table={t}
              skryto={
                new Set(
                  [...zakryto]
                    .filter((k) => k.startsWith(`${ti}|`))
                    .map((k) => k.slice(k.indexOf('|') + 1)),
                )
              }
              onOtkryt={(k) => setOtkrytye((prev) => new Set(prev).add(`${ti}|${k}`))}
            />
          ))}
          {zakryto.size > 0 ? <p className="z11-resh__note">{TRENAZHER_11.tablitsaNote}</p> : null}
        </section>
      ) : null}

      <nav className="z11-resh__links" aria-label="Материалы к задаче">
        {layfhak === undefined ? null : (
          <Link className="z11-resh__link" href={`${base}/teoriya/#layfhak-${layfhak}`}>
            <Piktogramma name="bolt" />
            {TRENAZHER_11.layfhak}
          </Link>
        )}
        {ssylka.teoriya === '' ? null : (
          <Link className="z11-resh__link" href={`${base}/teoriya/#teoriya-${ssylka.teoriya}`}>
            <Piktogramma name="book" />
            {TRENAZHER_11.teoriya}
          </Link>
        )}
        {ssylka.opornyy === null ? null : (
          <Link className="z11-resh__link" href={`${base}/opornye-zadachi/${ssylka.opornyy.slug}/`}>
            <Piktogramma name="tools" />
            {TRENAZHER_11.opornyy}
          </Link>
        )}
      </nav>

      {checked === null ? null : (
        <div className={clsx('pverdict', `pverdict--${checked}`)} role="status">
          <p className="pverdict__title">
            {checked === 'right' ? TRENAZHER_11.verno : TRENAZHER_11.neverno}
          </p>
          <p className="pverdict__lead">
            {checked === 'right' ? TRENAZHER_11.vernoLead : TRENAZHER_11.nevernoLead}
          </p>
        </div>
      )}

      {razbor === null ? null : <Razbor11Blok razbor={razbor} />}

      {z.answerType === 'choice' && z.vybory !== null ? (
        <ul className="z11-resh__vybory" aria-label={TRENAZHER_11.otvet}>
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
                disabled={zakrytaZadacha}
                onClick={() => {
                  setValue(v.number);
                  setChecked(null);
                }}
              >
                <span className="popt__no">{v.number}</span>
                <span className="popt__text" dangerouslySetInnerHTML={{ __html: v.label }} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="z11-resh__dop">
        {!razborOtkryt && (checked !== null || shag >= shagi.length) ? (
          <Button variant="ghost" onClick={pokazatReshenie}>
            {TRENAZHER_11.pokazatReshenie}
          </Button>
        ) : null}
        {zakrytaZadacha ? null : (
          <Button variant="ghost" onClick={dalshe}>
            {index + 1 >= total ? TRENAZHER_11.zavershit : TRENAZHER_11.propustit}
          </Button>
        )}
      </div>

      {/* Закреплено внизу экрана, как на макете: ответ и главная кнопка. */}
      <div className="z11-resh__bar-bottom">
        {z.answerType === 'choice' ? null : (
          <Input
            className="z11-resh__input"
            value={value}
            placeholder={TRENAZHER_11.otvet}
            aria-label={TRENAZHER_11.otvet}
            inputMode="decimal"
            autoComplete="off"
            state={checked === null ? 'default' : checked === 'right' ? 'success' : 'error'}
            readOnly={zakrytaZadacha}
            onChange={(e) => {
              setValue(e.target.value);
              if (checked === 'wrong') setChecked(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') proverit();
            }}
          />
        )}
        {zakrytaZadacha ? (
          <Button onClick={dalshe}>
            {index + 1 >= total ? TRENAZHER_11.zavershit : TRENAZHER_11.dalee}
          </Button>
        ) : (
          <Button onClick={proverit} disabled={value.trim() === ''}>
            {TRENAZHER_11.proverit}
          </Button>
        )}
      </div>
    </section>
  );
}

/** Пояснение к пройденному шагу подсказки: верный ответ и комментарий. */
function PredShag({
  shag,
  posledniy,
}: {
  shag: Podskazki11['shagi'][number] | undefined;
  posledniy: boolean;
}) {
  if (shag === undefined) {
    return null;
  }
  return (
    <div className="z11-resh__pred">
      <p className="z11-resh__pred-otvet">
        <span dangerouslySetInnerHTML={{ __html: shag.question }} />{' '}
        <b dangerouslySetInnerHTML={{ __html: shag.options[shag.correct] ?? '' }} />
      </p>
      {shag.comment === null ? null : (
        <p className="z11-resh__pred-comment" dangerouslySetInnerHTML={{ __html: shag.comment }} />
      )}
      {posledniy ? <p className="z11-resh__pred-done">{TRENAZHER_11.vseShagi}</p> : null}
    </div>
  );
}

/** Решение задачи по этапам: на экране задачи и в разборе на итогах. */
export function Razbor11Blok({ razbor }: { razbor: Razbor11 }) {
  return (
    <section
      className="z11-card z11-resh__razbor"
      aria-label={TRENAZHER_11.reshenie}
      ref={praviloOdinRaz}
    >
      <h3 className="z11-resh__h">{TRENAZHER_11.reshenie}</h3>
      {razbor.tables.map((t, i) => (
        <Tablitsa11 key={i} table={t} />
      ))}
      {razbor.etapy.map((e, i) => (
        <div key={i} className="z11-resh__etap">
          <p className="z11-resh__etap-title" dangerouslySetInnerHTML={{ __html: e.title }} />
          {e.stroki.map((line, j) => (
            <div key={j} className="z11-resh__line" dangerouslySetInnerHTML={{ __html: line }} />
          ))}
        </div>
      ))}
    </section>
  );
}

/** Разбор задачи на итогах: решение по этапам, последняя строка — ответ. */
export function Trenazher11Review({ zadacha }: { zadacha: Zadacha11 }) {
  const razbor = useMemo(() => otkryt<Razbor11>(zadacha, zadacha.razbor), [zadacha]);
  return razbor === null ? null : <Razbor11Blok razbor={razbor} />;
}
