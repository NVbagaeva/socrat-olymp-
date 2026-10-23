'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { WELCOME_INTRO } from '@/content/onboarding';
import { withVersion } from '@/lib/assetUrl';
import { decideIntro, MIN_FPS, type IntroDecision, type StaticReason, type Tier } from './detect';
import { FlowerDom, layerStyle } from './flower';
import { Fx2D } from './fx2d';
import { BASE, CORE, FRAME, LAYERS, ORDER, type LayerId } from './layers.gen';
import { finalStage, introStage, stageAt, type Stage } from './stage';
import { IDLE_STOP_S, T_CARD, T_CARD_IN, T_SKIP_VISIBLE } from './timeline';
import { WelcomeCard, type WelcomeChoice } from './WelcomeCard';
import './intro.css';

export interface SplashInfo {
  animated: boolean;
  reason: StaticReason | null;
  tier: Tier;
  /** Средняя частота кадров первой секунды. */
  fps: number | null;
}

export interface IntroSplashProps {
  onChoose: (choice: WelcomeChoice) => void;
  /** «Сначала осмотрюсь». */
  onLater: () => void;
  /** Крестик, Esc или клик мимо окна. */
  onClose: () => void;
  /** Для прототипа и проверок: режим, уровень детализации, раскладка. */
  force?: { decision?: IntroDecision; sheet?: boolean };
  /** Внутри рамки (прототип «телефон»), а не на весь экран. */
  contained?: boolean;
  /** Время задаёт window.__intro.set(t) — для записи видео по кадрам. */
  manualClock?: boolean;
  /** Падать в статичный кадр при < 30 кадров/с. В прототипе отключаемо. */
  fpsGuard?: boolean;
  onInfo?: (info: SplashInfo) => void;
}

declare global {
  interface Window {
    __intro?: { set: (t: number) => Promise<void> };
  }
}

/** Слои анимации: октаэдр, корона, затем цветок снизу вверх. A — статичный режим. */
const FLOWER: readonly LayerId[] = ['F', 'G', ...ORDER];

/* Версии слоёв — своя таблица, не общая (next.config.ts): общая идёт в
   первую загрузку каждой страницы, а этот код — только с заставкой. */
let introVersions: Record<string, string> | null = null;
function layerVersions(): Record<string, string> {
  if (introVersions === null) {
    try {
      introVersions = JSON.parse(process.env.INTRO_ASSET_VERSIONS ?? '{}') as Record<
        string,
        string
      >;
    } catch {
      introVersions = {};
    }
  }
  return introVersions;
}

/** Файл слоя для этой ширины рамки на экране (CSS px). */
function layerSrc(id: LayerId, frameCssPx: number, ext: 'webp' | 'png'): string {
  const dpr = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  const width = frameCssPx * dpr > 900 ? 1536 : 768;
  return withVersion(`/intro/${LAYERS[id].file}-${width}.${ext}`, layerVersions());
}

function preload(srcs: string[]): Promise<void> {
  return Promise.all(
    srcs.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.src = src;
          img.decode().then(resolve, () => resolve());
        }),
    ),
  ).then(() => undefined);
}

/**
 * Заставка первого визита (макеты docs/mockups/intro/): анимация готовых
 * слоёв с прозрачным фоном (flower.ts) — октаэдр, корона, чашечка и ярусы
 * цветка; частицы и искры — canvas 2D (fx2d.ts). Статичный режим — сразу
 * собранный цветок A и окно; слои анимации тогда не грузятся.
 *
 * «Пропустить», Esc и клик по фону во время анимации ведут к финальному
 * кадру с окном. Когда окно на месте, Esc и клик мимо окна его закрывают.
 */
