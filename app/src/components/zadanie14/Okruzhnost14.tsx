'use client';

import { clsx } from 'clsx';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { TrainerSessionHost, useSessionReport } from '@/components/tasks/session';
import { Tex } from '@/components/ui/Tex';
import { katex } from '@/lib/graph/katex';
import { typeset } from '@/lib/tex';
import type { TaskMark } from '@/lib/trainerSession/types';
import {
  dugaUgla,
  geomOkruzhnosti,
  KARTA,
  opisanieOk,
  OS_OK,
  proveritRaskladku,
  raund,
  razborUgla,
  REZHIMY,
  rezhimInfo,
  UROVNI,
  urovenRezhima,
  ugolOkTex,
  ZAZOR_KART,
  type GeomOk,
  type ItogOk,
  type Kartochka,
  type Raskladka,
  type Raund,
  type Rezhim,
  type Uroven,
} from '@/lib/zadanie14/okruzhnost';
import { PogladKotika } from './kotik3d/PogladKotika';
import { kotikProverka, kotikRad } from './kotik3d/signal';
import {
  isOkruzhnost14Payload,
  readOkruzhnost14Ui,
  type Okruzhnost14Payload,
  type Okruzhnost14Ui,
} from './okruzhnost14Sessiya';

/** Раундов в тренировке. */
const RAUNDOV = 10;
/** Кегль формулы в карточке, в единицах viewBox. */
const KEGL_KARTY = 14;

function novyeZerna(n: number): number[] {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 2 ** 31));
}

function nazvanie(p: { rezhim: Rezhim; uroven: Uroven }): string {
  const r = rezhimInfo(p.rezhim);
  if (r.urovni.length === 1) return r.title;
  const u = UROVNI.find((x) => x.id === urovenRezhima(p.rezhim, p.uroven));
  return `${r.title} · ${u?.title ?? ''}`;
}

/** Цепочка разбора: дроби крупно. */
function Cepochka({ tex }: { tex: string }) {
  return <span className="ok14-razbor__cep" dangerouslySetInnerHTML={{ __html: formula(tex) }} />;
}

/** Формула карточки: дробь крупно, как в тетради. */
function formula(tex: string): string {
  return katex.renderToString(tex.replace(/\\frac/g, '\\dfrac'), {
    throwOnError: false,
    displayFrac: true,
  } as never);
}

/* ── Выбор тренировки ─────────────────────────────────────────── */

function Vybor({ onStart }: { onStart: (rezhim: Rezhim, uroven: Uroven) => void }) {
  const [rezhim, setRezhim] = useState<Rezhim>('chetverti');
  const [uroven, setUroven] = useState<Uroven>('osnovnye');
  const info = rezhimInfo(rezhim);
  return (
    <section className="z14-tr-vybor flow">
      <p className="z14-tr-vybor__lead">
        Разложи карточки с углами по точкам окружности: перетащи карточку в ячейку у точки или нажми
        на карточку, а потом на ячейку. Проверка — сразу, к ошибкам — разбор с дугой на окружности.
      </p>
      <fieldset className="z14-tr-vybor__gruppa">
        <legend>Режим</legend>
        <div className="ok14-rezhimy">
          {REZHIMY.map((r) => (
            <button
              key={r.id}
              type="button"
              className="ok14-rezhim"
              aria-pressed={rezhim === r.id}
              onClick={() => setRezhim(r.id)}
            >
              <span className="ok14-rezhim__title">{r.title}</span>
              <Tex className="ok14-rezhim__opis" text={r.opisanie} />
            </button>
          ))}
        </div>
      </fieldset>
      {info.urovni.length > 1 ? (
        <fieldset className="z14-tr-vybor__gruppa">
          <legend>Уровень</legend>
          <div className="z14-tr-vybor__chipy">
            {UROVNI.filter((u) => info.urovni.includes(u.id)).map((u) => (
              <button
                key={u.id}
                type="button"
                className="z14-chip"
                aria-pressed={uroven === u.id}
                onClick={() => setUroven(u.id)}
              >
                {u.title}
              </button>
            ))}
          </div>
          <p className="ok14-uroven-opis">
            <Tex
              text={UROVNI.find((u) => u.id === urovenRezhima(rezhim, uroven))?.opisanie ?? ''}
            />
          </p>
        </fieldset>
      ) : (
        <p className="ok14-uroven-opis">
          <Tex
            text={
              'В этом режиме углы всегда большие: $3005\\pi$, $-\\dfrac{7\\pi}{2}$, $\\dfrac{179\\pi}{2}$ — ищем остаток от полных оборотов.'
            }
          />
        </p>
      )}
      <p className="z14-tr-vybor__schet">В тренировке {RAUNDOV} раундов.</p>
      <button type="button" className="btn btn--primary" onClick={() => onStart(rezhim, uroven)}>
        Начать тренировку
      </button>
    </section>
  );
}

