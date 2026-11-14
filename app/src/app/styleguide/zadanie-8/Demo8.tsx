import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Tex } from '@/components/ui/Tex';
import { generate } from '@/lib/vychisleniya/generate';
import { ru } from '@/lib/vychisleniya/numbers';
import { prototypeById } from '@/lib/vychisleniya/prototypes';
import {
  DELIMOST8,
  FORMULY8,
  GRUPPY8,
  SHAGI8,
  SHAPKA8,
  VARIANTY8,
  type Gruppa8,
  type Variant8,
} from './demo8Data';

/* Демо двух вариантов оформления вкладок «О задании» и «Тренажёр» №8.

   Страница статическая: раскрытия — на <details>, состояния экрана
   задачи показаны рядом отдельными кадрами. Так оба варианта видны
   целиком на одном снимке; живое поведение (ввод, таймер, сессия)
   появится на шаге реализации. Разметка одна, варианты различаются
   классом .d8--a / .d8--b и несколькими ветками. */

const tex = (s: string) => `$${s}$`;

function zadacha(prototype: string) {
  const t = generate(prototype, `${prototype}#1`, 'base');
  return { ...t, nazvanie: prototypeById(prototype)?.nazvanie ?? prototype };
}

/* ── Мелкие детали ───────────────────────────────────────────── */

function Kadr({ id, nazvanie, children }: { id: string; nazvanie: string; children: ReactNode }) {
  return (
    <section className="d8-kadr" id={id}>
      <p className="d8-kadr__metka">{nazvanie}</p>
      {children}
    </section>
  );
}

function Znak({
  gruppa,
  size = 'md',
}: {
  gruppa: Pick<Gruppa8, 'znak' | 'ton'>;
  size?: 'md' | 'sm';
}) {
  return (
    <span
      className={clsx('d8-znak', `d8-znak--${gruppa.ton}`, size === 'sm' && 'd8-znak--sm')}
      aria-hidden="true"
    >
      <Tex text={tex(gruppa.znak)} />
    </span>
  );
}

function Polosa({ dolya, ton = 'blue' }: { dolya: number; ton?: 'blue' | 'terra' | 'green' }) {
  return (
    <span className={clsx('d8-polosa', `d8-polosa--${ton}`)} aria-hidden="true">
      <span style={{ width: `${Math.round(dolya * 100)}%` }} />
    </span>
  );
}

function Ikonka({
  name,
}: {
  name:
    | 'mix'
    | 'temy'
    | 'oshibki'
    | 'lampa'
    | 'zakladka'
    | 'pauza'
    | 'chasy'
    | 'da'
    | 'net'
    | 'strelka';
}) {
  const d: Record<typeof name, string> = {
    mix: 'M4 7h3l8 10h5M4 17h3l2.5-3.1M14.5 10.1 15 9.5 15 7h5M17 4l3 3-3 3M17 14l3 3-3 3',
    temy: 'M4 6h10M4 12h16M4 18h7M17 4v4M14 16v4',
    oshibki: 'M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5',
    lampa: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V15h7v-1.1A6 6 0 0 0 12 3Z',
    zakladka: 'M7 4h10v16l-5-3.5L7 20V4Z',
    pauza: 'M9 5v14M15 5v14',
    chasy: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
    da: 'M5 12.5 10 17l9-10',
    net: 'M6 6l12 12M18 6 6 18',
    strelka: 'M5 12h14M13 6l6 6-6 6',
  };
  return (
    <svg
      className="d8-ico"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d[name]} />
    </svg>
  );
}

/* ── «О задании» ─────────────────────────────────────────────── */