export function IntroSplash(props: IntroSplashProps) {
  const {
    onChoose,
    onLater,
    onClose,
    force,
    contained = false,
    manualClock = false,
    fpsGuard = true,
    onInfo,
  } = props;
  const root = useRef<HTMLDivElement>(null);
  const canvasFx = useRef<HTMLCanvasElement>(null);
  const stageEl = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const leadId = useId();

  const [decision] = useState<IntroDecision>(() => force?.decision ?? decideIntro());
  const [animated, setAnimated] = useState(decision.animated);
  const [reason, setReason] = useState<StaticReason | null>(decision.reason);
  const [cardShown, setCardShown] = useState(!decision.animated);
  const [skipShown, setSkipShown] = useState(false);
  const [sheet, setSheet] = useState(force?.sheet ?? false);
  const [view, setView] = useState<{ w: number; h: number } | null>(null);
  const [stages, setStages] = useState<{ intro: Stage; final: Stage } | null>(null);
  const skipRequest = useRef<() => void>(() => {});
  const skippedEarly = useRef(false);
  const redraw = useRef<() => void>(() => {});
  const stagesRef = useRef<{ intro: Stage; final: Stage } | null>(null);
  const fps = useRef<number | null>(null);

  const info = useCallback(
    (patch?: Partial<SplashInfo>) => {
      onInfo?.({
        animated,
        reason,
        tier: decision.tier,
        fps: fps.current,
        ...patch,
      });
    },
    [animated, reason, decision.tier, onInfo],
  );

  /* Размер и раскладка: на узком экране окно — нижний лист. */
  useLayoutEffect(() => {
    const el = root.current;
    if (el === null) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setView((v) => (v !== null && v.w === w && v.h === h ? v : { w, h }));
      setSheet(force?.sheet ?? w < 640);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [force?.sheet]);

  /* Где цветок: в центре кадра и над окном (окно в разметке с начала). */
  useLayoutEffect(() => {
    const el = card.current;
    if (el === null || view === null) return;
    const next = {
      intro: introStage(view, sheet),
      final: finalStage(view, { top: el.offsetTop, cx: el.offsetLeft + el.offsetWidth / 2 }, sheet),
    };
    stagesRef.current = next;
    setStages(next);
  }, [view, sheet]);

  /* Статичный режим: собранный цветок над окном. */
  useLayoutEffect(() => {
    if (animated || stages === null || stageEl.current === null) return;
    new FlowerDom(stageEl.current).renderStatic(stages.final);
  }, [animated, stages]);

  useEffect(() => {
    if (view === null) return;
    redraw.current();
  }, [view, stages]);

  const goStatic = useCallback((why: StaticReason) => {
    setReason(why);
    setAnimated(false);
    setCardShown(true);
  }, []);

  /* Анимация: сначала слои (картинки), потом часы.  */
  const ready = view !== null && stages !== null;
  useEffect(() => {
    if (!animated || !ready || stageEl.current === null || canvasFx.current === null) return;
    let disposed = false;
    let raf = 0;
    let start: number | null = null;
    let offset = skippedEarly.current ? T_CARD : 0;
    let hiddenAt: number | null = null;
    let stopped = false;
    let checked = !fpsGuard || skippedEarly.current;
    let frames = 0;
    let last = offset;
    let skipLocal = false;
    let cardLocal = skippedEarly.current;
    const v = view;
    const flower = new FlowerDom(stageEl.current);
    const fx = new Fx2D(canvasFx.current, decision.tier === 'low');
    fx.setView(v.w, v.h);

    const frameCss = Math.max(stages.intro.k, stages.final.k) * FRAME;
    const layersLoad = preload(FLOWER.map((id) => layerSrc(id, frameCss, 'webp')));

    const step = (t: number) => {
      const st = stagesRef.current;
      if (st === null) return;
      const stage = stageAt(t, st.intro, st.final);
      flower.render(t, stage);
      fx.render(t, stage);
      last = t;
      if (!skipLocal && t >= T_SKIP_VISIBLE) {
        skipLocal = true;
        setSkipShown(true);
      }
      if (!cardLocal && t >= T_CARD_IN) {
        cardLocal = true;
        setCardShown(true);
      }
    };

    const tick = (now: number) => {
      raf = 0;
      if (disposed) return;
      if (start === null) start = now;
      const t = (now - start) / 1000 + offset;
      if (!checked) {
        frames += 1;
        if (now - start >= 1000) {
          checked = true;
          fps.current = Math.round((frames * 1000) / (now - start));
          if (fps.current < MIN_FPS) {
            goStatic('slow');
            return;
          }
        }
      }
      step(t);
      if (t >= IDLE_STOP_S) {
        /* Замерли на финальном кадре — батарею больше не тратим. */
        stopped = true;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (raf !== 0) cancelAnimationFrame(raf);
        raf = 0;
        hiddenAt = performance.now();
      } else if (hiddenAt !== null) {
        if (start !== null) start += performance.now() - hiddenAt;
        hiddenAt = null;
        if (!stopped && !manualClock && raf === 0) raf = requestAnimationFrame(tick);
      }
    };

    redraw.current = () => {
      fx.setView(root.current?.clientWidth ?? v.w, root.current?.clientHeight ?? v.h);
      step(last);
    };

    skipRequest.current = () => {
      checked = true;
      if (manualClock) step(Math.max(last, T_CARD));
      else if (last < T_CARD) offset += T_CARD - last;
      cardLocal = true;
      setCardShown(true);
    };

    const begin = () => {
      if (disposed) return;
      if (manualClock) {
        window.__intro = {
          set: async (t: number) => {
            await layersLoad;
            step(t);
          },
        };
        step(offset);
      } else {
        raf = requestAnimationFrame(tick);
      }
      document.addEventListener('visibilitychange', onVisibility);
    };

    /* Часы стартуют, когда слои скачаны и раскодированы: иначе кадры
       первых долей секунды пропали бы. Скачивание — сразу после того,
       как страница стала интерактивной (чанк заставки грузится тогда же). */
    void layersLoad.then(begin);

    return () => {
      disposed = true;
      if (raf !== 0) cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      skipRequest.current = () => {};
      redraw.current = () => {};
      if (window.__intro !== undefined) delete window.__intro;
    };
    /* Анимация запускается один раз на показ; размер — через stagesRef. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated, ready]);

  useEffect(() => {
    info();
  }, [info, cardShown]);

  const skip = useCallback(() => {
    if (cardShown) return;
    skippedEarly.current = true;
    skipRequest.current();
    setCardShown(true);
  }, [cardShown]);

  /* Фокус: в заставку при открытии, в окно — когда оно появилось;
     после закрытия — туда, где был. */
  useEffect(() => {
    const restore = document.activeElement as HTMLElement | null;
    root.current?.focus({ preventScroll: true });
    return () => restore?.focus?.({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (cardShown) card.current?.focus({ preventScroll: true });
  }, [cardShown]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (cardShown) onClose();
      else skip();
      return;
    }
    if (event.key !== 'Tab' || root.current === null) return;
    const nodes = Array.from(
      root.current.querySelectorAll<HTMLElement>('button:not([tabindex="-1"])'),
    );
    const first = nodes[0];
    const lastNode = nodes[nodes.length - 1];
    if (first === undefined || lastNode === undefined) {
      event.preventDefault();
      return;
    }
    if (
      event.shiftKey &&
      (document.activeElement === first || document.activeElement === root.current)
    ) {
      event.preventDefault();
      lastNode.focus();
    } else if (!event.shiftKey && document.activeElement === lastNode) {
      event.preventDefault();
      first.focus();
    }
  };

  const frameCss = stages === null ? 600 : Math.max(stages.intro.k, stages.final.k) * FRAME;
  const layersShown: readonly LayerId[] = animated ? FLOWER : ['A'];

  return (
    <div
      ref={root}
      className={contained ? 'intro intro--contained' : 'intro'}
      role="dialog"
      aria-modal="true"
      aria-labelledby={cardShown ? titleId : undefined}
      aria-describedby={cardShown ? leadId : undefined}
      aria-label={cardShown ? undefined : WELCOME_INTRO.splash}
      tabIndex={-1}
      data-mode={animated ? 'animated' : 'static'}
      data-reason={reason ?? undefined}
      data-phase={cardShown ? 'card' : 'play'}
      onKeyDown={onKeyDown}
    >
      <div
        className="intro__veil"
        aria-hidden="true"
        onMouseDown={() => (cardShown ? onClose() : skip())}
      />
      {/* Цветок из слоёв: рамка A, положение и масштаб — из stage.ts. */}
      <div
        ref={stageEl}
        className="intro__stage"
        aria-hidden="true"
        style={{ width: FRAME, height: FRAME }}
      >
        {/* Световое пятно на «полу» под нижней вершиной — под слоями. */}
        <span className="intro__floor" data-floor="" style={floorStyle()} />
        {stages !== null
          ? layersShown.map((id) => (
              <picture key={id}>
                <source type="image/webp" srcSet={layerSrc(id, frameCss, 'webp')} />
                {/* Слой цветка: рамка в системе слоя A. */}
                <img
                  className="intro__layer"
                  data-layer={id}
                  src={layerSrc(id, frameCss, 'png')}
                  alt=""
                  decoding="async"
                  draggable={false}
                  style={{ ...layerStyle(id), opacity: 0, visibility: 'hidden' }}
                />
              </picture>
            ))
          : null}
        {animated && stages !== null ? (
          <>
            {(['F', 'C', 'D'] as const).map((id) => (
              <span
                key={`g${id}`}
                className="intro__glint"
                data-glint={id}
                style={{
                  ...layerStyle(id),
                  WebkitMaskImage: `url(${layerSrc(id, frameCss, 'webp')})`,
                  maskImage: `url(${layerSrc(id, frameCss, 'webp')})`,
                }}
              />
            ))}
            <span className="intro__core" data-core="" style={coreStyle()} />
          </>
        ) : null}
      </div>
      {animated ? <span className="intro__halo" data-halo="" aria-hidden="true" /> : null}
      {animated ? <canvas ref={canvasFx} className="intro__canvas" aria-hidden="true" /> : null}
      {animated ? <span className="intro__flash" data-flash="" aria-hidden="true" /> : null}
      <WelcomeCard
        ref={card}
        titleId={titleId}
        leadId={leadId}
        sheet={sheet}
        shown={cardShown}
        onChoose={onChoose}
        onLater={onLater}
        onClose={onClose}
      />
      {animated && !cardShown ? (
        <button
          type="button"
          className="intro__skip"
          data-shown={skipShown ? '' : undefined}
          tabIndex={skipShown ? 0 : -1}
          onClick={skip}
        >
          {WELCOME_INTRO.skip}
        </button>
      ) : null}
    </div>
  );
}

/** Пятно света под основанием: широкий эллипс и тонкая полоса. */
function floorStyle(): Record<string, string | number> {
  const w = 1150;
  const h = 190;
  return { left: BASE.x - w / 2, top: BASE.y - h / 2, width: w, height: h, opacity: 0 };
}

/** Свет сердцевины — в центре свечения тычинок. */
function coreStyle(): Record<string, string | number> {
  const r = LAYERS.E.w * 0.62;
  return {
    left: CORE.x - r,
    top: CORE.y - r,
    width: r * 2,
    height: r * 2,
    opacity: 0,
  };
}
