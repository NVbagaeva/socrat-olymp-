'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button, CheckIcon } from '@/components/ui';
import { VariantyOtveta, type VariantSostoyanie } from '@/components/ui/proverka/VariantyOtveta';
import {
  otkryt,
  vernyVariant,
  type EkzemplyarKlient,
  type ZadachaKlient,
} from '@/lib/teoriya/proverka-seal';

export interface ProverSebyaProps {
  /** Ключ сохранения решённых: «edinicy:kak-perevodit». */
  klyuch: string;
  zadachi: readonly ZadachaKlient[];
}

type Status = 'vybor' | 'verno' | 'neverno' | 'razbor';

interface SostoyanieZadachi {
  /** Номер экземпляра: 0 — числа теории, дальше — «Ещё такое же». */
  n: number;
  vybor: string | null;
  /** Испробованные ошибки — больше не выбираются. */
  oshibki: string[];
  status: Status;
}

const NOVOE: SostoyanieZadachi = { n: 0, vybor: null, oshibki: [], status: 'vybor' };

/* Решённые задачи блока — в браузере, по образцу опорных №10. */
const PREFIKS = 'budetege:teoriya-edinicy:proverka:v1:';
const PUSTO: readonly string[] = [];
const kesh = new Map<string, { raw: string | null; spisok: readonly string[] }>();
const slushateli = new Set<() => void>();

function chitat(klyuch: string): readonly string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PREFIKS + klyuch);
  } catch {
    raw = null;
  }
  const byl = kesh.get(klyuch);
  if (byl !== undefined && byl.raw === raw) {
    return byl.spisok;
  }
  let spisok: readonly string[] = PUSTO;
  try {
    const v: unknown = raw === null ? [] : JSON.parse(raw);
    spisok = Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : PUSTO;
  } catch {
    spisok = PUSTO;
  }
  kesh.set(klyuch, { raw, spisok });
  return spisok;
}

function pisat(klyuch: string, resheno: readonly string[]): void {
  try {
    window.localStorage.setItem(PREFIKS + klyuch, JSON.stringify(resheno));
  } catch {
    /* Приватное окно или запрет хранилища: счёт живёт до перезагрузки. */
    kesh.set(klyuch, { raw: null, spisok: resheno });
  }
  slushateli.forEach((f) => f());
}

function useResheno(klyuch: string): readonly string[] {
  return useSyncExternalStore(
    (f) => {
      slushateli.add(f);
      window.addEventListener('storage', f);
      return () => {
        slushateli.delete(f);
        window.removeEventListener('storage', f);
      };
    },
    () => chitat(klyuch),
    () => PUSTO,
  );
}

function ZnakVnimanie() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 6v8M12 17.5v.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function ZnakRazbor() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 5h9a3 3 0 0 1 3 3v11H9a3 3 0 0 1-3-3V5Zm3 4h6M9 13h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * «Проверь себя»: задачи по одной, выбор ответа плитками и кнопка
 * «Проверить».
 *
 * Ряд вариантов — общий VariantyOtveta (тот же, что в теории
 * вероятности), здесь он в режиме radio: стрелки переводят выбор,
 * Enter проверяет. Верно — карточка загорается зелёным, остальные
 * плитки гаснут, под ответом разбор; «Ещё такое же» берёт новые числа,
 * «Следующая» — следующую задачу. Неверно — терракотовая рамка и
 * подсказка именно к этой ошибке; после двух неверных можно открыть
 * разбор. Результат озвучивается (aria-live), фокус переходит к нему.
 *
 * Решённые задачи помнит браузер (localStorage) — только для счётчика
 * «Решено: N из M»; нет хранилища — счёт живёт до перезагрузки.
 */
