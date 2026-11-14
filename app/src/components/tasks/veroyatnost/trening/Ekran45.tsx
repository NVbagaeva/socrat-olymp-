'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookmarkButton } from '@/components/zakladki/BookmarkButton';
import { useBeforeFinish } from '../../session/useBeforeFinish';
import { useSessionReport } from '../../session/useSessionReport';
import { EkranZadachi, type SostoyanieZadachi } from '../../trening/EkranZadachi';
import { PodskazkaVoprosy } from '../../trening/PodskazkaVoprosy';
import { assetUrl } from '@/lib/assetUrl';
import { formatHint, fractionRightHint } from '@/lib/otvet';
import type { LogOutcome } from '@/lib/progressLog';
import type { TaskMark } from '@/lib/trainerSession/types';
import { otkrytPodskazku, otkrytRazbor, type Razbor } from '@/lib/veroyatnost/razbor';
import type { Pool, UznayPool } from '@/lib/veroyatnost/pool';
import { zadachaHref45, type Zadanie45 } from '@/lib/veroyatnost/trening/links';
import { readSealed45 } from '@/lib/veroyatnost/trening/otvet45';
import { log45 } from '@/lib/veroyatnost/trening/progress';
import { sRazborami } from '../razboryKlient';
import { zadachaBanka, type SessiyaPayload, type SessiyaZadacha } from '../sessiyaPayload';
import type { TekstyTrenazhera45 } from '@/content/veroyatnost45';
import { risunok45, shagi45, voprosy45 } from './shagi45';
import type { Ui45 } from './ui45';

/**
 * Замены «Похожая задача»: экран подменяет задачу тренировки другим
 * вариантом того же прототипа и кладёт его сюда, чтобы итоги описывали
 * ту задачу, которую ученик решал. Ключ — тренировка (по ссылке).
 */
export const ZAMENY45 = new WeakMap<SessiyaPayload, Record<number, SessiyaZadacha>>();

/** Задача тренировки с учётом замены. */
export function zadachaNa(payload: SessiyaPayload, at: number): SessiyaZadacha | undefined {
  return ZAMENY45.get(payload)?.[at] ?? payload.tasks[at];
}

/** Ключ «прототип:вариант» → прототип и номер. */
function razobratKlyuch(id: string): [string, number] | null {
  const at = id.lastIndexOf(':');
  const n = Number(id.slice(at + 1));
  return at <= 0 || !Number.isInteger(n) ? null : [id.slice(0, at), n];
}

/** Задачи с разборами из файлов сборки: id → задача. Грузятся один раз. */
function useGotovye(tasks: readonly SessiyaZadacha[], zadanie: Zadanie45, versiya: string) {
  const [gotovye, setGotovye] = useState<ReadonlyMap<string, SessiyaZadacha>>(new Map());
  const [oshibka, setOshibka] = useState(false);
  const [popytka, setPopytka] = useState(0);
  useEffect(() => {
    let zhiv = true;
    sRazborami(tasks, zadanie, versiya).then(
      (list) => {
        if (zhiv) {
          setOshibka(false);
          setGotovye(new Map(list.map((t) => [t.id, t])));
        }
      },
      () => {
        if (zhiv) setOshibka(true);
      },
    );
    return () => {
      zhiv = false;
    };
  }, [tasks, zadanie, versiya, popytka]);
  return { gotovye, oshibka, povtorit: () => setPopytka((n) => n + 1) };
}

export interface Ekran45Props {
  zadanie: Zadanie45;
  payload: SessiyaPayload;
  pool: Pool;
  uznay: UznayPool;
  versiya: string;
  roundKey: string;
  restored: Ui45 | null;
  report: (ui: Ui45) => void;
  elapsed: () => number;
  onFinish: () => void;
  setBeforeFinish: (handler: (() => void) | null) => void;
  /** Название метода по id (метка над условием в отработке). */
  nazvaniyaMetodov: Record<string, string>;
  /** Название типа текстом: для закладки. */
  nazvaniyaTekst: Record<string, string>;
  T: TekstyTrenazhera45;
}

