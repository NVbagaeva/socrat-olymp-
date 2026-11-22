'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import type { Nabor, Nastroyki as NastroykiT } from '@/lib/ustnyySchet/nabor';
import {
  itogi as poschitat,
  type Itogi as ItogiT,
  type Rezhim,
  type Sostoyanie,
} from '@/lib/ustnyySchet/sessiya';
import type { Rekord } from '@/lib/ustnyySchet/statistika/model';
import { zapisatTrenirovku } from '@/lib/ustnyySchet/statistika/store';
import { naborKey, prochitat, ZAPROS_PO_UMOLCHANIYU, type Zapros } from '@/lib/ustnyySchet/zapros';
import { randomSeed } from '@/lib/randomSeed';
import { browserStorage } from '@/lib/storage';
import { Igra } from './Igra';
import { IgraReyting } from './IgraReyting';
import { ReytingVstuplenie } from './ReytingVstuplenie';
import type { Final } from '@/lib/ustnyySchet/api';
import { Itogi } from './Itogi';
import { Nastroyki, type Lichnye } from './Nastroyki';

/* Звук и автопроверка — удобство этого браузера, не данные ученика. */
const LICHNYE_KEY = 'budetege:ustnyy-schet:lichnye';
const LICHNYE_PO_UMOLCHANIYU: Lichnye = { zvuk: false, avto: false };

function prochitatLichnye(): Lichnye {
  try {
    const raw = browserStorage()?.getItem(LICHNYE_KEY);
    if (raw == null) return LICHNYE_PO_UMOLCHANIYU;
    const v = JSON.parse(raw) as Partial<Lichnye>;
    return { zvuk: v.zvuk === true, avto: v.avto === true };
  } catch {
    return LICHNYE_PO_UMOLCHANIYU;
  }
}

type Ekran =
  | { tip: 'nastroyki' }
  | { tip: 'reyting'; n: number }
  | { tip: 'igra'; nabor: Nabor; rezhim: Rezhim; vozvrashchat: boolean; n: number }
  | {
      tip: 'itogi';
      it: ItogiT;
      rezhim: Rezhim;
      rekord: boolean;
      prezhniy: Rekord | null;
      s: Sostoyanie;
      nabor: Nabor;
      vozvrashchat: boolean;
      /** Рейтинговая: итог сервера. */
      final?: Final | null;
    };

/**
 * Тренировка целиком: настройки → экран примеров → итоги. Что
 * тренировать — из строки запроса (lib/ustnyySchet/zapros.ts).
 */
