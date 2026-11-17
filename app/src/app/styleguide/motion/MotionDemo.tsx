'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { assetUrl } from '@/lib/assetUrl';

/**
 * Прототипы motion-системы (docs/motion-system.md). Шесть сцен:
 * токены, появление текста, карточка и кнопка, тренажёр, вкладки
 * с подсказкой и глубина стекла. Всё движение — transform и opacity.
 *
 * Два переключателя наверху показывают деградацию: «слабое устройство»
 * (класс .mo--lite: без параллакса, размытия и каскадов) и «меньше
 * движения» (класс .mo--reduce — то же, что prefers-reduced-motion).
 */

/* ── Определение слабого устройства ─────────────────────────────── */

interface NavigatorS {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

/**
 * Мало памяти, мало ядер или включена экономия трафика. Safari память
 * не сообщает — iPhone сюда не попадает; на сайте к этому добавится
 * замер первых кадров (docs/motion-system.md, раздел 6).
 */
function slaboeUstroystvo(): boolean {
  if (typeof navigator === 'undefined') return false;
  const n = navigator as Navigator & NavigatorS;
  const yadra = n.hardwareConcurrency ?? 8;
  const pamyat = n.deviceMemory ?? 8;
  return (
    pamyat <= 3 || yadra <= 2 || (yadra <= 4 && pamyat <= 4) || n.connection?.saveData === true
  );
}

function mensheDvizheniya(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/* ── Появление при прокрутке ────────────────────────────────────── */

/** Добавляет .is-in, когда блок на четверть вошёл в экран. Один раз. */
function Poyavlenie({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vidno, setVidno] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    const io = new IntersectionObserver(
      (zapisi) => {
        if (zapisi.some((z) => z.isIntersecting)) {
          setVidno(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={clsx('mo-reveal', vidno && 'is-in', className)}>
      {children}
    </div>
  );
}

/** Задержка каскада: шаг 60 мс, не больше пяти шагов. */
function kaskad(i: number): CSSProperties {
  return { '--mo-i': Math.min(i, 5) } as CSSProperties;
}

/* ── Сцена 1. Токены ────────────────────────────────────────────── */

const TOKENY = [
  { imya: 'fast', ms: 120, zachem: 'нажатие, наведение, фокус' },
  { imya: 'base', ms: 220, zachem: 'вкладка, раскрытие, ответ' },
  { imya: 'slow', ms: 420, zachem: 'появление блока, смена задачи' },
  { imya: 'scene', ms: 700, zachem: 'только витрина: герой, смена сцены' },
] as const;

const KRIVYE = [
  { imya: 'out', css: 'cubic-bezier(0.2, 0, 0, 1)', zachem: 'всё, что появляется и откликается' },
  { imya: 'in-out', css: 'cubic-bezier(0.45, 0, 0.25, 1)', zachem: 'перемещение из точки в точку' },
  { imya: 'in', css: 'cubic-bezier(0.4, 0, 1, 1)', zachem: 'уход с экрана' },
  { imya: 'spring', css: 'cubic-bezier(0.2, 0.9, 0.3, 1.15)', zachem: 'только «верно» и итог' },
] as const;

function Tokeny() {
  const [tam, setTam] = useState(false);
  return (
    <section className="mo-sec">
      <h2>1. Токены: длительности и кривые</h2>
      <p className="mo-lead">
        Четыре длительности и четыре кривые на весь сайт. Нажмите — точки проедут каждая со своим
        токеном.
      </p>
      <button type="button" className="mo-btn" onClick={() => setTam((v) => !v)}>
        {tam ? 'Вернуть' : 'Запустить'}
      </button>
      <div className={clsx('mo-tokeny', tam && 'is-tam')}>
        {TOKENY.map((t) => (
          <div key={t.imya} className="mo-token">
            <code>
              --motion-{t.imya} · {t.ms} мс
            </code>
            <span className="mo-dorozhka">
              <i style={{ transitionDuration: `${t.ms}ms` }} />
            </span>
            <small>{t.zachem}</small>
          </div>
        ))}
        {KRIVYE.map((k) => (
          <div key={k.imya} className="mo-token">
            <code>--ease-{k.imya}</code>
            <span className="mo-dorozhka">
              <i style={{ transitionDuration: '420ms', transitionTimingFunction: k.css }} />
            </span>
            <small>{k.zachem}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Сцена 2. Появление текста и карточек ───────────────────────── */

const OBESHCHANIYA = [
  { no: '01', t: 'Теория', p: 'Коротко и с примерами' },
  { no: '02', t: 'Опорные задачи', p: 'Разобраны по шагам' },
  { no: '03', t: 'Тренажёр', p: 'У каждой задачи свои числа' },
];

function Tekst() {
  const [klyuch, setKlyuch] = useState(0);
  return (
    <section className="mo-sec">
      <h2>2. Появление текста и карточек («Витрина»)</h2>
      <p className="mo-lead">
        Заголовок выходит строками из-под маски, лид — следом, карточки — каскадом по 60 мс. Один
        раз, при входе в экран. В зоне «Учёба» этого нет.
      </p>
      <button type="button" className="mo-btn" onClick={() => setKlyuch((k) => k + 1)}>
        Повторить
      </button>
      <Poyavlenie key={klyuch} className="mo-vitrina">
        <h3 className="mo-zagolovok">
          <span className="mo-stroka">
            <span style={kaskad(0)}>Каждое задание ЕГЭ —</span>
          </span>
          <span className="mo-stroka">
            <span style={kaskad(1)}>от теории до тренажёра</span>
          </span>
        </h3>
        <p className="mo-lid" style={kaskad(2)}>
          Прототипы открытого банка ФИПИ: теория, опорные задачи и тренажёр.
        </p>
        <div className="mo-ryad">
          {OBESHCHANIYA.map((o, i) => (
            <div key={o.no} className="mo-kartochka mo-vhod" style={kaskad(i + 3)}>
              <b>{o.no}</b>
              <strong>{o.t}</strong>
              <span>{o.p}</span>
            </div>
          ))}
        </div>
      </Poyavlenie>
    </section>
  );
}

/* ── Сцена 3. Карточка и кнопка ─────────────────────────────────── */

function Karta() {
  return (
    <section className="mo-sec">
      <h2>3. Карточка и кнопка: наведение и нажатие</h2>
      <p className="mo-lead">
        Мышь: карточка поднимается на 3 px, тень проявляется отдельным слоем (opacity), стрелка
        сдвигается. Палец: наведения нет, только нажатие — масштаб 0,98 за 120 мс.
      </p>
      <div className="mo-ryad mo-ryad--2">
        <a className="mo-kartochka mo-nazhim" href="#mo-karta" id="mo-karta">
          <strong>Я готовлюсь к ЕГЭ</strong>
          <span>Теория, опорные задачи и тренажёр с подсказками</span>
          <em>
            Выбрать задание
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h13M12 6l6 6-6 6" />
            </svg>
          </em>
        </a>
        <div className="mo-knopki">
          <button type="button" className="mo-btn mo-btn--gloss">
            Главная кнопка
          </button>
          <button type="button" className="mo-btn">
            Вторичная
          </button>
          <button type="button" className="mo-btn mo-btn--tihaya">
            Тихая
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Сцена 4. Тренажёр ──────────────────────────────────────────── */

const ZADACHI = [
  {
    tekst:
      'В сборнике 25 билетов, в 5 из них есть вопрос по теме «Неравенства». Найдите вероятность того, что в случайном билете будет этот вопрос.',
    otvet: '0,2',
  },
  {
    tekst:
      'В фирме такси 20 машин, 9 из них чёрные. Найдите вероятность того, что на вызов приедет чёрная машина.',
    otvet: '0,45',
  },
  {
    tekst:
      'На экзамене 40 билетов, Сеня не выучил 4. Найдите вероятность того, что ему попадётся выученный билет.',
    otvet: '0,9',
  },
];

type Otklik = 'net' | 'verno' | 'neverno';

function Trenazher() {
  const [nomer, setNomer] = useState(0);
  const [vvod, setVvod] = useState('');
  const [otklik, setOtklik] = useState<Otklik>('net');
  const [popytka, setPopytka] = useState(0);
  const [resheno, setResheno] = useState(0);
  const [podskazka, setPodskazka] = useState(false);
  const itog = nomer >= ZADACHI.length;
  const zadacha = ZADACHI[Math.min(nomer, ZADACHI.length - 1)];

  const proverit = () => {
    const chislo = vvod.trim().replace('.', ',');
    if (chislo === '') return;
    if (chislo === zadacha?.otvet) {
      setOtklik('verno');
      setResheno((r) => r + 1);
    } else {
      setOtklik('neverno');
      setPopytka((p) => p + 1);
    }
  };
  const dalshe = () => {
    setNomer((n) => n + 1);
    setVvod('');
    setOtklik('net');
    setPodskazka(false);
  };
  const zanovo = () => {
    setNomer(0);
    setResheno(0);
    setVvod('');
    setOtklik('net');
    setPodskazka(false);
  };

  return (
    <section className="mo-sec">
      <h2>4. Тренажёр: верно, неверно, следующая задача, итог («Учёба»)</h2>
      <p className="mo-lead">
        Ответы: 0,2 · 0,45 · 0,9. Введите неверный — поле коротко качнётся (4 px, 280 мс), плашка
        проявится. Верный — галочка «выпрыгнет», прогресс доедет. Условие и формулы не двигаются
        никогда.
      </p>
      <div className="mo-tren">
        <div className="mo-progress" aria-hidden="true">
          <i style={{ transform: `scaleX(${resheno / ZADACHI.length})` }} />
        </div>
        {itog ? (
          <div className="mo-itog">
            <span className="mo-itog__znak" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            <strong>Тренировка завершена</strong>
            <div className="mo-ryad">
              {[
                { n: `${resheno} из ${ZADACHI.length}`, p: 'решено' },
                { n: String(popytka), p: 'ошибок по пути' },
                { n: '№4', p: 'вероятность' },
              ].map((s, i) => (
                <div key={s.p} className="mo-kartochka mo-vhod is-in" style={kaskad(i + 1)}>
                  <strong>{s.n}</strong>
                  <span>{s.p}</span>
                </div>
              ))}
            </div>
            <button type="button" className="mo-btn mo-btn--gloss" onClick={zanovo}>
              Ещё раз
            </button>
          </div>
        ) : (
          <div key={nomer} className="mo-zadacha">
            <p className="mo-uslovie">
              <small>
                Задача {nomer + 1} из {ZADACHI.length}
              </small>
              {zadacha?.tekst}
            </p>
            <div className="mo-otvet">
              <input
                key={popytka}
                className={clsx(
                  'mo-pole',
                  otklik === 'neverno' && 'is-neverno',
                  otklik === 'verno' && 'is-verno',
                )}
                inputMode="decimal"
                placeholder="Число"
                aria-label="Ответ"
                value={vvod}
                disabled={otklik === 'verno'}
                onChange={(e) => {
                  setVvod(e.target.value);
                  if (otklik === 'neverno') setOtklik('net');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') proverit();
                }}
              />
              {otklik === 'verno' ? (
                <button type="button" className="mo-btn mo-btn--gloss" onClick={dalshe}>
                  Дальше
                </button>
              ) : (
                <button type="button" className="mo-btn mo-btn--gloss" onClick={proverit}>
                  Проверить
                </button>
              )}
            </div>
            <div aria-live="polite">
              {otklik === 'verno' ? (
                <p className="mo-plashka mo-plashka--verno">
                  <span className="mo-galochka" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  Верно
                </p>
              ) : null}
              {otklik === 'neverno' ? (
                <p className="mo-plashka mo-plashka--neverno">
                  Пока не так. Посмотри подсказку — и попробуй ещё раз.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="mo-btn mo-btn--tihaya"
              aria-expanded={podskazka}
              onClick={() => setPodskazka((v) => !v)}
            >
              Подсказка
            </button>
            {podskazka ? (
              <p className="mo-podskazka">
                Что здесь все равновозможные исходы? Сколько из них подходят? Поделите второе на
                первое.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Сцена 5. Вкладки ───────────────────────────────────────────── */

const VKLADKI = ['О задании', 'Теория', 'Опорные', 'Тренажёр'];

function Vkladki() {
  const [aktiv, setAktiv] = useState(0);
  return (
    <section className="mo-sec">
      <h2>5. Смена вкладок</h2>
      <p className="mo-lead">
        Глянцевая «таблетка» переезжает к новой вкладке (220 мс), содержимое гаснет за 90 мс и
        проявляется с подъёмом 6 px. На сайте это уже делает View Transitions API; прототип
        показывает тот же рисунок для браузеров без него.
      </p>
      <div
        className="mo-vkladki"
        role="tablist"
        style={{ '--mo-n': VKLADKI.length } as CSSProperties}
      >
        <span
          className="mo-vkladki__tabletka"
          aria-hidden="true"
          style={{ transform: `translateX(${aktiv * 100}%)` }}
        />
        {VKLADKI.map((v, i) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={i === aktiv}
            className={clsx(i === aktiv && 'is-aktiv')}
            onClick={() => setAktiv(i)}
          >
            {v}
          </button>
        ))}
      </div>
      <div key={aktiv} className="mo-panel" role="tabpanel">
        <strong>{VKLADKI[aktiv]}</strong>
        <span>Содержимое вкладки появляется на месте: страница не прыгает и не листается.</span>
      </div>
    </section>
  );
}

/* ── Сцена 6. Глубина стекла ────────────────────────────────────── */

function Glubina({ zhivaya }: { zhivaya: boolean }) {
  const scena = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scena.current;
    if (el === null || !zhivaya) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const primenit = () => {
      raf = 0;
      el.style.setProperty('--mo-px', x.toFixed(3));
      el.style.setProperty('--mo-py', y.toFixed(3));
    };
    const zaprosit = () => {
      if (raf === 0) raf = requestAnimationFrame(primenit);
    };
    /* Мышь — наклон слоёв; прокрутка — сдвиг по вертикали. */
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      x = (e.clientX - r.left) / r.width - 0.5;
      y = (e.clientY - r.top) / r.height - 0.5;
      zaprosit();
    };
    const scroll = () => {
      const r = el.getBoundingClientRect();
      const seredina = r.top + r.height / 2 - window.innerHeight / 2;
      y = Math.max(-0.5, Math.min(0.5, seredina / window.innerHeight));
      zaprosit();
    };
    el.addEventListener('pointermove', move);
    window.addEventListener('scroll', scroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', scroll);
      el.style.removeProperty('--mo-px');
      el.style.removeProperty('--mo-py');
    };
  }, [zhivaya]);
  return (
    <section className="mo-sec">
      <h2>6. Глубина стекла: параллакс героя («Витрина»)</h2>
      <p className="mo-lead">
        Три слоя едут с разной скоростью: свечение — медленно, кристалл — средне, стеклянная плашка
        — быстрее. Мышью — наклон, прокруткой — сдвиг до 24 px. На слабом устройстве и при «меньше
        движения» сцена неподвижна.
      </p>
      <div ref={scena} className="mo-scena">
        <span className="mo-scena__svet mo-scena__svet--sin" aria-hidden="true" />
        <span className="mo-scena__svet mo-scena__svet--oranzh" aria-hidden="true" />
        <picture className="mo-scena__kristall">
          <source type="image/avif" srcSet={assetUrl('/hero/hero-kristall-600.avif')} />
          <source type="image/webp" srcSet={assetUrl('/hero/hero-kristall-600.webp')} />
          <img
            src={assetUrl('/hero/hero-kristall-600.png')}
            alt=""
            width={600}
            height={506}
            loading="lazy"
            decoding="async"
          />
        </picture>
        <div className="mo-scena__plashka">
          <strong>3 800+</strong>
          <span>задач с ответами</span>
        </div>
      </div>
    </section>
  );
}

/* ── Страница ───────────────────────────────────────────────────── */

export function MotionDemo() {
  /* Что определило устройство само; null — ещё не смотрели (сервер). */
  const [avto, setAvto] = useState<{ lite: boolean; reduce: boolean } | null>(null);
  const [ruchnoe, setRuchnoe] = useState<{ lite?: boolean; reduce?: boolean }>({});
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setAvto({ lite: slaboeUstroystvo(), reduce: mensheDvizheniya() }),
    );
    return () => cancelAnimationFrame(id);
  }, []);
  const lite = ruchnoe.lite ?? avto?.lite ?? false;
  const reduce = ruchnoe.reduce ?? avto?.reduce ?? false;

  return (
    <main className={clsx('mo', lite && 'mo--lite', reduce && 'mo--reduce')}>
      <header className="mo-shapka">
        <p className="mo-nad">Служебная страница · docs/motion-system.md</p>
        <h1>Прототипы движения</h1>
        <p className="mo-lead">
          Шесть сцен motion-системы. Двигаются только transform и opacity. Переключатели ниже
          показывают, как сцены упрощаются сами.
        </p>
        <div className="mo-rezhimy">
          <label>
            <input
              type="checkbox"
              checked={lite}
              onChange={(e) => setRuchnoe((r) => ({ ...r, lite: e.target.checked }))}
            />
            Слабое устройство
            {avto?.lite === true ? <small> (определено автоматически)</small> : null}
          </label>
          <label>
            <input
              type="checkbox"
              checked={reduce}
              onChange={(e) => setRuchnoe((r) => ({ ...r, reduce: e.target.checked }))}
            />
            Меньше движения
            {avto?.reduce === true ? <small> (включено в системе)</small> : null}
          </label>
        </div>
      </header>
      <Tokeny />
      <Tekst />
      <Karta />
      <Trenazher />
      <Vkladki />
      <Glubina zhivaya={!lite && !reduce} />
    </main>
  );
}
