import type { ReactNode } from 'react';
import { Tex } from '@/components/ui/Tex';
import { TeoriyaShell } from '@/components/tasks/veroyatnost/teoriya/TeoriyaShell';
import { Display } from '@/components/tasks/theory/rich/parts';
import { LAYFHAK_TITLE, PRIMER_TITLE, RAZDELY_TEORII_1, type Layfhak } from '@/content/teoriya1';
import { PROGRESS_1 } from '@/content/zadanie1';
import { renderPlan } from '@/lib/planimetriya/render';
import { risunokTeorii } from '@/lib/planimetriya/teoriya';
import { QuadraticSection } from '../theory/quadratic/QuadraticSection';

/** Чертёж карточки теории по ключу: рисует движок планиметрии. */
function figureFor(id: string, className = 'qth-card__chart z1-card-pic'): ReactNode {
  const r = risunokTeorii(id);
  return (
    <span
      className={`pl-wrap ${className}`}
      dangerouslySetInnerHTML={{ __html: renderPlan(r.scena, r.optsii) }}
    />
  );
}

/** Рамка «Полезный факт»: формулировка, формула, чертёж и короткий пример. */
function LayfhakRamka({ l }: { l: Layfhak }) {
  return (
    <section className="z1-layfhak" id={`layfhak-${l.id}`} aria-labelledby={`layfhak-${l.id}-t`}>
      <p className="z1-layfhak__chip">{LAYFHAK_TITLE}</p>
      <h4 className="z1-layfhak__title" id={`layfhak-${l.id}-t`}>
        <Tex text={l.title} />
      </h4>
      <div className="z1-layfhak__body">
        <div className="z1-layfhak__text">
          {l.text.map((t) => (
            <p key={t}>
              <Tex text={t} />
            </p>
          ))}
          {l.formula === undefined ? null : <Display tex={l.formula} />}
          {l.primer === undefined ? null : (
            <div className="z1-layfhak__primer">
              <p className="z1-layfhak__primer-title">{PRIMER_TITLE}</p>
              <p>
                <Tex text={l.primer.uslovie} />
              </p>
              {l.primer.reshenie.map((s) => (
                <p key={s}>
                  <Tex text={s} />
                </p>
              ))}
              <p className="z1-layfhak__otvet">
                Ответ: <Tex text={l.primer.otvet} />
              </p>
            </div>
          )}
        </div>
        {l.scene === undefined ? null : figureFor(l.scene, 'z1-layfhak__pic')}
      </div>
    </section>
  );
}

/**
 * Вкладка «Теория» задания №1: девять разделов подряд, содержание
 * рядом — оболочка теории №4 и №2 (TeoriyaShell). Карточки — разметка
 * теории №12 (QuadraticSection), чертежи — движок планиметрии по ключу
 * сцены. После карточек раздела — рамки «Полезный факт» с примером.
 */
export function Teoriya1({ vkladka }: { vkladka: string }) {
  const tela = Object.fromEntries(
    RAZDELY_TEORII_1.map((r) => [
      r.id,
      <div key={r.id}>
        <QuadraticSection section={r.section} figureFor={(id) => figureFor(id)} />
        {r.layfhaki.map((l) => (
          <LayfhakRamka l={l} key={l.id} />
        ))}
      </div>,
    ]),
  );
  const dekor = risunokTeorii('summa-uglov');
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={RAZDELY_TEORII_1}
      tela={tela}
      dekor={{
        kartinka: (
          <span
            className="pl-wrap z1-dekor"
            aria-hidden="true"
            dangerouslySetInnerHTML={{
              __html: renderPlan(dekor.scena, { ...dekor.optsii, shirina: 200, vysota: 140 }),
            }}
          />
        ),
        note: 'С суммы углов треугольника начинается почти каждая задача на углы.',
      }}
      trackKey={PROGRESS_1.teoriyaKey}
    />
  );
}
