'use client';

import { clsx } from 'clsx';
import { useState, useSyncExternalStore } from 'react';
import { Tex } from '@/components/ui/Tex';
import type { MikroDlyaBrauzera } from '@/lib/zadanie10/opornye';
import type { IllInfo } from './Zadacha10';
import { answerMatches } from '@/lib/zadanie10/secret';

const KLYUCH = 'budetege:zadanie-10:opornye:v1';

type Itogi = Record<string, boolean>;

const PUSTO: Itogi = {};
let kesh: { raw: string | null; it: Itogi } | null = null;
const slushateli = new Set<() => void>();

function prochitat(): Itogi {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KLYUCH);
  } catch {
    raw = kesh?.raw ?? null;
  }
  if (kesh && kesh.raw === raw) {
    return kesh.it;
  }
  let it = PUSTO;
  try {
    it = raw ? (JSON.parse(raw) as Itogi) : PUSTO;
  } catch {
    it = PUSTO;
  }
  kesh = { raw, it };
  return it;
}

function zapisat(it: Itogi): void {
  const raw = JSON.stringify(it);
  try {
    window.localStorage.setItem(KLYUCH, raw);
  } catch {
    /* без хранилища — прогресс живёт до перезагрузки */
  }
  kesh = { raw, it };
  slushateli.forEach((f) => f());
}

function useItogi(): Itogi {
  return useSyncExternalStore(
    (f) => {
      slushateli.add(f);
      return () => slushateli.delete(f);
    },
    prochitat,
    () => PUSTO,
  );
}

/** Сколько задач блока решено верно (для карточек списка). */
export function ReshenoVBloke({ ids }: { ids: string[] }) {
  const it = useItogi();
  const n = ids.filter((id) => it[id]).length;
  return (
    <span className="z10-op__progress">
      решено {n} из {ids.length}
    </span>
  );
}

/**
 * Экран блока опорных задач: по одной задаче, поле ответа, подсказка,
 * короткий разбор после ответа. Сверху — плашка «Запомни» с правилом
 * блока (формулы — здесь, а не на карточке блока).
 */
/**
 * Блок опорных задач. У задачи с сюжетом (SYUZHET_OPORNOY) рядом с
 * условием — картинка сюжета и ссылка на разбор прототипа, где эта
 * формула встречается.
 */
export function Opornye10({
  zapomni,
  zadachi,
  kartinki,
  syuzhety,
}: {
  zapomni: string;
  zadachi: MikroDlyaBrauzera[];
  kartinki: Record<string, IllInfo>;
  /** Прототип → название и адрес разбора. */
  syuzhety: Record<string, { title: string; href: string }>;
}) {
  const [i, setI] = useState(0);
  const itogi = useItogi();
  const [vvod, setVvod] = useState('');
  const [podskazka, setPodskazka] = useState(false);
  const [otvet, setOtvet] = useState<boolean | null>(null);
  const z = zadachi[i];
  if (z === undefined) {
    return null;
  }
  const ill = z.syuzhet ? kartinki[z.syuzhet] : undefined;
  const syuzhet = z.syuzhet ? syuzhety[z.syuzhet] : undefined;
  const pereyti = (k: number) => {
    setI(k);
    setVvod('');
    setPodskazka(false);
    setOtvet(null);
  };
  return (
    <div className="z10-op">
      <aside className="z10-op__zapomni">
        <b>Запомни.</b> <Tex text={zapomni} />
      </aside>
      <ol className="z10-tr__tochki" aria-label="Задачи блока">
        {zadachi.map((x, k) => (
          <li key={x.id}>
            <button
              type="button"
              aria-current={k === i}
              aria-label={`Задача ${k + 1}`}
              className={clsx(
                'z10-tr__tochka',
                itogi[x.id] === true ? 'is-verno' : itogi[x.id] === false ? 'is-neverno' : '',
              )}
              onClick={() => pereyti(k)}
            >
              {k + 1}
            </button>
          </li>
        ))}
      </ol>
      <article className="z10-zadacha">
        <div className={clsx('z10-op__uslovie', ill ? 'is-s-kartinkoy' : '')}>
          <p className="z10-uslovie__text">
            <Tex text={z.uslovie} />
          </p>
          {ill && syuzhet ? (
            <figure className="z10-op__syuzhet">
              <picture className="z10-ill">
                <source type="image/webp" srcSet={ill.webp} />
                <img
                  src={ill.png}
                  alt={ill.alt}
                  width={ill.width}
                  height={ill.height}
                  loading="lazy"
                  decoding="async"
                />
              </picture>
              <figcaption>
                Где встречается: <a href={syuzhet.href}>{syuzhet.title}</a>
              </figcaption>
            </figure>
          ) : null}
        </div>
        <form
          className="z10-otvet"
          onSubmit={(e) => {
            e.preventDefault();
            if (vvod.trim() === '') {
              return;
            }
            const ok = answerMatches(vvod, z.seal);
            setOtvet(ok);
            zapisat({ ...itogi, [z.id]: ok });
          }}
        >
          <label htmlFor={`op-${z.id}`}>Ответ</label>
          <input
            id={`op-${z.id}`}
            inputMode="decimal"
            autoComplete="off"
            value={vvod}
            onChange={(e) => setVvod(e.target.value)}
          />
          <button type="submit" className="btn btn--primary">
            Проверить
          </button>
        </form>
        {otvet !== null ? (
          <p className={clsx('z10-otvet__itog', otvet ? 'is-verno' : 'is-neverno')} role="status">
            {otvet ? 'Верно!' : 'Пока неверно — загляните в разбор.'}
          </p>
        ) : null}
        <div className="z10-zadacha__dop">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setPodskazka(!podskazka)}
          >
            Подсказка
          </button>
          {i + 1 < zadachi.length ? (
            <button type="button" className="btn btn--ghost" onClick={() => pereyti(i + 1)}>
              Следующая
            </button>
          ) : null}
        </div>
        {podskazka ? (
          <p className="z10-op__podskazka">
            <Tex text={z.podskazka} />
          </p>
        ) : null}
        {otvet !== null ? (
          <div className="z10-op__razbor">
            {z.razbor.map((l) => (
              <p key={l}>
                <Tex text={l} />
              </p>
            ))}
          </div>
        ) : null}
      </article>
    </div>
  );
}
