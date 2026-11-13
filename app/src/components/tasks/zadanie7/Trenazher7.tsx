'use client';

import { clsx } from 'clsx';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
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
import { TRENAZHER7 } from '@/content/uravneniya7';
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
import { log7, vybor7, type Vybor7 } from '@/lib/zadanie7/trening/progress';
import {
  buildByTipy7,
  buildMistakes7,
  etoKlyuch7,
  prototipyZadach,
  prototipZadachi7,
  razobratZapis7,
  isTrenazher7Payload,
  similarTrenazher7,
  skolkoZadach7,
  taskAt7,
  type Istochnik7,
  type Katalog7,
  type Task7,
  type Trenazher7Payload,
} from '@/lib/zadanie7/trening/session';
import { nabrat7, reshenieZadachi7, zadachaIzKesha7 } from '@/lib/zadanie7/trening/zagruzka';
import { schitaemSUmom, shagiIzResheniya } from './shagi7';
import { Trenazher7Screen } from './Trenazher7Screen';
import { readTrenazher7Ui, type Trenazher7Ui } from './trenazher7Ui';

export interface Trenazher7Props {
  /** Адрес вкладки: туда ведёт кнопка возврата с итогового экрана. */
  base: string;
  /** Группы и типы для выбора тем: названия набраны KaTeX на сборке. */
  gruppy: GruppaVybora[];
  /** Названия типов текстом: история тренировок, закладки. */
  nazvaniyaTekst: Record<string, string>;
  /** Каталог банка: прототип → задачи ФИПИ и аналоги (без условий и ответов). */
  katalog: Katalog7;
}

const COUNTS: (number | null)[] = [5, 10, 20, null];
/** «Без конца»: столько задач собирается за раз. */
const BEZ_KONCA = 40;
/** Задач в быстрых режимах: «вперемешку» и «работа над ошибками». */
const BYSTRO = 10;
const ISTOCHNIKI: Istochnik7[] = ['vse', 'fipi', 'new'];

/** Раздел сессии — задание целиком: ключ budetege:trainer:7:session. */
const RAZDEL = { scope: '7' } as const;

type Ekran = 'rezhimy' | 'temy';

/**
 * Вход по ссылке: одна задача из закладки (?zadacha=), «Работа над
 * ошибками» (?rezhim=oshibki) из кабинета, один тип (?tip=P11) с
 * вкладки «О задании». Прежняя ссылка из теории и разборов
 * (?tipy=P11,P12) открывает выбор тем с этими типами.
 */
type Intent =
  { kind: 'zadacha'; id: string } | { kind: 'oshibki' } | { kind: 'tipy'; tipy: string[] } | null;

function readIntent(izvestnye: ReadonlySet<string>, zadachi: ReadonlyMap<string, string>): Intent {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('zadacha');
  if (id !== null && zadachi.has(id)) return { kind: 'zadacha', id };
  if (params.get('rezhim') === 'oshibki') return { kind: 'oshibki' };
  const tipy = [params.get('tip'), ...(params.get('tipy') ?? '').split(',')].filter(
    (tip): tip is string => tip !== null && izvestnye.has(tip),
  );
  return tipy.length === 0 ? null : { kind: 'tipy', tipy: [...new Set(tipy)] };
}

