'use client';

import { clsx } from 'clsx';
import { useState, type ReactNode } from 'react';
import { ZhivoyChertezh3d } from '@/components/stereo/ZhivoyChertezh3d';
import { AnswerInput } from '@/components/tasks/otvet/AnswerInput';
import { Ikonka, ShagiResheniya, type Shag, type Ton } from '@/components/tasks/steklo';
import {
  EkranZadachi,
  ItogiSessii,
  ProgressPanel,
  StartRezhimy,
  VyborTem,
  type EkranZadachiLabels,
  type ItogiLabels,
  type Otmetka,
  type SostoyanieZadachi,
  type VyborTemLabels,
} from '@/components/tasks/trening';
import type { Model } from '@/lib/solid/model';
import { sameAnswer } from '@/lib/otvet';

/* Живые части демо №3: пример с подсветкой шагов (вариант Б), опорная
   задача и тренажёр на общих компонентах №8 (components/tasks/trening).
   Прогресс здесь не сохраняется — это показ оформления. */

/* ── Пример: чертёж рядом с шагами (вариант Б) ───────────────── */

export function Demo3Primer({
  model,
  svg,
  azimuth,
  elevation,
  shagovChertezha,
  shagi,
}: {
  model: Model;
  svg: string;
  azimuth: number;
  elevation: number;
  shagovChertezha: number;
  shagi: Shag[];
}) {
  const [shag, setShag] = useState(0);
  const podpisi = Array.from({ length: shagovChertezha + 1 }, () => '');
  return (
    <div className="d3-sinhron">
      <div className="d3-sinhron__chertezh">
        <ZhivoyChertezh3d
          model={model}
          svg={svg}
          azimuth={azimuth}
          elevation={elevation}
          podpisi={podpisi}
          shag={Math.min(shag, shagovChertezha)}
          onShag={() => {}}
          bezNavigatsii
          tema="ekran"
        />
        <p className="d3-sinhron__gde" aria-live="polite">
          {shag === 0 ? 'Чертёж условия' : `На чертеже — шаг ${shag}`}
        </p>
      </div>
      <ol className="d3-sinhron__shagi">
        {shagi.map((s, i) => (
          <li key={i} className={clsx('d3-sshag', shag === i + 1 && 'is-on')}>
            <button
              type="button"
              className="d3-sshag__knopka"
              aria-pressed={shag === i + 1}
              onClick={() => setShag(shag === i + 1 ? 0 : i + 1)}
            >
              <span className="d3-sshag__no">{i + 1}</span>
              <span dangerouslySetInnerHTML={{ __html: s.chtoHtml }} />
            </button>
            {s.formulaHtml === '' ? null : (
              <div
                className="stk-shag__formula"
                dangerouslySetInnerHTML={{ __html: s.formulaHtml }}
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ── Опорная задача ──────────────────────────────────────────── */

export function Demo3Opornaya({
  no,
  uroven,
  kratko,
  uslovieHtml,
  risunok,
  otvet,
  podskazka,
  shagi,
  otkryta,
}: {
  no: number;
  uroven: number;
  kratko: string;
  uslovieHtml: string;
  risunok: ReactNode;
  otvet: string;
  podskazka: { voprosHtml: string; varianty: string[]; verno: number; vyvodHtml: string } | null;
  shagi: Shag[];
  otkryta: boolean;
}) {
  const [value, setValue] = useState('');
  const [itog, setItog] = useState<'verno' | 'neverno' | null>(null);
  const [hint, setHint] = useState(false);
  const [vybor, setVybor] = useState<number | null>(null);
  const [reshenie, setReshenie] = useState(false);
  const proverit = () => setItog(sameAnswer(value, otvet) ? 'verno' : 'neverno');
  return (
    <details className="d3-opornaya stk-glass" open={otkryta}>
      <summary className="d3-opornaya__summary stk-summary">
        <span className={clsx('d3-zakryta__no', itog === 'verno' && 'is-da')}>
          {itog === 'verno' ? <Ikonka name="da" /> : no}
        </span>
        <span className="d3-zakryta__text">
          <b>{kratko}</b>
          <span>ответ числом</span>
        </span>
        <span className="d3-zvezdy" aria-label={`Сложность ${uroven} из 3`}>
          {'★'.repeat(uroven)}
        </span>
        <span className="stk-shevron" aria-hidden="true" />
      </summary>
      <div className="d3-opornaya__telo">
        <div className="d3-opornaya__risunok">{risunok}</div>
        <div className="d3-opornaya__pravo">
          <div className="d3-uslovie" dangerouslySetInnerHTML={{ __html: uslovieHtml }} />
          <label className="trn-pole">
            <span className="stk-podpis">Ваш ответ</span>
            <span className="trn-pole__ryad">
              <AnswerInput
                className="trn-input"
                placeholder="Число"
                value={value}
                state={itog === 'verno' ? 'success' : itog === 'neverno' ? 'error' : 'default'}
                readOnly={itog === 'verno'}
                onChange={(next) => {
                  setValue(next);
                  if (itog === 'neverno') setItog(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && value.trim() !== '') proverit();
                }}
              />
              {itog === 'verno' ? null : (
                <button
                  type="button"
                  className="stk-btn stk-btn--primary stk-btn--lg"
                  disabled={value.trim() === ''}
                  onClick={proverit}
                >
                  Проверить
                </button>
              )}
            </span>
          </label>
          {itog === null ? null : (
            <div
              className={clsx(
                'trn-verdikt',
                itog === 'verno' ? 'trn-verdikt--da' : 'trn-verdikt--net',
              )}
              role="status"
            >
              <span className="trn-verdikt__ico">
                <Ikonka name={itog === 'verno' ? 'da' : 'net'} />
              </span>
              <span className="trn-verdikt__text">
                <b>{itog === 'verno' ? 'Верно' : 'Пока неверно'}</b>
                <span>
                  {itog === 'verno'
                    ? 'Можно переходить к следующей задаче.'
                    : 'Проверьте вычисления или откройте подсказку.'}
                </span>
              </span>
            </div>
          )}
          {podskazka === null || itog === 'verno' ? null : hint ? (
            <div className="d3-vopros" role="note">
              <p className="d3-vopros__zag">
                <Ikonka name="lampa" />{' '}
                <span dangerouslySetInnerHTML={{ __html: podskazka.voprosHtml }} />
              </p>
              <div className="d3-vopros__varianty">
                {podskazka.varianty.map((t, i) => (
                  <button
                    type="button"
                    key={i}
                    className={clsx(
                      'd3-vopros__variant',
                      vybor === i && (i === podskazka.verno ? 'is-da' : 'is-net'),
                    )}
                    aria-pressed={vybor === i}
                    onClick={() => setVybor(i)}
                    dangerouslySetInnerHTML={{ __html: t }}
                  />
                ))}
              </div>
              {vybor === podskazka.verno ? (
                <p
                  className="d3-vopros__vyvod"
                  dangerouslySetInnerHTML={{ __html: podskazka.vyvodHtml }}
                />
              ) : vybor !== null ? (
                <p className="d3-vopros__vyvod">
                  Не совсем. Посмотрите на чертёж и попробуйте ещё раз.
                </p>
              ) : null}
            </div>
          ) : (
            <button type="button" className="trn-podskazka-knopka" onClick={() => setHint(true)}>
              <Ikonka name="lampa" /> Подсказка
            </button>
          )}
          <div className="trn-knopki">
            <button
              type="button"
              className="stk-btn stk-btn--tihaya"
              aria-expanded={reshenie}
              onClick={() => setReshenie(!reshenie)}
            >
              {reshenie ? 'Скрыть решение' : 'Решение по шагам'}
            </button>
          </div>
          {reshenie ? <ShagiResheniya shagi={shagi} /> : null}
        </div>
      </div>
    </details>
  );
}

/* ── Тренажёр ────────────────────────────────────────────────── */

export interface VariantDemo {
  id: string;
  uslovieHtml: string;
  otvet: string;
  podskazkaHtml: string | null;
  shagi: Shag[];
  risunok: ReactNode;
}

export interface ZadachaDemo {
  gruppa: string;
  tipHtml: string;
  /** Три аналога: основная, «Похожая задача», «Работа над ошибками». */
  varianty: VariantDemo[];
}

interface GruppaDemo {
  id: string;
  nazvanie: string;
  znakHtml: string;
  znak: ReactNode;
  ton: Ton;
  tipy: { id: string; nazvanieHtml: string }[];
  resheno: number;
  verno: number;
  povtorit: boolean;
}

const VYBOR: VyborTemLabels = {
  title: 'Выберите темы',
  vse: 'Выбрать все',
  nichego: 'Снять все',
  skolko: 'Сколько задач',
  bezKonca: 'Без конца',
  taymer: 'Таймер',
  sTaymerom: 'С таймером',
  bezTaymera: 'Без таймера',
  bezPodskazok: 'Без подсказок и решений',
  bezPodskazokLead: 'Как на экзамене: решения откроются в итогах',
  nachat: 'Начать тренировку',
  nazad: 'Назад к режимам',
  pusto: 'Выберите хотя бы одну тему',
  itog: (tipov, zadach, taymer) =>
    `Типов: ${tipov} · задач: ${zadach ?? 'без конца'}${taymer ? ' · с таймером' : ''}`,
};

const EKRAN: EkranZadachiLabels = {
  otvet: 'Ваш ответ',
  placeholder: 'Число',
  proverit: 'Проверить',
  podskazka: 'Подсказка',
  reshenie: 'Решение',
  skrytReshenie: 'Скрыть решение',
  pohozhaya: 'Похожая задача',
  dalshe: 'Дальше',
  itogi: 'К итогам',
  verno: 'Верно',
  vernoLead: 'Так держать.',
  neverno: 'Пока неверно',
  nevernoLead: 'Попробуйте ещё раз или откройте решение.',
  sRazborom: 'Разобрали вместе',
  sRazboromLead: 'Задача засчитана как решённая с подсказкой.',
  shagi: 'Решение по шагам',
  bezPodskazok: 'Решение откроется в итогах.',
  iz: 'из',
};

const ITOGI: ItogiLabels = {
  title: 'Тренировка окончена',
  lead: 'Ниже — что получилось и что стоит повторить.',
  poTipam: 'По темам',
  rabota: 'Работа над ошибками',
  rabotaLead: 'Дадим новые задачи тех же типов, где была ошибка, — не те же самые.',
  eshcheRaz: 'Ещё раз',
  kVyboru: 'К выбору тем',
  zadachi: 'Задачи',
  razbor: 'Показать решение',
  skrytRazbor: 'Скрыть решение',
  otmetki: {
    right: 'Верно',
    wrong: 'Неверно',
    hinted: 'С подсказкой',
    skipped: 'Пропущено',
  },
};

type Etap = 'start' | 'vybor' | 'zadacha' | 'itogi';

interface Hod {
  /** Какой аналог показан. */
  variant: number;
  value: string;
  sostoyanie: SostoyanieZadachi;
  podskazka: boolean;
  reshenie: boolean;
  oshibalsya: boolean;
}

const NOVYY_HOD = (variant: number): Hod => ({
  variant,
  value: '',
  sostoyanie: 'vvod',
  podskazka: false,
  reshenie: false,
  oshibalsya: false,
});

export function Demo3Trenazher({
  gruppy,
  zadachi,
}: {
  gruppy: GruppaDemo[];
  zadachi: ZadachaDemo[];
}) {
  const [etap, setEtap] = useState<Etap>('start');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(gruppy.flatMap((g) => g.tipy.map((t) => t.id))),
  );
  const [count, setCount] = useState<number | null>(3);
  const [timer, setTimer] = useState(false);
  const [bez, setBez] = useState(false);
  /* Какие задачи идут в сессии: все или только с ошибкой (работа над ошибками). */
  const [nabor, setNabor] = useState<number[]>(zadachi.map((_, i) => i));
  const [index, setIndex] = useState(0);
  const [hody, setHody] = useState<Hod[]>([]);

  function nachat(indices: number[], variant: number) {
    setNabor(indices);
    setHody(indices.map(() => NOVYY_HOD(variant)));
    setIndex(0);
    setEtap('zadacha');
  }

  const strokiProgressa = gruppy.map((g) => ({
    id: g.id,
    nazvanie: g.nazvanie,
    znakHtml: g.znakHtml,
    znak: g.znak,
    ton: g.ton,
    verno: g.verno,
    vsego: g.resheno,
    ...(g.povtorit ? { metka: 'Стоит повторить' } : {}),
  }));

  if (etap === 'start') {
    return (
      <StartRezhimy
        title="С чего начнём?"
        rezhimy={[
          {
            id: 'mix',
            ikonka: 'mix',
            zag: 'Все типы вперемешку',
            lead: 'Как на экзамене: не знаете заранее, какая фигура попадётся',
          },
          {
            id: 'temy',
            ikonka: 'temy',
            zag: 'Выбрать темы',
            lead: 'Отработать одну группу или несколько типов',
          },
          {
            id: 'oshibki',
            ikonka: 'oshibki',
            zag: 'Работа над ошибками',
            lead: 'Новые задачи тех типов, где вы ошибались: 2 темы ждут',
            warm: true,
          },
        ]}
        onPick={(id) => {
          if (id === 'temy') {
            setEtap('vybor');
          } else {
            nachat(
              zadachi.map((_, i) => i),
              id === 'oshibki' ? 2 : 0,
            );
          }
        }}
        dop={
          <ProgressPanel
            stroki={strokiProgressa}
            resheno={gruppy.reduce((s, g) => s + g.resheno, 0)}
            verno={gruppy.reduce((s, g) => s + g.verno, 0)}
            onReset={() => {}}
            labels={{
              title: 'Мой прогресс',
              pusto: 'Здесь появится прогресс по темам.',
              sbros: 'Сбросить прогресс',
              sbrosVopros: 'Прогресс по заданию №3 будет удалён.',
              otmena: 'Отмена',
            }}
          />
        }
      />
    );
  }

  if (etap === 'vybor') {
    return (
      <VyborTem
        gruppy={gruppy}
        selected={selected}
        onSelected={setSelected}
        counts={[3, 5, 10, 20, null]}
        count={count}
        onCount={setCount}
        timer={timer}
        onTimer={setTimer}
        bezPodskazok={bez}
        onBezPodskazok={setBez}
        onStart={() =>
          nachat(
            zadachi.map((_, i) => i),
            0,
          )
        }
        onBack={() => setEtap('start')}
        labels={VYBOR}
      />
    );
  }

  if (etap === 'zadacha') {
    const z = zadachi[nabor[index] ?? 0];
    const hod = hody[index];
    if (z === undefined || hod === undefined) {
      return null;
    }
    const v = z.varianty[hod.variant % z.varianty.length];
    if (v === undefined) {
      return null;
    }
    const set = (patch: Partial<Hod>) =>
      setHody(hody.map((h, i) => (i === index ? { ...h, ...patch } : h)));
    const last = index === nabor.length - 1;
    return (
      <EkranZadachi
        taskId={v.id}
        nomer={index + 1}
        vsego={nabor.length}
        tipHtml={z.tipHtml}
        risunok={v.risunok}
        uslovieHtml={v.uslovieHtml}
        value={hod.value}
        onValue={(value) =>
          set({ value, sostoyanie: hod.sostoyanie === 'neverno' ? 'vvod' : hod.sostoyanie })
        }
        sostoyanie={hod.sostoyanie}
        onCheck={() => {
          if (sameAnswer(hod.value, v.otvet)) {
            set({ sostoyanie: hod.podskazka || hod.reshenie ? 'razbor' : 'verno' });
          } else {
            set({ sostoyanie: 'neverno', oshibalsya: true });
          }
        }}
        podskazka={
          bez || v.podskazkaHtml === null
            ? null
            : { html: v.podskazkaHtml, open: hod.podskazka, onOpen: () => set({ podskazka: true }) }
        }
        reshenie={
          bez
            ? null
            : {
                shagi: v.shagi,
                open: hod.reshenie,
                onToggle: () => set({ reshenie: !hod.reshenie }),
              }
        }
        onPohozhaya={() => set({ ...NOVYY_HOD(hod.variant + 1), oshibalsya: hod.oshibalsya })}
        onNext={() => (last ? setEtap('itogi') : setIndex(index + 1))}
        last={last}
        bezPodskazok={bez}
        labels={EKRAN}
      />
    );
  }

  /* Итоги. */
  const otmetka = (h: Hod): Otmetka =>
    h.sostoyanie === 'verno' && !h.oshibalsya
      ? 'right'
      : h.sostoyanie === 'razbor' || (h.sostoyanie === 'verno' && h.oshibalsya)
        ? 'hinted'
        : h.sostoyanie === 'neverno'
          ? 'wrong'
          : 'skipped';
  const marks = hody.map(otmetka);
  const sOshibkoy = nabor.filter((_, i) => marks[i] !== 'right');
  const stroki = gruppy
    .map((g) => {
      const svoi = nabor
        .map((zi, i) => ({ zi, i }))
        .filter(({ zi }) => zadachi[zi]?.gruppa === g.id);
      const verno = svoi.filter(({ i }) => marks[i] === 'right').length;
      return {
        id: g.id,
        nazvanie: g.nazvanie,
        znakHtml: g.znakHtml,
        znak: g.znak,
        ton: g.ton,
        verno,
        vsego: svoi.length,
        ...(svoi.length > 0 && verno < svoi.length ? { metka: 'Стоит повторить' } : {}),
      };
    })
    .filter((s) => s.vsego > 0);
  return (
    <ItogiSessii
      verno={marks.filter((m) => m === 'right').length}
      vsego={nabor.length}
      stroki={stroki}
      zadachi={nabor.map((zi, i) => {
        const z = zadachi[zi];
        const h = hody[i];
        const v = z?.varianty[(h?.variant ?? 0) % (z?.varianty.length ?? 1)];
        return {
          kindHtml: z?.tipHtml ?? '',
          uslovieHtml: v?.uslovieHtml ?? '',
          mark: marks[i] ?? 'skipped',
          razbor: () => (
            <>
              <ShagiResheniya shagi={v?.shagi ?? []} />
              <p className="kz-otvet">
                Ответ: <b>{v?.otvet}</b>
              </p>
            </>
          ),
        };
      })}
      onRabota={sOshibkoy.length === 0 ? undefined : () => nachat(sOshibkoy, 2)}
      onEshcheRaz={() =>
        nachat(
          zadachi.map((_, i) => i),
          1,
        )
      }
      onVybor={() => setEtap('start')}
      labels={ITOGI}
    />
  );
}
