import Link from 'next/link';
import { IRRACIONALNYE_7 } from '@/content/teoriya7-irr';
import { FORMULY7, GRUPPY7_VID, SHAPKA7 } from '@/content/uravneniya7';
import { assetUrl } from '@/lib/assetUrl';
import { typeset } from '@/lib/tex';
import { zadachiPrototipa } from '@/lib/zadanie7/bank/index';
import { OPORNYE7_HREF, blokHref7, tipTrenazherHref7 } from '@/lib/zadanie7/links';
import { BLOKI_OPORNYH } from '@/lib/zadanie7/opornye';
import { GROUPS, prototype, prototypesOfGroup, PROTOTYPES } from '@/lib/zadanie7/prototypes';
import { FormulyRamka, KartaGruppa, KartaPrimer, KartaShapka, KartaTip } from '../karta';
import { YakorTipa } from '../karta/YakorTipa';
import { GruppaProgress7 } from './GruppaProgress7';
import { SkhemaIrr7 } from './Irracionalnye7';
import { PrimerLazy7 } from './PrimerLazy7';
import { otvetTekstom, shagiIzResheniya } from './shagi7';

/**
 * Вкладка «О задании» №7: карта задания по типам («Стеклянная сцена»,
 * общие компоненты components/tasks/karta — как у №8 и №3).
 *
 * Шапка (что проверяет, балл, минуты, чем опасно) с обложкой раздела,
 * пять групп с прогрессом ученика, 35 типов с разобранным примером,
 * блок «Что нужно знать» и цветные схемы равносильных переходов.
 * Названия типов, условия и решения — из банка, без правок. Формулы
 * набираются KaTeX на сборке; прогресс — из хранилища браузера.
 */

function tex(formula: string): string {
  return typeset(`$${formula}$`);
}

/** Блок опорных задач, где отрабатывается навык прототипа. */
function opornyeHref(id: string): string {
  const blok = BLOKI_OPORNYH.find((b) => b.prototipy.includes(id));
  return blok === undefined ? OPORNYE7_HREF : blokHref7(blok.slug);
}

/** Разобранный пример прототипа на сборке: первая задача ФИПИ или первый аналог. */
function primer(id: string) {
  const { fipi, analogi } = zadachiPrototipa(id);
  const z = fipi[0] ?? analogi[0];
  if (z === undefined) {
    return null;
  }
  const s = prototype(id).solve(z.params);
  return {
    uslovieHtml: typeset(z.text),
    shagi: shagiIzResheniya(s),
    otvet: otvetTekstom(s.answer),
  };
}

export function OZadanii7({ base }: { base: string }) {
  /* Схемы равносильных переходов — те, что в теории: первые три вида. */
  const skhemy = IRRACIONALNYE_7.vidy.slice(0, 3);
  return (
    <div className="kz z7-karta">
      <YakorTipa />
      <KartaShapka
        nadzagolovok={SHAPKA7.nadzagolovok}
        zagolovok={SHAPKA7.zagolovok}
        lead={SHAPKA7.lead}
        fakty={SHAPKA7.fakty(PROTOTYPES.length)}
        opasnoTitle={SHAPKA7.opasnoTitle}
        opasno={SHAPKA7.opasno.map((line) => typeset(line))}
        oblozhka={
          /* Обложка раздела — готовая картинка, как есть: без обрезки и
             пережатия, прозрачный фон на стекле шапки. */
          <img
            src={assetUrl('/images/task-07.webp')}
            alt={SHAPKA7.oblozhkaAlt}
            width={512}
            height={512}
            decoding="async"
          />
        }
      />

      <section className="kz-razdel" aria-labelledby="z7-gruppy-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z7-gruppy-title">
            {SHAPKA7.gruppyTitle}
          </h3>
          <p className="stk-lead">{SHAPKA7.gruppyLead}</p>
        </div>
        <div className="kz-gruppy">
          {GROUPS.map((g, gi) => {
            const vid = GRUPPY7_VID[g.id];
            const tipy = prototypesOfGroup(g.id);
            return (
              <KartaGruppa
                key={g.id}
                id={g.id}
                nazvanie={g.title}
                znakHtml={tex(vid.znak)}
                ton={vid.ton}
                tipov={tipy.length}
                progress={<GruppaProgress7 prototypes={tipy.map((p) => p.id)} />}
                labels={SHAPKA7}
                open={gi === 0}
              >
                {tipy.map((p, i) => {
                  const open = gi === 0 && i === 0;
                  const trenirovatHref = tipTrenazherHref7(p.id);
                  /* Раскрытый с самого начала пример набирается на сборке;
                     остальные собираются в браузере по раскрытию. */
                  const ex = open ? primer(p.id) : null;
                  return (
                    <KartaTip
                      key={p.id}
                      id={p.id}
                      nazvanieHtml={typeset(p.title)}
                      lead={tex(p.formula)}
                      open={open}
                    >
                      {ex === null ? (
                        <PrimerLazy7
                          prototype={p.id}
                          opasnoHtml={typeset(vid.opasno)}
                          trenirovatHref={trenirovatHref}
                          opornyeHref={opornyeHref(p.id)}
                        />
                      ) : (
                        <KartaPrimer
                          uslovieHtml={ex.uslovieHtml}
                          shagi={ex.shagi}
                          otvet={ex.otvet}
                          opasnoHtml={typeset(vid.opasno)}
                          trenirovatHref={trenirovatHref}
                          opornyeHref={opornyeHref(p.id)}
                          labels={SHAPKA7}
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

      <section className="kz-razdel kz-znat" aria-labelledby="z7-znat-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z7-znat-title">
            {SHAPKA7.znatTitle}
          </h3>
          <p className="stk-lead">{SHAPKA7.znatLead}</p>
        </div>
        <div className="kz-znat__setka">
          {FORMULY7.map((blok) => (
            <FormulyRamka
              key={blok.id}
              nazvanie={blok.nazvanie}
              ton={blok.ton}
              formuly={blok.formuly.map((f) => ({ html: tex(f.tex), primerHtml: tex(f.primer) }))}
            />
          ))}
        </div>
      </section>

      <section className="kz-razdel z7-skhemy" aria-labelledby="z7-skhemy-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z7-skhemy-title">
            {SHAPKA7.skhemyTitle}
          </h3>
          <p className="stk-lead">{SHAPKA7.skhemyLead}</p>
        </div>
        <div className="z7-skhemy__setka">
          {skhemy.map((v) => (
            <article className="z7-skhemy__karta stk-glass" key={v.kartochka.id}>
              <h4 className="stk-h4">{v.kartochka.title}</h4>
              <SkhemaIrr7 skhema={v.skhema} />
            </article>
          ))}
        </div>
        <Link
          className="stk-btn stk-btn--tihaya z7-skhemy__knopka"
          href={`${base}/teoriya/#irracionalnye`}
        >
          {SHAPKA7.skhemyKnopka}
        </Link>
      </section>
    </div>
  );
}
