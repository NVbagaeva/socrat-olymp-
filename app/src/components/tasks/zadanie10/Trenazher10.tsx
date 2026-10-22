'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { TRENAZHER_10 } from '@/content/zadanie10';
import { zagruzitIndeks, zagruzitZadachi, type ZadachaLite } from '@/lib/zadanie10/dannye';
import type { Istochnik } from '@/lib/zadanie10/sborka';
import {
  SESSIYA_PO_UMOLCHANIYU,
  useSessiya10,
  zapisatSessiyu,
  type Sessiya10,
} from '@/lib/zadanie10/trenazher';
import { Zadacha10, type IllInfo } from './Zadacha10';

export interface ProtoInfo10 {
  id: string;
  kod: string;
  title: string;
  group: string;
  /** Якорь теории для «Повторить теорию»: «teoriya-edinicy», «ed-stepeni». */
  teoriya?: string;
  izKursa: boolean;
}

const SKOLKO = [5, 10, 15, 20];

/** Перемешать (для плана тренировки годится обычный Math.random). */
function peremeshat<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j] as T, b[i] as T];
  }
  return b;
}

/**
 * Тренажёр задания №10: выбор прототипов и источника («только ФИПИ» /
 * «сгенерированные» / вперемешку), решение по одной задаче, итог.
 * Сессия живёт в sessionStorage — переход между вкладками её не сбрасывает.
 */
