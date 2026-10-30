'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import {
  RUCHKA_R,
  ramkaKadra,
  raskladka,
  smeshatRamki,
  type Ekran,
  type Sostoyanie,
} from '@/lib/skhemy/ekran';
import type { Ramka, T2, Tochki, Vid, ZhivayaSkhema } from '@/lib/skhemy/tipy';
import { BUKVY } from '@/lib/risunki/shrifty.js';
import './skhemy.css';

/** Длительность подстройки рамки (масштаба) под новое содержимое, мс. */
const DUR_RAMKI = 320;
/** Шаг стрелок клавиатуры, px экрана. */
const SHAG_KLAVISH = 6;
const NET_RUCHEK: readonly string[] = [];

export interface ChertezhSkhemyProps {
  skhema: ZhivayaSkhema;
  t: Tochki;
  vid: Vid;
  sost: Sostoyanie;
  /** Задан — подвижные точки можно тянуть. */
  onTochki?: (t: Tochki) => void;
  /** Подпись для чтения с экрана. */
  opisanie: string;
  /** Подпись ручки точки для чтения с экрана. */
  podpisRuchki?: (imya: string) => string;
  /** Высота как доля ширины; не выше maxVysota. */
  dolyaVysoty?: number;
  maxVysota?: number;
  className?: string;
}

