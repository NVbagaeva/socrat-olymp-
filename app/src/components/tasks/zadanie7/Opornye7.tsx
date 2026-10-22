'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import { TRENAZHER_7 } from '@/content/zadanie7';
import type { MikroDlyaBrauzera } from '@/lib/zadanie7/opornye';
import { estPi } from '@/lib/zadanie7/otvet';
import { opornye7 } from '@/lib/zadanie7/progress';
import { answerMatches, openText } from '@/lib/zadanie7/secret';

const T = TRENAZHER_7;

/** Сколько задач блока решено верно (для карточек списка). */
export function ReshenoVBloke7({ ids }: { ids: string[] }) {
  const progress = opornye7.useProgress();
  const n = ids.filter((id) => progress.outcomes[id] === 'right').length;
  return (
    <span className="z7-op__progress">
      решено {n} из {ids.length}
    </span>
  );
}

/**
 * Экран блока опорных задач №7: по одной задаче, поле ответа (любая
 * верная запись числа), подсказка, короткий разбор после ответа. Сверху
 * — плашка «Запомни» с правилом блока: формулы здесь, а не на карточке
 * блока. Исход задачи — в общем хранилище прогресса (opornye7).
 */
export function Opornye7({
  blok,
  zapomni,
  zadachi,
}: {
  blok: string;
  zapomni: string;
  zadachi: MikroDlyaBrauzera[];
}) {
  const [i, setI] = useState(0);
  const progress = opornye7.useProgress();
  const [vvod, setVvod] = useState('');
  const [podskazka, setPodskazka] = useState(false);
  const [otvet, setOtvet] = useState<boolean | null>(null);
  const [zamechanie, setZamechanie] = useState<string | null>(null);
  const z = zadachi[i];
  if (z === undefined) {
    return null;
  }
  const pereyti = (k: number) => {
    setI(k);
    setVvod('');
    setPodskazka(false);
    setOtvet(null);
    setZamechanie(null);
  };
  return (
    <div className="z7-op">
      <aside className="z7-op__zapomni">
        <b>Запомни.</b> <Tex text={zapomni} />
      </aside>
      <ol className="z7-tochki" aria-label="Задачи блока">
        {zadachi.map((x, k) => {
          const it = progress.outcomes[x.id];
          return (
            <li key={x.id}>
              <button
                type="button"
                aria-current={k === i}
                aria-label={`Задача ${k + 1}`}
                className={clsx(
                  'z7-tochka',
                  it === 'right' ? 'is-verno' : it === undefined ? '' : 'is-neverno',
                )}
                onClick={() => pereyti(k)}
              >
                {k + 1}
              </button>
            </li>
          );
        })}
      </ol>
      <article className="z7-zadacha">
        <p className="z7-uslovie__text">
          <Tex text={z.uslovie} />
        </p>
        <form
          className="z7-otvet"
          onSubmit={(e) => {
            e.preventDefault();
            if (vvod.trim() === '') {
              return;
            }
            if (estPi(vvod)) {
              setZamechanie(T.pi);
              return;
            }
            setZamechanie(null);
            const ok = answerMatches(vvod, z.seal);
            setOtvet(ok);
            opornye7.recordAttempt({
              kind: blok,
              taskId: z.id,
              right: ok,
              clean: ok && !podskazka,
              seconds: 0,
              itog: ok ? 'right' : 'wrong',
            });
          }}
        >
          <label htmlFor={`op-${z.id}`}>{T.otvet}</label>
          <input
            id={`op-${z.id}`}
            inputMode="decimal"
            autoComplete="off"
            value={vvod}
            onChange={(e) => setVvod(e.target.value)}
          />
          <button type="submit" className="btn btn--primary">
            {T.proverit}
          </button>
        </form>
        {zamechanie ? (
          <p className="z7-otvet__itog" role="status">
            <Tex text={zamechanie} />
          </p>
        ) : null}
        {otvet !== null ? (
          <p className={clsx('z7-otvet__itog', otvet ? 'is-verno' : 'is-neverno')} role="status">
            {otvet ? T.verno : 'Пока неверно — загляните в разбор.'}
          </p>
        ) : null}
        <div className="z7-zadacha__dop">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setPodskazka(!podskazka)}
          >
            {podskazka ? T.skrytPodskazku : T.podskazka}
          </button>
          {i + 1 < zadachi.length ? (
            <button type="button" className="btn btn--ghost" onClick={() => pereyti(i + 1)}>
              Следующая
            </button>
          ) : null}
        </div>
        {podskazka ? (
          <p className="z7-op__podskazka">
            <Tex text={z.podskazka} />
          </p>
        ) : null}
        {otvet !== null ? (
          <div className="z7-op__razbor">
            {(JSON.parse(openText(z.razbor, z.id)) as string[]).map((l) => (
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
