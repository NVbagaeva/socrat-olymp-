'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { Input } from '@/components/ui';
import { ShagiVoprosy, shagiSost } from '@/components/trenazher/ShagiVoprosy';
import '@/components/trenazher/shagi.css';
import type { KartochkaRazdela, Shagi } from '@/components/trenazher/types';
import { TRENAZHER_13 } from '@/content/zadanie13';
import { checkSealed } from '@/lib/zadanie13/edinicy';
import type { ShagHtml } from '@/lib/zadanie13/opornye/seal';
import { trenazher13 } from '@/lib/zadanie13/progress';
import { answerMatches, choiceMatches } from '@/lib/zadanie13/secret';
import { poKlyuchu13 } from '@/lib/zadanie13/trenazher/filtry13';
import type { Oformlenie13, Zadacha13T } from '@/lib/zadanie13/trenazher/zadacha';
import { TYPE_NAMES, type TypeCode } from '@/lib/zadanie13/types';
import { otkryt13, Razbor13Blok } from './Razbor13';

/**
 * Карточка задачи №13 в общем тренажёре (components/trenazher/).
 *
 * Поле ответа — плагин: число (ответ в чужих денежных единицах не
 * засчитывается, пояснение говорит почему), выбор схемы у «Определить
 * схему» и «С оформлением» — схема, первая строка таблицы и число
 * одним ответом. Подсказка — вопросы по шагам, ответ ученик вводит
 * сам. Разбор — решение по шагам и ссылки на теорию и опорные задачи
 * этой схемы. Ответ, клетки, подсказки и разбор закрыты отпечатком.
 */

/** Задача тренировки: задача движка и как её решают (поле «Ответ» фильтра). */
export type Zadacha13Tren = Zadacha13T & { oformit: boolean };

/** Куда вести из задачи: глава теории и первый опорный блок схемы. */
export const SSYLKI_13: Record<TypeCode, { teoriya: string; opornyy: string }> = {
  A: { teoriya: 'dif', opornyy: 'pereplata' },
  B: { teoriya: 'polomannyy', opornyy: 'dve-stavki' },
  C: { teoriya: 'annuitet', opornyy: 'ravnye-platezhi' },
  D: { teoriya: 'vklady', opornyy: 'celyy-vklad' },
};

const PODSKAZKI = new WeakMap<Zadacha13T, ShagHtml[]>();
function podskazki(z: Zadacha13T): ShagHtml[] {
  if (!PODSKAZKI.has(z)) PODSKAZKI.set(z, otkryt13<ShagHtml[]>(z, z.podskazki) ?? []);
  return PODSKAZKI.get(z) ?? [];
}

const OFORMLENIE = new WeakMap<Zadacha13T, Oformlenie13 | null>();
function oformlenie(z: Zadacha13Tren): Oformlenie13 | null {
  if (!z.oformit || z.oformlenie === null) return null;
  if (!OFORMLENIE.has(z)) OFORMLENIE.set(z, otkryt13<Oformlenie13>(z, z.oformlenie));
  return OFORMLENIE.get(z) ?? null;
}

/** Ответ с оформлением одной строкой: выбранная схема, клетки, число. */
interface Oformlennyy {
  s: number | null;
  k: Record<string, string>;
  o: string;
}

function razobrat(value: string): Oformlennyy {
  try {
    const raw = JSON.parse(value) as Partial<Oformlennyy>;
    return {
      s: typeof raw.s === 'number' ? raw.s : null,
      k: typeof raw.k === 'object' && raw.k !== null ? raw.k : {},
      o: typeof raw.o === 'string' ? raw.o : '',
    };
  } catch {
    return { s: null, k: {}, o: '' };
  }
}

/** Клетки первой строки, которые считает ученик: индекс → отпечаток. */
function svoiKletki(of: Oformlenie13): [string, string][] {
  return (of.stroka?.kletki ?? []).flatMap((k, i) =>
    k.seal === null ? [] : [[String(i), k.seal]],
  );
}

/** Что в ответе с оформлением неверно. */
function oshibkiOformleniya(of: Oformlenie13, z: Zadacha13T, a: Oformlennyy) {
  return {
    shema: a.s !== of.shema.correct,
    kletki: svoiKletki(of)
      .filter(([i, seal]) => !answerMatches(a.k[i] ?? '', seal))
      .map(([i]) => i),
    otvet: checkSealed(a.o, { answer: z.seal, wrongUnits: z.wrongUnits }, answerMatches),
  };
}

function Uslovie({ task: z }: { task: Zadacha13Tren; nomer: number; shagi: Shagi | null }) {
  return (
    <div className="ptask__text z13t">
      <div className="ptask__question" dangerouslySetInnerHTML={{ __html: z.uslovieHtml }} />
      {z.tablitsaHtml === null ? null : (
        <div className="z13-ptask__tab" dangerouslySetInnerHTML={{ __html: z.tablitsaHtml }} />
      )}
    </div>
  );
}

