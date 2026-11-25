'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { FigureZoom } from '@/components/ui';
import { OpornyeSpisokBanka, type NavykKartochki } from '../opornye/OpornyeBanka';
import { OpornayaZadacha, type OpornyyIshod } from '../opornye';
import { Ikonka, type Shag } from '../steklo';
import { FaktKnopka1 } from './fakt/FaktKnopka1';
import { Scenariy1 } from './Scenariy1';
import type { ScenariyHtml } from '@/lib/planimetriya/scenariy';
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
import { zhurnalOpornoy } from '@/lib/zhurnal/opornye';
import { useZapisZadachi } from '@/lib/zhurnal/zapis';
import { VDomashkuOpornyeGen } from '@/components/dz2/knopki';

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

/** Подсказка-сценарий задачи: закрыта отпечатком, как разбор. */
function scenariyIz(z: MikroSealed): ScenariyHtml | null {
  if (z.scenariy === null) return null;
  try {
    const value: unknown = JSON.parse(openText(z.scenariy, z.seal));
    return typeof value === 'object' && value !== null && 'sposoby' in value
      ? (value as ScenariyHtml)
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
    /* Факт навыка — под первой строкой разбора: там он и назван. */
    ...(i === 0 && z.fakt !== null ? { posle: <FaktKnopka1 fakt={z.fakt} /> } : {}),
  }));
}

/**
 * Экран блока опорных задач №1 на общем экране задачи блока
 * (components/tasks/opornye): «Запомни» с формулами блока, условие с
 * чертежом (без построений), ответ по правилам бланка, подсказка —
 * формула навыка, решение по шагам с чертежом всех построений после
 * ответа, «Ещё вариант» — та же задача с новыми числами. Исходы пишутся
 * в прежнее хранилище опорных задач №1 (lib/planimetriya/progress.ts),
 * в журнал решения задач (этап 4г) и — учителю — «В домашку».
 */
export function Opornye1({
  blok,
  nazvanie,
  zapomni,
  zadachi,
}: {
  blok: string;
  /** Название блока — для «В домашку» учителя. */
  nazvanie: string;
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
  /* Журнал решения задач (lib/zhurnal, этап 4г): задача — «микрозадача@seed». */
  const zapis = useZapisZadachi(
    base === undefined || z === undefined ? null : zhurnalOpornoy(1, blok, base.no, z),
  );
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
    if (checked === 'wrong') zapis?.zakryt(false);
    setIndex(next);
    reset();
    scrollTabTo('.op-zad');
  }

  function check() {
    if (value.trim() === '') return;
    if (estPi(value)) {
      zapis?.popytka(value, false, 'format');
      setFormat(TRENAZHER1.ekran.piPodskazka);
      return;
    }
    const reading = readSealed1(value, zadacha.seal);
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
    setChecked(reading.right ? 'right' : 'wrong');
    zapis?.popytka(value, reading.right);
    if (reading.right) zapis?.zakryt(true);
    mikroZapisat(blok, no, reading.right ? 'right' : 'wrong');
  }

  function another() {
    const micro = mikroById(base?.id ?? '');
    if (micro === undefined) return;
    if (checked === 'wrong') zapis?.zakryt(false);
    setFresh({ ...fresh, [no]: sealMikro(micro, sluchaynyySeed()) });
    reset();
  }

  return (
    <>
      {/* Учителю: блок целиком — в корзину новой выдачи ДЗ (docs/kabinet-dz2.md). */}
      <div className="dz2-ryad">
        <VDomashkuOpornyeGen
          taskNo={1}
          blok={blok}
          nazvanie={nazvanie}
          sobrat={async () => {
            const { generateMikro } = await import('@/lib/planimetriya/prep/generate');
            /* Чертёж — ученика (без ответа); рисунок разбора с ответом в ДЗ не идёт. */
            return zadachi.map((x) => ({
              id: x.id,
              seed: x.seed,
              uslovieHtml: x.uslovieHtml,
              risunokSvg: x.risunokSvg,
              otvet: generateMikro(x.id, x.seed).otvet,
              shagi: (razborIz(x)?.stroki ?? []).map((chto) => ({ chto })),
            }));
          }}
        />
      </div>
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
        /* Подсказка — формула навыка (ответа в ней нет) рядом с чертежом
           задачи и кнопка «Показать свойство» с фактом навыка. */
        podskazka={{
          html: zadacha.formulaHtml,
          open: hintOpen,
          onOpen: () => {
            setHintOpen(true);
            zapis?.shagPodskazki(1);
          },
          telo: (() => {
            const sc = scenariyIz(zadacha);
            if (sc !== null) return <Scenariy1 sc={sc} key={`${no}-${zadacha.seed}`} />;
            return (
              <div className="z1-op__podskazka">
                {zadacha.risunokSvg === null ? null : (
                  <div className="trn-vopros__risunok">
                    <Chertezh svg={zadacha.risunokSvg} label={OPORNYE1.risunok} />
                  </div>
                )}
                <p className="z1-op__podskazka-tekst">
                  <Ikonka name="lampa" />
                  <span dangerouslySetInnerHTML={{ __html: zadacha.formulaHtml }} />
                </p>
                {zadacha.fakt === null ? null : (
                  <FaktKnopka1 fakt={zadacha.fakt} podsvetit={checked === 'wrong'} />
                )}
              </div>
            );
          })(),
        }}
        /* Решение — после ответа; открытое до верного ответа — «с разбором». */
        reshenie={
          checked === null
            ? null
            : {
                shagi,
                open: solutionOpen,
                onToggle: () => {
                  if (!solutionOpen) zapis?.reshenie();
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
    </>
  );
}
