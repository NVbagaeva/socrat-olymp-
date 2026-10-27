import type { ReactNode } from 'react';
import { Solid } from '@/components/solid/Solid';
import { SheetBlock } from '@/components/tasks/SheetBlock';
import { TeoriyaShell } from '@/components/tasks/teoriya/TeoriyaShell';
import { Tex } from '@/components/ui/Tex';
import { SHPARGALKI } from '@/content/shpargalki';
import { GLAVA_PLAN, GLAVY_15, GLAVY_3, STARYE_GLAVY_3, type GlavaStereo } from '@/content/stereo/glavy';
import { DEKOR_STEREO, STEREO, type StereoNo } from '@/content/stereo/zadaniya';
import { THUMBS } from '@/lib/solid/drawings/thumbs';
import { prototypeById, RAZDELY } from '@/lib/zadanie3';
import { assertSheetsOk, renderFormulas } from '@/lib/zadanie3/formulas';
import { sechenieKuba, type PrimerChertezha } from '@/lib/stereo/primery';
import { Chertezh3d } from './Chertezh3d';
import { GLAVY_DANNYE_3 } from '@/lib/stereo/glavy';
import { GlavaMetodiki } from './glavy/GlavaMetodiki';
import { Glava2Treugolnik, RAZDELY_GLAVY_2 } from './glavy/Glava2Treugolnik';

const GLAVY: Record<StereoNo, readonly GlavaStereo[]> = { '3': GLAVY_3, '15': GLAVY_15 };

/**
 * Живые чертежи, которые уже стоят в главах: по одному на задание,
 * пока главы пишутся (этап 3 плана). Ключ — «задание:глава».
 */
/** Написанные главы: «задание:глава» → текст главы. */
const NAPISANY: Readonly<Record<string, () => ReactNode>> = {
  '3:treugolnik': () => <Glava2Treugolnik />,
  ...Object.fromEntries(
    Object.entries(GLAVY_DANNYE_3).map(([id, dannye]) => [
      `3:${id}`,
      () => <GlavaMetodiki glava={dannye()} shpargalki={<Shpargalki />} />,
    ]),
  ),
};

/** Подпункты написанных глав в «Содержании»: разделы главы. */
const PODPUNKTY: Readonly<Record<string, readonly { id: string; title: string }[]>> = {
  '3:treugolnik': RAZDELY_GLAVY_2,
  ...Object.fromEntries(
    Object.entries(GLAVY_DANNYE_3).map(([id, dannye]) => [
      `3:${id}`,
      dannye().razdely.map(({ id: rid, title }) => ({ id: rid, title })),
    ]),
  ),
};

const ZHIVYE: Readonly<Record<string, () => PrimerChertezha>> = {
  '15:secheniya': sechenieKuba,
};

/** «6» → «P03-06». */
function protoId(n: number): string {
  return `P03-${String(n).padStart(2, '0')}`;
}

/** Номера прототипов главы: плашки с названием во всплывающей подсказке. */
function Prototipy({ nomera }: { nomera: readonly number[] }) {
  return (
    <p className="stereo-gde">
      <span className="stereo-gde__label">{GLAVA_PLAN.gdeNaEge}:</span>
      {nomera.map((n) => {
        const proto = prototypeById(protoId(n));
        return (
          <span
            className="stereo-gde__chip"
            key={n}
            title={proto === undefined ? undefined : proto.nazvanie.replace(/\$/g, '')}
          >
            {n}
          </span>
        );
      })}
    </p>
  );
}

/**
 * Шпаргалки восьми групп банка для главы 10, по одной сворачиваемой
 * карточке. Формулы набраны на сборке;
 * кривая запись роняет сборку (assertSheetsOk), а не страницу.
 */
function Shpargalki() {
  assertSheetsOk();
  return (
    <div className="stereo-shpargalki">
      {RAZDELY.map((razdel) => {
        const sheet = SHPARGALKI[razdel.nomer] ?? [];
        if (sheet.length === 0) {
          return null;
        }
        return (
          <details className="stereo-shpargalka" key={razdel.nomer}>
            <summary className="stereo-shpargalka__title">{razdel.nazvanie}</summary>
            <SheetBlock items={sheet} formulas={renderFormulas(sheet)} />
          </details>
        );
      })}
    </div>
  );
}

/** Глава, пока не написана: её план и прототипы, которые она разберёт. */
function PlanGlavy({ glava, no }: { glava: GlavaStereo; no: StereoNo }) {
  const zhivoy = ZHIVYE[`${no}:${glava.id}`]?.();
  return (
    <div className="stereo-plan">
      {zhivoy === undefined ? null : (
        <Chertezh3d model={zhivoy.model} uslovie={zhivoy.uslovie} shagi={zhivoy.shagi} />
      )}
      <p className="stereo-plan__label">{GLAVA_PLAN.vGlave}</p>
      <ul className="stereo-plan__list">
        {glava.podglavy.map((title) => (
          <li key={title}>
            <Tex text={title} />
          </li>
        ))}
      </ul>
      <p className="stereo-plan__note">{GLAVA_PLAN.gotovitsya}</p>
      {glava.prototipy === undefined ? null : <Prototipy nomera={glava.prototipy} />}
    </div>
  );
}

/**
 * Вкладка «Теория» стереометрии: главы подряд, «Содержание» рядом
 * (общая оболочка TeoriyaShell — липкая колонка на компьютере, полоса
 * и шторка на телефоне, подсветка главы при прокрутке).
 */
export function TeoriyaStereo({ no, vkladka }: { no: StereoNo; vkladka: string }) {
  const glavy = GLAVY[no];
  const tela: Record<string, ReactNode> = {};
  glavy.forEach((glava) => {
    const napisana = NAPISANY[`${no}:${glava.id}`];
    /* Якоря прежних глав №3 ведут в новые: ссылки извне не ломаются. */
    const starye =
      no === '3'
        ? Object.entries(STARYE_GLAVY_3)
            .filter(([, novaya]) => novaya === glava.id)
            .map(([staraya]) => (
              <span key={staraya} id={`teoriya-${staraya}`} className="stereo-yakor" aria-hidden="true" />
            ))
        : null;
    tela[glava.id] = (
      <>
        {starye}
        {napisana === undefined ? (
          <PlanGlavy glava={glava} no={no} />
        ) : (
          <>
            {napisana()}
            {glava.prototipy === undefined ? null : <Prototipy nomera={glava.prototipy} />}
          </>
        )}
      </>
    );
  });
  const model = THUMBS['thumb-III'];
  const shell = (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={glavy.map((glava) => {
        const podpunkty = PODPUNKTY[`${no}:${glava.id}`];
        return {
          id: glava.id,
          title: glava.title,
          nomer: glava.nomer,
          ...(podpunkty === undefined ? {} : { podpunkty: [...podpunkty] }),
        };
      })}
      soderzhanieRaskryvashka={no === '3'}
      tela={tela}
      trackKey={STEREO[no].teoriyaKey}
      dekor={{
        kartinka: model === undefined ? null : <Solid model={model} />,
        note: DEKOR_STEREO.note,
      }}
    />
  );
  /* Оформление новой методики (metodika.css) — только у №3. */
  return no === '3' ? <div className="o3-teoriya">{shell}</div> : shell;
}
