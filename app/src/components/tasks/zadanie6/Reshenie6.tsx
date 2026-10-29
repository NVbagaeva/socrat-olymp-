'use client';

import { clsx } from 'clsx';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Tex } from '@/components/ui/Tex';
import { TRENAZHER_6 } from '@/content/zadanie6';
import type { TaskMark } from '@/lib/trainerSession/types';
import type { ZadachaLite } from '@/lib/zadanie6/dannye';
import { chisloIzVvoda } from '@/lib/zadanie6/otvet';
import { trenazher6 } from '@/lib/zadanie6/progress';
import type { ProtoInfo6 } from '@/lib/zadanie6/protoInfo';
import { answerMatches } from '@/lib/zadanie6/secret';
import type * as Prototypes from '@/lib/zadanie6/prototypes';
import type { Rezhim6 } from '@/lib/zadanie6/trenazher';
import type { Ris, Solved } from '@/lib/zadanie6/types';
import { useSessionReport } from '../session/useSessionReport';
import { Podskazki7 } from '../zadanie7/Podskazki7';
import { Razbor6 } from './Razbor6';
import type { Trenazher6Ui } from './trenazher6Sessiya';
import { Uslovie6 } from './Uslovie6';

const T = TRENAZHER_6;

type Modul = typeof Prototypes;

/** Решатели прототипов №6 — динамический импорт (рисунок условия и разбор строятся в браузере). */
export function useModul6(): Modul | null {
  const [m, setM] = useState<Modul | null>(null);
  useEffect(() => {
    let zhivo = true;
    void import('@/lib/zadanie6/prototypes').then((x) => {
      if (zhivo) setM(x);
    });
    return () => {
      zhivo = false;
    };
  }, []);
  return m;
}

/** Метка задачи: «Демоверсия ФИПИ», «Математическое ожидание, №3 · не из открытого банка», «Не из открытого банка». */
export function metkaZadachi(z: ZadachaLite): string {
  if (z.source === 'demo') return T.demo;
  if (z.source === 'fipi') return 'Открытый банк ФИПИ';
  if (z.source === 'obrazec' && z.gde) return T.obrazec(z.gde);
  return T.analog;
}

/** Условие задачи с рисунком: рисунок строит решатель прототипа по параметрам. */
export function UslovieLite({ z, m }: { z: ZadachaLite; m: Modul | null }) {
  const ris: Ris | undefined = m ? m.prototype(z.prototypeId).ris(z.params) : undefined;
  return (
    <Uslovie6
      u={{ text: z.text, ...(ris ? { ris } : {}), ...(z.posle ? { posle: z.posle } : {}) }}
    />
  );
}

/** Разбор задачи на экране итогов (открывается по кнопке). */
export function Review6({ z }: { z: ZadachaLite }) {
  const m = useModul6();
  return m ? <Razbor6 s={m.prototype(z.prototypeId).solve(z.params)} /> : <p>{T.zagruzka}</p>;
}

export interface Reshenie6Props {
  zadachi: ZadachaLite[];
  prototipy: ProtoInfo6[];
  base: string;
  /** Режим: тренировка (по умолчанию) или проверка. */
  rezhim?: Rezhim6 | undefined;
  restored: Trenazher6Ui | null;
  report: (ui: Trenazher6Ui) => void;
  elapsed: () => number;
  onFinish: () => void;
}

/** Состояние точки-шага: для подписи и цвета. */
type Sostoyanie = 'right' | 'hinted' | 'wrong' | 'otvet' | null;

/** Мелкий экран и касание: туда фокус в поле не ставим — не выскакивает клавиатура. */
function tochnyyUkazatel(): boolean {
  try {
    return window.matchMedia('(pointer: fine)').matches;
  } catch {
    return false;
  }
}

/** Лёгкое покачивание поля при неверном ответе; без него — при «меньше движения». */
function kachnut(el: HTMLElement | null) {
  try {
    if (el === null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    el.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(-2px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 240, easing: 'ease-out' },
    );
  } catch {
    /* старый браузер без Web Animations — без покачивания */
  }
}

/**
 * Экран задачи тренажёра №6.
 *
 * Сверху — точки-шаги (переход к любой задаче) и полоса прогресса, затем
 * метка источника и прототип, условие с рисунком и поле ответа:
 * принимается любая верная запись числа (0,75 = .75 = 3/4). Enter —
 * «Проверить», после ответа Enter — «Следующая». В тренировке — подсказка
 * вопросами и разбор в сворачиваемых блоках; в проверке — один ответ на
 * задачу, верно ли — в итогах. Исход пишется в хранилище тренажёра по
 * прототипу; состояние экрана — в общей сессии (TrainerSessionHost).
 */
