'use client';

import { VDomashkuOpornyeBanka } from '@/components/dz2/knopki';
import { zhurnalBanka } from '@/lib/trening/zhurnalBanka';
import { useZapisZadachi } from '@/lib/zhurnal/zapis';
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
  /** Ответ, закрытый ключом «id|otvet» (этап 4в): только для «В домашку». */
  otvet?: string;
}

export interface OpornyeBankaProps {
  /** Номер хранения раздела: журнал решения задач (этап 4в). Нет — не пишется. */
  taskNo?: number;
  /** Название блока: «В домашку» учителю (этап 4в). Нет — кнопки нет. */
  nazvanie?: string;
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
  /**
   * Рисунок под условием по ключу задачи — готовая серверная разметка
   * (картинка сюжета №10). Необязателен: у задач без рисунка — ничего.
   */
  risunki?: Record<string, ReactNode>;
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
  taskNo,
  nazvanie,
  blok,
  zapomni,
  zadachi,
  store,
  proverit,
  raskryt,
  piPodskazka,
  labels,
  risunki,
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
  /* Журнал решения задач (lib/zhurnal, этап 4в): тип — блок, задача — её ключ. */
  const zapis = useZapisZadachi(
    z === undefined || taskNo === undefined
      ? null
      : zhurnalBanka(String(taskNo), { id: z.id, p: blok, text: z.uslovie }, 'opornye', blok, z.id),
  );
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
    if (checked === 'wrong') zapis?.zakryt(false);
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
      zapis?.popytka(value, false, 'format');
      setFormat(piPodskazka);
      return;
    }
    if (reading.kind === 'format') {
      zapis?.popytka(value, false, 'format');
      setFormat(formatHint(reading.problem, reading.meant));
      return;
    }
    if (reading.kind === 'fractionRight') {
      zapis?.popytka(value, false, 'fraction');
      setFormat(fractionRightHint(reading.decimal));
      return;
    }
    setFormat(null);
    const ok = reading.right;
    setChecked(ok ? 'right' : 'wrong');
    zapis?.popytka(value, ok);
    if (ok) zapis?.zakryt(true);
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
    <>
      {taskNo === undefined || nazvanie === undefined ? null : (
        /* Учителю: блок целиком — в корзину новой выдачи ДЗ (docs/kabinet-dz2.md). */
        <div className="dz2-ryad">
          <VDomashkuOpornyeBanka
            taskNo={taskNo}
            blok={blok}
            nazvanie={nazvanie}
            zadachi={zadachi}
            raskryt={raskryt}
          />
        </div>
      )}
      <OpornayaZadacha
        index={index}
        ishody={ishody}
        onOpen={open}
        uslovieHtml={typeset(zadacha.uslovie)}
        {...(risunki?.[zadacha.id] === undefined ? {} : { risunok: risunki[zadacha.id] })}
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
          onOpen: () => {
            setHintOpen(true);
            zapis?.shagPodskazki(1);
          },
        }}
        /* Решение — после ответа: до проверки доступна только подсказка. */
        reshenie={
          checked === null
            ? null
            : {
                shagi,
                open: solutionOpen,
                onToggle: () => {
                  if (!solutionOpen) zapis?.reshenie();
                  setSolutionOpen(!solutionOpen);
                },
              }
        }
        zapomni={zapomni}
        labels={labels}
      />
    </>
  );
}
