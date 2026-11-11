'use client';

import { clsx } from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
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
import { TIPY3_ORDER, TRENAZHER3 } from '@/content/zadanie3';
import { gruppaTipa, prototipZadachi, tipZadachi } from '@/content/zadanie3/gruppy';
import {
  closedTasks,
  distinctSolved,
  kindStats,
  mistakes as openMistakes,
  type ProgressLog,
} from '@/lib/progressLog';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import { readSession } from '@/lib/trainerSession/store';
import { activeBookmarks, bookmarks } from '@/lib/zakladki';
import { log3, vybor3, type Vybor3 } from '@/lib/zadanie3/trening/progress';
import {
  buildByTipy,
  buildMistakes3,
  isTrenazher3Payload,
  razobratKlyuch3,
  similarTrenazher3,
  skolkoZadach,
  taskAt3,
  type Istochnik3,
  type Katalog3,
  type Task3,
  type Trenazher3Payload,
} from '@/lib/zadanie3/trening/session';
import { zadachaIzKesha } from '@/lib/zadanie3/trening/zagruzka';
import { Trenazher3Screen, shagiZadachi } from './Trenazher3Screen';
import { readTrenazher3Ui, type Trenazher3Ui } from './trenazher3Ui';

export interface Trenazher3Props {
  /** Адрес вкладки: туда ведёт кнопка возврата с итогового экрана. */
  base: string;
  /** Группы и типы для выбора тем: названия набраны KaTeX, значок — фигура. */
  gruppy: GruppaVybora[];
  /** Названия типов текстом: история тренировок, закладки. */
  nazvaniyaTekst: Record<string, string>;
  /** Каталог банка: прототип → варианты (без условий и ответов). */
  katalog: Katalog3;
}

const COUNTS: (number | null)[] = [5, 10, 20, null];
/** «Без конца»: столько задач собирается за раз. */
const BEZ_KONCA = 40;
/** Задач в быстрых режимах: «вперемешку» и «работа над ошибками». */
const BYSTRO = 10;
const ISTOCHNIKI: Istochnik3[] = ['vse', 'fipi', 'new'];

/** Раздел сессии — задание целиком: ключ budetege:trainer:3:session. */
const RAZDEL = { scope: '3' } as const;

type Ekran = 'rezhimy' | 'temy';

/**
 * Вход по ссылке: одна задача из закладки (?zadacha=), «Работа над
 * ошибками» (?rezhim=oshibki) из кабинета и «Моих ошибок», один тип
 * (?tip=) с вкладки «О задании». Прежняя ссылка разборов
 * (?tipy=P03-01,P03-02) открывает тип первого прототипа.
 */
type Intent =
  { kind: 'zadacha'; id: string } | { kind: 'oshibki' } | { kind: 'tip'; tip: string } | null;

function readIntent(): Intent {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('zadacha');
  if (id !== null && razobratKlyuch3(id) !== null) return { kind: 'zadacha', id };
  if (params.get('rezhim') === 'oshibki') return { kind: 'oshibki' };
  const tip = params.get('tip');
  if (tip !== null && TIPY3_ORDER.includes(tip)) return { kind: 'tip', tip };
  const prezhnie = params.get('tipy')?.split(',')[0];
  if (prezhnie !== undefined) {
    const poPrototipu = tipZadachi(prezhnie);
    if (TIPY3_ORDER.includes(poPrototipu)) return { kind: 'tip', tip: poPrototipu };
  }
  return null;
}

