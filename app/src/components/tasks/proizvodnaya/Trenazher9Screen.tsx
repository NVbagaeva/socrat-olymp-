'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Button, FigureZoom, Input } from '@/components/ui';
import { assetUrl } from '@/lib/assetUrl';
import { progress9 } from '@/lib/proizvodnaya/progress';
import { answerMatches, openText } from '@/lib/proizvodnaya/secret';
import { kindTitle, type ShagHtml9, type Task9 } from '@/lib/proizvodnaya/session';
import type { TaskMark } from '@/lib/trainerSession/types';
import { HintIcon, RightIcon, WrongIcon } from '../prep/PrepIcons';
import { useSessionReport } from '../session/useSessionReport';
import { HintFlow9 } from './HintFlow9';
import { Risunok9 } from './Risunok9';
import type { Trenazher9Ui } from './trenazher9Ui';

export interface Trenazher9ScreenProps {
  tasks: Task9[];
  /** Контроль: без подсказок и решения до конца тренировки. */
  control: boolean;
  /** Состояние экрана из сохранённой тренировки. null — тренировка новая. */
  restored: Trenazher9Ui | null;
  /** Сообщить оболочке сессии о новом состоянии (она его сохранит). */
  report: (ui: Trenazher9Ui) => void;
  /** Активное время тренировки, мс: пауза и скрытая вкладка не идут. */
  elapsed: () => number;
  /** Последнее задание закрыто: показать итоги. */
  onFinish: () => void;
}

/** Разбор: закрыт тем же отпечатком, что и ответ; раскрывается по нажатию. */
export function razborOf(task: Task9): ShagHtml9[] {
  if (task.razborHtml === '') {
    return [];
  }
  try {
    const value: unknown = JSON.parse(openText(task.razborHtml, task.seal));
    if (Array.isArray(value)) {
      return value.filter(
        (item): item is ShagHtml9 =>
          typeof item === 'object' &&
          item !== null &&
          'strokiHtml' in item &&
          Array.isArray((item as ShagHtml9).strokiHtml),
      );
    }
  } catch {
    /* Не раскрылось — разбора нет. */
  }
  return [];
}

/** Шаги разбора: на экране задания и на итогах. */
export function Razbor9({ shagi }: { shagi: ShagHtml9[] }) {
  if (shagi.length === 0) {
    return <p className="z9-razbor__line">Для этой задачи разбора пока нет.</p>;
  }
  return (
    <ol className="z9-razbor__steps">
      {shagi.map((shag, i) => (
        <li className="z9-razbor__step" key={i}>
          {shag.zagolovokHtml === '' ? null : (
            <p
              className="z9-razbor__head"
              dangerouslySetInnerHTML={{ __html: shag.zagolovokHtml }}
            />
          )}
          {shag.strokiHtml.map((line, j) => (
            <p className="z9-razbor__line" key={j} dangerouslySetInnerHTML={{ __html: line }} />
          ))}
        </li>
      ))}
    </ol>
  );
}

/**
 * Экран задания тренажёра №9.
 *
 * Условие и одно поле для ответа; рисунок условия — без построений.
 * Ответ сверяется с отпечатком: числа в разметке нет. Подсказка —
 * вопросы с кнопками; рисунок подсказки показывает построения по
 * шагам. Разбор закрыт и открывается по просьбе; открытое решение не
 * засчитывается. В режиме «Контроль» подсказок и решения нет до конца.
 *
 * Номер задания, время, пауза и завершение — в панели оболочки сессии
 * (components/tasks/session); всё, что ученик успел сделать, она
 * сохраняет и при возвращении отдаёт обратно (restored).
 */
