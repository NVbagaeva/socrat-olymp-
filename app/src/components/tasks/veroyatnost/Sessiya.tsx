'use client';

import { useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui';
import { ProblemCard, type ProblemCardSnapshot } from '@/components/tasks/card';
import { PrepDots } from '@/components/tasks/prep/PrepDots';
import { RightIcon, WrongIcon } from '@/components/tasks/prep/PrepIcons';
import { useSessionReport } from '@/components/tasks/session/useSessionReport';
import { trenazherSlova, uznaySlova } from '@/content/veroyatnost';
import type { ProgressStore } from '@/lib/progressStore';
import type { TaskMark } from '@/lib/trainerSession/types';
import { openText, sealMetod } from '@/lib/veroyatnost/secret';
import { MethodPicker } from './MethodPicker';
import { navykPoId, navykiZadaniya } from './metody';
import type { SessiyaPayload } from './sessiyaPayload';
import { PUSTAYA_KARTOCHKA, type SessiyaUi } from './sessiyaUi';

export interface SessiyaProps {
  payload: SessiyaPayload;
  /** Состояние экрана из сохранённой тренировки; null — тренировка только началась. */
  restored: SessiyaUi | null;
  /** Сообщить оболочке сессии о состоянии экрана. */
  report: (ui: SessiyaUi) => void;
  /** Мс активного времени с начала тренировки (пауза не считается). */
  elapsed: () => number;
  /** Ученик решил последнее задание и жмёт «Смотреть результат». */
  onFinish: () => void;
  /** Хранилище решённых задач и хранилище «Узнай метод». */
  store: ProgressStore;
  uznayStore: ProgressStore;
}

/* Последняя задача: за ней идёт экран итогов оболочки. */
const REZULTAT = 'Смотреть результат →';

interface Itog {
  vybor: string;
  verny: string;
  priznaki: string[];
}

/**
 * Подход тренажёра заданий №4 и №5: задачи одна за другой, кружки
 * подхода — те же, что у задания №12; итог и таймер ведёт оболочка
 * сессии (components/tasks/session).
 *
 * В режимах отработки, смешанном и повторе ошибок задача — ProblemCard:
 * условие, рисунок по модели, решение по шагам; правильных ответов в
 * разметке нет. В режиме «Узнай метод» — только условие и кнопки
 * методов: метода в разметке тоже нет, кнопка сверяется с отпечатком,
 * а признаки открываются им же после ответа.
 *
 * Задачи приходят готовыми в payload (собраны в Trenazher при запуске),
 * поэтому при возвращении в тренировку подход тот же, что был. Всё,
 * что ученик успел на задаче, берётся из restored: карточка получает
 * ответ и шаг решения, «Узнай метод» — сделанный выбор.
 */
export function Sessiya({
  payload,
  restored,
  report,
  elapsed,
  onFinish,
  store,
  uznayStore,
}: SessiyaProps) {
  const { zadanie, rezhim, tasks } = payload;
  const slova = trenazherSlova(zadanie);
  const uznayTeksty = uznaySlova(zadanie);
  const metody = navykiZadaniya(zadanie);
  const uznayRezhim = rezhim === 'uznay';
  /* Отпечатки всех методов задания — чтобы после ответа назвать верный. */
  const otpechatki = useMemo(() => new Map(metody.map((m) => [sealMetod(m.id), m.id])), [metody]);

  const [index, setIndex] = useState(restored?.index ?? 0);
  /* Чем закончилось каждое задание подхода: кружки и итог берут отсюда. */
  const [marks, setMarks] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  /* Задания, в которых была ошибка: на итогах они отличаются от пропущенных. */
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});
  /* Состояние карточки текущей задачи: она сообщает его сама. */
  const [card, setCard] = useState<ProblemCardSnapshot>(restored?.card ?? PUSTAYA_KARTOCHKA);
  /* «Узнай метод»: что нажато на текущей задаче. */
  const [vybor, setVybor] = useState<string | null>(restored?.vybor ?? null);

  /* Время на задачу идёт от появления задачи на экране, в активных
     миллисекундах оболочки: пауза и скрытая вкладка в него не входят. */
  const [taskFrom, setTaskFrom] = useState(() => restored?.taskFrom ?? elapsed());
  /* Задача закрывается один раз: первым ответом или открытым решением.
     Второй ответ после ошибки счётчиков не меняет. */
  const zakryto = useRef<number | null>(
    restored !== null && restored.marks[restored.index] !== undefined ? restored.index : null,
  );
  const oshibsya = useRef(restored?.tried[restored.index] === true);

  /* Всё состояние экрана — оболочке сессии: она сохраняет его при
     каждом изменении, а при возвращении отдаёт обратно (restored). */
  useSessionReport<SessiyaUi>(report, {
    index,
    marks,
    tried,
    order: null,
    card,
    vybor,
    taskFrom,
  });

  const task = tasks[index];
  const total = tasks.length;
  const last = index === total - 1;

  /** Сколько секунд ушло на текущую задачу. */
  function sekundy(): number {
    return (elapsed() - taskFrom) / 1000;
  }

  function oshibka() {
    oshibsya.current = true;
    setTried((was) => ({ ...was, [index]: true }));
  }

  /** Закрыть задачу тренажёра: верный ответ или открытое решение. */
  function zapisat(right: boolean, clean: boolean) {
    if (task === undefined || zakryto.current === index || task.metod === '') {
      return;
    }
    zakryto.current = index;
    store.recordAttempt({
      kind: task.metod,
      taskId: task.id,
      right,
      clean,
      seconds: sekundy(),
    });
    setMarks((was) => ({ ...was, [index]: right ? 'right' : 'hinted' }));
  }

  function otvet(right: boolean) {
    if (right) {
      zapisat(true, !oshibsya.current);
      return;
    }
    oshibka();
  }

  /** Признаки и верный метод задачи «Узнай метод» — только после выбора. */
  const itog = useMemo<Itog | null>(() => {
    if (!uznayRezhim || vybor === null || task === undefined) {
      return null;
    }
    const verny = otpechatki.get(task.metodSeal);
    if (verny === undefined) {
      return null;
    }
    const priznaki = JSON.parse(openText(task.hints, task.metodSeal)) as string[];
    return { vybor, verny, priznaki };
  }, [uznayRezhim, vybor, task, otpechatki]);

  /** «Узнай метод»: сверить выбор с отпечатком и открыть признаки. */
  function vybrat(metod: string) {
    if (task === undefined || vybor !== null) {
      return;
    }
    const verny = otpechatki.get(task.metodSeal);
    if (verny === undefined) {
      return;
    }
    const right = sealMetod(metod) === task.metodSeal;
    setVybor(metod);
    uznayStore.recordAttempt({
      kind: verny,
      taskId: task.id,
      right,
      clean: right,
      seconds: sekundy(),
    });
    if (right) {
      zakryto.current = index;
      setMarks((was) => ({ ...was, [index]: 'right' }));
    } else {
      oshibka();
    }
  }

  function dalshe() {
    if (last) {
      onFinish();
      return;
    }
    setIndex((n) => n + 1);
    setCard(PUSTAYA_KARTOCHKA);
    setVybor(null);
    setTaskFrom(elapsed());
    zakryto.current = null;
    oshibsya.current = false;
  }

  if (task === undefined) {
    return null;
  }

  /* Точки подхода — те же, что в подготовке: цвет говорит, что с задачей
     стало. Номер задания и таймер показывает панель оболочки. Прыгать
     по подходу нельзя, поэтому ряд без ссылок. */
  const kruzhki = (
    <PrepDots
      items={tasks.map((z, i) => ({
        id: `${i}-${z.id}`,
        no: i + 1,
        state: marks[i] === 'right' ? 'right' : marks[i] === 'hinted' ? 'revealed' : null,
      }))}
      current={index}
    />
  );

  if (uznayRezhim) {
    const verno = itog !== null && itog.vybor === itog.verny;
    return (
      <section className="ttask z4-uznay">
        {kruzhki}
        <div
          className={clsx(
            'z4-uznay__zadacha',
            itog !== null && (verno ? 'is-correct' : 'is-incorrect'),
          )}
        >
          <ProblemCard
            key={task.id}
            variant="condition"
            zadacha={{
              id: task.id,
              uslovie: task.uslovie,
              /* Числового ответа у условия нет: ни ключа, ни отпечатка. */
              klyuch: '',
              seal: '',
              steps: '',
              ...(task.illustration === undefined ? {} : { illustration: task.illustration }),
            }}
            istochnik={
              uznayTeksty.istochnik[task.istochnik === 'konspekt' ? 'konspekt' : 'prototip']
            }
          />

          <p className="z4-uznay__vopros">{uznayTeksty.vopros}</p>
          <MethodPicker
            vybor={itog?.vybor ?? null}
            verny={itog?.verny ?? null}
            onPick={vybrat}
            label={uznayTeksty.vopros}
            metody={metody}
          />

          {itog !== null ? (
            <div
              className={clsx(
                'z4-uznay__itog',
                verno ? 'z4-uznay__itog--correct' : 'z4-uznay__itog--incorrect',
              )}
              role="status"
            >
              <p className="z4-uznay__verdict">
                <span className="z4-uznay__ico">{verno ? <RightIcon /> : <WrongIcon />}</span>
                {verno ? uznayTeksty.verno : uznayTeksty.neverno}
              </p>
              {verno ? null : (
                <p className="z4-uznay__pravilnyy">
                  <b>{uznayTeksty.pravilnyy}</b> {navykPoId(zadanie, itog.verny)?.nazvanie}
                </p>
              )}
              {/* Признаки — и после ошибки, и после верного ответа:
                  во втором случае это подкрепление, заголовок другой. */}
              <p className="z4-uznay__priznaki-title">
                {verno ? uznayTeksty.kakVidno : uznayTeksty.priznaki}
              </p>
              <ul className="z4-uznay__priznaki">
                {/* Признаки набраны KaTeX на сборке (lib/veroyatnost/pool.ts). */}
                {itog.priznaki.map((p) => (
                  <li key={p} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </ul>
              <div className="z4-uznay__actions">
                <Button onClick={dalshe}>{last ? REZULTAT : slova.dalshe}</Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  const navyk = navykPoId(zadanie, task.metod);

  return (
    <section className="ttask">
      {kruzhki}
      {/* Ключ — сама задача: следующая карточка начинается с чистого
          состояния, а не наследует введённый ответ. */}
      <ProblemCard
        key={task.id}
        zadacha={{
          id: task.id,
          uslovie: task.uslovie,
          klyuch: task.klyuch,
          seal: task.seal,
          steps: task.steps,
          ...(task.model === undefined ? {} : { model: task.model }),
        }}
        /* Метод в шапке — только в отработке: в смешанном режиме и
           в повторе ученик должен узнать его сам. */
        {...(rezhim === 'practice' && payload.podskazki && navyk !== undefined
          ? { metodLabel: navyk.nazvanie }
          : {})}
        istochnik={task.istochnik}
        podskazki={payload.podskazki}
        initial={card}
        onChange={setCard}
        onResult={otvet}
        onReveal={() => zapisat(false, false)}
        onNext={dalshe}
        nextLabel={last ? REZULTAT : slova.dalshe}
      />
    </section>
  );
}
