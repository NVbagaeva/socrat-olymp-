'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { BookmarksList, HistoryList, MistakesList } from '@/components/progress/Lists';
import { TrainerSessionHost, type ConfiguratorApi, type SummaryActions } from '../../session';
import type { SummaryData } from '../../session/TrainerSummary';
import { ItogiSessii, type ItogZadacha } from '../../trening/ItogiSessii';
import { ProgressPanel } from '../../trening/ProgressPanel';
import { StartRezhimy, type Rezhim } from '../../trening/StartRezhimy';
import { VyborTem } from '../../trening/VyborTem';
import type { GruppaVybora, StrokaGruppy } from '../../trening/types';
import { Polosa } from '../../steklo';
import {
  closedTasks,
  distinctSolved,
  kindStats,
  mistakes as openMistakes,
  type Mistake,
  type ProgressLog,
} from '@/lib/progressLog';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import { readSession } from '@/lib/trainerSession/store';
import {
  analogOf,
  buildByTipy,
  prototipyZadach,
  skolkoZadach,
  type IstochnikBanka,
  type KatalogBanka,
} from '@/lib/trening/bank';
import type { VyborBanka } from '@/lib/trening/vybor';
import type { Pool, UznayPool } from '@/lib/veroyatnost/pool';
import { sobratPodhod } from '@/lib/veroyatnost/useRound';
import type { Zadanie45 } from '@/lib/veroyatnost/trening/links';
import { SESSIYA45, log45, uznay45, vybor45 } from '@/lib/veroyatnost/trening/progress';
import { activeBookmarks, bookmarks } from '@/lib/zakladki';
import { tekstyTrenazhera45 } from '@/content/veroyatnost45';
import { sealMetod } from '@/lib/veroyatnost/secret';
import {
  isSessiyaPayload,
  pohozhieZadachi,
  raspakovat,
  upakovat,
  zadachaBanka,
  type SessiyaPayload,
  type SessiyaZadacha,
} from '../sessiyaPayload';
import { Ekran45, zadachaNa } from './Ekran45';
import { EkranUznay45 } from './EkranUznay45';
import { RazborItog45, UznayItog45 } from './RazborItog45';
import { readUi45, type Ui45 } from './ui45';
/* Компоненты тренажёра берутся из своих файлов, а стили лежат при
   общем входе (trening/index.ts) — подключаем их здесь явно. */
import '../../trening/trening.css';
import './trening45.css';

export interface Trenazher45Props {
  zadanie: Zadanie45;
  /** Адрес вкладки: туда ведёт кнопка возврата с итогового экрана. */
  base: string;
  /** Банк страницы без разборов (pool.ts, bezRazborov). */
  pool: Pool;
  versiyaRazborov: string;
  /** Задачи «Узнай метод»: условия и отпечатки методов. */
  uznay: UznayPool;
  /** Группы — методы, типы — прототипы; названия набраны на сборке. */
  gruppy: GruppaVybora[];
  /** Названия типов текстом: история тренировок, закладки. */
  nazvaniyaTekst: Record<string, string>;
  katalog: KatalogBanka;
  /**
   * Вход по прежнему адресу режима (/trenazher/{метод}/, /mixed/,
   * /uznay-metod/): метод — выбор тем с его типами, «вперемешку» и
   * «Узнай метод» — сразу тренировка.
   */
  preset?: { metod: string } | { rezhim: 'mix' | 'uznay' } | null;
}

const COUNTS: (number | null)[] = [5, 10, 20, null];
/** «Без конца»: столько задач собирается за раз. */
const BEZ_KONCA = 40;
/** Задач в быстрых режимах: «вперемешку», «Работа над ошибками», «Узнай метод». */
const BYSTRO = 10;
const ISTOCHNIKI: IstochnikBanka[] = ['vse', 'fipi', 'new'];
const ANALOGOV_NA_OSHIBKU = 2;

type Ekran = 'rezhimy' | 'temy';

type Intent =
  | { kind: 'zadacha'; id: string }
  | { kind: 'oshibki' }
  | { kind: 'tipy'; tipy: string[]; start: boolean }
  | { kind: 'mix' }
  | { kind: 'uznay' }
  | null;

/**
 * Вход по ссылке: одна задача из закладки (?zadacha=p4-07:3), «Работа над
 * ошибками» из кабинета (?rezhim=oshibki), один тип с вкладки «О задании»
 * (?tip=p4-07), прежний адрес режима (preset).
 */
