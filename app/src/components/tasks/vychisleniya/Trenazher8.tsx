'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { BookmarksList, HistoryList, MistakesList } from '@/components/progress/Lists';
import { TrainerSessionHost, type ConfiguratorApi, type SummaryActions } from '../session';
import type { SummaryData } from '../session/TrainerSummary';
import { ShagiResheniya } from '../steklo';
import {
  ItogiSessii,
  ProgressPanel,
  StartRezhimy,
  VyborTem,
  type GruppaVybora,
  type ItogZadacha,
  type Rezhim,
  type StrokaGruppy,
} from '../trening';
import { PROTOTYPES8_ORDER, TIPY8, TRENAZHER8, gruppaOfPrototype } from '@/content/vychisleniya8';
import { closedTasks, kindStats, mistakes as openMistakes } from '@/lib/progressLog';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import { readSession } from '@/lib/trainerSession/store';
import { activeBookmarks, bookmarks } from '@/lib/zakladki';
import { BANK_TOTAL, prototypeOfTask } from '@/lib/vychisleniya/ids';
import { log8, vybor8, type Vybor8 } from '@/lib/vychisleniya/progress';
import {
  buildByPrototypes,
  buildMistakes8,
  taskById,
  type Task8,
} from '@/lib/vychisleniya/session';
import { BankCounter8, bookmarkTitle8 } from './Progress8';
import { Trenazher8Screen, shagiOf } from './Trenazher8Screen';
import {
  isTrenazher8Payload,
  packTrenazher8,
  similarTrenazher8,
  taskAt8,
  unpackTrenazher8,
  type Trenazher8Payload,
} from './trenazher8Payload';
import { readTrenazher8Ui, type Trenazher8Ui } from './trenazher8Ui';

export interface Trenazher8Props {
  /** Адрес вкладки: туда ведёт кнопка возврата с итогового экрана. */
  base: string;
  /** Группы и типы для выбора тем: названия уже набраны KaTeX. */
  gruppy: GruppaVybora[];
}

const COUNTS: (number | null)[] = [5, 10, 20, null];
/** «Без конца»: столько задач собирается за раз. */
const BEZ_KONCA = 40;
/** Задач в быстрых режимах: «вперемешку» и «работа над ошибками». */
const BYSTRO = 10;

type Ekran = 'rezhimy' | 'temy';

/**
 * Вход по ссылке: одна задача из закладки (?zadacha=), «Работа над
 * ошибками» (?rezhim=oshibki) из кабинета и «Моих ошибок», один тип
 * (?tip=) с вкладки «О задании». Все три приходят обычной ссылкой, а не
 * переходом внутри приложения: адрес читается до первой отрисовки
 * оболочки, и при незавершённой тренировке она спросит, продолжить её
 * или начать новую по ссылке.
 */
type Intent =
  { kind: 'zadacha'; id: string } | { kind: 'oshibki' } | { kind: 'tip'; tip: string } | null;

function readIntent(): Intent {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('zadacha');
  if (id !== null && taskById(id) !== null) return { kind: 'zadacha', id };
  if (params.get('rezhim') === 'oshibki') return { kind: 'oshibki' };
  const tip = params.get('tip');
  if (tip !== null && PROTOTYPES8_ORDER.includes(tip)) return { kind: 'tip', tip };
  return null;
}