export function Trenirovka({ zapros }: { zapros: Zapros }) {
  const [nabor, setNabor] = useState<Nabor>(zapros.nabor);
  const [rezhim, setRezhim] = useState<Rezhim>(zapros.rezhim);
  const [nast, setNast] = useState<NastroykiT>(zapros.nast);
  /* Экран рисуется только в браузере (строка запроса), так что
     настройку можно прочесть сразу. */
  const [lichnye, setLichnyeState] = useState<Lichnye>(prochitatLichnye);
  const [ekran, setEkran] = useState<Ekran>(
    zapros.reyting !== undefined
      ? zapros.go
        ? { tip: 'reyting', n: 0 }
        : { tip: 'nastroyki' }
      : zapros.go
        ? {
            tip: 'igra',
            nabor: zapros.nabor,
            rezhim: zapros.rezhim,
            vozvrashchat: zapros.vozvrat === true,
            n: 0,
          }
        : { tip: 'nastroyki' },
  );

  const setLichnye = (l: Lichnye) => {
    setLichnyeState(l);
    try {
      browserStorage()?.setItem(LICHNYE_KEY, JSON.stringify(l));
    } catch {
      /* Нет хранилища — настройка живёт до перезагрузки. */
    }
  };

  const start = (n: Nabor = nabor, r: Rezhim = rezhim, vozvrashchat = false) =>
    setEkran((e) => ({
      tip: 'igra',
      nabor: n,
      rezhim: r,
      vozvrashchat,
      n: (e.tip === 'igra' ? e.n : 0) + 1,
    }));

  const onKonec = useCallback(
    (s: Sostoyanie, ms: number) => {
      if (ekran.tip !== 'igra') return;
      const it = poschitat(s, ms);
      const z = zapisatTrenirovku({
        id: randomSeed(),
        at: Date.now(),
        nabor: naborKey(ekran.nabor),
        rezhim: ekran.rezhim,
        uroven: nast.uroven,
        hody: s.hody,
        ms,
        seriya: it.luchshayaSeriya,
      });
      setEkran({
        tip: 'itogi',
        it,
        rezhim: ekran.rezhim,
        rekord: z.rekord !== null,
        prezhniy: z.prezhniy,
        s,
        nabor: ekran.nabor,
        vozvrashchat: ekran.vozvrashchat,
      });
      window.scrollTo({ top: 0 });
    },
    [ekran, nast.uroven],
  );

  const onKonecReyting = useCallback(
    (s: Sostoyanie, ms: number, final: Final | null) => {
      const it = poschitat(s, ms);
      const nb: Nabor = zapros.nabor;
      const z = zapisatTrenirovku({
        id: randomSeed(),
        at: Date.now(),
        nabor: `f:${zapros.reyting ?? ''}`,
        rezhim: s.rezhim,
        uroven: 2,
        hody: s.hody,
        ms,
        seriya: it.luchshayaSeriya,
      });
      setEkran({
        tip: 'itogi',
        it,
        rezhim: s.rezhim,
        rekord: z.rekord !== null,
        prezhniy: z.prezhniy,
        s,
        nabor: nb,
        vozvrashchat: false,
        final,
      });
      window.scrollTo({ top: 0 });
    },
    [zapros.nabor, zapros.reyting],
  );

  const startReyting = () =>
    setEkran((e) => ({ tip: 'reyting', n: (e.tip === 'reyting' ? e.n : 0) + 1 }));

  if (ekran.tip === 'reyting' && zapros.reyting !== undefined) {
    return (
      <IgraReyting
        key={ekran.n}
        format={zapros.reyting}
        zvuk={lichnye.zvuk}
        avto={lichnye.avto}
        onKonec={onKonecReyting}
        onPraktika={() => setEkran({ tip: 'nastroyki' })}
      />
    );
  }

  if (ekran.tip === 'igra') {
    return (
      <Igra
        key={ekran.n}
        nabor={ekran.nabor}
        rezhim={ekran.rezhim}
        nast={nast}
        vozvrashchat={ekran.vozvrashchat}
        zvuk={lichnye.zvuk}
        avto={lichnye.avto}
        onKonec={onKonec}
        onNazad={() => setEkran({ tip: 'nastroyki' })}
      />
    );
  }

  if (ekran.tip === 'itogi') {
    const oshibki = ekran.it.spisokOshibok.map((h) => h.primer);
    return (
      <Itogi
        it={ekran.it}
        rezhim={ekran.rezhim}
        rekord={ekran.rekord}
        prezhniy={ekran.prezhniy}
        onPovtorit={
          oshibki.length === 0
            ? null
            : () =>
                start(
                  { tip: 'spisok', primery: oshibki },
                  { tip: 'seriya', n: Math.min(50, oshibki.length * 2) },
                  true,
                )
        }
        onEshche={() =>
          ekran.final !== undefined
            ? startReyting()
            : start(ekran.nabor, ekran.rezhim, ekran.vozvrashchat)
        }
        onNastroyki={() => setEkran({ tip: 'nastroyki' })}
        {...(ekran.final !== undefined ? { reyting: { final: ekran.final } } : {})}
      />
    );
  }

  if (zapros.reyting !== undefined) {
    return (
      <ReytingVstuplenie
        format={zapros.reyting}
        lichnye={lichnye}
        onLichnye={setLichnye}
        onStart={startReyting}
        onPraktika={
          zapros.nabor.tip === 'format' ? () => start(zapros.nabor, zapros.rezhim, false) : null
        }
      />
    );
  }

  return (
    <Nastroyki
      nabor={nabor}
      rezhim={rezhim}
      nast={nast}
      lichnye={lichnye}
      onNabor={setNabor}
      onRezhim={setRezhim}
      onNast={setNast}
      onLichnye={setLichnye}
      onStart={() => start(nabor, rezhim, zapros.vozvrat === true)}
    />
  );
}

/** Тренировка по адресу страницы: читает строку запроса в браузере. */
export function TrenirovkaIzAdresa() {
  const q = useSearchParams();
  const zapros = q === null ? ZAPROS_PO_UMOLCHANIYU : prochitat(new URLSearchParams(q.toString()));
  /* Новый адрес (ссылка с другой страницы) — новые настройки. */
  return <Trenirovka key={q?.toString() ?? ''} zapros={zapros} />;
}