function readIntent(
  izvestnye: ReadonlySet<string>,
  zadachi: ReadonlyMap<string, string>,
  preset: Trenazher45Props['preset'],
  gruppy: GruppaVybora[],
): Intent {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('zadacha');
  if (id !== null && zadachi.has(id)) return { kind: 'zadacha', id };
  if (params.get('rezhim') === 'oshibki') return { kind: 'oshibki' };
  const tipy = [params.get('tip'), ...(params.get('tipy') ?? '').split(',')].filter(
    (tip): tip is string => tip !== null && izvestnye.has(tip),
  );
  if (tipy.length > 0) return { kind: 'tipy', tipy: [...new Set(tipy)], start: true };
  if (preset === null || preset === undefined) return null;
  if ('rezhim' in preset) return { kind: preset.rezhim };
  const g = gruppy.find((x) => x.id === preset.metod);
  return g === undefined ? null : { kind: 'tipy', tipy: g.tipy.map((t) => t.id), start: false };
}

function clearIntent() {
  const url = new URL(window.location.href);
  ['zadacha', 'rezhim', 'tip', 'tipy'].forEach((key) => url.searchParams.delete(key));
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

/** Ключ «прототип:вариант» → задача банка страницы. */
function izKlyucha(
  id: string,
  rezhim: SessiyaPayload['rezhim'],
  pool: Pool,
  uznay: UznayPool,
): SessiyaZadacha | null {
  const at = id.lastIndexOf(':');
  const n = Number(id.slice(at + 1));
  return at <= 0 || !Number.isInteger(n)
    ? null
    : zadachaBanka(id.slice(0, at), n, rezhim, pool, uznay);
}

/**
 * Тренажёр заданий №4 и №5 в «Стеклянной сцене» — оркестратор раздела
 * поверх общих компонентов тренажёра (StartRezhimy, VyborTem,
 * EkranZadachi, ItogiSessii, ProgressPanel), как у №8 и №3.
 *
 * Общий тренажёр по банку (trening/bank) сюда не подошёл: у №4 и №5
 * условия едут банком страницы, разборы — закрытыми файлами прототипов
 * (не решателем), прогресс считается по методам, а четвёртый режим
 * «Узнай метод» — свой экран без поля ответа. Сборка тренировок,
 * «Похожая задача» и источник задач — общие (lib/trening/bank.ts).
 *
 * Запись тренировки — прежняя (sessiyaPayload.ts: ссылки на банк
 * страницы с контрольной подписью), так что незаконченная тренировка
 * прежнего тренажёра открывается на той же задаче. Режимы записи те же:
 * «Выбрать методы» — practice, «вперемешку» — mixed, «Работа над
 * ошибками» — mistakes, «Узнай метод» — uznay; «Без подсказок и
 * решений» — podskazki: false.
 */
export function Trenazher45({
  zadanie,
  base,
  pool,
  versiyaRazborov,
  uznay,
  gruppy,
  nazvaniyaTekst,
  katalog,
  preset = null,
}: Trenazher45Props) {
  const T = useMemo(() => tekstyTrenazhera45(zadanie), [zadanie]);
  const nazvaniyaMetodov = useMemo(
    () => Object.fromEntries(gruppy.map((g) => [g.id, g.nazvanie])),
    [gruppy],
  );
  const nazvaniya = useMemo(
    () => Object.fromEntries(gruppy.flatMap((g) => g.tipy.map((t) => [t.id, t.nazvanieHtml]))),
    [gruppy],
  );
  const tipyVse = useMemo(() => gruppy.flatMap((g) => g.tipy.map((t) => t.id)), [gruppy]);
  const poZadache = useMemo(() => prototipyZadach(katalog), [katalog]);
  const [ekran, setEkran] = useState<Ekran>('rezhimy');
  const [intent] = useState<Intent>(() => readIntent(new Set(tipyVse), poZadache, preset, gruppy));
  const [clock, setClock] = useState(true);
  const otpechatki = useMemo(() => new Map(gruppy.map((g) => [sealMetod(g.id), g.id])), [gruppy]);

  return (
    <TrainerSessionHost<SessiyaPayload, Ui45>
      scope={scopeOfPath(base) ?? SESSIYA45[zadanie].scope}
      what="тренажёр"
      backHref={base}
      entryIntent={intent !== null}
      onEntryResolved={() => {
        clearIntent();
        if (intent?.kind === 'tipy') {
          setEkran('temy');
        }
      }}
      isPayload={isSessiyaPayload}
      count={(payload) => payload.tasks.length}
      describe={(payload, at) => {
        const task = zadachaNa(payload, at);
        if (task === undefined) {
          throw new Error('Нет задачи');
        }
        if (payload.rezhim === 'uznay') {
          const verny = otpechatki.get(task.metodSeal) ?? '';
          return {
            kind: nazvaniyaMetodov[verny] ?? T.uznay.metka,
            html: task.uslovie,
            review: () => <UznayItog45 task={task} verny={nazvaniyaMetodov[verny] ?? ''} T={T} />,
          };
        }
        return {
          kind: nazvaniyaTekst[task.kind] ?? '',
          html: task.uslovie,
          review: () => (
            <RazborItog45 task={task} zadanie={zadanie} versiya={versiyaRazborov} T={T} />
          ),
        };
      }}
      similar={(payload, indexes) =>
        pohozhieZadachi(
          { ...payload, tasks: payload.tasks.map((_, i) => zadachaNa(payload, i) ?? _) },
          indexes,
          pool,
          uznay,
        )
      }
      pack={upakovat}
      unpack={(packed) => {
        const payload = raspakovat(packed, pool, uznay);
        if (payload !== null) {
          setClock(payload.timer !== false);
        }
        return payload;
      }}
      labels={{ clock }}
      configurator={(api) => (
        <Konfigurator
          zadanie={zadanie}
          T={T}
          pool={pool}
          uznay={uznay}
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
          zadanie={zadanie}
          T={T}
          data={data}
          actions={actions}
          gruppy={gruppy}
          otpechatki={otpechatki}
          nazvaniya={nazvaniya}
          katalog={katalog}
          pool={pool}
          uznay={uznay}
          onVybor={() => {
            setEkran('temy');
            actions.onNew();
          }}
        />
      )}
      screen={({ payload, sessionId, restored, report, elapsed, finish, setBeforeFinish }) => (
        <div className="trn z45-trn">
          {payload.rezhim === 'uznay' ? (
            <EkranUznay45
              zadanie={zadanie}
              payload={payload}
              restored={restored === null ? null : readUi45(restored)}
              report={report}
              elapsed={elapsed}
              onFinish={finish}
              T={T}
            />
          ) : (
            <Ekran45
              zadanie={zadanie}
              payload={payload}
              pool={pool}
              uznay={uznay}
              versiya={versiyaRazborov}
              roundKey={sessionId}
              restored={restored === null ? null : readUi45(restored)}
              report={report}
              elapsed={elapsed}
              onFinish={finish}
              setBeforeFinish={setBeforeFinish}
              nazvaniyaMetodov={nazvaniyaMetodov}
              nazvaniyaTekst={nazvaniyaTekst}
              T={T}
            />
          )}
        </div>
      )}
    />
  );
}

/** Прототип задачи «p4-07:3». */
function prototipKlyucha(id: string, poZadache: ReadonlyMap<string, string>): string {
  return poZadache.get(id) ?? id.slice(0, Math.max(0, id.lastIndexOf(':')));
}

/** Прототип → метод (группа). */
function metodyTipov(gruppy: GruppaVybora[]): Map<string, string> {
  return new Map(gruppy.flatMap((g) => g.tipy.map((t) => [t.id, g.id] as const)));
}

/** Строки прогресса по методам из журнала: тип попытки — метод. */
function strokiProgressa(gruppy: GruppaVybora[], log: ProgressLog, povtorit: string) {
  const stats = kindStats(log);
  let resheno = 0;
  let verno = 0;
  const stroki: StrokaGruppy[] = gruppy.map((g) => {
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
      ...(s?.repeat === true ? { metka: povtorit } : {}),
    };
  });
  return { stroki, resheno, verno };
}

