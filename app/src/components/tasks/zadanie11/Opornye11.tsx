'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { OpornayaZadacha, OpornyeSpisok, type OpornyyIshod } from '../opornye';
import type { NavykKartochki } from '../opornye/OpornyeBanka';
import type { Shag } from '../steklo';
import { PodskazkaVoprosy, type VoprosPodskazki } from '../trening/PodskazkaVoprosy';
import { OPORNYE11, TRENAZHER11 } from '@/content/tekstovye11';
import { formatHint, fractionRightHint } from '@/lib/otvet';
import { scrollTabTo } from '@/lib/tabScroll';
import { mikroById } from '@/lib/zadanie11/prep/bloki';
import { sluchaynyySeed } from '@/lib/zadanie11/prep/generate';
import {
  sealMikro11,
  type MikroRazbor11,
  type MikroSealed11,
  type ShagHtml,
} from '@/lib/zadanie11/prep/seal';
import { mikroItog11, mikroZapisat11, opornye11 } from '@/lib/zadanie11/progress';
import { choiceMatches, openText } from '@/lib/zadanie11/secret';
import { readSealed11 } from '@/lib/zadanie11/trening/otvet11';
import { Tablitsa11 } from './Tablitsa11';
import { zhurnalOpornoy } from '@/lib/zhurnal/opornye';
import { useZapisZadachi } from '@/lib/zhurnal/zapis';
import { VDomashkuOpornyeGen } from '@/components/dz2/knopki';
/* Подсказка-вопросы — общий компонент тренажёра, его стили лежат при общем входе. */
import '../trening/trening.css';

const T = OPORNYE11;

