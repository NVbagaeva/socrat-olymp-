'use client';

import { useEffect, useRef, useState } from 'react';
import { KartaPrimer } from '../../karta';
import { tekstyKarty45 } from '@/content/veroyatnost45';
import { razdelBase } from '@/lib/paths';
import { otkrytRazbor, type Razbor } from '@/lib/veroyatnost/razbor';
import type { Zadanie45 } from '@/lib/veroyatnost/trening/links';
import { Kartinka45, primerIzRazbora } from './Primer45';

/**
 * Пример типа №4 и №5 на карте задания: условие и картинка приходят
 * разметкой сервера, решение — закрытым разбором из файла
 * dannye/primery/{прототип}.json (lib/veroyatnost/primeryKarty.ts).
 *
 * Раньше решение грузилось по клику файлом разборов всего прототипа
 * (dannye/razbory/) — 600–700 КБ почти несжимаемого шифра ради одного
 * варианта, и на телефоне карточка долго висела на «Открываем пример…».
 * Теперь файл — один вариант, около 10 КБ, и грузится заранее: когда
 * карточка типа подходит к экрану (раскрыли группу, прокрутили) или
 * ученик тянется к ней. Загруженное и раскрытое живёт в памяти модуля —
 * повторное раскрытие мгновенное. В разметку разбор попадает только при
 * открытии карточки.
 */

const FAILY = new Map<string, Promise<string>>();
const GOTOVYE = new Map<string, string>();
const RAZBORY = new Map<string, Razbor | 'net'>();

/** Загрузить разбор примера типа — один раз за визит. */
function zagruzit(zadanie: Zadanie45, kind: string, versiya: string): Promise<string> {
  const klyuch = `${zadanie}:${kind}:${versiya}`;
  let p = FAILY.get(klyuch);
  if (p === undefined) {
    p = fetch(`${razdelBase(zadanie)}/dannye/primery/${kind}.json?v=${versiya}`, {
      priority: 'high',
    })
      .then((r) => {
        if (!r.ok) throw new Error(`primer ${kind}: ${r.status}`);
        return r.json() as Promise<{ steps: string }>;
      })
      .then(({ steps }) => {
        GOTOVYE.set(klyuch, steps);
        return steps;
      });
    /* Сбой сети в кеше не застревает: следующее раскрытие попробует снова. */
    p.catch(() => FAILY.delete(klyuch));
    FAILY.set(klyuch, p);
  }
  return p;
}

/** Раскрытый разбор, если файл уже в памяти; иначе null. */
function izKesha(
  zadanie: Zadanie45,
  kind: string,
  versiya: string,
  seal: string,
): Razbor | 'net' | null {
  const klyuch = `${zadanie}:${kind}:${versiya}`;
  const gotov = RAZBORY.get(klyuch);
  if (gotov !== undefined) return gotov;
  const steps = GOTOVYE.get(klyuch);
  if (steps === undefined) return null;
  let razbor: Razbor | 'net';
  try {
    razbor = steps === '' ? 'net' : otkrytRazbor(steps, seal);
  } catch {
    razbor = 'net';
  }
  RAZBORY.set(klyuch, razbor);
  return razbor;
}

