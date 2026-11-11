'use client';

import { useEffect, useState } from 'react';
import { TrainerSessionHost, type ConfiguratorApi, type SummaryActions } from '../session';
import type { SummaryData } from '../session/TrainerSummary';
import { ShagiResheniya } from '../steklo';
import {
  EkranZadachi as _EkranZadachi,
  ItogiSessii,
  ProgressPanel,
  StartRezhimy,
  VyborTem,
  type GruppaVybora,
  type ItogZadacha,
  type Rezhim,
  type StrokaGruppy,
} from '../trening';
import { GRUPPY8, PROTOTYPES8_ORDER, TRENAZHER8, gruppaOfPrototype } from '@/content/vychisleniya8';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import { readSession } from '@/lib/trainerSession/store';
import {
  nedavnie8,
  progress8,
  stoitPovtorit8,
  vybor8,
  zakladki8,
  type Vybor8,
} from '@/lib/vychisleniya/progress';
import {
  buildByPrototypes,
  makeTask,
  mistakePrototypes,
  prototypeOfTaskId,
  type Task8,
} from '@/lib/vychisleniya/session';
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

/* Компонент экрана подключается через Trenazher8Screen; импорт типа
   нужен только проверке, что общий экран и тренажёр не разошлись. */
void _EkranZadachi;

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

/** Адрес вкладки без ?tip=…: вопрос по ссылке не повторяется после перезагрузки. */
function stripTip(): void {
  const url = new URL(window.location.href);
  if (url.searchParams.has('tip')) {
    url.searchParams.delete('tip');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }
}

