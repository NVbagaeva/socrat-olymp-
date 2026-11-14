'use client';

/**
 * Источники конструктора ДЗ: раздел (№7, №8 …) и три вкладки —
 * «Карточки», «Опорные задачи», «Тренажёр». Всё, что видно здесь, уже
 * набрано на сборке (каталог раздела); пример задачи тренажёра
 * собирается в браузере тем же сборщиком, что и при выдаче.
 */

import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { DZK, ISTOCHNIK_VKLADKA } from '@/content/dzIstochniki';
import { Ikonka } from '@/components/tasks/steklo';
import { dobavit, estVChernovike, useChernovik } from '@/lib/dz/chernovik';
import { RAZDELY_DZ_KLIENT, zagruzitKatalog } from '@/lib/dz/katalog/zagruzka';
import type { BlokKat, GruppaKat, KatalogRazdela, PodtemaKat } from '@/lib/dz/katalog/types';
import type { HwUnitInput, Istochnik } from '@/lib/dz/types';

type Vkladka = Istochnik;

function DobavitKnopka({
  punkt,
  label,
  disabled = false,
}: {
  punkt: Parameters<typeof dobavit>[0];
  label: string;
  disabled?: boolean;
}) {
  useChernovik();
  const est = estVChernovike(punkt);
  return (
    <button
      type="button"
      className={clsx('stk-btn stk-btn--sm dzk-dobavit', est ? 'is-est' : 'stk-btn--primary')}
      disabled={disabled || est}
      onClick={() => void dobavit(punkt)}
    >
      <Ikonka name={est ? 'da' : 'plus'} /> {est ? DZK.knopka.dobavleno : label}
    </button>
  );
}

/* ── Карточки ─────────────────────────────────────────────────── */

function Nabor({ no, t }: { no: number; t: PodtemaKat }) {
  const [vybor, setVybor] = useState<Set<string> | null>(null);
  const [oborot, setOborot] = useState<string | null>(null);
  return (
    <li className="dzk-item stk-glass" data-nabor={t.id}>
      <div className="dzk-item__verh">
        <p className="dzk-item__nazvanie" dangerouslySetInnerHTML={{ __html: t.titleHtml }} />
        <span className="dzk-item__skolko">{DZK.kartochek(t.kartochki.length)}</span>
      </div>
      <div className="dzk-item__knopki">
        <DobavitKnopka
          punkt={{ ist: 'kartochki', no, podtema: t.id, kartochki: null }}
          label={DZK.kartochki.nabor}
        />
        <button
          type="button"
          className="stk-btn stk-btn--sm stk-btn--tihaya"
          aria-expanded={vybor !== null}
          onClick={() => setVybor((v) => (v === null ? new Set() : null))}
        >
          {vybor === null ? DZK.kartochki.vybrat : DZK.kartochki.skryt}
        </button>
      </div>
      {vybor === null ? null : (
        <>
          <ul className="dzk-vybor">
            {t.kartochki.map((k) => (
              <li key={k.id} className="dzk-vybor__item">
                <label className="dzk-galka">
                  <input
                    type="checkbox"
                    checked={vybor.has(k.id)}
                    onChange={() =>
                      setVybor((v) => {
                        const n = new Set(v);
                        if (n.has(k.id)) n.delete(k.id);
                        else n.add(k.id);
                        return n;
                      })
                    }
                  />
                  <span className="dzk-kartochka">
                    <span
                      className="dzk-kartochka__front"
                      dangerouslySetInnerHTML={{ __html: k.front }}
                    />
                    {k.type === 'verno' || k.type === 'vychislenie' ? (
                      <span className="dzk-metka">{DZK.kartochki.sProverkoy}</span>
                    ) : null}
                  </span>
                </label>
                {k.back === '' ? null : (
                  <button
                    type="button"
                    className="stk-btn stk-btn--sm stk-btn--tihaya"
                    aria-expanded={oborot === k.id}
                    onClick={() => setOborot((o) => (o === k.id ? null : k.id))}
                  >
                    {DZK.kartochki.oborot}
                  </button>
                )}
                {oborot === k.id ? (
                  <div
                    className="dzk-kartochka__oborot"
                    dangerouslySetInnerHTML={{ __html: k.back }}
                  />
                ) : null}
              </li>
            ))}
          </ul>
          <DobavitKnopka
            punkt={{
              ist: 'kartochki',
              no,
              podtema: t.id,
              kartochki: t.kartochki.filter((k) => vybor.has(k.id)).map((k) => k.id),
            }}
            label={DZK.kartochki.dobavitVybrannye(vybor.size)}
            disabled={vybor.size === 0}
          />
        </>
      )}
    </li>
  );
}

