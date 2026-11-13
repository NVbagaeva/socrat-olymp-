import { Abzacy, RamkaLovushka } from '@/components/teoriya/Ramki';
import { OSHIBKI_2, UMET_2 } from '@/content/oZadanii2';
import { O_ZADANII } from '@/content/vektory';
import { GRUPPY2_VID, SHAPKA2, TIPY2_OPASNO, ZNAT2 } from '@/content/vektory2';
import { assetUrl } from '@/lib/assetUrl';
import { typeset } from '@/lib/tex';
import { opornyeTipaHref2, tipTrenazherHref2 } from '@/lib/vektory/links';
import { PROTOTYPES } from '@/lib/vektory/prototypes';
import { renderVectorPlane } from '@/lib/vektory/render';
import { FormulyRamka, KartaGruppa, KartaPrimer, KartaShapka, KartaTip } from '../karta';
import { YakorTipa } from '../karta/YakorTipa';
import '../teoriya/teoriya-steklo.css';
import { GruppaProgress2 } from './GruppaProgress2';
import { primerTipa2 } from './primer2';
import { PrimerLazy2 } from './PrimerLazy2';
import { RisunokSvg } from './shagi2';

/**
 * Вкладка «О задании» №2: карта задания по типам («Стеклянная сцена»,
 * общие компоненты components/tasks/karta — как у №8, №3, №7 и №6).
 *
 * Шапка (что проверяет, балл, минуты, чем опасно) с обложкой раздела,
 * три группы с прогрессом ученика, 19 типов с разобранным примером
 * (та же задача, что была разобрана на «Опорных задачах»: условие,
 * рисунок с катетами, шаги), «Что нужно знать» — прежний блок «Что
 * нужно уметь» и «Типичные ошибки» прежней вкладки, тексты без правок.
 */

function tex(formula: string): string {
  return typeset(`$${formula}$`);
}

export function OZadanii2() {
  return (
    <div className="kz z2-karta">
      <YakorTipa />
      <KartaShapka
        nadzagolovok={SHAPKA2.nadzagolovok}
        zagolovok={SHAPKA2.zagolovok}
        lead={SHAPKA2.lead}
        fakty={SHAPKA2.fakty(PROTOTYPES.length)}
        opasnoTitle={SHAPKA2.opasnoTitle}
        opasno={SHAPKA2.opasno.map((line) => typeset(line))}
        oblozhka={
          /* Обложка раздела — готовая картинка, как есть: без обрезки и
             пережатия, прозрачный фон на стекле шапки. */
          <img
            src={assetUrl('/images/task-02.webp')}
            alt={SHAPKA2.oblozhkaAlt}
            width={512}
            height={512}
            decoding="async"
          />
        }
      />

      <section className="kz-razdel" aria-labelledby="z2-gruppy-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z2-gruppy-title">
            {SHAPKA2.gruppyTitle}
          </h3>
          <p className="stk-lead">{SHAPKA2.gruppyLead}</p>
        </div>
        <div className="kz-gruppy">
          {O_ZADANII.gruppy.map((g, gi) => {
            const vid = GRUPPY2_VID[g.id];
            const tipy = PROTOTYPES.filter((p) => p.gruppa === g.id);
            return (
              <KartaGruppa
                key={g.id}
                id={g.id}
                nazvanie={g.title}
                znakHtml={tex(vid.znak)}
                ton={vid.ton}
                tipov={tipy.length}
                progress={<GruppaProgress2 prototypes={tipy.map((p) => p.id)} />}
                labels={SHAPKA2}
                open={gi === 0}
              >
                {tipy.map((p, i) => {
                  const open = gi === 0 && i === 0;
                  const trenirovatHref = tipTrenazherHref2(p.id);
                  const opornyeHref = opornyeTipaHref2(p.id);
                  const opasnoHtml = typeset(TIPY2_OPASNO[p.id] ?? '');
                  /* Раскрытый с самого начала пример набирается на сборке;
                     остальные собираются в браузере по раскрытию. */
                  const ex = open ? primerTipa2(p.id) : null;
                  return (
                    <KartaTip
                      key={p.id}
                      id={p.id}
                      nazvanieHtml={typeset(p.nazvanie)}
                      lead={tex(p.formula)}
                      open={open}
                    >
                      {ex === null ? (
                        <PrimerLazy2
                          prototype={p.id}
                          opasnoHtml={opasnoHtml}
                          trenirovatHref={trenirovatHref}
                          opornyeHref={opornyeHref}
                        />
                      ) : (
                        <KartaPrimer
                          uslovieHtml={ex.uslovieHtml}
                          {...(ex.risunokSvg === null
                            ? {}
                            : { risunok: <RisunokSvg svg={ex.risunokSvg} /> })}
                          shagi={ex.shagi}
                          otvet={ex.otvet}
                          opasnoHtml={opasnoHtml}
                          trenirovatHref={trenirovatHref}
                          opornyeHref={opornyeHref}
                          labels={SHAPKA2}
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

      <section className="kz-razdel kz-znat" aria-labelledby="z2-znat-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z2-znat-title">
            {SHAPKA2.znatTitle}
          </h3>
          <p className="stk-lead">{UMET_2.lead}</p>
        </div>
        <figure className="z2-znat__risunok stk-glass">
          <RisunokSvg svg={renderVectorPlane(UMET_2.risunok)} />
          <figcaption className="stk-lead">{UMET_2.podpis}</figcaption>
        </figure>
        <div className="kz-znat__setka">
          {UMET_2.navyki.map((n, i) => (
            <FormulyRamka
              key={n.title}
              nazvanie={n.title}
              ton={ZNAT2.tony[i] ?? 'blue'}
              primerLabel={ZNAT2.naRisunke}
              formuly={[{ html: tex(n.formula), primerHtml: tex(n.naRisunke) }]}
            />
          ))}
        </div>
      </section>

      <section className="kz-razdel z2-oshibki teor-steklo" aria-labelledby="z2-oshibki-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z2-oshibki-title">
            {OSHIBKI_2.title}
          </h3>
          <p className="stk-lead">{ZNAT2.oshibkiLead}</p>
        </div>
        <div className="z2-oshibki__setka">
          {OSHIBKI_2.spisok.map((o) => (
            <RamkaLovushka
              key={o.id}
              title={o.title}
              neverno={[`$${o.neverno}$`]}
              verno={[`$${o.verno}$`]}
            >
              <Abzacy paras={[o.text, o.primer]} />
            </RamkaLovushka>
          ))}
        </div>
      </section>
    </div>
  );
}
