'use client';

import Link from 'next/link';
import { FigureZoom, Input } from '@/components/ui';
import { ShagiVoprosy, shagiSost } from '@/components/trenazher/ShagiVoprosy';
import type { KartochkaRazdela, Shagi } from '@/components/trenazher/types';
import { TRENAZHER_1 } from '@/content/zadanie1';
import { progress1 } from '@/lib/planimetriya/progress';
import { answerMatches } from '@/lib/planimetriya/secret';
import type { SsylkiZadachi } from '@/lib/planimetriya/trenazher/dannye';
import { planPoKlyuchu1 } from '@/lib/planimetriya/trenazher/filtry1';
import type { RazdelInfo, UslovieBanka } from '@/lib/planimetriya/trenazher/sessiya';
import type { Podskazki1, Razbor1, Zadacha1 } from '@/lib/planimetriya/trenazher/zadacha';
import { Piktogramma } from '../zadanie11/Piktogrammy';
import { IkonkaBloka1 } from './IkonkaBloka1';
import { otkryt, Reshenie1 } from './Reshenie1';

/**
 * Карточка задачи №1 в общем тренажёре (components/trenazher/): блок
 * и прототип, условие с чертежом, ссылки на теорию, полезный факт,
 * опорный блок и разбор типа; ответ числом; подсказка — вопросы по
 * шагам, на каждом вопросе чертёж показывает слой этого шага; решение
 * по шагам с чертежом всех построений. Ответ, подсказки и решение
 * закрыты отпечатком (lib/planimetriya/secret).
 */

const PODSKAZKI = new WeakMap<Zadacha1, Podskazki1 | null>();
function podskazki(z: Zadacha1): Podskazki1 | null {
  if (!PODSKAZKI.has(z)) PODSKAZKI.set(z, otkryt<Podskazki1>(z, z.podskazki));
  return PODSKAZKI.get(z) ?? null;
}

/** Состояние подсказки: пройдено вопросов и неверные кнопки текущего. */
const hintOf = shagiSost;

export interface Kartochka1Dannye {
  bank: readonly UslovieBanka[];
  razdely: readonly RazdelInfo[];
  ssylki: Record<string, SsylkiZadachi>;
  base: string;
}