export function Trenazher10({
  prototipy,
  gruppy,
  ill,
  base,
}: {
  prototipy: ProtoInfo10[];
  gruppy: { id: string; title: string }[];
  ill: Record<string, IllInfo>;
  base: string;
}) {
  const s = useSessiya10();
  const [zadachi, setZadachi] = useState<Map<string, ZadachaLite> | null>(null);
  const [oshibka, setOshibka] = useState<string | null>(null);
  const obnovit = (patch: Partial<Sessiya10>) => zapisatSessiyu({ ...s, ...patch });

  /* ?tipy=P11,P12 из теории и «О задании»: открываем выбор с ними. */
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tipy');
    if (!t) {
      return;
    }
    const ids = t.split(',').filter((id) => prototipy.some((p) => p.id === id));
    if (ids.length > 0) {
      zapisatSessiyu({
        ...SESSIYA_PO_UMOLCHANIYU,
        tipy: ids,
        istochnik: s.istochnik,
        skolko: s.skolko,
      });
      window.history.replaceState(null, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только при входе на страницу
  }, []);

  /* Тексты задач плана. */
  useEffect(() => {
    if (s.ekran === 'vybor' || s.plan.length === 0) {
      return;
    }
    let zhivo = true;
    zagruzitZadachi(s.tipy)
      .then((m) => zhivo && setZadachi(m))
      .catch((e: Error) => zhivo && setOshibka(e.message));
    return () => {
      zhivo = false;
    };
  }, [s.ekran, s.plan, s.tipy]);

  const nachat = async () => {
    setOshibka(null);
    const indeks = await zagruzitIndeks();
    const po = new Map<string, string[]>();
    for (const z of indeks) {
      if (!s.tipy.includes(z.p)) {
        continue;
      }
      if (s.istochnik === 'fipi' && z.s !== 'f') {
        continue;
      }
      if (s.istochnik === 'analog' && z.s !== 'a') {
        continue;
      }
      po.set(z.p, [...(po.get(z.p) ?? []), z.id]);
    }
    /* Прототипы без задач ФИПИ (из курса) в режиме «только ФИПИ» берут аналоги. */
    if (s.istochnik === 'fipi') {
      for (const p of s.tipy) {
        if (!po.has(p)) {
          po.set(
            p,
            indeks.filter((z) => z.p === p).map((z) => z.id),
          );
        }
      }
    }
    const ochered = [...po.entries()].map(([p, ids]) => [p, peremeshat(ids)] as const);
    const plan: string[] = [];
    for (let i = 0; plan.length < s.skolko && i < s.skolko * 4; i += 1) {
      const e = ochered[i % ochered.length];
      const id = e?.[1].shift();
      if (id) {
        plan.push(id);
      }
    }
    if (plan.length === 0) {
      setOshibka('Нет задач для выбранных прототипов.');
      return;
    }
    obnovit({ ekran: 'reshenie', plan, tekushchaya: 0, otvety: {} });
  };

  const tekushchiyId = s.plan[s.tekushchaya];
  const z = tekushchiyId ? zadachi?.get(tekushchiyId) : undefined;
  const proto = useMemo(() => prototipy.find((p) => p.id === z?.prototypeId), [prototipy, z]);
  const resheno = Object.keys(s.otvety).length;
  const verno = Object.values(s.otvety).filter((o) => o.verno).length;

  if (s.ekran === 'vybor') {
    return (
      <div className="z10-tr">
        <h2 className="t-h3">Что тренируем</h2>
        <div className="z10-tr__istochnik" role="radiogroup" aria-label="Источник задач">
          {TRENAZHER_10.istochniki.map((i) => (
            <button
              type="button"
              role="radio"
              aria-checked={s.istochnik === i.id}
              key={i.id}
              className={clsx('z10-tr__pereklyuchatel', s.istochnik === i.id ? 'is-active' : '')}
              onClick={() => obnovit({ istochnik: i.id as Istochnik })}
            >
              {i.label}
            </button>
          ))}
        </div>
        {gruppy.map((g) => {
          const pg = prototipy.filter((p) => p.group === g.id);
          const vse = pg.every((p) => s.tipy.includes(p.id));
          return (
            <fieldset key={g.id} className="z10-tr__gruppa">
              <legend>
                <label>
                  <input
                    type="checkbox"
                    checked={vse}
                    onChange={() =>
                      obnovit({
                        tipy: vse
                          ? s.tipy.filter((t) => !pg.some((p) => p.id === t))
                          : [...new Set([...s.tipy, ...pg.map((p) => p.id)])],
                      })
                    }
                  />{' '}
                  Группа {g.id}. {g.title}
                </label>
              </legend>
              <div className="z10-tr__chipy">
                {pg.map((p) => (
                  <label
                    key={p.id}
                    className={clsx('z10-tr__chip', s.tipy.includes(p.id) ? 'is-active' : '')}
                  >
                    <input
                      type="checkbox"
                      checked={s.tipy.includes(p.id)}
                      onChange={() =>
                        obnovit({
                          tipy: s.tipy.includes(p.id)
                            ? s.tipy.filter((t) => t !== p.id)
                            : [...s.tipy, p.id],
                        })
                      }
                    />
                    {p.kod} {p.title}
                    {p.izKursa ? <span className="z10-metka">не из открытого банка</span> : null}
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}
        <div className="z10-tr__start">
          <label>
            Задач:{' '}
            <select value={s.skolko} onChange={(e) => obnovit({ skolko: Number(e.target.value) })}>
              {SKOLKO.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn--primary"
            disabled={s.tipy.length === 0}
            onClick={() => void nachat()}
          >
            Начать
          </button>
          {oshibka ? <p role="alert">{oshibka}</p> : null}
        </div>
      </div>
    );
  }

  if (s.ekran === 'itog') {
    return (
      <div className="z10-tr">
        <h2 className="t-h3">Итог тренировки</h2>
        <p className="z10-tr__itog">
          Верно {verno} из {s.plan.length}.
        </p>
        <div className="z10-tr__start">
          <button type="button" className="btn btn--primary" onClick={() => void nachat()}>
            Ещё раз с теми же прототипами
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => obnovit({ ekran: 'vybor' })}
          >
            К выбору
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="z10-tr">
      <div className="z10-tr__shapka">
        <span>
          Задача {s.tekushchaya + 1} из {s.plan.length} · решено {resheno}, верно {verno}
        </span>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => obnovit({ ekran: 'itog' })}
        >
          Завершить
        </button>
      </div>
      <ol className="z10-tr__tochki" aria-label="Задачи тренировки">
        {s.plan.map((id, i) => (
          <li key={id}>
            <button
              type="button"
              aria-label={`Задача ${i + 1}`}
              aria-current={i === s.tekushchaya}
              className={clsx(
                'z10-tr__tochka',
                s.otvety[id] ? (s.otvety[id]?.verno ? 'is-verno' : 'is-neverno') : '',
              )}
              onClick={() => obnovit({ tekushchaya: i })}
            >
              {i + 1}
            </button>
          </li>
        ))}
      </ol>
      {oshibka ? <p role="alert">{oshibka}</p> : null}
      {z ? (
        <Zadacha10
          key={z.id}
          z={z}
          ill={ill[z.prototypeId]}
          itog={s.otvety[z.id]}
          onOtvet={(it) => obnovit({ otvety: { ...s.otvety, [z.id]: it } })}
          teoriyaHref={proto?.teoriya ? `${base}/teoriya/#${proto.teoriya}` : undefined}
        />
      ) : (
        <p>Загружаем задачу…</p>
      )}
      <div className="z10-tr__nav">
        <button
          type="button"
          className="btn btn--secondary"
          disabled={s.tekushchaya === 0}
          onClick={() => obnovit({ tekushchaya: s.tekushchaya - 1 })}
        >
          Назад
        </button>
        {s.tekushchaya + 1 < s.plan.length ? (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => obnovit({ tekushchaya: s.tekushchaya + 1 })}
          >
            Дальше
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => obnovit({ ekran: 'itog' })}
          >
            К итогу
          </button>
        )}
      </div>
    </div>
  );
}
