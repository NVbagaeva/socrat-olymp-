'use client';

import { clsx } from 'clsx';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { UROKI_10 } from '@/content/uroki10';
import { useAdres, zamenitAdres } from '@/lib/zadanie10/adres';
import {
  BLOKI_UROKA,
  kodSerii,
  novyyKod,
  parseKodSerii,
  urokQuery,
  type BlokUrokaId,
  type NastroykiUrokov,
} from '@/lib/zadanie10/sborka';

/* Новый код комплекта создаётся один раз в браузере. */
let kodKesh: string | null = null;
const kodBrauzera = () => (kodKesh ??= novyyKod());
const nePodpisyvatsya = () => () => {};

/**
 * «Для репетиторов» №10: серия из 9 уроков по коду комплекта.
 *
 * Код (K7Q2AB, с перегенерациями — K7Q2AB-5.2) восстанавливает все уроки
 * на любом устройстве: состояние живёт в адресе страницы, а не в
 * localStorage. У урока — блоки (разминка, мини-проверка, шпаргалка,
 * разбор, самостоятельно, домашнее задание, итоговая), их можно
 * выключить и поменять число задач; «Перегенерировать урок» берёт задачи,
 * которых ещё не было в комплекте.
 */
export function Repetitory10({
  base,
  nazvaniya,
}: {
  base: string;
  nazvaniya: Record<string, string>;
}) {
  /* Код комплекта и урок — в адресе: ссылку можно открыть на другом устройстве. */
  const adres = useAdres();
  const q = new URLSearchParams(adres);
  const p = parseKodSerii(q.get('kod') ?? '');
  const nachalnyy = useSyncExternalStore(nePodpisyvatsya, kodBrauzera, () => '');
  const kod = p?.kod ?? nachalnyy;
  const regen = p?.regen ?? {};
  const uq = Number(q.get('u'));
  const urok = uq >= 1 && uq <= 9 ? uq : 1;
  const [prochee, setProchee] = useState<Omit<NastroykiUrokov, 'regen'>>({
    vyklyucheno: [],
    chislo: {},
  });
  const n: NastroykiUrokov = { regen, ...prochee };
  const [vvod, setVvod] = useState<string | null>(null);
  const [oshibka, setOshibka] = useState<string | null>(null);
  const zapisat = (k: string, r: Record<number, number>, u: number) =>
    zamenitAdres(new URLSearchParams({ kod: kodSerii(k, r), u: String(u) }));
  /* Новый комплект сразу попадает в адрес — перезагрузка его не теряет. */
  const bezKoda = p === null && kod !== '';
  useEffect(() => {
    if (bezKoda) {
      zamenitAdres(new URLSearchParams({ kod, u: String(urok) }));
    }
  }, [bezKoda, kod, urok]);

  const vkl = (id: BlokUrokaId) => !n.vyklyucheno.includes(id);
  const pereklyuchit = (id: BlokUrokaId) =>
    setProchee({
      ...prochee,
      vyklyucheno: vkl(id) ? [...n.vyklyucheno, id] : n.vyklyucheno.filter((x) => x !== id),
    });
  const ssylka = (l: 'uchenik' | 'uchitel') =>
    `${base}/pechat/?m=u&l=${l}&${urokQuery(kod, urok, n)}`;
  const u = UROKI_10.find((x) => x.no === urok);
  const blokiUroka = BLOKI_UROKA.filter((b) =>
    urok === 9
      ? b.id === 'itog' || b.id === 'razminka' || b.id === 'proverka'
      : b.id !== 'itog' && !(urok === 1 && (b.id === 'razminka' || b.id === 'proverka')),
  );

  return (
    <div className="z10-rep">
      <section className="z10-gen__blok">
        <h2 className="t-h3">Код комплекта</h2>
        <p className="z10-o__lead">
          Код восстанавливает всю серию из девяти уроков на любом устройстве. Сохраните его или
          ссылку на эту страницу.
        </p>
        <form
          className="z10-rep__kod"
          onSubmit={(e) => {
            e.preventDefault();
            const p = parseKodSerii(vvod ?? '');
            if (!p) {
              setOshibka('Код — 6 латинских букв и цифр, например K7Q2AB или K7Q2AB-5.2.');
              return;
            }
            setOshibka(null);
            setVvod(null);
            zapisat(p.kod, p.regen, urok);
          }}
        >
          <input
            aria-label="Код комплекта"
            value={vvod ?? kodSerii(kod, regen)}
            onChange={(e) => setVvod(e.target.value)}
          />
          <button type="submit" className="btn btn--secondary">
            Открыть комплект
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              const k = novyyKod();
              zapisat(k, {}, urok);
              setVvod(null);
              setProchee({ vyklyucheno: [], chislo: {} });
            }}
          >
            Новый комплект
          </button>
        </form>
        {oshibka ? <p role="alert">{oshibka}</p> : null}
        <p>
          Текущий код: <b className="z10-rep__tekushchiy">{kod ? kodSerii(kod, n.regen) : '…'}</b>
        </p>
      </section>
      <section className="z10-gen__blok">
        <h2 className="t-h3">Уроки</h2>
        <ol className="z10-rep__uroki">
          {UROKI_10.map((x) => (
            <li key={x.no}>
              <button
                type="button"
                className={clsx('z10-rep__urok', x.no === urok ? 'is-active' : '')}
                aria-pressed={x.no === urok}
                onClick={() => zapisat(kod, regen, x.no)}
              >
                <span className="z10-rep__urok-no">Урок {x.no}</span>
                <span>{x.title}</span>
                {n.regen[x.no] ? (
                  <span className="z10-metka">перегенерирован ×{n.regen[x.no]}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ol>
      </section>
      {u ? (
        <section className="z10-gen__blok">
          <h2 className="t-h3">
            Урок {u.no}. {u.title}
          </h2>
          {u.prototipy.length > 0 ? (
            <p className="z10-o__lead">
              Прототипы: {u.prototipy.map((p) => nazvaniya[p] ?? p).join('; ')}.
            </p>
          ) : null}
          <ul className="z10-rep__bloki">
            {blokiUroka.map((b) => (
              <li key={b.id}>
                <label>
                  <input type="checkbox" checked={vkl(b.id)} onChange={() => pereklyuchit(b.id)} />{' '}
                  <b>{b.title}</b> — {b.note}
                </label>
                {b.po > 0 ? (
                  <label className="z10-rep__chislo">
                    {b.poProto ? 'на прототип' : 'всего'}{' '}
                    <select
                      value={n.chislo[b.id] ?? b.po}
                      onChange={(e) =>
                        setProchee({
                          ...prochee,
                          chislo: { ...prochee.chislo, [b.id]: Number(e.target.value) },
                        })
                      }
                    >
                      {Array.from({ length: b.id === 'itog' ? 3 : 6 }, (_, k) =>
                        b.id === 'itog' ? (k + 1) * 5 : k + 1,
                      ).map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="z10-gen__knopki">
            <a className="btn btn--primary" href={ssylka('uchenik')} target="_blank" rel="noopener">
              Скачать лист ученика
            </a>
            <a
              className="btn btn--secondary"
              href={ssylka('uchitel')}
              target="_blank"
              rel="noopener"
            >
              Скачать лист учителя
            </a>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => zapisat(kod, { ...regen, [urok]: (regen[urok] ?? 0) + 1 }, urok)}
            >
              Перегенерировать урок
            </button>
            <a
              className="btn btn--ghost"
              href={`${base}/shpargalka/${urok}/`}
              target="_blank"
              rel="noopener"
            >
              Шпаргалка к уроку {urok}
            </a>
          </div>
        </section>
      ) : null}
    </div>
  );
}