/** Убрать параметры ссылки из адреса: вопрос о незавершённой тренировке не повторится. */
function clearIntent() {
  const url = new URL(window.location.href);
  url.searchParams.delete('zadacha');
  url.searchParams.delete('rezhim');
  url.searchParams.delete('tip');
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

/** Название типа текстом: для итогов оболочки и истории тренировок. */
function tipNazvanie(prototype: string): string {
  return TIPY8[prototype]?.nazvanie ?? prototype;
}

/**
 * Тренажёр задания №8: оболочка сессии вокруг стартовых режимов,
 * выбора тем, экрана задачи и итогов. Задания собираются в браузере;
 * в хранилище уходит только рецепт (идентификаторы задач и подписи),
 * открытые числа туда не попадают.
 */
export function Trenazher8({ base, gruppy }: Trenazher8Props) {
  const nazvaniya = Object.fromEntries(
    gruppy.flatMap((g) => g.tipy.map((t) => [t.id, t.nazvanieHtml])),
  );
  const [ekran, setEkran] = useState<Ekran>('rezhimy');
  const [intent] = useState<Intent>(readIntent);
  /* Часы на панели: по выбору ученика при старте или из записи. */
  const [clock, setClock] = useState(true);

  return (
    <TrainerSessionHost<Trenazher8Payload, Trenazher8Ui>
      scope={scopeOfPath(base) ?? '8'}
      what="тренажёр"
      backHref={base}
      entryIntent={intent !== null}
      onEntryResolved={() => {
        clearIntent();
        if (intent?.kind === 'tip') {
          setEkran('temy');
        }
      }}
      isPayload={isTrenazher8Payload}
      count={(payload) => payload.tasks.length}
      describe={(payload, at) => {
        const task = taskAt8(payload, at);
        if (task === undefined) {
          throw new Error('Нет задания');
        }
        const reshenie = shagiOf(task);
        return {
          kind: tipNazvanie(task.prototype),
          html: task.questionHtml,
          review: () => <ShagiResheniya shagi={reshenie.shagi} delimost={reshenie.delimost} />,
        };
      }}
      /* «Прорешать те же задачи» нет: повтор той же задачи ничего не
         проверяет. «Работа над ошибками» — новые аналоги. */
      similar={similarTrenazher8}
      pack={packTrenazher8}
      unpack={(packed) => {
        const payload = unpackTrenazher8(packed);
        if (payload !== null) {
          setClock(payload.timer !== false);
        }
        return payload;
      }}
      labels={{ clock }}
      configurator={(api) => (
        <Konfigurator8
          gruppy={gruppy}
          nazvaniya={nazvaniya}
          ekran={ekran}
          setEkran={setEkran}
          intent={intent}
          api={{
            ...api,
            start: (payload) => {
              setClock(payload.timer !== false);
              api.start(payload);
            },
          }}
        />
      )}
      summaryView={(data, actions) => (
        <Itogi8
          data={data}
          actions={actions}
          nazvaniya={nazvaniya}
          gruppy={gruppy}
          onVybor={() => {
            setEkran('temy');
            actions.onNew();
          }}
        />
      )}
      screen={({ payload, sessionId, restored, report, elapsed, finish, setBeforeFinish }) => (
        <div className="trn">
          <Trenazher8Screen
            payload={payload}
            roundKey={sessionId}
            restored={restored === null ? null : readTrenazher8Ui(restored)}
            report={report}
            elapsed={elapsed}
            onFinish={finish}
            setBeforeFinish={setBeforeFinish}
            nazvaniya={nazvaniya}
          />
        </div>
      )}
    />
  );
}

/** Строки прогресса по группам из журнала: решено, верно, «Стоит повторить». */
function strokiProgressa(
  gruppy: GruppaVybora[],
  log: ReturnType<typeof log8.use>,
): { stroki: StrokaGruppy[]; resheno: number; verno: number } {
  const groupOf = new Map(gruppy.flatMap((g) => g.tipy.map((t) => [t.id, g.id] as const)));
  const stats = kindStats(log, (kind) => groupOf.get(kind) ?? kind);
  let resheno = 0;
  let verno = 0;
  const stroki = gruppy.map((g) => {
    const s = stats.get(g.id);
    resheno += s?.done ?? 0;
    verno += s?.right ?? 0;
    return {
      id: g.id,
      nazvanie: g.nazvanie,
      znakHtml: g.znakHtml,
      ton: g.ton,
      verno: s?.right ?? 0,
      vsego: s?.done ?? 0,
      ...(s?.repeat === true ? { metka: TRENAZHER8.progress.povtorit } : {}),
    };
  });
  return { stroki, resheno, verno };
}

function Konfigurator8({
  gruppy,
  nazvaniya,
  ekran,
  setEkran,
  intent,
  api,
}: {
  gruppy: GruppaVybora[];
  nazvaniya: Record<string, string>;
  ekran: Ekran;
  setEkran: (ekran: Ekran) => void;
  intent: Intent;
  api: ConfiguratorApi<Trenazher8Payload>;
}) {
  const log = log8.use();
  const { stroki, resheno, verno } = strokiProgressa(gruppy, log);
  const mistakeList = openMistakes(log, prototypeOfTask);
  const otlozhennye = activeBookmarks(bookmarks.use(), '8').filter(
    (item) => item.place === 'trenazher',
  );
  /* Последний выбор живёт в хранилище браузера: на сервере — по умолчанию. */
  const vybor = vybor8.use();
  const selected = new Set(vybor.tipy.length === 0 ? PROTOTYPES8_ORDER : vybor.tipy);

  function zapomnit(next: Vybor8) {
    vybor8.set(next);
  }

  function start(tasks: Task8[], control = vybor.bezPodskazok, timer = vybor.timer) {
    if (tasks.length > 0) {
      api.start({ tasks, control, timer });
    }
  }

  function startOshibki() {
    start(buildMistakes8(mistakeList, BYSTRO), false);
  }

  /* Вход по ссылке — один раз: если незавершённой тренировки нет, сразу
     в задачи (иначе оболочка спросит, и выбор откроется как надо). */
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || intent === null) return;
    opened.current = true;
    if (intent.kind === 'tip') {
      vybor8.set({ ...vybor8.get(), tipy: [intent.tip] });
    }
    if (readSession(scopeOfPath(window.location.pathname) ?? '8').status === 'ok') return;
    clearIntent();
    const closed = closedTasks(log8.get());
    if (intent.kind === 'zadacha') {
      const task = taskById(intent.id);
      if (task !== null) api.start({ tasks: [task], control: false, timer: vybor8.get().timer });
    } else if (intent.kind === 'tip') {
      const tasks = buildByPrototypes([intent.tip], BYSTRO, closed);
      if (tasks.length > 0) api.start({ tasks, control: false, timer: vybor8.get().timer });
    } else {
      const tasks = buildMistakes8(openMistakes(log8.get(), prototypeOfTask), BYSTRO);
      if (tasks.length > 0) api.start({ tasks, control: false, timer: vybor8.get().timer });
    }
  }, [intent, api]);

  const rezhimy: Rezhim[] = [
    {
      id: 'mix',
      ikonka: 'mix',
      zag: TRENAZHER8.rezhimy.mix.zag,
      lead: TRENAZHER8.rezhimy.mix.lead(BYSTRO),
    },
    {
      id: 'temy',
      ikonka: 'temy',
      zag: TRENAZHER8.rezhimy.temy.zag,
      lead: TRENAZHER8.rezhimy.temy.lead,
    },
    {
      id: 'oshibki',
      ikonka: 'oshibki',
      zag: TRENAZHER8.rezhimy.oshibki.zag,
      lead: TRENAZHER8.rezhimy.oshibki.lead(mistakeList.length),
      warm: true,
      disabled: mistakeList.length === 0,
    },
  ];

  function pick(id: string) {
    if (id === 'mix') {
      start(buildByPrototypes(PROTOTYPES8_ORDER, BYSTRO, closedTasks(log)), false);
    } else if (id === 'temy') {
      setEkran('temy');
    } else if (id === 'oshibki') {
      startOshibki();
    }
  }

  function startOtlozhennye() {
    start(
      otlozhennye.flatMap((item) => {
        const task = taskById(item.ref);
        return task === null ? [] : [task];
      }),
      false,
    );
  }

  if (ekran === 'temy') {
    return (
      <div className="trn">
        <VyborTem
          gruppy={gruppy}
          selected={selected}
          onSelected={(next) =>
            zapomnit({
              ...vybor,
              tipy: next.size === PROTOTYPES8_ORDER.length ? [] : [...next],
            })
          }
          counts={COUNTS}
          count={vybor.count}
          onCount={(count) => zapomnit({ ...vybor, count })}
          timer={vybor.timer}
          onTimer={(timer) => zapomnit({ ...vybor, timer })}
          bezPodskazok={vybor.bezPodskazok}
          onBezPodskazok={(bezPodskazok) => zapomnit({ ...vybor, bezPodskazok })}
          onBack={() => setEkran('rezhimy')}
          onStart={() => {
            const tipy = PROTOTYPES8_ORDER.filter((id) => selected.has(id));
            start(buildByPrototypes(tipy, vybor.count ?? BEZ_KONCA, closedTasks(log)));
          }}
          labels={TRENAZHER8.vybor}
        />
      </div>
    );
  }

  return (
    <div className="trn">
      <StartRezhimy
        title={TRENAZHER8.rezhimy.title}
        rezhimy={rezhimy}
        onPick={pick}
        dop={
          <>
            {otlozhennye.length === 0 ? null : (
              <button
                type="button"
                className="stk-btn stk-btn--tihaya trn-otlozhennye"
                onClick={startOtlozhennye}
              >
                {TRENAZHER8.rezhimy.otlozhennye(otlozhennye.length)}
              </button>
            )}
            <ProgressPanel
              stroki={stroki}
              resheno={resheno}
              verno={verno}
              counter={<BankCounter8 total={BANK_TOTAL} />}
              onReset={() => log8.reset()}
              labels={{ ...TRENAZHER8.progress, otmena: 'Отмена' }}
            >
              {/* Списки кабинета ученика — те же, что в кабинете: ошибки,
                  отложенные, история (components/progress). */}
              <section className="trn-progress__spisok" data-section="mistakes8">
                <h4 className="stk-h4">
                  {TRENAZHER8.progress.oshibki}
                  {mistakeList.length === 0 ? '' : ` · ${mistakeList.length}`}
                </h4>
                <MistakesList
                  items={mistakeList}
                  titleOf={(m) => (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: nazvaniya[prototypeOfTask(m.task)] ?? prototypeOfTask(m.task),
                      }}
                    />
                  )}
                  action={
                    mistakeList.length === 0 ? null : (
                      <Button size="sm" onClick={startOshibki}>
                        {TRENAZHER8.rezhimy.oshibki.zag}
                      </Button>
                    )
                  }
                  empty={TRENAZHER8.progress.oshibokNet}
                />
              </section>
              <section className="trn-progress__spisok" data-section="later8">
                <h4 className="stk-h4">{TRENAZHER8.progress.otlozhennye}</h4>
                <BookmarksList
                  section="8"
                  empty={TRENAZHER8.progress.otlozhennyhNet}
                  renderTitle={(item) => bookmarkTitle8(nazvaniya, item)}
                />
              </section>
              <section className="trn-progress__spisok" data-section="history8">
                <h4 className="stk-h4">{TRENAZHER8.progress.istoriya}</h4>
                <HistoryList section="8" empty={TRENAZHER8.progress.istoriiNet} />
              </section>
            </ProgressPanel>
          </>
        }
      />
    </div>
  );
}