/* ── Окружность с ячейками ────────────────────────────────────── */

interface VidKarty {
  k: Kartochka;
  html: string;
  otmetka: 'verno' | 'neverno' | 'pusto' | null;
}

function Karta({
  v,
  vybrana,
  tryasti,
  onPointerDown,
  onClick,
}: {
  v: VidKarty;
  vybrana: boolean;
  tryasti: boolean;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onClick: () => void;
}) {
  const metka = v.otmetka === 'verno' ? ', верно' : v.otmetka === 'neverno' ? ', неверно' : '';
  return (
    <button
      type="button"
      className={clsx(
        'ok14-karta',
        vybrana && 'is-vybrana',
        v.otmetka === 'verno' && 'is-verno',
        v.otmetka === 'neverno' && 'is-neverno',
        v.otmetka === 'pusto' && 'is-pusto',
        tryasti && 'is-tryas',
      )}
      data-karta={v.k.id}
      aria-pressed={vybrana}
      aria-label={`Карточка ${v.k.id + 1}${metka}`}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      <span className="ok14-karta__f" dangerouslySetInnerHTML={{ __html: v.html }} />
    </button>
  );
}

/** Номер ячейки для диктора: от верхней точки по часовой стрелке. */
function poChasovoy(g: GeomOk, k: number): number {
  const ot = (x: number) => (((6 - x) % 24) + 24) % 24;
  return g.yacheyki.filter((c) => ot(c.k) < ot(k)).length + 1;
}

function pct(v: number, o: number, of: number): string {
  return `${((v - o) / of) * 100}%`;
}

