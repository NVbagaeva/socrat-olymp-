'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import { TRENAZHER_6 } from '@/content/zadanie6';
import type { TaskMark } from '@/lib/trainerSession/types';
import type { ZadachaLite } from '@/lib/zadanie6/dannye';
import { chisloIzVvoda } from '@/lib/zadanie6/otvet';
import { trenazher6 } from '@/lib/zadanie6/progress';
import type { ProtoInfo6 } from '@/lib/zadanie6/protoInfo';
import { answerMatches } from '@/lib/zadanie6/secret';
import type * as Prototypes from '@/lib/zadanie6/prototypes';
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
  restored: Trenazher6Ui | null;
  report: (ui: Trenazher6Ui) => void;
  elapsed: () => number;
  onFinish: () => void;
}

/**
 * Экран задачи тренажёра №6.
 *
 * Сверху — метка источника и прототип, затем условие с рисунком (таблица,
 * запись распределения, диаграмма Эйлера, дерево) и поле ответа:
 * принимается любая верная запись числа (0,75 = 0.75 = 3/4). Подсказка —
 * вопросы с кнопками по шагам; «Показать разбор» — шаги с таблицами и
 * выделениями на рисунке; «Повторить теорию» ведёт на карточку прототипа.
 * Исход пишется в хранилище тренажёра по прототипу; всё состояние экрана
 * — в общей сессии (TrainerSessionHost).
 */
export function Reshenie6({
  zadachi,
  prototipy,
  base,
  restored,
  report,
  elapsed,
  onFinish,
}: Reshenie6Props) {
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
  const [zamechanie, setZamechanie] = useState<string | null>(null);
  const m = useModul6();

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
  });

  const z = zadachi[index];
  const proto = useMemo(() => prototipy.find((p) => p.id === z?.prototypeId), [prototipy, z]);
  const s: Solved | null = useMemo(
    () =>
      z && m && (hintOpen || razborOtkryt) ? m.prototype(z.prototypeId).solve(z.params) : null,
    [z, m, hintOpen, razborOtkryt],
  );
  const zakryta = marks[index] !== undefined || razborOtkryt;
  const last = index === zadachi.length - 1;

  if (z === undefined) {
    return null;
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
    if (z === undefined || value.trim() === '' || checked === 'right') {
      return;
    }
    if (chisloIzVvoda(value) === null) {
      setZamechanie(T.nechislo);
      return;
    }
    setZamechanie(null);
    if (answerMatches(value, z.seal)) {
      setChecked('right');
      zapisat(true, !oshibalsya && !hintOpen && !razborOtkryt);
    } else {
      setChecked('wrong');
      setOshibalsya(true);
      setMisses((n) => n + 1);
      setTried((t) => ({ ...t, [index]: true }));
    }
  }

  function dalshe() {
    if (last) {
      onFinish();
      return;
    }
    setIndex(index + 1);
    setValue('');
    setChecked(null);
    setOshibalsya(false);
    setHintOpen(false);
    setShag(1);
    setMimo([]);
    setRazborOtkryt(false);
    setZamechanie(null);
    setNachalo(elapsed());
    window.scrollTo({ top: 0 });
  }

  return (
    <article className="z6-zadacha">
      <p className="z6-zadacha__metka">
        {metkaZadachi(z)}
        {proto ? (
          <>
            {' · '}
            {proto.kod} <Tex text={proto.title} />
          </>
        ) : null}
      </p>
      <UslovieLite z={z} m={m} />
      <form
        className="z6-otvet"
        onSubmit={(e) => {
          e.preventDefault();
          proverit();
        }}
      >
        <label htmlFor={`otvet-${z.id}`}>{T.otvet}</label>
        <input
          id={`otvet-${z.id}`}
          className="z6-otvet__input"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          disabled={checked === 'right'}
          onChange={(e) => {
            setValue(e.target.value);
            if (checked === 'wrong') {
              setChecked(null);
            }
          }}
        />
        <button type="submit" className="btn btn--primary" disabled={checked === 'right'}>
          {T.proverit}
        </button>
      </form>
      {zamechanie ? (
        <p className="z6-otvet__itog" role="status">
          <Tex text={zamechanie} />
        </p>
      ) : null}
      {checked ? (
        <p
          className={clsx('z6-otvet__itog', checked === 'right' ? 'is-verno' : 'is-neverno')}
          role="status"
        >
          {checked === 'right' ? T.verno : T.neverno}
        </p>
      ) : null}
      <div className="z6-zadacha__dop">
        {!razborOtkryt && checked !== 'right' ? (
          <button
            type="button"
            className="btn btn--secondary"
            aria-expanded={hintOpen}
            onClick={() => setHintOpen(!hintOpen)}
          >
            {hintOpen ? T.skrytPodskazku : T.podskazka}
          </button>
        ) : null}
        {!razborOtkryt ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setRazborOtkryt(true);
              if (marks[index] === undefined) {
                setTried((t) => ({ ...t, [index]: true }));
                zapisat(false, false);
              }
            }}
          >
            {T.razbor}
          </button>
        ) : null}
        {proto?.kartochka ? (
          <a className="btn btn--ghost" href={`${base}/teoriya/#k-${proto.kartochka}`}>
            {T.teoriya}
          </a>
        ) : null}
      </div>
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
      {razborOtkryt ? s ? <Razbor6 s={s} /> : <p>{T.zagruzka}</p> : null}
      <div className="z6-tr__nav">
        <button
          type="button"
          className={zakryta || checked === 'right' ? 'btn btn--primary' : 'btn btn--ghost'}
          onClick={dalshe}
        >
          {last ? T.rezultat : zakryta || checked === 'right' ? T.dalshe : 'Пропустить'}
        </button>
      </div>
    </article>
  );
}
