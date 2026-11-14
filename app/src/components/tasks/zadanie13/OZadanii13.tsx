import { Callout } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { FORMULY13, GRUPPY13_VID, SHAPKA13, opasno13 } from '@/content/ekonomicheskie13';
import { O_ZADANII_13 } from '@/content/zadanie13';
import { assetUrl } from '@/lib/assetUrl';
import { typeset } from '@/lib/tex';
import { tipograf } from '@/lib/tipograf';
import { BANK_13 } from '@/lib/zadanie13/bank';
import { OPORNYE13_HREF, blokHref13, tipTrenazherHref13 } from '@/lib/zadanie13/links';
import { BLOKI_13 } from '@/lib/zadanie13/opornye/bloki';
import { primer13 } from '@/lib/zadanie13/primer';
import { PROTOTIPY_TRENAZHERA_13, SHEMY_13 } from '@/lib/zadanie13/trening/katalog';
import { TYPE_NAMES } from '@/lib/zadanie13/types';
import { FormulyRamka, KartaGruppa, KartaShapka, KartaTip } from '../karta';
import { YakorTipa } from '../karta/YakorTipa';
import { GruppaProgress13 } from './GruppaProgress13';
import { Primer13Karta, PrimerLazy13 } from './PrimerLazy13';

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
            src={assetUrl('/images/task-13.webp')}
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

      <p className="stk-lead z13-skoro">{o.optimizaciya}</p>
    </div>
  );
}