/**
 * «Работа над ошибками»: по каждой открытой ошибке — новые варианты того
 * же прототипа (до двух), вперемешку. Сами задачи с ошибкой не выдаются.
 */
function zadachiOshibok(
  katalog: KatalogBanka,
  mistakes: Mistake[],
  poZadache: ReadonlyMap<string, string>,
  count: number,
): { id: string; fixes: string }[] {
  const picked = [...mistakes]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.max(1, Math.ceil(count / ANALOGOV_NA_OSHIBKU)));
  const seen = new Set(mistakes.map((m) => m.task));
  const out: { id: string; fixes: string }[] = [];
  for (let round = 0; round < ANALOGOV_NA_OSHIBKU; round += 1) {
    for (const m of picked) {
      if (out.length >= count) break;
      const id = analogOf(katalog, prototipKlyucha(m.task, poZadache), m.task, seen);
      if (id !== null) {
        seen.add(id);
        out.push({ id, fixes: m.task });
      }
    }
  }
  return out;
}

function Konfigurator({
  zadanie,
  T,
  pool,
  uznay,
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
  zadanie: Zadanie45;
  T: ReturnType<typeof tekstyTrenazhera45>;
  pool: Pool;
  uznay: UznayPool;
  gruppy: GruppaVybora[];
  tipyVse: string[];
  nazvaniya: Record<string, string>;
  katalog: KatalogBanka;
  poZadache: ReadonlyMap<string, string>;
  ekran: Ekran;
  setEkran: (ekran: Ekran) => void;
  intent: Intent;
  api: ConfiguratorApi<SessiyaPayload>;
}) {
  const logStore = log45(zadanie);
  const vyborStore = vybor45(zadanie);
  const uznayStore = uznay45(zadanie);
  const log = logStore.use();
  const uznayProgress = uznayStore.useProgress();
  const metodOf = metodyTipov(gruppy);
  const { stroki, resheno, verno } = strokiProgressa(gruppy, log, T.progress.povtorit);
  const kindOfTask = (task: string) =>
    metodOf.get(prototipKlyucha(task, poZadache)) ?? prototipKlyucha(task, poZadache);
  const mistakeList = openMistakes(log, kindOfTask).filter((m) => poZadache.has(m.task));
  const otlozhennye = activeBookmarks(bookmarks.use(), String(zadanie)).filter(
    (item) => item.place === 'trenazher' && poZadache.has(item.ref),
  );
  const vybor = vyborStore.use();
  const selected = new Set(vybor.tipy.length === 0 ? tipyVse : vybor.tipy);
  const uznayVsego = uznay.kinds.reduce((sum, k) => sum + k.variants.length, 0);

  function zapomnit(next: VyborBanka) {
    vyborStore.set(next);
  }

  function payloadIz(
    ids: { id: string; fixes?: string }[],
    rezhim: SessiyaPayload['rezhim'],
    control: boolean,
    timer: boolean,
  ): SessiyaPayload | null {
    const tasks = ids.flatMap(({ id, fixes }) => {
      const z = izKlyucha(id, rezhim, pool, uznay);
      return z === null ? [] : [fixes === undefined ? z : { ...z, fixes }];
    });
    return tasks.length === 0
      ? null
      : { zadanie, rezhim, metod: '', podskazki: !control, timer, tasks };
  }

  function start(payload: SessiyaPayload | null) {
    if (payload !== null) api.start(payload);
  }

  function poTipam(
    tipy: string[],
    count: number,
    control: boolean,
    timer: boolean,
    rezhim: 'practice' | 'mixed',
    istochnik: IstochnikBanka = 'vse',
  ) {
    return payloadIz(
      buildByTipy(katalog, tipy, count, closedTasks(logStore.get()), istochnik).map((t) => ({
        id: t.id,
      })),
      rezhim,
      control,
      timer,
    );
  }

  function oshibki(timer: boolean) {
    const list = openMistakes(logStore.get(), kindOfTask).filter((m) => poZadache.has(m.task));
    return payloadIz(zadachiOshibok(katalog, list, poZadache, BYSTRO), 'mistakes', false, timer);
  }

  function uznayPodhod(timer: boolean) {
    const round = sobratPodhod(
      uznay.kinds.map((k) => ({ id: k.id, variants: k.variants.map((v) => ({ n: v.n })) })),
      BYSTRO,
    );
    return payloadIz(
      round.map((r) => ({ id: `${r.kind}:${r.n}` })),
      'uznay',
      false,
      timer,
    );
  }

  /* Вход по ссылке — один раз: если незавершённой тренировки нет, сразу
     в задачи (иначе оболочка спросит, и выбор откроется как надо). */
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || intent === null) return;
    opened.current = true;
    if (intent.kind === 'tipy') {
      vyborStore.set({ ...vyborStore.get(), tipy: intent.tipy });
      if (!intent.start) {
        setEkran('temy');
        clearIntent();
        return;
      }
    }
    if (readSession(scopeOfPath(window.location.pathname) ?? String(zadanie)).status === 'ok') {
      return;
    }
    clearIntent();
    const timer = vyborStore.get().timer;
    if (intent.kind === 'zadacha') {
      start(payloadIz([{ id: intent.id }], 'practice', false, timer));
    } else if (intent.kind === 'tipy') {
      start(poTipam(intent.tipy, BYSTRO, false, timer, 'practice'));
    } else if (intent.kind === 'mix') {
      start(poTipam(tipyVse, BYSTRO, false, timer, 'mixed'));
    } else if (intent.kind === 'uznay') {
      start(uznayPodhod(timer));
    } else {
      start(oshibki(timer));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- вход по ссылке — один раз
  }, [intent]);

  const rezhimy: Rezhim[] = [
    { id: 'mix', ikonka: 'mix', zag: T.rezhimy.mix.zag, lead: T.rezhimy.mix.lead(BYSTRO) },
    { id: 'temy', ikonka: 'temy', zag: T.rezhimy.temy.zag, lead: T.rezhimy.temy.lead },
    {
      id: 'oshibki',
      ikonka: 'oshibki',
      zag: T.rezhimy.oshibki.zag,
      lead: T.rezhimy.oshibki.lead(
        new Set(mistakeList.map((m) => prototipKlyucha(m.task, poZadache))).size,
      ),
      warm: true,
      disabled: mistakeList.length === 0,
    },
    {
      id: 'uznay',
      ikonka: 'uznay',
      zag: T.rezhimy.uznay.zag,
      lead: T.rezhimy.uznay.lead(BYSTRO),
      disabled: uznayVsego === 0,
    },
  ];

  function pick(id: string) {
    if (id === 'mix') {
      start(poTipam(tipyVse, BYSTRO, false, vybor.timer, 'mixed'));
    } else if (id === 'temy') {
      setEkran('temy');
    } else if (id === 'oshibki') {
      start(oshibki(vybor.timer));
    } else if (id === 'uznay') {
      start(uznayPodhod(vybor.timer));
    }
  }

  if (ekran === 'temy') {
    const tipy = tipyVse.filter((id) => selected.has(id));
    const est = skolkoZadach(katalog, tipy, vybor.istochnik);
    return (
      <div className="trn z45-trn">
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
              poTipam(
                tipy,
                vybor.count ?? BEZ_KONCA,
                vybor.bezPodskazok,
                vybor.timer,
                'practice',
                vybor.istochnik,
              ),
            )
          }
          dop={
            <Segment
              title={T.vybor.istochnik}
              values={ISTOCHNIKI}
              labels={T.vybor.istochniki}
              value={vybor.istochnik}
              onChange={(istochnik) => zapomnit({ ...vybor, istochnik })}
            />
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

  /* «Узнай метод»: узнано верно по методам (своё хранилище). */
  const uznayStroki = gruppy.flatMap((g) => {
    const t = uznayProgress.kinds[g.id];
    return t === undefined || t.done === 0 ? [] : [{ g, verno: t.right, vsego: t.done }];
  });

  return (
    <div className="trn z45-trn">
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
                    payloadIz(
                      otlozhennye.map((item) => ({ id: item.ref })),
                      'practice',
                      false,
                      vybor.timer,
                    ),
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
                    distinctSolved(log, (task) => poZadache.has(task)),
                    poZadache.size,
                  )}
                </p>
              }
              onReset={() => {
                logStore.reset();
                uznayStore.reset();
              }}
              labels={T.progress}
            >
              <section className="trn-progress__spisok z45-uznay-progress">
                <h4 className="stk-h4">{T.uznay.progress}</h4>
                {uznayStroki.length === 0 ? (
                  <p className="stk-lead">{T.uznay.progressPusto}</p>
                ) : (
                  <ul className="z45-uznay-progress__spisok">
                    {uznayStroki.map(({ g, verno: v, vsego }) => (
                      <li key={g.id}>
                        <span>{g.nazvanie}</span>
                        <span className="z45-uznay-progress__schet">{T.uznay.schet(v, vsego)}</span>
                        <Polosa dolya={vsego === 0 ? 0 : v / vsego} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="trn-progress__spisok" data-section={`mistakes${zadanie}`}>
                <h4 className="stk-h4">
                  {T.progress.oshibki}
                  {mistakeList.length === 0 ? '' : ` · ${mistakeList.length}`}
                </h4>
                <MistakesList
                  items={mistakeList}
                  titleOf={(m) => (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: nazvaniya[prototipKlyucha(m.task, poZadache)] ?? '',
                      }}
                    />
                  )}
                  action={
                    mistakeList.length === 0 ? null : (
                      <Button size="sm" onClick={() => start(oshibki(vybor.timer))}>
                        {T.rezhimy.oshibki.zag}
                      </Button>
                    )
                  }
                  empty={T.progress.oshibokNet}
                />
              </section>
              <section className="trn-progress__spisok" data-section={`later${zadanie}`}>
                <h4 className="stk-h4">{T.progress.otlozhennye}</h4>
                <BookmarksList section={String(zadanie)} empty={T.progress.otlozhennyhNet} />
              </section>
              <section className="trn-progress__spisok" data-section={`history${zadanie}`}>
                <h4 className="stk-h4">{T.progress.istoriya}</h4>
                <HistoryList section={String(zadanie)} empty={T.progress.istoriiNet} />
              </section>
            </ProgressPanel>
          </>
        }
      />
    </div>
  );
}

