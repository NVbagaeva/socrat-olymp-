'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { FigureZoom } from '@/components/ui';
import { OpornyeSpisokBanka, type NavykKartochki } from '../opornye/OpornyeBanka';
import { OpornayaZadacha, type OpornyyIshod } from '../opornye';
import type { Shag } from '../steklo';
import { OPORNYE1, TRENAZHER1 } from '@/content/planimetriya1';
import { formatHint, fractionRightHint } from '@/lib/otvet';
import { mikroById } from '@/lib/planimetriya/prep/bloki';
import { sluchaynyySeed } from '@/lib/planimetriya/prep/generate';
import { sealMikro, type MikroRazbor, type MikroSealed } from '@/lib/planimetriya/prep/seal';
import { mikroItog, mikroZapisat, opornye1 } from '@/lib/planimetriya/progress';
import { openText } from '@/lib/planimetriya/secret';
import { readSealed1 } from '@/lib/planimetriya/trening/otvet1';
import { scrollTabTo } from '@/lib/tabScroll';
import { estPi } from '@/lib/zadanie7/otvet';

/** Список опорных задач №1 на общих карточках (components/tasks/opornye). */
export function Opornye1Spisok({ navyki }: { navyki: NavykKartochki[] }) {
  return <OpornyeSpisokBanka navyki={navyki} store={opornye1} labels={OPORNYE1.spisok} />;
}

function Chertezh({ svg, label }: { svg: string; label: string }) {
  return (
    <FigureZoom className="z1-op__chertezh" label={label}>
      <span className="pl-wrap" dangerouslySetInnerHTML={{ __html: svg }} />
    </FigureZoom>
  );
}

function razborIz(z: MikroSealed): MikroRazbor | null {
  try {
    const value: unknown = JSON.parse(openText(z.razbor, z.seal));
    return typeof value === 'object' && value !== null && 'stroki' in value
      ? (value as MikroRazbor)
      : null;
  } catch {
    return null;
  }
}

/** Разбор задачи → шаги сцены; чертёж с построениями — у последнего шага. */
function shagiRazbora(z: MikroSealed): Shag[] {
  const r = razborIz(z);
  if (r === null) return [];
  return r.stroki.map((html, i) => ({
    chtoHtml: `<p>${html}</p>`,
    formulaHtml: '',
    ...(i === r.stroki.length - 1 && r.risunokSvg !== null
      ? { risunok: <Chertezh svg={r.risunokSvg} label={OPORNYE1.risunokRazbora} /> }
      : {}),
  }));
}

/**
 * Экран блока опорных задач №1 на общем экране задачи блока
 * (components/tasks/opornye): «Запомни» с формулами блока, условие с
 * чертежом (без построений), ответ по правилам бланка, подсказка —
 * формула навыка, решение по шагам с чертежом всех построений после
 * ответа, «Ещё вариант» — та же задача с новыми числами. Исходы пишутся
 * в прежнее хранилище опорных задач №1 (lib/planimetriya/progress.ts).
 */
export function Opornye1({
  blok,
  zapomni,
  zadachi,
}: {
  blok: string;
  zapomni: ReactNode;
  zadachi: (MikroSealed & { no: number })[];
}) {
  const progress = opornye1.useProgress();
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [format, setFormat] = useState<string | null>(null);
  /* Свежие варианты по номеру задачи: пока не просили — зафиксированный. */
  const [fresh, setFresh] = useState<Record<number, MikroSealed>>({});

  const base = zadachi[index];
  const z: MikroSealed | undefined = base === undefined ? undefined : (fresh[base.no] ?? base);
  const shagi = useMemo(() => (z === undefined ? [] : shagiRazbora(z)), [z]);
  if (base === undefined || z === undefined) {
    return null;
  }
  const zadacha: MikroSealed = z;
  const no = base.no;

  const ishody: OpornyyIshod[] = zadachi.map((x) => {
    const itog = mikroItog(progress, blok, x.no);
    return itog === 'right' ? 'right' : itog === null ? null : 'wrong';
  });

  function reset() {
    setValue('');
    setChecked(null);
    setHintOpen(false);
    setSolutionOpen(false);
    setFormat(null);
  }

  function open(next: number) {
    if (next < 0 || next >= zadachi.length) return;
    setIndex(next);
    reset();
    scrollTabTo('.op-zad');
  }

  function check() {
    if (value.trim() === '') return;
    if (estPi(value)) {
      setFormat(TRENAZHER1.ekran.piPodskazka);
      return;
    }
    const reading = readSealed1(value, zadacha.seal);
    if (reading.kind === 'format') {
      setFormat(formatHint(reading.problem, reading.meant));
      return;
    }
    if (reading.kind === 'fractionRight') {
      setFormat(fractionRightHint(reading.decimal));
      return;
    }
    setFormat(null);
    setChecked(reading.right ? 'right' : 'wrong');
    mikroZapisat(blok, no, reading.right ? 'right' : 'wrong');
  }

  function another() {
    const micro = mikroById(base?.id ?? '');
    if (micro === undefined) return;
    setFresh({ ...fresh, [no]: sealMikro(micro, sluchaynyySeed()) });
    reset();
  }

  return (
    <OpornayaZadacha
      index={index}
      ishody={ishody}
      onOpen={open}
      uslovieHtml={zadacha.uslovieHtml}
      {...(zadacha.risunokSvg === null
        ? {}
        : { risunok: <Chertezh svg={zadacha.risunokSvg} label={OPORNYE1.risunok} /> })}
      value={value}
      onValue={(next) => {
        setValue(next);
        setFormat(null);
        if (checked === 'wrong') setChecked(null);
      }}
      checked={checked}
      onCheck={check}
      formatHint={format}
      /* Подсказка — формула навыка: ответа в ней нет. */
      podskazka={{ html: zadacha.formulaHtml, open: hintOpen, onOpen: () => setHintOpen(true) }}
      /* Решение — после ответа; открытое до верного ответа — «с разбором». */
      reshenie={
        checked === null
          ? null
          : {
              shagi,
              open: solutionOpen,
              onToggle: () => {
                if (!solutionOpen && checked !== 'right') {
                  mikroZapisat(blok, no, 'revealed');
                }
                setSolutionOpen(!solutionOpen);
              },
            }
      }
      zapomni={zapomni}
      dop={
        <button type="button" className="stk-btn stk-btn--tihaya" onClick={another}>
          {OPORNYE1.eshchyoVariant}
        </button>
      }
      labels={OPORNYE1.zadacha}
    />
  );
}