/** Убрать параметры ссылки из адреса: вопрос о незавершённой тренировке не повторится. */
function clearIntent() {
  const url = new URL(window.location.href);
  ['zadacha', 'rezhim', 'tip', 'tipy'].forEach((key) => url.searchParams.delete(key));
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

/**
 * Тренажёр задания №7: оболочка сессии вокруг стартовых режимов,
 * выбора тем, экрана задачи и итогов — на общих компонентах тренажёра
 * (components/tasks/trening), как у №8 и №3. В хранилище уходят только
 * ключи задач; условия и закрытые ответы приезжают файлами прототипов,
 * разбор строит решатель в браузере.
 */
export function Trenazher7({ base, gruppy, nazvaniyaTekst, katalog }: Trenazher7Props) {
  const nazvaniya = useMemo(
    () => Object.fromEntries(gruppy.flatMap((g) => g.tipy.map((t) => [t.id, t.nazvanieHtml]))),
    [gruppy],
  );
  const tipyVse = useMemo(() => gruppy.flatMap((g) => g.tipy.map((t) => t.id)), [gruppy]);
  const poZadache = useMemo(() => prototipyZadach(katalog), [katalog]);
  const [ekran, setEkran] = useState<Ekran>('rezhimy');
  const [intent] = useState<Intent>(() => readIntent(new Set(tipyVse), poZadache));
  /* Часы на панели: по выбору ученика при старте или из записи. */
  const [clock, setClock] = useState(true);

  return (
    <TrainerSessionHost<Trenazher7Payload, Trenazher7Ui>
      scope={scopeOfPath(base) ?? RAZDEL.scope}
      what="тренажёр"
      backHref={base}
      entryIntent={intent !== null}
      onEntryResolved={() => {
        clearIntent();
        if (intent?.kind === 'tipy') {
          setEkran('temy');
        }
      }}
      isPayload={isTrenazher7Payload}
      count={(payload) => payload.tasks.length}
      describe={(payload, at) => {
        const task = taskAt7(payload, at);
        if (task === undefined) {
          throw new Error('Нет задания');
        }
        const zadacha = zadachaIzKesha7(task.id);
        return {
          kind: nazvaniyaTekst[task.p] ?? '',
          html: zadacha === undefined ? '' : nabrat7(zadacha.text),
          ...(zadacha === undefined
            ? {}
            : {
                review: () => {
                  const s = reshenieZadachi7(zadacha);
                  return s === null ? null : (
                    <ShagiResheniya shagi={shagiIzResheniya(s)} posle={schitaemSUmom(s)} />
                  );
                },
              }),
        };
      }}
      /* «Прорешать те же задачи» нет: повтор той же задачи ничего не
         проверяет. «Работа над ошибками» — другие задачи тех же типов. */
      similar={(payload, indexes) => similarTrenazher7(katalog, payload, indexes)}
      /* Запись невелика (только ключи задач): рецепт — она сама. При
         чтении понимается и запись прежнего тренажёра. */
      pack={(payload) => payload}
      unpack={(packed) => {
        const payload = razobratZapis7(packed);
        if (payload !== null) {
          setClock(payload.timer !== false);
        }
        return payload;
      }}
      labels={{ clock }}
      configurator={(api) => (
        <Konfigurator7
          gruppy={gruppy}
          tipyVse={tipyVse}
          nazvaniya={nazvaniya}
          katalog={katalog}
          poZadache={poZadache}
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
        <Itogi7
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
          <Trenazher7Screen
            payload={payload}
            katalog={katalog}
            roundKey={sessionId}
            restored={restored === null ? null : readTrenazher7Ui(restored)}
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

/** Прототип → группа. */
function gruppyTipov(gruppy: GruppaVybora[]): Map<string, string> {
  return new Map(gruppy.flatMap((g) => g.tipy.map((t) => [t.id, g.id] as const)));
}

/** Строки прогресса по группам из журнала: решено, верно, «Стоит повторить». */
function strokiProgressa(
  gruppy: GruppaVybora[],
  log: ProgressLog,
): { stroki: StrokaGruppy[]; resheno: number; verno: number } {
  const groupOf = gruppyTipov(gruppy);
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
      ...(s?.repeat === true ? { metka: TRENAZHER7.progress.povtorit } : {}),
    };
  });
  return { stroki, resheno, verno };
}

/** Источник задач: «Все», «Из банка ФИПИ», «Не из банка». */
function Istochnik({
  value,
  onChange,
}: {
  value: Istochnik7;
  onChange: (value: Istochnik7) => void;
}) {
  const id = useId();
  return (
    <div>
      <p className="stk-podpis" id={id}>
        {TRENAZHER7.vybor.istochnik}
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
            {TRENAZHER7.vybor.istochniki[item]}
          </button>
        ))}
      </div>
    </div>
  );
}

