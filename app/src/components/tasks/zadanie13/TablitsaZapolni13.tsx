'use client';

import { clsx } from 'clsx';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui';
import { katex } from '@/lib/graph/katex';
import { choiceMatches, openText } from '@/lib/zadanie13/secret';
import { izZapisi, proverit, texVvoda, type Itog } from '@/lib/zadanie13/vyrazhenie';
import type { KletkaZapolni13, TablitsaZapolni13 } from '@/lib/zadanie13/zapolni';
import { Klaviatura13, type Klavisha } from './Klaviatura13';

export type Uroven13 = 1 | 2 | 3 | 4;

const UROVNI: { u: Uroven13; label: string }[] = [
  { u: 1, label: 'Выбери таблицу' },
  { u: 2, label: 'Выбери ячейку' },
  { u: 3, label: 'Впиши ячейки' },
  { u: 4, label: 'Вся таблица' },
];

const BUKVY_VARIANTOV = ['А', 'Б', 'В', 'Г'];

/**
 * Уровень по номеру задачи в блоке опорных: 1–2 — выбрать таблицу,
 * 3–4 — выбрать ячейку, 5–7 — вписать ключевые клетки, дальше — вся
 * таблица. Переключатель уровней остаётся у каждой задачи.
 */
export function urovenPoNomeru(no: number): Uroven13 {
  if (no <= 2) return 1;
  if (no <= 4) return 2;
  if (no <= 7) return 3;
  return 4;
}

/* ── Ширина экрана и тип указателя ───────────────────────────────── */

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Ввод ученика в KaTeX: предпросмотр под полем. */
function predprosmotr(vvod: string): string | null {
  const tex = texVvoda(vvod);
  return tex === null
    ? null
    : katex.renderToString(tex, { throwOnError: false, displayFrac: true });
}

