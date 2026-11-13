'use client';

import { clsx } from 'clsx';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { BookmarksList, HistoryList, MistakesList } from '@/components/progress/Lists';
import { TrainerSessionHost, type ConfiguratorApi, type SummaryActions } from '../../session';
import type { SummaryData } from '../../session/TrainerSummary';
import { ShagiResheniya } from '../../steklo';
import { ItogiSessii, type ItogZadacha } from '../ItogiSessii';
import { ProgressPanel } from '../ProgressPanel';
import { StartRezhimy, type Rezhim } from '../StartRezhimy';
import { VyborTem } from '../VyborTem';
import type { GruppaVybora, StrokaGruppy } from '../types';
import {
  closedTasks,
  distinctSolved,
  kindStats,
  mistakes as openMistakes,
  type ProgressLog,
} from '@/lib/progressLog';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import { readSession } from '@/lib/trainerSession/store';
import {
  buildByTipy,
  buildMistakes,
  isPayloadBanka,
  prototipyZadach,
  prototipZadachi,
  razobratZapis,
  similarBanka,
  skolkoZadach,
  taskAt,
  type IstochnikBanka,
  type KatalogBanka,
  type PayloadBanka,
  type StilBanka,
  type TaskBanka,
} from '@/lib/trening/bank';
import type { VyborBanka } from '@/lib/trening/vybor';
import { activeBookmarks, bookmarks } from '@/lib/zakladki';
import { EkranBanka } from './EkranBanka';
import type { RazdelBanka, ZadachaBanka } from './types';
import { readUiBanka, type UiBanka } from './ui';
/* Компоненты тренажёра берутся из своих файлов, а стили лежат при
   общем входе (trening/index.ts) — подключаем их здесь явно. */
import '../trening.css';

export interface TrenazherBankaProps<Z extends ZadachaBanka, S> {
  razdel: RazdelBanka<Z, S>;
  /** Адрес вкладки: туда ведёт кнопка возврата с итогового экрана. */
  base: string;
  /** Группы и типы для выбора тем: названия набраны KaTeX на сборке. */
  gruppy: GruppaVybora[];
  /** Названия типов текстом: история тренировок, закладки. */
  nazvaniyaTekst: Record<string, string>;
  /** Каталог банка: прототип → ключи задач (без условий и ответов). */
  katalog: KatalogBanka;
}

const COUNTS: (number | null)[] = [5, 10, 20, null];
/** «Без конца»: столько задач собирается за раз. */
const BEZ_KONCA = 40;
/** Задач в быстрых режимах: «вперемешку» и «работа над ошибками». */
const BYSTRO = 10;
const ISTOCHNIKI: IstochnikBanka[] = ['vse', 'fipi', 'new'];
const STILI: StilBanka[] = ['vse', 'syuzhet', 'standart'];

type Ekran = 'rezhimy' | 'temy';

/**
 * Вход по ссылке: одна задача из закладки (?zadacha=), «Работа над
 * ошибками» (?rezhim=oshibki) из кабинета, один тип (?tip=P11) с
 * вкладки «О задании». Прежняя ссылка из теории и разборов
 * (?tipy=P11,P12) открывает выбор тем с этими типами.
 */
type Intent =
  { kind: 'zadacha'; id: string } | { kind: 'oshibki' } | { kind: 'tipy'; tipy: string[] } | null;

function readIntent(
  izvestnye: ReadonlySet<string>,
  zadachi: ReadonlyMap<string, string>,
  gruppy: readonly GruppaVybora[],
): Intent {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('zadacha');
  if (id !== null && zadachi.has(id)) return { kind: 'zadacha', id };
  if (params.get('rezhim') === 'oshibki') return { kind: 'oshibki' };
  /* Группа в ссылке — все её типы: «?t=A» урока репетитора №13 (прежний
     тренажёр с фильтрами звал так схему). */
  const tipyGrupp = new Map(gruppy.map((g) => [g.id, g.tipy.map((t) => t.id)]));
  const tipy = [
    params.get('tip'),
    ...(params.get('tipy') ?? '').split(','),
    ...(params.get('t') ?? '').split(','),
  ].flatMap((tip) => (tip === null ? [] : izvestnye.has(tip) ? [tip] : (tipyGrupp.get(tip) ?? [])));
  return tipy.length === 0 ? null : { kind: 'tipy', tipy: [...new Set(tipy)] };
}

