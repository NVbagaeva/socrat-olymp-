'use client';

import { ishodOf, type LogOutcome } from '@/lib/progressLog';
import { clsx } from 'clsx';
import { useState } from 'react';
import { TrainerSessionHost, useSessionReport } from '@/components/tasks/session';
import { Tex } from '@/components/ui/Tex';
import { typeset } from '@/lib/tex';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import type { TaskMark } from '@/lib/trainerSession/types';
import { zadachaPoId14 } from '@/lib/zadanie14/dannye';
import { trenazher14 } from '@/lib/zadanie14/progress';
import { proverit14, verno14, type Itog14 } from '@/lib/zadanie14/proverkaZadachi';
import { uslovieA } from '@/lib/zadanie14/tekst';
import type { Metod14, Zadacha14 } from '@/lib/zadanie14/tipy';
import {
  kandidaty14,
  METODY_14,
  planTrenirovki14,
  type Istochnik14,
  type Nastroyki14,
} from '@/lib/zadanie14/trenazher';
import { Otvet14 } from './Otvet14';
import { Podskazki14 } from './Podskazki14';
import { Reshenie14 } from './Reshenie14';
import {
  isTrenazher14Payload,
  readTrenazher14Ui,
  type Trenazher14Payload,
  type Trenazher14Ui,
} from './trenazher14Sessiya';
import { Uslovie14 } from './Uslovie14';

const SKOLKO = [5, 10, 15];

function nazvanieMetoda(id: Metod14): string {
  return METODY_14.find((m) => m.id === id)?.title ?? id;
}

