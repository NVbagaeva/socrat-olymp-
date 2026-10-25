'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { Input } from '@/components/ui';
import type { KartochkaRazdela, Shagi } from '@/components/trenazher/types';
import { TRENAZHER_11 } from '@/content/zadanie11';
import { trenazher11 } from '@/lib/zadanie11/progress';
import { answerMatches, choiceMatches } from '@/lib/zadanie11/secret';
import type { SsylkiRazdela } from '@/lib/zadanie11/trenazher/dannye';
import { planPoKlyuchu } from '@/lib/zadanie11/trenazher/filtry11';
import type { UslovieBanka } from '@/lib/zadanie11/trenazher/sessiya';
import type { Podskazki11, Razbor11, Zadacha11 } from '@/lib/zadanie11/trenazher/zadacha';
import type { SectionId, Tablitsa } from '@/lib/zadanie11/types';
import { IkonkaRazdela, Piktogramma, tsvetRazdela } from './Piktogrammy';
import { Tablitsa11 } from './Tablitsa11';
import { otkryt, Razbor11Blok } from './Razbor11';

/**
 * Карточка задачи №11 в общем тренажёре (components/trenazher/):
 * раздел и подтип, условие, ссылки на лайфхак, теорию и опорный блок;
 * ответ числом или выбором; подсказка — вопросы по шагам, с каждым
 * пройденным шагом открывается часть таблицы модели; разбор по этапам.
 * Ответ, подсказки и разбор закрыты отпечатком (lib/zadanie11/secret).
 */

/** Подсказка открывается из отпечатка один раз на задачу. */
const PODSKAZKI = new WeakMap<Zadacha11, Podskazki11 | null>();
function podskazki(z: Zadacha11): Podskazki11 | null {
  if (!PODSKAZKI.has(z)) PODSKAZKI.set(z, otkryt<Podskazki11>(z, z.podskazki));
  return PODSKAZKI.get(z) ?? null;
}

/** Состояние подсказки: пройдено шагов, неверные варианты шага, открытые клетки. */
interface Hint {
  shag: number;
  mimo: number[];
  otkrytye: string[];
}

function hintOf(shagi: Shagi | null): Hint {
  const raw = shagi ?? {};
  const shag = raw['shag'];
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  return {
    shag: typeof shag === 'number' && Number.isInteger(shag) && shag >= 0 ? shag : 0,
    mimo: list(raw['mimo']).filter((x): x is number => typeof x === 'number'),
    otkrytye: list(raw['otkrytye']).filter((x): x is string => typeof x === 'string'),
  };
}

/**
 * Клетки таблиц, которые ученик заполняет сам: в них есть неизвестная
 * (x, y, z). Порядок — по столбцам слева направо, как в подсказках.
 */
function pustyeKletki(tables: Tablitsa[]): string[] {
  const out: string[] = [];
  tables.forEach((t, ti) => {
    for (let c = 1; c < t.head.length; c += 1) {
      t.rows.forEach((row, r) => {
        const tex = (row[c] ?? '').replace(/\\(?:dfrac|tfrac|frac|cdot|text|mathrm|times)/g, '');
        if (/[xyz]/.test(tex)) out.push(`${ti}|${r}:${c}`);
      });
    }
  });
  return out;
}

export interface Kartochka11Dannye {
  bank: readonly UslovieBanka[];
  ssylki: Record<SectionId, SsylkiRazdela>;
  nazvaniya: Record<SectionId, string>;
  base: string;
}

