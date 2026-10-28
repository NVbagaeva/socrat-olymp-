'use client';

import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { dir } from '@/lib/solid/figures';
import type { Model } from '@/lib/solid/model';
import { ORTHO_AZIMUTH, ORTHO_ELEVATION, orthoAt } from '@/lib/solid/project';
import { renderSolid } from '@/lib/solid/render';
import { ZhivoyChertezh3d } from '../ZhivoyChertezh3d';
import type { ShagPodskazkiHtml } from '@/lib/stereo/opornye3/seal';
import { OPORNYE_3 } from '@/content/stereo/opornye3';
import { IkGalochka, IkLampa, IkNazad, IkVpered, IkZakryt } from '../metodika/Ikonki';

/**
 * Модель шага подсказки: та же модель задачи; со шага ② выделен
 * рабочий треугольник, с ③ отмечен прямой угол.
 */
function modelShaga(model: Model, shag: ShagPodskazkiHtml): Model {
  const r = shag.rabochaya;
  if (r === null) {
    return model;
  }
  const [a, b, c] = r.points;
  const p = r.pryamoy;
  const drugie = [a, b, c].filter(
    (q) => q !== p && (q[0] !== p[0] || q[1] !== p[1] || q[2] !== p[2]),
  );
  const u = drugie[0];
  const v = drugie[1];
  return {
    ...model,
    sections: [...(model.sections ?? []), { points: [a, b, c] }],
    angles:
      shag.n >= 3 && u !== undefined && v !== undefined
        ? [...(model.angles ?? []), { at: p, u: dir(p, u), v: dir(p, v) }]
        : (model.angles ?? []),
  };
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
  const m = useMemo(() => (shag === undefined ? model : modelShaga(model, shag)), [model, shag]);
  const az = model.rakurs?.azimuth ?? ORTHO_AZIMUTH;
  const el = model.rakurs?.elevation ?? ORTHO_ELEVATION;
  const svg = useMemo(
    () => renderSolid(m, { tema: 'ekran', view: orthoAt(az, el), ustoychivo: true }),
    [m, az, el],
  );
  if (shag === undefined) return null;
  const otvecheno = (i: number) => vybor[i] !== undefined && vybor[i] === shagi[i]?.correct;
  const v = vybor[tek];
  const verno = otvecheno(tek);

  return (
    <aside className="o3-pod" aria-label={OPORNYE_3.pod.title}>
      <header className="o3-pod__head">
        <IkLampa className="o3-pod__ik" />
        <p className="o3-pod__title">{OPORNYE_3.pod.title}</p>
        <button
          type="button"
          className="o3-pod__x"
          onClick={onClose}
          aria-label={OPORNYE_3.pod.zakryt}
        >
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
            <b>{OPORNYE_3.pod.verno}</b>{' '}
            <span dangerouslySetInnerHTML={{ __html: shag.vyvodHtml }} />
          </p>
        ) : (
          <p className="o3-pod__neverno">{OPORNYE_3.pod.neverno}</p>
        )}
        {/* Чертёж шага вращается так же, как чертёж задачи. */}
        <ZhivoyChertezh3d
          key={tek}
          model={m}
          svg={svg}
          azimuth={az}
          elevation={el}
          podpisi={[]}
          tema="ekran"
          className="o3-pod__ris"
        />
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
          <button
            type="button"
            className="btn btn--primary o3-pod__dalee"
            onClick={() => setTek(tek + 1)}
            disabled={!verno}
          >
            {OPORNYE_3.pod.dalee}
            <IkVpered />
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary o3-pod__dalee"
            onClick={onClose}
            disabled={!verno}
          >
            {OPORNYE_3.pod.gotovo}
          </button>
        )}
      </footer>
    </aside>
  );
}
