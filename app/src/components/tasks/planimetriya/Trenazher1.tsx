'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { TRENAZHER_1 } from '@/content/zadanie1';
import { progress1 } from '@/lib/planimetriya/progress';
import type { DannyeTrenazhera1 } from '@/lib/planimetriya/trenazher/dannye';
import {
  nastroykiSeychas,
  useNastroyki,
  zapisatNastroyki,
} from '@/lib/planimetriya/trenazher/nastroyki';
import {
  bankDlya,
  planSessii,
  podtipKlyucha,
  vTrenirovke,
  type Nastroyki,
} from '@/lib/planimetriya/trenazher/sessiya';
import { isBaseUi } from '@/lib/trainerSession/restore';
import { scopeOfPath } from '@/lib/trainerSession/scope';
import { clearSession, readSession } from '@/lib/trainerSession/store';
import { TrainerSessionHost, type ConfiguratorApi } from '../session';
import { sessionText } from '../session/text';
import { IkonkaBloka1 } from './IkonkaBloka1';
import { Trenazher1Reshenie, Trenazher1Review } from './Trenazher1Reshenie';
import { Trenazher1Vybor } from './Trenazher1Vybor';
import {
  chastTrenirovki,
  isTrenazher1Payload,
  pokhozhiyPlan,
  raspakovat,
  readTrenazher1Ui,
  sobratPlan,
  upakovat,
  type Trenazher1Payload,
  type Trenazher1Ui,
} from './trenazher1Sessiya';

/** Seed плана: у каждой тренировки свой. */
function novyySeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Незавершённая тренировка, о которой спрашиваем после ссылки на прототип. */
interface Vopros {
  solved: number;
  total: number;
}

/**
 * Вкладка «Тренажёр» №1 — тренажёр №11: выбор задач → решение →
 * итог.
 *
 * Решение и итог ведёт оболочка сессии (components/tasks/session):
 * она сохраняет тренировку и состояние экрана, ведёт паузу и время,
 * завершает тренировку и показывает общий итоговый экран. Ушёл в
 * теорию, перезагрузил страницу — вкладка «Тренажёр» вернёт к той же
 * задаче. Собранные задачи весят мегабайты (чертежи всех шагов),
 * поэтому в хранилище идёт только план с подписью, а задачи
 * собираются заново (trenazher1Sessiya.ts).
 *
 * Выбор хранится на время вкладки браузера (sessionStorage). Ссылка
 * из «Где на ЕГЭ» теории (?tipy=p05) и маршрут урока «Для
 * репетиторов» (?tipy=p01,p05) отмечают свои типы; если при этом
 * есть незавершённая тренировка, спрашиваем, продолжить её или начать
 * новую — тем же диалогом, что у оболочки.
 */
