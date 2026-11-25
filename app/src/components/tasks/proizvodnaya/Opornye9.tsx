'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { OpornayaZadacha, OpornyeSpisok, type OpornyyIshod } from '../opornye';
import type { NavykKartochki } from '../opornye/OpornyeBanka';
import type { Shag } from '../steklo';
import { PodskazkaVoprosy } from '../trening/PodskazkaVoprosy';
import { OPORNYE9, TRENAZHER9 } from '@/content/proizvodnaya9';
import { formatHint, fractionRightHint } from '@/lib/otvet';
import { prepMicroById } from '@/lib/proizvodnaya/prep/blocks';
import { sealPrep, type PrepSealed, type PrepZakryto } from '@/lib/proizvodnaya/prep/seal';
import { prep9IsSolved, prep9MarkSolved, usePrep9Progress } from '@/lib/proizvodnaya/prepProgress';
import { choiceMatches, openText } from '@/lib/proizvodnaya/secret';
import { readSealed9 } from '@/lib/proizvodnaya/trening/otvet9';
import { randomSeed } from '@/lib/vychisleniya/session';
import { scrollTabTo } from '@/lib/tabScroll';
import { FiguraSvg9 } from './FiguraSvg9';
import { zhurnalOpornoy } from '@/lib/zhurnal/opornye';
import { useZapisZadachi } from '@/lib/zhurnal/zapis';
import { VDomashkuOpornyeGen } from '@/components/dz2/knopki';

const T = OPORNYE9;

/**
 * Список блоков №9 на общих карточках: «решено» — из прежнего хранилища
 * опорных задач (budetege:proizvodnaya-9:prep:v1, блок → номера решённых).
 * Ключ задачи в карточке — «блок:номер».
 */
export function Opornye9Spisok({ navyki }: { navyki: NavykKartochki[] }) {
  const progress = usePrep9Progress();
  return (
    <OpornyeSpisok
      navyki={navyki.map((navyk) => ({
        ...navyk,
        bloki: navyk.bloki.map(({ zadachi, ...blok }) => ({
          ...blok,
          vsego: zadachi.length,
          resheno: zadachi.filter((id) => {
            const [b, no] = id.split(':');
            return prep9IsSolved(progress, b ?? '', Number(no));
          }).length,
        })),
      }))}
      labels={T.spisok}
    />
  );
}

function zakrytoIz(task: PrepSealed): PrepZakryto | null {
  try {
    return JSON.parse(openText(task.zakryto, task.seal)) as PrepZakryto;
  } catch {
    return null;
  }
}

/** Разбор → шаги сцены: строки дословно, чертёж с построениями — в первом шаге. */
function shagiRazbora(z: PrepZakryto): Shag[] {
  return z.razborHtml.map((html, i) => ({
    chtoHtml: `<p>${html}</p>`,
    formulaHtml: '',
    ...(i === 0 && z.risunokRazbora !== null
      ? { risunok: <FiguraSvg9 svg={z.risunokRazbora} label={T.risunokRazbora} /> }
      : {}),
  }));
}

/**
 * Подсказка №9 — как была: вопросы с кнопками, у неверной кнопки —
 * пояснение, чертёж достраивается по мере верных ответов.
 */
function Podskazka9({
  z,
  otkryto,
  mimo,
  onVerno,
  onMimo,
}: {
  z: PrepZakryto;
  otkryto: number;
  mimo: number[];
  onVerno: () => void;
  onMimo: (j: number) => void;
}): ReactNode {
  const voprosy = z.podskazka.map((q) => ({
    voprosHtml: q.voprosHtml,
    variantyHtml: q.knopki.map((k) => k.html),
    verno: Math.max(
      0,
      q.knopki.findIndex((k) => k.verno),
    ),
    ...(q.itogHtml === '' ? {} : { kommentariyHtml: q.itogHtml }),
    pochemuHtml: q.knopki.map((k) => k.pochemuHtml),
  }));
  const tekushchiy = z.podskazka[Math.min(otkryto, z.podskazka.length) - 1];
  const svg = z.risunkiPodskazki[String(tekushchiy?.shag ?? 0)];
  return (
    <>
      <PodskazkaVoprosy
        voprosy={voprosy}
        otkryto={otkryto}
        mimo={mimo}
        onVerno={onVerno}
        onMimo={onMimo}
        labels={TRENAZHER9.ekran.voprosy}
      />
      {svg === undefined ? null : (
        <div className="z9-op__ris">
          <FiguraSvg9 svg={svg} label={T.risunok} />
        </div>
      )}
    </>
  );
}

/**
 * Экран блока опорных задач №9 на общем экране (components/tasks/opornye,
 * образец — №3): плашка «Запомни», задача с чертежом без построений,
 * ответ числом (по правилам бланка) или выбором, подсказка вопросами с
 * чертежом, решение по шагам с чертежом построений, «Ещё вариант» — та
 * же задача на новых числах. Решённые задачи — в прежнем хранилище.
 */
