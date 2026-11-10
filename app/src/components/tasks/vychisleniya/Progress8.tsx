'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { TypeCards, type TypeGroup } from '@/components/progress/TypeCards';
import { BookmarksList, HistoryList, MistakesList } from '@/components/progress/Lists';
import { distinctSolved, mistakes as openMistakes, totals } from '@/lib/progressLog';
import { counted } from '@/lib/plural';
import { BANK } from '@/lib/vychisleniya/bank';
import { OSHIBKI8, TRENAZHER8 } from '@/lib/vychisleniya/links';
import { log8 } from '@/lib/vychisleniya/progress';
import { isBankTask, prototypeOfTask } from '@/lib/vychisleniya/ids';
import { SKILLS } from '@/lib/vychisleniya/skills';
import type { Bookmark } from '@/lib/zakladki';
import '@/components/tasks/trainer/tstats.css';

const perPrototype = new Map(BANK.map((entry) => [entry.prototype, entry.variants.length]));

/**
 * Названия прототипов, набранные KaTeX на сборке: прототип → HTML.
 * Собирает их серверная страница (names8Html), клиенту KaTeX не нужен.
 */
export type Names8 = Readonly<Record<string, string>>;

/** Группы карточек №8: навыки, внутри — прототипы. */
function groups8(names: Names8): TypeGroup[] {
  return SKILLS.map((skill) => ({
    id: skill.id,
    title: skill.nazvanie,
    kinds: skill.prototypes.map((id) => ({ id, titleHtml: names[id] ?? id })),
    capacity: skill.prototypes.reduce((sum, id) => sum + (perPrototype.get(id) ?? 0), 0),
  }));
}

function Name({ names, prototype }: { names: Names8; prototype: string }) {
  return <span dangerouslySetInnerHTML={{ __html: names[prototype] ?? prototype }} />;
}

/** Подпись закладки №8: опорная — сохранённая, тренажёра — по прототипу задачи. */
export function bookmarkTitle8(names: Names8, item: Bookmark) {
  if (item.place !== 'trenazher') return item.title;
  return (
    <>
      №8 · <Name names={names} prototype={prototypeOfTask(item.ref)} />
    </>
  );
}

function timeText(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m === 0 ? `${s} с` : `${m} мин ${s} с`;
}

/** «Решено X из 260 задач банка»: разные задачи, не попытки. */
export function BankCounter8({ total }: { total: number }) {
  const log = log8.use();
  const solved = Math.min(total, distinctSolved(log, isBankTask));
  return (
    <p className="tstats__counter z8-counter">
      Решено <b>{solved}</b> из {total} задач банка
    </p>
  );
}

/**
 * Прогресс тренажёра №8 — под конфигуратором и в кабинете: карточки
 * навыков, «Мои ошибки», «Отложенные», история тренировок.
 *
 * onFixMistakes — в тренажёре «Работа над ошибками» начинает тренировку
 * сразу; без него (кабинет) — ссылка в тренажёр с выбранным режимом.
 */
export function Progress8({
  total,
  names,
  onFixMistakes,
  showReset = true,
}: {
  total: number;
  names: Names8;
  onFixMistakes?: () => void;
  showReset?: boolean;
}) {
  const log = log8.use();
  const sum = totals(log);
  const open = openMistakes(log, prototypeOfTask);
  const accuracy = sum.done === 0 ? null : Math.round((sum.right / sum.done) * 100);
  const fix =
    open.length === 0 ? null : onFixMistakes === undefined ? (
      <Link className="btn btn--primary btn--sm" href={OSHIBKI8}>
        Работа над ошибками
      </Link>
    ) : (
      <Button size="sm" onClick={onFixMistakes}>
        Работа над ошибками
      </Button>
    );

  return (
    <section className="tstats z8-progress" aria-labelledby="z8-progress-title">
      <h3 className="tstats__title" id="z8-progress-title">
        Мой прогресс в №8
      </h3>
      <BankCounter8 total={total} />
      {sum.done === 0 ? (
        <p className="tstats__empty">
          Здесь появится прогресс: решено, верно и ошибки по каждому навыку.{' '}
          {onFixMistakes === undefined ? <Link href={TRENAZHER8}>Открыть тренажёр →</Link> : null}
        </p>
      ) : (
        <dl className="tstats__rows">
          <div className="tstats__row">
            <dt>Решено задач</dt>
            <dd>{sum.done}</dd>
          </div>
          <div className="tstats__row">
            <dt>Верно с первого раза</dt>
            <dd>{sum.right}</dd>
          </div>
          <div className="tstats__row">
            <dt>С ошибкой или с решением</dt>
            <dd>{sum.mistakes}</dd>
          </div>
          <div className="tstats__row">
            <dt>Точность</dt>
            <dd>{accuracy === null ? '—' : `${accuracy}%`}</dd>
          </div>
          <div className="tstats__row">
            <dt>Среднее время</dt>
            <dd>{sum.done === 0 ? '—' : timeText(sum.seconds / sum.done)}</dd>
          </div>
        </dl>
      )}

      <section className="tstats__kinds">
        <h3 className="tstats__title">По навыкам</h3>
        <TypeCards groups={groups8(names)} log={log} hideEmpty label="Прогресс по навыкам №8" />
      </section>

      <section className="tstats__kinds" data-section="mistakes8">
        <h3 className="tstats__title">
          Мои ошибки
          {open.length === 0 ? '' : ` · ${counted(open.length, 'задача', 'задачи', 'задач')}`}
        </h3>
        <MistakesList
          items={open}
          titleOf={(m) => <Name names={names} prototype={prototypeOfTask(m.task)} />}
          action={fix}
          empty="Ошибок нет. Задачи с ошибкой или открытым решением появятся здесь."
        />
      </section>

      <section className="tstats__kinds" data-section="later8">
        <h3 className="tstats__title">Отложенные</h3>
        <BookmarksList
          section="8"
          empty="Ничего не отложено. Кнопка «Отложить на потом» есть у каждой задачи."
          renderTitle={(item) => bookmarkTitle8(names, item)}
        />
      </section>

      <section className="tstats__kinds" data-section="history8">
        <h3 className="tstats__title">История тренировок</h3>
        <HistoryList section="8" empty="Завершённых тренировок пока нет." />
      </section>

      {showReset && sum.done > 0 ? (
        <Button variant="ghost" onClick={() => log8.reset()}>
          Сбросить прогресс тренажёра
        </Button>
      ) : null}
    </section>
  );
}

/** Для «О задании»: карточки навыков без подробностей и ссылка в тренажёр. */
export function Progress8Compact({ total, names }: { total: number; names: Names8 }) {
  const log = log8.use();
  return (
    <section className="z8-about-progress" aria-labelledby="z8-about-progress-title">
      <div className="z8-about-progress__head">
        <h2 className="t-h3" id="z8-about-progress-title">
          Мой прогресс
        </h2>
        <BankCounter8 total={total} />
      </div>
      <TypeCards groups={groups8(names)} log={log} compact label="Прогресс по навыкам №8" />
      <p className="z8-about-progress__foot">
        <Link href={TRENAZHER8}>Тренироваться →</Link>
      </p>
    </section>
  );
}
