'use client';

import { clsx } from 'clsx';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button, Input } from '@/components/ui';
import { ONLAYN_13 } from '@/content/generator13';
import { checkSealed, type Verdict } from '@/lib/zadanie13/edinicy';
import { parseGenQuery13, vsegoZadach13 } from '@/lib/zadanie13/gen/params';
import type { Razbor13, Zadacha13Sealed } from '@/lib/zadanie13/opornye/seal';
import { answerMatches, choiceMatches, openText } from '@/lib/zadanie13/secret';
import { Razbor13Blok } from './Razbor13';

type Zadacha = Zadacha13Sealed & { no: number; pos: string };

const VERDIKT: Record<Verdict, string> = {
  right: 'Верно!',
  units: 'Число верное, единицы нет',
  wrong: 'Пока неверно',
};

function Karta({ z }: { z: Zadacha }) {
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<Verdict | null>(null);
  const [razbor, setRazbor] = useState<Razbor13 | null>(null);
  function proverit() {
    if (value.trim() === '') return;
    const v: Verdict =
      z.vybory === null
        ? checkSealed(value, { answer: z.seal, wrongUnits: z.wrongUnits }, answerMatches)
        : choiceMatches(value, z.seal)
          ? 'right'
          : 'wrong';
    setChecked(v);
  }
  return (
    <li className="z13-nabor__karta">
      <span className="z13-nabor__no">{z.no}</span>
      <div className="z13-nabor__body">
        <div className="z13-resh__text" dangerouslySetInnerHTML={{ __html: z.uslovieHtml }} />
        {z.tablitsaHtml === null ? null : (
          <div className="z13-ptask__tab" dangerouslySetInnerHTML={{ __html: z.tablitsaHtml }} />
        )}
        {z.vybory === null ? (
          <div className="z13-resh__otvet">
            <Input
              className="z13-resh__input"
              value={value}
              placeholder={ONLAYN_13.otvet}
              aria-label={`${ONLAYN_13.otvet} к задаче ${z.no}`}
              inputMode="decimal"
              autoComplete="off"
              state={checked === null ? 'default' : checked === 'right' ? 'success' : 'error'}
              readOnly={checked === 'right'}
              onChange={(e) => {
                setValue(e.target.value);
                if (checked !== 'right') setChecked(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') proverit();
              }}
            />
            <Button onClick={proverit} disabled={value.trim() === '' || checked === 'right'}>
              {ONLAYN_13.proverit}
            </Button>
          </div>
        ) : (
          <>
            <ul className="ptask__options" aria-label={ONLAYN_13.vybor}>
              {z.vybory.map((v) => (
                <li key={v.number}>
                  <button
                    type="button"
                    className={clsx(
                      'popt',
                      value === v.number && 'is-chosen',
                      value === v.number && checked !== null && `is-${checked}`,
                    )}
                    aria-pressed={value === v.number}
                    disabled={checked === 'right'}
                    onClick={() => {
                      setValue(v.number);
                      setChecked(null);
                    }}
                  >
                    <span className="popt__no">{v.number}</span>
                    <span className="popt__text">{v.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div>
              <Button onClick={proverit} disabled={value === '' || checked === 'right'}>
                {ONLAYN_13.proverit}
              </Button>
            </div>
          </>
        )}
        {checked === null ? null : (
          <div
            className={clsx('pverdict', `pverdict--${checked === 'right' ? 'right' : 'wrong'}`)}
            role="status"
          >
            <p className="pverdict__title">{VERDIKT[checked]}</p>
          </div>
        )}
        {checked !== null && razbor === null ? (
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                try {
                  setRazbor(JSON.parse(openText(z.razbor, z.seal)) as Razbor13);
                } catch {
                  setRazbor(null);
                }
              }}
            >
              {ONLAYN_13.reshenie}
            </Button>
          </div>
        ) : null}
        {razbor === null ? null : <Razbor13Blok razbor={razbor} />}
      </div>
    </li>
  );
}

/**
 * Онлайн-версия набора генератора №13: QR и код на листе ученика ведут
 * сюда. Задачи собираются по тому же адресу, что и лист, — тем же
 * движком в браузере; ответ сверяется с отпечатком, решение
 * открывается после проверки. Ответов в адресе нет.
 */
export function Nabor13() {
  const query = useSearchParams();
  const params = useMemo(() => parseGenQuery13(query), [query]);
  const [variant, setVariant] = useState(0);
  const [zadachi, setZadachi] = useState<Zadacha[][] | null>(null);

  useEffect(() => {
    if (vsegoZadach13(params) === 0) return;
    let alive = true;
    void Promise.all([
      import('@/lib/zadanie13/gen/list'),
      import('@/lib/zadanie13/opornye/seal'),
    ]).then(([{ planLista13 }, { sealZadacha13 }]) => {
      if (!alive) return;
      setZadachi(
        planLista13(params).map((v) =>
          v.map((poz) => ({
            ...sealZadacha13(
              poz.prototypeId,
              poz.seed,
              poz.vid === 'T' ? 'tip' : 'zadachi',
              poz.no,
            ),
            no: poz.no,
            pos: poz.pos,
          })),
        ),
      );
    });
    return () => {
      alive = false;
    };
  }, [params]);

  if (vsegoZadach13(params) === 0) {
    return <p className="z13-nabor__pusto">{ONLAYN_13.pusto}</p>;
  }
  const spisok = zadachi?.[variant] ?? [];
  return (
    <section className="z13-nabor">
      <header className="z13-tr__head">
        <h2 className="t-h2">{params.title || ONLAYN_13.title}</h2>
        <p className="z13-tr__lead">{ONLAYN_13.lead}</p>
      </header>
      {zadachi !== null && zadachi.length > 1 ? (
        <div
          className="z13-tr__knopki z13-tr__knopki--chisla"
          role="group"
          aria-label={ONLAYN_13.variant}
        >
          {zadachi.map((_, i) => (
            <button
              key={i}
              type="button"
              className={clsx('z13-tr__knopka', variant === i && 'is-active')}
              aria-pressed={variant === i}
              onClick={() => setVariant(i)}
            >
              {ONLAYN_13.variant} {i + 1}
            </button>
          ))}
        </div>
      ) : null}
      <ol className="z13-nabor__spisok" key={variant}>
        {spisok.map((z) => (
          <Karta key={z.pos} z={z} />
        ))}
      </ol>
    </section>
  );
}