function Html({ html, className }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

const TEXT_ITOGA: Record<Exclude<Itog['t'], 'oshibka' | 'verno' | 'pusto'>, string> = {
  nerazobrano: 'Запись не разобрать: проверьте скобки и знаки.',
  chisla: 'Запишите в буквах: через $S$, $k$, $r$, $x$.',
  neverno: 'Неверно.',
};

function soobshchenie(it: Itog | undefined): string | null {
  if (!it || it.t === 'pusto' || it.t === 'verno') return null;
  if (it.t === 'oshibka') return it.msg;
  return TEXT_ITOGA[it.t].replace(/\$([^$]+)\$/g, (_, x: string) => katex.renderToString(x));
}

/**
 * «Заполни таблицу» №13: строки — периоды, столбцы — величины. Четыре
 * уровня: выбрать верную таблицу, выбрать выражение в пустых клетках,
 * вписать ключевые клетки, заполнить всю таблицу. Ввод — буквами со
 * своей клавиатуры; проверка по смыслу (подстановкой), типичные ошибки
 * называются. На телефоне в уровнях 3–4 — карточки по периодам, вся
 * таблица — по кнопке «Показать таблицей». После таблицы — формула
 * ответа в буквах; числа подставляют в поле ответа задачи.
 */
export function TablitsaZapolni13({
  t,
  uroven: nachalo = 4,
}: {
  t: TablitsaZapolni13;
  uroven?: Uroven13;
}) {
  const [uroven, setUroven] = useState<Uroven13>(nachalo);
  const tochki = useMemo(() => t.tochki.map(izZapisi), [t]);
  const uzkiy = useMedia('(max-width: 40rem)');
  const sensor = useMedia('(pointer: coarse)');

  /* Поля ввода: значения, активное поле, ссылки на элементы. */
  const [znach, setZnach] = useState<Record<string, string>>({});
  const [itogi, setItogi] = useState<Record<string, Itog>>({});
  const [aktiv, setAktiv] = useState<string | null>(null);
  const polya = useRef<Record<string, HTMLInputElement | null>>({});

  const vseKletki = useMemo(
    () => [...t.stroki.flatMap((s) => s.kletki), ...(t.itog ? [t.itog.kletka] : [])],
    [t],
  );
  const poId = useMemo(() => new Map(vseKletki.map((k) => [k.id, k])), [vseKletki]);

  const imyaPolya = useCallback(
    (id: string): string => {
      if (id === 'formula') return 'Формула ответа';
      if (id === 'itog') return `Итого · ${t.stolbcy[t.itog?.stolbec ?? 0]?.title ?? ''}`;
      const [i, c] = id.split('.').map(Number) as [number, number];
      return `${t.period} ${t.stroki[i]?.label ?? ''} · ${t.stolbcy[c]?.title ?? ''}`;
    },
    [t],
  );

  const izmenit = (id: string, val: string) => {
    setZnach((p) => ({ ...p, [id]: val }));
    setItogi((p) => {
      if (!(id in p)) return p;
      const next = { ...p };
      delete next[id];
      return next;
    });
  };

  function naKlavishu(k: Klavisha) {
    if (aktiv === null) return;
    const el = polya.current[aktiv];
    if (!el) return;
    const val = el.value;
    const a = el.selectionStart ?? val.length;
    const b = el.selectionEnd ?? a;
    let novoe = val;
    let kursor = a;
    if (k.t === 'vstavit') {
      novoe = val.slice(0, a) + k.v + val.slice(b);
      kursor = a + k.v.length;
    } else if (k.t === 'steret') {
      if (a !== b) novoe = val.slice(0, a) + val.slice(b);
      else if (a > 0) {
        novoe = val.slice(0, a - 1) + val.slice(a);
        kursor = a - 1;
      }
    } else if (k.t === 'vlevo') kursor = Math.max(0, a - 1);
    else if (k.t === 'vpravo') kursor = Math.min(val.length, b + 1);
    else {
      setAktiv(null);
      el.blur();
      return;
    }
    if (novoe !== val) izmenit(aktiv, novoe);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(kursor, kursor);
    });
  }

  const pole = (id: string, k: { seal: string; bukvy: boolean } | null, extra?: string) => {
    const val = znach[id] ?? '';
    const it = itogi[id];
    const pr = val.trim() ? predprosmotr(val) : null;
    const msg = soobshchenie(it);
    return (
      <span className={clsx('z13-zap__pole', extra)}>
        <input
          ref={(el) => {
            polya.current[id] = el;
          }}
          className={clsx(
            'z13-zap__input',
            it?.t === 'verno' && 'is-right',
            it && it.t !== 'verno' && it.t !== 'pusto' && 'is-wrong',
          )}
          value={val}
          inputMode={sensor ? 'none' : 'text'}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label={imyaPolya(id)}
          aria-invalid={it !== undefined && it.t !== 'verno' && it.t !== 'pusto'}
          onFocus={(e) => {
            setAktiv(id);
            /* Поле над клавиатурой: на телефоне она закрывает нижнюю половину экрана. */
            if (uzkiy) {
              const el = e.currentTarget;
              /* Только по вертикали: scrollIntoView сдвинул бы и страницу вбок. */
              window.setTimeout(() => {
                const r = el.getBoundingClientRect();
                window.scrollBy({ top: r.top - window.innerHeight * 0.25, behavior: 'smooth' });
              }, 50);
            }
          }}
          onBlur={() =>
            window.setTimeout(() => {
              const f = document.activeElement;
              if (!f || !Object.values(polya.current).includes(f as HTMLInputElement))
                setAktiv((a) => (a === id ? null : a));
            }, 0)
          }
          onChange={(e) => izmenit(id, e.target.value)}
        />
        {pr ? <Html className="z13-zap__pr" html={pr} /> : null}
        {k && msg ? <Html className="z13-zap__msg" html={msg} /> : null}
      </span>
    );
  };

  /* Пустые клетки уровней 3–4. */
  const pustye = useMemo(() => {
    if (uroven === 3) return new Set(t.uroven3);
    if (uroven === 4) return new Set(vseKletki.filter((k) => k.dano === null).map((k) => k.id));
    return new Set<string>();
  }, [uroven, t, vseKletki]);

  function proveritVvod() {
    const out: Record<string, Itog> = {};
    for (const id of pustye) {
      const k = poId.get(id);
      if (k) out[id] = proverit(znach[id] ?? '', k, tochki);
    }
    if ((znach.formula ?? '').trim())
      out.formula = proverit(znach.formula ?? '', t.formula, tochki);
    setItogi(out);
  }

  const proverennye = [...pustye].filter((id) => itogi[id] && itogi[id]!.t !== 'pusto');
  const vernyh = proverennye.filter((id) => itogi[id]!.t === 'verno').length;

  return (
    <div className={clsx('z13-zap', aktiv !== null && uzkiy && 'is-kl')}>
      <p className="z13-zap__title">Заполните таблицу</p>
      <div className="z13-zap__urovni" role="tablist" aria-label="Уровень">
        {UROVNI.map(({ u, label }) => (
          <button
            key={u}
            type="button"
            role="tab"
            aria-selected={uroven === u}
            className={clsx('z13-zap__uroven', uroven === u && 'is-active')}
            onClick={() => {
              setUroven(u);
              setItogi({});
              setAktiv(null);
            }}
          >
            <b>{u}</b> {label}
          </button>
        ))}
      </div>

      {uroven === 1 ? <Uroven1 t={t} key={`u1-${t.kluch}`} /> : null}
      {uroven === 2 ? <Uroven2 t={t} key={`u2-${t.kluch}`} /> : null}
      {uroven >= 3 ? (
        <>
          {uzkiy ? (
            <Karty t={t} pustye={pustye} pole={pole} itogi={itogi} znach={znach} />
          ) : (
            <TablitsaVvoda t={t} pustye={pustye} pole={pole} itogi={itogi} imya={imyaPolya} />
          )}
          <div className="z13-zap__actions">
            <Button variant="secondary" size="sm" onClick={proveritVvod}>
              Проверить таблицу
            </Button>
            {proverennye.length > 0 ? (
              <span
                className={clsx('z13-zap__status', vernyh === pustye.size && 'is-right')}
                role="status"
              >
                {vernyh === pustye.size
                  ? 'Таблица заполнена верно'
                  : `Верно ${vernyh} из ${pustye.size}`}
              </span>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="z13-zap__formula">
        <p className="z13-zap__formula-title">Формула ответа в буквах</p>
        <p className="z13-zap__formula-lead">
          Запишите ответ на вопрос задачи через буквы, затем подставьте числа и впишите ответ ниже.
        </p>
        {pole('formula', t.formula, 'z13-zap__pole--shirokoe')}
        {uroven < 3 ? (
          <div className="z13-zap__actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setItogi((p) => ({
                  ...p,
                  formula: proverit(znach.formula ?? '', t.formula, tochki),
                }))
              }
            >
              Проверить формулу
            </Button>
          </div>
        ) : null}
        {itogi.formula?.t === 'verno' ? (
          <p className="z13-zap__status is-right" role="status">
            Формула верная — подставьте числа.
          </p>
        ) : null}
      </div>

      {aktiv === null ? null : uzkiy ? (
        /* На телефоне — панель у нижнего края поверх меню: из карточки
           задачи она бы ушла под нижнее меню (своё наложение слоёв). */
        createPortal(
          <Klaviatura13 bukvy={t.klavishi} onKey={naKlavishu} zagolovok={imyaPolya(aktiv)} />,
          document.body,
        )
      ) : (
        <Klaviatura13 bukvy={t.klavishi} onKey={naKlavishu} zagolovok={imyaPolya(aktiv)} />
      )}
    </div>
  );
}

