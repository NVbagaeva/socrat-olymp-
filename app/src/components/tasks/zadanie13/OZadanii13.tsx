import { Callout } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import Link from 'next/link';
import {
  FORMULY13,
  GRUPPY13_VID,
  IZ_VARIANTOV13,
  KRITERII_BLOK13,
  SHAPKA13,
  SYUZHETY13,
  VIDY13,
  opasno13,
} from '@/content/ekonomicheskie13';
import { KRITERII13 } from '@/content/teoriya13-chast2';
import { MESTO13, O_ZADANII_13 } from '@/content/zadanie13';
import { assetUrl } from '@/lib/assetUrl';
import { typeset } from '@/lib/tex';
import { tipograf } from '@/lib/tipograf';
import { BANK_13 } from '@/lib/zadanie13/bank';
import {
  OPORNYE13_HREF,
  OPTIMIZACIYA13_HREF,
  blokHref13,
  glavaHref13,
  syuzhetHref13,
  tipTrenazherHref13,
} from '@/lib/zadanie13/links';
import { BLOKI_13 } from '@/lib/zadanie13/opornye/bloki';
import { primer13 } from '@/lib/zadanie13/primer';
import { PROTOTIPY_TRENAZHERA_13, SHEMY_13 } from '@/lib/zadanie13/trening/katalog';
import { TYPE_NAMES } from '@/lib/zadanie13/types';
import { FormulyRamka, KartaGruppa, KartaShapka, KartaTip } from '../karta';
import { YakorTipa } from '../karta/YakorTipa';
import { GruppaProgress13 } from './GruppaProgress13';
import { Primer13Karta, PrimerLazy13 } from './PrimerLazy13';
import { ZadachiIzVariantov13 } from './ZadachiIzVariantov13';

/**
 * Вкладка «О задании» №13: карта задания по типам («Стеклянная сцена»,
 * общие компоненты components/tasks/karta — как у №8, №3, №7 и №6).
 *
 * Шапка (что проверяет, балл, минуты, чем опасно) с обложкой раздела,
 * рамка «Важно» про единицы ответа, четыре схемы с прогрессом ученика,
 * 66 типов с разобранным примером (условие, таблица условия, решение по
 * шагам с таблицами), «Как узнать схему за 10 секунд» и «Что нужно
 * знать». Условия и решения — из движка задач, без правок.
 */

function tex(formula: string): string {
  return typeset(`$${formula}$`);
}

/**
 * Задача-пример прототипа. У четырёх типов, что прежде стояли примерами
 * схем, — та же задача, что была (seed «o1»), у остальных — первая задача
 * банка раздела.
 */
const PRIMER_SEED: Record<string, string> = Object.fromEntries(
  O_ZADANII_13.tipy.map((t) => [t.primer.prototypeId, t.primer.seed]),
);
function seedPrimera(id: string): string {
  return PRIMER_SEED[id] ?? BANK_13.find(([p]) => p === id)?.[1] ?? 'b1';
}

/** Блок опорных задач, где отрабатывается прототип. */
function opornyeHref(id: string): string {
  const blok = BLOKI_13.find((b) => b.vid === 'zadachi' && b.prototipy.includes(id));
  return blok === undefined ? OPORNYE13_HREF : blokHref13(blok.slug);
}

