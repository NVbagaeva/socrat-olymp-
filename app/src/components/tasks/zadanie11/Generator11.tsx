'use client';

import { clsx } from 'clsx';
import { useMemo, useState } from 'react';
import { Button, Checkbox, Details, Input, Select } from '@/components/ui';
import { GENERATOR_11, SHEET_11 } from '@/content/repetitory11';
import { plural } from '@/lib/plural';
import { TRENAZHER_11, UROVNI_11, VARIANT_EGE_11 } from '@/content/zadanie11';
import type { SheetParams11, SobrannyyList } from '@/lib/zadanie11/sheet11';
import type {
  Istochnik,
  PodtipInfo,
  RazdelInfo,
  UslovieBanka,
} from '@/lib/zadanie11/trenazher/sessiya';
import type { Level, SectionId } from '@/lib/zadanie11/types';
import { IkonkaRazdela, Piktogramma, Zvezdy } from './Piktogrammy';

type Preset = 'ege' | 'urok' | 'svoy';

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
  const [variants, setVariants] = useState(4);
  const [preset, setPreset] = useState<Preset>('ege');
  const [urokRazdel, setUrokRazdel] = useState<SectionId>('PR');
  const [urokN, setUrokN] = useState(6);
  const [sostav, setSostav] = useState<Record<string, number>>(sostavEge);
  /* Фильтр списка типов в «Своём составе»: что показывать, не что брать. */
  const [uroven, setUroven] = useState<0 | Level>(0);
  const [otkryty, setOtkryty] = useState<Set<SectionId>>(new Set());
  const [seedInput, setSeedInput] = useState('');
  const [params, setParams] = useState<SheetParams11 | null>(null);
  const [list, setList] = useState<SobrannyyList | null>(null);
  const [vkladka, setVkladka] = useState<'uchenik' | 'uchitel'>('uchenik');
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
  const vsegoZadach = vybrano.reduce((s, p) => s + (sostav[p.id] ?? 0), 0);

  function postavit(id: string, n: number) {
    setSostav((prev) => ({ ...prev, [id]: n }));
  }

  function vybratPreset(next: Preset) {
    setPreset(next);
    if (next === 'ege') {
      setSostav(sostavEge());
      setRezhim('komplekt');
    } else if (next === 'urok') {
      setSostav(sostavUroka(razdely.find((r) => r.id === urokRazdel)?.podtipy ?? [], urokN));
      setRezhim('otrabotka');
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

  function sgenerirovat() {
    const seed = seedInput.trim() === '' ? sluchaynyySeed() : seedInput.trim();
    setVariant(0);
    void sobrat({
      rezhim,
      istochnik,
      sostav: vybrano.map((p) => ({ id: p.id, n: sostav[p.id] ?? 1 })),
      variants: rezhim === 'komplekt' ? variants : 1,
      seed,
      zameny: {},
      marshrut: 1,
      theme: 'color',
    });
  }

  function zamenit(pos: string) {
    if (params === null) return;
    void sobrat({ ...params, zameny: { ...params.zameny, [pos]: (params.zameny[pos] ?? 0) + 1 } });
  }

  const zadachi = list?.poVariantam[variant] ?? [];

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
          <div className="z11-gen__rezhimy" role="radiogroup" aria-label={GENERATOR_11.rezhim}>
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
          {rezhim === 'komplekt' ? (
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
            {(['ege', 'urok', 'svoy'] as const).map((k) => (
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
          {preset !== 'svoy' ? (
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
          <p className="z11-gen__itogo">{GENERATOR_11.itogo(vsegoZadach, rezhim === 'komplekt')}</p>
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
          onClick={sgenerirovat}
        >
          <Piktogramma name="play" />
          {zagruzka ? GENERATOR_11.gotovim : GENERATOR_11.sobrat}
        </Button>
      </div>

      <section className="z11-gen__preview" aria-label="Лист">
        <div className="z11-gen__toolbar">
          <div className="z11-gen__tabs" role="tablist">
            {(['uchenik', 'uchitel'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={vkladka === v}
                className={clsx('z11-gen__tab', vkladka === v && 'is-active')}
                onClick={() => setVkladka(v)}
              >
                {v === 'uchenik' ? GENERATOR_11.listUchenika : GENERATOR_11.listUchitelya}
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
                href={`${base}/pechat/${vkladka === 'uchitel' ? 'otvety/' : ''}?${query}`}
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
              </h3>
              <p className="z11-a4__fio">
                {GENERATOR_11.familiya} <span />
              </p>
              <ol className="z11-a4__list">
                {zadachi.map((z) => (
                  <li key={z.pos} className="z11-a4__task">
                    <span className="z11-a4__no">{z.no}</span>
                    <div className="z11-a4__body">
                      <div dangerouslySetInnerHTML={{ __html: z.questionHtml }} />
                      {vkladka === 'uchitel' ? (
                        <div className="z11-a4__reshenie">
                          <div dangerouslySetInnerHTML={{ __html: z.solutionHtml }} />
                          <p className="z11-a4__otvet">
                            {GENERATOR_11.otvet}:{' '}
                            <b dangerouslySetInnerHTML={{ __html: z.answerHtml }} />
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
                ))}
              </ol>
              <p className="z11-a4__podpis">{SHEET_11.podpis}</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