function Konfigurator7({
  gruppy,
  tipyVse,
  nazvaniya,
  katalog,
  poZadache,
  ekran,
  setEkran,
  intent,
  api,
}: {
  gruppy: GruppaVybora[];
  tipyVse: string[];
  nazvaniya: Record<string, string>;
  katalog: Katalog7;
  poZadache: ReadonlyMap<string, string>;
  ekran: Ekran;
  setEkran: (ekran: Ekran) => void;
  intent: Intent;
  api: ConfiguratorApi<Trenazher7Payload>;
}) {
  const log = log7.use();
  const { stroki, resheno, verno } = strokiProgressa(gruppy, log);
  const prototipOf = (task: string) => prototipZadachi7(task, poZadache);
  const mistakeList = openMistakes(log, prototipOf);
  const otlozhennye = activeBookmarks(bookmarks.use(), '7').filter(
    (item) => item.place === 'trenazher' && poZadache.has(item.ref),
  );
  /* Последний выбор живёт в хранилище браузера: на сервере — по умолчанию. */
  const vybor = vybor7.use();
  const selected = new Set(vybor.tipy.length === 0 ? tipyVse : vybor.tipy);
  const vsegoZadach = poZadache.size;

  function zapomnit(next: Vybor7) {
    vybor7.set(next);
  }

  function start(tasks: Task7[], control = vybor.bezPodskazok, timer = vybor.timer) {
    if (tasks.length > 0) {
      api.start({ tasks, control, timer });
    }
  }

  function startOshibki() {
    start(buildMistakes7(katalog, mistakeList, BYSTRO), false);
  }

  /* Вход по ссылке — один раз: если незавершённой тренировки нет, сразу
     в задачи (иначе оболочка спросит, и выбор откроется как надо). */
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || intent === null) return;
    opened.current = true;
    if (intent.kind === 'tipy') {
      vybor7.set({ ...vybor7.get(), tipy: intent.tipy });
    }
    if (readSession(scopeOfPath(window.location.pathname) ?? RAZDEL.scope).status === 'ok') return;
    clearIntent();
    const timer = vybor7.get().timer;
    if (intent.kind === 'zadacha') {
      const p = poZadache.get(intent.id);
      if (p !== undefined) {
        api.start({ tasks: [{ id: intent.id, p }], control: false, timer });
      }
    } else if (intent.kind === 'tipy') {
      const tasks = buildByTipy7(katalog, intent.tipy, BYSTRO, closedTasks(log7.get()));
      if (tasks.length > 0) api.start({ tasks, control: false, timer });
    } else {
      const tasks = buildMistakes7(
        katalog,
        openMistakes(log7.get(), (task) => prototipZadachi7(task, poZadache)),
        BYSTRO,
      );
      if (tasks.length > 0) api.start({ tasks, control: false, timer });
    }
  }, [intent, api, katalog, poZadache]);

  const rezhimy: Rezhim[] = [
    {
      id: 'mix',
      ikonka: 'mix',
      zag: TRENAZHER7.rezhimy.mix.zag,
      lead: TRENAZHER7.rezhimy.mix.lead(BYSTRO),
    },
    {
      id: 'temy',
      ikonka: 'temy',
      zag: TRENAZHER7.rezhimy.temy.zag,
      lead: TRENAZHER7.rezhimy.temy.lead,
    },
    {
      id: 'oshibki',
      ikonka: 'oshibki',
      zag: TRENAZHER7.rezhimy.oshibki.zag,
      lead: TRENAZHER7.rezhimy.oshibki.lead(new Set(mistakeList.map((m) => m.kind)).size),
      warm: true,
      disabled: mistakeList.length === 0,
    },
  ];

  function pick(id: string) {
    if (id === 'mix') {
      start(buildByTipy7(katalog, tipyVse, BYSTRO, closedTasks(log)), false);
    } else if (id === 'temy') {
      setEkran('temy');
    } else if (id === 'oshibki') {
      startOshibki();
    }
  }

  if (ekran === 'temy') {
    const tipy = tipyVse.filter((id) => selected.has(id));
    const est = skolkoZadach7(katalog, tipy, vybor.istochnik);
    return (
      <div className="trn">
        <VyborTem
          gruppy={gruppy}
          selected={selected}
          onSelected={(next) =>
            zapomnit({ ...vybor, tipy: next.size === tipyVse.length ? [] : [...next] })
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
              buildByTipy7(
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
            ...TRENAZHER7.vybor,
            itog: (n, skolko, taymer) =>
              tipy.length > 0 && est === 0
                ? TRENAZHER7.vybor.istochnikPusto
                : TRENAZHER7.vybor.itog(n, tipyVse.length, skolko, taymer),
          }}
        />
      </div>
    );
  }

  return (
    <div className="trn">
      <StartRezhimy
        title={TRENAZHER7.rezhimy.title}
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
                    otlozhennye.flatMap((item) => {
                      const p = poZadache.get(item.ref);
                      return p === undefined ? [] : [{ id: item.ref, p }];
                    }),
                    false,
                  )
                }
              >
                {TRENAZHER7.rezhimy.otlozhennye(otlozhennye.length)}
              </button>
            )}
            <ProgressPanel
              stroki={stroki}
              resheno={resheno}
              verno={verno}
              counter={
                <p className="stk-lead trn-schet">
                  {TRENAZHER7.progress.schet(
                    distinctSolved(log, (task) => etoKlyuch7(task)),
                    vsegoZadach,
                  )}
                </p>
              }
              onReset={() => log7.reset()}
              labels={TRENAZHER7.progress}
            >
              <section className="trn-progress__spisok" data-section="mistakes7">
                <h4 className="stk-h4">
                  {TRENAZHER7.progress.oshibki}
                  {mistakeList.length === 0 ? '' : ` · ${mistakeList.length}`}
                </h4>
                <MistakesList
                  items={mistakeList}
                  titleOf={(m) => (
                    <span dangerouslySetInnerHTML={{ __html: nazvaniya[m.kind] ?? '' }} />
                  )}
                  action={
                    mistakeList.length === 0 ? null : (
                      <Button size="sm" onClick={startOshibki}>
                        {TRENAZHER7.rezhimy.oshibki.zag}
                      </Button>
                    )
                  }
                  empty={TRENAZHER7.progress.oshibokNet}
                />
              </section>
              <section className="trn-progress__spisok" data-section="later7">
                <h4 className="stk-h4">{TRENAZHER7.progress.otlozhennye}</h4>
                <BookmarksList section="7" empty={TRENAZHER7.progress.otlozhennyhNet} />
              </section>
              <section className="trn-progress__spisok" data-section="history7">
                <h4 className="stk-h4">{TRENAZHER7.progress.istoriya}</h4>
                <HistoryList section="7" empty={TRENAZHER7.progress.istoriiNet} />
              </section>
            </ProgressPanel>
          </>
        }
      />
    </div>
  );
}