export function ProverSebya({ klyuch, zadachi }: ProverSebyaProps) {
  const [tekushchaya, setTekushchaya] = useState(0);
  const [sost, setSost] = useState<Record<string, SostoyanieZadachi>>({});
  const resheno = useResheno(klyuch);
  const itogRef = useRef<HTMLDivElement>(null);
  const fokusNaItog = useRef(false);

  useEffect(() => {
    if (fokusNaItog.current) {
      fokusNaItog.current = false;
      itogRef.current?.focus();
    }
  });

  const zadacha = zadachi[tekushchaya];
  if (zadacha === undefined) {
    return null;
  }
  const s = sost[zadacha.id] ?? NOVOE;
  const e = zadacha.ekzemplyary[s.n % zadacha.ekzemplyary.length] as EkzemplyarKlient;
  const ids = e.varianty.map((v) => v.id);
  const html = new Map(e.varianty.map((v) => [v.id, v.html]));
  const otkliki = new Map(e.varianty.map((v) => [v.id, v.otklik]));
  const verny = ids.find((id) => vernyVariant(e, id)) ?? null;

  function obnovit(novoe: Partial<SostoyanieZadachi>): void {
    setSost((was) => ({ ...was, [zadacha!.id]: { ...(was[zadacha!.id] ?? NOVOE), ...novoe } }));
  }

  function proverit(): void {
    if (s.vybor === null || s.status !== 'vybor') {
      return;
    }
    fokusNaItog.current = true;
    if (vernyVariant(e, s.vybor)) {
      obnovit({ status: 'verno' });
      if (!resheno.includes(zadacha!.id)) {
        pisat(klyuch, [...resheno, zadacha!.id]);
      }
    } else {
      obnovit({ status: 'neverno', oshibki: [...s.oshibki, s.vybor] });
    }
  }

  function eshche(): void {
    obnovit({ ...NOVOE, n: s.n + 1 });
  }

  function sleduyushchaya(): void {
    setTekushchaya((i) => (i + 1) % zadachi.length);
  }

  const sostoyanie = (id: string): VariantSostoyanie => {
    if (s.status === 'verno') {
      return id === s.vybor ? 'correct' : 'priglushen';
    }
    if (s.status === 'razbor') {
      return id === verny ? 'answer' : 'priglushen';
    }
    if (s.status === 'neverno' && id === s.oshibki[s.oshibki.length - 1]) {
      return 'incorrect';
    }
    return s.oshibki.includes(id) ? 'priglushen' : null;
  };

  const posledniaya = s.oshibki[s.oshibki.length - 1];
  const zakonchena = s.status === 'verno' || s.status === 'razbor';
  const nazvanie = `Задача ${tekushchaya + 1} из ${zadachi.length}`;

  return (
    <section className="prv" aria-label="Проверь себя">
      <header className="prv__head">
        <div>
          <h5 className="prv__title">Проверь себя</h5>
          <p className="prv__podpis">Выбери ответ и нажми «Проверить»</p>
        </div>
        <div className="prv__schet">
          <span aria-live="polite">
            Решено: {resheno.length} из {zadachi.length}
          </span>
          <ol className="prv__tochki">
            {zadachi.map((z, i) => (
              <li key={z.id}>
                <button
                  type="button"
                  className={clsx(
                    'prv__tochka',
                    resheno.includes(z.id) && 'is-resheno',
                    i === tekushchaya && 'is-tekushchaya',
                  )}
                  aria-label={`Задача ${i + 1}${resheno.includes(z.id) ? ', решена' : ''}`}
                  aria-current={i === tekushchaya ? 'step' : undefined}
                  onClick={() => setTekushchaya(i)}
                />
              </li>
            ))}
          </ol>
        </div>
      </header>

      <div
        className={clsx('prv-zad', s.status === 'verno' && 'is-verno')}
        key={`${zadacha.id}-${s.n}`}
        data-klyuch={e.klyuch}
      >
        <p className="prv-zad__no">{nazvanie}</p>
        <p className="prv-zad__uslovie" id={`prv-${klyuch}-${zadacha.id}`}>
          <span dangerouslySetInnerHTML={{ __html: e.uslovie }} />
        </p>
        <VariantyOtveta
          className="vvar--plitki"
          radio
          otvety={ids}
          vybor={
            s.status === 'vybor' || s.status === 'verno'
              ? s.vybor
              : s.status === 'neverno'
                ? (posledniaya ?? null)
                : null
          }
          onPick={(id) => {
            if (s.status === 'vybor' || s.status === 'neverno') {
              obnovit({ vybor: id, status: 'vybor' });
            }
          }}
          onEnter={proverit}
          itog={sostoyanie}
          zakryt={(id) => s.oshibki.includes(id)}
          disabled={zakonchena}
          label={`${nazvanie}. Выберите ответ`}
          vid={(id) => <span dangerouslySetInnerHTML={{ __html: html.get(id) ?? '' }} />}
        />

        <div aria-live="polite">
          {s.status === 'verno' ? (
            <div className="prv-itog prv-itog--verno" ref={itogRef} tabIndex={-1}>
              <p className="prv-itog__title">
                <span className="prv-itog__znak">
                  <CheckIcon />
                </span>
                Верно!
              </p>
              <div dangerouslySetInnerHTML={{ __html: otkryt(e.razbor, e) }} />
            </div>
          ) : null}
          {s.status === 'neverno' && posledniaya !== undefined ? (
            <div className="prv-itog" ref={itogRef} tabIndex={-1}>
              <p className="prv-itog__title">
                <span className="prv-itog__znak">
                  <ZnakVnimanie />
                </span>
                Не совсем
              </p>
              <div
                dangerouslySetInnerHTML={{
                  __html: otkryt(otkliki.get(posledniaya) ?? '', e, posledniaya),
                }}
              />
            </div>
          ) : null}
          {s.status === 'razbor' ? (
            <div className="prv-itog prv-itog--razbor" ref={itogRef} tabIndex={-1}>
              <p className="prv-itog__title">
                <span className="prv-itog__znak">
                  <ZnakRazbor />
                </span>
                Разбор
              </p>
              <div dangerouslySetInnerHTML={{ __html: otkryt(e.razbor, e) }} />
            </div>
          ) : null}
        </div>

        <div className="prv__knopki">
          {s.status === 'vybor' ? (
            <Button disabled={s.vybor === null} onClick={proverit}>
              Проверить
            </Button>
          ) : null}
          {s.status === 'neverno' ? (
            <>
              <Button
                onClick={() => {
                  obnovit({ vybor: null, status: 'vybor' });
                }}
              >
                Попробовать ещё
              </Button>
              {s.oshibki.length >= 2 ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    fokusNaItog.current = true;
                    obnovit({ status: 'razbor' });
                  }}
                >
                  Показать разбор
                </Button>
              ) : null}
            </>
          ) : null}
          {zakonchena ? (
            <>
              <Button variant="secondary" onClick={eshche}>
                Ещё такое же
              </Button>
              <Button onClick={sleduyushchaya}>Следующая</Button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