function Shapka() {
  return (
    <header className="d8-shapka d8-glass">
      <div className="d8-shapka__text">
        <p className="d8-nad">{SHAPKA8.nadzagolovok}</p>
        <h2 className="d8-h2">{SHAPKA8.zagolovok}</h2>
        <p className="d8-lead">{SHAPKA8.lead}</p>
      </div>
      <ul className="d8-fakty">
        {SHAPKA8.fakty.map((f) => (
          <li className="d8-fakt" key={f.podpis}>
            <b>{f.znachenie}</b>
            <span>{f.podpis}</span>
          </li>
        ))}
      </ul>
      <div className="d8-opasno">
        <p className="d8-opasno__zag">Чем опасно</p>
        <ul>
          {SHAPKA8.opasno.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </header>
  );
}

function Primer({ prototype }: { prototype: string }) {
  const t = zadacha(prototype);
  const podpisi = SHAGI8[prototype];
  return (
    <div className="d8-primer">
      <p className="d8-primer__metka">Разобранный пример</p>
      <div className="d8-uslovie d8-uslovie--sm">
        <Tex text={t.uslovie} />
      </div>
      <ol className="d8-shagi">
        {t.razbor.map((line, i) => (
          <li className="d8-shag" key={i}>
            <p className="d8-shag__chto">{podpisi?.shagi[i] ?? line.chto}</p>
            <div className="d8-shag__formula">
              <Tex text={`$${line.tex}$`} />
            </div>
          </li>
        ))}
      </ol>
      {podpisi?.sovet === undefined ? null : (
        <p className="d8-sovet">
          <b>Умное сокращение.</b> <Tex text={podpisi.sovet} />
        </p>
      )}
      <p className="d8-otvet">
        Ответ: <b>{ru(t.otvet)}</b>
      </p>
      <div className="d8-knopki">
        <a className="d8-btn d8-btn--primary" href="#d8-zadacha">
          Потренировать этот тип
        </a>
        <a className="d8-btn d8-btn--tihaya" href="#d8-o-zadanii">
          Опорные задачи
        </a>
      </div>
    </div>
  );
}

function TipKartochka({ prototype, open }: { prototype: string; open?: boolean }) {
  const p = prototypeById(prototype);
  if (p === undefined) {
    return null;
  }
  return (
    <details className="d8-tip" open={open}>
      <summary className="d8-tip__summary" title={`Прототип ${p.id}`}>
        <span className="d8-tip__nazvanie">
          <Tex text={p.nazvanie} />
        </span>
        <span className="d8-tip__kod">{p.id}</span>
        <span className="d8-shevron" aria-hidden="true" />
      </summary>
      <Primer prototype={prototype} />
    </details>
  );
}

function GruppaKartochka({ gruppa, open }: { gruppa: Gruppa8; open?: boolean }) {
  const n = gruppa.prototypes.length;
  const povtorit = gruppa.oshibokIz5 >= 2;
  return (
    <details className={clsx('d8-gruppa d8-glass', `d8-gruppa--${gruppa.ton}`)} open={open}>
      <summary className="d8-gruppa__summary">
        <Znak gruppa={gruppa} />
        <span className="d8-gruppa__text">
          <span className="d8-gruppa__nazvanie">{gruppa.nazvanie}</span>
          <span className="d8-gruppa__tipov">
            {n} {n === 1 ? 'тип' : n < 5 ? 'типа' : 'типов'}
          </span>
        </span>
        <span className="d8-gruppa__progress">
          {gruppa.resheno === 0 ? (
            <span className="d8-gruppa__schet">ещё не начато</span>
          ) : (
            <span className="d8-gruppa__schet">
              решено {gruppa.resheno} · верно {gruppa.verno}
            </span>
          )}
          <Polosa
            dolya={gruppa.resheno === 0 ? 0 : gruppa.verno / gruppa.resheno}
            ton={povtorit ? 'terra' : 'blue'}
          />
          {povtorit ? <span className="d8-metka d8-metka--terra">Стоит повторить</span> : null}
        </span>
        <span className="d8-shevron" aria-hidden="true" />
      </summary>
      <div className="d8-tipy">
        {gruppa.prototypes.map((id, i) => (
          <TipKartochka key={id} prototype={id} open={open === true && i === 0} />
        ))}
      </div>
    </details>
  );
}

function ChtoZnat() {
  return (
    <section className="d8-znat">
      <h3 className="d8-h3">Что нужно знать</h3>
      <div className="d8-znat__setka">
        {FORMULY8.map((blok) => (
          <div className={clsx('d8-ramka', `d8-ramka--${blok.ton}`)} key={blok.gruppa}>
            <p className="d8-ramka__plashka">{blok.gruppa}</p>
            <ul className="d8-ramka__spisok">
              {blok.formuly.map((f) => (
                <li key={f.tex}>
                  <span className="d8-ramka__formula">
                    <Tex text={tex(f.tex)} />
                  </span>
                  <span className="d8-ramka__primer">
                    <i>например</i> <Tex text={tex(f.primer)} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <details className="d8-svernut d8-glass">
        <summary>
          Признаки делимости — чтобы быстро сокращать дроби
          <span className="d8-shevron" aria-hidden="true" />
        </summary>
        <ul className="d8-delimost">
          {DELIMOST8.map((row) => (
            <li key={row.na}>
              <b>на {row.na}</b>
              <span>{row.pravilo}</span>
              <i>
                <Tex text={row.primer} />
              </i>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

/* ── «Тренажёр» ──────────────────────────────────────────────── */

function Start() {
  const rezhimy = [
    {
      ico: 'mix' as const,
      zag: 'Все типы вперемешку',
      lead: '10 задач из всех пяти групп — как на экзамене.',
      ton: 'blue',
    },
    {
      ico: 'temy' as const,
      zag: 'Выбрать темы',
      lead: 'Группы и типы, число задач, таймер.',
      ton: 'blue',
    },
    {
      ico: 'oshibki' as const,
      zag: 'Работа над ошибками',
      lead: '5 типов, где были ошибки, — новые задачи на них.',
      ton: 'terra',
    },
  ];
  return (
    <div className="d8-rezhimy">
      {rezhimy.map((r) => (
        <a
          className={clsx('d8-rezhim d8-glass', r.ton === 'terra' && 'd8-rezhim--terra')}
          href="#d8-temy"
          key={r.zag}
        >
          <span className="d8-rezhim__ico">
            <Ikonka name={r.ico} />
          </span>
          <span className="d8-rezhim__text">
            <b>{r.zag}</b>
            <span>{r.lead}</span>
          </span>
          <span className="d8-rezhim__strelka">
            <Ikonka name="strelka" />
          </span>
        </a>
      ))}
    </div>
  );
}

function VyborTem({ v }: { v: Variant8 }) {
  const vybrany = new Set(['stepeni', 'logarifmy']);
  return (
    <div className="d8-vybor d8-glass">
      <div className="d8-vybor__verh">
        <h3 className="d8-h4">Что тренируем</h3>
        <span className="d8-vybor__vse">
          <button type="button" className="d8-ssylka">
            Выбрать все
          </button>
          <button type="button" className="d8-ssylka">
            Снять все
          </button>
        </span>
      </div>
      {v === 'a' ? (
        <>
          <div className="d8-chipy">
            {GRUPPY8.map((g) => (
              <button
                type="button"
                className={clsx('d8-chip', vybrany.has(g.id) && 'is-on')}
                key={g.id}
                aria-pressed={vybrany.has(g.id)}
              >
                {g.nazvanie} <span className="d8-chip__n">{g.prototypes.length}</span>
              </button>
            ))}
          </div>
          <p className="d8-podpis">Типы выбранных групп</p>
          <div className="d8-chipy d8-chipy--tipy">
            {GRUPPY8.filter((g) => vybrany.has(g.id))
              .flatMap((g) => g.prototypes)
              .map((id, i) => (
                <button
                  type="button"
                  className={clsx('d8-chip d8-chip--tip', i !== 4 && 'is-on')}
                  key={id}
                  aria-pressed={i !== 4}
                >
                  <Tex text={prototypeById(id)?.nazvanie ?? id} />
                </button>
              ))}
          </div>
        </>
      ) : (
        <ul className="d8-stroki">
          {GRUPPY8.map((g) => (
            <li className={clsx('d8-stroka', vybrany.has(g.id) && 'is-on')} key={g.id}>
              <button type="button" className="d8-stroka__gruppa" aria-pressed={vybrany.has(g.id)}>
                <span className="d8-galka" aria-hidden="true" />
                <Znak gruppa={g} size="sm" />
                <b>{g.nazvanie}</b>
                <span className="d8-chip__n">{g.prototypes.length}</span>
              </button>
              {vybrany.has(g.id) ? (
                <div className="d8-chipy d8-chipy--tipy">
                  {g.prototypes.map((id, i) => (
                    <button
                      type="button"
                      className={clsx(
                        'd8-chip d8-chip--tip',
                        !(g.id === 'logarifmy' && i === 1) && 'is-on',
                      )}
                      key={id}
                    >
                      <Tex text={prototypeById(id)?.nazvanie ?? id} />
                    </button>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <div className="d8-nastroyki">
        <div>
          <p className="d8-podpis">Сколько задач</p>
          <div className="d8-seg" role="group" aria-label="Сколько задач">
            {['5', '10', '20', 'Без конца'].map((n) => (
              <button
                type="button"
                className={clsx(n === '10' && 'is-on')}
                key={n}
                aria-pressed={n === '10'}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="d8-podpis">Таймер</p>
          <div className="d8-seg" role="group" aria-label="Таймер">
            <button type="button" className="is-on" aria-pressed="true">
              С таймером
            </button>
            <button type="button" aria-pressed="false">
              Без таймера
            </button>
          </div>
        </div>
      </div>
      <div className="d8-vybor__niz">
        <p className="d8-vybor__itog">
          <b>7 типов</b> · 10 задач · с таймером
        </p>
        <a className="d8-btn d8-btn--primary d8-btn--lg" href="#d8-zadacha">
          Начать тренировку
        </a>
      </div>
    </div>
  );
}

function Panel({ nomer, vsego, vremya }: { nomer: number; vsego: number; vremya: string }) {
  return (
    <div className="d8-panel">
      <span className="d8-panel__polosa" aria-hidden="true">
        <span style={{ width: `${(nomer / vsego) * 100}%` }} />
      </span>
      <div className="d8-panel__ryad">
        <span className="d8-panel__schet">
          <b>{nomer}</b> из {vsego}
        </span>
        <span className="d8-panel__vremya">
          <Ikonka name="chasy" /> {vremya}
        </span>
        <span className="d8-panel__knopki">
          <button type="button" className="d8-kruglaya" aria-label="Пауза">
            <Ikonka name="pauza" />
          </button>
          <button type="button" className="d8-ssylka">
            Завершить
          </button>
        </span>
      </div>
    </div>
  );
}

type Sostoyanie = 'podskazka' | 'verno' | 'neverno';

function Zadacha({
  prototype,
  sostoyanie,
  nomer,
  vremya,
  vvod,
}: {
  prototype: string;
  sostoyanie: Sostoyanie;
  nomer: number;
  vremya: string;
  vvod: string;
}) {
  const t = zadacha(prototype);
  const podpisi = SHAGI8[prototype];
  const otvechen = sostoyanie !== 'podskazka';
  return (
    <div className={clsx('d8-ekran', `d8-ekran--${sostoyanie}`)}>
      <Panel nomer={nomer} vsego={10} vremya={vremya} />
      <div className="d8-ekran__telo">
        <article className="d8-zadacha d8-glass">
          <div className="d8-zadacha__verh">
            <span className="d8-metka">
              <Tex text={t.nazvanie} />
            </span>
            <button
              type="button"
              className="d8-kruglaya d8-kruglaya--tihaya"
              aria-label="Отложить на потом"
            >
              <Ikonka name="zakladka" />
            </button>
          </div>
          <div className="d8-uslovie">
            <Tex text={t.uslovie} />
          </div>
        </article>

        <div className="d8-otvetnaya d8-glass">
          <label className="d8-pole">
            <span className="d8-podpis">Ответ</span>
            <span className="d8-pole__ryad">
              <input
                className="d8-input"
                inputMode="decimal"
                autoComplete="off"
                defaultValue={vvod}
                readOnly={otvechen}
                placeholder="Число"
              />
              {otvechen ? null : (
                <button type="button" className="d8-btn d8-btn--primary d8-btn--lg">
                  Проверить
                </button>
              )}
            </span>
          </label>

          {sostoyanie === 'podskazka' ? (
            <>
              <button type="button" className="d8-podskazka-knopka">
                <Ikonka name="lampa" /> Подсказка
              </button>
              <p className="d8-podskazka">
                <Ikonka name="lampa" />
                <span>{podpisi?.podskazka}</span>
              </p>
            </>
          ) : (
            <div
              className={clsx(
                'd8-verdikt',
                sostoyanie === 'verno' ? 'd8-verdikt--da' : 'd8-verdikt--net',
              )}
              role="status"
            >
              <span className="d8-verdikt__ico">
                <Ikonka name={sostoyanie === 'verno' ? 'da' : 'net'} />
              </span>
              <span className="d8-verdikt__text">
                <b>{sostoyanie === 'verno' ? 'Верно' : 'Пока неверно'}</b>
                <span>
                  {sostoyanie === 'verno' ? (
                    'Решено за 0:48 — быстрее вашего среднего.'
                  ) : (
                    <>
                      Правильный ответ: <b>{ru(t.otvet)}</b>. Посмотрите, на каком шаге разошлось.
                    </>
                  )}
                </span>
              </span>
            </div>
          )}

          {sostoyanie === 'neverno' ? (
            <div className="d8-reshenie">
              <p className="d8-podpis">Решение по шагам</p>
              <ol className="d8-shagi">
                {t.razbor.map((line, i) => (
                  <li className="d8-shag" key={i}>
                    <p className="d8-shag__chto">{podpisi?.shagi[i] ?? line.chto}</p>
                    <div className="d8-shag__formula">
                      <Tex text={`$${line.tex}$`} />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {otvechen ? (
            <div className="d8-knopki d8-knopki--posle">
              <button type="button" className="d8-btn d8-btn--primary d8-btn--lg">
                Дальше <Ikonka name="strelka" />
              </button>
              {sostoyanie === 'verno' ? (
                <button type="button" className="d8-btn d8-btn--tihaya">
                  Решение
                </button>
              ) : null}
              <button type="button" className="d8-btn d8-btn--tihaya">
                Похожая задача
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Itogi() {
  const stroki = [
    { g: GRUPPY8[0], verno: 3, vsego: 3 },
    { g: GRUPPY8[1], verno: 1, vsego: 3 },
    { g: GRUPPY8[2], verno: 3, vsego: 4 },
  ];
  return (
    <div className="d8-itogi d8-glass">
      <div className="d8-itogi__glavnoe">
        <p className="d8-itogi__schet">
          <b>7</b>
          <span>из 10</span>
        </p>
        <div>
          <h3 className="d8-h3">Хорошая тренировка</h3>
          <p className="d8-lead">Время 9:42 · в среднем 58 с на задачу · одна с подсказкой</p>
        </div>
      </div>
      <ul className="d8-razbivka">
        {stroki.map(({ g, verno, vsego }) =>
          g === undefined ? null : (
            <li key={g.id} className={clsx(verno / vsego < 0.5 && 'is-slabo')}>
              <Znak gruppa={g} size="sm" />
              <span className="d8-razbivka__nazvanie">{g.nazvanie}</span>
              <Polosa dolya={verno / vsego} ton={verno / vsego < 0.5 ? 'terra' : 'green'} />
              <span className="d8-razbivka__schet">
                {verno} из {vsego}
              </span>
              {verno / vsego < 0.5 ? (
                <span className="d8-metka d8-metka--terra">Просел</span>
              ) : null}
            </li>
          ),
        )}
      </ul>
      <div className="d8-knopki">
        <button type="button" className="d8-btn d8-btn--warm d8-btn--lg">
          Работа над ошибками · 3 задачи
        </button>
        <button type="button" className="d8-btn d8-btn--tihaya">
          Ещё раз
        </button>
        <button type="button" className="d8-btn d8-btn--tihaya">
          К выбору тем
        </button>
      </div>
      <p className="d8-snoska">
        «Работа над ошибками» даёт новые задачи тех же типов, а не те же самые.
      </p>
    </div>
  );
}

function ProgressPanel() {
  return (
    <details className="d8-svernut d8-glass" open>
      <summary>
        Мой прогресс · решено 41 · верно 29
        <span className="d8-shevron" aria-hidden="true" />
      </summary>
      <ul className="d8-razbivka d8-razbivka--plotno">
        {GRUPPY8.map((g) => (
          <li key={g.id}>
            <Znak gruppa={g} size="sm" />
            <span className="d8-razbivka__nazvanie">{g.nazvanie}</span>
            <Polosa
              dolya={g.resheno === 0 ? 0 : g.verno / g.resheno}
              ton={g.oshibokIz5 >= 2 ? 'terra' : 'blue'}
            />
            <span className="d8-razbivka__schet">
              {g.resheno === 0 ? '—' : `${g.verno} из ${g.resheno}`}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* ── Страница варианта ───────────────────────────────────────── */

export function Demo8({ v }: { v: Variant8 }) {
  const variant = VARIANTY8.find((item) => item.id === v) ?? VARIANTY8[0];
  return (
    <main className={clsx('d8', `d8--${v}`)}>
      <nav className="d8-demo-nav" aria-label="Варианты демо">
        <span className="d8-demo-nav__zag">
          Демо №8 · вариант {variant.bukva} «{variant.nazvanie}»
        </span>
        {VARIANTY8.map((item) => (
          <a
            key={item.id}
            href={`/styleguide/zadanie-8/${item.id}/`}
            className={clsx('d8-demo-nav__ssylka', item.id === v && 'is-on')}
          >
            {item.bukva} · {item.nazvanie}
          </a>
        ))}
      </nav>
      <p className="d8-demo-lead">{variant.lead} Прогресс ученика на странице — образец.</p>

      <h1 className="d8-razdel">Вкладка «О задании»</h1>
      <Kadr
        id="d8-o-zadanii"
        nazvanie="Шапка и карта типов: первая группа раскрыта, первый тип открыт"
      >
        <Shapka />
        <div className="d8-gruppy">
          {GRUPPY8.map((g, i) => (
            <GruppaKartochka key={g.id} gruppa={g} open={i === 0} />
          ))}
        </div>
      </Kadr>
      <Kadr id="d8-znat" nazvanie="Блок «Что нужно знать»">
        <ChtoZnat />
      </Kadr>

      <h1 className="d8-razdel">Вкладка «Тренажёр»</h1>
      <Kadr id="d8-start" nazvanie="Стартовый экран: три режима">
        <Start />
        <ProgressPanel />
      </Kadr>
      <Kadr id="d8-temy" nazvanie="Выбор тем">
        <VyborTem v={v} />
      </Kadr>
      <Kadr id="d8-zadacha" nazvanie="Экран задачи · до ответа, подсказка открыта">
        <Zadacha prototype="8.M" sostoyanie="podskazka" nomer={3} vremya="04:12" vvod="" />
      </Kadr>
      <Kadr id="d8-verno" nazvanie="Экран задачи · ответ верный">
        <Zadacha prototype="8.A" sostoyanie="verno" nomer={4} vremya="05:00" vvod="81" />
      </Kadr>
      <Kadr id="d8-neverno" nazvanie="Экран задачи · ответ неверный, решение раскрыто">
        <Zadacha prototype="8.H" sostoyanie="neverno" nomer={5} vremya="06:31" vvod="4" />
      </Kadr>
      <Kadr id="d8-itogi" nazvanie="Итоги сессии">
        <Itogi />
      </Kadr>
    </main>
  );
}