export function kartochka1({
  bank,
  razdely,
  ssylki,
  base,
}: Kartochka1Dannye): KartochkaRazdela<Zadacha1> {
  const bloki = new Map(razdely.flatMap((r) => r.podtipy.map((p) => [p.id, r] as const)));

  function Uslovie({ task: z, shagi }: { task: Zadacha1; nomer: number; shagi: Shagi | null }) {
    const blok = bloki.get(z.id);
    const ssylka = ssylki[z.id];
    /* Чертёж: на вопросе подсказки — слой этого шага, иначе условие. */
    const voprosy = shagi === null ? [] : (podskazki(z)?.voprosy ?? []);
    const h = hintOf(shagi);
    const risunok =
      voprosy.length === 0
        ? z.risunokSvg
        : (voprosy[h.shag]?.risunokSvg ?? voprosy[voprosy.length - 1]?.risunokSvg ?? z.risunokSvg);
    return (
      <div className="ptask__text z1t">
        <div className="z11-resh__razdel">
          <IkonkaBloka1 blok={blok?.id ?? ''} />
          <span className="z11-resh__razdel-text">
            <span className="z11-resh__razdel-name">{blok?.nazvanie}</span>
          </span>
        </div>
        <div className="z1-resh__grid">
          <div className="ptask__question" dangerouslySetInnerHTML={{ __html: z.uslovieHtml }} />
          <FigureZoom className="z1-resh__pic" label={TRENAZHER_1.risunok}>
            <span className="pl-wrap" dangerouslySetInnerHTML={{ __html: risunok }} />
          </FigureZoom>
        </div>
        {ssylka === undefined ? null : (
          <nav className="z11-resh__links" aria-label={TRENAZHER_1.materialy}>
            {ssylka.kartochka === '' ? null : (
              <Link className="z11-resh__link" href={`${base}/teoriya/#k-${ssylka.kartochka}`}>
                <Piktogramma name="book" />
                {TRENAZHER_1.povtoritTeoriyu}
              </Link>
            )}
            {ssylka.fakt === null ? null : (
              <Link className="z11-resh__link" href={`${base}/teoriya/#fakt-${ssylka.fakt}`}>
                <Piktogramma name="bolt" />
                {TRENAZHER_1.layfhak}
              </Link>
            )}
            {ssylka.opornyy === null ? null : (
              <Link
                className="z11-resh__link"
                href={`${base}/opornye-zadachi/${ssylka.opornyy.slug}/`}
              >
                <Piktogramma name="tools" />
                {TRENAZHER_1.opornyy}
              </Link>
            )}
            {ssylka.razbor === '' ? null : (
              <Link className="z11-resh__link" href={`${base}/razbor/${ssylka.razbor}/`}>
                <Piktogramma name="doc" />
                {TRENAZHER_1.razborTipa}
              </Link>
            )}
          </nav>
        )}
      </div>
    );
  }

  function Otvet({
    value,
    onChange,
    proverka,
    disabled,
    labelId,
  }: {
    task: Zadacha1;
    value: string;
    onChange: (v: string) => void;
    proverka: 'right' | 'wrong' | null;
    disabled: boolean;
    labelId: string;
  }) {
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
    task: Zadacha1;
    shagi: Shagi;
    setShagi: (next: Shagi) => void;
    onMiss: () => void;
    onDone: () => void;
  }) {
    const voprosy = podskazki(z)?.voprosy ?? [];
    const h = hintOf(shagi);
    return (
      <div className="z1t-hint">
        <ShagiVoprosy
          shagi={voprosy.map((v) => ({
            question: v.vopros,
            options: v.knopki,
            correct: v.verno,
            comment: v.poyasnenie,
          }))}
          sost={h}
          onChange={(next) => setShagi({ ...next })}
          onMiss={onMiss}
          onDone={onDone}
          slova={{
            shag: TRENAZHER_1.shag,
            neverno: TRENAZHER_1.nevernoHint,
            vse: TRENAZHER_1.vseShagi,
          }}
        />
      </div>
    );
  }

  function Razbor({ task: z }: { task: Zadacha1 }) {
    const razbor = otkryt<Razbor1>(z, z.razbor);
    return razbor === null ? null : <Reshenie1 razbor={razbor} />;
  }

  return {
    zagruzit: async () => {
      /* Движок чертежей, решения и KaTeX — только по «Начать». */
      const [{ sobratZadachu }, { osnovaSeed }] = await Promise.all([
        import('@/lib/planimetriya/trenazher/zadacha'),
        import('@/lib/trenazher/sessiya'),
      ]);
      const cache = new Map<string, Zadacha1>();
      return {
        postroit: (payload, at, pohozhaya) => {
          const item = payload.items[at];
          if (item === undefined) return null;
          const seed = osnovaSeed(payload, at, pohozhaya);
          const plan = planPoKlyuchu1(item.k, seed);
          if (plan === null) return null;
          /* Похожая — новая задача того же прототипа. */
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
    proverit: (z, value) => answerMatches(value, z.seal),
    estPodskazka: (z) => (podskazki(z)?.voprosy.length ?? 0) > 0,
    otvetPosleShagov: true,
    Podskazka,
    estRazbor: () => true,
    Razbor,
    zapisat: (key, itog) =>
      progress1.recordAttempt({
        kind: key.split('|')[0] ?? key,
        taskId: key,
        right: itog.right,
        clean: itog.clean,
        seconds: itog.sek,
        itog: itog.right ? 'right' : 'wrong',
      }),
  };
}
