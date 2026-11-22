'use client';

import { clsx } from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import { VSTRECHA11 } from '@/content/tekstovye11';

/**
 * «Встречное движение» — живая иллюстрация №11 на «О задании»: два
 * путника выходят из городов А и В навстречу друг другу, по кнопке
 * идут и встречаются там, где делит их отношение скоростей. Рисунок —
 * SVG в тонах сцены (синий и терракотовый путники, стеклянные города),
 * движение — CSS: при prefers-reduced-motion путники сразу встают в
 * точку встречи. Числа примера — в content/tekstovye11.ts.
 */

const T = VSTRECHA11;
/** Дорога на рисунке: от края города А до края города В, px. */
const DOROGA = { ot: 118, do: 522 };
/** Доля пути первого путника до встречи: v₁ / (v₁ + v₂). */
const DOLYA = T.v1 / (T.v1 + T.v2);
const VSTRECHA_X = DOROGA.ot + (DOROGA.do - DOROGA.ot) * DOLYA;
/** Длительность хода, с: одинаковая у обоих — встречаются одновременно. */
const SEK = 5;

function Putnik({ ton, x, idyot }: { ton: 'sin' | 'terra'; x: number; idyot: boolean }) {
  return (
    <g
      className={clsx('z11-vst__putnik', `z11-vst__putnik--${ton}`, idyot && 'is-idyot')}
      style={
        {
          '--x': `${x}px`,
          /* Встают по обе стороны флажка — лицом друг к другу. */
          '--cel': `${VSTRECHA_X + (ton === 'sin' ? -18 : 18)}px`,
        } as React.CSSProperties
      }
      transform={ton === 'terra' ? 'scale(-1,1)' : undefined}
    >
      <circle className="z11-vst__ten" cx="0" cy="166" r="14" />
      {/* Ноги */}
      <path className="z11-vst__noga z11-vst__noga--l" d="M0 128 L-8 160" />
      <path className="z11-vst__noga z11-vst__noga--r" d="M0 128 L8 160" />
      {/* Туловище */}
      <path className="z11-vst__telo" d="M0 94 C2 104 2 118 0 130" />
      {/* Руки */}
      <path className="z11-vst__ruka z11-vst__ruka--l" d="M0 102 L-10 124" />
      <path className="z11-vst__ruka z11-vst__ruka--r" d="M0 102 L11 122" />
      {/* Голова */}
      <circle className="z11-vst__golova" cx="0" cy="82" r="9" />
      {/* Рюкзак */}
      <path className="z11-vst__ryukzak" d="M-4 100 q-9 2 -9 12 v6 q0 6 6 6 h3z" />
    </g>
  );
}

function Gorod({ x, bukva, ton }: { x: number; bukva: string; ton: 'sin' | 'terra' }) {
  const zerkalno = ton === 'terra';
  return (
    <g className={clsx('z11-vst__gorod', `z11-vst__gorod--${ton}`)} transform={`translate(${x} 0)`}>
      <g transform={zerkalno ? 'scale(-1,1)' : undefined}>
        <rect x="-46" y="98" width="22" height="66" rx="4" />
        <rect x="-20" y="72" width="26" height="92" rx="5" />
        <rect x="10" y="112" width="30" height="52" rx="4" />
        <rect x="-8" y="58" width="6" height="16" rx="2" className="z11-vst__shpil" />
        <g className="z11-vst__okna">
          <rect x="-15" y="82" width="5" height="7" rx="1" />
          <rect x="-5" y="82" width="5" height="7" rx="1" />
          <rect x="-15" y="96" width="5" height="7" rx="1" />
          <rect x="-5" y="96" width="5" height="7" rx="1" />
          <rect x="-15" y="110" width="5" height="7" rx="1" />
          <rect x="-5" y="110" width="5" height="7" rx="1" />
          <rect x="-40" y="108" width="5" height="6" rx="1" />
          <rect x="-32" y="108" width="5" height="6" rx="1" />
          <rect x="17" y="122" width="5" height="6" rx="1" />
          <rect x="27" y="122" width="5" height="6" rx="1" />
        </g>
      </g>
      <text x="0" y="192" className="z11-vst__bukva" textAnchor="middle">
        {bukva}
      </text>
    </g>
  );
}

