'use client';

import { clsx } from 'clsx';
import { Fragment, useMemo, useState } from 'react';
import { Button, Checkbox } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { GENERATOR_1, SHEET_1 } from '@/content/repetitory1';
import { TRENAZHER_1 } from '@/content/zadanie1';
import { newKitId } from '@/lib/komplekt';
import { plural } from '@/lib/plural';
import type { ListZadacha, Ramka, SheetParams1, SobrannyyList } from '@/lib/planimetriya/sheet1';
import type { Blok } from '@/lib/planimetriya/stseny/dsl';
import type {
  Istochnik,
  Level,
  RazdelInfo,
  UslovieBanka,
} from '@/lib/planimetriya/trenazher/sessiya';
import { KitBar } from '../generator/KitBar';
import { Piktogramma, Zvezdy } from '../zadanie11/Piktogrammy';
import { IkonkaBloka1 } from './IkonkaBloka1';
import { A4Preview } from '../generator/A4Preview';

const IKONKA_ISTOCHNIKA: Record<Istochnik, string> = { bank: 'doc', mix: 'layers', new: 'sparkle' };

/** Состав по умолчанию: по задаче на блок I–IX — вариант в формате ЕГЭ. */
const PO_UMOLCHANIYU: Record<string, number> = {
  p01: 1,
  p05: 1,
  p13: 1,
  p17: 1,
  p24: 1,
  p35: 1,
  p41: 1,
  p46: 1,
};

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
 * Вкладка «Генератор» задания №1 — генератор №11 (Generator11).
 *
 * Слева: откуда брать задачи, режим (задания для отработки / K
 * вариантов), состав по блокам I–X с числом задач на тип, сложность и
 * рамка теории — «Повторяем» и 0–2 разобранных примера перед задачами
 * каждого блока. Справа — превью листа А4: «Лист ученика | Лист
 * учителя» из одного набора задач, переключатель вариантов, пометки
 * «банк» / «новая», замена одной задачи, комплект и PDF. Лист
 * собирается движком в браузере; адрес печати повторяет тот же лист.
 */
