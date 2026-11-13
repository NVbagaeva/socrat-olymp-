'use client';

/**
 * «Карта ЕГЭ»: экран целиком — фон, слой островов, жесты, окошко тем,
 * панель раздела (на телефоне — шторка), пролив, таблички частей,
 * легенда и кнопки.
 *
 * Данные приходят снаружи (journaly, имя, закладки): так же компонент
 * покажет репетитору карту его ученика — с его журналами и без кнопок
 * тренировки.
 */

import { clsx } from 'clsx';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import FON from '@/content/karta/fon.json';
import { PROLIV_TEKST } from '@/content/karta/proliv';
import { KARTA_TEKST } from '@/content/karta/teksty';
import { counted } from '@/lib/plural';
import { assetUrl } from '@/lib/assetUrl';
import { AUTH_HREF } from '@/lib/auth/config';
import {
  CHAST_1,
  CHAST_2,
  KARTA_H,
  KARTA_W,
  MESTA,
  OSTROVA,
  ostrov,
  putD,
  ramkaMaterika,
  ramkaOstrovov,
  type Ramka,
} from '@/lib/karta/geometriya';
import { KARTA_RAZDELY, razdelInfo } from '@/lib/karta/katalog';
import { postroitKartu, prolivSvodka, type Karta, type Zhurnaly } from '@/lib/karta/model';
import { prochitatVidel, zapomnitVidel } from '@/lib/karta/zhurnaly';
import { KartaOkoshko } from './KartaOkoshko';
import { KartaOstrov } from './KartaOstrov';
import { PanelMaterika, PanelOblasti, PanelProliva, type ZakladkiKarty } from './KartaPanel';
import { useHolst } from './useHolst';
import './karta.css';

export type Vybor =
  { vid: 'oblast'; no: number } | { vid: 'proliv' } | { vid: 'chast'; chast: 1 | 2 } | null;

export interface KartaEkranProps {
  zhurnaly: Zhurnaly;
  /** Имя ученика; пусто — «Привет!». */
  imya: string;
  /** Гость: плашка «Войдите, чтобы карта запоминала прогресс». */
  gost: boolean;
  zakladki: ZakladkiKarty | null;
  /** «Сейчас» — для расчётов и проверок. */
  now?: number;
  /** Режим отладки: контуры поверх картинки. */
  debug?: boolean;
  /** Что под картой (карточка домашнего задания). */
  children?: React.ReactNode;
}

/** Самый крупный масштаб: экранных пикселей на пиксель фона. Крупнее — мыло. */
const MAX_K = 1.6;
/** С какого масштаба фактура фона подменяется заливкой контура. */
const FAKTURA_OT = 0.95;
const PANEL_SHIRINA = 380;

const SIZES = `(max-width: 767px) 100vw, (max-width: 1279px) 90vw, 1200px`;
const fonUrl = (w: number) => assetUrl(`/images/karta/fon-${w}.webp`);
const SRCSET = FON.shiriny.map((w) => `${fonUrl(w)} ${w}w`).join(', ');

function ramkaVybora(v: Vybor): Ramka {
  if (v === null) return { x: 0, y: 0, w: KARTA_W, h: KARTA_H };
  if (v.vid === 'oblast') return ramkaOstrovov([v.no], 36);
  if (v.vid === 'chast') return ramkaMaterika(v.chast);
  return ramkaOstrovov([7, 9, 14, 15, 16], 10);
}