/** Убрать параметры ссылки из адреса: вопрос о незавершённой тренировке не повторится. */
function clearIntent() {
  const url = new URL(window.location.href);
  ['zadacha', 'rezhim', 'tip', 'tipy'].forEach((key) => url.searchParams.delete(key));
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

/** Прототип попытки журнала → группа карты (у неизвестного — он сам). */
function gruppaPopytki(kind: string): string {
  return gruppaTipa(tipZadachi(kind))?.id ?? kind;
}

/**
 * Тренажёр задания №3: оболочка сессии вокруг стартовых режимов,
 * выбора тем, экрана задачи и итогов — на общих компонентах тренажёра
 * (components/tasks/trening), как у №8. В хранилище уходят только
 * ключи задач; условия, чертежи и закрытые ответы приезжают файлами
 * прототипов.
 */
export function Trenazher3({ base, gruppy, nazvaniyaTekst, katalog }: Trenazher3Props) {
  const nazvaniya = Object.fromEntries(
    gruppy.flatMap((g) => g.tipy.map((t) => [t.id, t.nazvanieHtml])),
  );
  const [ekran, setEkran] = useState<Ekran>('rezhimy');
  const [intent] = useState<Intent>(readIntent);
  /* Часы на панели: по выбору ученика при старте или из записи. */
  const [clock, setClock] = useState(true);

  return (
    <TrainerSessionHost<Trenazher3Payload, Trenazher3Ui>
      scope={scopeOfPath(base) ?? RAZDEL.scope}
      what="тренажёр"
      backHref={base}
      entryIntent={intent !== null}
      onEntryResolved={() => {
        clearIntent();
        if (intent?.kind === 'tip') {
          setEkran('temy');
        }
      }}
      isPayload={isTrenazher3Payload}
      count={(payload) => payload.tasks.length}
      describe={(payload, at) => {
        const task = taskAt3(payload, at);
        if (task === undefined) {
          throw new Error('Нет задания');
        }
        const zadacha = zadachaIzKesha(task.id);
        return {
          kind: nazvaniyaTekst[tipZadachi(task.id)] ?? '',
          html: zadacha?.variant.uslovieHtml ?? '',
          ...(zadacha === undefined
            ? {}
            : { review: () => <ShagiResheniya shagi={shagiZadachi(zadacha)} /> }),
        };
      }}
      /* «Прорешать те же задачи» нет: повтор той же задачи ничего не
         проверяет. «Работа над ошибками» — другие варианты тех же типов. */
      similar={(payload, indexes) => similarTrenazher3(katalog, payload, indexes)}
      /* Запись и так невелика (только ключи задач): рецепт — она сама. */
      pack={(payload) => payload}
      unpack={(packed) => {
        if (!isTrenazher3Payload(packed)) return null;
        setClock(packed.timer !== false);
        return packed;
      }}
      labels={{ clock }}
      configurator={(api) => (
        <Konfigurator3
          gruppy={gruppy}
          nazvaniya={nazvaniya}
          katalog={katalog}
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
        <Itogi3
          data={data}
          actions={actions}
          nazvaniya={nazvaniya}
          gruppy={gruppy}
          katalog={katalog}
          onVybor={() => {
            setEkran('temy');
            actions.onNew();
          }}
        />
      )}
      screen={({ payload, sessionId, restored, report, elapsed, finish, setBeforeFinish }) => (
        <div className="trn">
          <Trenazher3Screen
            payload={payload}
            katalog={katalog}
            roundKey={sessionId}
            restored={restored === null ? null : readTrenazher3Ui(restored)}
            report={report}
            elapsed={elapsed}
            onFinish={finish}
            setBeforeFinish={setBeforeFinish}
            nazvaniya={nazvaniya}
            nazvaniyaTekst={nazvaniyaTekst}
          />
        </div>
      )}
    />
  );
}

/** Строки прогресса по группам из журнала: решено, верно, «Стоит повторить». */
function strokiProgressa(
  gruppy: GruppaVybora[],
  log: ProgressLog,
): { stroki: StrokaGruppy[]; resheno: number; verno: number } {
  const stats = kindStats(log, gruppaPopytki);
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
      ...(g.znak === undefined ? {} : { znak: g.znak }),
      ton: g.ton,
      verno: s?.right ?? 0,
      vsego: s?.done ?? 0,
      ...(s?.repeat === true ? { metka: TRENAZHER3.progress.povtorit } : {}),
    };
  });
  return { stroki, resheno, verno };
}

/** Источник задач: «Все», «Открытый банк ФИПИ», «Не из банка». */
function Istochnik({
  value,
  onChange,
}: {
  value: Istochnik3;
  onChange: (value: Istochnik3) => void;
}) {
  const id = useId();
  return (
    <div>
      <p className="stk-podpis" id={id}>
        {TRENAZHER3.vybor.istochnik}
      </p>
      <div className="trn-seg" role="group" aria-labelledby={id}>
        {ISTOCHNIKI.map((item) => (
          <button
            type="button"
            key={item}
            className={clsx(value === item && 'is-on')}
            aria-pressed={value === item}
            onClick={() => onChange(item)}
          >
            {TRENAZHER3.vybor.istochniki[item]}
          </button>
        ))}
      </div>
    </div>
  );
}