/* ── Опорные ──────────────────────────────────────────────────── */

function Blok({ no, b }: { no: number; b: BlokKat }) {
  const [vybor, setVybor] = useState<Set<string> | null>(null);
  const izZerna = b.zadachi.some((z) => z.izZerna === true);
  return (
    <li className="dzk-item stk-glass" data-blok={b.slug}>
      <div className="dzk-item__verh">
        <p className="dzk-item__nazvanie">{b.nazvanie}</p>
        <span className="dzk-item__skolko">{DZK.zadach(b.zadachi.length)}</span>
      </div>
      <p className="dzk-item__lead">{izZerna ? DZK.opornye.analogi : DZK.opornye.sama}</p>
      <div className="dzk-item__knopki">
        <DobavitKnopka
          punkt={{ ist: 'opornye', no, blok: b.slug, zadachi: null, kazhdomu: false }}
          label={DZK.opornye.blok}
        />
        <button
          type="button"
          className="stk-btn stk-btn--sm stk-btn--tihaya"
          aria-expanded={vybor !== null}
          onClick={() => setVybor((v) => (v === null ? new Set() : null))}
        >
          {vybor === null ? DZK.opornye.vybrat : DZK.kartochki.skryt}
        </button>
      </div>
      {vybor === null ? null : (
        <>
          <ul className="dzk-vybor">
            {b.zadachi.map((z, i) => (
              <li key={z.id} className="dzk-vybor__item">
                <label className="dzk-galka">
                  <input
                    type="checkbox"
                    checked={vybor.has(z.id)}
                    onChange={() =>
                      setVybor((v) => {
                        const n = new Set(v);
                        if (n.has(z.id)) n.delete(z.id);
                        else n.add(z.id);
                        return n;
                      })
                    }
                  />
                  <span className="dzk-zadacha">
                    <b>{i + 1}.</b>{' '}
                    {z.nazvanie === undefined ? null : (
                      <span className="dzk-zadacha__tip">{z.nazvanie}: </span>
                    )}
                    <span dangerouslySetInnerHTML={{ __html: z.uslovieHtml }} />
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <DobavitKnopka
            punkt={{
              ist: 'opornye',
              no,
              blok: b.slug,
              zadachi: b.zadachi.filter((z) => vybor.has(z.id)).map((z) => z.id),
              kazhdomu: false,
            }}
            label={DZK.opornye.dobavitVybrannye(vybor.size)}
            disabled={vybor.size === 0}
          />
        </>
      )}
    </li>
  );
}

/* ── Тренажёр ─────────────────────────────────────────────────── */

/** Пример задачи типа: тот же сборщик, что при выдаче. */
function Primer({ kat, tip }: { kat: KatalogRazdela; tip: string }) {
  const [nomer, setNomer] = useState(0);
  const klyuch = `${kat.no}:${tip}:${nomer}`;
  /* Результат помнит, для какого запроса он: пока новый не пришёл — «собираем». */
  const [rez, setRez] = useState<{ klyuch: string; u: HwUnitInput | 'oshibka' } | null>(null);
  useEffect(() => {
    let alive = true;
    void (async () => {
      let u: HwUnitInput | 'oshibka' = 'oshibka';
      try {
        const zerno = `primer-${Date.now().toString(36)}-${nomer}`;
        const getter = (await import('@/lib/dz/sborka/razdely')).SBORSHCHIKI[kat.no];
        const units =
          getter === undefined
            ? []
            : await (await getter()).trenazher(kat, [tip], 1, zerno, [null]);
        u = units[0] ?? 'oshibka';
      } catch {
        u = 'oshibka';
      }
      if (alive) setRez({ klyuch: `${kat.no}:${tip}:${nomer}`, u });
    })();
    return () => {
      alive = false;
    };
  }, [kat, tip, nomer]);
  const u = rez !== null && rez.klyuch === klyuch ? rez.u : null;
  if (u === null) return <p className="dzk-muted">{DZK.trenazher.zagruzkaPrimera}</p>;
  if (u === 'oshibka') return <p className="dzk-muted">{DZK.oshibkaZagruzki}</p>;
  return (
    <div className="dzk-primer" data-block="dz-primer">
      <div
        className={clsx('dzk-primer__uslovie', u.view.tekst === true && 'is-tekst')}
        dangerouslySetInnerHTML={{ __html: u.questionHtml }}
      />
      <div className="dzk-item__knopki">
        <DobavitKnopka
          punkt={{ ist: 'zadacha', no: kat.no, ref: u.ref, tip }}
          label={DZK.trenazher.vzyatEtu}
        />
        <button
          type="button"
          className="stk-btn stk-btn--sm stk-btn--tihaya"
          onClick={() => setNomer((n) => n + 1)}
        >
          {DZK.trenazher.eshchePrimer}
        </button>
      </div>
    </div>
  );
}

function Stepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <span className="dzk-stepper__ryad" role="group" aria-label={label}>
      <button
        type="button"
        className="stk-btn stk-btn--sm"
        aria-label="Меньше"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <output>{value}</output>
      <button
        type="button"
        className="stk-btn stk-btn--sm"
        aria-label="Больше"
        disabled={value >= 20}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </span>
  );
}

function Gruppa({ kat, g }: { kat: KatalogRazdela; g: GruppaKat }) {
  const [skolko, setSkolko] = useState<Record<string, number>>({});
  const [vsya, setVsya] = useState(5);
  const [primer, setPrimer] = useState<string | null>(null);
  return (
    <li className="dzk-item stk-glass" data-gruppa={g.id}>
      <div className="dzk-item__verh">
        <p className="dzk-item__nazvanie">{g.nazvanie}</p>
        <span className="dzk-item__skolko">{DZK.tipov(g.tipy.length)}</span>
      </div>
      <div className="dzk-item__knopki">
        <Stepper value={vsya} onChange={setVsya} label={`${DZK.trenazher.skolko}: ${g.nazvanie}`} />
        <DobavitKnopka
          punkt={{
            ist: 'trenazher',
            no: kat.no,
            tipy: g.tipy.map((t) => t.id),
            gruppa: g.id,
            skolko: vsya,
            kazhdomu: false,
          }}
          label={DZK.trenazher.gruppa}
        />
      </div>
      <ul className="dzk-tipy">
        {g.tipy.map((t) => (
          <li key={t.id} className="dzk-tip" data-tip={t.id}>
            <p className="dzk-tip__nazvanie" dangerouslySetInnerHTML={{ __html: t.nazvanieHtml }} />
            <div className="dzk-item__knopki">
              <Stepper
                value={skolko[t.id] ?? 2}
                onChange={(n) => setSkolko((s) => ({ ...s, [t.id]: n }))}
                label={DZK.trenazher.skolko}
              />
              <DobavitKnopka
                punkt={{
                  ist: 'trenazher',
                  no: kat.no,
                  tipy: [t.id],
                  skolko: skolko[t.id] ?? 2,
                  kazhdomu: false,
                }}
                label={DZK.trenazher.dobavit}
              />
              <button
                type="button"
                className="stk-btn stk-btn--sm stk-btn--tihaya"
                aria-expanded={primer === t.id}
                onClick={() => setPrimer((p) => (p === t.id ? null : t.id))}
              >
                {DZK.trenazher.predprosmotr}
              </button>
            </div>
            {primer === t.id ? <Primer kat={kat} tip={t.id} /> : null}
          </li>
        ))}
      </ul>
    </li>
  );
}

/* ── Панель источников ────────────────────────────────────────── */

export function Istochniki() {
  const [no, setNo] = useState<number>(RAZDELY_DZ_KLIENT[0]);
  const [vkladka, setVkladka] = useState<Vkladka>('kartochki');
  const [zagruzheno, setZagruzheno] = useState<{
    klyuch: string;
    k: KatalogRazdela | 'oshibka';
  } | null>(null);
  const [popytka, setPopytka] = useState(0);
  const klyuch = `${no}:${popytka}`;

  useEffect(() => {
    let alive = true;
    const k = `${no}:${popytka}`;
    zagruzitKatalog(no)
      .then((x) => {
        if (alive) setZagruzheno({ klyuch: k, k: x });
      })
      .catch(() => {
        if (alive) setZagruzheno({ klyuch: k, k: 'oshibka' });
      });
    return () => {
      alive = false;
    };
  }, [no, popytka]);
  const kat = zagruzheno !== null && zagruzheno.klyuch === klyuch ? zagruzheno.k : null;

  const vkladki: Vkladka[] = ['kartochki', 'opornye', 'trenazher'];

  return (
    <section className="dzk-istochniki" aria-label="Что добавить">
      <div className="dzk-razdely" role="group" aria-label={DZK.razdel}>
        {RAZDELY_DZ_KLIENT.map((n) => (
          <button
            key={n}
            type="button"
            className={clsx('dzk-chip', n === no && 'is-active')}
            aria-pressed={n === no}
            onClick={() => setNo(n)}
          >
            №{n}
            {typeof kat === 'object' && kat !== null && kat.no === n ? ` · ${kat.nazvanie}` : ''}
          </button>
        ))}
      </div>
      <div className="dzk-vkladki" role="tablist" aria-label="Источник">
        {vkladki.map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            id={`dzk-tab-${v}`}
            aria-selected={vkladka === v}
            aria-controls="dzk-panel"
            className={clsx('dzk-vkladka', vkladka === v && 'is-active')}
            onClick={() => setVkladka(v)}
          >
            {ISTOCHNIK_VKLADKA[v]}
          </button>
        ))}
      </div>
      <div
        id="dzk-panel"
        role="tabpanel"
        aria-labelledby={`dzk-tab-${vkladka}`}
        className="dzk-panel"
      >
        {kat === null ? (
          <p className="dzk-muted">{DZK.zagruzka}</p>
        ) : kat === 'oshibka' ? (
          <p className="dzk-muted">
            {DZK.oshibkaZagruzki}{' '}
            <button
              type="button"
              className="stk-btn stk-btn--sm"
              onClick={() => setPopytka((n) => n + 1)}
            >
              {DZK.povtorit}
            </button>
          </p>
        ) : vkladka === 'kartochki' ? (
          kat.kartochki === null ? (
            <p className="dzk-muted">{DZK.kartochki.netKartochek}</p>
          ) : (
            <ul className="dzk-spisok">
              {kat.kartochki.map((t) => (
                <Nabor key={t.id} no={kat.no} t={t} />
              ))}
            </ul>
          )
        ) : vkladka === 'opornye' ? (
          <ul className="dzk-spisok">
            {kat.opornye.map((b) => (
              <Blok key={b.slug} no={kat.no} b={b} />
            ))}
          </ul>
        ) : (
          <ul className="dzk-spisok">
            {kat.trenazher.map((g) => (
              <Gruppa key={g.id} kat={kat} g={g} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
