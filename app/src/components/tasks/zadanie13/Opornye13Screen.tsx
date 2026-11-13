'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { OpornayaZadacha, type OpornyyIshod } from '../opornye';
import { PodskazkaVoprosy } from '../trening/PodskazkaVoprosy';
import { OPORNYE13, TRENAZHER13 } from '@/content/ekonomicheskie13';
import { formatHint, fractionRightHint } from '@/lib/otvet';
import { scrollTabTo } from '@/lib/tabScroll';
import { estPi } from '@/lib/zadanie7/otvet';
import { generate } from '@/lib/zadanie13/generate';
import { sealZadacha13, shagiTipa, type Zadacha13Sealed } from '@/lib/zadanie13/opornye/seal';
import { itog13, opornye13, zadachaId13, zapisat13 } from '@/lib/zadanie13/progress';
import { reshenieShagami } from '@/lib/zadanie13/reshenieHtml';
import { openText } from '@/lib/zadanie13/secret';
import { proverit13 } from '@/lib/zadanie13/trening/otvet13';
import type { Vopros13 } from '@/lib/zadanie13/trening/zagruzka';
import { TYPE_NAMES } from '@/lib/zadanie13/types';
import { otvetText } from '@/lib/zadanie13/html';
import { shagi13, voprosy13 } from './shagi13';
import { TablitsaZapolni13, urovenPoNomeru } from './TablitsaZapolni13';
/* Подсказка-вопросы — общий компонент тренажёра; его стили — при тренажёре. */
import '../trening/trening.css';

export interface Opornye13ScreenProps {
  blockId: string;
  vid: 'zadachi' | 'tip';
  /** Десять задач блока в закрытом виде, собраны на сборке. */
  tasks: (Zadacha13Sealed & { no: number })[];
  /** Плашка «Запомни», свёрстана. */
  zapomni: ReactNode;
}

function izJson<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** Seed для кнопки «Ещё вариант»: время и случайный хвост. */
function sluchaynyySeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Экран блока «Опорных задач» №13 на общем экране задачи блока
 * (components/tasks/opornye, образец — №3, №7, №6): «Запомни», условие с
 * таблицей условия и таблицей «заполни» (блоки 1–3, своя клавиатура),
 * ответ числом или выбором схемы, вердикт «Число верное, единицы нет»,
 * подсказка-вопросы, решение по шагам с таблицами, «Ещё вариант» и
 * точки-номера. Прогресс — прежнее хранилище опорных задач №13.
 */
