'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import { TRENAZHER_7 } from '@/content/zadanie7';
import type { ZadachaLite } from '@/lib/zadanie7/dannye';
import { estPi, chisloIzVvoda } from '@/lib/zadanie7/otvet';
import { trenazher7 } from '@/lib/zadanie7/progress';
import type { ProtoInfo7 } from '@/lib/zadanie7/protoInfo';
import { answerMatches } from '@/lib/zadanie7/secret';
import type { TaskMark } from '@/lib/trainerSession/types';
import type { Solved } from '@/lib/zadanie7/types';
import { useSessionReport } from '../session/useSessionReport';
import { Podskazki7 } from './Podskazki7';
import { Razbor7 } from './Razbor7';
import type { Trenazher7Ui } from './trenazher7Sessiya';

const T = TRENAZHER_7;

/** Решение строится в браузере решателем прототипа (динамический импорт). */
export function useReshenie7(z: ZadachaLite | undefined, nuzhno: boolean): Solved | null {
  const [gotovo, setGotovo] = useState<{ id: string; s: Solved } | null>(null);
  useEffect(() => {
    let zhivo = true;
    if (z && nuzhno) {
      void import('@/lib/zadanie7/prototypes').then((m) => {
        if (zhivo) {
          setGotovo({ id: z.id, s: m.prototype(z.prototypeId).solve(z.params) });
        }
      });
    }
    return () => {
      zhivo = false;
    };
  }, [z, nuzhno]);
  return gotovo && z && gotovo.id === z.id && nuzhno ? gotovo.s : null;
}

/** Метка задачи: «Задача ФИПИ №12» или «Не из открытого банка». */
export function metkaZadachi(z: ZadachaLite): string {
  return z.source === 'fipi' && z.no !== undefined ? T.fipiNo(z.no) : T.analog;
}

/** Разбор задачи на экране итогов (открывается по кнопке). */
export function Review7({ z }: { z: ZadachaLite }) {
  const s = useReshenie7(z, true);
  return s ? <Razbor7 s={s} /> : <p>{T.zagruzka}</p>;
}

export interface Reshenie7Props {
  zadachi: ZadachaLite[];
  prototipy: ProtoInfo7[];
  base: string;
  restored: Trenazher7Ui | null;
  report: (ui: Trenazher7Ui) => void;
  elapsed: () => number;
  onFinish: () => void;
}

/**
 * Экран задачи тренажёра №7.
 *
 * Сверху — метка (ФИПИ или «не из открытого банка») и прототип, затем
 * условие и поле ответа: принимается любая верная запись числа (1,4 =
 * 1.4 = 7/5 = −(−1,4)); если ответ записан через $\pi$, тренажёр
 * просит число и попыткой это не считает. Подсказка — вопросы с
 * кнопками по шагам; «Показать разбор» — этапы с выделенными ОДЗ и
 * отбором корней; «Повторить теорию» ведёт на карточку прототипа.
 *
 * Исход задачи пишется в хранилище тренажёра по прототипу: верно без
 * подсказок — начисто; с подсказкой или после ошибки — «с подсказкой»;
 * открыл разбор, не решив, — не решена. Всё состояние экрана — в
 * общей сессии: переход между вкладками и перезагрузка его не теряют.
 */
export function Reshenie7({
  zadachi,
  prototipy,
  base,
  restored,
  report,
  elapsed,
  onFinish,
}: Reshenie7Props) {
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

  useSessionReport<Trenazher7Ui>(report, {
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
  const s = useReshenie7(z, hintOpen || razborOtkryt);
  const zakryta = marks[index] !== undefined || razborOtkryt;
  const last = index === zadachi.length - 1;

  if (z === undefined) {
    return null;
  }

  function zapisat(right: boolean, clean: boolean) {
    if (z === undefined || marks[index] !== undefined) {
      return;
    }
    trenazher7.recordAttempt({
      kind: z.prototypeId,
      taskId: z.id,
      right,
      clean,
      seconds: (elapsed() - nachalo) / 1000,
    });
    if (right) {
      setMarks((m) => ({ ...m, [index]: clean ? 'right' : 'hinted' }));
    }
  }

  function proverit() {
    if (z === undefined || value.trim() === '' || checked === 'right') {
      return;
    }
    if (estPi(value)) {
      setZamechanie(T.pi);
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
    <article className="z7-zadacha">
      <p className="z7-uslovie__metka">
        {metkaZadachi(z)}
        {proto ? (
          <>
            {' · '}
            {proto.kod} <Tex text={proto.title} />
          </>
        ) : null}
      </p>
      <p className="z7-uslovie__text">
        <Tex text={z.text} />
      </p>
      <form
        className="z7-otvet"
        onSubmit={(e) => {
          e.preventDefault();
          proverit();
        }}
      >
        <label htmlFor={`otvet-${z.id}`}>{T.otvet}</label>
        <input
          id={`otvet-${z.id}`}
          className="z7-otvet__input"
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
        <p className="z7-otvet__itog" role="status">
          <Tex text={zamechanie} />
        </p>
      ) : null}
      {checked ? (
        <p
          className={clsx('z7-otvet__itog', checked === 'right' ? 'is-verno' : 'is-neverno')}
          role="status"
        >
          {checked === 'right' ? T.verno : T.neverno}
        </p>
      ) : null}
      <div className="z7-zadacha__dop">
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
              setMimo((m) => [...m, j]);
              setMisses((n) => n + 1);
            }}
          />
        ) : (
          <p>{T.zagruzka}</p>
        )
      ) : null}
      {razborOtkryt ? s ? <Razbor7 s={s} /> : <p>{T.zagruzka}</p> : null}
      {zakryta || checked === 'right' ? (
        <div className="z7-tr__nav">
          <button type="button" className="btn btn--primary" onClick={dalshe}>
            {last ? T.rezultat : T.dalshe}
          </button>
        </div>
      ) : (
        <div className="z7-tr__nav">
          <button type="button" className="btn btn--ghost" onClick={dalshe}>
            {last ? T.rezultat : 'Пропустить'}
          </button>
        </div>
      )}
    </article>
  );
}
