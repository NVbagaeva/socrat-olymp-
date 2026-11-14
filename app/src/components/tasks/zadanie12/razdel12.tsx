'use client';

import { useState } from 'react';
import { FigureZoom } from '@/components/ui';
import type { Shagi } from '@/components/trenazher/types';
import { TRENAZHER12 } from '@/content/zadanie12';
import { ZADANIYA } from '@/lib/paths';
import { readOtvet12 } from '@/lib/ves12/trening/otvet12';
import { log12, vybor12 } from '@/lib/ves12/trening/progress';
import { KLYUCH12, perenos12 } from '@/lib/ves12/trening/session';
import { ZAGRUZKA12, type Reshenie12, type Zadacha12 } from '@/lib/ves12/trening/zagruzka';
import type { Shag } from '../steklo';
import { hintOf, Podskazka12 } from '../trainer/Zadacha12';
import type { RazdelBanka } from '../trening/bank/types';

const T = TRENAZHER12;

/** Чертёж движка: как есть, с увеличением по нажатию. */
function Chertezh12({
  svg,
  label,
  focus,
}: {
  svg: string;
  label: string;
  focus?: string | undefined;
}) {
  return (
    <FigureZoom className="chart z12-chertezh" label={label}>
      <span data-focus={focus} dangerouslySetInnerHTML={{ __html: svg }} />
    </FigureZoom>
  );
}

/**
 * Подсказка №12 — как была: шаги с полями, вопросы с кнопками и части
 * у параболы (components/tasks/trainer/Zadacha12, Podskazka12). Шаг
 * может достроить чертёж или подсветить на нём асимптоту — такой чертёж
 * стоит над шагами. Состояние подсказки живёт, пока открыта задача.
 */
function Podskazka12Banka({ r }: { r: Reshenie12 }) {
  const [shagi, setShagi] = useState<Shagi>({});
  const task = r.task;
  const h = hintOf(shagi);
  const current = task.steps[h.step];
  const chertezh =
    current?.chartSvg !== undefined && h.answered >= (current.chartFrom ?? 0)
      ? current.chartSvg
      : null;
  return (
    <div className="z12-podskazka">
      <p className="stk-podpis">{T.ekran.podskazkaLead}</p>
      {chertezh === null ? null : (
        <div className="trn-risunok z12-podskazka__chertezh">
          <Chertezh12
            svg={chertezh}
            label={T.ekran.chertezhShaga}
            focus={current?.focus ?? undefined}
          />
        </div>
      )}
      <Podskazka12
        task={task}
        shagi={shagi}
        setShagi={setShagi}
        onMiss={() => {}}
        onDone={() => {}}
      />
    </div>
  );
}

/** Решение по шагам: шаги разбора движка как есть (lib/ves12/trening/shagi12). */
function shagi12(r: Reshenie12): Shag[] {
  return r.shagi.map((s) => ({
    chtoHtml: s.chtoHtml,
    formulaHtml: '',
    ...(s.zagolovokHtml === '' ? {} : { zagolovokHtml: s.zagolovokHtml }),
    ...(s.ton === undefined ? {} : { ton: s.ton }),
  }));
}

/** Под решением: каким методом решали — рисунок метода движка. */
function Metod12({ r }: { r: Reshenie12 }) {
  const method = r.task.method;
  if (method === null) return null;
  return (
    <aside className="z12-metod">
      <span
        className="z12-metod__chertezh"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: method.svg }}
      />
      <span className="z12-metod__text">
        <span className="stk-podpis">Каким методом решали</span>
        <span className="z12-metod__nazvanie" dangerouslySetInnerHTML={{ __html: method.title }} />
      </span>
    </aside>
  );
}

/**
 * №12 для общего тренажёра по банку (components/tasks/trening/bank):
 * ключи шаблонов, журнал и выбор, движок graph/ в браузере вместо
 * файлов задач, проверка ответа по общему правилу записи, чертёж
 * условия, ответ выбором варианта, подсказка по шагам и разбор движка.
 */
export const RAZDEL12: RazdelBanka<Zadacha12, Reshenie12> = {
  razdel: '12',
  klyuch: KLYUCH12,
  log: log12,
  vybor: vybor12,
  zagruzka: ZAGRUZKA12,
  T,
  proverit: readOtvet12,
  pod: (z) =>
    z.task.chartSvg === null ? null : (
      <div className="trn-risunok z12-risunok">
        <Chertezh12 svg={z.task.chartSvg} label={T.ekran.chertezh} />
      </div>
    ),
  shagi: shagi12,
  posle: (r) => <Metod12 r={r} />,
  voprosy: () => [],
  podskazka: (r) => <Podskazka12Banka key={r.task.id} r={r} />,
  varianty: (z) =>
    z.task.options === null ? null : z.task.options.map((o) => ({ id: o.number, html: o.html })),
  poyasnenie: (z, verno) => (verno ? z.task.rightHint : z.task.wrongHint),
  zadachaHref: (id) => `${ZADANIYA}/12/trenazher/?zadacha=${encodeURIComponent(id)}`,
  prezhnyayaZapis: perenos12,
};
