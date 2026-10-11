'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { WELCOME_INTRO } from '@/content/onboarding';
import { assetUrl } from '@/lib/assetUrl';
import { decideIntro, MIN_FPS, type IntroDecision, type StaticReason } from './detect';
import { STILL, finalAnchor, stillBox, type Anchor } from './layout';
import type { IntroScene, SceneLayout, Tier } from './scene';
import { IDLE_STOP_S, T_CARD, T_CARD_IN, T_SKIP_VISIBLE } from './timeline';
import { WelcomeCard, type WelcomeChoice } from './WelcomeCard';
import './intro.css';

export interface SplashInfo {
  animated: boolean;
  reason: StaticReason | null;
  tier: Tier;
  /** Средняя частота кадров первой секунды (после неё). */
  fps: number | null;
  /** Живые объекты WebGL; после закрытия — 0. */
  liveObjects: number;
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
    __intro?: { set: (t: number) => void };
  }
}

/**
 * Заставка первого визита: стеклянный октаэдр → цветок → окно
 * приветствия (макеты docs/mockups/intro/). Сцена — отдельный чанк
 * scene.ts: в статичном режиме его даже не скачивают.
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
  const canvas = useRef<HTMLCanvasElement>(null);
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
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const scene = useRef<IntroScene | null>(null);
  const skipRequest = useRef<() => void>(() => {});
  /* «Пропустить» нажали раньше, чем загрузилась сцена. */
  const skippedEarly = useRef(false);
  /* Последняя раскладка и перерисовка последнего кадра — для смены размера
     после остановки (холст при смене размера очищается). */
  const layoutRef = useRef<SceneLayout | null>(null);
  const redraw = useRef<() => void>(() => {});
  const fps = useRef<number | null>(null);

  const info = useCallback(
    (patch?: Partial<SplashInfo>) => {
      onInfo?.({
        animated,
        reason,
        tier: decision.tier,
        fps: fps.current,
        liveObjects: scene.current?.liveObjects() ?? 0,
        ...patch,
      });
    },
    [animated, reason, decision.tier, onInfo],
  );

  /* Размер холста и раскладка: на узком экране окно — нижний лист. */
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

  /* Место окна → где встанет цветок. Окно в разметке с самого начала. */
  useLayoutEffect(() => {
    const el = card.current;
    if (el === null || view === null) return;
    const top = el.offsetTop;
    const cx = el.offsetLeft + el.offsetWidth / 2;
    setAnchor((a) => {
      const next = finalAnchor(view, { top, cx }, sheet);
      return a !== null && a.x === next.x && a.y === next.y && a.unitPx === next.unitPx ? a : next;
    });
  }, [view, sheet]);

  useEffect(() => {
    if (view === null || anchor === null) return;
    layoutRef.current = { w: view.w, h: view.h, final: anchor, phone: sheet };
    if (scene.current !== null) {
      scene.current.setLayout(layoutRef.current);
      redraw.current();
    }
  }, [view, anchor, sheet]);

  const goStatic = useCallback((why: StaticReason) => {
    setReason(why);
    setAnimated(false);
    setCardShown(true);
  }, []);

  /* Живая сцена: загрузить чанк, крутить кадры, пауза в скрытой вкладке. */
  const ready = view !== null && anchor !== null;
  useEffect(() => {
    if (!animated || !ready) return;
    let disposed = false;
    let raf = 0;
    let start: number | null = null;
    let offset = 0;
    let hiddenAt: number | null = null;
    let stopped = false;
    let checked = !fpsGuard;
    let frames = 0;
    let last = 0;
    let skipShownLocal = false;
    let cardShownLocal = false;

    const step = (t: number) => {
      const s = scene.current;
      if (s === null) return;
      s.render(t);
      last = t;
      if (!skipShownLocal && t >= T_SKIP_VISIBLE) {
        skipShownLocal = true;
        setSkipShown(true);
      }
      if (!cardShownLocal && t >= T_CARD_IN) {
        cardShownLocal = true;
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
      if (start !== null || manualClock) scene.current?.render(last);
    };

    skipRequest.current = () => {
      checked = true;
      if (manualClock) {
        step(Math.max(last, T_CARD));
      } else if (last < T_CARD) {
        offset += T_CARD - last;
      }
      cardShownLocal = true;
      setCardShown(true);
    };

    void import('./scene').then(({ createIntroScene }) => {
      if (disposed || canvas.current === null) return;
      let created: IntroScene | null = null;
      try {
        created = createIntroScene(canvas.current, decision.tier);
      } catch {
        created = null;
      }
      if (created === null) {
        goStatic('no-webgl');
        return;
      }
      scene.current = created;
      created.setLayout(layoutRef.current!);
      if (skippedEarly.current) {
        checked = true;
        offset = T_CARD;
      }
      if (manualClock) {
        window.__intro = { set: (t: number) => step(t) };
        step(offset);
      } else {
        raf = requestAnimationFrame(tick);
      }
      document.addEventListener('visibilitychange', onVisibility);
    });

    return () => {
      disposed = true;
      if (raf !== 0) cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      skipRequest.current = () => {};
      redraw.current = () => {};
      if (window.__intro !== undefined) delete window.__intro;
      scene.current?.dispose();
      scene.current = null;
    };
    /* Сцена создаётся один раз на показ; размер меняется через setLayout. */
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

  const still = !animated && anchor !== null ? stillBox(anchor) : null;
  const small = view !== null && view.w < 640;

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
      {animated ? <canvas ref={canvas} className="intro__canvas" aria-hidden="true" /> : null}
      {still !== null ? (
        // Готовый кадр той же сцены: в статичном режиме вместо холста.
        <img
          className="intro__still"
          src={assetUrl(small ? STILL.srcSmall : STILL.src)}
          alt=""
          aria-hidden="true"
          style={{ left: still.left, top: still.top, width: still.width, height: still.height }}
        />
      ) : null}
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
