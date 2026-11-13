'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { OpornayaZadacha, OpornyeSpisok, type OpornyyIshod } from '../opornye';
import type { NavykKartochki } from '../opornye/OpornyeBanka';
import type { Shag } from '../steklo';
import { OPORNYE2 } from '@/content/vektory2';
import { formatHint, fractionRightHint } from '@/lib/otvet';
import { scrollTabTo } from '@/lib/tabScroll';
import { mikroById } from '@/lib/vektory/prep/bloki';
import { sluchaynyySeed } from '@/lib/vektory/prep/generate';
import { sealMikro, type MikroRazbor, type MikroSealed } from '@/lib/vektory/prep/seal';
import { mikroId, mikroItog, mikroZapisat, opornye2 } from '@/lib/vektory/progress';
import { choiceMatches, openText } from '@/lib/vektory/secret';
import { tipHref2 } from '@/lib/vektory/links';
import { readSealed2 } from '@/lib/vektory/trening/otvet2';
import { RisunokSvg } from './shagi2';

const T = OPORNYE2;

/** Список блоков №2 на общих карточках: прогресс — исходы микрозадач («P2-1:3»). */
export function Opornye2Spisok({ navyki }: { navyki: NavykKartochki[] }) {
  const progress = opornye2.useProgress();
  /* Разобранные задачи по типам переехали в «О задании»: прежний якорь
     «#op-A6-1» ведёт на карточку типа (якорь в адресе сервер не видит,
     поэтому переход — здесь). */
  useEffect(() => {
    const m = /^#op-([ABC]\d)-\d+$/.exec(window.location.hash);
    if (m?.[1] !== undefined) {
      window.location.replace(tipHref2(m[1]));
    }
  }, []);
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
      labels={T.spisok}
    />
  );
}

function razborIz(json: string): MikroRazbor | null {
  try {
    const value: unknown = JSON.parse(json);
    return typeof value === 'object' && value !== null && 'stroki' in value
      ? (value as MikroRazbor)
      : null;
  } catch {
    return null;
  }
}

/** Разбор микрозадачи → шаги сцены: строки дословно, рисунок с катетами — в первом шаге. */
function shagiRazbora(task: MikroSealed): Shag[] {
  const r = razborIz(openText(task.razbor, task.seal));
  if (r === null) {
    return [];
  }
  return r.stroki.map((html, i) => ({
    chtoHtml: `<p>${html}</p>`,
    formulaHtml: '',
    ...(i === 0 && r.risunokSvg !== null ? { risunok: <RisunokSvg svg={r.risunokSvg} /> } : {}),
  }));
}

/**
 * Экран блока опорных задач №2 на общем экране (components/tasks/opornye,
 * образец — №3): плашка «Запомни», задача с рисунком без катетов, ответ
 * числом (по правилам бланка) или выбором из четырёх вариантов,
 * подсказка — формула навыка, решение по шагам с рисунком с катетами,
 * «Ещё вариант» — та же задача на новых числах. Исходы — в прежнем
 * хранилище (budetege:vektory-2:opornye:v1), ключи задач те же.
 */
export function Opornye2({
  blokId,
  zapomni,
  zadachi,
}: {
  blokId: string;
  zapomni: ReactNode;
  /** Десять задач блока в закрытом виде, собраны на сборке. */
  zadachi: (MikroSealed & { no: number })[];
}) {
  const progress = opornye2.useProgress();
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [format, setFormat] = useState<string | null>(null);
  /* Свежие варианты по номеру задачи: пока не просили — зафиксированный. */
  const [fresh, setFresh] = useState<Record<number, MikroSealed>>({});

  const base = zadachi[index];
  const task: MikroSealed | undefined = base === undefined ? undefined : (fresh[base.no] ?? base);
  const shagi = useMemo(
    () => (task === undefined || !solutionOpen ? [] : shagiRazbora(task)),
    [task, solutionOpen],
  );
  if (base === undefined || task === undefined) {
    return null;
  }
  const no = base.no;
  const zadacha: MikroSealed = task;

  const ishody: OpornyyIshod[] = zadachi.map((x) => {
    const it = mikroItog(progress, blokId, x.no);
    return it === 'right' ? 'right' : it === null ? null : 'wrong';
  });

  function sbros() {
    setValue('');
    setChecked(null);
    setHintOpen(false);
    setSolutionOpen(false);
    setFormat(null);
  }

  function open(next: number) {
    if (next < 0 || next >= zadachi.length) {
      return;
    }
    setIndex(next);
    sbros();
    scrollTabTo('.op-zad');
  }

  function check() {
    if (value.trim() === '') {
      return;
    }
    let ok: boolean;
    if (zadacha.answerType === 'choice') {
      ok = choiceMatches(value, zadacha.seal);
    } else {
      const reading = readSealed2(value, zadacha.seal);
      if (reading.kind === 'format') {
        setFormat(formatHint(reading.problem, reading.meant));
        return;
      }
      if (reading.kind === 'fractionRight') {
        setFormat(fractionRightHint(reading.decimal));
        return;
      }
      ok = reading.right;
    }
    setFormat(null);
    setChecked(ok ? 'right' : 'wrong');
    mikroZapisat(blokId, no, ok ? 'right' : 'wrong');
  }

  function pokazatReshenie() {
    if (!solutionOpen && ishody[index] !== 'right' && checked !== 'right') {
      /* Решение открыто, задача не решена: исход «открыл решение», как было. */
      mikroZapisat(blokId, no, 'revealed');
    }
    setSolutionOpen(!solutionOpen);
  }

  function eshcheVariant() {
    const micro = mikroById(base?.id ?? '');
    if (micro === undefined) {
      return;
    }
    setFresh((prev) => ({ ...prev, [no]: sealMikro(micro, sluchaynyySeed()) }));
    sbros();
  }

  return (
    <OpornayaZadacha
      index={index}
      ishody={ishody}
      onOpen={open}
      uslovieHtml={zadacha.uslovieHtml}
      {...(zadacha.risunokSvg === null ? {} : { risunok: <RisunokSvg svg={zadacha.risunokSvg} /> })}
      {...(zadacha.answerType === 'choice' && zadacha.vybory !== null
        ? { vybory: zadacha.vybory.map((v) => ({ number: v.number, labelHtml: v.label })) }
        : {})}
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
      /* Подсказка — формула навыка, без ответа (как было). */
      podskazka={{ html: zadacha.formulaHtml, open: hintOpen, onOpen: () => setHintOpen(true) }}
      /* Решение — после ответа: до проверки доступна только подсказка. */
      reshenie={checked === null ? null : { shagi, open: solutionOpen, onToggle: pokazatReshenie }}
      zapomni={zapomni}
      dop={
        <button type="button" className="stk-btn stk-btn--tihaya" onClick={eshcheVariant}>
          {T.zadacha.eshcheVariant}
        </button>
      }
      labels={T.zadacha}
    />
  );
}

export { mikroId };
