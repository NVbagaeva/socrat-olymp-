'use client';

import { clsx } from 'clsx';
import { useMemo, useState } from 'react';
import { useSessionReport } from '../../session/useSessionReport';
import { Ikonka, Metka } from '../../steklo';
import { assetUrl } from '@/lib/assetUrl';
import type { TaskMark } from '@/lib/trainerSession/types';
import { openText, sealMetod } from '@/lib/veroyatnost/secret';
import type { Zadanie45 } from '@/lib/veroyatnost/trening/links';
import { uznay45 } from '@/lib/veroyatnost/trening/progress';
import type { TekstyTrenazhera45 } from '@/content/veroyatnost45';
import { MetodKartinka } from '../MetodKartinka';
import { navykiZadaniya } from '../metody';
import type { SessiyaPayload } from '../sessiyaPayload';
import type { Ui45 } from './ui45';

export interface EkranUznay45Props {
  zadanie: Zadanie45;
  payload: SessiyaPayload;
  restored: Ui45 | null;
  report: (ui: Ui45) => void;
  elapsed: () => number;
  onFinish: () => void;
  T: TekstyTrenazhera45;
}

/**
 * «Узнай метод» — четвёртый режим тренажёра №4 и №5: только условие и
 * картинка к задаче, считать не нужно — назвать метод. Кнопки методов —
 * со своими объёмными иллюстрациями. Метода в разметке нет: нажатая
 * кнопка сверяется с отпечатком, признаки в условии открываются им же
 * после ответа. Вторая попытка не даётся — верный метод подсвечивается.
 *
 * Прогресс — своё хранилище «Узнай метод» (прежний ключ), в журнал
 * решённых задач он не идёт: это не попытка решить задачу.
 */
