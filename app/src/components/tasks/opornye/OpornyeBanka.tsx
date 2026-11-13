'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { formatHint, fractionRightHint, type Reading } from '@/lib/otvet';
import type { ProgressStore } from '@/lib/progressStore';
import { scrollTabTo } from '@/lib/tabScroll';
import { typeset } from '@/lib/tex';
import type { Shag } from '../steklo';
import {
  OpornayaZadacha,
  OpornyeSpisok,
  type OpornayaZadachaLabels,
  type OpornyeSpisokLabels,
  type OpornyyIshod,
  type OpornyyNavyk,
} from './index';

/**
 * Опорные задачи разделов, где задачи блока — короткие задачи с числом в
 * ответе (№7, №6 …): список блоков с прогрессом и экран блока. Прогресс —
 * хранилище опорных задач раздела (lib/progressStore, ключ раздела
 * прежний). Раздел передаёт хранилище, проверку ответа и раскрытие
 * разбора — функции, поэтому обёртка раздела клиентская.
 */

/** Блок в списке: без прогресса — его добавляет браузер. */
export interface BlokKartochka {
  slug: string;
  href: string;
  nazvanie: string;
  znakHtml: string;
  /** Ключи задач блока: по ним считается «решено». */
  zadachi: string[];
}

export interface NavykKartochki extends Omit<OpornyyNavyk, 'bloki'> {
  bloki: BlokKartochka[];
}

export function OpornyeSpisokBanka({
  navyki,
  store,
  labels,
}: {
  navyki: NavykKartochki[];
  store: ProgressStore;
  labels: OpornyeSpisokLabels;
}) {
  const progress = store.useProgress();
  return (
    <OpornyeSpisok
      navyki={navyki.map((navyk) => ({
        ...navyk,
        bloki: navyk.bloki.map(({ zadachi, ...blok }) => ({
          ...blok,
          vsego: zadachi.length,
          resheno: zadachi.filter((id) => progress.outcomes[id] === 'right').length,
        })),
      }))}
      labels={labels}
    />
  );
}

/** Задача блока в браузере: условие, подсказка, закрытые разбор и ответ. */
export interface MikroZadachaBrauzera {
  id: string;
  uslovie: string;
  podskazka: string;
  /** Строки разбора JSON-ом, закрытые ключом задачи. */
  razbor: string;
  seal: string;
}

export interface OpornyeBankaProps {
  blok: string;
  /** Правило блока, уже набранное (серверный узел). */
  zapomni: ReactNode;
  zadachi: MikroZadachaBrauzera[];
  store: ProgressStore;
  /** Ответ ученика по правилам бланка; 'pi' — ответ записан через π. */
  proverit: (vvod: string, seal: string) => Reading | { kind: 'pi' };
  /** Раскрыть разбор задачи (строки с $…$). */
  raskryt: (razbor: string, id: string) => string;
  piPodskazka: string;
  labels: OpornayaZadachaLabels;
}

/** Строки разбора задачи → шаги сцены (содержание не меняется). */
function shagiRazbora(z: MikroZadachaBrauzera, raskryt: OpornyeBankaProps['raskryt']): Shag[] {
  try {
    const stroki = JSON.parse(raskryt(z.razbor, z.id)) as unknown;
    return Array.isArray(stroki)
      ? stroki
          .filter((line): line is string => typeof line === 'string')
          .map((line) => ({ chtoHtml: `<p>${typeset(line)}</p>`, formulaHtml: '' }))
      : [];
  } catch {
    return [];
  }
}

/**
 * Экран блока: по одной задаче, поле ответа (запись — по правилам
 * бланка ЕГЭ, как в тренажёре), подсказка, решение по шагам после
 * ответа. Сверху — плашка «Запомни» с правилом блока: формулы здесь, а
 * не на карточке блока.
 */
export function OpornyeBanka({
  blok,
  zapomni,
  zadachi,
  store,
  proverit,
  raskryt,
  piPodskazka,
  labels,
}: OpornyeBankaProps) {
  const progress = store.useProgress();
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [format, setFormat] = useState<string | null>(null);

  const z = zadachi[index];
  const shagi = useMemo(() => (z === undefined ? [] : shagiRazbora(z, raskryt)), [z, raskryt]);
  if (z === undefined) {
    return null;
  }
  const zadacha: MikroZadachaBrauzera = z;

  const ishody: OpornyyIshod[] = zadachi.map((x) => {
    const it = progress.outcomes[x.id];
    return it === 'right' ? 'right' : it === undefined ? null : 'wrong';
  });

  function open(next: number) {
    if (next < 0 || next >= zadachi.length) {
      return;
    }
    setIndex(next);
    setValue('');
    setChecked(null);
    setHintOpen(false);
    setSolutionOpen(false);
    setFormat(null);
    scrollTabTo('.op-zad');
  }

  function check() {
    if (value.trim() === '') {
      return;
    }
    const reading = proverit(value, zadacha.seal);
    if (reading.kind === 'pi') {
      setFormat(piPodskazka);
      return;
    }
    if (reading.kind === 'format') {
      setFormat(formatHint(reading.problem, reading.meant));
      return;
    }
    if (reading.kind === 'fractionRight') {
      setFormat(fractionRightHint(reading.decimal));
      return;
    }
    setFormat(null);
    const ok = reading.right;
    setChecked(ok ? 'right' : 'wrong');
    store.recordAttempt({
      kind: blok,
      taskId: zadacha.id,
      right: ok,
      clean: ok && !hintOpen,
      seconds: 0,
      itog: ok ? 'right' : 'wrong',
    });
  }

  return (
    <OpornayaZadacha
      index={index}
      ishody={ishody}
      onOpen={open}
      uslovieHtml={typeset(zadacha.uslovie)}
      value={value}
      onValue={(next) => {
        setValue(next);
        setFormat(null);
        if (checked === 'wrong') {
          setChecked(null);
        }
      }}
      checked={checked}
      onCheck={check}
      formatHint={format}
      podskazka={{
        html: typeset(zadacha.podskazka),
        open: hintOpen,
        onOpen: () => setHintOpen(true),
      }}
      /* Решение — после ответа: до проверки доступна только подсказка. */
      reshenie={
        checked === null
          ? null
          : { shagi, open: solutionOpen, onToggle: () => setSolutionOpen(!solutionOpen) }
      }
      zapomni={zapomni}
      labels={labels}
    />
  );
}
