'use client';

import { useState } from 'react';
import { CELI, uchitelyam } from '@/content/uchitelyam';
import { cel } from '@/lib/metrika';

const { byloStalo: t, kartinki } = uchitelyam;

/**
 * Экран 2. Две картинки одного размера друг на друге: снизу исходник,
 * сверху готовый лист, обрезанный ползунком. Ползунок — обычный range,
 * им можно управлять с клавиатуры и программой чтения с экрана.
 */
export function ByloStalo() {
  const [pokaz, setPokaz] = useState(50);
  const [trogal, setTrogal] = useState(false);

  return (
    <section className="band band--soft" id="bylo-stalo" aria-labelledby="bs-title">
      <div className="wrap split svc-bs">
        <div>
          <h2 className="svc-h2" id="bs-title">
            {t.title}
          </h2>
          <p>{t.lead}</p>
        </div>
        <div className="svc-compare" style={{ ['--pokaz' as string]: `${pokaz}%` }}>
          <img
            className="svc-compare__img"
            src={kartinki.ishodnik}
            width={kartinki.shirina}
            height={kartinki.vysota}
            alt="Исходник: рукописная самостоятельная"
            loading="lazy"
          />
          <img
            className="svc-compare__img svc-compare__img--top"
            src={kartinki.listy[0]}
            width={kartinki.shirina}
            height={kartinki.vysota}
            alt="Готовый лист: та же работа, набранная и свёрстанная"
            loading="lazy"
          />
          <span className="svc-compare__line" aria-hidden="true" />
          <span className="svc-chip svc-compare__bylo">{t.bylo}</span>
          <span className="svc-chip svc-chip--after svc-compare__stalo">{t.stalo}</span>
          <input
            className="svc-compare__range"
            type="range"
            min={0}
            max={100}
            value={pokaz}
            aria-label={t.slider}
            onChange={(e) => {
              setPokaz(Number(e.target.value));
              if (!trogal) {
                setTrogal(true);
                cel(CELI.primer, { chto: 'polzunok' });
              }
            }}
          />
        </div>
      </div>
    </section>
  );
}