export function PrimerLazy45({
  zadanie,
  kind,
  seal,
  versiya,
  uslovieHtml,
  kartinka,
  opasnoHtml,
  trenirovatHref,
  opornyeHref,
}: {
  zadanie: Zadanie45;
  kind: string;
  seal: string;
  versiya: string;
  uslovieHtml: string;
  kartinka?: { path: string; alt: string };
  opasnoHtml?: string;
  trenirovatHref: string;
  opornyeHref: string;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [razbor, setRazbor] = useState<Razbor | null | 'net'>(null);

  useEffect(() => {
    const el = anchor.current;
    const details = el?.closest('details');
    if (el === null || details === null || details === undefined) {
      return undefined;
    }
    let alive = true;
    const zaranee = () => {
      void zagruzit(zadanie, kind, versiya).catch(() => undefined);
    };
    const pokazat = () => {
      if (!details.open) return;
      const gotov = izKesha(zadanie, kind, versiya, seal);
      if (gotov !== null) {
        setRazbor(gotov);
        return;
      }
      zagruzit(zadanie, kind, versiya).then(
        () => {
          if (alive) setRazbor(izKesha(zadanie, kind, versiya, seal) ?? 'net');
        },
        () => {
          if (alive) setRazbor('net');
        },
      );
    };
    /* Заранее. Карточка в группе-методе: раскрыли группу — грузим
       разборы всех её типов сразу (по 10 КБ), не дожидаясь прокрутки.
       Без группы — когда карточка подходит к экрану. */
    const gruppa = details.parentElement?.closest('details') ?? null;
    const gruppaOtkryta = () => {
      if (gruppa?.open === true) zaranee();
    };
    gruppaOtkryta();
    gruppa?.addEventListener('toggle', gruppaOtkryta);
    let io: IntersectionObserver | null = null;
    if (gruppa === null && typeof IntersectionObserver === 'undefined') {
      zaranee();
    } else if (gruppa === null) {
      io = new IntersectionObserver(
        (zapisi) => {
          if (zapisi.some((z) => z.isIntersecting)) {
            io?.disconnect();
            zaranee();
          }
        },
        { rootMargin: '400px 0px' },
      );
      io.observe(details);
    }
    /* Тянется к карточке — грузим, не дожидаясь раскрытия. */
    const summary = details.querySelector(':scope > summary');
    summary?.addEventListener('pointerdown', zaranee, { passive: true });
    summary?.addEventListener('focus', zaranee);
    pokazat();
    details.addEventListener('toggle', pokazat);
    return () => {
      alive = false;
      io?.disconnect();
      summary?.removeEventListener('pointerdown', zaranee);
      summary?.removeEventListener('focus', zaranee);
      gruppa?.removeEventListener('toggle', gruppaOtkryta);
      details.removeEventListener('toggle', pokazat);
    };
  }, [zadanie, kind, seal, versiya]);

  if (razbor === 'net') {
    return (
      <div className="kz-primer kz-primer--zhdyot" ref={anchor}>
        <p className="stk-lead">{tekstyKarty45.primerNet}</p>
      </div>
    );
  }
  if (razbor === null) {
    /* Скелетон в форме готового примера: условие и картинка уже есть,
       на месте шагов — полосы. Карточка не прыгает, когда решение
       встаёт на их место. */
    return (
      <div className="kz-primer" ref={anchor} aria-busy="true">
        <p className="kz-primer__metka">{tekstyKarty45.primer}</p>
        <div className="kz-uslovie" dangerouslySetInnerHTML={{ __html: uslovieHtml }} />
        {kartinka === undefined ? null : (
          <div className="kz-primer__risunok">
            <Kartinka45 {...kartinka} />
          </div>
        )}
        <div className="z45-skelet" aria-label={tekstyKarty45.primerZhdyot} role="status">
          <span className="skeleton z45-skelet__shag" />
          <span className="skeleton z45-skelet__shag" />
          <span className="skeleton z45-skelet__shag z45-skelet__shag--korotkiy" />
          <span className="skeleton z45-skelet__risunok" />
        </div>
      </div>
    );
  }
  const primer = primerIzRazbora(razbor, tekstyKarty45.metod, tekstyKarty45.risunok);
  return (
    <div ref={anchor}>
      <KartaPrimer
        uslovieHtml={uslovieHtml}
        {...(kartinka === undefined ? {} : { risunok: <Kartinka45 {...kartinka} /> })}
        shagi={primer.shagi}
        posle={primer.posle}
        otvet={primer.otvet}
        {...(opasnoHtml === undefined ? {} : { opasnoHtml })}
        trenirovatHref={trenirovatHref}
        opornyeHref={opornyeHref}
        labels={tekstyKarty45}
      />
    </div>
  );
}