function Otvet({
  task: z,
  value,
  onChange,
  proverka,
  disabled,
  labelId,
}: {
  task: Zadacha13Tren;
  value: string;
  onChange: (v: string) => void;
  proverka: 'right' | 'wrong' | null;
  disabled: boolean;
  labelId: string;
}) {
  if (z.vybory !== null) {
    return (
      <ul className="ptask__options" aria-labelledby={labelId}>
        {z.vybory.map((v) => (
          <li key={v.number}>
            <button
              type="button"
              className={clsx(
                'popt',
                value === v.number && 'is-chosen',
                value === v.number && proverka !== null && `is-${proverka}`,
              )}
              aria-pressed={value === v.number}
              disabled={disabled}
              onClick={() => onChange(v.number)}
            >
              <span className="popt__no">{v.number}</span>
              <span className="popt__text">{v.label}</span>
            </button>
          </li>
        ))}
      </ul>
    );
  }
  const of = oformlenie(z);
  const sostoyanie = (v: 'right' | 'wrong' | null) =>
    v === null ? 'default' : v === 'right' ? 'success' : 'error';
  if (of === null) {
    return (
      <Input
        className="ttask__input"
        value={value}
        state={sostoyanie(proverka)}
        inputMode="decimal"
        autoComplete="off"
        aria-labelledby={labelId}
        readOnly={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  const a = razobrat(value);
  const set = (patch: Partial<Oformlennyy>) => onChange(JSON.stringify({ ...a, ...patch }));
  const osh = proverka === 'wrong' ? oshibkiOformleniya(of, z, a) : null;
  return (
    <div className="z13t-of" role="group" aria-labelledby={labelId}>
      <section className="z13-of__shag">
        <p className="z13-of__no">{TRENAZHER_13.shagShema}</p>
        <div className="trz-q__options" role="group">
          {of.shema.options.map((o, k) => (
            <button
              key={k}
              type="button"
              className={clsx(
                'trz-q__option',
                a.s === k && 'is-chosen',
                a.s === k && proverka === 'right' && 'is-right',
                a.s === k && osh?.shema === true && 'is-wrong',
              )}
              aria-pressed={a.s === k}
              disabled={disabled}
              onClick={() => set({ s: k })}
              dangerouslySetInnerHTML={{ __html: o }}
            />
          ))}
        </div>
      </section>
      {of.stroka === null ? null : (
        <section className="z13-of__shag">
          <p className="z13-of__no">{TRENAZHER_13.shagStroka}</p>
          <div className="z13-of__stroka">
            <p className="z13-of__label">{of.stroka.label}</p>
            {of.stroka.kletki.map((k, i) => {
              const key = String(i);
              return (
                <div key={key} className="z13-of__kletka">
                  <span className="z13-of__title">{k.title}</span>
                  {k.seal === null ? (
                    <span
                      className="z13-of__dano"
                      dangerouslySetInnerHTML={{ __html: k.html ?? '' }}
                    />
                  ) : (
                    <span className="z13-of__vvod">
                      <Input
                        value={a.k[key] ?? ''}
                        inputMode="decimal"
                        autoComplete="off"
                        aria-label={`${of.stroka?.label ?? ''}: ${k.title}`}
                        readOnly={disabled}
                        state={
                          osh === null
                            ? sostoyanie(proverka)
                            : osh.kletki.includes(key)
                              ? 'error'
                              : 'success'
                        }
                        onChange={(e) => set({ k: { ...a.k, [key]: e.target.value } })}
                      />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
      <section className="z13-of__shag">
        <p className="z13-of__no">{TRENAZHER_13.shagOtvet}</p>
        <Input
          className="ttask__input"
          value={a.o}
          inputMode="decimal"
          autoComplete="off"
          aria-label={TRENAZHER_13.shagOtvet}
          readOnly={disabled}
          state={osh === null ? sostoyanie(proverka) : osh.otvet === 'right' ? 'success' : 'error'}
          onChange={(e) => set({ o: e.target.value })}
        />
      </section>
    </div>
  );
}

function Podskazka({
  task: z,
  shagi,
  setShagi,
  onMiss,
  onDone,
}: {
  task: Zadacha13Tren;
  shagi: Shagi;
  setShagi: (next: Shagi) => void;
  onMiss: () => void;
  onDone: () => void;
}) {
  return (
    <div className="z13t-hint">
      <ShagiVoprosy
        shagi={podskazki(z)}
        sost={shagiSost(shagi)}
        onChange={(next) => setShagi({ ...next })}
        onMiss={onMiss}
        onDone={onDone}
        slova={{
          shag: (i, n) => TRENAZHER_13.shagi(i, n),
          neverno: TRENAZHER_13.nevernoHint,
          vse: TRENAZHER_13.vseShagi,
        }}
      />
    </div>
  );
}

export function kartochka13(base: string): KartochkaRazdela<Zadacha13Tren> {
  function Razbor({ task: z }: { task: Zadacha13Tren }) {
    const razbor = otkryt13<Parameters<typeof Razbor13Blok>[0]['razbor']>(z, z.razbor);
    const ssylka = SSYLKI_13[z.type];
    return (
      <>
        {razbor === null ? null : <Razbor13Blok razbor={razbor} />}
        {/* Ссылки называют схему — показываем их после задачи. */}
        {z.vid === 'tip' ? null : (
          <nav className="z13-resh__links" aria-label={TRENAZHER_13.materialy}>
            <Link href={`${base}/teoriya/#${ssylka.teoriya}`}>
              {TRENAZHER_13.teoriya}: {TYPE_NAMES[z.type].toLowerCase()}
            </Link>
            <Link href={`${base}/opornye-zadachi/${ssylka.opornyy}/`}>{TRENAZHER_13.opornye}</Link>
          </nav>
        )}
      </>
    );
  }

  return {
    zagruzit: async () => {
      /* Движок задач и KaTeX — только по «Начать». */
      const [{ sobratZadachu13 }, { osnovaSeed }] = await Promise.all([
        import('@/lib/zadanie13/trenazher/zadacha'),
        import('@/lib/trenazher/sessiya'),
      ]);
      const cache = new Map<string, Zadacha13Tren>();
      return {
        postroit: (payload, at, pohozhaya) => {
          const item = payload.items[at];
          const k = item === undefined ? null : poKlyuchu13(item.k);
          if (item === undefined || k === null) return null;
          const vid = payload.dop?.['zadanie'] === 'tip' ? 'tip' : 'zadachi';
          const oformit = vid === 'zadachi' && payload.dop?.['oformlenie'] === 'oformlenie';
          /* Похожая — новая задача того же прототипа; своя у задания — его seed. */
          const seed =
            pohozhaya > 0 ? `n${osnovaSeed(payload, at, pohozhaya)}` : (item.seed ?? k.seed);
          const kk = `${k.prototypeId}|${seed}|${vid}|${oformit ? 1 : 0}`;
          const got = cache.get(kk);
          if (got !== undefined) return got;
          try {
            const z = sobratZadachu13(
              {
                prototypeId: k.prototypeId,
                seed,
                istochnik: seed.startsWith('n') ? 'new' : 'bank',
                vid,
              },
              at + 1,
            );
            const t: Zadacha13Tren = { ...z, oformit };
            cache.set(kk, t);
            return t;
          } catch {
            return null;
          }
        },
      };
    },
    html: (z) => z.uslovieHtml,
    Uslovie,
    Otvet,
    gotov: (z, value) => {
      const of = oformlenie(z);
      if (z.vybory !== null || of === null) return value.trim() !== '';
      const a = razobrat(value);
      return (
        a.s !== null &&
        a.o.trim() !== '' &&
        svoiKletki(of).every(([i]) => (a.k[i] ?? '').trim() !== '')
      );
    },
    proverit: (z, value) => {
      if (z.vybory !== null) return choiceMatches(value, z.seal);
      const of = oformlenie(z);
      if (of === null) {
        return (
          checkSealed(value, { answer: z.seal, wrongUnits: z.wrongUnits }, answerMatches) ===
          'right'
        );
      }
      const osh = oshibkiOformleniya(of, z, razobrat(value));
      return !osh.shema && osh.kletki.length === 0 && osh.otvet === 'right';
    },
    poyasnenie: (z, value, right) => {
      if (right || z.vybory !== null) return '';
      const of = oformlenie(z);
      if (of === null) {
        const v = checkSealed(value, { answer: z.seal, wrongUnits: z.wrongUnits }, answerMatches);
        return v === 'units' ? TRENAZHER_13.edinicy : '';
      }
      const osh = oshibkiOformleniya(of, z, razobrat(value));
      return [
        osh.shema ? TRENAZHER_13.shemaNeverno : '',
        osh.kletki.length > 0 ? TRENAZHER_13.kletkiNeverno : '',
        osh.otvet === 'units'
          ? TRENAZHER_13.edinicy
          : osh.otvet === 'wrong'
            ? TRENAZHER_13.otvetNeverno
            : '',
      ]
        .filter((x) => x !== '')
        .join(' ');
    },
    estPodskazka: (z) => z.vid !== 'tip' && podskazki(z).length > 0,
    otvetPosleShagov: true,
    Podskazka,
    estRazbor: () => true,
    Razbor,
    zapisat: (key, itog) =>
      trenazher13.recordAttempt({
        kind: key.split('|')[0] ?? key,
        taskId: key,
        right: itog.right,
        clean: itog.clean,
        seconds: itog.sek,
        itog: itog.right ? 'right' : 'wrong',
      }),
  };
}