export function Trenazher1({ dannye, base }: { dannye: DannyeTrenazhera1; base: string }) {
  const scope = scopeOfPath(base) ?? '1';
  const n = useNastroyki();
  const [zagruzka, setZagruzka] = useState(false);
  const [oshibka, setOshibka] = useState<string | null>(null);
  const [vopros, setVopros] = useState<Vopros | null>(null);
  /* Оболочка снята на время смены тренировки; pokolenie — ключ
     новой оболочки. */
  const [smena, setSmena] = useState(false);
  const [pokolenie, setPokolenie] = useState(0);
  const progress = progress1.useProgress();
  const vse = useMemo(() => dannye.razdely.flatMap((r) => r.podtipy), [dannye]);
  const bloki = useMemo(
    () => Object.fromEntries(vse.map((p) => [p.id, p.section])) as Record<string, string>,
    [vse],
  );
  const kody = useMemo(
    () => Object.fromEntries(vse.map((p) => [p.id, p.kod])) as Record<string, string>,
    [vse],
  );

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const tipy = (q.get('tipy') ?? '').split(',').filter((id) => vse.some((p) => p.id === id));
    if (tipy.length === 0) {
      return;
    }
    const s = nastroykiSeychas();
    const bezBanka = tipy.some((id) => vse.find((p) => p.id === id)?.vBanke === 0);
    zapisatNastroyki({
      ...s,
      podtipy: tipy,
      uroven: 0,
      istochnik: bezBanka && s.istochnik === 'bank' ? 'mix' : s.istochnik,
    });
    /* Ссылка отработала: после перезагрузки вопрос не повторяется,
       выбор типов остаётся в настройках вкладки. */
    q.delete('tipy');
    const rest = q.toString();
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${rest === '' ? '' : `?${rest}`}${window.location.hash}`,
    );
    /* Оболочка уже вернула незавершённую тренировку (или возвращает:
       задачи собираются): спросить, остаться в ней или начать новую
       по ссылке. Запись читается без распаковки — как у оболочки. */
    const timer = window.setTimeout(() => {
      const read = readSession(scope);
      if (read.status === 'ok') {
        const ui = isBaseUi(read.session.ui) ? read.session.ui : null;
        setVopros({
          solved: ui === null ? 0 : Object.keys(ui.marks).length,
          total: ui?.order?.length ?? read.session.total,
        });
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [vse, scope]);

  /* «Начать новую» по ссылке. Оболочка с незавершённой тренировкой
     убирается и, уходя, записывает её в последний раз; уже после
     этого (следующая задача цикла) запись стирается, и новая оболочка
     открывает выбор с типами из ссылки. */
  function nachatNovuyu() {
    setVopros(null);
    setSmena(true);
    window.setTimeout(() => {
      clearSession(scope);
      setPokolenie((k) => k + 1);
      setSmena(false);
    }, 0);
  }

  function izmenit(patch: Partial<Nastroyki>) {
    zapisatNastroyki({ ...nastroykiSeychas(), ...patch });
  }

  const oshibkiPodtipy = useMemo(
    () =>
      [...new Set(progress.mistakes.map(podtipKlyucha))].filter((id) =>
        vse.some((p) => p.id === id),
      ),
    [progress.mistakes, vse],
  );

  async function nachat(nastroyki: Nastroyki, begin: ConfiguratorApi<Trenazher1Payload>['start']) {
    const podtipy = vTrenirovke(nastroyki, vse).map((p) => p.id);
    const plan = planSessii(
      { podtipy, istochnik: nastroyki.istochnik, count: nastroyki.count },
      dannye.bank,
      novyySeed(),
    );
    if (plan.length === 0) {
      return;
    }
    setOshibka(null);
    setZagruzka(true);
    try {
      begin(await sobratPlan(plan, nastroyki.podskazki, dannye.bank));
      window.scrollTo({ top: 0 });
    } catch (e) {
      setOshibka((e as Error).message);
    } finally {
      setZagruzka(false);
    }
  }

  const vBankeVsego = bankDlya(
    vTrenirovke(n, vse).map((p) => p.id),
    dannye.bank,
    n.istochnik,
  ).length;

  const dialog = (
    <Modal
      open={vopros !== null}
      onClose={() => setVopros(null)}
      title={sessionText.unfinishedTitle}
      description={vopros === null ? null : sessionText.unfinishedText(vopros.solved, vopros.total)}
      footer={
        <>
          <Button variant="secondary" onClick={() => setVopros(null)}>
            {sessionText.keepOld}
          </Button>
          <Button variant="danger" onClick={nachatNovuyu}>
            {sessionText.startNew}
          </Button>
        </>
      }
    />
  );

  if (smena) {
    return null;
  }
  return (
    <>
      <TrainerSessionHost<Trenazher1Payload, Trenazher1Ui>
        key={pokolenie}
        scope={scope}
        what="тренажёр"
        backHref={base}
        isPayload={isTrenazher1Payload}
        count={(payload) => payload.zadachi.length}
        pack={upakovat}
        unpack={(packed) => raspakovat(packed, dannye.bank)}
        describe={(payload, at) => {
          const z = payload.zadachi[at];
          if (z === undefined) {
            throw new Error('Нет задачи');
          }
          return {
            kind: z.title,
            /* Условие с чертежом ученика: без него задачу не узнать. */
            html: `${z.uslovieHtml}<span class="pl-wrap z1-sum__pic">${z.risunokSvg}</span>`,
            /* Решение закрыто отпечатком до итогов: открывается только здесь. */
            review: () => <Trenazher1Review zadacha={z} />,
            icon: <IkonkaBloka1 blok={bloki[z.id] ?? ''} />,
            code: kody[z.id] ?? String(z.proto).padStart(2, '0'),
            badge:
              z.fipi === null
                ? TRENAZHER_1.badge[z.vid]
                : `${TRENAZHER_1.badge[z.vid]} · ${TRENAZHER_1.fipi(z.fipi)}`,
          };
        }}
        subset={chastTrenirovki}
        similar={async (payload, at) => {
          try {
            const plan = pokhozhiyPlan(payload, at, dannye.bank, novyySeed());
            return plan.length === 0
              ? null
              : await sobratPlan(plan, payload.podskazki, dannye.bank);
          } catch {
            return null;
          }
        }}
        configurator={(api) => (
          <>
            <Trenazher1Vybor
              razdely={dannye.razdely}
              n={n}
              izmenit={izmenit}
              vBankeVsego={vBankeVsego}
              oshibki={oshibkiPodtipy}
              oshibokZadach={progress.mistakes.length}
              progress={progress}
              zagruzka={zagruzka}
              onStart={() => void nachat(n, api.start)}
            />
            {oshibka === null ? null : (
              <p className="z11-tr__oshibka" role="alert">
                {TRENAZHER_1.neUdalos} {oshibka}
              </p>
            )}
          </>
        )}
        screen={({ payload, restored, report, elapsed, finish }) => (
          <Trenazher1Reshenie
            zadachi={payload.zadachi}
            podskazki={payload.podskazki}
            razdely={dannye.razdely}
            ssylki={dannye.ssylki}
            base={base}
            restored={restored === null ? null : readTrenazher1Ui(restored)}
            report={report}
            elapsed={elapsed}
            onKonets={finish}
          />
        )}
      />
      {dialog}
    </>
  );
}