export function Vstrecha11() {
  const [idyot, setIdyot] = useState(false);
  const [vstretilis, setVstretilis] = useState(false);
  const taymer = useRef<number | null>(null);
  const id = useId();

  useEffect(
    () => () => {
      if (taymer.current !== null) window.clearTimeout(taymer.current);
    },
    [],
  );

  function otpravit() {
    if (idyot) {
      setIdyot(false);
      setVstretilis(false);
      if (taymer.current !== null) window.clearTimeout(taymer.current);
      return;
    }
    setIdyot(true);
    const srazu = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    taymer.current = window.setTimeout(() => setVstretilis(true), srazu ? 50 : SEK * 1000);
  }

  return (
    <section className="z11-vst stk-glass" aria-labelledby={`${id}-zag`}>
      <div className="z11-vst__text">
        <p className="stk-nad">{T.nad}</p>
        <h3 className="stk-h4" id={`${id}-zag`}>
          {T.zag}
        </h3>
        <p className="z11-vst__lead">
          <Tex text={T.lead} />
        </p>
      </div>

      <svg
        className={clsx('z11-vst__svg', idyot && 'is-idyot', vstretilis && 'is-vstretilis')}
        viewBox="0 0 640 210"
        role="img"
        aria-label={T.alt}
        style={{ '--sek': `${SEK}s` } as React.CSSProperties}
      >
        <defs>
          <linearGradient id={`${id}-nebo`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#eaf1ff" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-doroga`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#1f5fd0" />
            <stop offset="1" stopColor="#c4553a" />
          </linearGradient>
          <radialGradient id={`${id}-vspyshka`}>
            <stop offset="0" stopColor="#ffd27a" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="640" height="210" fill={`url(#${id}-nebo)`} />
        {/* Дорога */}
        <line className="z11-vst__zemlya" x1="40" y1="166" x2="600" y2="166" />
        <line
          className="z11-vst__doroga"
          x1={DOROGA.ot}
          y1="166"
          x2={DOROGA.do}
          y2="166"
          stroke={`url(#${id}-doroga)`}
        />
        <line
          className="z11-vst__proyden"
          x1={DOROGA.ot}
          y1="166"
          x2={DOROGA.do}
          y2="166"
          style={{ '--ot': DOROGA.ot, '--do': DOROGA.do, '--x': VSTRECHA_X } as React.CSSProperties}
        />
        {/* Точка встречи */}
        <g className="z11-vst__tochka" transform={`translate(${VSTRECHA_X} 166)`}>
          <circle className="z11-vst__vspyshka" r="46" fill={`url(#${id}-vspyshka)`} />
          <circle className="z11-vst__flazhok" r="5" />
          <path className="z11-vst__flazhok-drevko" d="M0 -6 V-40 l18 6 -18 6" />
        </g>

        {/* Пройденные отрезки: подписи появляются после встречи. */}
        <g className="z11-vst__otrezki">
          <text
            x={(DOROGA.ot + VSTRECHA_X) / 2}
            y="188"
            textAnchor="middle"
            className="z11-vst__otrezok z11-vst__otrezok--sin"
          >
            {T.otrezok(T.v1 * T.chasov)}
          </text>
          <text
            x={(VSTRECHA_X + DOROGA.do) / 2}
            y="188"
            textAnchor="middle"
            className="z11-vst__otrezok z11-vst__otrezok--terra"
          >
            {T.otrezok(T.v2 * T.chasov)}
          </text>
        </g>

        <Gorod x={66} bukva="А" ton="sin" />
        <Gorod x={574} bukva="В" ton="terra" />

        <Putnik ton="sin" x={DOROGA.ot} idyot={idyot} />
        <Putnik ton="terra" x={DOROGA.do} idyot={idyot} />
      </svg>

      <div className="z11-vst__niz">
        <button
          type="button"
          className={clsx('stk-btn', idyot ? 'stk-btn--tihaya' : 'stk-btn--primary')}
          onClick={otpravit}
          aria-pressed={idyot}
        >
          {idyot ? T.snachala : T.otpravit}
        </button>
        <p className={clsx('z11-vst__itog', vstretilis && 'is-vidno')} aria-live="polite">
          {vstretilis ? <Tex text={T.itog} /> : null}
        </p>
      </div>
    </section>
  );
}