/** Список блоков №11 на общих карточках: прогресс — исходы микрозадач («P11-03:7»). */
export function Opornye11Spisok({ navyki }: { navyki: NavykKartochki[] }) {
  const progress = opornye11.useProgress();
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

function izJson<V>(json: string): V | null {
  try {
    return JSON.parse(json) as V;
  } catch {
    return null;
  }
}

/** Разбор микрозадачи → шаги сцены: строки дословно, заполненная таблица — в первом шаге. */
function shagiRazbora(task: MikroSealed11): Shag[] {
  const r = izJson<MikroRazbor11>(openText(task.razbor, task.seal));
  if (r === null) {
    return [];
  }
  return r.stroki.map((html, i) => ({
    chtoHtml: `<div class="z11-stroka">${html}</div>`,
    formulaHtml: '',
    ...(i === 0 && r.tablitsa !== null ? { risunok: <Tablitsa11 table={r.tablitsa} /> } : {}),
  }));
}

/** Пошаговые вопросы подсказки → общий вид подсказки-вопросов. */
function voprosyPodskazki(task: MikroSealed11): VoprosPodskazki[] {
  const shagi = izJson<ShagHtml[]>(openText(task.podskazki, task.seal)) ?? [];
  return shagi.map((h) => ({
    voprosHtml: h.question,
    variantyHtml: h.options,
    verno: h.correct,
    ...(h.comment === null ? {} : { kommentariyHtml: h.comment }),
  }));
}

/**
 * Экран блока опорных задач №11 на общем экране (components/tasks/opornye,
 * образец — №3, №7, №6): плашка «Запомни», условие с таблицей (клетка
 * «?» — то, что ищут), ответ числом (по правилам бланка) или выбором,
 * подсказка — пошаговые вопросы с кнопками, решение по шагам с
 * заполненной таблицей, «Ещё вариант» — та же задача на новых числах.
 * Исходы — в прежнем хранилище (budetege:zadanie-11:opornye:v1), ключи
 * задач те же.
 */
export function Opornye11({
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
  zadachi: (MikroSealed11 & { no: number })[];
}) {
  const progress = opornye11.useProgress();
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [shag, setShag] = useState(1);
  const [mimo, setMimo] = useState<number[]>([]);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [format, setFormat] = useState<string | null>(null);
  /* Свежие варианты по номеру задачи: пока не просили — зафиксированный. */
  const [fresh, setFresh] = useState<Record<number, MikroSealed11>>({});

  const base = zadachi[index];
  const task: MikroSealed11 | undefined = base === undefined ? undefined : (fresh[base.no] ?? base);
  const shagi = useMemo(
    () => (task === undefined || !solutionOpen ? [] : shagiRazbora(task)),
    [task, solutionOpen],
  );
  const voprosy = useMemo(
    () => (task === undefined || !hintOpen ? [] : voprosyPodskazki(task)),
    [task, hintOpen],
  );
  /* Журнал решения задач (lib/zhurnal, этап 4г): задача — «микрозадача@seed». */
  const zapis = useZapisZadachi(
    base === undefined || task === undefined ? null : zhurnalOpornoy(11, blokId, base.no, task),
  );
  if (base === undefined || task === undefined) {
    return null;
  }
  const no = base.no;
  const zadacha: MikroSealed11 = task;

  const ishody: OpornyyIshod[] = zadachi.map((x) => {
    const it = mikroItog11(progress, blokId, x.no);
    return it === 'right' ? 'right' : it === null ? null : 'wrong';
  });

  function sbros() {
    setValue('');
    setChecked(null);
    setHintOpen(false);
    setShag(1);
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
      ok = choiceMatches(value, zadacha.seal);
    } else {
      const reading = readSealed11(value, zadacha.seal);
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
    mikroZapisat11(blokId, no, ok ? 'right' : 'wrong');
  }

  function pokazatReshenie() {
    if (!solutionOpen) zapis?.reshenie();
    if (!solutionOpen && ishody[index] !== 'right' && checked !== 'right') {
      /* Решение открыто, задача не решена: исход «открыл решение», как было. */
      mikroZapisat11(blokId, no, 'revealed');
    }
    setSolutionOpen(!solutionOpen);
  }

  function eshcheVariant() {
    const micro = mikroById(base?.id ?? '');
    if (micro === undefined) {
      return;
    }
    if (checked === 'wrong') zapis?.zakryt(false);
    setFresh((prev) => ({ ...prev, [no]: sealMikro11(micro, sluchaynyySeed()) }));
    sbros();
  }

  return (
    <>
      {/* Учителю: блок целиком — в корзину новой выдачи ДЗ (docs/kabinet-dz2.md). */}
      <div className="dz2-ryad">
        <VDomashkuOpornyeGen
          taskNo={11}
          blok={blokId}
          nazvanie={nazvanie}
          sobrat={async () => {
            const [{ generateMikro }, { tablitsaHtml }] = await Promise.all([
              import('@/lib/zadanie11/prep/generate'),
              import('@/lib/zadanie11/sheet11'),
            ]);
            /* Таблица условия — как на экране: «?» — то, что ищут. */
            return zadachi
              .filter((x) => x.answerType === 'number')
              .map((x) => ({
                id: x.id,
                seed: x.seed,
                uslovieHtml: x.uslovieHtml,
                tablitsaHtml: x.tablitsa === null ? null : tablitsaHtml(x.tablitsa),
                otvet: generateMikro(x.id, x.seed).otvet,
                shagi: (izJson<MikroRazbor11>(openText(x.razbor, x.seal))?.stroki ?? []).map(
                  (chto) => ({ chto }),
                ),
              }));
          }}
        />
      </div>
      <OpornayaZadacha
        index={index}
        ishody={ishody}
        onOpen={open}
        uslovieHtml={zadacha.uslovieHtml}
        {...(zadacha.tablitsa === null
          ? {}
          : { risunok: <Tablitsa11 table={zadacha.tablitsa} className="z11-op__tab" /> })}
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
        /* Подсказка — пошаговые вопросы с кнопками (как было), в общем виде. */
        podskazka={{
          html: '',
          open: hintOpen,
          onOpen: () => {
            setHintOpen(true);
            zapis?.shagPodskazki(1);
          },
          telo: (
            <PodskazkaVoprosy
              voprosy={voprosy}
              otkryto={shag}
              mimo={mimo}
              onVerno={() => {
                setShag(shag + 1);
                setMimo([]);
                zapis?.shagPodskazki(shag + 1);
              }}
              onMimo={(j) => {
                setMimo([...mimo, j]);
                zapis?.oshibkaPodskazki(shag);
              }}
              labels={TRENAZHER11.ekran.voprosy}
            />
          ),
        }}
        /* Решение — после ответа: до проверки доступна только подсказка. */
        reshenie={
          checked === null ? null : { shagi, open: solutionOpen, onToggle: pokazatReshenie }
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