function tipFromLocation(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const tip = new URLSearchParams(window.location.search).get('tip');
  return tip !== null && PROTOTYPES8_ORDER.includes(tip) ? tip : null;
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
  /* Часы на панели: по выбору ученика при старте или из записи. */
  const [clock, setClock] = useState(true);

  return (
    <TrainerSessionHost<Trenazher8Payload, Trenazher8Ui>
      scope={scopeOfPath(base) ?? '8'}
      what="тренажёр"
      backHref={base}
      /* Прямой заход по ссылке с типом: при незавершённой тренировке оболочка спросит. */
      entryIntent={tipFromLocation() !== null}
      onEntryResolved={() => {
        stripTip();
        setEkran('temy');
      }}
      isPayload={isTrenazher8Payload}
      count={(payload) => payload.tasks.length}
      describe={(payload, at) => {
        const task = taskAt8(payload, at);
        if (task === undefined) {
          throw new Error('Нет задания');
        }
        return {
          kind: task.prototype,
          html: task.questionHtml,
          review: () => <ShagiResheniya shagi={shagiOf(task)} />,
        };
      }}
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
          ekran={ekran}
          setEkran={setEkran}
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

/** Строки прогресса по группам: решено, верно, «Стоит повторить». */
function useStrokiProgressa(gruppy: GruppaVybora[]) {
  const progress = progress8.useProgress();
  const nedavnie = nedavnie8.use();
  let resheno = 0;
  let verno = 0;
  const stroki: StrokaGruppy[] = gruppy.map((g) => {
    let done = 0;
    let right = 0;
    for (const t of g.tipy) {
      const tally = progress.kinds[t.id];
      if (tally !== undefined) {
        done += tally.done;
        right += tally.right;
      }
    }
    resheno += done;
    verno += right;
    return {
      id: g.id,
      nazvanie: g.nazvanie,
      znakHtml: g.znakHtml,
      ton: g.ton,
      verno: right,
      vsego: done,
      ...(stoitPovtorit8(
        nedavnie,
        g.tipy.map((t) => t.id),
      )
        ? { metka: TRENAZHER8.progress.povtorit }
        : {}),
    };
  });
  return { stroki, resheno, verno, mistakes: progress.mistakes };
}

function Konfigurator8({
  gruppy,
  ekran,
  setEkran,
  api,
}: {
  gruppy: GruppaVybora[];
  ekran: Ekran;
  setEkran: (ekran: Ekran) => void;
  api: ConfiguratorApi<Trenazher8Payload>;
}) {
  const { stroki, resheno, verno, mistakes } = useStrokiProgressa(gruppy);
  const zakladki = zakladki8.use();
  /* Последний выбор живёт в хранилище браузера: на сервере — по умолчанию. */
  const vybor = vybor8.use();
  const selected = new Set(vybor.tipy.length === 0 ? PROTOTYPES8_ORDER : vybor.tipy);

  function zapomnit(next: Vybor8) {
    vybor8.write(next);
  }

  function start(tasks: Task8[], control = vybor.bezPodskazok, timer = vybor.timer) {
    if (tasks.length > 0) {
      api.start({ tasks, control, timer });
    }
  }

  /* Пришли по ссылке «Потренировать этот тип»: тип запоминается как
     выбранный; если нет незавершённой тренировки — сразу в задачи (иначе
     оболочка спросит, и выбор тем откроется с этим типом). Адрес читается
     в эффекте: при переходе по ссылке внутри сайта он обновляется после
     первой отрисовки. */
  useEffect(() => {
    const tip = tipFromLocation();
    if (tip === null) {
      return;
    }
    vybor8.write({ ...vybor8.read(), tipy: [tip] });
    if (readSession(scopeOfPath(window.location.pathname) ?? '8').status !== 'ok') {
      stripTip();
      const tasks = buildByPrototypes([tip], BYSTRO);
      if (tasks.length > 0) {
        api.start({ tasks, control: false, timer: vybor8.read().timer });
      }
    }
    // Один раз при входе.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const oshibki = mistakePrototypes(mistakes);
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
      lead: TRENAZHER8.rezhimy.oshibki.lead(oshibki.length),
      warm: true,
      disabled: oshibki.length === 0,
    },
  ];

  function pick(id: string) {
    if (id === 'mix') {
      start(buildByPrototypes(PROTOTYPES8_ORDER, BYSTRO), false);
    } else if (id === 'temy') {
      setEkran('temy');
    } else if (id === 'oshibki') {
      start(buildByPrototypes(oshibki, BYSTRO), false);
    }
  }

  function startOtlozhennye() {
    const tasks = zakladki.flatMap((id) => {
      const [prototype, seed, level] = id.split('|');
      if (prototype === undefined || seed === undefined) {
        return [];
      }
      try {
        return [makeTask(prototype, seed, level === 'base' || level === 'advanced' ? level : null)];
      } catch {
        return [];
      }
    });
    start(tasks, false);
  }

  if (ekran === 'temy') {
    return (
      <div className="trn">
        <VyborTem
          gruppy={gruppy}
          selected={selected}
          onSelected={(next) =>
            zapomnit({ ...vybor, tipy: next.size === PROTOTYPES8_ORDER.length ? [] : [...next] })
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
            start(buildByPrototypes(tipy, vybor.count ?? BEZ_KONCA));
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
            {zakladki.length === 0 ? null : (
              <button
                type="button"
                className="stk-btn stk-btn--tihaya trn-otlozhennye"
                onClick={startOtlozhennye}
              >
                {TRENAZHER8.rezhimy.otlozhennye(zakladki.length)}
              </button>
            )}
            <ProgressPanel
              stroki={stroki}
              resheno={resheno}
              verno={verno}
              onReset={() => {
                progress8.reset();
                nedavnie8.clear();
              }}
              labels={{ ...TRENAZHER8.progress, otmena: 'Отмена' }}
            />
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
    const task = taskAt8(payload, item.poolIndex);
    const prototype = task?.prototype ?? prototypeOfTaskId(item.kind);
    const gruppa = gruppaOfPrototype(prototype);
    if (gruppa !== undefined) {
      const row = poGruppam.get(gruppa.id) ?? { verno: 0, vsego: 0 };
      row.vsego += 1;
      row.verno += item.mark === 'right' ? 1 : 0;
      poGruppam.set(gruppa.id, row);
    }
    return {
      kindHtml: nazvaniya[prototype] ?? prototype,
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
    const tasks = buildByPrototypes(prototypes, payload.tasks.length);
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

/* GRUPPY8 нужен проверке типов: группы приходят пропсами с сервера. */
void GRUPPY8;