/** Убрать параметры ссылки из адреса: вопрос о незавершённой тренировке не повторится. */
function clearIntent() {
  const url = new URL(window.location.href);
  ['zadacha', 'rezhim', 'tip', 'tipy', 't'].forEach((key) => url.searchParams.delete(key));
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

/**
 * Тренажёр по банку задач раздела (№7, №6 …): оболочка сессии вокруг
 * стартовых режимов, выбора тем, экрана задачи и итогов — на общих
 * компонентах тренажёра, как у №8 и №3. В хранилище уходят только ключи
 * задач; условия и закрытые ответы приезжают файлами прототипов, разбор
 * строит решатель в браузере. Чем разделы различаются — в `razdel`.
 */
export function TrenazherBanka<Z extends ZadachaBanka, S>({
  razdel,
  base,
  gruppy,
  nazvaniyaTekst,
  katalog,
}: TrenazherBankaProps<Z, S>) {
  const nazvaniya = useMemo(
    () => Object.fromEntries(gruppy.flatMap((g) => g.tipy.map((t) => [t.id, t.nazvanieHtml]))),
    [gruppy],
  );
  const tipyVse = useMemo(() => gruppy.flatMap((g) => g.tipy.map((t) => t.id)), [gruppy]);
  const poZadache = useMemo(() => prototipyZadach(katalog), [katalog]);
  const [ekran, setEkran] = useState<Ekran>('rezhimy');
  const [intent] = useState<Intent>(() => readIntent(new Set(tipyVse), poZadache, gruppy));
  /* Часы на панели: по выбору ученика при старте или из записи. */
  const [clock, setClock] = useState(true);

  return (
    <TrainerSessionHost<PayloadBanka, UiBanka>
      scope={scopeOfPath(base) ?? razdel.razdel}
      what="тренажёр"
      backHref={base}
      entryIntent={intent !== null}
      onEntryResolved={() => {
        clearIntent();
        if (intent?.kind === 'tipy') {
          setEkran('temy');
        }
      }}
      isPayload={(value): value is PayloadBanka => isPayloadBanka(value, razdel.klyuch)}
      count={(payload) => payload.tasks.length}
      describe={(payload, at) => {
        const task = taskAt(payload, at);
        if (task === undefined) {
          throw new Error('Нет задания');
        }
        const zadacha = razdel.zagruzka.izKesha(task.id);
        return {
          kind: nazvaniyaTekst[task.p] ?? '',
          html: zadacha === undefined ? '' : razdel.zagruzka.nabrat(zadacha.text),
          ...(zadacha === undefined
            ? {}
            : {
                review: () => {
                  const s = razdel.zagruzka.reshenie(zadacha);
                  return s === null ? null : (
                    <ShagiResheniya
                      shagi={razdel.shagi(s, payload.rezhim)}
                      posle={
                        razdel.posle === undefined ? undefined : razdel.posle(s, payload.rezhim)
                      }
                    />
                  );
                },
              }),
        };
      }}
      /* «Прорешать те же задачи» нет: повтор той же задачи ничего не
         проверяет. «Работа над ошибками» — другие задачи тех же типов. */
      similar={(payload, indexes) => similarBanka(katalog, payload, indexes)}
      /* Запись невелика (только ключи задач): рецепт — она сама. При
         чтении понимается и запись прежнего тренажёра раздела. */
      pack={(payload) => payload}
      unpack={(packed) => {
        const payload =
          razobratZapis(packed, razdel.klyuch) ?? razdel.prezhnyayaZapis?.(packed) ?? null;
        if (payload !== null) {
          setClock(payload.timer !== false);
        }
        return payload;
      }}
      labels={{ clock }}
      configurator={(api) => (
        <Konfigurator
          razdel={razdel}
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
        <Itogi
          razdel={razdel}
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
          <EkranBanka
            razdel={razdel}
            payload={payload}
            katalog={katalog}
            roundKey={sessionId}
            restored={restored === null ? null : readUiBanka(restored)}
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
  povtorit: string,
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
      ...(s?.repeat === true ? { metka: povtorit } : {}),
    };
  });
  return { stroki, resheno, verno };
}

/** Переключатель-сегмент: источник задач или формулировка. */
function Segment<V extends string>({
  title,
  values,
  labels,
  value,
  onChange,
}: {
  title: string;
  values: V[];
  labels: Record<V, string>;
  value: V;
  onChange: (value: V) => void;
}) {
  const id = useId();
  return (
    <div>
      <p className="stk-podpis" id={id}>
        {title}
      </p>
      <div className="trn-seg" role="group" aria-labelledby={id}>
        {values.map((item) => (
          <button
            type="button"
            key={item}
            className={clsx(value === item && 'is-on')}
            aria-pressed={value === item}
            onClick={() => onChange(item)}
          >
            {labels[item]}
          </button>
        ))}
      </div>
    </div>
  );
}

function Konfigurator<Z extends ZadachaBanka, S>({
  razdel,
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
  razdel: RazdelBanka<Z, S>;
  gruppy: GruppaVybora[];
  tipyVse: string[];
  nazvaniya: Record<string, string>;
  katalog: KatalogBanka;
  poZadache: ReadonlyMap<string, string>;
  ekran: Ekran;
  setEkran: (ekran: Ekran) => void;
  intent: Intent;
  api: ConfiguratorApi<PayloadBanka>;
}) {
  const { T, log: logStore, vybor: vyborStore } = razdel;
  const log = logStore.use();
  const { stroki, resheno, verno } = strokiProgressa(gruppy, log, T.progress.povtorit);
  const prototipOf = (task: string) => prototipZadachi(task, poZadache);
  const mistakeList = openMistakes(log, prototipOf);
  const otlozhennye = activeBookmarks(bookmarks.use(), razdel.razdel).filter(
    (item) => item.place === 'trenazher' && poZadache.has(item.ref),
  );
  /* Последний выбор живёт в хранилище браузера: на сервере — по умолчанию. */
  const vybor = vyborStore.use();
  const selected = new Set(vybor.tipy.length === 0 ? tipyVse : vybor.tipy);
  const stil: StilBanka = razdel.stil === true ? vybor.stil : 'vse';

  function zapomnit(next: VyborBanka) {
    vyborStore.set(next);
  }

  function start(
    tasks: TaskBanka[],
    control = vybor.bezPodskazok,
    timer = vybor.timer,
    rezhim?: string,
  ) {
    if (tasks.length > 0) {
      api.start({ tasks, control, timer, ...(rezhim === undefined ? {} : { rezhim }) });
    }
  }

  function startOshibki() {
    start(buildMistakes(katalog, mistakeList, BYSTRO), false);
  }

  /* Вход по ссылке — один раз: если незавершённой тренировки нет, сразу
     в задачи (иначе оболочка спросит, и выбор откроется как надо). */
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || intent === null) return;
    opened.current = true;
    if (intent.kind === 'tipy') {
      vyborStore.set({ ...vyborStore.get(), tipy: intent.tipy });
    }
    if (readSession(scopeOfPath(window.location.pathname) ?? razdel.razdel).status === 'ok') {
      return;
    }
    clearIntent();
    const timer = vyborStore.get().timer;
    if (intent.kind === 'zadacha') {
      const p = poZadache.get(intent.id);
      if (p !== undefined) {
        api.start({ tasks: [{ id: intent.id, p }], control: false, timer });
      }
    } else if (intent.kind === 'tipy') {
      const tasks = buildByTipy(katalog, intent.tipy, BYSTRO, closedTasks(logStore.get()));
      if (tasks.length > 0) api.start({ tasks, control: false, timer });
    } else {
      const tasks = buildMistakes(
        katalog,
        openMistakes(logStore.get(), (task) => prototipZadachi(task, poZadache)),
        BYSTRO,
      );
      if (tasks.length > 0) api.start({ tasks, control: false, timer });
    }
  }, [intent, api, katalog, poZadache, logStore, vyborStore, razdel.razdel]);

  const rezhimy: Rezhim[] = [
    { id: 'mix', ikonka: 'mix', zag: T.rezhimy.mix.zag, lead: T.rezhimy.mix.lead(BYSTRO) },
    { id: 'temy', ikonka: 'temy', zag: T.rezhimy.temy.zag, lead: T.rezhimy.temy.lead },
    {
      id: 'oshibki',
      ikonka: 'oshibki',
      zag: T.rezhimy.oshibki.zag,
      lead: T.rezhimy.oshibki.lead(new Set(mistakeList.map((m) => m.kind)).size),
      warm: true,
      disabled: mistakeList.length === 0,
    },
    ...(razdel.dopRezhim === undefined
      ? []
      : [
          {
            id: razdel.dopRezhim.id,
            ikonka: razdel.dopRezhim.ikonka,
            zag: razdel.dopRezhim.zag,
            lead: razdel.dopRezhim.lead(BYSTRO),
          },
        ]),
  ];

  function pick(id: string) {
    if (id === 'mix') {
      start(buildByTipy(katalog, tipyVse, BYSTRO, closedTasks(log)), false);
    } else if (id === 'temy') {
      setEkran('temy');
    } else if (id === 'oshibki') {
      startOshibki();
    } else if (razdel.dopRezhim !== undefined && id === razdel.dopRezhim.id) {
      /* Особый режим (№13 «Определи тип»): все типы вперемешку, с подсказками. */
      start(buildByTipy(katalog, tipyVse, BYSTRO, new Set()), false, vybor.timer, id);
    }
  }

  if (ekran === 'temy') {
    const tipy = tipyVse.filter((id) => selected.has(id));
    /* У раздела без источника (№2: все задачи — генератор) — всегда «все». */
    const istochnik = razdel.bezIstochnika === true ? 'vse' : vybor.istochnik;
    const est = skolkoZadach(katalog, tipy, istochnik, stil);
    const stili = T.vybor.stili;
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
              buildByTipy(
                katalog,
                tipy,
                vybor.count ?? BEZ_KONCA,
                closedTasks(log),
                istochnik,
                Math.random,
                stil,
              ),
            )
          }
          dop={
            <>
              {razdel.bezIstochnika === true ? null : (
                <Segment
                  title={T.vybor.istochnik}
                  values={ISTOCHNIKI}
                  labels={T.vybor.istochniki}
                  value={vybor.istochnik}
                  onChange={(next) => zapomnit({ ...vybor, istochnik: next })}
                />
              )}
              {razdel.stil === true && stili !== undefined ? (
                <Segment
                  title={T.vybor.stil ?? ''}
                  values={STILI}
                  labels={stili}
                  value={vybor.stil}
                  onChange={(next) => zapomnit({ ...vybor, stil: next })}
                />
              ) : null}
            </>
          }
          labels={{
            ...T.vybor,
            itog: (n, skolko, taymer) =>
              tipy.length > 0 && est === 0
                ? T.vybor.istochnikPusto
                : T.vybor.itog(n, tipyVse.length, skolko, taymer),
          }}
        />
      </div>
    );
  }

  return (
    <div className="trn">
      <StartRezhimy
        title={T.rezhimy.title}
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
                {T.rezhimy.otlozhennye(otlozhennye.length)}
              </button>
            )}
            <ProgressPanel
              stroki={stroki}
              resheno={resheno}
              verno={verno}
              counter={
                <p className="stk-lead trn-schet">
                  {T.progress.schet(
                    distinctSolved(log, (task) => razdel.klyuch.test(task)),
                    poZadache.size,
                  )}
                </p>
              }
              onReset={() => logStore.reset()}
              labels={T.progress}
            >
              <section className="trn-progress__spisok" data-section={`mistakes${razdel.razdel}`}>
                <h4 className="stk-h4">
                  {T.progress.oshibki}
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
                        {T.rezhimy.oshibki.zag}
                      </Button>
                    )
                  }
                  empty={T.progress.oshibokNet}
                />
              </section>
              <section className="trn-progress__spisok" data-section={`later${razdel.razdel}`}>
                <h4 className="stk-h4">{T.progress.otlozhennye}</h4>
                <BookmarksList section={razdel.razdel} empty={T.progress.otlozhennyhNet} />
              </section>
              <section className="trn-progress__spisok" data-section={`history${razdel.razdel}`}>
                <h4 className="stk-h4">{T.progress.istoriya}</h4>
                <HistoryList section={razdel.razdel} empty={T.progress.istoriiNet} />
              </section>
            </ProgressPanel>
          </>
        }
      />
    </div>
  );
}

