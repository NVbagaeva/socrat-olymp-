'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Details, Input, Select } from '@/components/ui';
import { GENERATOR_11, MARSHRUTY_11, SHEET_11 } from '@/content/repetitory11';
import { plural } from '@/lib/plural';
import { TRENAZHER_11, UROVNI_11, VARIANT_EGE_11 } from '@/content/zadanie11';
import {
  BLOKI_LISTA,
  DZ_MAX,
  DZ_PO_UMOLCHANIYU,
  type BlokLista,
  type Chast,
  type ListZadacha,
  type SheetParams11,
  type SobrannyyList,
} from '@/lib/zadanie11/sheet11';
import type {
  Istochnik,
  PodtipInfo,
  RazdelInfo,
  UslovieBanka,
} from '@/lib/zadanie11/trenazher/sessiya';
import type { Level, SectionId } from '@/lib/zadanie11/types';
import { BLOKI } from '@/lib/zadanie11/prep/bloki';
import { IkonkaRazdela, Piktogramma, Zvezdy } from './Piktogrammy';

/** Названия опорных блоков по идентификатору — для состава готового урока. */
const BLOKI_NAZVANIYA: Record<string, string> = Object.fromEntries(
  BLOKI.map((b) => [b.id, b.nazvanie]),
);

type Preset = 'ege' | 'urok' | 'marshrut' | 'svoy';
type Vkladka = 'uchenik' | 'uchitel' | 'dz';

/** Блоки листа по пресету: вариант ЕГЭ — одни задачи, урок — весь рабочий лист. */
const BLOKI_PRESETA: Record<Exclude<Preset, 'svoy' | 'marshrut'>, readonly BlokLista[]> = {
  ege: ['zadachi'],
  urok: BLOKI_LISTA,
};

/** Части листа в порядке блоков — для предпросмотра. */
function chastiPoPoryadku(bloki: readonly BlokLista[]): Chast[] {
  return bloki.filter((b): b is Chast => b !== 'znat' && b !== 'dz');
}

const IKONKA_ISTOCHNIKA: Record<Istochnik, string> = { bank: 'doc', mix: 'layers', new: 'sparkle' };

/** Состав «вариант ЕГЭ»: по задаче из каждого раздела, кроме разминки. */
function sostavEge(): Record<string, number> {
  return Object.fromEntries(VARIANT_EGE_11.map((id) => [id, 1]));
}

/**
 * Состав «урок по разделу»: n задач одного раздела от ★ к ★★★. Типов
 * больше, чем задач, — берём равномерно по уровням; меньше — по
 * несколько задач на тип, лишние достаются первым.
 */
function sostavUroka(podtipy: PodtipInfo[], n: number): Record<string, number> {
  const tipy = [...podtipy].sort((a, b) => a.level - b.level);
  const out: Record<string, number> = {};
  if (tipy.length === 0) return out;
  if (tipy.length >= n) {
    for (let i = 0; i < n; i += 1) {
      const idx = n === 1 ? 0 : Math.round((i * (tipy.length - 1)) / (n - 1));
      const id = tipy[idx]?.id ?? '';
      out[id] = (out[id] ?? 0) + 1;
    }
  } else {
    tipy.forEach((p, i) => {
      out[p.id] = Math.floor(n / tipy.length) + (i < n % tipy.length ? 1 : 0);
    });
  }
  return out;
}

function sluchaynyySeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <span className="z11-stepper">
      <button
        type="button"
        aria-label={`${label}: меньше`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <output aria-label={label}>{value}</output>
      <button
        type="button"
        aria-label={`${label}: больше`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </span>
  );
}

/**
 * Вкладка «Генератор» задания №11 (макет generator.png).
 *
 * Слева: откуда брать задачи, режим (задания для отработки / K
 * вариантов), состав по разделам с раскрытием до подтипов и числом
 * задач на подтип, сложность, seed. Справа — превью листа А4:
 * «Лист ученика | Лист учителя», переключатель вариантов, пометки
 * «банк» / «новая», замена одной задачи, «Скачать PDF» и «Скачать
 * всё одним файлом». Лист собирается движком в браузере, адрес
 * печати повторяет тот же лист (seed и замены — в адресе).
 */