export function Opornye9({
  blokId,
  nazvanie,
  zapomni,
  zadachi,
}: {
  blokId: string;
  /** Название блока — для «В домашку» учителя. */
  nazvanie: string;
  zapomni: ReactNode;
  /** Десять задач блока в закрытом виде, собраны на сборке. */
  zadachi: (PrepSealed & { no: number })[];
}) {
  const progress = usePrep9Progress();
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [otkryto, setOtkryto] = useState(1);
  const [mimo, setMimo] = useState<number[]>([]);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [format, setFormat] = useState<string | null>(null);
  /* Неверные ответы за визит: прежнее хранилище помнит только решённые. */
  const [oshibki, setOshibki] = useState<Record<number, true>>({});
  /* Свежие варианты по номеру задачи: пока не просили — зафиксированный. */
  const [fresh, setFresh] = useState<Record<number, PrepSealed>>({});

  const base = zadachi[index];
  const task: PrepSealed | undefined = base === undefined ? undefined : (fresh[base.no] ?? base);
  const nuzhno = hintOpen || solutionOpen;
  const zakryto = useMemo(
    () => (task === undefined || !nuzhno ? null : zakrytoIz(task)),
    [task, nuzhno],
  );
  /* Журнал решения задач (lib/zhurnal, этап 4г): задача — «микрозадача@seed». */
  const zapis = useZapisZadachi(
    base === undefined || task === undefined ? null : zhurnalOpornoy(9, blokId, base.no, task),
  );
  if (base === undefined || task === undefined) {
    return null;
  }
  const no = base.no;
  const zadacha: PrepSealed = task;

  const ishody: OpornyyIshod[] = zadachi.map((x) =>
    prep9IsSolved(progress, blokId, x.no) ? 'right' : oshibki[x.no] === true ? 'wrong' : null,
  );

  function sbros() {
    setValue('');
    setChecked(null);
    setHintOpen(false);
    setOtkryto(1);
    setMimo([]);
    setSolutionOpen(false);
    setFormat(null);
  }

  function open(next: number) {
    if (next < 0 || next >= zadachi.length) {
      return;
    }
    if (checked === 'wrong') zapis?.zakryt(false);
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
      /* На экране варианты с единицы, в отпечатке — номер с нуля. */
      ok = choiceMatches(String(Number(value) - 1), zadacha.seal);
    } else {
      const reading = readSealed9(value, zadacha.seal);
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
      ok = reading.right;
    }
    setFormat(null);
    setChecked(ok ? 'right' : 'wrong');
    zapis?.popytka(value, ok);
    if (ok) zapis?.zakryt(true);
    if (ok) {
      prep9MarkSolved(blokId, no);
    } else {
      setOshibki((prev) => ({ ...prev, [no]: true }));
    }
  }

  function eshcheVariant() {
    const micro = prepMicroById(base?.id ?? '');
    if (micro === undefined) {
      return;
    }
    if (checked === 'wrong') zapis?.zakryt(false);
    try {
      /* Сломанный seed не должен ронять экран. */
      setFresh((prev) => ({ ...prev, [no]: sealPrep(micro, randomSeed()) }));
    } catch {
      /* Остаёмся на прежнем варианте. */
    }
    sbros();
  }

  return (
    <>
      {/* Учителю: блок целиком — в корзину новой выдачи ДЗ (docs/kabinet-dz2.md). */}
      <div className="dz2-ryad">
        <VDomashkuOpornyeGen
          taskNo={9}
          blok={blokId}
          nazvanie={nazvanie}
          sobrat={async () => {
            const { generatePrepById } = await import('@/lib/proizvodnaya/prep/generate');
            /* Чертёж — ученика; рисунок разбора с построениями в ДЗ не идёт. */
            return zadachi
              .filter((x) => x.answerType === 'number')
              .map((x) => ({
                id: x.id,
                seed: x.seed,
                uslovieHtml: x.uslovieHtml,
                risunokSvg: x.risunokSvg,
                otvet: generatePrepById(x.id, x.seed).otvet,
                shagi: (zakrytoIz(x)?.razborHtml ?? []).map((chto) => ({ chto })),
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
          : { risunok: <FiguraSvg9 svg={zadacha.risunokSvg} label={T.risunok} /> })}
        {...(zadacha.answerType === 'choice' && zadacha.knopki !== null
          ? {
              vybory: zadacha.knopki.map((labelHtml, i) => ({
                number: String(i + 1),
                labelHtml,
              })),
            }
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
        podskazka={{
          html: '',
          open: hintOpen,
          onOpen: () => {
            setHintOpen(true);
            zapis?.shagPodskazki(1);
          },
          ...(zakryto === null
            ? {}
            : {
                telo: (
                  <Podskazka9
                    z={zakryto}
                    otkryto={otkryto}
                    mimo={mimo}
                    onVerno={() => {
                      setOtkryto(otkryto + 1);
                      setMimo([]);
                      zapis?.shagPodskazki(otkryto + 1);
                    }}
                    onMimo={(j) => {
                      setMimo([...mimo, j]);
                      zapis?.oshibkaPodskazki(otkryto);
                    }}
                  />
                ),
              }),
        }}
        /* Решение — после ответа: до проверки доступна только подсказка. */
        reshenie={
          checked === null
            ? null
            : {
                shagi: zakryto === null ? [] : shagiRazbora(zakryto),
                open: solutionOpen,
                onToggle: () => {
                  if (!solutionOpen) zapis?.reshenie();
                  setSolutionOpen(!solutionOpen);
                },
              }
        }
        zapomni={zapomni}
        dop={
          <button type="button" className="stk-btn stk-btn--tihaya" onClick={eshcheVariant}>
            {T.zadacha.eshcheVariant}
          </button>
        }
        labels={T.zadacha}
      />
    </>
  );
}