function Krug({
  g,
  r,
  raskl,
  karty,
  vybrana,
  navedena,
  tryasti,
  podsvetka,
  duga,
  onKarta,
  onKlikKarty,
  onYacheyka,
}: {
  g: GeomOk;
  r: Raund;
  raskl: Raskladka;
  karty: Map<number, VidKarty>;
  vybrana: number | null;
  navedena: number | null;
  tryasti: boolean;
  podsvetka: number | null;
  duga: { d: string; dlina: number; klyuch: string } | null;
  onKarta: (id: number, e: ReactPointerEvent<HTMLButtonElement>) => void;
  onKlikKarty: (id: number) => void;
  onYacheyka: (k: number) => void;
}) {
  const { x, y, w, h } = g.vb;
  const naTochke = (k: number) =>
    r.kartochki.filter((c) => raskl[c.id] === k).map((c) => karty.get(c.id) as VidKarty);
  return (
    <div
      className="ok14-krug"
      style={{ aspectRatio: `${w} / ${h}` }}
      role="group"
      aria-label={opisanieOk(r.rezhim)}
    >
      <svg className="ok14-krug__svg" viewBox={`${x} ${y} ${w} ${h}`} aria-hidden="true">
        <line className="ok14-os" x1={-OS_OK} y1={0} x2={OS_OK} y2={0} />
        <line className="ok14-os" x1={0} y1={OS_OK} x2={0} y2={-OS_OK} />
        <path className="ok14-os-strelka" d={`M${OS_OK - 9} -4.5L${OS_OK} 0L${OS_OK - 9} 4.5Z`} />
        <path
          className="ok14-os-strelka"
          d={`M-4.5 ${-OS_OK + 9}L0 ${-OS_OK}L4.5 ${-OS_OK + 9}Z`}
        />
        <circle className="ok14-okr" cx={0} cy={0} r={100} />
        <path className="ok14-obhod" d={g.strelka.duga} />
        <path className="ok14-obhod-konec" d={g.strelka.konec} />
        {g.yacheyki.map((c) => {
          if (!c.vynoska) return null;
          const cx = Math.max(c.ramka.x1, Math.min(c.x0, c.ramka.x2));
          const cy = Math.max(c.ramka.y1, Math.min(c.y0, c.ramka.y2));
          return (
            <line key={`v${c.k}`} className="ok14-vynoska" x1={c.x0} y1={c.y0} x2={cx} y2={cy} />
          );
        })}
        {duga === null ? null : (
          <path
            key={duga.klyuch}
            className="ok14-duga"
            d={duga.d}
            style={{ '--ok14-dl': duga.dlina } as CSSProperties}
          />
        )}
        {g.yacheyki.map((c) => (
          <circle
            key={`t${c.k}`}
            className={clsx('ok14-tochka', podsvetka === c.k && 'is-podsvetka')}
            cx={c.x0}
            cy={c.y0}
            r={podsvetka === c.k ? 6.5 : c.k === 0 ? 5 : 4.4}
          />
        ))}
      </svg>
      {g.podpisi.map((p) => (
        <span
          key={p.tex}
          className="ok14-podpis"
          style={{ left: pct(p.x, x, w), top: pct(p.y, y, h) }}
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(p.tex, { throwOnError: false }),
          }}
        />
      ))}
      {g.yacheyki.map((c) => {
        const tut = naTochke(c.k);
        const polna = tut.length >= r.emkost;
        return (
          <div
            key={c.k}
            className={clsx(
              'ok14-yacheyka',
              r.emkost === 2 && 'ok14-yacheyka--dve',
              navedena === c.k && 'is-navedena',
              podsvetka === c.k && 'is-podsvetka',
              vybrana !== null && !polna && 'is-zhdyot',
            )}
            data-yacheyka={c.k}
            style={{
              left: pct(c.ramka.x1, x, w),
              top: pct(c.ramka.y1, y, h),
              width: pct(c.ramka.x2 - c.ramka.x1 + x, x, w),
              height: pct(c.ramka.y2 - c.ramka.y1 + y, y, h),
            }}
          >
            <button
              type="button"
              className="ok14-yacheyka__cel"
              aria-label={`Ячейка ${poChasovoy(g, c.k)} из ${g.yacheyki.length}, считая от верхней точки по часовой стрелке${tut.length > 0 ? `, карточек: ${tut.length}` : ', пустая'}`}
              onClick={() => onYacheyka(c.k)}
            />
            {tut.map((v) => (
              <Karta
                key={v.k.id}
                v={v}
                vybrana={vybrana === v.k.id}
                tryasti={tryasti && v.otmetka === 'neverno'}
                onPointerDown={(e) => onKarta(v.k.id, e)}
                onClick={() => onKlikKarty(v.k.id)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ── Разбор ───────────────────────────────────────────────────── */

function RazborKarty({
  k,
  aktivna,
  onVybor,
}: {
  k: Kartochka;
  aktivna: boolean;
  onVybor: () => void;
}) {
  const r = razborUgla(k.ugol);
  return (
    <li className={clsx('ok14-razbor__punkt', aktivna && 'is-aktivna')}>
      <button type="button" className="ok14-razbor__knopka" onClick={onVybor}>
        <Cepochka tex={r.cepochka} />
        <span className="ok14-razbor__tekst">
          <Tex text={r.poyasnenie} />
        </span>
        <span className="ok14-razbor__tochka">
          <Tex text={`Точка: $${r.tochka}$.`} />
        </span>
      </button>
    </li>
  );
}

/** Разбор раунда целиком — для экрана итогов. */
function RazborRaunda({ r }: { r: Raund }) {
  return (
    <ol className="ok14-razbor__spisok">
      {r.kartochki.map((k) => {
        const z = razborUgla(k.ugol);
        return (
          <li key={k.id} className="ok14-razbor__punkt">
            <Cepochka tex={z.cepochka} />
            <span className="ok14-razbor__tekst">
              <Tex text={z.poyasnenie} />
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Экран раунда ─────────────────────────────────────────────── */

interface Tyanu {
  id: number;
  x0: number;
  y0: number;
  x: number;
  y: number;
  /** Сдвинулся дальше порога — это перетаскивание, а не нажатие. */
  poshel: boolean;
  /** Смещение указателя внутри карточки. */
  dx: number;
  dy: number;
  w: number;
  h: number;
}

function Ekran({
  payload,
  restored,
  report,
  elapsed,
  onFinish,
  kotik,
}: {
  payload: Okruzhnost14Payload;
  restored: Okruzhnost14Ui | null;
  report: (ui: Okruzhnost14Ui) => void;
  elapsed: () => number;
  onFinish: () => void;
  kotik: (svernut: boolean, onToggle: () => void) => ReactNode;
}) {
  const [index, setIndex] = useState(restored?.index ?? 0);
  const [marks, setMarks] = useState<Record<number, TaskMark>>(restored?.marks ?? {});
  const [tried, setTried] = useState<Record<number, true>>(restored?.tried ?? {});
  const [misses, setMisses] = useState(restored?.misses ?? 0);
  const [raskl, setRaskl] = useState<Raskladka>(restored?.raskl ?? {});
  const [itog, setItog] = useState<ItogOk | null>(restored?.itog ?? null);
  const [oshibalsya, setOshibalsya] = useState(restored?.oshibalsya ?? false);
  const [reshenie, setReshenie] = useState(restored?.reshenie ?? false);
  const [seria, setSeria] = useState(restored?.seria ?? 0);
  const [luchshaya, setLuchshaya] = useState(restored?.luchshaya ?? 0);
  const [kotikSvernut, setKotikSvernut] = useState(restored?.kotik ?? false);
  const [nachalo, setNachalo] = useState(() => restored?.taskFrom ?? elapsed());
  const [vybrana, setVybrana] = useState<number | null>(null);
  const [tyanu, setTyanu] = useState<Tyanu | null>(null);
  const [navedena, setNavedena] = useState<number | null>(null);
  const [tryasti, setTryasti] = useState(false);
  const [aktivnaya, setAktivnaya] = useState<number | null>(null);
  const kornevoy = useRef<HTMLDivElement>(null);
  const tyanuRef = useRef<Tyanu | null>(null);

  useSessionReport<Okruzhnost14Ui>(report, {
    index,
    marks,
    tried,
    order: null,
    misses,
    raskl,
    itog,
    oshibalsya,
    reshenie,
    seria,
    luchshaya,
    kotik: kotikSvernut,
    taskFrom: nachalo,
  });

  const r = useMemo(
    () => raund(payload.rezhim, payload.uroven, payload.seeds[index] ?? 1),
    [payload, index],
  );
  const g = geomOkruzhnosti(r.rezhim, r.emkost);
  const karty = useMemo(
    () =>
      new Map(
        r.kartochki.map((k) => [
          k.id,
          { k, html: formula(ugolOkTex(k.ugol)), otmetka: itog?.otmetki[k.id] ?? null },
        ]),
      ),
    [r, itog],
  );
  const zakryt = marks[index] !== undefined;
  const last = index === payload.seeds.length - 1;

  /* Размер карточки в панели — как у ячейки на окружности: от ширины
     рисунка. Единица — пиксели на единицу viewBox. */
  useEffect(() => {
    const el = kornevoy.current;
    const krug = el?.querySelector<HTMLElement>('.ok14-krug');
    if (el === null || el === undefined || krug === null || krug === undefined) return;
    const pereschet = () => {
      const ed = krug.getBoundingClientRect().width / g.vb.w;
      el.style.setProperty('--ok14-ed', String(ed));
    };
    pereschet();
    const ro = new ResizeObserver(pereschet);
    ro.observe(krug);
    return () => ro.disconnect();
  }, [g]);

  useEffect(() => {
    if (!tryasti) return;
    const t = window.setTimeout(() => setTryasti(false), 500);
    return () => window.clearTimeout(t);
  }, [tryasti]);

  function polozhit(id: number, k: number | null) {
    if (zakryt) return;
    setRaskl((prev) => {
      const next: Raskladka = { ...prev, [id]: k };
      if (k !== null) {
        const tut = r.kartochki.filter((c) => c.id !== id && next[c.id] === k);
        /* Ячейка полна — первая из лежавших карточек уходит в панель. */
        if (tut.length >= r.emkost) next[(tut[0] as Kartochka).id] = null;
      }
      return next;
    });
    if (itog !== null) setItog(null);
    setVybrana(null);
  }

  function klikKarty(id: number) {
    if (zakryt) return;
    /* Выбрана другая карточка, а нажали на лежащую в ячейке — кладём
       выбранную в эту ячейку: так на телефоне не надо целиться в
       свободный край ячейки. */
    const tam = raskl[id];
    if (vybrana !== null && vybrana !== id && tam !== null && tam !== undefined) {
      polozhit(vybrana, tam);
      return;
    }
    setVybrana((v) => (v === id ? null : id));
  }

  function klikYacheyki(k: number) {
    if (vybrana !== null) polozhit(vybrana, k);
  }

  function klikPaneli() {
    if (vybrana !== null && raskl[vybrana] !== null && raskl[vybrana] !== undefined) {
      polozhit(vybrana, null);
    }
  }

  /* ── Перетаскивание: pointer events, одна карточка за раз ── */

  function podUkazatelem(x: number, y: number): { k: number | null; panel: boolean } {
    const el = document.elementFromPoint(x, y);
    const ya = el?.closest<HTMLElement>('[data-yacheyka]');
    if (ya) return { k: Number(ya.dataset['yacheyka']), panel: false };
    return { k: null, panel: el?.closest('[data-panel]') != null };
  }

  function nachatTyanut(id: number, e: ReactPointerEvent<HTMLButtonElement>) {
    if (zakryt || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const box = e.currentTarget.getBoundingClientRect();
    const t: Tyanu = {
      id,
      x0: e.clientX,
      y0: e.clientY,
      x: e.clientX,
      y: e.clientY,
      poshel: false,
      dx: e.clientX - box.left,
      dy: e.clientY - box.top,
      w: box.width,
      h: box.height,
    };
    tyanuRef.current = t;
    const dvig = (ev: PointerEvent) => {
      const cur = tyanuRef.current;
      if (cur === null) return;
      const poshel = cur.poshel || Math.hypot(ev.clientX - cur.x0, ev.clientY - cur.y0) > 6;
      const next = { ...cur, x: ev.clientX, y: ev.clientY, poshel };
      tyanuRef.current = next;
      if (poshel) {
        ev.preventDefault();
        /* У края окна страница едет сама: на телефоне карточку тянут
           пальцем, и обычной прокрутки в это время нет. */
        const kray = 56;
        if (ev.clientY < kray) window.scrollBy(0, -14);
        else if (ev.clientY > window.innerHeight - kray) window.scrollBy(0, 14);
        setTyanu(next);
        setNavedena(podUkazatelem(ev.clientX, ev.clientY).k);
      }
    };
    const konec = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', dvig);
      window.removeEventListener('pointerup', konec);
      window.removeEventListener('pointercancel', konec);
      const cur = tyanuRef.current;
      tyanuRef.current = null;
      setTyanu(null);
      setNavedena(null);
      if (cur === null || !cur.poshel || ev.type === 'pointercancel') return;
      const kuda = podUkazatelem(ev.clientX, ev.clientY);
      if (kuda.k !== null) polozhit(cur.id, kuda.k);
      else if (kuda.panel) polozhit(cur.id, null);
      /* Перетаскивание не должно превратиться ещё и в нажатие. */
      const glush = (ce: Event) => {
        ce.stopPropagation();
        ce.preventDefault();
      };
      window.addEventListener('click', glush, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener('click', glush, { capture: true }), 0);
    };
    window.addEventListener('pointermove', dvig, { passive: false });
    window.addEventListener('pointerup', konec);
    window.addEventListener('pointercancel', konec);
  }

  /* ── Кнопки ── */

  function proverit() {
    if (zakryt) return;
    const it = proveritRaskladku(r, raskl);
    setItog(it);
    kotikProverka(it.vse);
    if (it.vse) kotikRad();
    setVybrana(null);
    setKotikSvernut(true);
    if (it.vse) {
      const chisto = !oshibalsya && !reshenie;
      setMarks((m) => ({ ...m, [index]: chisto ? 'right' : 'hinted' }));
      if (chisto) {
        const s = seria + 1;
        setSeria(s);
        setLuchshaya(Math.max(luchshaya, s));
      }
      return;
    }
    setTryasti(true);
    if (!oshibalsya) {
      setOshibalsya(true);
      setMisses((n) => n + 1);
      setTried((t) => ({ ...t, [index]: true }));
      setSeria(0);
    }
    const pervaya = r.kartochki.find((k) => it.otmetki[k.id] !== 'verno');
    setAktivnaya(pervaya?.id ?? null);
  }

  function dalshe() {
    if (last) {
      onFinish();
      return;
    }
    if (!zakryt && !oshibalsya) setSeria(0);
    setIndex(index + 1);
    setRaskl({});
    setItog(null);
    setOshibalsya(false);
    setReshenie(false);
    setVybrana(null);
    setAktivnaya(null);
    setNachalo(elapsed());
  }

  const vPaneli = r.kartochki.filter((k) => raskl[k.id] === null || raskl[k.id] === undefined);
  const razlozheno = r.kartochki.length - vPaneli.length;
  const zakrytyh = Object.keys(marks).length;
  const vernyh = Object.values(marks).filter((m) => m === 'right').length;
  const oshibki = itog === null ? [] : r.kartochki.filter((k) => itog.otmetki[k.id] !== 'verno');
  const aktivnayaK = r.kartochki.find((k) => k.id === aktivnaya) ?? null;
  const podsvetka = reshenie && aktivnayaK !== null ? aktivnayaK.k : null;
  const dugaR =
    reshenie && aktivnayaK !== null
      ? (() => {
          const d = dugaUgla(aktivnayaK.ugol);
          return d === null ? null : { ...d, klyuch: `${index}-${aktivnayaK.id}` };
        })()
      : null;
  const tyanutaya = tyanu === null ? null : (karty.get(tyanu.id) ?? null);

  return (
    <div
      ref={kornevoy}
      className={clsx('ok14', tyanu !== null && 'is-tyanu')}
      style={
        {
          '--ok14-kw': KARTA.w,
          '--ok14-kh': KARTA.h,
          '--ok14-kegl': KEGL_KARTY,
          '--ok14-zazor': ZAZOR_KART,
        } as CSSProperties
      }
    >
      {kotik(kotikSvernut, () => setKotikSvernut(!kotikSvernut))}
      <div className="ok14-schet" aria-live="polite">
        <span>
          Раунд <b>{index + 1}</b> из {payload.seeds.length}
        </span>
        <span>
          Верно с первого раза: <b>{vernyh}</b> из {zakrytyh}
        </span>
        <span>
          Серия: <b>{seria}</b>
          {luchshaya > 1 ? ` · лучшая ${luchshaya}` : ''}
        </span>
      </div>
      <p className="ok14-zadanie">
        <b>{nazvanie(payload)}.</b> Разложи карточки по точкам окружности.
        {r.emkost === 2 ? ' На одну точку может попасть несколько углов — до двух.' : ''}
        {r.rezhim === 'mix' ? ' Часть ячеек останется пустой.' : ''}
      </p>
      <div className="ok14-stol">
        <Krug
          g={g}
          r={r}
          raskl={raskl}
          karty={karty}
          vybrana={vybrana}
          navedena={navedena}
          tryasti={tryasti}
          podsvetka={podsvetka}
          duga={dugaR}
          onKarta={nachatTyanut}
          onKlikKarty={klikKarty}
          onYacheyka={klikYacheyki}
        />
        <div className="ok14-bok">
          <div
            className={clsx('ok14-panel', vybrana !== null && 'is-zhdyot')}
            data-panel=""
            onClick={(e) => {
              if (e.target === e.currentTarget) klikPaneli();
            }}
          >
            <p className="ok14-panel__title">
              {vPaneli.length > 0 ? `Карточки: ${vPaneli.length}` : 'Все карточки на окружности'}
            </p>
            <div className="ok14-panel__karty">
              {vPaneli.map((k) => (
                <Karta
                  key={k.id}
                  v={karty.get(k.id) as VidKarty}
                  vybrana={vybrana === k.id}
                  tryasti={tryasti && itog?.otmetki[k.id] === 'pusto'}
                  onPointerDown={(e) => nachatTyanut(k.id, e)}
                  onClick={() => klikKarty(k.id)}
                />
              ))}
            </div>
            {vybrana !== null && raskl[vybrana] !== null && raskl[vybrana] !== undefined ? (
              <button type="button" className="btn btn--ghost btn--sm" onClick={klikPaneli}>
                Вернуть карточку сюда
              </button>
            ) : null}
          </div>
          {itog === null ? null : (
            <p className={clsx('ok14-itog', itog.vse ? 'is-verno' : 'is-neverno')} role="status">
              {itog.vse
                ? oshibalsya || reshenie
                  ? 'Всё на месте — исправлено после проверки.'
                  : 'Всё верно!'
                : `Верно ${itog.verno} из ${itog.vsego}. ${
                    oshibki.some((k) => itog.otmetki[k.id] === 'pusto')
                      ? 'Не все карточки разложены. '
                      : ''
                  }Переложи красные карточки и проверь ещё раз.`}
            </p>
          )}
          <div className="ok14-knopki">
            {zakryt ? null : (
              <button
                type="button"
                className="btn btn--primary"
                disabled={razlozheno === 0}
                onClick={proverit}
              >
                Проверить
              </button>
            )}
            {itog !== null && !itog.vse && !reshenie ? (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setReshenie(true);
                  if (aktivnaya === null) setAktivnaya(oshibki[0]?.id ?? null);
                }}
              >
                Показать решение
              </button>
            ) : null}
            <button
              type="button"
              className={clsx('btn', zakryt ? 'btn--primary' : 'btn--ghost')}
              onClick={dalshe}
            >
              {last ? 'Смотреть результат →' : 'Новое задание →'}
            </button>
          </div>
        </div>
      </div>
      {reshenie && oshibki.length > 0 ? (
        <section className="ok14-razbor flow" aria-label="Разбор ошибок">
          <h4 className="ok14-razbor__title">Разбор</h4>
          <p className="ok14-razbor__lead">
            Нажми на строку — точка загорится на окружности, а дуга покажет путь от начала.
          </p>
          <ol className="ok14-razbor__spisok">
            {oshibki.map((k) => (
              <RazborKarty
                key={k.id}
                k={k}
                aktivna={aktivnaya === k.id}
                onVybor={() => setAktivnaya(k.id)}
              />
            ))}
          </ol>
        </section>
      ) : null}
      {tyanu !== null && tyanu.poshel && tyanutaya !== null ? (
        <div
          className="ok14-karta ok14-karta--ten"
          aria-hidden="true"
          style={{
            left: tyanu.x - tyanu.dx,
            top: tyanu.y - tyanu.dy,
            width: tyanu.w,
            height: tyanu.h,
          }}
        >
          <span className="ok14-karta__f" dangerouslySetInnerHTML={{ __html: tyanutaya.html }} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Вкладка «Тренажёр: тригонометрическая окружность». Карточки с углами
 * раскладываются по точкам окружности; режимы — четверти, деление на
 * 8, на 12 и всё вместе; уровни — основные, отрицательные и большие
 * углы. Сессию ведёт общая оболочка: раунды сохраняются при переходах
 * между вкладками, есть «Пауза» и «Завершить тренировку».
 *
 * kotik — баннер «грустный котик» (сворачивается после первой
 * проверки), spravka — блок «Как найти точку для большого угла»:
 * оба набраны на сервере и приходят готовыми.
 */
export function Okruzhnost14({
  base,
  scope,
  kotikPolny,
  kotikPolosa,
  kotikKartinka,
  spravka,
}: {
  base: string;
  scope: string;
  kotikPolny: ReactNode;
  kotikPolosa: ReactNode;
  /** Картинка котика — запасная для окна «Погладь котика». */
  kotikKartinka: ReactNode;
  spravka: ReactNode;
}) {
  const kotik = (svernut: boolean, onToggle: () => void) => (
    <div className={clsx('ok14-kotik', svernut && 'is-svernut')}>
      {svernut ? kotikPolosa : kotikPolny}
      <button type="button" className="ok14-kotik__toggle" onClick={onToggle}>
        {svernut ? 'Развернуть' : 'Свернуть'}
      </button>
    </div>
  );
  return (
    <>
      <TrainerSessionHost<Okruzhnost14Payload, Okruzhnost14Ui>
        scope={scope}
        what="тренажёр окружности"
        backHref={base}
        isPayload={isOkruzhnost14Payload}
        count={(p) => p.seeds.length}
        describe={(p, at) => {
          const r = raund(p.rezhim, p.uroven, p.seeds[at] ?? 1);
          return {
            kind: nazvanie(p),
            html: typeset(`Углы: ${r.kartochki.map((k) => `$${ugolOkTex(k.ugol)}$`).join(', ')}`),
            review: () => <RazborRaunda r={r} />,
          };
        }}
        subset={(p, idx) => ({ ...p, seeds: idx.flatMap((i) => p.seeds[i] ?? []) })}
        similar={(p, idx) => ({ ...p, seeds: novyeZerna(idx.length) })}
        summary={{ hintedLabel: 'Исправлено после проверки' }}
        barExtra={(api) => <PogladKotika api={api} zapasnaya={kotikKartinka} />}
        configurator={(api) => (
          <>
            <div className="ok14-kotik">{kotikPolny}</div>
            <Vybor
              onStart={(rezhim, uroven) => {
                api.start({
                  rezhim,
                  uroven: urovenRezhima(rezhim, uroven),
                  seeds: novyeZerna(RAUNDOV),
                });
                window.scrollTo({ top: 0 });
              }}
            />
          </>
        )}
        screen={({ payload, restored, report, elapsed, finish }) => (
          <Ekran
            payload={payload}
            restored={restored === null ? null : readOkruzhnost14Ui(restored)}
            report={report}
            elapsed={elapsed}
            onFinish={finish}
            kotik={kotik}
          />
        )}
      />
      {spravka}
    </>
  );
}