function Konfigurator3({
  gruppy,
  nazvaniya,
  katalog,
  ekran,
  setEkran,
  intent,
  api,
}: {
  gruppy: GruppaVybora[];
  nazvaniya: Record<string, string>;
  katalog: Katalog3;
  ekran: Ekran;
  setEkran: (ekran: Ekran) => void;
  intent: Intent;
  api: ConfiguratorApi<Trenazher3Payload>;
}) {
  const log = log3.use();
  const { stroki, resheno, verno } = strokiProgressa(gruppy, log);
  const mistakeList = openMistakes(log, prototipZadachi);
  const otlozhennye = activeBookmarks(bookmarks.use(), '3').filter(
    (item) => item.place === 'trenazher' && razobratKlyuch3(item.ref) !== null,
  );
  /* Последний выбор живёт в хранилище браузера: на сервере — по умолчанию. */
  const vybor = vybor3.use();
  const selected = new Set(vybor.tipy.length === 0 ? TIPY3_ORDER : vybor.tipy);
  const vsegoZadach = Object.values(katalog).reduce((sum, p) => sum + p.n.length, 0);

  function zapomnit(next: Vybor3) {
    vybor3.set(next);
  }

  function start(tasks: Task3[], control = vybor.bezPodskazok, timer = vybor.timer) {
    if (tasks.length > 0) {
      api.start({ tasks, control, timer });
    }
  }

  function startOshibki() {
    start(buildMistakes3(katalog, mistakeList, BYSTRO), false);
  }

  /* Вход по ссылке — один раз: если незавершённой тренировки нет, сразу
     в задачи (иначе оболочка спросит, и выбор откроется как надо). */
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || intent === null) return;
    opened.current = true;
    if (intent.kind === 'tip') {
      vybor3.set({ ...vybor3.get(), tipy: [intent.tip] });
    }
    if (readSession(scopeOfPath(window.location.pathname) ?? RAZDEL.scope).status === 'ok') return;
    clearIntent();
    const timer = vybor3.get().timer;
    if (intent.kind === 'zadacha') {
      api.start({ tasks: [{ id: intent.id }], control: false, timer });
    } else if (intent.kind === 'tip') {
      const tasks = buildByTipy(katalog, [intent.tip], BYSTRO, closedTasks(log3.get()));
      if (tasks.length > 0) api.start({ tasks, control: false, timer });
    } else {
      const tasks = buildMistakes3(katalog, openMistakes(log3.get(), prototipZadachi), BYSTRO);
      if (tasks.length > 0) api.start({ tasks, control: false, timer });
    }
  }, [intent, api, katalog]);

  const rezhimy: Rezhim[] = [
    {
      id: 'mix',
      ikonka: 'mix',
      zag: TRENAZHER3.rezhimy.mix.zag,
      lead: TRENAZHER3.rezhimy.mix.lead(BYSTRO),
    },
    {
      id: 'temy',
      ikonka: 'temy',
      zag: TRENAZHER3.rezhimy.temy.zag,
      lead: TRENAZHER3.rezhimy.temy.lead,
    },
    {
      id: 'oshibki',
      ikonka: 'oshibki',
      zag: TRENAZHER3.rezhimy.oshibki.zag,
      lead: TRENAZHER3.rezhimy.oshibki.lead(
        new Set(mistakeList.map((m) => tipZadachi(m.task))).size,
      ),
      warm: true,
      disabled: mistakeList.length === 0,
    },
  ];

  function pick(id: string) {
    if (id === 'mix') {
      start(buildByTipy(katalog, TIPY3_ORDER, BYSTRO, closedTasks(log)), false);
    } else if (id === 'temy') {
      setEkran('temy');
    } else if (id === 'oshibki') {
      startOshibki();
    }
  }

  if (ekran === 'temy') {
    const tipy = TIPY3_ORDER.filter((id) => selected.has(id));
    const est = skolkoZadach(katalog, tipy, vybor.istochnik);
    return (
      <div className="trn">
        <VyborTem
          gruppy={gruppy}
          selected={selected}
          onSelected={(next) =>
            zapomnit({ ...vybor, tipy: next.size === TIPY3_ORDER.length ? [] : [...next] })
          }
          counts={COUNTS}
          count={vybor.count}
          onCount={(count) => zapomnit({ ...vybor, count })}
          timer={vybor.timer}
          onTimer={(timer) => zapomnit({ ...vybor, timer })}
          bezPodskazok={vybor.bezPodskazok}
          onBezPodskazok={(bezPodskazok) => zapomnit({ ...vybor, bezPodskazok })}
          onBack={() => setEkran('rezhimy')}
          onStart={() =>
            start(
              buildByTipy(
                katalog,
                tipy,
                vybor.count ?? BEZ_KONCA,
                closedTasks(log),
                vybor.istochnik,
              ),
            )
          }
          dop={
            <Istochnik
              value={vybor.istochnik}
              onChange={(istochnik) => zapomnit({ ...vybor, istochnik })}
            />
          }
          labels={{
            ...TRENAZHER3.vybor,
            itog: (n, zadach, taymer) =>
              tipy.length > 0 && est === 0
                ? TRENAZHER3.vybor.istochnikPusto
                : TRENAZHER3.vybor.itog(n, zadach, taymer),
          }}
        />
      </div>
    );
  }

  return (
    <div className="trn">
      <StartRezhimy
        title={TRENAZHER3.rezhimy.title}
        rezhimy={rezhimy}
        onPick={pick}
        dop={
          <>
            {otlozhennye.length === 0 ? null : (
              <button
                type="button"
                className="stk-btn stk-btn--tihaya trn-otlozhennye"
                onClick={() =>
                  start(
                    otlozhennye.map((item) => ({ id: item.ref })),
                    false,
                  )
                }
              >
                {TRENAZHER3.rezhimy.otlozhennye(otlozhennye.length)}
              </button>
            )}
            <ProgressPanel
              stroki={stroki}
              resheno={resheno}
              verno={verno}
              counter={
                <p className="stk-lead z3-schet">
                  {TRENAZHER3.progress.schet(
                    distinctSolved(log, (task) => razobratKlyuch3(task) !== null),
                    vsegoZadach,
                  )}
                </p>
              }
              onReset={() => log3.reset()}
              labels={TRENAZHER3.progress}
            >
              <section className="trn-progress__spisok" data-section="mistakes3">
                <h4 className="stk-h4">
                  {TRENAZHER3.progress.oshibki}
                  {mistakeList.length === 0 ? '' : ` · ${mistakeList.length}`}
                </h4>
                <MistakesList
                  items={mistakeList}
                  titleOf={(m) => (
                    <span
                      dangerouslySetInnerHTML={{ __html: nazvaniya[tipZadachi(m.task)] ?? '' }}
                    />
                  )}
                  action={
                    mistakeList.length === 0 ? null : (
                      <Button size="sm" onClick={startOshibki}>
                        {TRENAZHER3.rezhimy.oshibki.zag}
                      </Button>
                    )
                  }
                  empty={TRENAZHER3.progress.oshibokNet}
                />
              </section>
              <section className="trn-progress__spisok" data-section="later3">
                <h4 className="stk-h4">{TRENAZHER3.progress.otlozhennye}</h4>
                <BookmarksList section="3" empty={TRENAZHER3.progress.otlozhennyhNet} />
              </section>
              <section className="trn-progress__spisok" data-section="history3">
                <h4 className="stk-h4">{TRENAZHER3.progress.istoriya}</h4>
                <HistoryList section="3" empty={TRENAZHER3.progress.istoriiNet} />
              </section>
            </ProgressPanel>
          </>
        }
      />
    </div>
  );
}