/* ── Шапка столбцов с подсказками ────────────────────────────────── */

function useShapka(t: TablitsaZapolni13) {
  const [podskazka, setPodskazka] = useState<number | null>(null);
  const shapka = (
    <tr>
      <th scope="col" className="z13-zap__sticky">
        {t.period}
      </th>
      {t.stolbcy.map((s, c) => (
        <th key={s.title} scope="col">
          <span className="z13-zap__name">{s.title}</span>
          <button
            type="button"
            className={clsx('z13-zap__q', podskazka === c && 'is-open')}
            aria-label={`Подсказка: ${s.title}`}
            aria-expanded={podskazka === c}
            onClick={() => setPodskazka(podskazka === c ? null : c)}
          >
            ?
          </button>
        </th>
      ))}
    </tr>
  );
  const otkryta = podskazka === null ? null : t.stolbcy[podskazka];
  const tekst = otkryta ? (
    <p className="z13-zap__hint" role="note">
      <b>{otkryta.title}.</b> <Html html={otkryta.podskazka} />
    </p>
  ) : null;
  return { shapka, tekst, podskazka, setPodskazka };
}

/** Клетка без ввода: дано или верная запись (в уровнях, где она заполнена). */
function Gotovaya({ k, kluch }: { k: KletkaZapolni13; kluch: string }) {
  return <Html className="z13-zap__dano" html={k.dano ?? openText(k.html, kluch)} />;
}