function Itogi8({
  data,
  actions,
  nazvaniya,
  gruppy,
  onVybor,
}: {
  data: SummaryData;
  actions: SummaryActions<Trenazher8Payload>;
  nazvaniya: Record<string, string>;
  gruppy: GruppaVybora[];
  onVybor: () => void;
}) {
  const payload = data.payload as Trenazher8Payload;
  const poGruppam = new Map<string, { verno: number; vsego: number }>();
  const zadachi: ItogZadacha[] = data.items.map((item) => {
    const prototype = taskAt8(payload, item.poolIndex)?.prototype ?? '';
    const gruppa = gruppaOfPrototype(prototype);
    if (gruppa !== undefined) {
      const row = poGruppam.get(gruppa.id) ?? { verno: 0, vsego: 0 };
      row.vsego += 1;
      row.verno += item.mark === 'right' ? 1 : 0;
      poGruppam.set(gruppa.id, row);
    }
    return {
      kindHtml: nazvaniya[prototype] ?? item.kind,
      uslovieHtml: item.html,
      mark: item.mark,
      razbor: item.review,
    };
  });
  const stroki: StrokaGruppy[] = gruppy.flatMap((g) => {
    const row = poGruppam.get(g.id);
    if (row === undefined) {
      return [];
    }
    const prosel = row.verno / row.vsego < 0.5;
    return [
      {
        id: g.id,
        nazvanie: g.nazvanie,
        znakHtml: g.znakHtml,
        ton: g.ton,
        verno: row.verno,
        vsego: row.vsego,
        ...(prosel ? { metka: TRENAZHER8.itogi.prosel } : {}),
      },
    ];
  });
  const verno = zadachi.filter((z) => z.mark === 'right').length;
  const sRazborom = zadachi.filter((z) => z.mark === 'hinted').length;
  const vsego = zadachi.length;
  const dolya = vsego === 0 ? 0 : verno / vsego;
  const srednee = vsego === 0 ? null : Math.round(data.seconds / vsego);

  function eshcheRaz() {
    const prototypes = payload.tasks.map((t) => t.prototype);
    const tasks = buildByPrototypes(prototypes, payload.tasks.length, closedTasks(log8.get()));
    if (tasks.length > 0) {
      actions.start({ tasks, control: payload.control, timer: payload.timer !== false });
    }
  }

  return (
    <div className="trn">
      <ItogiSessii
        verno={verno}
        vsego={vsego}
        stroki={stroki}
        zadachi={zadachi}
        onRabota={actions.onRetrySimilar}
        rabotaBusy={actions.building}
        onEshcheRaz={eshcheRaz}
        onVybor={onVybor}
        labels={{
          ...TRENAZHER8.itogi,
          title: TRENAZHER8.itogi.title(dolya),
          lead: TRENAZHER8.itogi.lead(data.seconds, srednee, sRazborom),
          rabota:
            actions.onRetrySimilar === undefined
              ? null
              : TRENAZHER8.itogi.rabota(actions.retryCount),
        }}
      />
    </div>
  );
}