function Itogi7({
  data,
  actions,
  nazvaniya,
  gruppy,
  katalog,
  onVybor,
}: {
  data: SummaryData;
  actions: SummaryActions<Trenazher7Payload>;
  nazvaniya: Record<string, string>;
  gruppy: GruppaVybora[];
  katalog: Katalog7;
  onVybor: () => void;
}) {
  const payload = data.payload as Trenazher7Payload;
  const groupOf = gruppyTipov(gruppy);
  const poGruppam = new Map<string, { verno: number; vsego: number }>();
  const zadachi: ItogZadacha[] = data.items.map((item) => {
    const tip = taskAt7(payload, item.poolIndex)?.p ?? '';
    const gruppa = groupOf.get(tip);
    if (gruppa !== undefined) {
      const row = poGruppam.get(gruppa) ?? { verno: 0, vsego: 0 };
      row.vsego += 1;
      row.verno += item.mark === 'right' ? 1 : 0;
      poGruppam.set(gruppa, row);
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
        ton: g.ton,
        verno: row.verno,
        vsego: row.vsego,
        ...(prosel ? { metka: TRENAZHER7.itogi.prosel } : {}),
      },
    ];
  });
  const verno = zadachi.filter((z) => z.mark === 'right').length;
  const sRazborom = zadachi.filter((z) => z.mark === 'hinted').length;
  const vsego = zadachi.length;
  const dolya = vsego === 0 ? 0 : verno / vsego;
  const srednee = vsego === 0 ? null : Math.round(data.seconds / vsego);

  function eshcheRaz() {
    const tipy = [...new Set(payload.tasks.map((t) => t.p))];
    const tasks = buildByTipy7(katalog, tipy, payload.tasks.length, closedTasks(log7.get()));
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
          ...TRENAZHER7.itogi,
          title: TRENAZHER7.itogi.title(dolya),
          lead: TRENAZHER7.itogi.lead(data.seconds, srednee, sRazborom),
          rabota:
            actions.onRetrySimilar === undefined
              ? null
              : TRENAZHER7.itogi.rabota(actions.retryCount),
        }}
      />
    </div>
  );
}