/** Выбор тренировки: методы (фильтр), откуда задачи, сколько. */
function Vybor14({ onStart }: { onStart: (n: Nastroyki14) => void }) {
  const [n, setN] = useState<Nastroyki14>({ metody: [], istochnik: 'bank', skolko: 10 });
  const dostupno = kandidaty14(n).length;
  const pereklyuchit = (m: Metod14) =>
    setN({
      ...n,
      metody: n.metody.includes(m) ? n.metody.filter((x) => x !== m) : [...n.metody, m],
    });
  return (
    <section className="z14-tr-vybor flow">
      <p className="z14-tr-vybor__lead">
        Задачи в формате ЕГЭ: пункт а — серии корней, пункт б — корни на промежутке. Ответ
        проверяется сразу, после ответа — полное решение с окружностью.
      </p>
      <fieldset className="z14-tr-vybor__gruppa">
        <legend>Методы</legend>
        <div className="z14-tr-vybor__chipy">
          <button
            type="button"
            className="z14-chip"
            aria-pressed={n.metody.length === 0}
            onClick={() => setN({ ...n, metody: [] })}
          >
            Все методы
          </button>
          {METODY_14.map((m) => (
            <button
              key={m.id}
              type="button"
              className="z14-chip"
              aria-pressed={n.metody.includes(m.id)}
              onClick={() => pereklyuchit(m.id)}
            >
              <Tex text={m.title} />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="z14-tr-vybor__gruppa">
        <legend>Откуда задачи</legend>
        <div className="z14-tr-vybor__chipy">
          {(
            [
              ['bank', 'Задачи формата ЕГЭ'],
              ['vse', 'Вместе с опорными'],
            ] as [Istochnik14, string][]
          ).map(([id, t]) => (
            <button
              key={id}
              type="button"
              className="z14-chip"
              aria-pressed={n.istochnik === id}
              onClick={() => setN({ ...n, istochnik: id })}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="z14-tr-vybor__gruppa">
        <legend>Сколько задач</legend>
        <div className="z14-tr-vybor__chipy">
          {SKOLKO.map((k) => (
            <button
              key={k}
              type="button"
              className="z14-chip"
              aria-pressed={n.skolko === k}
              onClick={() => setN({ ...n, skolko: k })}
            >
              {k}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="z14-tr-vybor__schet">
        Подходящих задач: {dostupno}
        {dostupno > 0 && dostupno < n.skolko ? ` — в тренировке будет ${dostupno}` : ''}
      </p>
      <button
        type="button"
        className="btn btn--primary"
        disabled={dostupno === 0}
        onClick={() => onStart(n)}
      >
        Начать тренировку
      </button>
    </section>
  );
}

/** Экран тренировки: одна задача, ввод, подсказка, решение. */
function Ekran14({
  ids,
  restored,
  report,
  elapsed,
  onFinish,
}: {
  ids: string[];
  restored: Trenazher14Ui | null;
  report: (ui: Trenazher14Ui) => void;
  elapsed: () => number;
  onFinish: () => void;
}) {
  const [index, setIndex] = useState(restored?.index ?? 0);
  const [marks, setMarks] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});
  const [misses, setMisses] = useState(restored?.misses ?? 0);
  const [serii, setSerii] = useState<string[]>(restored?.serii ?? ['']);
  const [korni, setKorni] = useState(restored?.korni ?? '');
  const [chislo, setChislo] = useState(restored?.chislo ?? '');
  const [itog, setItog] = useState<Itog14 | null>(restored?.itog ?? null);
  const [oshibalsya, setOshibalsya] = useState(restored?.oshibalsya ?? false);
  const [otkryto, setOtkryto] = useState(restored?.otkryto ?? 0);
  const [mimo, setMimo] = useState<number[]>(restored?.mimo ?? []);
  const [reshenie, setReshenie] = useState(restored?.reshenie ?? false);
  const [nachalo, setNachalo] = useState(() => restored?.taskFrom ?? elapsed());

  useSessionReport<Trenazher14Ui>(report, {
    index,
    marks,
    tried,
    order: null,
    misses,
    serii,
    korni,
    chislo,
    itog,
    oshibalsya,
    otkryto,
    mimo,
    reshenie,
    taskFrom: nachalo,
  });

  const z = zadachaPoId14(ids[index] ?? '');
  if (z === undefined) return null;
  const last = index === ids.length - 1;
  const zakryta = marks[index] !== undefined;
  const reshena = itog !== null && verno14(itog);

  function zapisat(right: boolean, clean: boolean, zad: Zadacha14, ishod: LogOutcome) {
    trenazher14.recordAttempt({
      kind: zad.metody[0] ?? 'prosteyshie',
      taskId: zad.id,
      right,
      clean,
      seconds: (elapsed() - nachalo) / 1000,
      ishod,
    });
    if (right) setMarks((m) => ({ ...m, [index]: clean ? 'right' : 'hinted' }));
  }

  function proverit() {
    if (z === undefined || zakryta) return;
    const it = proverit14(z, { serii, korni, chislo });
    if (it.a === 'pusto' && (it.b === null || it.b === 'pusto')) return;
    setItog(it);
    if (verno14(it)) {
      zapisat(
        true,
        !oshibalsya && otkryto === 0 && !reshenie,
        z,
        ishodOf({
          solved: true,
          misses: oshibalsya ? 1 : 0,
          hint: otkryto > 0,
          revealed: reshenie,
        }),
      );
    } else if (it.a !== 'ne-razobrano' && it.b !== 'ne-razobrano') {
      setOshibalsya(true);
      setMisses((n) => n + 1);
      setTried((t) => ({ ...t, [index]: true }));
    }
  }

  function dalshe() {
    if (last) {
      onFinish();
      return;
    }
    setIndex(index + 1);
    setSerii(['']);
    setKorni('');
    setChislo('');
    setItog(null);
    setOshibalsya(false);
    setOtkryto(0);
    setMimo([]);
    setReshenie(false);
    setNachalo(elapsed());
    window.scrollTo({ top: 0 });
  }

  const pokazatReshenie = reshenie || itog !== null;
  return (
    <article className="z14-zadacha flow">
      <p className="z14-zadacha__metka">
        <Tex text={z.metody.map((m) => nazvanieMetoda(m)).join(' · ')} />
      </p>
      <Uslovie14 z={z} />
      <Otvet14
        z={z}
        vvod={{ serii, korni, chislo }}
        onVvod={(v) => {
          setSerii(v.serii);
          setKorni(v.korni);
          setChislo(v.chislo);
        }}
        itog={itog}
        onProverit={proverit}
        zakryto={zakryta}
      />
      {reshena ? (
        <p className="z14-tr__itog is-verno" role="status">
          {oshibalsya || otkryto > 0 || reshenie ? 'Верно — с подсказкой.' : 'Верно!'}
        </p>
      ) : null}
      <div className="z14-zadacha__dop">
        {otkryto === 0 && !zakryta ? (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              setOtkryto(1);
              setOshibalsya(true);
            }}
          >
            Подсказка
          </button>
        ) : null}
        {pokazatReshenie ? null : (
          <button type="button" className="btn btn--ghost" onClick={() => setReshenie(true)}>
            Показать решение
          </button>
        )}
        <button
          type="button"
          className={clsx('btn', reshena ? 'btn--primary' : 'btn--ghost')}
          onClick={dalshe}
        >
          {last ? 'Смотреть результат →' : 'Дальше →'}
        </button>
      </div>
      {otkryto > 0 ? (
        <Podskazki14
          shagi={z.podskazki}
          otkryto={otkryto}
          mimo={mimo}
          onVerno={() => {
            setOtkryto(otkryto + 1);
            setMimo([]);
          }}
          onMimo={(j) => {
            setMimo([...mimo, j]);
            setMisses((n) => n + 1);
          }}
        />
      ) : null}
      {pokazatReshenie ? (
        <section className="flow">
          <h4 className="z14-reshenie__title">Решение</h4>
          <Reshenie14 z={z} />
        </section>
      ) : null}
    </article>
  );
}

/**
 * Вкладка «Тренажёр» №14: выбор (фильтр по методам) → решение →
 * итоги. Сессию ведёт общая оболочка: тренировка сохраняется при
 * переходах между вкладками, есть «Пауза» и «Завершить тренировку».
 */
export function Trenazher14({ base }: { base: string }) {
  return (
    <TrainerSessionHost<Trenazher14Payload, Trenazher14Ui>
      scope={scopeOfPath(base) ?? '14'}
      what="тренажёр"
      backHref={base}
      isPayload={isTrenazher14Payload}
      count={(p) => p.ids.length}
      describe={(p, at) => {
        const z = zadachaPoId14(p.ids[at] ?? '');
        if (z === undefined) throw new Error('Нет задачи');
        return {
          kind: nazvanieMetoda(z.metody[0] ?? 'prosteyshie').replace(/\$/g, ''),
          html: typeset(uslovieA(z)),
          review: () => <Reshenie14 z={z} />,
        };
      }}
      subset={(p, idx) => ({ ids: idx.flatMap((i) => p.ids[i] ?? []) })}
      similar={(p, idx) => {
        const metody = [
          ...new Set(idx.flatMap((i) => zadachaPoId14(p.ids[i] ?? '')?.metody.slice(0, 1) ?? [])),
        ];
        const ids = planTrenirovki14(
          { metody, istochnik: 'vse', skolko: idx.length },
          Math.random,
          new Set(p.ids),
        );
        return ids.length === 0 ? null : { ids };
      }}
      summary={{ hintedLabel: 'Решено с подсказкой' }}
      configurator={(api) => (
        <Vybor14
          onStart={(n) => {
            const ids = planTrenirovki14(n);
            if (ids.length > 0) {
              api.start({ ids });
              window.scrollTo({ top: 0 });
            }
          }}
        />
      )}
      screen={({ payload, restored, report, elapsed, finish }) => (
        <Ekran14
          ids={payload.ids}
          restored={restored === null ? null : readTrenazher14Ui(restored)}
          report={report}
          elapsed={elapsed}
          onFinish={finish}
        />
      )}
    />
  );
}