function Itogi3({
  data,
  actions,
  nazvaniya,
  gruppy,
  katalog,
  onVybor,
}: {
  data: SummaryData;
  actions: SummaryActions<Trenazher3Payload>;
  nazvaniya: Record<string, string>;
  gruppy: GruppaVybora[];
  katalog: Katalog3;
  onVybor: () => void;
}) {
  const payload = data.payload as Trenazher3Payload;
  const poGruppam = new Map<string, { verno: number; vsego: number }>();
  const zadachi: ItogZadacha[] = data.items.map((item) => {
    const tip = tipZadachi(taskAt3(payload, item.poolIndex)?.id ?? '');
    const gruppa = gruppaTipa(tip);
    if (gruppa !== undefined) {
      const row = poGruppam.get(gruppa.id) ?? { verno: 0, vsego: 0 };
      row.vsego += 1;
      row.verno += item.mark === 'right' ? 1 : 0;
      poGruppam.set(gruppa.id, row);
    }
    return {
      kindHtml: nazvaniya[tip] ?? item.kind,
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
        ...(g.znak === undefined ? {} : { znak: g.znak }),
        ton: g.ton,
        verno: row.verno,
        vsego: row.vsego,
        ...(prosel ? { metka: TRENAZHER3.itogi.prosel } : {}),
      },
    ];
  });
  const verno = zadachi.filter((z) => z.mark === 'right').length;
  const sRazborom = zadachi.filter((z) => z.mark === 'hinted').length;
  const vsego = zadachi.length;
  const dolya = vsego === 0 ? 0 : verno / vsego;
  const srednee = vsego === 0 ? null : Math.round(data.seconds / vsego);

  function eshcheRaz() {
    const tipy = [...new Set(payload.tasks.map((t) => tipZadachi(t.id)))];
    const tasks = buildByTipy(katalog, tipy, payload.tasks.length, closedTasks(log3.get()));
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
          ...TRENAZHER3.itogi,
          title: TRENAZHER3.itogi.title(dolya),
          lead: TRENAZHER3.itogi.lead(data.seconds, srednee, sRazborom),
          rabota:
            actions.onRetrySimilar === undefined
              ? null
              : TRENAZHER3.itogi.rabota(actions.retryCount),
        }}
      />
    </div>
  );
}
