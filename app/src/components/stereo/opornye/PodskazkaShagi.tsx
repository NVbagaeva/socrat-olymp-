'use client';

import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { dir } from '@/lib/solid/figures';
import type { Model } from '@/lib/solid/model';
import { renderSolid } from '@/lib/solid/render';
import type { ShagPodskazkiHtml } from '@/lib/stereo/opornye3/seal';
import { OPORNYE_3 } from '@/content/stereo/opornye3';
import { IkGalochka, IkLampa, IkNazad, IkVpered, IkZakryt } from '../metodika/Ikonki';

/**
 * Чертёж шага подсказки: та же модель задачи; со шага ② выделен
 * рабочий треугольник, с ③ отмечен прямой угол.
 */
function chertezhShaga(model: Model, shag: ShagPodskazkiHtml): string {
  const r = shag.rabochaya;
  if (r === null) {
    return renderSolid(model, { tema: 'ekran' });
  }
  const [a, b, c] = r.points;
  const p = r.pryamoy;
  const drugie = [a, b, c].filter((q) => q !== p && (q[0] !== p[0] || q[1] !== p[1] || q[2] !== p[2]));
  const u = drugie[0];
  const v = drugie[1];
  return renderSolid(
    {
      ...model,
      sections: [...(model.sections ?? []), { points: [a, b, c] }],
      angles:
        shag.n >= 3 && u !== undefined && v !== undefined
          ? [...(model.angles ?? []), { at: p, u: dir(p, u), v: dir(p, v) }]
          : (model.angles ?? []),
    },
    { tema: 'ekran' },
  );
}

/**
 * Подсказка по шагам главного алгоритма: степпер шагов (пройденные —
 * с галочкой, текущий выделен) и карточка текущего шага — вопрос с
 * вариантами, вывод после верного ответа и чертёж с выделенной
 * фигурой. «Далее» открывается после верного ответа.
 *
 * На компьютере панель стоит справа от задачи, на телефоне — под
 * чертежом (раскладка — metodika.css, .o3-zad).
 */
export function PodskazkaShagi({
  shagi,
  model,
  onClose,
}: {
  shagi: readonly ShagPodskazkiHtml[];
  model: Model;
  onClose: () => void;
}) {
  const [tek, setTek] = useState(0);
  /* Выбранный вариант по шагам; верный ответ закрывает шаг. */
  const [vybor, setVybor] = useState<Record<number, number>>({});
  const shag = shagi[tek];
  const svg = useMemo(() => (shag === undefined ? '' : chertezhShaga(model, shag)), [model, shag]);
  if (shag === undefined) return null;
  const otvecheno = (i: number) => vybor[i] !== undefined && vybor[i] === shagi[i]?.correct;
  const v = vybor[tek];
  const verno = otvecheno(tek);

  return (
    <aside className="o3-pod" aria-label={OPORNYE_3.pod.title}>
      <header className="o3-pod__head">
        <IkLampa className="o3-pod__ik" />
        <p className="o3-pod__title">{OPORNYE_3.pod.title}</p>
        <button type="button" className="o3-pod__x" onClick={onClose} aria-label={OPORNYE_3.pod.zakryt}>
          <IkZakryt />
        </button>
      </header>

      <ol className="o3-pod__shagi">
        {shagi.map((s, i) => {
          const gotov = otvecheno(i);
          return (
            <li
              key={`${s.n}-${i}`}
              className={clsx('o3-pod__shag', gotov && 'is-gotov', i === tek && 'is-tek')}
            >
              <button
                type="button"
                className="o3-pod__shag-btn"
                aria-current={i === tek ? 'step' : undefined}
                disabled={i > tek && !otvecheno(i - 1)}
                onClick={() => setTek(i)}
              >
                <span className="o3-pod__n" aria-hidden="true">
                  {gotov ? <IkGalochka /> : s.n}
                </span>
                <span className="o3-pod__shag-t">
                  {s.title}
                  {gotov ? <span className="sr-only"> — пройден</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <section className="o3-pod__karta" aria-live="polite">
        <p className="o3-pod__karta-t">
          {OPORNYE_3.pod.shag(shag.n, '')}
          <b>{shag.title}</b>
        </p>
        <p className="o3-pod__vopros" dangerouslySetInnerHTML={{ __html: shag.voprosHtml }} />
        <ul className="o3-pod__varianty">
          {shag.options.map((html, i) => (
            <li key={i}>
              <button
                type="button"
                className={clsx(
                  'o3-pod__var',
                  v === i && (i === shag.correct ? 'is-right' : 'is-wrong'),
                )}
                aria-pressed={v === i}
                disabled={verno}
                onClick={() => setVybor((prev) => ({ ...prev, [tek]: i }))}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </li>
          ))}
        </ul>
        {v === undefined ? null : verno ? (
          <p className="o3-pod__vyvod">
            <b>{OPORNYE_3.pod.verno}</b> <span dangerouslySetInnerHTML={{ __html: shag.vyvodHtml }} />
          </p>
        ) : (
          <p className="o3-pod__neverno">{OPORNYE_3.pod.neverno}</p>
        )}
        <div className="o3-pod__ris" dangerouslySetInnerHTML={{ __html: svg }} />
      </section>

      <footer className="o3-pod__nav">
        <button
          type="button"
          className="btn btn--secondary o3-pod__nazad"
          onClick={() => setTek(tek - 1)}
          disabled={tek === 0}
          aria-label={OPORNYE_3.pod.nazad}
        >
          <IkNazad />
        </button>
        {tek < shagi.length - 1 ? (
          <button type="button" className="btn btn--primary o3-pod__dalee" onClick={() => setTek(tek + 1)} disabled={!verno}>
            {OPORNYE_3.pod.dalee}
            <IkVpered />
          </button>
        ) : (
          <button type="button" className="btn btn--primary o3-pod__dalee" onClick={onClose} disabled={!verno}>
            {OPORNYE_3.pod.gotovo}
          </button>
        )}
      </footer>
    </aside>
  );
}