export function Trenazher9Screen({
  tasks,
  control,
  restored,
  report,
  elapsed,
  onFinish,
}: Trenazher9ScreenProps) {
  const [index, setIndex] = useState(restored?.index ?? 0);
  const [marks, setMarks] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  /* Задания, в которых была ошибка: на итогах они отличаются от
     пропущенных, а верный ответ после ошибки — не «чистый». */
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});
  const [misses, setMisses] = useState(restored?.misses ?? 0);
  const [value, setValue] = useState(restored?.value ?? '');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(restored?.checked ?? null);
  const [hintOn, setHintOn] = useState(restored?.hintOn ?? false);
  const [hintStep, setHintStep] = useState(restored?.hintStep ?? 0);
  const [hintWrong, setHintWrong] = useState<number[]>(restored?.hintWrong ?? []);
  /* Решение хранится флагом: текст закрыт отпечатком и раскрывается заново. */
  const [solutionOpen, setSolutionOpen] = useState(restored?.solution ?? false);
  /* Время тренировки считает оболочка; здесь — с какого момента открыто
     текущее задание (новая тренировка начинается с нуля). */
  const [taskFrom, setTaskFrom] = useState(restored?.taskFrom ?? 0);

  useSessionReport<Trenazher9Ui>(report, {
    index,
    marks,
    tried,
    order: null,
    misses,
    value,
    checked,
    hintOn,
    hintStep,
    hintWrong,
    solution: solutionOpen,
    taskFrom,
  });

  const task = tasks[index];
  const solution = useMemo(
    () => (task !== undefined && solutionOpen ? razborOf(task) : null),
    [task, solutionOpen],
  );

  if (task === undefined) {
    return null;
  }
  const current: Task9 = task;

  const total = tasks.length;
  const last = index === total - 1;
  const mark = marks[index] ?? null;
  const ready = value.trim() !== '';
  const done = checked === 'right' || solutionOpen;
  const hasHint = current.podskazka.length > 0;
  /* Открытое решение до верного ответа — задача не засчитана. */
  const revealed = solutionOpen && checked !== 'right';

  function taskSeconds(): number {
    return Math.max(0, (elapsed() - taskFrom) / 1000);
  }

  function check() {
    if (answerMatches(value, current.seal)) {
      const hinted = hintOn || solutionOpen;
      const clean = tried[index] !== true && !hinted;
      setChecked('right');
      if (mark === null) {
        setMarks({ ...marks, [index]: hinted ? 'hinted' : 'right' });
        progress9.recordAttempt({
          kind: current.prototype,
          taskId: current.id,
          right: !solutionOpen,
          clean,
          seconds: taskSeconds(),
        });
      }
    } else {
      setChecked('wrong');
      setMisses(misses + 1);
      setTried({ ...tried, [index]: true });
    }
  }

  function reveal() {
    setSolutionOpen(true);
    if (mark === null) {
      setMarks({ ...marks, [index]: 'hinted' });
      progress9.recordAttempt({
        kind: current.prototype,
        taskId: current.id,
        right: false,
        clean: false,
        seconds: taskSeconds(),
      });
    }
  }

  function pickHint(k: number) {
    const q = current.podskazka[hintStep];
    if (q === undefined) {
      return;
    }
    if (q.knopki[k]?.verno === true) {
      setHintStep(hintStep + 1);
      setHintWrong([]);
    } else if (!hintWrong.includes(k)) {
      setHintWrong([...hintWrong, k]);
    }
  }

  function next() {
    setIndex(Math.min(index + 1, total - 1));
    setValue('');
    setChecked(null);
    setHintOn(false);
    setHintStep(0);
    setHintWrong([]);
    setSolutionOpen(false);
    setTaskFrom(elapsed());
  }

  /* ── Какой рисунок показывать. ── */
  const currentQuestion =
    hasHint && hintOn
      ? current.podskazka[Math.min(hintStep, current.podskazka.length - 1)]
      : undefined;
  const drawing = current.risunok;
  const mode: 'student' | 'hint' | 'teacher' =
    done && !control ? 'teacher' : hintOn && !done && !control ? 'hint' : 'student';

  const nextButton = last ? (
    <Button onClick={onFinish}>Смотреть результат →</Button>
  ) : (
    <Button onClick={next}>Следующее задание →</Button>
  );

  return (
    <section className="ttask z9-ttask">
      {/* Номер задания, решённое и время — в панели тренировки над
          экраном; здесь только группа задачи. */}
      <p className="ttask__count">{kindTitle(current.prototype)}</p>

      <ol className="ttask__dots" aria-hidden="true">
        {tasks.map((it, i) => (
          <li
            key={`${i}-${it.id}`}
            className={clsx(
              'ttask__dot',
              marks[i] === 'right' && 'is-done',
              marks[i] === 'hinted' && 'is-hinted',
              i === index && 'is-current',
            )}
          >
            {marks[i] === undefined ? i + 1 : <RightIcon />}
          </li>
        ))}
      </ol>

      <article className="ptask__card">
        <div className="ptask__text">
          <div
            className="ptask__question"
            dangerouslySetInnerHTML={{ __html: current.questionHtml }}
          />
          {drawing === null ? null : (
            <FigureZoom
              className="chart ptask__chart z9-ptask__pic"
              label={`Рисунок к заданию ${index + 1}`}
            >
              <Risunok9
                figura={drawing}
                rezhim={mode}
                {...(mode === 'hint' && currentQuestion !== undefined
                  ? {
                      shag:
                        hintStep >= current.podskazka.length
                          ? Number.POSITIVE_INFINITY
                          : currentQuestion.shag,
                    }
                  : {})}
              />
            </FigureZoom>
          )}
          {current.kartinka === null ? null : (
            <div className="chart ptask__chart z9-ptask__pic">
              <Image
                className="z9-kartinka"
                src={assetUrl(current.kartinka)}
                alt={`Рисунок к заданию ${index + 1}`}
                width={720}
                height={480}
              />
            </div>
          )}
        </div>
      </article>

      <form
        className="ttask__answer"
        onSubmit={(event) => {
          event.preventDefault();
          if (ready && !done) {
            check();
          }
        }}
      >
        <p className="ptask__label" id="z9-answer-label">
          Ваш ответ:
        </p>
        <Input
          className="ttask__input"
          value={value}
          state={checked === null ? 'default' : checked === 'right' ? 'success' : 'error'}
          inputMode="decimal"
          autoComplete="off"
          aria-labelledby="z9-answer-label"
          aria-describedby="z9-answer-hint"
          readOnly={checked === 'right'}
          onChange={(event) => {
            setValue(event.target.value);
            if (checked === 'wrong') {
              setChecked(null);
            }
          }}
        />
        <p className="z9-ttask__hint t-caption" id="z9-answer-hint">
          Ответ — целое число или десятичная дробь; запятая и точка равноправны.
        </p>

        {checked === null ? null : (
          <div className={clsx('tverdict', `tverdict--${checked}`)} role="status">
            <p className="tverdict__title">
              <span className="tverdict__ico">
                {checked === 'right' ? <RightIcon /> : <WrongIcon />}
              </span>
              {checked === 'right' ? 'Верно!' : 'Есть ошибка'}
            </p>
            {control ? null : (
              <p className="tverdict__text">
                {checked === 'right'
                  ? revealed
                    ? 'Ответ верный, но решение было открыто, поэтому задача не засчитана.'
                    : hintOn
                      ? 'Верно, но с подсказкой: задача будет отмечена как решённая с подсказкой.'
                      : 'Ответ верный.'
                  : 'Ответ не сошёлся. Можно исправить и проверить ещё раз.'}
              </p>
            )}
          </div>
        )}

        {/* Подсказка — вопросы с кнопками; в «Контроле» её нет. */}
        {hintOn && hasHint && !control ? (
          <HintFlow9
            voprosy={current.podskazka}
            step={hintStep}
            wrong={hintWrong}
            onPick={pickHint}
          />
        ) : null}

        {solution === null ? null : (
          <div className="z9-razbor" role="region" aria-label="Решение">
            <p className="z9-razbor__title">
              <HintIcon />
              Решение
            </p>
            <Razbor9 shagi={solution} />
          </div>
        )}

        <div className="ttask__actions">
          {done ? (
            <>
              {nextButton}
              {!solutionOpen && !control ? (
                <Button variant="ghost" onClick={reveal}>
                  Показать решение
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button type="submit" disabled={!ready}>
                Проверить
              </Button>
              {control ? null : (
                <>
                  {hasHint && !hintOn ? (
                    <span className="thint__offer">
                      <Button variant="ghost" onClick={() => setHintOn(true)}>
                        Подсказка
                      </Button>
                      <span className="thint__warn">Задача будет отмечена «с подсказкой».</span>
                    </span>
                  ) : null}
                  <span className="thint__offer">
                    <Button variant="ghost" onClick={reveal}>
                      Показать решение
                    </Button>
                    <span className="thint__warn">Задача не будет засчитана.</span>
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </form>
    </section>
  );
}