/** Переключатель-сегмент: источник задач (как у общего тренажёра по банку). */
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
  return (
    <div>
      <p className="stk-podpis" id="z45-istochnik">
        {title}
      </p>
      <div className="trn-seg" role="group" aria-labelledby="z45-istochnik">
        {values.map((item) => (
          <button
            type="button"
            key={item}
            className={value === item ? 'is-on' : undefined}
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

function Itogi({
  zadanie,
  T,
  data,
  actions,
  gruppy,
  otpechatki,
  nazvaniya,
  katalog,
  pool,
  uznay,
  onVybor,
}: {
  zadanie: Zadanie45;
  T: ReturnType<typeof tekstyTrenazhera45>;
  data: SummaryData;
  actions: SummaryActions<SessiyaPayload>;
  gruppy: GruppaVybora[];
  otpechatki: ReadonlyMap<string, string>;
  nazvaniya: Record<string, string>;
  katalog: KatalogBanka;
  pool: Pool;
  uznay: UznayPool;
  onVybor: () => void;
}) {
  const payload = data.payload as SessiyaPayload;
  const uznayRezhim = payload.rezhim === 'uznay';
  const poGruppam = new Map<string, { verno: number; vsego: number }>();
  const zadachi: ItogZadacha[] = data.items.map((item) => {
    const task = zadachaNa(payload, item.poolIndex);
    const metod =
      task === undefined ? '' : uznayRezhim ? (otpechatki.get(task.metodSeal) ?? '') : task.metod;
    if (metod !== '') {
      const row = poGruppam.get(metod) ?? { verno: 0, vsego: 0 };
      row.vsego += 1;
      row.verno += item.mark === 'right' ? 1 : 0;
      poGruppam.set(metod, row);
    }
    return {
      kindHtml: uznayRezhim
        ? (gruppy.find((g) => g.id === metod)?.nazvanie ?? item.kind)
        : (nazvaniya[task?.kind ?? ''] ?? item.kind),
      uslovieHtml: item.html,
      mark: item.mark,
      razbor: item.review,
    };
  });
  const stroki: StrokaGruppy[] = gruppy.flatMap((g) => {
    const row = poGruppam.get(g.id);
    if (row === undefined) return [];
    return [
      {
        id: g.id,
        nazvanie: g.nazvanie,
        znakHtml: g.znakHtml,
        ...(g.znak === undefined ? {} : { znak: g.znak }),
        ton: g.ton,
        verno: row.verno,
        vsego: row.vsego,
        ...(row.verno / row.vsego < 0.5 ? { metka: T.itogi.prosel } : {}),
      },
    ];
  });
  const verno = zadachi.filter((z) => z.mark === 'right').length;
  const sRazborom = zadachi.filter((z) => z.mark === 'hinted').length;
  const vsego = zadachi.length;
  const dolya = vsego === 0 ? 0 : verno / vsego;
  const srednee = vsego === 0 ? null : Math.round(data.seconds / vsego);

  function eshcheRaz() {
    if (uznayRezhim) {
      const round = sobratPodhod(
        uznay.kinds.map((k) => ({ id: k.id, variants: k.variants.map((v) => ({ n: v.n })) })),
        payload.tasks.length,
      );
      const tasks = round.flatMap((r) => zadachaBanka(r.kind, r.n, 'uznay', pool, uznay) ?? []);
      if (tasks.length > 0) actions.start({ ...payload, tasks });
      return;
    }
    const tipy = [...new Set(payload.tasks.map((t) => t.kind))];
    const ids = buildByTipy(katalog, tipy, payload.tasks.length, closedTasks(log45(zadanie).get()));
    const tasks = ids.flatMap((t) => izKlyucha(t.id, payload.rezhim, pool, uznay) ?? []);
    if (tasks.length > 0) actions.start({ ...payload, tasks });
  }

  return (
    <div className="trn z45-trn">
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