export function Reshenie6({
  zadachi,
  prototipy,
  base,
  rezhim = 'trenirovka',
  restored,
  report,
  elapsed,
  onFinish,
}: Reshenie6Props) {
  const proverka = rezhim === 'proverka';
  const [index, setIndex] = useState(restored?.index ?? 0);
  const [marks, setMarks] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});
  const [misses, setMisses] = useState(restored?.misses ?? 0);
  const [value, setValue] = useState(restored?.value ?? '');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(restored?.checked ?? null);
  const [oshibalsya, setOshibalsya] = useState(restored?.oshibalsya ?? false);
  const [hintOpen, setHintOpen] = useState(restored?.hintOpen ?? false);
  const [shag, setShag] = useState(restored?.shag ?? 1);
  const [mimo, setMimo] = useState<number[]>(restored?.mimo ?? []);
  const [razborOtkryt, setRazborOtkryt] = useState(restored?.razborOtkryt ?? false);
  const [nachalo, setNachalo] = useState(() => restored?.taskFrom ?? elapsed());
  const [otvety, setOtvety] = useState<Record<number, string>>(restored?.otvety ?? {});
  const [razbory, setRazbory] = useState<number[]>(restored?.razbory ?? []);
  const [podskazki, setPodskazki] = useState<number[]>(restored?.podskazki ?? []);
  const [zamechanie, setZamechanie] = useState<string | null>(null);
  /* Номер попытки: вердикт перерисовывается и анимируется заново. */
  const [popytka, setPopytka] = useState(0);
  const m = useModul6();
  const verh = useRef<HTMLElement>(null);
  const pole = useRef<HTMLInputElement>(null);
  const fokusPosle = useRef(false);
  const uid = useId();

  useSessionReport<Trenazher6Ui>(report, {
    index,
    marks,
    tried,
    order: null,
    misses,
    value,
    checked,
    oshibalsya,
    hintOpen,
    shag,
    mimo,
    razborOtkryt,
    taskFrom: nachalo,
    otvety,
    razbory,
    podskazki,
  });

  /* Новая задача: фокус в поле, если перешли с клавиатуры или мышью. */
  useEffect(() => {
    if (fokusPosle.current) {
      fokusPosle.current = false;
      pole.current?.focus({ preventScroll: true });
    }
  }, [index]);

  const z = zadachi[index];
  const proto = useMemo(() => prototipy.find((p) => p.id === z?.prototypeId), [prototipy, z]);
  const s: Solved | null = useMemo(
    () =>
      z && m && (hintOpen || razborOtkryt) ? m.prototype(z.prototypeId).solve(z.params) : null,
    [z, m, hintOpen, razborOtkryt],
  );

  if (z === undefined) {
    return null;
  }

  /** Задача закрыта: решена, открыт разбор, а в проверке — дан ответ. */
  const zakrytaNa = (i: number) =>
    marks[i] !== undefined || razbory.includes(i) || (proverka && tried[i] === true);
  const zakryta = zakrytaNa(index) || checked === 'right';
  const last = index === zadachi.length - 1;
  const zakryto = zadachi.reduce((a, _, i) => a + (zakrytaNa(i) ? 1 : 0), 0);

  function sostoyanie(i: number): Sostoyanie {
    if (proverka) {
      return marks[i] !== undefined || tried[i] === true ? 'otvet' : null;
    }
    if (marks[i] !== undefined) {
      return marks[i];
    }
    return tried[i] === true || razbory.includes(i) ? 'wrong' : null;
  }

  function zapisat(right: boolean, clean: boolean) {
    if (z === undefined || marks[index] !== undefined) {
      return;
    }
    trenazher6.recordAttempt({
      kind: z.prototypeId,
      taskId: z.id,
      right,
      clean,
      seconds: (elapsed() - nachalo) / 1000,
    });
    if (right) {
      setMarks((x) => ({ ...x, [index]: clean ? 'right' : 'hinted' }));
    }
  }

  function proverit() {
    if (z === undefined || zakryta) {
      return;
    }
    if (value.trim() === '' || chisloIzVvoda(value) === null) {
      setZamechanie(T.nechislo);
      setPopytka((p) => p + 1);
      return;
    }
    setZamechanie(null);
    setPopytka((p) => p + 1);
    const verno = answerMatches(value, z.seal);
    if (proverka) {
      /* Один ответ: исход пишется сразу, вердикт — в итогах. */
      if (verno) {
        zapisat(true, true);
      } else {
        trenazher6.recordAttempt({
          kind: z.prototypeId,
          taskId: z.id,
          right: false,
          clean: false,
          seconds: (elapsed() - nachalo) / 1000,
        });
        setTried((t) => ({ ...t, [index]: true }));
      }
      return;
    }
    if (verno) {
      setChecked('right');
      zapisat(true, !oshibalsya && !podskazki.includes(index) && !razborOtkryt);
    } else {
      setChecked('wrong');
      kachnut(pole.current);
      setOshibalsya(true);
      setMisses((n) => n + 1);
      setTried((t) => ({ ...t, [index]: true }));
    }
  }

  /** Перейти к задаче i: ответ текущей сохраняется, у новой — свой. */
  function perejti(i: number, fokus = tochnyyUkazatel()) {
    if (i === index || i < 0 || i >= zadachi.length) {
      return;
    }
    setOtvety((o) => ({ ...o, [index]: value }));
    setIndex(i);
    setValue(otvety[i] ?? '');
    setChecked(marks[i] !== undefined && !proverka ? 'right' : null);
    setOshibalsya(tried[i] === true);
    setHintOpen(false);
    setShag(1);
    setMimo([]);
    setRazborOtkryt(razbory.includes(i));
    setZamechanie(null);
    setNachalo(elapsed());
    fokusPosle.current = fokus;
    verh.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function dalshe(fokus?: boolean) {
    if (last) {
      setOtvety((o) => ({ ...o, [index]: value }));
      onFinish();
      return;
    }
    perejti(index + 1, fokus);
  }

  /* Enter в поле: до ответа — проверить, после — следующая. */
  function naEnter(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) {
      return;
    }
    e.preventDefault();
    if (zakryta) {
      dalshe(true);
    } else {
      proverit();
    }
  }

  const otvetDan = proverka && zakrytaNa(index);
  const verdikt: { cls: string; text: string } | null = zamechanie
    ? { cls: 'is-info', text: zamechanie }
    : otvetDan
      ? { cls: 'is-info', text: T.prinyat }
      : checked === 'right' || (!proverka && marks[index] !== undefined)
        ? { cls: 'is-right', text: T.verno }
        : checked === 'wrong'
          ? { cls: 'is-wrong', text: T.neverno }
          : null;
  const podpisId = `${uid}-podpis`;
  const verdiktId = `${uid}-verdikt`;
  const podskazkaId = `${uid}-podskazka`;
  const razborId = `${uid}-razbor`;

  return (
    <article className="z6-zadacha z6t-task" ref={verh}>
      <nav className="z6t-steps" aria-label={T.shagi}>
        <div
          className="z6t-steps__bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={zadachi.length}
          aria-valuenow={zakryto}
          aria-label={`${zakryto} из ${zadachi.length}`}
        >
          <span style={{ width: `${(zakryto / zadachi.length) * 100}%` }} />
        </div>
        <ol className="z6t-steps__list">
          {zadachi.map((zz, i) => {
            const st = sostoyanie(i);
            return (
              <li key={zz.id}>
                <button
                  type="button"
                  className={clsx('z6t-step', st && `is-${st}`)}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={T.shag(i + 1, st ? T.sostoyaniya[st] : '')}
                  onClick={() => perejti(i)}
                >
                  <span aria-hidden="true">{i + 1}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <p className="z6-zadacha__metka">
        {metkaZadachi(z)}
        {proto ? (
          <>
            {' · '}
            {proto.kod} <Tex text={proto.title} />
          </>
        ) : null}
      </p>
      <div className="z6t-task__uslovie">
        <UslovieLite z={z} m={m} />
      </div>

      <form
        className={clsx(
          'z6t-otvet',
          verdikt?.cls === 'is-right' && 'is-right',
          verdikt?.cls === 'is-wrong' && 'is-wrong',
        )}
        onSubmit={(e) => {
          e.preventDefault();
          if (zakryta) {
            dalshe(true);
          } else {
            proverit();
          }
        }}
      >
        <label className="z6t-otvet__label" htmlFor={`otvet-${z.id}`}>
          {T.otvet}
        </label>
        <div className="z6t-otvet__row">
          <input
            ref={pole}
            id={`otvet-${z.id}`}
            className="z6-otvet__input z6t-otvet__input"
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint={zakryta ? 'next' : 'done'}
            value={value}
            readOnly={zakryta}
            aria-invalid={verdikt?.cls === 'is-wrong' ? true : undefined}
            aria-describedby={`${podpisId} ${verdiktId}`}
            onKeyDown={naEnter}
            onFocus={(e) => {
              /* Клавиатура телефона поднимается не сразу: поле — в центр,
                 над клавиатурой и нижней навигацией. */
              if (tochnyyUkazatel()) {
                return;
              }
              const el = e.currentTarget;
              window.setTimeout(
                () => el.scrollIntoView({ block: 'center', behavior: 'smooth' }),
                300,
              );
            }}
            onChange={(e) => {
              setValue(e.target.value);
              if (checked === 'wrong') {
                setChecked(null);
              }
              setZamechanie(null);
            }}
          />
          {zakryta ? null : (
            <button type="submit" className="btn btn--primary z6t-otvet__btn">
              {proverka ? T.otvetit : T.proverit}
            </button>
          )}
        </div>
        <p className="z6t__hint" id={podpisId}>
          <Tex text={T.otvetPodskazka} />
          <span className="z6t__kbd"> · {T.enter}</span>
        </p>
      </form>

      <div id={verdiktId} role="status" className="z6t-verdikt-slot">
        {verdikt ? (
          <p key={popytka} className={clsx('z6t-verdikt', verdikt.cls)}>
            <span className="z6t-verdikt__ico" aria-hidden="true">
              {verdikt.cls === 'is-right' ? '✓' : verdikt.cls === 'is-wrong' ? '!' : 'i'}
            </span>
            <span>
              <Tex text={verdikt.text} />
            </span>
          </p>
        ) : null}
      </div>

      <div className="z6t-nav">
        <button
          type="button"
          className="btn btn--ghost z6t-nav__back"
          disabled={index === 0}
          onClick={() => perejti(index - 1)}
        >
          <span aria-hidden="true">←</span> {T.nazad}
        </button>
        {zakryta ? (
          <button type="button" className="btn btn--primary" onClick={() => dalshe()}>
            {last ? T.rezultat : T.dalshe} <span aria-hidden="true">→</span>
          </button>
        ) : (
          <button type="button" className="btn btn--secondary" onClick={() => dalshe()}>
            {last ? T.rezultat : T.propustit}
          </button>
        )}
      </div>

      {proverka ? null : (
        <div className="z6t-help">
          <div className="z6t-help__btns">
            {razborOtkryt || checked === 'right' ? null : (
              <button
                type="button"
                className="z6t-disclosure"
                aria-expanded={hintOpen}
                aria-controls={podskazkaId}
                onClick={() => {
                  setHintOpen(!hintOpen);
                  if (!podskazki.includes(index)) {
                    setPodskazki((p) => [...p, index]);
                  }
                }}
              >
                {hintOpen ? T.skrytPodskazku : T.podskazka}
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            )}
            <button
              type="button"
              className="z6t-disclosure"
              aria-expanded={razborOtkryt}
              aria-controls={razborId}
              onClick={() => {
                if (razborOtkryt) {
                  setRazborOtkryt(false);
                  return;
                }
                setRazborOtkryt(true);
                setHintOpen(false);
                if (marks[index] === undefined && checked !== 'right') {
                  setTried((t) => ({ ...t, [index]: true }));
                  setRazbory((r) => [...r, index]);
                  zapisat(false, false);
                }
              }}
            >
              {razborOtkryt ? T.skrytRazbor : T.razbor}
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {proto?.kartochka ? (
              <a className="btn btn--ghost" href={`${base}/teoriya/#k-${proto.kartochka}`}>
                {T.teoriya}
              </a>
            ) : null}
          </div>
          {zakryta || razborOtkryt ? null : <p className="z6t__hint">{T.razborShtraf}</p>}
          <div id={podskazkaId} className="z6t-panel" hidden={!hintOpen || razborOtkryt}>
            {hintOpen && !razborOtkryt ? (
              s ? (
                <Podskazki7
                  shagi={s.hints}
                  otkryto={shag}
                  mimo={mimo}
                  onVerno={() => {
                    setShag(shag + 1);
                    setMimo([]);
                  }}
                  onMimo={(j) => {
                    setMimo((x) => [...x, j]);
                    setMisses((n) => n + 1);
                  }}
                />
              ) : (
                <p>{T.zagruzka}</p>
              )
            ) : null}
          </div>
          <div id={razborId} className="z6t-panel" hidden={!razborOtkryt}>
            {razborOtkryt ? s ? <Razbor6 s={s} /> : <p>{T.zagruzka}</p> : null}
          </div>
        </div>
      )}
    </article>
  );
}