/**
 * Экран задачи тренажёра №4 и №5 на общем экране «Стеклянной сцены»
 * (EkranZadachi): картинка к задаче над условием — как есть, условие,
 * поле ответа, вердикт, подсказка-вопросы, решение по шагам и рисунок
 * метода с подсветкой благоприятного (движок components/probability).
 *
 * Ответ читается по правилам бланка ЕГЭ и сверяется с отпечатком;
 * неверная запись — подсказка о записи, попытка не тратится. Решение и
 * подсказка лежат закрытыми и догружаются файлами прототипов
 * (razboryKlient.ts). В режиме без подсказок их нет до итогов.
 */
export function Ekran45({
  zadanie,
  payload,
  pool,
  uznay,
  versiya,
  roundKey,
  restored,
  report,
  elapsed,
  onFinish,
  setBeforeFinish,
  nazvaniyaMetodov,
  nazvaniyaTekst,
  T,
}: Ekran45Props) {
  const log = log45(zadanie);
  const control = !payload.podskazki;
  const tasks = payload.tasks;
  const [index, setIndex] = useState(restored?.index ?? 0);
  const [value, setValue] = useState(restored?.value ?? '');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(restored?.checked ?? null);
  const [marks, setMarks] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});
  const [solutionOpen, setSolutionOpen] = useState(restored?.solutionOpen ?? false);
  const [hintOpen, setHintOpen] = useState(restored?.hintOpen ?? false);
  const [shag, setShag] = useState(restored?.shag ?? 1);
  const [mimo, setMimo] = useState<number[]>(restored?.mimo ?? []);
  const [misses, setMisses] = useState(restored?.misses ?? 0);
  const [taskFrom, setTaskFrom] = useState<number | null>(() => restored?.taskFrom ?? elapsed());
  const [failed, setFailed] = useState(restored?.failed ?? false);
  const [pohozhie, setPohozhie] = useState<Record<string, string>>(restored?.pohozhie ?? {});
  /* Подсказка о записи ответа: не ошибка, попытка не тратится; не хранится. */
  const [format, setFormat] = useState<string | null>(null);
  const [viaFraction, setViaFraction] = useState(false);

  /* Замены «Похожая задача» — задачи банка страницы. */
  const zameny = useMemo(() => {
    const out: Record<number, SessiyaZadacha> = {};
    for (const [at, id] of Object.entries(pohozhie)) {
      const source = tasks[Number(at)];
      const k = razobratKlyuch(id);
      const z = k === null ? null : zadachaBanka(k[0], k[1], payload.rezhim, pool, uznay);
      if (source !== undefined && z !== null) {
        out[Number(at)] = source.fixes === undefined ? z : { ...z, fixes: source.fixes };
      }
    }
    return out;
  }, [pohozhie, tasks, payload.rezhim, pool, uznay]);
  useEffect(() => {
    ZAMENY45.set(payload, zameny);
  }, [payload, zameny]);

  const vse = useMemo(() => [...tasks, ...Object.values(zameny)], [tasks, zameny]);
  const { gotovye, oshibka, povtorit } = useGotovye(vse, zadanie, versiya);

  useSessionReport<Ui45>(report, {
    index,
    marks,
    tried,
    order: null,
    value,
    checked,
    solutionOpen,
    hintOpen,
    shag,
    mimo,
    misses,
    failed,
    taskFrom,
    vybor: null,
    pohozhie,
  });

  const task = zameny[index] ?? tasks[index];
  const gotovaya = task === undefined ? undefined : gotovye.get(task.id);

  /* Разбор и подсказка открываются, когда нужны: до этого в памяти их нет. */
  const otvetOtkryt = checked === 'right' || solutionOpen;
  const razbor = useMemo<Razbor | null>(
    () =>
      gotovaya === undefined || !(otvetOtkryt || hintOpen) || gotovaya.steps === ''
        ? null
        : otkrytRazbor(gotovaya.steps, gotovaya.seal),
    [gotovaya, otvetOtkryt, hintOpen],
  );
  const voprosy = useMemo(
    () =>
      gotovaya?.podskazka === undefined || !hintOpen
        ? []
        : voprosy45(otkrytPodskazku(gotovaya.podskazka, gotovaya.seal)),
    [gotovaya, hintOpen],
  );

  function taskSeconds(): number {
    return taskFrom === null ? 0 : (elapsed() - taskFrom) / 1000;
  }

  /* Журнал попыток: тип — метод задачи (как и прежде), задача —
     «прототип:вариант». Аналог из «Работы над ошибками» — с задачей,
     ошибку в которой он закрывает. */
  function remember(item: SessiyaZadacha, outcome: LogOutcome) {
    if (item.metod === '') return;
    log.record({
      task: item.id,
      kind: item.metod,
      outcome,
      seconds: Math.round(taskSeconds()),
      session: roundKey,
      ...(item.fixes === undefined ? {} : { fixes: item.fixes }),
    });
  }

  useBeforeFinish(setBeforeFinish, () => {
    if (task !== undefined && checked === 'wrong' && marks[index] === undefined) {
      remember(task, 'wrong');
    }
  });

  if (task === undefined) {
    return null;
  }
  if (gotovaya === undefined) {
    return (
      <div className="trn-ekran trn-zagruzka" role="status" aria-live="polite">
        {oshibka ? (
          <>
            <p>{T.ekran.oshibkaZagruzki}</p>
            <button type="button" className="stk-btn stk-btn--primary" onClick={povtorit}>
              {T.ekran.povtorit}
            </button>
          </>
        ) : (
          <p>{T.ekran.zagruzka}</p>
        )}
      </div>
    );
  }
  const tekushchaya: SessiyaZadacha = gotovaya;

  const total = tasks.length;
  const revealed = solutionOpen && checked !== 'right';
  const sostoyanie: SostoyanieZadachi =
    checked === 'right' ? 'verno' : revealed ? 'razbor' : checked === 'wrong' ? 'neverno' : 'vvod';
  const last = index === total - 1;
  const zakryta = marks[index] !== undefined;

  function check() {
    const reading = readSealed45(value, tekushchaya.seal, tekushchaya.klyuch);
    if (reading.kind === 'format') {
      setFormat(formatHint(reading.problem, reading.meant));
      return;
    }
    if (reading.kind === 'fractionRight') {
      /* Значение верное, но дробью: не засчитано и не ошибка. */
      setFormat(fractionRightHint(reading.decimal));
      return;
    }
    setFormat(null);
    const right = reading.right;
    setViaFraction(!right && reading.viaFraction);
    setChecked(right ? 'right' : 'wrong');
    if (right) {
      if (!zakryta) {
        const chisto = !failed && !hintOpen;
        setMarks({ ...marks, [index]: chisto ? 'right' : 'hinted' });
        remember(tekushchaya, failed ? 'wrong' : hintOpen ? 'hinted' : 'right');
      }
    } else {
      setFailed(true);
      setMisses(misses + 1);
      setTried({ ...tried, [index]: true });
    }
  }

  function reveal() {
    const wasOpen = solutionOpen;
    setSolutionOpen(!wasOpen);
    if (!wasOpen && checked !== 'right' && !zakryta) {
      /* Решение открыто до верного ответа: задача закрыта «с разбором». */
      setMarks({ ...marks, [index]: 'hinted' });
      remember(tekushchaya, 'revealed');
    }
  }

  function resetTask() {
    setTaskFrom(elapsed());
    setFailed(false);
    setValue('');
    setChecked(null);
    setSolutionOpen(false);
    setHintOpen(false);
    setShag(1);
    setMimo([]);
    setFormat(null);
    setViaFraction(false);
  }

  function next() {
    if (checked === 'wrong' && !zakryta) {
      remember(tekushchaya, 'wrong');
    }
    if (last) {
      onFinish();
      return;
    }
    resetTask();
    setIndex(index + 1);
  }

  /* «Похожая задача»: другой вариант того же прототипа, которого ещё не было. */
  const zanyato = new Set(vse.map((t) => t.id));
  const kind = pool.kinds.find((k) => k.id === tekushchaya.kind);
  const svobodnye = (kind?.variants ?? []).filter(
    (v) => !zanyato.has(`${tekushchaya.kind}:${v.n}`),
  );

  function pohozhaya() {
    const v = svobodnye[Math.floor(Math.random() * svobodnye.length)];
    if (v === undefined) {
      return;
    }
    const nextMarks = { ...marks };
    delete nextMarks[index];
    const nextTried = { ...tried };
    delete nextTried[index];
    setMarks(nextMarks);
    setTried(nextTried);
    setPohozhie({ ...pohozhie, [index]: `${tekushchaya.kind}:${v.n}` });
    resetTask();
  }

  const kartinka = tekushchaya.illustration ?? tekushchaya.model?.illustration;
  /* Над условием — метод (в отработке с подсказками, как и прежде); в
     смешанном режиме и в «Работе над ошибками» метод узнают сами. */
  const metka =
    payload.rezhim === 'practice' && !control
      ? (nazvaniyaMetodov[tekushchaya.metod] ?? T.ekran.istochnik)
      : T.ekran.istochnik;

  return (
    <EkranZadachi
      taskId={tekushchaya.id}
      nomer={index + 1}
      vsego={total}
      tipHtml={metka}
      uslovieHtml={tekushchaya.uslovie}
      tekst
      {...(kartinka === undefined
        ? {}
        : {
            risunok: (
              /* Картинка к задаче — как есть: без обрезки, прозрачный фон. */
              <img
                className="z45-kartinka"
                src={assetUrl(kartinka.path)}
                alt={kartinka.alt}
                decoding="async"
              />
            ),
          })}
      value={value}
      onValue={(nextValue) => {
        setValue(nextValue);
        setFormat(null);
        if (checked === 'wrong') {
          setChecked(null);
        }
      }}
      sostoyanie={sostoyanie}
      onCheck={check}
      formatHint={format}
      podskazka={
        control || tekushchaya.podskazka === undefined
          ? null
          : {
              html: '',
              open: hintOpen,
              onOpen: () => setHintOpen(true),
              telo:
                voprosy.length === 0 ? (
                  <p>{T.ekran.zagruzka}</p>
                ) : (
                  <PodskazkaVoprosy
                    voprosy={voprosy}
                    otkryto={shag}
                    mimo={mimo}
                    onVerno={() => {
                      setShag(shag + 1);
                      setMimo([]);
                    }}
                    onMimo={(j) => setMimo([...mimo, j])}
                    labels={T.ekran.voprosy}
                  />
                ),
            }
      }
      reshenie={
        control
          ? null
          : {
              shagi: razbor === null || !otvetOtkryt ? [] : shagi45(razbor),
              posle:
                razbor === null || !otvetOtkryt ? undefined : (
                  <>
                    {razbor.metod === '' ? null : (
                      <p className="z45-metod">
                        <b>{T.ekran.metod}:</b> {razbor.metod}
                      </p>
                    )}
                    {risunok45(razbor, checked === 'right', T.ekran.risunok)}
                  </>
                ),
              open: solutionOpen,
              onToggle: reveal,
            }
      }
      {...(svobodnye.length > 0 ? { onPohozhaya: pohozhaya } : {})}
      onNext={next}
      last={last}
      zakladka={
        <BookmarkButton
          section={String(zadanie)}
          place="trenazher"
          refId={tekushchaya.id}
          title={T.ekran.zakladka(nazvaniyaTekst[tekushchaya.kind] ?? '')}
          href={zadachaHref45(zadanie, tekushchaya.id)}
          className="trn-zakladka"
        />
      }
      bezPodskazok={control}
      labels={{
        ...T.ekran,
        vernoLead: T.ekran.vernoLead(checked === 'right' ? taskSeconds() : null),
        nevernoLead: viaFraction ? T.ekran.nevernoDrob : T.ekran.nevernoLead,
      }}
    />
  );
}
