'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { TOUR_REPETITOR, howtoHref } from '@/content/onboarding';
import type { IntroDecision } from '@/components/onboarding/intro/detect';
import type { SplashInfo } from '@/components/onboarding/intro/IntroSplash';
import { startTour } from '@/lib/onboarding';
import './dev-intro.css';

const IntroSplash = dynamic(
  () => import('@/components/onboarding/intro/IntroSplash').then((m) => m.IntroSplash),
  { ssr: false },
);

type Mode = 'desktop' | 'phone' | 'reduced' | 'nowebgl';

const MODES: { id: Mode; label: string }[] = [
  { id: 'desktop', label: 'Компьютер' },
  { id: 'phone', label: 'Телефон' },
  { id: 'reduced', label: 'Reduced-motion' },
  { id: 'nowebgl', label: 'Без WebGL' },
];

const DECISION: Record<Mode, IntroDecision> = {
  desktop: { animated: true, reason: null, tier: 'high' },
  phone: { animated: true, reason: null, tier: 'low' },
  reduced: { animated: false, reason: 'reduced-motion', tier: 'high' },
  nowebgl: { animated: false, reason: 'no-webgl', tier: 'high' },
};

interface Params {
  mode: Mode;
  /** Без панели и рамки — для записи видео. */
  bare: boolean;
  /** Время задаёт скрипт записи: window.__intro.set(t). */
  manual: boolean;
  /** Проверка «меньше 30 кадров/с»: в прототипе включается явно. */
  fps: boolean;
  /** Начать без заставки (снимок памяти «до»), открыть — «Повторить». */
  closed: boolean;
  bg: string;
}

const noSubscribe = () => () => {};

function readParams(search: string): Params {
  const q = new URLSearchParams(search);
  const mode = (q.get('mode') as Mode | null) ?? 'desktop';
  return {
    mode: MODES.some((m) => m.id === mode) ? mode : 'desktop',
    bare: q.has('bare'),
    manual: q.has('manual'),
    fps: q.get('fps') === '1',
    closed: q.has('closed'),
    bg: q.get('bg') ?? '/zadaniya/12/',
  };
}

/**
 * /dev/intro — прототип заставки: вся заставка поверх настоящей
 * страницы (в фрейме), «Повторить» и режимы «компьютер / телефон /
 * reduced-motion / без WebGL». Параметры адреса — в readParams().
 */
export function DevIntro() {
  const router = useRouter();
  /* Адрес читается только в браузере: в статической разметке страницы пусто. */
  const search = useSyncExternalStore(
    noSubscribe,
    () => window.location.search,
    () => null,
  );
  const [mode, setModeState] = useState<Mode | null>(null);
  const [run, setRun] = useState(0);
  const [openState, setOpen] = useState<boolean | null>(null);
  const [info, setInfo] = useState<SplashInfo | null>(null);

  if (search === null) return null;
  const read = readParams(search);
  const params = mode === null ? read : { ...read, mode };
  const open = openState ?? !params.closed;

  const setMode = (mode: Mode) => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    window.history.replaceState(null, '', url);
    setModeState(mode);
    setRun((r) => r + 1);
    setOpen(true);
  };
  const replay = () => {
    setRun((r) => r + 1);
    setOpen(true);
  };

  const phone = params.mode === 'phone';
  const framed = phone && !params.bare;
  const splash = open ? (
    <IntroSplash
      key={`${params.mode}-${run}`}
      force={{ decision: DECISION[params.mode], ...(phone ? { sheet: true } : {}) }}
      contained={framed}
      manualClock={params.manual}
      fpsGuard={params.fps}
      onInfo={setInfo}
      onChoose={(choice) => {
        setOpen(false);
        if (choice === 'repetitor') {
          startTour('repetitor', 0);
          router.push(TOUR_REPETITOR.steps[0]!.href);
        } else {
          router.push(howtoHref('uchenik'));
        }
      }}
      onLater={() => setOpen(false)}
      onClose={() => setOpen(false)}
    />
  ) : null;

  return (
    <div className="dev-intro" data-framed={framed ? '' : undefined}>
      {framed ? (
        <div className="dev-intro__phone">
          <iframe className="dev-intro__bg" src={params.bg} title="Страница под заставкой" />
          {splash}
        </div>
      ) : (
        <>
          <iframe className="dev-intro__bg" src={params.bg} title="Страница под заставкой" />
          {splash}
        </>
      )}
      {params.bare ? null : (
        <div className="dev-intro__panel">
          <div className="dev-intro__modes" role="radiogroup" aria-label="Режим">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={params.mode === m.id}
                className="dev-intro__mode"
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button type="button" className="dev-intro__replay" onClick={replay}>
            Повторить
          </button>
          <p className="dev-intro__info">
            {info === null
              ? '…'
              : `${info.animated ? 'анимация' : 'статичный кадр'}` +
                `${info.reason !== null ? ` (${info.reason})` : ''}` +
                ` · ${info.tier === 'high' ? 'компьютер' : 'телефон'}` +
                `${info.fps !== null ? ` · ${info.fps} кадр/с` : ''}`}
          </p>
        </div>
      )}
    </div>
  );
}