export function OZadanii13() {
  const o = O_ZADANII_13;
  return (
    <div className="kz z13-karta">
      <YakorTipa />
      <KartaShapka
        nadzagolovok={SHAPKA13.nadzagolovok}
        zagolovok={SHAPKA13.zagolovok}
        lead={SHAPKA13.lead}
        fakty={SHAPKA13.fakty(PROTOTIPY_TRENAZHERA_13.length)}
        opasnoTitle={SHAPKA13.opasnoTitle}
        opasno={SHAPKA13.opasno.map((line) => typeset(line))}
        oblozhka={
          /* Обложка раздела — готовая картинка, как есть: без обрезки и
             пережатия, прозрачный фон на стекле шапки. */
          <img
            src={assetUrl('/images/task-13.svg')}
            alt={SHAPKA13.oblozhkaAlt}
            width={512}
            height={512}
            decoding="async"
          />
        }
      />

      {/* «Важно» с примером — прежняя рамка раздела, тексты без правок. */}
      <section className="kz-razdel z13-vazhno" aria-label={o.title}>
        <Callout
          tone="vazhno"
          primer={o.edinicyPrimer.map((t) => (
            <p key={t}>
              <Tex text={tipograf(t)} />
            </p>
          ))}
        >
          {o.edinicy.map((t) => (
            <p key={t}>
              <Tex text={tipograf(t)} />
            </p>
          ))}
        </Callout>
      </section>

      {MESTO13.vtorayaChast ? (
        <section className="kz-razdel" aria-labelledby="z13-kriterii-title">
          <div className="kz-razdel__head">
            <h3 className="stk-h3" id="z13-kriterii-title">
              {KRITERII_BLOK13.title}
            </h3>
          </div>
          <div className="z13-kriterii stk-glass">
            <table>
              <thead>
                <tr>
                  {KRITERII_BLOK13.head.map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {KRITERII13.map((k) => (
                  <tr key={k.ball}>
                    <th scope="row">{k.ball}</th>
                    <td>{k.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="stk-lead z13-kriterii__note">
            {KRITERII_BLOK13.note}{' '}
            <Link href={glavaHref13('reshenie')}>{KRITERII_BLOK13.teoriya} →</Link>
          </p>
        </section>
      ) : null}

      {MESTO13.sOptimizaciey ? (
        <section className="kz-razdel" aria-labelledby="z13-vidy-title">
          <div className="kz-razdel__head">
            <h3 className="stk-h3" id="z13-vidy-title">
              {VIDY13.title}
            </h3>
            <p className="stk-lead">{VIDY13.lead}</p>
          </div>
          <div className="z13-vidy">
            <section className="z13-vid stk-glass stk-ton--blue" id="ekonomika">
              <p className="z13-vid__metka">{VIDY13.ekonomika.metka}</p>
              <h4 className="z13-vid__title">{VIDY13.ekonomika.title}</h4>
              <p className="z13-vid__text">
                {VIDY13.ekonomika.text(PROTOTIPY_TRENAZHERA_13.length)}
              </p>
              <div className="kz-knopki">
                <a className="stk-btn stk-btn--primary" href="#z13-gruppy-title">
                  {VIDY13.ekonomika.tipy}
                </a>
                <a className="stk-btn stk-btn--tihaya" href="#iz-variantov">
                  {VIDY13.ekonomika.varianty}
                </a>
              </div>
            </section>
            <section className="z13-vid stk-glass stk-ton--orange" id="optimizaciya">
              <p className="z13-vid__metka">{VIDY13.optimizaciya.metka}</p>
              <h4 className="z13-vid__title">{VIDY13.optimizaciya.title}</h4>
              <p className="z13-vid__text">{VIDY13.optimizaciya.text}</p>
              <p className="z13-vid__podzag">{VIDY13.optimizaciya.syuzhety}</p>
              <ul className="z13-vid__syuzhety">
                {SYUZHETY13.filter(
                  (s) => s.vid === 'optimizaciya' && !s.id.startsWith('drugie'),
                ).map((s) => (
                  <li key={s.id}>
                    <Link className="z13-gde__chip" href={syuzhetHref13(s.id)}>
                      {s.nazvanie}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="kz-knopki">
                <Link className="stk-btn stk-btn--primary" href={OPTIMIZACIYA13_HREF}>
                  {VIDY13.optimizaciya.zadachi}
                </Link>
                <Link className="stk-btn stk-btn--tihaya" href={glavaHref13('optimizaciya')}>
                  {VIDY13.optimizaciya.teoriya}
                </Link>
              </div>
            </section>
          </div>
        </section>
      ) : null}

      <section className="kz-razdel" aria-labelledby="z13-gruppy-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z13-gruppy-title">
            {SHAPKA13.gruppyTitle}
          </h3>
          <p className="stk-lead">{SHAPKA13.gruppyLead}</p>
        </div>
        <div className="kz-gruppy">
          {SHEMY_13.map((type, gi) => {
            const vid = GRUPPY13_VID[type];
            const tipy = PROTOTIPY_TRENAZHERA_13.filter((p) => p.type === type);
            return (
              <KartaGruppa
                key={type}
                id={type}
                nazvanie={TYPE_NAMES[type]}
                znakHtml={tex(vid.znak)}
                ton={vid.ton}
                tipov={tipy.length}
                progress={<GruppaProgress13 prototypes={tipy.map((p) => p.id)} />}
                labels={SHAPKA13}
                open={gi === 0}
              >
                <p className="stk-lead z13-gruppa__lead">{vid.lead}</p>
                {tipy.map((p, i) => {
                  const open = gi === 0 && i === 0;
                  const seed = seedPrimera(p.id);
                  /* Пример на сборке: из него — тип вопроса и единицы для
                     «Где теряют балл». Разметку примера кладём в страницу
                     только у раскрытой карточки. */
                  const ex = primer13(p.id, seed);
                  const opasnoHtml = typeset(opasno13(p.type, ex.vopros, ex.units));
                  const metki = [
                    p.difficulty === 'hard' ? SHAPKA13.povyshennyy : null,
                    p.source === 'own' ? SHAPKA13.neIzBanka : null,
                  ].filter((m): m is string => m !== null);
                  const trenirovatHref = tipTrenazherHref13(p.id);
                  return (
                    <KartaTip
                      key={p.id}
                      id={p.id}
                      nazvanieHtml={typeset(p.title)}
                      {...(metki.length === 0 ? {} : { lead: metki.join(' · ') })}
                      open={open}
                    >
                      {open ? (
                        <Primer13Karta
                          primer={ex}
                          opasnoHtml={opasnoHtml}
                          trenirovatHref={trenirovatHref}
                          opornyeHref={opornyeHref(p.id)}
                        />
                      ) : (
                        <PrimerLazy13
                          prototype={p.id}
                          seed={seed}
                          opasnoHtml={opasnoHtml}
                          trenirovatHref={trenirovatHref}
                          opornyeHref={opornyeHref(p.id)}
                        />
                      )}
                    </KartaTip>
                  );
                })}
              </KartaGruppa>
            );
          })}
        </div>
      </section>

      {MESTO13.sOptimizaciey ? (
        <section className="kz-razdel" id="iz-variantov" aria-labelledby="z13-iz-variantov-title">
          <div className="kz-razdel__head">
            <h3 className="stk-h3" id="z13-iz-variantov-title">
              {IZ_VARIANTOV13.title}
            </h3>
            <p className="stk-lead">{IZ_VARIANTOV13.lead}</p>
          </div>
          <ZadachiIzVariantov13 vid="ekonomika" />
        </section>
      ) : null}

      <section className="kz-razdel" aria-labelledby="z13-karta-priznaki-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z13-karta-priznaki-title">
            {SHAPKA13.priznakiTitle}
          </h3>
        </div>
        <div className="z13-karta-priznaki stk-glass">
          <table>
            <thead>
              <tr>
                {SHAPKA13.priznakiHead.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {o.priznaki.map((r) => (
                <tr key={r.type}>
                  <td>
                    <Tex text={r.vizhu} />
                  </td>
                  <th scope="row">{TYPE_NAMES[r.type]}</th>
                  <td>{r.pochemu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="kz-razdel kz-znat" aria-labelledby="z13-znat-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z13-znat-title">
            {SHAPKA13.znatTitle}
          </h3>
          <p className="stk-lead">{SHAPKA13.znatLead}</p>
        </div>
        <div className="kz-znat__setka">
          {FORMULY13.map((blok) => (
            <FormulyRamka
              key={blok.id}
              nazvanie={blok.nazvanie}
              ton={blok.ton}
              formuly={blok.formuly.map((f) => ({ html: tex(f.tex), primerHtml: tex(f.primer) }))}
            />
          ))}
        </div>
      </section>

      <p className="stk-lead z13-skoro">
        {o.optimizaciya}
        {MESTO13.sOptimizaciey ? (
          <>
            {' '}
            <a href="#optimizaciya">{o.optimizaciyaSsylka}</a>
          </>
        ) : null}
      </p>
    </div>
  );
}
