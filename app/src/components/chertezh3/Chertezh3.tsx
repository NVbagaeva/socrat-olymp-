'use client';

/**
 * Интерактивный чертёж задания №3.
 *
 * Сцена приходит сценарием (JSON) и подписями, уже свёрстанными KaTeX
 * на сборке: в браузере KaTeX не нужен, подписи только замеряются.
 * Каждый кадр считает общее ядро (lib/stereo через lib/chertezh3):
 * проекция, видимость рёбер (невидимые — штрихом), раскладка подписей.
 * Кадр пересчитывается только при повороте, смене размера окна,
 * переключателе построений или подсветке шага решения.
 *
 * Вращение, масштаб и кнопки вида — общее ядро раздела
 * (components/stereo/vrashchenie): палец, мышь, щипок, колесо.
 * До замера подписей показывается тот же кадр статичным SVG с
 * подписями текстом — он же виден без скриптов.
 */

import { clsx } from 'clsx';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { type Kadr, type Scenariy, kadr as schitatKadr, kadrSvg, postroit } from '@/lib/chertezh3';
import { VrashchaemyyChertezh } from '@/components/stereo/vrashchenie/VrashchaemyyChertezh';
import type { Vid } from '@/components/stereo/vrashchenie/useVrashchenie';
import { type Rakurs, SHKOLNYY } from '@/lib/stereo/proekciya';
import 'katex/dist/katex.min.css';
import './chertezh3.css';

export interface Chertezh3Props {
  scenariy: Scenariy;
  /** Подписи, свёрстанные KaTeX на сборке: TeX → HTML. */
  podpisiHtml: Record<string, string>;
  /** Подсветка шага решения: id элементов. null — без подсветки. */
  podsvetka?: readonly string[] | null;
  /** Показывать ли переключатель «Вспомогательные построения». */
  pereklyuchatel?: boolean;
  /** Вспомогательные построения включены с самого начала. */
  vspomSrazu?: boolean;
  className?: string;
  /** Чертёж повернули: ракурс для листа печати (генератор). */
  onPovorot?: (vid: Vid) => void;
}

const KEGL = 15;

/* Направления подписей прошлого кадра — чтобы подписи не прыгали при
   вращении. Память у каждой сцены своя и уходит вместе с ней. */
const PAMYAT = new WeakMap<object, Map<string, number>>();

function pamyat(scena: object): Map<string, number> {
  let m = PAMYAT.get(scena);
  if (m === undefined) {
    m = new Map();
    PAMYAT.set(scena, m);
  }
  return m;
}

function zapomnit(scena: object, k: Kadr): void {
  const m = pamyat(scena);
  for (const p of k.podpisi) m.set(p.klyuch, p.dir);
}

/** Высота окна чертежа по ширине: почти квадрат, на телефоне ниже. */
function vysotaPo(w: number): number {
  return Math.round(Math.min(w * 0.86, 420));
}

export function Chertezh3({
  scenariy,
  podpisiHtml,
  podsvetka = null,
  pereklyuchatel = true,
  vspomSrazu = false,
  className,
  onPovorot,
}: Chertezh3Props) {
  const scena = useMemo(() => postroit(scenariy), [scenariy]);
  const ishodnyy: Rakurs = scenariy.rakurs ?? SHKOLNYY;
  const [rakurs, setRakurs] = useState<Rakurs>(ishodnyy);
  const [vspom, setVspom] = useState(vspomSrazu);
  const [shirina, setShirina] = useState(320);
  const [razmery, setRazmery] = useState<Map<string, { w: number; h: number }> | null>(null);
  /* Новый сценарий — исходный вид (сброс во время отрисовки, без эффекта). */
  const [prezhniy, setPrezhniy] = useState(scenariy);
  if (prezhniy !== scenariy) {
    setPrezhniy(scenariy);
    setRakurs(ishodnyy);
  }
  const stage = useRef<HTMLDivElement>(null);
  const zamer = useRef<HTMLDivElement>(null);

  // Ширина окна чертежа.
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setShirina(Math.max(200, Math.round(el.clientWidth))));
    ro.observe(el);
    setShirina(Math.max(200, Math.round(el.clientWidth)));
    return () => ro.disconnect();
  }, []);

  // Замер подписей KaTeX.
  const teksty = useMemo(() => Object.keys(podpisiHtml), [podpisiHtml]);
  useLayoutEffect(() => {
    const box = zamer.current;
    if (!box) return;
    const m = new Map<string, { w: number; h: number }>();
    box.querySelectorAll<HTMLElement>('[data-tex]').forEach((el) => {
      const r = el.getBoundingClientRect();
      m.set(el.dataset.tex ?? '', { w: Math.ceil(r.width) + 2, h: Math.ceil(r.height) });
    });
    setRazmery(m);
  }, [teksty]);

  const H = vysotaPo(shirina);
  const k: Kadr = useMemo(() => {
    const out = schitatKadr(scena, {
      rakurs,
      vspom,
      podsvetka,
      shirina,
      vysota: H,
      kegl: KEGL,
      prezhnie: pamyat(scena),
      ...(razmery
        ? { razmer: (tex: string) => razmery.get(tex) ?? { w: KEGL, h: KEGL * 1.2 } }
        : {}),
    });
    zapomnit(scena, out);
    return out;
  }, [scena, rakurs, vspom, podsvetka, shirina, H, razmery]);

  const svg = useMemo(
    () => kadrSvg(k, { kegl: KEGL, podpisi: razmery ? 'net' : 'svg', klass: 'ch3__svg' }),
    [k, razmery],
  );

  /* ── Вращение: общее ядро (VrashchaemyyChertezh) ───────────── */
  const onVid = useCallback((v: Vid) => {
    setRakurs((r) => (r.azimut === v.az && r.vysota === v.el ? r : { azimut: v.az, vysota: v.el }));
  }, []);

  return (
    <figure className={clsx('ch3', className)}>
      <VrashchaemyyChertezh
        az={ishodnyy.azimut}
        el={ishodnyy.vysota}
        onVid={onVid}
        alt={scenariy.alt}
        {...(onPovorot === undefined ? {} : { onPovorot })}
        pod={
          pereklyuchatel ? (
            <figcaption className="ch3__bar">
              <label className="ch3__toggle">
                <input
                  type="checkbox"
                  checked={vspom}
                  onChange={(e) => setVspom(e.target.checked)}
                />
                <span>Вспомогательные построения</span>
              </label>
            </figcaption>
          ) : undefined
        }
      >
        <div ref={stage} className="ch3__stage" style={{ height: H }}>
          <div className="ch3__lines" dangerouslySetInnerHTML={{ __html: svg }} />
          {razmery ? (
            <div className="ch3__labels" aria-hidden="true">
              {k.podpisi.map((p) => (
                <span
                  key={p.klyuch}
                  className={clsx(
                    'ch3__label',
                    `ch3__label--${p.vid}`,
                    p.yarko && 'is-bright',
                    p.tusklo && 'is-dim',
                    p.skryta === true && 'is-skryt',
                  )}
                  style={{ transform: `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)` }}
                  dangerouslySetInnerHTML={{ __html: podpisiHtml[p.tex] ?? p.tex }}
                />
              ))}
            </div>
          ) : null}
          <div ref={zamer} className="ch3__measure" aria-hidden="true">
            {teksty.map((t) => (
              <span
                key={t}
                data-tex={t}
                className="ch3__label"
                dangerouslySetInnerHTML={{ __html: podpisiHtml[t] ?? t }}
              />
            ))}
          </div>
        </div>
      </VrashchaemyyChertezh>
    </figure>
  );
}