export function Generator11({
  razdely,
  bank,
  base,
}: {
  razdely: RazdelInfo[];
  bank: UslovieBanka[];
  base: string;
}) {
  const [istochnik, setIstochnik] = useState<Istochnik>('mix');
  const [rezhim, setRezhim] = useState<'otrabotka' | 'komplekt'>('komplekt');
  /* Готовый урок (маршрут): номер; выбирается пресетом или адресом ?urok=N. */
  const [marshrut, setMarshrut] = useState(1);
  const [variants, setVariants] = useState(4);
  const [preset, setPreset] = useState<Preset>('ege');
  const [urokRazdel, setUrokRazdel] = useState<SectionId>('PR');
  const [urokN, setUrokN] = useState(6);
  const [sostav, setSostav] = useState<Record<string, number>>(sostavEge);
  /* Блоки листа: порядок — всех шести, включённые — отдельно; «Задачи» всегда. */
  const [poryadok, setPoryadok] = useState<BlokLista[]>([...BLOKI_LISTA]);
  const [vkl, setVkl] = useState<Set<BlokLista>>(() => new Set(BLOKI_PRESETA.ege));
  const [dzN, setDzN] = useState(DZ_PO_UMOLCHANIYU);
  /* Поле для решения у ученика: по умолчанию — у урока, не у варианта ЕГЭ. */
  const [mesto, setMesto] = useState(false);
  /* Фильтр списка типов в «Своём составе»: что показывать, не что брать. */
  const [uroven, setUroven] = useState<0 | Level>(0);
  const [otkryty, setOtkryty] = useState<Set<SectionId>>(new Set());
  const [seedInput, setSeedInput] = useState('');
  const [params, setParams] = useState<SheetParams11 | null>(null);
  const [list, setList] = useState<SobrannyyList | null>(null);
  const [vkladka, setVkladka] = useState<Vkladka>('uchenik');
  const [variant, setVariant] = useState(0);
  const [zagruzka, setZagruzka] = useState(false);
  /* Адрес листа печати: тот же лист, что в превью (seed и замены). */
  const [query, setQuery] = useState('');

  const vidimye = razdely.filter((r) => !(istochnik === 'bank' && r.id === 'RZ'));
  const vse = useMemo(() => razdely.flatMap((r) => r.podtipy), [razdely]);
  const podhodit = (level: Level) => uroven === 0 || level === uroven;
  const vybrano = vse.filter(
    (p) => (sostav[p.id] ?? 0) > 0 && !(istochnik === 'bank' && p.section === 'RZ'),
  );
  const gotovyy = MARSHRUTY_11.find((m) => m.no === marshrut) ?? MARSHRUTY_11[0];
  const vMarshrute =
    gotovyy === undefined ? 0 : gotovyy.opornye.length + gotovyy.bank.length + gotovyy.novye.length;
  const vsegoZadach =
    preset === 'marshrut' ? vMarshrute : vybrano.reduce((s, p) => s + (sostav[p.id] ?? 0), 0);
  const bloki = poryadok.filter((b) => b === 'zadachi' || vkl.has(b));

  function perelozhit(b: BlokLista, shag: -1 | 1) {
    setPoryadok((prev) => {
      const i = prev.indexOf(b);
      const j = i + shag;
      if (i < 0 || j < 0 || j >= prev.length || prev[j] === 'dz') return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j] as BlokLista, next[i] as BlokLista];
      return next;
    });
  }

  function vklyuchit(b: BlokLista, da: boolean) {
    setVkl((prev) => {
      const next = new Set(prev);
      if (da) next.add(b);
      else next.delete(b);
      return next;
    });
  }

  function postavit(id: string, n: number) {
    setSostav((prev) => ({ ...prev, [id]: n }));
  }

  function vybratPreset(next: Preset) {
    setPreset(next);
    if (next === 'marshrut') setRezhim('otrabotka');
    if (next === 'ege') {
      setSostav(sostavEge());
      setRezhim('komplekt');
      setVkl(new Set(BLOKI_PRESETA.ege));
      setMesto(false);
    } else if (next === 'urok') {
      setSostav(sostavUroka(razdely.find((r) => r.id === urokRazdel)?.podtipy ?? [], urokN));
      setRezhim('otrabotka');
      setVkl(new Set(BLOKI_PRESETA.urok));
      setMesto(true);
    }
  }

  function urok(sec: SectionId, n: number) {
    setUrokRazdel(sec);
    setUrokN(n);
    setSostav(sostavUroka(razdely.find((r) => r.id === sec)?.podtipy ?? [], n));
  }

  async function sobrat(p: SheetParams11) {
    setZagruzka(true);
    try {
      const { sobratList, sheetQuery11 } = await import('@/lib/zadanie11/sheet11');
      setList(sobratList(p, bank));
      setParams(p);
      setQuery(sheetQuery11(p));
    } finally {
      setZagruzka(false);
    }
  }

  function sgenerirovat(urok?: number) {
    const seed = seedInput.trim() === '' ? sluchaynyySeed() : seedInput.trim();
    setVariant(0);
    const gotov = urok !== undefined || preset === 'marshrut';
    void sobrat({
      rezhim: gotov ? 'marshrut' : rezhim,
      istochnik,
      sostav: vybrano.map((p) => ({ id: p.id, n: sostav[p.id] ?? 1 })),
      variants: gotov || rezhim === 'komplekt' ? variants : 1,
      seed,
      zameny: {},
      marshrut: urok ?? marshrut,
      theme: 'color',
      bloki,
      dz: dzN,
      mesto,
    });
  }

  /* Адрес с «Для репетиторов»: ?urok=N — готовый урок, сразу собранный;
     ?razdel=ID — пресет «Урок по разделу» с этим разделом. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const n = Number(q.get('urok'));
    const sec = q.get('razdel');
    if (MARSHRUTY_11.some((m) => m.no === n)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- состояние из адреса при открытии
      setPreset('marshrut');
      setMarshrut(n);
      setRezhim('otrabotka');
      setVariants(1);
      sgenerirovat(n);
    } else if (sec !== null && razdely.some((r) => r.id === sec)) {
      setPreset('urok');
      setRezhim('otrabotka');
      setVkl(new Set(BLOKI_PRESETA.urok));
      setMesto(true);
      urok(sec as SectionId, urokN);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только при открытии
  }, []);

  function zamenit(pos: string) {
    if (params === null) return;
    void sobrat({ ...params, zameny: { ...params.zameny, [pos]: (params.zameny[pos] ?? 0) + 1 } });
  }

  const zadachi = list?.poVariantam[variant] ?? [];
  const uchitel = vkladka === 'uchitel';
  /* Части на странице предпросмотра: домашняя работа — на своей вкладке. */
  const chasti =
    params === null
      ? []
      : vkladka === 'dz'
        ? (['dz'] as Chast[])
        : params.rezhim === 'marshrut'
          ? (['zadachi'] as Chast[])
          : chastiPoPoryadku(params.bloki);
  const estDz = params?.bloki.includes('dz') ?? false;
  const primer = zadachi.find((z) => z.chast === 'primer');
  const sPolosami = chasti.length > 1 || vkladka === 'dz' || (list?.znat.length ?? 0) > 0;

  function Zadacha({ z }: { z: ListZadacha }) {
    return (
      <li className="z11-a4__task">
        <span className="z11-a4__no">{z.no}</span>
        <div className="z11-a4__body">
          <div dangerouslySetInnerHTML={{ __html: z.questionHtml }} />
          {!uchitel && params?.mesto === true && z.poz.vid !== 'mikro' && z.chast !== 'razminka' ? (
            <div
              className={clsx('z11-a4__mesto', z.chast === 'oshibka' && 'z11-a4__mesto--malo')}
              aria-hidden="true"
            />
          ) : null}
          {uchitel ? (
            <div className="z11-a4__reshenie">
              <div dangerouslySetInnerHTML={{ __html: z.solutionHtml }} />
              <p className="z11-a4__otvet">
                {GENERATOR_11.otvet}: <b dangerouslySetInnerHTML={{ __html: z.answerHtml }} />
              </p>
            </div>
          ) : null}
        </div>
        <span className={clsx('z11-a4__badge', `z11-a4__badge--${z.poz.vid}`)}>
          {SHEET_11.bejdzh[z.poz.vid]}
        </span>
        <button
          type="button"
          className="z11-a4__zamena"
          aria-label={`${GENERATOR_11.zamenit} ${z.no}`}
          title={GENERATOR_11.zamenit}
          disabled={zagruzka}
          onClick={() => zamenit(z.pos)}
        >
          <Piktogramma name="cycle" />
        </button>
      </li>
    );
  }

  return (
    <div className="z11-gen">
      <div className="z11-gen__side">
        <section className="z11-card z11-gen__blok">
          <h2 className="z11-gen__h">
            <Piktogramma name="layers" />
            {GENERATOR_11.otkuda}
          </h2>
          <div className="z11-istochnik" role="radiogroup" aria-label={GENERATOR_11.otkuda}>
            {TRENAZHER_11.istochniki.map((i) => (
              <button
                key={i.id}
                type="button"
                role="radio"
                aria-checked={istochnik === i.id}
                className={clsx('z11-istochnik__btn', istochnik === i.id && 'is-active')}
                onClick={() => setIstochnik(i.id)}
              >
                <Piktogramma name={IKONKA_ISTOCHNIKA[i.id]} />
                {i.label}
              </button>
            ))}
          </div>
          <p className="z11-istochnik__note">
            {TRENAZHER_11.istochniki.find((i) => i.id === istochnik)?.note}
          </p>
        </section>

        <section className="z11-card z11-gen__blok">
          <h2 className="z11-gen__h">
            <Piktogramma name="gear" />
            {GENERATOR_11.rezhim}
          </h2>
          {preset === 'marshrut' ? (
            <>
              <p className="z11-istochnik__note">{GENERATOR_11.marshrutRezhim}</p>
              <div className="z11-vybrannaya__row">
                <span>{GENERATOR_11.variantov}</span>
                <Stepper
                  value={variants}
                  min={1}
                  max={8}
                  onChange={setVariants}
                  label={GENERATOR_11.variantov}
                />
              </div>
            </>
          ) : null}
          <div
            className={clsx('z11-gen__rezhimy', preset === 'marshrut' && 'is-hidden')}
            role="radiogroup"
            aria-label={GENERATOR_11.rezhim}
          >
            {GENERATOR_11.rezhimy.map((r) => (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={rezhim === r.id}
                className={clsx('z11-gen__rezhim', rezhim === r.id && 'is-active')}
                onClick={() => setRezhim(r.id)}
              >
                <span className="z11-gen__radio" aria-hidden="true" />
                <span>
                  <b>{r.title}</b>
                  <span className="z11-gen__rezhim-lead">{r.lead}</span>
                </span>
              </button>
            ))}
          </div>
          {rezhim === 'komplekt' && preset !== 'marshrut' ? (
            <div className="z11-vybrannaya__row">
              <span>{GENERATOR_11.variantov}</span>
              <Stepper
                value={variants}
                min={1}
                max={8}
                onChange={setVariants}
                label={GENERATOR_11.variantov}
              />
            </div>
          ) : null}
        </section>

        <section className="z11-card z11-gen__blok">
          <h2 className="z11-gen__h">
            <Piktogramma name="doc" />
            {GENERATOR_11.sostav}
          </h2>
          <div className="z11-gen__presety" role="radiogroup" aria-label={GENERATOR_11.sostav}>
            {(['ege', 'urok', 'marshrut', 'svoy'] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={preset === k}
                className={clsx('z11-gen__preset', preset === k && 'is-active')}
                onClick={() => vybratPreset(k)}
              >
                <b>{GENERATOR_11.presety[k].title}</b>
                <span>{GENERATOR_11.presety[k].note}</span>
              </button>
            ))}
          </div>
          {preset === 'ege' ? <p className="z11-istochnik__note">{GENERATOR_11.egeLead}</p> : null}
          {preset === 'marshrut' ? (
            <div className="z11-gen__urok">
              <label className="z11-gen__urok-label" htmlFor="z11-gen-marshrut">
                {GENERATOR_11.urokGotovyy}
              </label>
              <Select
                id="z11-gen-marshrut"
                value={String(marshrut)}
                onChange={(e) => setMarshrut(Number(e.target.value))}
              >
                {MARSHRUTY_11.map((m) => (
                  <option key={m.no} value={String(m.no)}>
                    {GENERATOR_11.urokNo(m.no)}. {m.title}
                  </option>
                ))}
              </Select>
              <p className="z11-istochnik__note">{GENERATOR_11.marshrutLead}</p>
              {gotovyy === undefined ? null : (
                <ul className="z11-gen__etapy">
                  {(['opornye', 'bank', 'novye'] as const).map((k) => (
                    <li key={k}>
                      <b>{SHEET_11.bloki[k]}</b>
                      <span>
                        {k === 'opornye'
                          ? [...new Set(gotovyy.opornye)]
                              .map((id) => BLOKI_NAZVANIYA[id] ?? id)
                              .join(' · ')
                          : gotovyy[k]
                              .map((id) => vse.find((p) => p.id === id)?.title ?? id)
                              .join(' · ')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
          {preset === 'urok' ? (
            <div className="z11-gen__urok">
              <label className="z11-gen__urok-label" htmlFor="z11-gen-urok-razdel">
                {GENERATOR_11.razdel}
              </label>
              <Select
                id="z11-gen-urok-razdel"
                value={urokRazdel}
                onChange={(e) => urok(e.target.value as SectionId, urokN)}
              >
                {vidimye.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nazvanie}
                  </option>
                ))}
              </Select>
              <div className="z11-vybrannaya__row">
                <span>{GENERATOR_11.zadachVUroke}</span>
                <Stepper
                  value={urokN}
                  min={2}
                  max={12}
                  onChange={(n) => urok(urokRazdel, n)}
                  label={GENERATOR_11.zadachVUroke}
                />
              </div>
              <p className="z11-istochnik__note">{GENERATOR_11.urokLead}</p>
            </div>
          ) : null}
          {preset !== 'svoy' && preset !== 'marshrut' ? (
            <ul className="z11-gen__vybrannye">
              {vybrano.map((p) => (
                <li key={p.id} className="z11-gen__vybrannyy" title={p.kod}>
                  <IkonkaRazdela section={p.section} className="z11-gen__vybrannyy-ikonka" />
                  <span className="z11-gen__vybrannyy-name">{p.title}</span>
                  <Zvezdy level={p.level} section={p.section} />
                  <b className="z11-gen__vybrannyy-n">×{sostav[p.id] ?? 0}</b>
                </li>
              ))}
            </ul>
          ) : null}
          <ul className={clsx('z11-gen__sostav', preset !== 'svoy' && 'is-hidden')}>
            {vidimye.map((r) => {
              const podtipy = r.podtipy.filter((p) => podhodit(p.level));
              if (podtipy.length === 0) return null;
              const summa = podtipy.reduce((s, p) => s + (sostav[p.id] ?? 0), 0);
              const otkryt = otkryty.has(r.id);
              return (
                <li key={r.id} className="z11-gen__razdel">
                  <div className="z11-gen__razdel-head">
                    <Checkbox
                      checked={summa > 0}
                      onChange={(e) => {
                        const next = { ...sostav };
                        for (const p of r.podtipy) next[p.id] = 0;
                        const first = podtipy[0];
                        if (e.target.checked && first !== undefined) next[first.id] = 1;
                        setSostav(next);
                      }}
                    >
                      <span className="sr-only">{r.nazvanie}</span>
                    </Checkbox>
                    <button
                      type="button"
                      className="z11-gen__razdel-toggle"
                      aria-expanded={otkryt}
                      onClick={() =>
                        setOtkryty((prev) => {
                          const s = new Set(prev);
                          if (s.has(r.id)) s.delete(r.id);
                          else s.add(r.id);
                          return s;
                        })
                      }
                    >
                      <IkonkaRazdela section={r.id} className="z11-akk__ikonka" />
                      <span className="z11-akk__name">{r.nazvanie}</span>
                      <span className="z11-gen__summa">
                        {summa} {plural(summa, ...GENERATOR_11.zadach)}
                      </span>
                      <Piktogramma
                        name="chevron"
                        className={clsx('z11-akk__chevron', otkryt && 'is-open')}
                      />
                    </button>
                  </div>
                  {otkryt ? (
                    <ul className="z11-gen__podtipy">
                      {podtipy.map((p) => (
                        <li key={p.id} className="z11-gen__podtip" title={p.kod}>
                          <span className="z11-gen__podtip-name">{p.title}</span>
                          <span className="z11-akk__bank">
                            {istochnik === 'new'
                              ? TRENAZHER_11.generiruyutsya
                              : TRENAZHER_11.vBanke(p.vBanke)}
                          </span>
                          <Zvezdy level={p.level} section={p.section} />
                          <Stepper
                            value={sostav[p.id] ?? 0}
                            min={0}
                            max={10}
                            onChange={(n) => postavit(p.id, n)}
                            label={p.title}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="z11-gen__itogo">
            {GENERATOR_11.itogo(vsegoZadach, preset === 'marshrut' || rezhim === 'komplekt')}
          </p>
        </section>

        <section className="z11-card z11-gen__blok">
          <h2 className="z11-gen__h">
            <Piktogramma name="chart" />
            {GENERATOR_11.slozhnost}
          </h2>
          {preset === 'svoy' ? (
            <>
              <div className="z11-gen__blok-row">
                <span className="z11-gen__urok-label">{GENERATOR_11.spisok}:</span>
                <div className="z11-gen__urovni" role="radiogroup" aria-label={GENERATOR_11.spisok}>
                  {([0, 1, 2, 3] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      role="radio"
                      aria-checked={uroven === u}
                      className={clsx('z11-gen__uroven', uroven === u && 'is-active')}
                      onClick={() => setUroven(u)}
                    >
                      {u === 0 ? GENERATOR_11.vse : <Zvezdy level={u} />}
                    </button>
                  ))}
                </div>
              </div>
              <p className="z11-uroven__note">{GENERATOR_11.filtrNote}</p>
            </>
          ) : null}
          <p className="z11-uroven__note">{TRENAZHER_11.urovenNote}</p>
          <Details title={GENERATOR_11.slozhnostTablitsa} className="z11-urovni-tab">
            <ul className="z11-urovni">
              {razdely.map((r) => (
                <li key={r.id} className="z11-urovni__razdel">
                  <span className="z11-urovni__name">{r.nazvanie}</span>
                  <ul className="z11-urovni__list">
                    {UROVNI_11[r.id].map((t, i) =>
                      t === '' ? null : (
                        <li key={i}>
                          <span className="z11-urovni__zv">{'★'.repeat(i + 1)}</span> {t}
                        </li>
                      ),
                    )}
                  </ul>
                </li>
              ))}
            </ul>
          </Details>
        </section>

        <section className="z11-card z11-gen__blok">
          <h2 className="z11-gen__h">
            <Piktogramma name="table" />
            {GENERATOR_11.blokiLista}
          </h2>
          <p className="z11-istochnik__note">
            {preset === 'marshrut' ? GENERATOR_11.blokiMarshruta : GENERATOR_11.blokiLead}
          </p>
          <ol className={clsx('z11-gen__bloki', preset === 'marshrut' && 'is-hidden')}>
            {poryadok.map((b, i) => {
              const na = b === 'zadachi' || vkl.has(b);
              const fiks = b === 'dz';
              return (
                <li key={b} className={clsx('z11-gen__blok-item', !na && 'is-off')}>
                  {b === 'zadachi' ? (
                    /* «Задачи» на листе всегда: вместо галочки — пометка. */
                    <span className="check check--box z11-gen__fiks">
                      <span className="z11-gen__fiks-mark" aria-hidden="true">
                        <Piktogramma name="check" />
                      </span>
                      <span className="z11-gen__blok-name">
                        <b>{GENERATOR_11.bloki[b].title}</b>
                        <span>{GENERATOR_11.bloki[b].note}</span>
                      </span>
                    </span>
                  ) : (
                    <Checkbox checked={na} onChange={(e) => vklyuchit(b, e.target.checked)}>
                      <span className="z11-gen__blok-name">
                        <b>{GENERATOR_11.bloki[b].title}</b>
                        <span>{GENERATOR_11.bloki[b].note}</span>
                      </span>
                    </Checkbox>
                  )}
                  {fiks ? (
                    na ? (
                      <Stepper
                        value={dzN}
                        min={1}
                        max={DZ_MAX}
                        onChange={setDzN}
                        label={GENERATOR_11.zadachDz}
                      />
                    ) : null
                  ) : (
                    <span className="z11-gen__strelki">
                      <button
                        type="button"
                        aria-label={`${GENERATOR_11.bloki[b].title}: ${GENERATOR_11.vyshe}`}
                        disabled={i === 0}
                        onClick={() => perelozhit(b, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`${GENERATOR_11.bloki[b].title}: ${GENERATOR_11.nizhe}`}
                        disabled={poryadok[i + 1] === undefined || poryadok[i + 1] === 'dz'}
                        onClick={() => perelozhit(b, 1)}
                      >
                        ↓
                      </button>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          <Checkbox
            className="z11-gen__mesto"
            checked={mesto}
            onChange={(e) => setMesto(e.target.checked)}
          >
            <span className="z11-gen__blok-name">
              <b>{GENERATOR_11.mesto}</b>
              <span>{GENERATOR_11.mestoNote}</span>
            </span>
          </Checkbox>
        </section>

        <Details title={GENERATOR_11.dopolnitelno} className="z11-gen__dop">
          <label className="z11-gen__urok-label" htmlFor="z11-gen-seed">
            {GENERATOR_11.kodLista}
          </label>
          <Input
            id="z11-gen-seed"
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            placeholder={params?.seed ?? ''}
            autoComplete="off"
            spellCheck={false}
          />
          <p className="z11-istochnik__note">{GENERATOR_11.kodListaLead}</p>
        </Details>

        <Button
          className="z11-gen__go"
          size="lg"
          disabled={vsegoZadach === 0 || zagruzka}
          onClick={() => sgenerirovat()}
        >
          <Piktogramma name="play" />
          {zagruzka ? GENERATOR_11.gotovim : GENERATOR_11.sobrat}
        </Button>
      </div>

      <section className="z11-gen__preview" aria-label="Лист">
        <div className="z11-gen__toolbar">
          <div className="z11-gen__tabs" role="tablist">
            {(['uchenik', 'uchitel', ...(estDz ? (['dz'] as const) : [])] as Vkladka[]).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={vkladka === v}
                className={clsx('z11-gen__tab', vkladka === v && 'is-active')}
                onClick={() => setVkladka(v)}
              >
                {v === 'uchenik'
                  ? GENERATOR_11.listUchenika
                  : v === 'uchitel'
                    ? GENERATOR_11.listUchitelya
                    : GENERATOR_11.listDz}
              </button>
            ))}
          </div>
          {list !== null && list.poVariantam.length > 1 ? (
            <div className="z11-gen__varianty">
              <span>{GENERATOR_11.variant}</span>
              {list.poVariantam.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={clsx('z11-gen__vbtn', variant === i && 'is-active')}
                  aria-pressed={variant === i}
                  onClick={() => setVariant(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          ) : null}
          {params === null || query === '' ? null : (
            <span className="z11-gen__pdf">
              <a
                className="btn btn--secondary btn--sm"
                href={`${base}/pechat/${uchitel ? 'otvety/' : ''}?${query}`}
                target="_blank"
                rel="noopener"
              >
                <Piktogramma name="doc" />
                {GENERATOR_11.pdf}
              </a>
              <a
                className="btn btn--secondary btn--sm"
                href={`${base}/pechat/vse/?${query}`}
                target="_blank"
                rel="noopener"
              >
                <Piktogramma name="doc" />
                {GENERATOR_11.vseOdnim}
              </a>
            </span>
          )}
        </div>

        {list !== null && list.nehvatka > 0 ? (
          <p className="z11-malo z11-gen__nehvatka" role="status">
            {GENERATOR_11.nehvatka(list.nehvatka)}
          </p>
        ) : null}

        <div className="z11-a4">
          {list === null ? (
            <p className="z11-a4__pusto">{GENERATOR_11.pusto}</p>
          ) : (
            <>
              <h3 className="z11-a4__title">
                {SHEET_11.title.chip}. {SHEET_11.title.text}
                {list.poVariantam.length > 1 ? `. Вариант ${variant + 1}` : ''}
                {vkladka === 'dz' ? `. ${SHEET_11.chasti.dz}` : ''}
              </h3>
              <p className="z11-a4__fio">
                {GENERATOR_11.familiya} <span />
              </p>
              {vkladka === 'dz' && !zadachi.some((z) => z.chast === 'dz') ? (
                <p className="z11-a4__pusto">{GENERATOR_11.dzPusto}</p>
              ) : null}
              {(vkladka === 'dz' ? [] : (params?.bloki ?? [])).map((b) => {
                if (b === 'dz') return null;
                if (b === 'znat') {
                  return list.znat.length === 0 ? null : (
                    <section key={b} className="z11-a4__chast">
                      <h4 className="z11-a4__h">{SHEET_11.chasti.znat}</h4>
                      {list.znat.map((k) => (
                        <div
                          key={k.section}
                          className="z11-a4__znat"
                          dangerouslySetInnerHTML={{ __html: k.html }}
                        />
                      ))}
                    </section>
                  );
                }
                if (b === 'primer') {
                  return primer === undefined ? null : (
                    <section key={b} className="z11-a4__chast">
                      <h4 className="z11-a4__h">{SHEET_11.chasti.primer}</h4>
                      <div className="z11-a4__primer">
                        <p className="z11-a4__primer-title">{primer.title}</p>
                        <div dangerouslySetInnerHTML={{ __html: primer.questionHtml }} />
                        <div className="z11-a4__reshenie">
                          <div dangerouslySetInnerHTML={{ __html: primer.solutionHtml }} />
                          <p className="z11-a4__otvet">
                            {GENERATOR_11.otvet}:{' '}
                            <b dangerouslySetInnerHTML={{ __html: primer.answerHtml }} />
                          </p>
                        </div>
                        <button
                          type="button"
                          className="z11-a4__zamena z11-a4__zamena--primer"
                          aria-label={`${GENERATOR_11.zamenit}: ${SHEET_11.chasti.primer}`}
                          title={GENERATOR_11.zamenit}
                          disabled={zagruzka}
                          onClick={() => zamenit(primer.pos)}
                        >
                          <Piktogramma name="cycle" />
                        </button>
                      </div>
                    </section>
                  );
                }
                const svoi = zadachi.filter((z) => z.chast === b);
                if (svoi.length === 0) return null;
                if (params?.rezhim === 'marshrut') {
                  /* Готовый урок: этапы опорные → банк → новые. */
                  return (['opornye', 'bank', 'novye'] as const).map((k) => {
                    const etap = svoi.filter((z) => z.blok === k);
                    return etap.length === 0 ? null : (
                      <section key={k} className="z11-a4__chast">
                        <h4 className="z11-a4__h">{SHEET_11.bloki[k]}</h4>
                        <ol className="z11-a4__list">
                          {etap.map((z) => (
                            <Zadacha key={z.pos} z={z} />
                          ))}
                        </ol>
                      </section>
                    );
                  });
                }
                return (
                  <section key={b} className="z11-a4__chast">
                    {sPolosami ? <h4 className="z11-a4__h">{SHEET_11.chasti[b]}</h4> : null}
                    <ol className="z11-a4__list">
                      {svoi.map((z) => (
                        <Zadacha key={z.pos} z={z} />
                      ))}
                    </ol>
                  </section>
                );
              })}
              {vkladka === 'dz' ? (
                <ol className="z11-a4__list">
                  {zadachi
                    .filter((z) => z.chast === 'dz')
                    .map((z) => (
                      <Zadacha key={z.pos} z={z} />
                    ))}
                </ol>
              ) : null}
              <p className="z11-a4__podpis">{SHEET_11.podpis}</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