function umenshitDvizhenie(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Живой чертёж ключевой схемы (движок lib/skhemy).
 *
 * Чертёж рисуется в пикселях своего блока: ширина измеряется, и при
 * любом экране буквы, дуги и засечки одного размера — на телефоне
 * подписи не мельчают. Рамка (масштаб) плавно подстраивается под то,
 * что видно: зажглась описанная окружность — чертёж отъезжает, чтобы
 * она поместилась. Пока вершину тянут, рамка заморожена — точка не
 * «уплывает» из-под пальца.
 *
 * Перетаскивание — Pointer Events (мышь, палец, перо) с захватом
 * указателя; кадры не чаще requestAnimationFrame. С клавиатуры точка
 * выбирается Tab и двигается стрелками.
 */
export function ChertezhSkhemy({
  skhema,
  t,
  vid,
  sost,
  onTochki,
  opisanie,
  podpisRuchki,
  dolyaVysoty = 0.72,
  maxVysota = 460,
  className,
}: ChertezhSkhemyProps) {
  const obertka = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [W, setW] = useState(560);
  const H = Math.round(Math.min(maxVysota, Math.max(160, W * dolyaVysoty)));

  /* Ширина блока: чертёж рисуется в его пикселях. */
  useEffect(() => {
    const el = obertka.current;
    if (el === null || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((zapisi) => {
      const w = Math.round(zapisi[0]?.contentRect.width ?? 0);
      if (w > 0) setW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const kadr = useMemo(() => skhema.postroit(t), [skhema, t]);
  const cel = useMemo(() => ramkaKadra(kadr, vid, sost), [kadr, vid, sost]);

  /* Рамка: на первом кадре — сразу цель, дальше — плавно к ней. */
  const [ramka, setRamka] = useState<Ramka>(cel);
  const ramkaRef = useRef<Ramka>(cel);
  const [tyanem, setTyanem] = useState<string | null>(null);

  useEffect(() => {
    if (tyanem !== null) return undefined;
    const ot = ramkaRef.current;
    const raznica = Math.max(...cel.map((x, i) => Math.abs(x - ot[i]!)));
    if (raznica < 1e-6) return undefined;
    /* Поворот ползунком и перетаскивание дают цель каждый кадр — там
       рамка следует сразу; плавный переход нужен скачкам (подсветка,
       шаг построения, новое положение). */
    const shirina = Math.max(ot[2] - ot[0], ot[3] - ot[1]);
    if (umenshitDvizhenie() || raznica < shirina * 0.02) {
      ramkaRef.current = cel;
      const id = requestAnimationFrame(() => setRamka(cel));
      return () => cancelAnimationFrame(id);
    }
    const start = performance.now();
    let id = 0;
    const kadrAnimacii = (sejchas: number) => {
      const x = Math.min(1, (sejchas - start) / DUR_RAMKI);
      const plavno = 1 - (1 - x) ** 3;
      const r = smeshatRamki(ot, cel, plavno);
      ramkaRef.current = r;
      setRamka(r);
      if (x < 1) id = requestAnimationFrame(kadrAnimacii);
    };
    id = requestAnimationFrame(kadrAnimacii);
    return () => cancelAnimationFrame(id);
  }, [cel, tyanem]);

  const ruchki = onTochki === undefined ? NET_RUCHEK : skhema.podvizhnye;
  const ekran: Ekran = useMemo(
    () => raskladka(kadr, vid, ramka, W, H, sost, ruchki),
    [kadr, vid, ramka, W, H, sost, ruchki],
  );

  /* ── Перетаскивание ── */
  const ozhidaet = useRef<{ imya: string; x: number; y: number } | null>(null);
  const rafId = useRef(0);
  const tRef = useRef(t);
  const ekranRef = useRef(ekran);
  useEffect(() => {
    tRef.current = t;
    ekranRef.current = ekran;
  }, [t, ekran]);

  function vSvg(clientX: number, clientY: number): [number, number] {
    const r = svgRef.current?.getBoundingClientRect();
    if (r === undefined || r.width === 0) return [clientX, clientY];
    return [((clientX - r.left) * W) / r.width, ((clientY - r.top) * H) / r.height];
  }

  function primenit(): void {
    rafId.current = 0;
    const o = ozhidaet.current;
    if (o === null || onTochki === undefined) return;
    ozhidaet.current = null;
    const m = ekranRef.current.preob.vModel(o.x, o.y);
    const p = skhema.ogranichit(o.imya, m, tRef.current);
    if (p !== null) onTochki({ ...tRef.current, [o.imya]: p });
  }

  function dvigat(imya: string, x: number, y: number): void {
    ozhidaet.current = { imya, x, y };
    if (rafId.current === 0) rafId.current = requestAnimationFrame(primenit);
  }

  useEffect(() => () => cancelAnimationFrame(rafId.current), []);

  function nazhatie(imya: string, e: PointerEvent<SVGCircleElement>): void {
    if (onTochki === undefined) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setTyanem(imya);
  }

  function dvizhenie(imya: string, e: PointerEvent<SVGCircleElement>): void {
    if (tyanem !== imya) return;
    const [x, y] = vSvg(e.clientX, e.clientY);
    dvigat(imya, x, y);
  }

  function otpuskanie(e: PointerEvent<SVGCircleElement>): void {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setTyanem(null);
  }

  function klavisha(imya: string, e: KeyboardEvent<SVGCircleElement>): void {
    const sdvig: Record<string, T2> = {
      ArrowLeft: [-SHAG_KLAVISH, 0],
      ArrowRight: [SHAG_KLAVISH, 0],
      ArrowUp: [0, -SHAG_KLAVISH],
      ArrowDown: [0, SHAG_KLAVISH],
    };
    const d = sdvig[e.key];
    const p = ekran.poImeni[imya];
    if (d === undefined || p === undefined) return;
    e.preventDefault();
    dvigat(imya, p[0] + d[0], p[1] + d[1]);
  }

  return (
    <div ref={obertka} className={clsx('skh', tyanem !== null && 'is-tyanem', className)}>
      <svg
        ref={svgRef}
        className="skh__svg"
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-label={opisanie}
      >
        <g className="skh__mnog">
          {ekran.mnog.map((m) => (
            <polygon
              key={m.id}
              className={clsx('skh-mnog', m.cvet && `skh-c-${m.cvet}`)}
              points={m.points}
            />
          ))}
        </g>
        <g className="skh__okr">
          {ekran.okr.map((o) => (
            <circle
              key={o.id}
              className={clsx(
                'skh-okr',
                `skh-${o.stil}`,
                o.lit && 'is-lit',
                o.dim && 'is-dim',
                o.novyy && 'is-novyy',
                o.cvet && `skh-c-${o.cvet}`,
              )}
              cx={o.cx}
              cy={o.cy}
              r={o.r}
            />
          ))}
        </g>
        <g className="skh__ugly-fon">
          {ekran.ugly
            .filter((u) => u.sektor !== '')
            .map((u) => (
              <path
                key={u.id}
                className={clsx('skh-sektor', u.cvet && `skh-c-${u.cvet}`)}
                d={u.sektor}
              />
            ))}
        </g>
        <g className="skh__linii">
          {ekran.linii.map((l) => (
            <g
              key={l.id}
              className={clsx(
                'skh-liniya',
                `skh-${l.stil}`,
                l.lit && 'is-lit',
                l.dim && 'is-dim',
                l.novyy && 'is-novyy',
                l.cvet && `skh-c-${l.cvet}`,
              )}
            >
              <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} pathLength={l.novyy ? 1 : undefined} />
              {l.shtrihi === '' ? null : <path className="skh-shtrih" d={l.shtrihi} />}
            </g>
          ))}
        </g>
        <g className="skh__ugly">
          {ekran.ugly.map((u) => (
            <path
              key={u.id}
              className={clsx(
                'skh-ugol',
                u.pryamoy && 'skh-ugol--pryamoy',
                u.lit && 'is-lit',
                u.dim && 'is-dim',
                u.novyy && 'is-novyy',
                u.cvet && `skh-c-${u.cvet}`,
              )}
              d={u.d}
            />
          ))}
        </g>
        <g className="skh__tochki">
          {ekran.tochki.map((p) => (
            <circle
              key={p.id}
              className={clsx(
                'skh-tochka',
                p.lit && 'is-lit',
                p.dim && 'is-dim',
                p.novyy && 'is-novyy',
                p.cvet && `skh-c-${p.cvet}`,
              )}
              cx={p.x}
              cy={p.y}
              r={2.6}
            />
          ))}
        </g>
        <g className="skh__podpisi" style={{ fontFamily: BUKVY }}>
          {ekran.podpisi.map((p) => (
            <text
              key={p.id}
              className={clsx(
                'skh-podpis',
                p.lit && 'is-lit',
                p.dim && 'is-dim',
                p.novyy && 'is-novyy',
                p.cvet && `skh-c-${p.cvet}`,
              )}
              x={p.x}
              y={p.y}
            >
              {p.bukva}
              {p.indeks === '' ? null : (
                <tspan className="skh-indeks" dy="4">
                  {p.indeks}
                </tspan>
              )}
            </text>
          ))}
        </g>
        <g className="skh__ruchki">
          {ruchki.map((imya) => {
            const p = ekran.poImeni[imya];
            if (p === undefined) return null;
            return (
              <g key={imya} className={clsx('skh-ruchka', tyanem === imya && 'is-active')}>
                <circle className="skh-ruchka__kolco" cx={p[0]} cy={p[1]} r={RUCHKA_R} />
                <circle
                  className="skh-ruchka__zona"
                  cx={p[0]}
                  cy={p[1]}
                  r={22}
                  tabIndex={0}
                  role="button"
                  aria-label={podpisRuchki === undefined ? imya : podpisRuchki(imya)}
                  onPointerDown={(e) => nazhatie(imya, e)}
                  onPointerMove={(e) => dvizhenie(imya, e)}
                  onPointerUp={otpuskanie}
                  onPointerCancel={otpuskanie}
                  onKeyDown={(e) => klavisha(imya, e)}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