export function EkranUznay45({
  zadanie,
  payload,
  restored,
  report,
  elapsed,
  onFinish,
  T,
}: EkranUznay45Props) {
  const store = uznay45(zadanie);
  const metody = navykiZadaniya(zadanie);
  const otpechatki = useMemo(() => new Map(metody.map((m) => [sealMetod(m.id), m.id])), [metody]);
  const tasks = payload.tasks;
  const [index, setIndex] = useState(restored?.index ?? 0);
  const [marks, setMarks] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});
  const [vybor, setVybor] = useState<string | null>(restored?.vybor ?? null);
  const [misses, setMisses] = useState(restored?.misses ?? 0);
  const [taskFrom, setTaskFrom] = useState<number | null>(() => restored?.taskFrom ?? elapsed());

  useSessionReport<Ui45>(report, {
    index,
    marks,
    tried,
    order: null,
    value: '',
    checked: null,
    solutionOpen: false,
    hintOpen: false,
    shag: 1,
    mimo: [],
    misses,
    failed: tried[index] === true,
    taskFrom,
    vybor,
    pohozhie: {},
  });

  const task = tasks[index];
  const verny = task === undefined ? undefined : otpechatki.get(task.metodSeal);
  const priznaki = useMemo(() => {
    if (task === undefined || vybor === null) return [];
    try {
      return JSON.parse(openText(task.hints, task.metodSeal)) as string[];
    } catch {
      return [];
    }
  }, [task, vybor]);

  if (task === undefined || verny === undefined) {
    return null;
  }
  const otvecheno = vybor !== null;
  const verno = vybor === verny;
  const last = index === tasks.length - 1;
  const kartinka = task.illustration;
  const nazvanie = (id: string) => metody.find((m) => m.id === id)?.nazvanie ?? '';

  function vybrat(metod: string) {
    if (task === undefined || vybor !== null || verny === undefined) return;
    const right = sealMetod(metod) === task.metodSeal;
    setVybor(metod);
    store.recordAttempt({
      kind: verny,
      taskId: task.id,
      right,
      clean: right,
      seconds: taskFrom === null ? 0 : (elapsed() - taskFrom) / 1000,
    });
    if (right) {
      setMarks({ ...marks, [index]: 'right' });
    } else {
      setMisses(misses + 1);
      setTried({ ...tried, [index]: true });
    }
  }

  function dalshe() {
    if (last) {
      onFinish();
      return;
    }
    setIndex(index + 1);
    setVybor(null);
    setTaskFrom(elapsed());
  }

  return (
    <div className={clsx('trn-ekran z45-uznay', otvecheno && (verno ? 'is-verno' : 'is-neverno'))}>
      <div className="trn-polosa" aria-hidden="true">
        <span style={{ width: `${((index + 1) / Math.max(1, tasks.length)) * 100}%` }} />
      </div>

      <article className="trn-zadacha stk-glass" data-task={task.id}>
        <div className="trn-zadacha__verh">
          <Metka>{task.istochnik === 'opornaya' ? T.uznay.opornaya : T.uznay.metka}</Metka>
          <span className="trn-zadacha__nomer">
            {index + 1} {T.ekran.iz} {tasks.length}
          </span>
        </div>
        {kartinka === undefined ? null : (
          <div className="trn-risunok">
            <img
              className="z45-kartinka"
              src={assetUrl(kartinka.path)}
              alt={kartinka.alt}
              decoding="async"
            />
          </div>
        )}
        <div
          className="trn-uslovie trn-uslovie--tekst"
          dangerouslySetInnerHTML={{ __html: task.uslovie }}
        />
      </article>

      <div className="trn-otvetnaya stk-glass">
        <p className="stk-podpis" id="z45-uznay-vopros">
          {T.uznay.vopros}
        </p>
        <div className="z45-metody" role="group" aria-labelledby="z45-uznay-vopros">
          {metody.map((m) => {
            const eto = m.id === vybor;
            const pravilny = otvecheno && m.id === verny;
            return (
              <button
                key={m.id}
                type="button"
                className={clsx(
                  'z45-metod-knopka',
                  eto && pravilny && 'is-verno',
                  eto && !pravilny && 'is-neverno',
                  !eto && pravilny && 'is-pravilny',
                )}
                aria-pressed={eto}
                disabled={otvecheno}
                onClick={() => vybrat(m.id)}
              >
                <MetodKartinka
                  zadanie={zadanie}
                  metod={m.id}
                  nazvanie=""
                  className="z45-metod-knopka__ikonka"
                />
                <span className="z45-metod-knopka__nazvanie">{m.nazvanie}</span>
              </button>
            );
          })}
        </div>

        {otvecheno ? (
          <div
            className={clsx('trn-verdikt', verno ? 'trn-verdikt--da' : 'trn-verdikt--net')}
            role="status"
          >
            <span className="trn-verdikt__ico">
              <Ikonka name={verno ? 'da' : 'net'} />
            </span>
            <span className="trn-verdikt__text">
              <b>{verno ? T.uznay.verno : T.uznay.neverno}</b>
              <span>
                {verno ? (
                  T.uznay.vernoLead
                ) : (
                  <>
                    {T.uznay.pravilnyy} <b>{nazvanie(verny)}</b>. {T.uznay.nevernoLead}
                  </>
                )}
              </span>
            </span>
          </div>
        ) : null}

        {otvecheno && priznaki.length > 0 ? (
          <div className="z45-priznaki" role="note">
            <p className="stk-podpis">{T.uznay.priznaki}</p>
            <ul>
              {/* Признаки набраны KaTeX на сборке (lib/veroyatnost/pool.ts). */}
              {priznaki.map((p) => (
                <li key={p} dangerouslySetInnerHTML={{ __html: p }} />
              ))}
            </ul>
          </div>
        ) : null}

        {otvecheno ? (
          <div className="trn-knopki">
            <button
              type="button"
              className="stk-btn stk-btn--primary stk-btn--lg trn-knopki__glavnaya"
              onClick={dalshe}
            >
              {last ? T.ekran.itogi : T.ekran.dalshe} <Ikonka name="strelka" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