/* ── Уровень 1: выбрать верную таблицу ───────────────────────────── */

function Uroven1({ t }: { t: TablitsaZapolni13 }) {
  const [vybor, setVybor] = useState<number | null>(null);
  const [itog, setItog] = useState<boolean | null>(null);
  return (
    <div className="z13-zap__u1">
      <p className="z13-zap__lead">
        Одна таблица заполнена верно, в двух других — типичная ошибка. Выберите верную.
      </p>
      {t.uroven1.tablitsy.map((html, j) => (
        <div
          key={j}
          className={clsx(
            'z13-zap__variant',
            vybor === j && 'is-chosen',
            vybor === j && itog === true && 'is-right',
            vybor === j && itog === false && 'is-wrong',
          )}
        >
          <label className="z13-zap__variant-head">
            <input
              type="radio"
              name={`u1-${t.kluch}`}
              checked={vybor === j}
              onChange={() => {
                setVybor(j);
                setItog(null);
              }}
            />{' '}
            Таблица {BUKVY_VARIANTOV[j]}
          </label>
          <div
            className="z13-zap__scroll"
            dangerouslySetInnerHTML={{ __html: openText(html, t.kluch) }}
          />
        </div>
      ))}
      <div className="z13-zap__actions">
        <Button
          variant="secondary"
          size="sm"
          disabled={vybor === null}
          onClick={() => setItog(choiceMatches(`${t.kluch}:t:${vybor}`, t.uroven1.vernyy))}
        >
          Проверить
        </Button>
        {itog === null ? null : (
          <span className={clsx('z13-zap__status', itog && 'is-right')} role="status">
            {itog
              ? 'Верно: эта таблица заполнена правильно.'
              : 'В этой таблице ошибка. Проверьте, на что делят кредит, от какого долга считают проценты и умножают ли на k.'}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Уровень 2: выбрать выражение в пустых клетках ───────────────── */

function Uroven2({ t }: { t: TablitsaZapolni13 }) {
  const { shapka, tekst } = useShapka(t);
  const [vybor, setVybor] = useState<Record<string, number>>({});
  const [itogi, setItogi] = useState<Record<string, boolean>>({});
  const [otkryta, setOtkryta] = useState<string | null>(t.uroven2[0] ?? null);
  const pustye = new Set(t.uroven2);
  const kletka = (k: KletkaZapolni13, imya: string) => {
    if (!pustye.has(k.id)) return <Gotovaya k={k} kluch={t.kluch} />;
    const j = vybor[k.id];
    const it = itogi[k.id];
    return (
      <button
        type="button"
        className={clsx(
          'z13-zap__vybor',
          otkryta === k.id && 'is-open',
          it === true && 'is-right',
          it === false && 'is-wrong',
        )}
        aria-label={`Выбрать: ${imya}`}
        onClick={() => setOtkryta(k.id)}
      >
        {j === undefined ? (
          <span className="z13-zap__vybor-pusto">Выбрать</span>
        ) : (
          <Html html={openText(k.nabor[j]!, t.kluch)} />
        )}
      </button>
    );
  };
  const k0 = otkryta ? t.stroki.flatMap((s) => s.kletki).find((k) => k.id === otkryta) : undefined;
  const [ri, ci] = otkryta ? (otkryta.split('.').map(Number) as [number, number]) : [0, 0];
  return (
    <div className="z13-zap__u2">
      <p className="z13-zap__lead">Нажмите на пустую клетку и выберите выражение.</p>
      <div className="z13-zap__scroll">
        <table className="z13-zap__table">
          <thead>{shapka}</thead>
          <tbody>
            {t.stroki.map((s) => (
              <tr key={s.label}>
                <th scope="row" className="z13-zap__sticky">
                  {s.label}
                </th>
                {s.kletki.map((k, c) => (
                  <td key={k.id}>{kletka(k, `${t.period} ${s.label}, ${t.stolbcy[c]?.title}`)}</td>
                ))}
              </tr>
            ))}
            {t.itog ? (
              <tr className="z13-zap__itog-row">
                <th scope="row" className="z13-zap__sticky">
                  Итого
                </th>
                {t.stolbcy.map((s, c) => (
                  <td key={s.title}>
                    {c === t.itog!.stolbec ? <Gotovaya k={t.itog!.kletka} kluch={t.kluch} /> : null}
                  </td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {tekst}
      {k0 ? (
        <div className="z13-zap__varianty" role="group" aria-label="Варианты">
          <p className="z13-zap__varianty-title">
            {t.period} {t.stroki[ri]?.label} · {t.stolbcy[ci]?.title}
          </p>
          <div className="z13-zap__varianty-list">
            {k0.nabor.map((html, j) => (
              <button
                key={j}
                type="button"
                className={clsx('z13-zap__var', vybor[k0.id] === j && 'is-chosen')}
                onClick={() => {
                  setVybor((p) => ({ ...p, [k0.id]: j }));
                  setItogi((p) => {
                    const n = { ...p };
                    delete n[k0.id];
                    return n;
                  });
                  const sled = t.uroven2.find((id) => id !== k0.id && vybor[id] === undefined);
                  if (sled) setOtkryta(sled);
                }}
              >
                <Html html={openText(html, t.kluch)} />
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="z13-zap__actions">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const out: Record<string, boolean> = {};
            for (const id of t.uroven2) {
              const j = vybor[id];
              const k = t.stroki.flatMap((s) => s.kletki).find((x) => x.id === id);
              if (j !== undefined && k) out[id] = choiceMatches(`${t.kluch}:${id}:${j}`, k.vernyy);
            }
            setItogi(out);
          }}
        >
          Проверить
        </Button>
        {Object.keys(itogi).length > 0 ? (
          <span
            className={clsx(
              'z13-zap__status',
              Object.values(itogi).filter(Boolean).length === t.uroven2.length && 'is-right',
            )}
            role="status"
          >
            Верно {Object.values(itogi).filter(Boolean).length} из {t.uroven2.length}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ── Уровни 3–4: компьютер — таблица с полями ────────────────────── */

type Pole = (id: string, k: { seal: string; bukvy: boolean } | null, extra?: string) => ReactNode;

function TablitsaVvoda({
  t,
  pustye,
  pole,
  itogi,
  imya,
}: {
  t: TablitsaZapolni13;
  pustye: Set<string>;
  pole: Pole;
  itogi: Record<string, Itog>;
  imya: (id: string) => string;
}) {
  const { shapka, tekst } = useShapka(t);
  const kletka = (k: KletkaZapolni13) =>
    pustye.has(k.id) ? pole(k.id, k) : <Gotovaya k={k} kluch={t.kluch} />;
  const oshibki = Object.entries(itogi).filter(
    ([id, it]) => id !== 'formula' && it.t !== 'verno' && it.t !== 'pusto',
  );
  return (
    <>
      <div className="z13-zap__scroll">
        <table className="z13-zap__table">
          <thead>{shapka}</thead>
          <tbody>
            {t.stroki.map((s) => (
              <tr key={s.label}>
                <th scope="row" className="z13-zap__sticky">
                  {s.label}
                </th>
                {s.kletki.map((k) => (
                  <td key={k.id}>{kletka(k)}</td>
                ))}
              </tr>
            ))}
            {t.itog ? (
              <tr className="z13-zap__itog-row">
                <th scope="row" className="z13-zap__sticky">
                  Итого
                </th>
                {t.stolbcy.map((s, c) => (
                  <td key={s.title}>{c === t.itog!.stolbec ? kletka(t.itog!.kletka) : null}</td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {tekst}
      {oshibki.length > 0 ? (
        <ul className="z13-zap__oshibki">
          {oshibki.map(([id, it]) => (
            <li key={id}>
              <b>{imya(id)}:</b> <Html html={soobshchenie(it) ?? ''} />
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

/* ── Уровни 3–4: телефон — карточки по периодам ──────────────────── */

function Karty({
  t,
  pustye,
  pole,
  itogi,
  znach,
}: {
  t: TablitsaZapolni13;
  pustye: Set<string>;
  pole: Pole;
  itogi: Record<string, Itog>;
  znach: Record<string, string>;
}) {
  const sItogom = t.itog !== null && pustye.has('itog');
  const vsego = t.stroki.length + (sItogom ? 1 : 0);
  const [nomer, setNomer] = useState(0);
  const [tablitsa, setTablitsa] = useState(false);
  const [podskazka, setPodskazka] = useState<number | null>(null);
  const kasanie = useRef<number | null>(null);
  const idy = (i: number): string[] =>
    i < t.stroki.length ? t.stroki[i]!.kletki.map((k) => k.id) : ['itog'];
  const sostoyanie = (i: number): 'right' | 'wrong' | 'filled' | 'empty' => {
    const ids = idy(i).filter((id) => pustye.has(id));
    if (ids.length === 0) return 'filled';
    if (ids.some((id) => itogi[id] && itogi[id]!.t !== 'verno' && itogi[id]!.t !== 'pusto'))
      return 'wrong';
    if (ids.every((id) => itogi[id]?.t === 'verno')) return 'right';
    return ids.every((id) => (znach[id] ?? '').trim()) ? 'filled' : 'empty';
  };
  const s = nomer < t.stroki.length ? t.stroki[nomer]! : null;
  const polyaKarty =
    s !== null
      ? s.kletki.map((k, c) => ({ k, c }))
      : t.itog
        ? [{ k: t.itog.kletka, c: t.itog.stolbec }]
        : [];
  const shag = (d: number) => {
    setNomer((n) => Math.min(vsego - 1, Math.max(0, n + d)));
    setPodskazka(null);
  };
  return (
    <div className="z13-zap__karty">
      <ol className="z13-zap__progress" aria-label="Периоды">
        {Array.from({ length: vsego }, (_, i) => (
          <li key={i}>
            <button
              type="button"
              className={clsx('z13-zap__seg', `is-${sostoyanie(i)}`, i === nomer && 'is-current')}
              aria-label={i < t.stroki.length ? `${t.period} ${t.stroki[i]!.label}` : 'Итого'}
              aria-current={i === nomer ? 'step' : undefined}
              onClick={() => setNomer(i)}
            >
              {i < t.stroki.length ? t.stroki[i]!.label : 'Σ'}
            </button>
          </li>
        ))}
      </ol>
      <section
        className="z13-zap__karta"
        aria-label={s ? `${t.period} ${s.label}` : 'Итого'}
        onTouchStart={(e) => {
          kasanie.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const x0 = kasanie.current;
          const x1 = e.changedTouches[0]?.clientX;
          kasanie.current = null;
          if (x0 === null || x1 === undefined) return;
          if (x1 - x0 < -60) shag(1);
          else if (x1 - x0 > 60) shag(-1);
        }}
      >
        <header className="z13-zap__karta-head">
          <button
            type="button"
            className="z13-zap__strelka"
            aria-label="Предыдущий период"
            disabled={nomer === 0}
            onClick={() => shag(-1)}
          >
            ‹
          </button>
          <b>{s ? `${t.period} ${s.label}` : 'Итого'}</b>
          <button
            type="button"
            className="z13-zap__strelka"
            aria-label="Следующий период"
            disabled={nomer === vsego - 1}
            onClick={() => shag(1)}
          >
            ›
          </button>
        </header>
        {polyaKarty.map(({ k, c }) => (
          <div key={k.id} className="z13-zap__karta-pole">
            <span className="z13-zap__karta-label">
              {t.stolbcy[c]?.title}
              <button
                type="button"
                className={clsx('z13-zap__q', podskazka === c && 'is-open')}
                aria-label={`Подсказка: ${t.stolbcy[c]?.title}`}
                aria-expanded={podskazka === c}
                onClick={() => setPodskazka(podskazka === c ? null : c)}
              >
                ?
              </button>
            </span>
            {podskazka === c ? (
              <Html className="z13-zap__hint z13-zap__hint--mini" html={t.stolbcy[c]!.podskazka} />
            ) : null}
            {pustye.has(k.id) ? pole(k.id, k) : <Gotovaya k={k} kluch={t.kluch} />}
          </div>
        ))}
      </section>
      <button
        type="button"
        className="z13-zap__kak-tablitsa"
        aria-expanded={tablitsa}
        onClick={() => setTablitsa((x) => !x)}
      >
        {tablitsa ? 'Скрыть таблицу' : 'Показать таблицей'}
      </button>
      {tablitsa ? <TablitsaChtenie t={t} pustye={pustye} znach={znach} itogi={itogi} /> : null}
    </div>
  );
}

/** Вся таблица только для чтения: что вписано и что дано. */
function TablitsaChtenie({
  t,
  pustye,
  znach,
  itogi,
}: {
  t: TablitsaZapolni13;
  pustye: Set<string>;
  znach: Record<string, string>;
  itogi: Record<string, Itog>;
}) {
  const kletka = (k: KletkaZapolni13) => {
    if (!pustye.has(k.id)) return <Gotovaya k={k} kluch={t.kluch} />;
    const val = znach[k.id] ?? '';
    const pr = val.trim() ? predprosmotr(val) : null;
    const it = itogi[k.id];
    return (
      <span
        className={clsx(
          'z13-zap__chten',
          it?.t === 'verno' && 'is-right',
          it && it.t !== 'verno' && it.t !== 'pusto' && 'is-wrong',
        )}
      >
        {pr ? <Html html={pr} /> : val || '—'}
      </span>
    );
  };
  return (
    <div className="z13-zap__scroll">
      <table className="z13-zap__table z13-zap__table--chtenie">
        <thead>
          <tr>
            <th scope="col" className="z13-zap__sticky">
              {t.period}
            </th>
            {t.stolbcy.map((s) => (
              <th key={s.title} scope="col">
                {s.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.stroki.map((s) => (
            <tr key={s.label}>
              <th scope="row" className="z13-zap__sticky">
                {s.label}
              </th>
              {s.kletki.map((k) => (
                <td key={k.id}>{kletka(k)}</td>
              ))}
            </tr>
          ))}
          {t.itog ? (
            <tr className="z13-zap__itog-row">
              <th scope="row" className="z13-zap__sticky">
                Итого
              </th>
              {t.stolbcy.map((s, c) => (
                <td key={s.title}>{c === t.itog!.stolbec ? kletka(t.itog!.kletka) : null}</td>
              ))}
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