export function Opornye13Screen({ blockId, vid, tasks, zapomni }: Opornye13ScreenProps) {
  const progress = opornye13.useProgress();
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [edinicy, setEdinicy] = useState(false);
  const [format, setFormat] = useState<string | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [shag, setShag] = useState(1);
  const [mimo, setMimo] = useState<number[]>([]);
  const [solutionOpen, setSolutionOpen] = useState(false);
  /* Свежие варианты по номеру задачи: пока не просили — задача банка. */
  const [fresh, setFresh] = useState<Record<number, Zadacha13Sealed>>({});

  const base = tasks[index];
  const task: Zadacha13Sealed | undefined =
    base === undefined ? undefined : (fresh[base.no] ?? base);

  const voprosy = useMemo(
    () =>
      task === undefined || !hintOpen
        ? []
        : voprosy13(
            (izJson<Vopros13[]>(openText(task.podskazki, task.seal)) ?? []).map((v) => ({
              ...v,
              comment: v.comment ?? null,
            })),
          ),
    [task, hintOpen],
  );
  /* Решение по шагам — та же задача движка (seed тот же), разбитая на шаги. */
  const reshenie = useMemo(() => {
    if (task === undefined || !solutionOpen) return null;
    try {
      const t = generate(task.prototypeId, task.seed);
      return vid === 'tip'
        ? { shagi: shagi13(reshenieShagami(shagiTipa(t.type), null)), otvet: TYPE_NAMES[t.type] }
        : {
            shagi: shagi13(reshenieShagami(t.solution, t.tableModel)),
            otvet: otvetText(t.answer, t.units),
          };
    } catch {
      return null;
    }
  }, [task, solutionOpen, vid]);

  if (base === undefined || task === undefined) {
    return null;
  }
  const zadacha: Zadacha13Sealed = task;
  const no = base.no;

  const ishody: OpornyyIshod[] = tasks.map((x) => {
    const it = itog13(progress, blockId, x.no);
    return it === 'right' ? 'right' : it === null ? null : 'wrong';
  });

  function reset() {
    setValue('');
    setChecked(null);
    setEdinicy(false);
    setFormat(null);
    setHintOpen(false);
    setShag(1);
    setMimo([]);
    setSolutionOpen(false);
  }

  function open(next: number) {
    if (next < 0 || next >= tasks.length) return;
    setIndex(next);
    reset();
    scrollTabTo('.op-zad');
  }

  function check() {
    if (value.trim() === '') return;
    const tip = zadacha.vybory !== null;
    if (!tip && estPi(value)) {
      setFormat(TRENAZHER13.ekran.piPodskazka);
      return;
    }
    const reading = proverit13(value, { ...zadacha, sealTip: zadacha.seal }, tip);
    if (reading.kind === 'format') {
      setFormat(formatHint(reading.problem, reading.meant));
      return;
    }
    if (reading.kind === 'fractionRight') {
      setFormat(fractionRightHint(reading.decimal));
      return;
    }
    setFormat(null);
    const ok = reading.kind === 'answer' && reading.right;
    setEdinicy(reading.kind === 'edinicy');
    setChecked(ok ? 'right' : 'wrong');
    zapisat13(blockId, no, ok ? 'right' : 'wrong');
  }

  function another() {
    setFresh((prev) => ({
      ...prev,
      [no]: sealZadacha13(zadacha.prototypeId, sluchaynyySeed(), vid, no),
    }));
    reset();
  }

  function toggleSolution() {
    if (!solutionOpen && ishody[index] !== 'right') {
      zapisat13(blockId, no, 'revealed');
    }
    setSolutionOpen(!solutionOpen);
  }

  const risunok =
    zadacha.tablitsaHtml === null && zadacha.zapolni === null ? undefined : (
      <>
        {zadacha.tablitsaHtml === null ? null : (
          <div
            className="z13-reshenie z13-op__tablitsa"
            dangerouslySetInnerHTML={{ __html: zadacha.tablitsaHtml }}
          />
        )}
        {zadacha.zapolni === null ? null : (
          <TablitsaZapolni13
            key={`${zadacha.prototypeId}|${zadacha.seed}`}
            t={zadacha.zapolni}
            uroven={urovenPoNomeru(no)}
            oshibkaId={zadachaId13(blockId, no)}
          />
        )}
      </>
    );

  return (
    <OpornayaZadacha
      index={index}
      ishody={ishody}
      onOpen={open}
      uslovieHtml={
        (zadacha.metki.length === 0
          ? ''
          : `<p class="z13-op__metki">${zadacha.metki.join(' · ')}</p>`) + zadacha.uslovieHtml
      }
      {...(risunok === undefined ? {} : { risunok })}
      value={value}
      onValue={(next) => {
        setValue(next);
        setFormat(null);
        if (checked === 'wrong') {
          setChecked(null);
          setEdinicy(false);
        }
      }}
      checked={checked}
      onCheck={check}
      formatHint={format}
      {...(zadacha.vybory === null
        ? {}
        : { vybory: zadacha.vybory.map((v) => ({ number: v.number, labelHtml: v.label })) })}
      {...(edinicy && checked === 'wrong' ? { verdiktNeverno: TRENAZHER13.ekran.edinicy } : {})}
      podskazka={{
        html: '',
        open: hintOpen,
        onOpen: () => setHintOpen(true),
        telo: (
          <PodskazkaVoprosy
            voprosy={voprosy}
            otkryto={shag}
            mimo={mimo}
            onVerno={() => {
              setShag(shag + 1);
              setMimo([]);
            }}
            onMimo={(j) => setMimo([...mimo, j])}
            labels={TRENAZHER13.ekran.voprosy}
          />
        ),
      }}
      /* Решение — после ответа: до проверки доступна только подсказка. */
      reshenie={
        checked === null
          ? null
          : {
              shagi:
                reshenie === null
                  ? []
                  : [
                      ...reshenie.shagi,
                      {
                        zagolovok: OPORNYE13.otvet,
                        chtoHtml: `<p>${reshenie.otvet}</p>`,
                        formulaHtml: '',
                      },
                    ],
              open: solutionOpen,
              onToggle: toggleSolution,
            }
      }
      dop={
        <button type="button" className="stk-btn stk-btn--tihaya" onClick={another}>
          {OPORNYE13.eshcheVariant}
        </button>
      }
      zapomni={zapomni}
      labels={OPORNYE13.zadacha}
    />
  );
}
