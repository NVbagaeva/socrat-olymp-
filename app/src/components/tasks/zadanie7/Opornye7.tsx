'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { OpornayaZadacha, OpornyeSpisok, type OpornyyIshod, type OpornyyNavyk } from '../opornye';
import type { Shag } from '../steklo';
import { OPORNYE7, TRENAZHER7 } from '@/content/uravneniya7';
import { scrollTabTo } from '@/lib/tabScroll';
import type { MikroDlyaBrauzera } from '@/lib/zadanie7/opornye';
import { chisloIzVvoda, estPi } from '@/lib/zadanie7/otvet';
import { opornye7 } from '@/lib/zadanie7/progress';
import { answerMatches, openText } from '@/lib/zadanie7/secret';
import { typeset } from '@/lib/tex';

/** Блок в списке: без прогресса — его добавляет браузер. */
export interface Blok7Kartochka {
  slug: string;
  href: string;
  nazvanie: string;
  znakHtml: string;
  /** Ключи задач блока: по ним считается «решено». */
  zadachi: string[];
}

export interface Navyk7Kartochki extends Omit<OpornyyNavyk, 'bloki'> {
  bloki: Blok7Kartochka[];
}

/**
 * Список опорных задач №7: навыки и их блоки по десять задач — на общих
 * карточках (components/tasks/opornye). Прогресс — из хранилища опорных
 * задач (lib/zadanie7/progress, ключ прежний).
 */
export function Opornye7Spisok({ navyki }: { navyki: Navyk7Kartochki[] }) {
  const progress = opornye7.useProgress();
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
      labels={OPORNYE7.spisok}
    />
  );
}

/** Строки разбора задачи → шаги сцены (содержание не меняется). */
function shagiRazbora(z: MikroDlyaBrauzera): Shag[] {
  try {
    const stroki = JSON.parse(openText(z.razbor, z.id)) as unknown;
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
 * Экран блока опорных задач №7: по одной задаче, поле ответа (любая
 * верная запись числа), подсказка, решение по шагам. Сверху — плашка
 * «Запомни» с правилом блока: формулы здесь, а не на карточке блока.
 * Исход задачи — в хранилище прогресса опорных задач (opornye7).
 */
export function Opornye7({
  blok,
  zapomni,
  zadachi,
}: {
  blok: string;
  /** Правило блока, уже набранное (серверный узел). */
  zapomni: ReactNode;
  zadachi: MikroDlyaBrauzera[];
}) {
  const progress = opornye7.useProgress();
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [format, setFormat] = useState<string | null>(null);

  const z = zadachi[index];
  const shagi = useMemo(() => (z === undefined ? [] : shagiRazbora(z)), [z]);
  if (z === undefined) {
    return null;
  }
  const zadacha: MikroDlyaBrauzera = z;

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
    if (estPi(value)) {
      setFormat(typeset(TRENAZHER7.ekran.pi));
      return;
    }
    if (chisloIzVvoda(value) === null) {
      setFormat(typeset(TRENAZHER7.ekran.nechislo));
      return;
    }
    setFormat(null);
    const ok = answerMatches(value, zadacha.seal);
    setChecked(ok ? 'right' : 'wrong');
    opornye7.recordAttempt({
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
      labels={OPORNYE7.zadacha}
    />
  );
}