export function Generator1({
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
  const [sostav, setSostav] = useState<Record<string, number>>(PO_UMOLCHANIYU);
  const [uroven, setUroven] = useState<0 | Level>(0);
  const [sRamkoy, setSRamkoy] = useState(true);
  const [primerov, setPrimerov] = useState(2);
  const [otkryty, setOtkryty] = useState<Set<Blok>>(new Set());
  const [kitSeed, setKitSeed] = useState<string | null>(null);
  const [params, setParams] = useState<SheetParams1 | null>(null);
  const [list, setList] = useState<SobrannyyList | null>(null);
  const [ramki, setRamki] = useState<Map<string, Ramka>>(new Map());
  const [vkladka, setVkladka] = useState<'uchenik' | 'uchitel'>('uchenik');
  const [variant, setVariant] = useState(0);
  const [zagruzka, setZagruzka] = useState(false);
  const [query, setQuery] = useState('');

  const vidimye = razdely.filter(
    (r) => !(istochnik === 'bank' && r.podtipy.every((p) => p.vBanke === 0)),
  );
  const vse = useMemo(() => razdely.flatMap((r) => r.podtipy), [razdely]);
  const podhodit = (level: Level) => uroven === 0 || level === uroven;
  const vybrano = vse.filter(
    (p) =>
      (sostav[p.id] ?? 0) > 0 && podhodit(p.level) && !(istochnik === 'bank' && p.vBanke === 0),
  );
  const vsegoZadach = vybrano.reduce((s, p) => s + (sostav[p.id] ?? 0), 0);

  function postavit(id: string, n: number) {
    setSostav((prev) => ({ ...prev, [id]: n }));
  }

  async function sobrat(p: SheetParams1) {
    setZagruzka(true);
    try {
      const { sobratList, sheetQuery1, ramkiLista } = await import('@/lib/planimetriya/sheet1');
      const l = sobratList(p, bank);
      setList(l);
      setRamki(ramkiLista(p, l));
      setParams(p);
      setQuery(sheetQuery1(p));
    } finally {
      setZagruzka(false);
    }
  }

  function sgenerirovat() {
    const seed = kitSeed ?? newKitId();
    setVariant(0);
    void sobrat({
      rezhim,
      istochnik,
      sostav: vybrano.map((p) => ({ id: p.id, n: sostav[p.id] ?? 1 })),
      variants: rezhim === 'komplekt' ? variants : 1,
      seed,
      zameny: {},
      urok: 1,
      kod: '',
      nastroyki: { vykl: [], n: {} },
      theme: 'color',
      ramka: sRamkoy ? primerov : -1,
    });
  }

  function zamenit(pos: string) {
    if (params === null) return;
    void sobrat({ ...params, zameny: { ...params.zameny, [pos]: (params.zameny[pos] ?? 0) + 1 } });
  }

  function kitHrefs(seed: string) {
    const q = new URLSearchParams(query);
    q.set('seed', seed);
    return {
      student: `${base}/pechat/?${q.toString()}`,
      teacher: `${base}/pechat/otvety/?${q.toString()}`,
    };
  }

  function smenitSeed(seed: string) {
    setKitSeed(seed);
    if (params !== null && params.seed !== seed) {
      void sobrat({ ...params, seed });
    }
  }

  const zadachi = list?.poVariantam[variant] ?? [];
  /* Превью по блокам листа: в отработке — блоки I–X с рамкой перед
     каждым, в вариантах — одна рамка перед задачами. */
  const gruppy: { blok: string; ramka: Ramka | undefined; zadachi: ListZadacha[] }[] =
    params?.rezhim === 'otrabotka'
      ? [...new Set(zadachi.map((z) => z.blok))].map((b) => ({
          blok: b,
          ramka: ramki.get(b),
          zadachi: zadachi.filter((z) => z.blok === b),
        }))
      : [{ blok: '', ramka: ramki.get('*'), zadachi }];

  return (
    <div className="z11-gen">
      <div className="z11-gen__side">
        <section className="z11-card z11-gen__blok">
          <h2 className="z11-gen__h">
            <Piktogramma name="layers" />
            {GENERATOR_1.otkuda}
          </h2>
          <div className="z11-istochnik" role="radiogroup" aria-label={GENERATOR_1.otkuda}>
            {TRENAZHER_1.istochniki.map((i) => (
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
            {TRENAZHER_1.istochniki.find((i) => i.id === istochnik)?.note}
          </p>
        </section>

        <section className="z11-card z11-gen__blok">
          <h2 className="z11-gen__h">
            <Piktogramma name="gear" />
            {GENERATOR_1.rezhim}
          </h2>
          <div className="z11-gen__rezhimy" role="radiogroup" aria-label={GENERATOR_1.rezhim}>
            {GENERATOR_1.rezhimy.map((r) => (
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
              <span>{GENERATOR_1.variantov}</span>
              <Stepper
                value={variants}
                min={1}
                max={8}
                onChange={setVariants}
                label={GENERATOR_1.variantov}
              />
            </div>
          ) : null}
        </section>

        <section className="z11-card z11-gen__blok">
          <h2 className="z11-gen__h">
            <Piktogramma name="doc" />
            {rezhim === 'komplekt' ? GENERATOR_1.sostavVarianta : GENERATOR_1.sostav}
          </h2>
          <ul className="z11-gen__sostav">
            {vidimye.map((r) => {
              const podtipy = r.podtipy.filter(
                (p) => podhodit(p.level) && !(istochnik === 'bank' && p.vBanke === 0),
              );
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
                      <IkonkaBloka1 blok={r.id} className="z11-akk__ikonka" />
                      <span className="z11-akk__name">
                        <Tex text={r.nazvanie} />
                      </span>
                      <span className="z11-gen__summa">
                        {summa} {plural(summa, ...GENERATOR_1.zadach)}
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
                        <li key={p.id} className="z11-gen__podtip">
                          <span className="z11-gen__podtip-name">
                            <span className="z11-akk__kod">{p.kod}</span> <Tex text={p.title} />
                          </span>
                          <span className="z11-akk__bank">
                            {istochnik === 'new'
                              ? TRENAZHER_1.generiruyutsya
                              : p.vBanke === 0
                                ? TRENAZHER_1.neIzBanka
                                : TRENAZHER_1.vBanke(p.vBanke)}
                          </span>
                          <Zvezdy level={p.level} />
                          <Stepper
                            value={sostav[p.id] ?? 0}
                            min={0}
                            max={10}
                            onChange={(n) => postavit(p.id, n)}
                            label={`Тип ${p.kod}`}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="z11-gen__itogo">{GENERATOR_1.itogo(vsegoZadach, rezhim === 'komplekt')}</p>
        </section>

        <section className="z11-card z11-gen__blok z11-gen__blok--row">
          <h2 className="z11-gen__h">
            <Piktogramma name="chart" />
            {GENERATOR_1.slozhnost}
          </h2>
          <div className="z11-gen__urovni" role="radiogroup" aria-label={GENERATOR_1.slozhnost}>
            {([0, 1, 2, 3] as const).map((u) => (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={uroven === u}
                className={clsx('z11-gen__uroven', uroven === u && 'is-active')}
                onClick={() => setUroven(u)}
              >
                {u === 0 ? GENERATOR_1.vse : <Zvezdy level={u} />}
              </button>
            ))}
          </div>
        </section>

        <section className="z11-card z11-gen__blok">
          <h2 className="z11-gen__h">
            <Piktogramma name="book" />
            {GENERATOR_1.ramka}
          </h2>
          <p className="z11-istochnik__note">{GENERATOR_1.ramkaLead}</p>
          <Checkbox checked={sRamkoy} onChange={(e) => setSRamkoy(e.target.checked)}>
            {GENERATOR_1.ramkaVkl}
          </Checkbox>
          {sRamkoy ? (
            <div className="z11-vybrannaya__row">
              <span>{GENERATOR_1.primerov}</span>
              <Stepper
                value={primerov}
                min={0}
                max={2}
                onChange={setPrimerov}
                label={GENERATOR_1.primerov}
              />
            </div>
          ) : null}
        </section>

        <Button
          className="z11-gen__go"
          size="lg"
          disabled={vsegoZadach === 0 || zagruzka}
          onClick={sgenerirovat}
        >
          <Piktogramma name="play" />
          {zagruzka ? GENERATOR_1.gotovim : GENERATOR_1.sgenerirovat}
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
                {v === 'uchenik' ? GENERATOR_1.listUchenika : GENERATOR_1.listUchitelya}
              </button>
            ))}
          </div>
          {list !== null && list.poVariantam.length > 1 ? (
            <div className="z11-gen__varianty">
              <span>{GENERATOR_1.variant}</span>
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
                href={`${base}/pechat/vse/?${query}`}
                target="_blank"
                rel="noopener"
              >
                <Piktogramma name="doc" />
                {GENERATOR_1.vseOdnim}
              </a>
            </span>
          )}
        </div>

        <KitBar
          scope="1"
          slot={base}
          section={`№1 · ${SHEET_1.title.text}`}
          count={params === null ? 0 : vsegoZadach * params.variants}
          ready={params !== null && query !== ''}
          hrefs={kitHrefs}
          {...(params === null ? {} : { seed: params.seed })}
          onSeed={smenitSeed}
        />

        {list !== null && list.nehvatka > 0 ? (
          <p className="z11-malo z11-gen__nehvatka" role="status">
            {GENERATOR_1.nehvatka(list.nehvatka)}
          </p>
        ) : null}

        <A4Preview className="z11-a4 z1-a4">
          {list === null ? (
            <p className="z11-a4__pusto">{GENERATOR_1.pusto}</p>
          ) : (
            <>
              <h3 className="z11-a4__title">
                {SHEET_1.title.chip}. {SHEET_1.title.text}
                {list.poVariantam.length > 1 ? `. Вариант ${variant + 1}` : ''}
              </h3>
              <p className="z11-a4__fio">
                {GENERATOR_1.familiya} <span />
              </p>
              {gruppy.map((g) => (
                <Fragment key={g.blok}>
                  {g.blok === '' ? null : (
                    <h4 className="z1-a4__blok">
                      <span className="z1-a4__blok-no">{g.blok}</span>
                      <Tex text={blokTitle(razdely, g.blok)} />
                    </h4>
                  )}
                  {g.ramka === undefined ? null : <RamkaPreview ramka={g.ramka} />}
                  <ol className="z11-a4__list">
                    {g.zadachi.map((z) => (
                      <li key={z.pos} className="z11-a4__task">
                        <span className="z11-a4__no">{z.no}</span>
                        <div className="z11-a4__body">
                          <div className="z1-a4__uslovie">
                            <div dangerouslySetInnerHTML={{ __html: z.questionHtml }} />
                            {z.figureSvg === null ? null : (
                              <span
                                className="pl-wrap z1-a4__pic"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    vkladka === 'uchitel'
                                      ? (z.figureUchitelSvg ?? z.figureSvg)
                                      : z.figureSvg,
                                }}
                              />
                            )}
                          </div>
                          {vkladka === 'uchitel' ? (
                            <div className="z11-a4__reshenie">
                              <div dangerouslySetInnerHTML={{ __html: z.solutionHtml }} />
                              <p className="z11-a4__otvet">
                                {GENERATOR_1.otvet}:{' '}
                                <b dangerouslySetInnerHTML={{ __html: z.answerHtml }} />
                              </p>
                            </div>
                          ) : null}
                        </div>
                        <span className={clsx('z11-a4__badge', `z11-a4__badge--${z.poz.vid}`)}>
                          {SHEET_1.bejdzh[z.poz.vid]}
                          {z.fipi === null ? null : ` · ${SHEET_1.fipi(z.fipi)}`}
                        </span>
                        <button
                          type="button"
                          className="z11-a4__zamena"
                          aria-label={`${GENERATOR_1.zamenit} ${z.no}`}
                          title={GENERATOR_1.zamenit}
                          disabled={zagruzka}
                          onClick={() => zamenit(z.pos)}
                        >
                          <Piktogramma name="cycle" />
                        </button>
                      </li>
                    ))}
                  </ol>
                </Fragment>
              ))}
              <p className="z11-a4__podpis">{SHEET_1.podpis}</p>
            </>
          )}
        </A4Preview>
      </section>
    </div>
  );
}

function blokTitle(razdely: RazdelInfo[], blok: string): string {
  return razdely.find((r) => r.id === blok)?.nazvanie ?? blok;
}

/** Рамка «Повторяем» в превью: пункты и разобранные примеры с чертежом. */
function RamkaPreview({ ramka }: { ramka: Ramka }) {
  return (
    <div className="z1-a4__ramka">
      {ramka.items.length === 0 ? null : (
        <>
          <p className="z1-a4__ramka-title">{SHEET_1.povtoryaem}</p>
          <ul className="z1-a4__ramka-list">
            {ramka.items.map((t, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: t }} />
            ))}
          </ul>
        </>
      )}
      {ramka.primery.map((p, i) => (
        <div className="z1-a4__primer" key={i}>
          <div>
            <p className="z1-a4__primer-title">
              {SHEET_1.primer}. <span dangerouslySetInnerHTML={{ __html: p.title }} />
            </p>
            <div dangerouslySetInnerHTML={{ __html: p.conditionHtml }} />
            <div
              className="z1-a4__primer-reshenie"
              dangerouslySetInnerHTML={{ __html: p.solutionHtml }}
            />
          </div>
          <span className="pl-wrap z1-a4__pic" dangerouslySetInnerHTML={{ __html: p.figureSvg }} />
        </div>
      ))}
    </div>
  );
}
