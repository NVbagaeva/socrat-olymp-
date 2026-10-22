import type { ReactNode } from 'react';
import { Solid } from '@/components/solid/Solid';
import { SheetBlock } from '@/components/tasks/SheetBlock';
import { TeoriyaShell } from '@/components/tasks/teoriya/TeoriyaShell';
import { Tex } from '@/components/ui/Tex';
import { SHPARGALKI } from '@/content/shpargalki';
import { GLAVA_PLAN, GLAVY_15, GLAVY_3, type GlavaStereo } from '@/content/stereo/glavy';
import { DEKOR_STEREO, STEREO, type StereoNo } from '@/content/stereo/zadaniya';
import { THUMBS } from '@/lib/solid/drawings/thumbs';
import { prototypeById, RAZDELY } from '@/lib/zadanie3';
import { assertSheetsOk, renderFormulas } from '@/lib/zadanie3/formulas';
import { diagonalKuba, sechenieKuba, type PrimerChertezha } from '@/lib/stereo/primery';
import { Chertezh3d } from './Chertezh3d';

const GLAVY: Record<StereoNo, readonly GlavaStereo[]> = { '3': GLAVY_3, '15': GLAVY_15 };

/**
 * Живые чертежи, которые уже стоят в главах: по одному на задание,
 * пока главы пишутся (этап 3 плана). Ключ — «задание:глава».
 */
const ZHIVYE: Readonly<Record<string, () => PrimerChertezha>> = {
  '3:chertezh': diagonalKuba,
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
 * Справочник формул, пока глава 10 пишется: шпаргалки восьми групп
 * банка, по одной сворачиваемой карточке. Формулы набраны на сборке;
 * кривая запись роняет сборку (assertSheetsOk), а не страницу.
 */
function Shpargalki() {
  assertSheetsOk();
  return (
    <div className="stereo-shpargalki">
      <p className="stereo-plan__note">{GLAVA_PLAN.spravochnik}</p>
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
      {no === '3' && glava.id === 'formuly' ? (
        <Shpargalki />
      ) : (
        <p className="stereo-plan__note">{GLAVA_PLAN.gotovitsya}</p>
      )}
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
    tela[glava.id] = <PlanGlavy glava={glava} no={no} />;
  });
  const model = THUMBS['thumb-III'];
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={glavy.map((glava) => ({ id: glava.id, title: glava.title, nomer: glava.nomer }))}
      tela={tela}
      trackKey={STEREO[no].teoriyaKey}
      dekor={{
        kartinka: model === undefined ? null : <Solid model={model} />,
        note: DEKOR_STEREO.note,
      }}
    />
  );
}
