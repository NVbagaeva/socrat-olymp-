'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, FigureZoom, Input, ProgressBar } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { TRENAZHER_1 } from '@/content/zadanie1';
import { progress1 } from '@/lib/planimetriya/progress';
import { answerMatches, openText } from '@/lib/planimetriya/secret';
import type { SsylkiZadachi } from '@/lib/planimetriya/trenazher/dannye';
import type { Level, RazdelInfo } from '@/lib/planimetriya/trenazher/sessiya';
import type { Podskazki1, Razbor1, Zadacha1 } from '@/lib/planimetriya/trenazher/zadacha';
import type { TaskMark } from '@/lib/trainerSession/types';
import { HintIcon } from '../prep/PrepIcons';
import { useBeforeFinish } from '../session/useBeforeFinish';
import { useSessionReport } from '../session/useSessionReport';
import { Piktogramma, Zvezdy } from '../zadanie11/Piktogrammy';
import { IkonkaBloka1 } from './IkonkaBloka1';
import type { Trenazher1Ui } from './trenazher1Sessiya';

export interface Trenazher1ResheniePropsy {
  zadachi: Zadacha1[];
  podskazki: boolean;
  razdely: RazdelInfo[];
  ssylki: Record<string, SsylkiZadachi>;
  base: string;
  /** Состояние экрана из сохранённой тренировки. null — тренировка новая. */
  restored: Trenazher1Ui | null;
  /** Сообщить оболочке сессии о новом состоянии (она его сохранит). */
  report: (ui: Trenazher1Ui) => void;
  /** Активное время тренировки, мс: пауза и скрытая вкладка не идут. */
  elapsed: () => number;
  /** Регистрация обработчика «перед досрочным завершением» (оболочка). */
  setBeforeFinish?: (handler: (() => void) | null) => void;
  /** Последняя задача закрыта: показать итоги. */
  onKonets: () => void;
}

export function otkryt<T>(z: Zadacha1, blob: string): T | null {
  try {
    return JSON.parse(openText(blob, z.seal)) as T;
  } catch {
    return null;
  }
}

/**
 * Экран задачи тренажёра №1 — экран №11 (Trenazher11Reshenie):
 * полоса прогресса, бейдж (банк ФИПИ / новая), блок и тип со
 * звёздами, условие с чертежом. Подсказка — шаги вопросами с
 * кнопками; на каждом вопросе чертёж показывает слой подсказки этого
 * шага: нужный элемент подсвечен. Решение — шаги с подписями,
 * выкладки KaTeX, сокращение с признаками делимости, сверка с
 * рисунком и чертёж со всеми построениями. Внизу закреплена строка
 * ответа: запятая и точка равноправны.
 *
 * Номер задачи, таймер, паузу и завершение ведёт оболочка сессии
 * (components/tasks/session): она же сохраняет состояние экрана, и
 * ученик, ушедший в теорию или перезагрузивший страницу, продолжает
 * с того же места. Исход задачи пишется в хранилище тренажёра по
 * прототипу: верно без подсказок — начисто; с подсказкой или после
 * ошибки — верно, но задача остаётся в «Моих ошибках»; открыл
 * решение — не решена.
 */