export function KartaEkran({
  zhurnaly,
  imya,
  gost,
  zakladki,
  now,
  debug = false,
  children,
}: KartaEkranProps) {
  const [vybor, setVybor] = useState<Vybor>(null);
  const [telefon, setTelefon] = useState(false);
  const [podskazka, setPodskazka] = useState(false);
  const [novye, setNovye] = useState<Set<number>>(() => new Set());
  const [vid, setVid] = useState({ k: 1, mir: 1 });
  const oknoRef = useRef<HTMLDivElement>(null);
  const okoshkoRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const podskazkaId = useId();
  /* «Сейчас» берётся при первом показе: карта не пересчитывается каждую перерисовку. */
  const [seychasPoUmolchaniyu] = useState(() => Date.now());
  const seychas = now ?? seychasPoUmolchaniyu;

  const karta: Karta = useMemo(
    () => postroitKartu(KARTA_RAZDELY, zhurnaly, seychas),
    [zhurnaly, seychas],
  );
  const proliv = useMemo(() => prolivSvodka(karta), [karta]);
  const oblastPo = useCallback((no: number) => karta.oblasti.find((o) => o.no === no), [karta]);

  /* Телефон: панель — шторка снизу, карта во весь экран. */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023.98px)');
    const sync = () => setTelefon(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  /* Поля, которые занимают панель и шторка: остров вписывается в остаток. */
  const polya = useCallback(
    (sVyborom: boolean) =>
      /* Сверху — место под окошко тем, справа — под панель, снизу — под шторку. */
      telefon
        ? {
            top: sVyborom ? 170 : 72,
            right: 16,
            /* Шторка занимает до 46 % холста (karta.css). */
            bottom: sVyborom ? Math.round((oknoRef.current?.clientHeight ?? 600) * 0.46) + 8 : 24,
            left: 16,
          }
        : {
            top: sVyborom ? 170 : 24,
            right: sVyborom ? PANEL_SHIRINA + 40 : 24,
            bottom: 24,
            left: 24,
          },
    [telefon],
  );

  const vybrat = useCallback((next: Vybor) => setVybor(next), []);

  const holst = useHolst({
    okno: oknoRef,

    shirina: KARTA_W,
    vysota: KARTA_H,
    maxK: MAX_K,
    onTap: (x, y) => {
      const cel = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-cel]');
      const kod = cel?.dataset.cel ?? '';
      if (kod.startsWith('oblast:')) vybrat({ vid: 'oblast', no: Number(kod.slice(7)) });
      else if (kod === 'proliv') vybrat({ vid: 'proliv' });
      else if (kod.startsWith('chast:'))
        vybrat({ vid: 'chast', chast: Number(kod.slice(6)) as 1 | 2 });
      else vybrat(null);
    },
    onVid: (v, mir) => setVid({ k: v.k, mir }),
  });

  /* На телефоне фон широкий, а экран узкий: стартуем чуть ближе, чем
     «Весь мир», — так номера читаются, а карту можно двигать пальцем. */
  const priblizhenTelefon = useRef(false);
  useEffect(() => {
    if (!telefon || priblizhenTelefon.current) return;
    priblizhenTelefon.current = true;
    holst.masshtab(1.35, undefined, false);
    // holst стабилен
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telefon]);

  /* Выбор → карта подъезжает; окошку и панели — фокус, если выбрали с клавиатуры. */
  const sKlaviatury = useRef(false);
  useEffect(() => {
    if (vybor === null) return;
    const maxK = vybor.vid === 'oblast' ? 1.1 : undefined;
    holst.pokazat(ramkaVybora(vybor), polya(true), maxK);
    if (sKlaviatury.current) {
      sKlaviatury.current = false;
      window.setTimeout(() => {
        const cel =
          okoshkoRef.current?.querySelector<HTMLElement>('[data-okoshko-fokus]') ??
          panelRef.current?.querySelector<HTMLElement>('button, a');
        cel?.focus();
      }, 60);
    }
    // holst и polya стабильны между выборами
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vybor]);

  /* Esc закрывает окошко и панель; фокус — обратно на область. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || vybor === null) return;
      e.preventDefault();
      const no = vybor.vid === 'oblast' ? vybor.no : null;
      setVybor(null);
      if (no !== null) {
        document.querySelector<HTMLElement>(`[data-cel="oblast:${no}"]`)?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [vybor]);

  /* Новое освоение: свет заливает остров, потом запоминаем, что видели. */
  const osvoennye = useMemo(
    () => karta.oblasti.filter((o) => o.sostoyanie === 'osvoeno').map((o) => o.no),
    [karta],
  );
  const osvoennyeKlyuch = osvoennye.join(',');
  useEffect(() => {
    if (osvoennye.length === 0 && Object.keys(zhurnaly).length === 0) return undefined;
    const videl = prochitatVidel();
    const svezhie = videl === null ? [] : osvoennye.filter((no) => !videl.has(no));
    const pokaz = window.setTimeout(() => {
      if (svezhie.length > 0) setNovye(new Set(svezhie));
    }, 0);
    const t = window.setTimeout(() => {
      zapomnitVidel(osvoennye);
      setNovye(new Set());
    }, 3200);
    return () => {
      window.clearTimeout(pokaz);
      window.clearTimeout(t);
    };
    // осознанно: только при смене набора освоенных
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osvoennyeKlyuch]);

  const vybrannayaOblast = vybor?.vid === 'oblast' ? oblastPo(vybor.no) : undefined;
  const vybrannyyOstrov = vybor?.vid === 'oblast' ? ostrov(vybor.no) : undefined;

  /* Подпись острова на экране: не мельче, чем на виде «Весь мир», и
     растёт мягче, чем карта. */
  const kratnost = vid.k / vid.mir;
  const podpisK = Math.min(1.5, Math.max(0.56, 0.9 * Math.pow(kratnost, 0.35))) / vid.k;
  const radiusNaEkrane = 60 * vid.k;
  const uroven = radiusNaEkrane < 18 ? 'daleko' : radiusNaEkrane < 30 ? 'srednee' : 'blizko';
  const faktura = Math.min(1, Math.max(0, (vid.k - FAKTURA_OT) / (MAX_K - FAKTURA_OT)));

  const zakrytVybor = () => setVybor(null);
  const pereytiKOblasti = (no: number) => setVybor({ vid: 'oblast', no });
  const sleduyushchaya = karta.sleduyushchaya;
  const prognoz = karta.prognoz;

  return (
    <div
      className={clsx('karta', telefon && 'karta--telefon', vybor !== null && 'karta--s-vyborom')}
    >
      <header className="karta-shapka" data-karta-ne-holst="">
        <h1 className="karta-shapka__privet">
          {imya === '' ? KARTA_TEKST.privetBezImeni : KARTA_TEKST.privet(imya)}
        </h1>
        <p className="karta-shapka__itog">
          <span>{KARTA_TEKST.osvoeno(karta.osvoeno, karta.oblasti.length)}</span>
          <span className="karta-shapka__tochka" aria-hidden="true">
            ·
          </span>
          {prognoz.gotov ? (
            <span className="karta-prognoz">
              <span>{KARTA_TEKST.prognoz}</span>
              <b className="karta-prognoz__ball">
                ≈ {counted(prognoz.ball, 'балл', 'балла', 'баллов')}
              </b>
              <button
                type="button"
                className="karta-prognoz__chto"
                aria-label={KARTA_TEKST.prognozChto}
                aria-expanded={podskazka}
                aria-controls={podskazkaId}
                onClick={() => setPodskazka((v) => !v)}
              >
                ?
              </button>
            </span>
          ) : (
            <span className="karta-prognoz karta-prognoz--malo">{KARTA_TEKST.prognozMalo}</span>
          )}
        </p>
        {podskazka ? (
          <div className="karta-prognoz__podskazka stk-glass" id={podskazkaId} role="note">
            <b>{KARTA_TEKST.prognozChto}</b>
            <p>{KARTA_TEKST.prognozKak}</p>
            <button
              type="button"
              className="karta-knopka karta-knopka--malaya"
              onClick={() => setPodskazka(false)}
            >
              {KARTA_TEKST.zakryt}
            </button>
          </div>
        ) : null}
        {gost ? (
          <p className="karta-gost stk-glass">
            <span>
              <b>{KARTA_TEKST.gost.tekst}</b> {KARTA_TEKST.gost.chto}
            </span>
            <Link
              className="karta-knopka karta-knopka--malaya karta-knopka--glavnaya"
              href={AUTH_HREF.voyti}
            >
              {KARTA_TEKST.gost.knopka}
            </Link>
          </p>
        ) : null}
      </header>

      <div className="karta-scena">
        <div
          ref={oknoRef}
          className="karta-holst"
          data-uroven={uroven}
          data-debug={debug ? '1' : undefined}
          style={
            {
              '--pk': podpisK,
              '--faktura': faktura,
              '--fon-zaglushka': `url("${FON.zaglushka}")`,
            } as CSSProperties
          }
        >
          <div className="karta-sloy" style={{ width: KARTA_W, height: KARTA_H }}>
            <img
              className="karta-fon"
              src={fonUrl(FON.shiriny[FON.shiriny.length - 1] ?? KARTA_W)}
              srcSet={SRCSET}
              sizes={SIZES}
              width={KARTA_W}
              height={KARTA_H}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            <svg
              className="karta-svg"
              viewBox={`0 0 ${KARTA_W} ${KARTA_H}`}
              width={KARTA_W}
              height={KARTA_H}
              role="group"
              aria-label={KARTA_TEKST.karta}
            >
              <defs>
                {OSTROVA.map((o) => (
                  <clipPath key={o.no} id={`karta-kontur-${o.no}`}>
                    <path d={o.d} />
                  </clipPath>
                ))}
                <linearGradient id="karta-led" x1="0" y1="0" x2="0.3" y2="1">
                  <stop offset="0" stopColor="#ffffff" />
                  <stop offset="1" stopColor="#dbeafe" />
                </linearGradient>
                <radialGradient id="karta-svet">
                  <stop offset="0" stopColor="#ffd9a8" stopOpacity="0.95" />
                  <stop offset="1" stopColor="#ffb55c" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Фактура льда поверх фона при сильном приближении. */}
              <g className="karta-faktura" aria-hidden="true">
                {OSTROVA.map((o) => (
                  <path key={o.no} d={o.d} />
                ))}
              </g>

              {/* Полоса пролива: по ней нажимают. */}
              <path className="karta-proliv__polosa" d={MESTA.proliv.polosa} data-cel="proliv" />

              {/* Рекомендуемый путь. */}
              {karta.put.length > 1 ? (
                <path className="karta-put" d={putD(karta.put)} aria-hidden="true" />
              ) : null}

              {karta.oblasti.map((o) => {
                const os = ostrov(o.no);
                if (os === undefined) return null;
                return (
                  <KartaOstrov
                    key={o.no}
                    ostrov={os}
                    oblast={o}
                    nazvanie={razdelInfo(o.no).nazvanie}
                    vybran={vybor?.vid === 'oblast' && vybor.no === o.no}
                    sleduyushchaya={sleduyushchaya === o.no}
                    novaya={novye.has(o.no)}
                    onVybor={(no, klav) => {
                      sKlaviatury.current = klav;
                      vybrat({ vid: 'oblast', no });
                    }}
                  />
                );
              })}

              {/* Надпись в проливе. */}
              <g className="karta-proliv" aria-hidden="true">
                <path id="karta-proliv-liniya" d={MESTA.proliv.d} fill="none" />
                <text className="karta-proliv__tekst">
                  <textPath href="#karta-proliv-liniya" startOffset="50%" textAnchor="middle">
                    {KARTA_TEKST.proliv.toUpperCase().split('').join(' ')}
                  </textPath>
                </text>
              </g>

              {/* Таблички частей. */}
              {([1, 2] as const).map((chast) => {
                const m = chast === 1 ? MESTA.chast1 : MESTA.chast2;
                return (
                  <g
                    key={chast}
                    className="karta-tablichka"
                    transform={`translate(${m.x} ${m.y}) rotate(${m.ugol})`}
                    data-cel={`chast:${chast}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`${KARTA_TEKST.chast(chast)}: ${KARTA_TEKST.materik(karta.osvoenoChast[chast], karta.vsegoChast[chast])}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        sKlaviatury.current = true;
                        vybrat({ vid: 'chast', chast });
                      }
                    }}
                  >
                    <g className="karta-podpis">
                      <rect x={-62} y={-20} width={124} height={40} rx={10} />
                      <text y={7} textAnchor="middle">
                        {KARTA_TEKST.chast(chast)}
                      </text>
                    </g>
                  </g>
                );
              })}

              {debug ? (
                <g className="karta-debug" aria-hidden="true">
                  {OSTROVA.map((o) => (
                    <g key={o.no}>
                      <path d={o.d} />
                      <circle cx={o.cx} cy={o.cy} r={3} />
                      <circle cx={o.cx} cy={o.cy} r={o.radius} className="karta-debug__radius" />
                      <text x={o.cx + 6} y={o.cy - 6}>
                        {o.no}
                      </text>
                    </g>
                  ))}
                  <path d={MESTA.proliv.polosa} className="karta-debug__proliv" />
                </g>
              ) : null}
            </svg>
          </div>

          {vybrannayaOblast !== undefined && vybrannyyOstrov !== undefined ? (
            <div ref={okoshkoRef} className="karta-okoshko-mesto">
              <KartaOkoshko
                oblast={vybrannayaOblast}
                nazvanie={razdelInfo(vybrannayaOblast.no).nazvanie}
                mesto={{ x: vybrannyyOstrov.cx, y: vybrannyyOstrov.ramka.y + 4 }}
                onZakryt={zakrytVybor}
              />
            </div>
          ) : null}

          {/* Кнопки масштаба и «Весь мир». */}
          <div className="karta-upravlenie" data-karta-ne-holst="">
            <div className="karta-masshtab">
              <button
                type="button"
                onClick={() => holst.masshtab(1.5)}
                aria-label={KARTA_TEKST.bolshe}
              >
                +
              </button>
              <button
                type="button"
                onClick={() => holst.masshtab(1 / 1.5)}
                aria-label={KARTA_TEKST.menshe}
              >
                −
              </button>
            </div>
            <button
              type="button"
              className="karta-ves-mir stk-glass"
              onClick={() => {
                setVybor(null);
                holst.vesMir();
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
              </svg>
              {KARTA_TEKST.vesMir}
            </button>
          </div>
        </div>

        <aside
          ref={panelRef}
          className={clsx('karta-panel stk-glass', vybor !== null && 'is-otkryta')}
          aria-labelledby="karta-panel-nazvanie"
          aria-hidden={vybor === null}
          data-karta-ne-holst=""
        >
          <span className="karta-panel__ruchka" aria-hidden="true" />
          <div className="karta-panel__telo">
            {vybor?.vid === 'oblast' && vybrannayaOblast !== undefined ? (
              <PanelOblasti
                key={vybrannayaOblast.no}
                oblast={vybrannayaOblast}
                zakladki={zakladki}
                onZakryt={zakrytVybor}
              />
            ) : vybor?.vid === 'proliv' ? (
              <PanelProliva
                svodka={proliv}
                onChast2={() => setVybor({ vid: 'chast', chast: 2 })}
                onOblast={pereytiKOblasti}
                onZakryt={zakrytVybor}
              />
            ) : vybor?.vid === 'chast' ? (
              <PanelMaterika
                chast={vybor.chast}
                karta={karta}
                onOblast={pereytiKOblasti}
                onZakryt={zakrytVybor}
              />
            ) : null}
          </div>
        </aside>
      </div>

      <div className="karta-legenda stk-glass" aria-label={KARTA_TEKST.legenda.zagolovok}>
        <span className="karta-legenda__p karta-legenda__p--osvoeno">
          {KARTA_TEKST.legenda.osvoeno}
        </span>
        <span className="karta-legenda__p karta-legenda__p--v-processe">
          {KARTA_TEKST.legenda.vProcesse}
        </span>
        <span className="karta-legenda__p karta-legenda__p--sleduyushchaya">
          {KARTA_TEKST.legenda.sleduyushchaya}
        </span>
        <span className="karta-legenda__p karta-legenda__p--ne-nachato">
          {KARTA_TEKST.legenda.neNachato}
        </span>
        <span className="karta-legenda__p karta-legenda__p--povtorit">
          {KARTA_TEKST.legenda.povtorit}
        </span>
        <span className="karta-legenda__p karta-legenda__p--put">{KARTA_TEKST.legenda.put}</span>
      </div>

      {children}

      {/* Для экранного диктора: что изменилось. */}
      <p className="sr-only" aria-live="polite">
        {novye.size > 0
          ? [...novye].map((no) => KARTA_TEKST.novoe(razdelInfo(no).nazvanie)).join('. ')
          : vybor?.vid === 'proliv'
            ? `${PROLIV_TEKST.zagolovok}: ${proliv.mozhno ? PROLIV_TEKST.mozhno : PROLIV_TEKST.podtyanut}`
            : ''}
      </p>
    </div>
  );
}

/** Экспорт для проверок: номера частей. */
export const KARTA_CHASTI = { 1: CHAST_1, 2: CHAST_2 } as const;
