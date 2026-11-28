'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Mark, Model } from '@/lib/solid/model';
import { ORTHO_AZIMUTH, ORTHO_ELEVATION, orthoAt } from '@/lib/solid/project';
import { renderSolid } from '@/lib/solid/render';
import { postroitSechenie, telo, tochkiVybora, vidSecheniya } from '@/lib/solid/sechenie';
import { SECHENIE3 as T } from '@/content/zadanie3/spravka';
import { VrashchaemyyChertezh } from './vrashchenie/VrashchaemyyChertezh';
import type { Vid } from './vrashchenie/useVrashchenie';

/** Цель касания на экране не уже этого, px. */
const CEL_PX = 44;
/** Буквы для новых точек сечения на рёбрах. */
const BUKVY = 'KLMNPQRTUW';

/** «B1» → «B₁»: имя вершины для текста. */
function krasivo(imya: string): string {
  return imya.replace(/(\d+)/g, (d) => [...d].map((c) => '₀₁₂₃₄₅₆₇₈₉'[Number(c)]).join(''));
}

/** Есть ли в модели многогранник, в котором можно строить сечение. */
export function mozhnoSechenie(model: Model): boolean {
  return telo(model) !== null;
}

/**
 * Построение сечения на живом чертеже: ученик отмечает три точки —
 * вершины или середины рёбер, — и плоскость через них режет тело.
 * Короткое касание отмечает точку, перетаскивание вращает фигуру
 * (как в задачах «нажми на чертеже»). Четвёртое касание начинает
 * новое сечение с этой точки.
 */
export function PostroitSechenie({ model }: { model: Model }) {
  const poly = useMemo(() => telo(model), [model]);
  const tochki = useMemo(() => (poly === null ? [] : tochkiVybora(poly)), [poly]);
  const [vybrano, setVybrano] = useState<string[]>([]);
  const az0 = model.rakurs?.azimuth ?? ORTHO_AZIMUTH;
  const el0 = model.rakurs?.elevation ?? ORTHO_ELEVATION;
  const [vid, setVid] = useState<Vid>({ az: az0, el: el0, zum: 1 });
  const [naPiksel, setNaPiksel] = useState(1);
  const kholst = useRef<HTMLDivElement>(null);
  const [pamyat] = useState(() => new Map<string, number>());

  const vybor = vybrano
    .map((id) => tochki.find((t) => t.id === id))
    .filter((t) => t !== undefined);
  const sech =
    poly !== null && vybor.length === 3
      ? postroitSechenie(poly, vybor[0]!.p, vybor[1]!.p, vybor[2]!.p)
      : null;

  /* Имена вершин сечения: вершина тела — своё имя, точка на ребре —
     новая буква (середины рёбер, отмеченные учеником, — тоже). */
  const imena = useMemo(() => {
    if (sech === null || poly === null) return [];
    const zanyato = new Set((poly.names ?? []).filter((n): n is string => n !== null));
    const svobodnye = [...BUKVY].filter((b) => !zanyato.has(b));
    let k = 0;
    return sech.imena.map((n) => n ?? svobodnye[k++] ?? `X${k}`);
  }, [sech, poly]);

  const svg = useMemo(() => {
    const marks: Mark[] = [];
    if (sech !== null) {
      sech.points.forEach((p, i) => {
        if (sech.imena[i] === null) marks.push({ p, label: imena[i] ?? '' });
      });
    } else {
      vybor.forEach((t) => {
        if (!t.vershina) marks.push({ p: t.p });
      });
    }
    const m: Model = {
      ...model,
      lines: [],
      angles: [],
      measures: [],
      notes: [],
      sections: sech === null ? [] : [{ points: sech.points, shag: 1 }],
      marks,
    };
    return renderSolid(m, {
      tema: 'ekran',
      view: orthoAt(vid.az, vid.el),
      ustoychivo: true,
      pamyatPodpisey: pamyat,
      shag: 1,
      celi: tochki.map((t) => ({ id: t.id, points: [t.p, t.p] })),
      vybrano,
      celShirina: Math.max(22, (CEL_PX * naPiksel) / vid.zum),
    });
  }, [model, sech, imena, vybor, vid, naPiksel, pamyat, tochki, vybrano]);

  useEffect(() => {
    const node = kholst.current;
    if (node === null || typeof ResizeObserver === 'undefined') return undefined;
    const izmerit = () => {
      const el = node.querySelector('svg');
      const w = el?.viewBox.baseVal.width ?? 0;
      const px = el?.getBoundingClientRect().width ?? 0;
      if (w > 0 && px > 0) {
        const next = Math.round((w / px) * vid.zum * 100) / 100;
        setNaPiksel((prev) => (Math.abs(prev - next) > 0.02 ? next : prev));
      }
    };
    izmerit();
    const ro = new ResizeObserver(izmerit);
    ro.observe(node);
    return () => ro.disconnect();
  }, [vid.zum]);

  function otmetit(id: string) {
    setVybrano((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [id];
      return [...prev, id];
    });
  }

  let status: string;
  if (vybor.length < 3) {
    status =
      vybor.length === 0
        ? T.podskazka
        : T.otmecheno(vybor.map((t) => krasivo(t.imya)).join(', '), 3 - vybor.length);
  } else if (sech === null) {
    status = T.naOdnoyPryamoy;
  } else {
    status = T.gotovo(vidSecheniya(sech.points.length), imena.map(krasivo).join(''));
  }

  if (poly === null) return null;
  return (
    <div className="z3-sechenie">
      <VrashchaemyyChertezh az={az0} el={el0} onVid={setVid} alt={model.alt}>
        <div
          ref={kholst}
          className="z3d__kholst solid-wrap z3-sechenie__ris"
          onClick={(event) => {
            const id = (event.target as Element).closest('[data-cel]')?.getAttribute('data-cel');
            if (id) otmetit(id);
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </VrashchaemyyChertezh>
      <div className="z3-sechenie__panel">
        <p className="z3-sechenie__status" aria-live="polite">
          {status}
        </p>
        {vybrano.length > 0 ? (
          <button type="button" className="stk-ssylka" onClick={() => setVybrano([])}>
            {T.sbrosit}
          </button>
        ) : null}
      </div>
      {/* Те же точки кнопками: с клавиатуры и экранной читалкой. */}
      <details className="z3-sechenie__spisok">
        <summary className="stk-ssylka">{T.spisok}</summary>
        <div className="z3-sechenie__knopki">
          {tochki.map((t) => (
            <button
              key={t.id}
              type="button"
              className="z3-sechenie__tochka"
              aria-pressed={vybrano.includes(t.id)}
              onClick={() => otmetit(t.id)}
            >
              {krasivo(t.imya)}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