export function Trenazher1Reshenie({
  zadachi,
  podskazki: sPodskazkami,
  razdely,
  ssylki,
  base,
  restored,
  report,
  elapsed,
  setBeforeFinish,
  onKonets,
}: Trenazher1ResheniePropsy) {
  /* Всё, что ученик успел сделать, приходит из сохранённой тренировки:
     вернувшись в тренажёр, он продолжает с того же места. */
  const [index, setIndex] = useState(restored?.index ?? 0);
  /* Отметки общие для сессии: 'right' — начисто, 'hinted' — с подсказкой
     или после ошибки. Не решённые отметки не получают: ошибка
     запоминается в tried, пропуск — отсутствием записи. */
  const [otmetki, setOtmetki] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});
  const [value, setValue] = useState(restored?.value ?? '');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(restored?.checked ?? null);
  const [oshibalsya, setOshibalsya] = useState(restored?.oshibalsya ?? false);
  const [hintOpen, setHintOpen] = useState(restored?.hintOpen ?? false);
  const [shag, setShag] = useState(restored?.shag ?? 0);
  const [mimo, setMimo] = useState<number[]>(restored?.mimo ?? []);
  /* Решение открыто: сам разбор достаётся из отпечатка заново. */
  const [razborOtkryt, setRazborOtkryt] = useState(restored?.razborOtkryt ?? false);
  const [misses, setMisses] = useState(restored?.misses ?? 0);
  /* Начало задачи (мс активного времени оболочки) — для времени
     в статистике; на следующей задаче ставится при переходе. */
  const [nachalo, setNachalo] = useState(() => restored?.taskFrom ?? elapsed());

  const info = useMemo(() => {
    const m = new Map<string, { blok: string; nazvanie: string; level: Level }>();
    for (const r of razdely) {
      for (const p of r.podtipy) m.set(p.id, { blok: r.id, nazvanie: r.nazvanie, level: p.level });
    }
    return m;
  }, [razdely]);

  const zadacha = zadachi[index];
  const p = useMemo(
    () => (zadacha === undefined ? null : otkryt<Podskazki1>(zadacha, zadacha.podskazki)),
    [zadacha],
  );
  const razbor = useMemo(
    () =>
      zadacha === undefined || !razborOtkryt ? null : otkryt<Razbor1>(zadacha, zadacha.razbor),
    [zadacha, razborOtkryt],
  );

  /* Всё состояние экрана — оболочке сессии: она сохраняет его при
     каждом изменении, а при возвращении отдаёт обратно (restored). */
  const ui: Trenazher1Ui = {
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
    razborOtkryt,
    taskFrom: nachalo,
    misses,
  };
  useSessionReport<Trenazher1Ui>(report, ui);

  /* Завершение кнопкой панели — как прежняя кнопка «Завершить»: начатая,
     но не закрытая задача (была проверка или подсказка) уходит в ошибки
     и в итогах числится «неверно»; нетронутые — «пропущено», в историю
     не пишутся. */
  useBeforeFinish(setBeforeFinish, () => {
    if (otmetki[index] !== undefined || razborOtkryt || (checked === null && !podskazkaByla)) {
      return;
    }
    zapisat('wrong', false);
    report({ ...ui, tried: { ...tried, [index]: true } });
  });

  if (zadacha === undefined) {
    return null;
  }
  const z: Zadacha1 = zadacha;
  const total = zadachi.length;
  const voprosy = p?.voprosy ?? [];
  const podskazkaByla = shag > 0 || mimo.length > 0;
  const zakrytaZadacha = checked === 'right' || razborOtkryt;
  const ssylka = ssylki[z.id];
  const blok = info.get(z.id);
  const tekVopros = voprosy[shag];
  /* Чертёж: на вопросе подсказки — слой этого шага, иначе условие. */
  const risunok =
    hintOpen && !razborOtkryt
      ? (tekVopros?.risunokSvg ?? voprosy[voprosy.length - 1]?.risunokSvg ?? z.risunokSvg)
      : z.risunokSvg;

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
    progress1.recordAttempt({
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
    const ok = answerMatches(value, z.seal);
    setChecked(ok ? 'right' : 'wrong');
    if (ok) {
      const chisto = !oshibalsya && !podskazkaByla;
      zapisat('right', chisto);
      otmetit(chisto ? 'right' : 'hinted');
    } else {
      setOshibalsya(true);
      setMisses((m) => m + 1);
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
    let nextTried = tried;
    if (otmetki[index] === undefined && !razborOtkryt) {
      /* Ушёл, не решив: задача не засчитана и попадает в ошибки. В
         итогах она «неверно», если ученик над ней работал (подсказка),
         иначе — «пропущено». */
      zapisat('wrong', false);
      if (checked !== null || podskazkaByla) {
        nextTried = { ...tried, [index]: true };
        setTried(nextTried);
      }
    }
    if (index + 1 >= total) {
      /* Итоги считаются сразу: последнее состояние — оболочке до них. */
      report({ ...ui, tried: nextTried });
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
    setRazborOtkryt(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <section className="z11-resh z1-resh">
      <header className="z11-resh__top">
        <ProgressBar
          className="z11-resh__bar"
          value={((index + 1) / total) * 100}
          label={TRENAZHER_1.zadacha(index + 1, total)}
        />
        <span className={clsx('z11-resh__badge', `z11-resh__badge--${z.vid}`)}>
          {TRENAZHER_1.badge[z.vid]}
          {z.fipi === null ? null : ` · ${TRENAZHER_1.fipi(z.fipi)}`}
        </span>
      </header>

      <div className="z11-resh__razdel">
        <IkonkaBloka1 blok={blok?.blok ?? ''} />
        <span className="z11-resh__razdel-text">
          <span className="z11-resh__razdel-name">
            <Tex text={blok?.nazvanie ?? ''} />
          </span>
          <span className="z11-resh__podtip">
            <Tex text={z.title} />
          </span>
        </span>
        {blok === undefined ? null : <Zvezdy level={blok.level} />}
      </div>

      <article className="z11-card z11-resh__uslovie">
        <h3 className="z11-resh__h">{TRENAZHER_1.uslovie}</h3>
        <div className="z1-resh__grid">
          <div className="z11-resh__text" dangerouslySetInnerHTML={{ __html: z.uslovieHtml }} />
          <FigureZoom className="z1-resh__pic" label={TRENAZHER_1.risunok}>
            <span className="pl-wrap" dangerouslySetInnerHTML={{ __html: risunok }} />
          </FigureZoom>
        </div>
      </article>

      {sPodskazkami && voprosy.length > 0 && !razborOtkryt ? (
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
              <b>{TRENAZHER_1.podskazka}</b>
              {hintOpen
                ? ` · ${TRENAZHER_1.shag(Math.min(shag + 1, voprosy.length), voprosy.length)}`
                : null}
            </span>
            <Piktogramma name="chevron" className="z11-resh__chevron" />
          </button>
          {hintOpen && tekVopros !== undefined ? (
            <div className="z11-resh__shag">
              <p className="z11-resh__q" dangerouslySetInnerHTML={{ __html: tekVopros.vopros }} />
              <div className="z11-resh__opts">
                {tekVopros.knopki.map((o, k) => (
                  <button
                    key={k}
                    type="button"
                    className={clsx('z11-resh__opt', mimo.includes(k) && 'is-wrong')}
                    disabled={mimo.includes(k)}
                    onClick={() => {
                      if (k === tekVopros.verno) {
                        setShag(shag + 1);
                        setMimo([]);
                      } else {
                        setMimo([...mimo, k]);
                        setMisses((m) => m + 1);
                      }
                    }}
                    dangerouslySetInnerHTML={{ __html: o }}
                  />
                ))}
              </div>
              {mimo.length > 0 ? <p className="z11-resh__oops">{TRENAZHER_1.nevernoHint}</p> : null}
            </div>
          ) : null}
          {hintOpen && shag > 0 ? (
            <PredShag vopros={voprosy[shag - 1]} posledniy={shag >= voprosy.length} />
          ) : null}
        </section>
      ) : null}

      {ssylka === undefined ? null : (
        <nav className="z11-resh__links" aria-label="Материалы к задаче">
          {/* Уход по ссылке не сбрасывает тренировку: оболочка сессии уже
              записала состояние, вкладка «Тренажёр» вернёт к этой задаче. */}
          {ssylka.kartochka === '' ? null : (
            <Link className="z11-resh__link" href={`${base}/teoriya/#k-${ssylka.kartochka}`}>
              <Piktogramma name="book" />
              {TRENAZHER_1.povtoritTeoriyu}
            </Link>
          )}
          {ssylka.fakt === null ? null : (
            <Link className="z11-resh__link" href={`${base}/teoriya/#fakt-${ssylka.fakt}`}>
              <Piktogramma name="bolt" />
              {TRENAZHER_1.layfhak}
            </Link>
          )}
          {ssylka.opornyy === null ? null : (
            <Link
              className="z11-resh__link"
              href={`${base}/opornye-zadachi/${ssylka.opornyy.slug}/`}
            >
              <Piktogramma name="tools" />
              {TRENAZHER_1.opornyy}
            </Link>
          )}
          {ssylka.razbor === '' ? null : (
            <Link className="z11-resh__link" href={`${base}/razbor/${ssylka.razbor}/`}>
              <Piktogramma name="doc" />
              {TRENAZHER_1.razborTipa}
            </Link>
          )}
        </nav>
      )}

      {checked === null ? null : (
        <div className={clsx('pverdict', `pverdict--${checked}`)} role="status">
          <p className="pverdict__title">
            {checked === 'right' ? TRENAZHER_1.verno : TRENAZHER_1.neverno}
          </p>
          <p className="pverdict__lead">
            {checked === 'right' ? TRENAZHER_1.vernoLead : TRENAZHER_1.nevernoLead}
          </p>
        </div>
      )}

      {razbor === null ? null : <Reshenie1 razbor={razbor} />}

      <div className="z11-resh__dop">
        {!razborOtkryt && (checked !== null || shag >= voprosy.length) ? (
          <Button variant="ghost" onClick={pokazatReshenie}>
            {TRENAZHER_1.pokazatReshenie}
          </Button>
        ) : null}
        {zakrytaZadacha ? null : (
          <Button variant="ghost" onClick={dalshe}>
            {index + 1 >= total ? TRENAZHER_1.zavershit : TRENAZHER_1.propustit}
          </Button>
        )}
      </div>

      <div className="z11-resh__bar-bottom">
        <Input
          className="z11-resh__input"
          value={value}
          placeholder={TRENAZHER_1.otvet}
          aria-label={TRENAZHER_1.otvet}
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
        {zakrytaZadacha ? (
          <Button onClick={dalshe}>
            {index + 1 >= total ? TRENAZHER_1.zavershit : TRENAZHER_1.dalee}
          </Button>
        ) : (
          <Button onClick={proverit} disabled={value.trim() === ''}>
            {TRENAZHER_1.proverit}
          </Button>
        )}
      </div>
    </section>
  );
}

/** Пояснение к пройденному шагу подсказки: верный ответ и комментарий. */
function PredShag({
  vopros,
  posledniy,
}: {
  vopros: Podskazki1['voprosy'][number] | undefined;
  posledniy: boolean;
}) {
  if (vopros === undefined) {
    return null;
  }
  return (
    <div className="z11-resh__pred">
      <p className="z11-resh__pred-otvet">
        <span dangerouslySetInnerHTML={{ __html: vopros.vopros }} />{' '}
        <b dangerouslySetInnerHTML={{ __html: vopros.knopki[vopros.verno] ?? '' }} />
      </p>
      {vopros.poyasnenie === '' ? null : (
        <p
          className="z11-resh__pred-comment"
          dangerouslySetInnerHTML={{ __html: vopros.poyasnenie }}
        />
      )}
      {posledniy ? <p className="z11-resh__pred-done">{TRENAZHER_1.vseShagi}</p> : null}
    </div>
  );
}

/**
 * Решение по шагам — оформление разбора «О задании» (Razbor1,
 * rich-example): подписи шагов, пояснения, выкладки, признаки
 * делимости в раскрывающейся панели, сверка с рисунком и чертёж со
 * всеми построениями.
 */
export function Reshenie1({ razbor }: { razbor: Razbor1 }) {
  return (
    <section
      className="z11-card z11-resh__razbor z1-resh__razbor"
      aria-label={TRENAZHER_1.reshenie}
    >
      <h3 className="z11-resh__h">{TRENAZHER_1.reshenie}</h3>
      <div className="rich-example__grid">
        <FigureZoom
          className="rich-example__figure z1-razbor__pic"
          label={TRENAZHER_1.risunokReshenie}
        >
          <span className="pl-wrap" dangerouslySetInnerHTML={{ __html: razbor.risunokSvg }} />
        </FigureZoom>
        <ol className="rich-example__steps">
          {razbor.shagi.map((s, i) => (
            <li className="rich-example__step" key={i}>
              <span
                className="rich-example__label"
                dangerouslySetInnerHTML={{ __html: s.zagolovok }}
              />
              {s.tekst.map((t, j) => (
                <p className="rich-p" key={j} dangerouslySetInnerHTML={{ __html: t }} />
              ))}
              {s.formuly.length === 0 ? null : (
                <div className="rich-lines">
                  {s.formuly.map((f, j) => (
                    <span
                      className="rich-formula"
                      key={j}
                      dangerouslySetInnerHTML={{ __html: f }}
                    />
                  ))}
                </div>
              )}
              {s.sokrashchenie.length === 0 ? null : (
                <details className="z1-sokr">
                  <summary className="z1-sokr__summary">{TRENAZHER_1.priznaki}</summary>
                  <ol className="z1-sokr__list">
                    {s.sokrashchenie.map((k, j) => (
                      <li key={j}>
                        <span dangerouslySetInnerHTML={{ __html: k.tekst }} />
                        {k.formula === '' ? null : (
                          <span
                            className="rich-formula"
                            dangerouslySetInnerHTML={{ __html: k.formula }}
                          />
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </li>
          ))}
          <li className="rich-example__step is-check">
            <span className="rich-example__label">{TRENAZHER_1.sverka}</span>
            <p className="rich-p" dangerouslySetInnerHTML={{ __html: razbor.sverka }} />
          </li>
        </ol>
      </div>
      <p className="rich-example__answer">
        {TRENAZHER_1.otvetReshenie}: <span dangerouslySetInnerHTML={{ __html: razbor.otvetHtml }} />
      </p>
    </section>
  );
}

/**
 * Разбор задачи на экране итогов: решение по шагам с чертежом всех
 * построений. Открывается из отпечатка только по нажатию.
 */
export function Trenazher1Review({ zadacha }: { zadacha: Zadacha1 }) {
  const razbor = otkryt<Razbor1>(zadacha, zadacha.razbor);
  return razbor === null ? null : <Reshenie1 razbor={razbor} />;
}