export function kartochka11({
  bank,
  ssylki,
  nazvaniya,
  base,
}: Kartochka11Dannye): KartochkaRazdela<Zadacha11> {
  function Uslovie({ task: z }: { task: Zadacha11; nomer: number; shagi: Shagi | null }) {
    const ssylka = ssylki[z.section];
    const teoriya = ssylka.podtipy[z.id] ?? ssylka.teoriya;
    const layfhak = z.lifehacks[0];
    return (
      <div className={clsx('ptask__text z11t', tsvetRazdela(z.section))}>
        <div className="z11-resh__razdel">
          <IkonkaRazdela section={z.section} />
          <span className="z11-resh__razdel-text">
            <span className="z11-resh__razdel-name">{nazvaniya[z.section]}</span>
            <span className="z11-resh__podtip">{z.title}</span>
          </span>
        </div>
        <div className="ptask__question" dangerouslySetInnerHTML={{ __html: z.uslovieHtml }} />
        <nav className="z11-resh__links" aria-label={TRENAZHER_11.materialy}>
          {layfhak === undefined ? null : (
            <Link className="z11-resh__link" href={`${base}/teoriya/#layfhak-${layfhak}`}>
              <Piktogramma name="bolt" />
              {TRENAZHER_11.layfhak}
            </Link>
          )}
          {teoriya === '' ? null : (
            <Link className="z11-resh__link" href={`${base}/teoriya/#${teoriya}`}>
              <Piktogramma name="book" />
              {TRENAZHER_11.teoriya}
            </Link>
          )}
          {ssylka.opornyy === null ? null : (
            <Link
              className="z11-resh__link"
              href={`${base}/opornye-zadachi/${ssylka.opornyy.slug}/`}
            >
              <Piktogramma name="tools" />
              {TRENAZHER_11.opornyy}
            </Link>
          )}
        </nav>
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
    task: Zadacha11;
    value: string;
    onChange: (v: string) => void;
    proverka: 'right' | 'wrong' | null;
    disabled: boolean;
    labelId: string;
  }) {
    if (z.answerType === 'choice' && z.vybory !== null) {
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
                <span className="popt__text" dangerouslySetInnerHTML={{ __html: v.label }} />
              </button>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <Input
        className="ttask__input"
        value={value}
        state={proverka === null ? 'default' : proverka === 'right' ? 'success' : 'error'}
        inputMode="decimal"
        autoComplete="off"
        aria-labelledby={labelId}
        readOnly={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  function Podskazka({
    task: z,
    shagi,
    setShagi,
    onMiss,
    onDone,
  }: {
    task: Zadacha11;
    shagi: Shagi;
    setShagi: (next: Shagi) => void;
    onMiss: () => void;
    onDone: () => void;
  }) {
    const p = podskazki(z);
    const h = hintOf(shagi);
    const steps = p?.shagi ?? [];
    const tables = p?.tables ?? [];
    const tek = steps[h.shag];
    const pred = h.shag > 0 ? steps[h.shag - 1] : undefined;
    const pustye = pustyeKletki(tables);
    /* Пройдено k шагов из n — открыта такая же доля пустых клеток. */
    const poShagam = steps.length === 0 ? 0 : Math.round((pustye.length * h.shag) / steps.length);
    const zakryto = new Set(pustye.filter((k, i) => i >= poShagam && !h.otkrytye.includes(k)));

    function vybrat(k: number) {
      if (tek === undefined) return;
      if (k !== tek.correct) {
        setShagi({ ...h, mimo: [...h.mimo, k] });
        onMiss();
        return;
      }
      setShagi({ ...h, shag: h.shag + 1, mimo: [] });
      if (h.shag + 1 >= steps.length) onDone();
    }

    return (
      <div className={clsx('z11t-hint', tsvetRazdela(z.section))}>
        {tek === undefined ? null : (
          <div className="z11-resh__shag">
            <p className="tstep__no">{TRENAZHER_11.shag(h.shag + 1, steps.length)}</p>
            <p className="z11-resh__q" dangerouslySetInnerHTML={{ __html: tek.question }} />
            <div className="z11-resh__opts">
              {tek.options.map((o, k) => (
                <button
                  key={k}
                  type="button"
                  className={clsx('z11-resh__opt', h.mimo.includes(k) && 'is-wrong')}
                  disabled={h.mimo.includes(k)}
                  onClick={() => vybrat(k)}
                  dangerouslySetInnerHTML={{ __html: o }}
                />
              ))}
            </div>
            {h.mimo.length > 0 ? (
              <p className="z11-resh__oops">{TRENAZHER_11.nevernoHint}</p>
            ) : null}
          </div>
        )}
        {pred === undefined ? null : (
          <div className="z11-resh__pred">
            <p className="z11-resh__pred-otvet">
              <span dangerouslySetInnerHTML={{ __html: pred.question }} />{' '}
              <b dangerouslySetInnerHTML={{ __html: pred.options[pred.correct] ?? '' }} />
            </p>
            {pred.comment === null ? null : (
              <p
                className="z11-resh__pred-comment"
                dangerouslySetInnerHTML={{ __html: pred.comment }}
              />
            )}
            {h.shag >= steps.length ? (
              <p className="z11-resh__pred-done">{TRENAZHER_11.vseShagi}</p>
            ) : null}
          </div>
        )}
        {tables.length === 0 ? null : (
          <section className="z11-resh__tablitsa">
            <h3 className="z11-resh__h">
              <Piktogramma name="table" />
              {TRENAZHER_11.tablitsa}
            </h3>
            {tables.map((t, ti) => (
              <Tablitsa11
                key={ti}
                table={t}
                skryto={
                  new Set(
                    [...zakryto]
                      .filter((k) => k.startsWith(`${ti}|`))
                      .map((k) => k.slice(k.indexOf('|') + 1)),
                  )
                }
                onOtkryt={(k) => setShagi({ ...h, otkrytye: [...h.otkrytye, `${ti}|${k}`] })}
              />
            ))}
            {zakryto.size > 0 ? (
              <p className="z11-resh__note">{TRENAZHER_11.tablitsaNote}</p>
            ) : null}
          </section>
        )}
      </div>
    );
  }

  function Razbor({ task: z }: { task: Zadacha11 }) {
    const razbor = otkryt<Razbor11>(z, z.razbor);
    return razbor === null ? null : (
      <div className={tsvetRazdela(z.section)}>
        <Razbor11Blok razbor={razbor} />
      </div>
    );
  }

  return {
    zagruzit: async () => {
      /* Движок всех подтипов и KaTeX — только по «Начать». */
      const [{ sobratZadachu }, { osnovaSeed }] = await Promise.all([
        import('@/lib/zadanie11/trenazher/zadacha'),
        import('@/lib/trenazher/sessiya'),
      ]);
      const cache = new Map<string, Zadacha11>();
      return {
        postroit: (payload, at, pohozhaya) => {
          const item = payload.items[at];
          if (item === undefined) return null;
          const seed = osnovaSeed(payload, at, pohozhaya);
          const plan = planPoKlyuchu(item.k, seed);
          if (plan === null) return null;
          /* Похожая — новая задача того же подтипа. */
          const nuzhen = pohozhaya > 0 ? { vid: 'new' as const, id: plan.id, seed } : plan;
          const k = nuzhen.vid === 'new' ? `${nuzhen.id}|n${nuzhen.seed}` : item.k;
          const got = cache.get(k);
          if (got !== undefined) return got;
          try {
            const z = sobratZadachu(nuzhen, bank);
            cache.set(k, z);
            return z;
          } catch {
            return null;
          }
        },
      };
    },
    html: (z) => z.uslovieHtml,
    Uslovie,
    Otvet,
    proverit: (z, value) =>
      z.answerType === 'choice' ? choiceMatches(value, z.seal) : answerMatches(value, z.seal),
    estPodskazka: (z) => (podskazki(z)?.shagi.length ?? 0) > 0,
    Podskazka,
    estRazbor: () => true,
    Razbor,
    zapisat: (key, itog) =>
      trenazher11.recordAttempt({
        kind: key.split('|')[0] ?? key,
        taskId: key,
        right: itog.right,
        clean: itog.clean,
        seconds: itog.sek,
        itog: itog.right ? 'right' : 'wrong',
      }),
  };
}