function Itogi<Z extends ZadachaBanka, S>({
  razdel,
  data,
  actions,
  nazvaniya,
  gruppy,
  katalog,
  onVybor,
}: {
  razdel: RazdelBanka<Z, S>;
  data: SummaryData;
  actions: SummaryActions<PayloadBanka>;
  nazvaniya: Record<string, string>;
  gruppy: GruppaVybora[];
  katalog: KatalogBanka;
  onVybor: () => void;
}) {
  const { T } = razdel;
  const payload = data.payload as PayloadBanka;
  const groupOf = gruppyTipov(gruppy);
  const poGruppam = new Map<string, { verno: number; vsego: number }>();
  const zadachi: ItogZadacha[] = data.items.map((item) => {
    const tip = taskAt(payload, item.poolIndex)?.p ?? '';
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
        ...(prosel ? { metka: T.itogi.prosel } : {}),
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
    const tasks = buildByTipy(katalog, tipy, payload.tasks.length, closedTasks(razdel.log.get()));
    if (tasks.length > 0) {
      actions.start({
        tasks,
        control: payload.control,
        timer: payload.timer !== false,
        ...(payload.rezhim === undefined ? {} : { rezhim: payload.rezhim }),
      });
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
          ...T.itogi,
          title: T.itogi.title(dolya),
          lead: T.itogi.lead(data.seconds, srednee, sRazborom),
          rabota: actions.onRetrySimilar === undefined ? null : T.itogi.rabota(actions.retryCount),
        }}
      />
    </div>
  );
}
