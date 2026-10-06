import Image from 'next/image';
import Link from 'next/link';
import { Details } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { TeoriyaShell } from '@/components/tasks/veroyatnost/teoriya/TeoriyaShell';
import { LAYFHAKI, LOVUSHKI, RAZDELY_TEORII_11, type RazdelTeorii11 } from '@/content/teoriya11';
import { PROGRESS_11 } from '@/content/zadanie11';
import { katex } from '@/lib/graph/katex';
import { kodNaSayte } from '@/lib/zadanie11/taxonomy';
import { SUBTYPES } from '@/lib/zadanie11/prototypes';
import type { LifehackId } from '@/lib/zadanie11/types';
import { IkonkaRazdela, MiniKartinka, Piktogramma, tsvetRazdela, Zvezdy } from './Piktogrammy';
import { Tablitsa11 } from './Tablitsa11';

/** Формула крупно (display), набранная на сервере. */
function Krupno({ tex, className }: { tex: string; className?: string }) {
  const html = katex.renderToString(tex, { throwOnError: true, displayMode: true });
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function KartaLayfhak({ id, polnyy }: { id: LifehackId; polnyy: boolean }) {
  const l = LAYFHAKI[id];
  return (
    <section className="z11-card z11-card--layfhak" id={`layfhak-${id}`}>
      <h4 className="z11-card__title">
        <Piktogramma name="bulb" className="z11-card__icon" />
        {l.title}
      </h4>
      <p className="z11-card__lead">
        <Tex text={l.lead} />
      </p>
      {l.odz === undefined ? null : (
        <p className="z11-card__odz">
          <Tex text={l.odz} />
        </p>
      )}
      <div className="z11-dolgo">
        <div className="z11-dolgo__box">
          <Tex className="z11-dolgo__label" text={l.dolgo.podpis} />
          <Krupno tex={l.dolgo.tex} />
        </div>
        <Piktogramma name="arrow" className="z11-dolgo__arrow" />
        <div className="z11-dolgo__box z11-dolgo__box--bystro">
          <Tex className="z11-dolgo__label" text={l.bystro.podpis} />
          <Krupno tex={l.bystro.tex} />
          {l.bystro.itog === undefined ? null : (
            <Krupno className="z11-dolgo__itog" tex={l.bystro.itog} />
          )}
        </div>
      </div>
      {l.obosnovanie === undefined ? null : (
        <p className="z11-card__obosnovanie">
          <Tex text={l.obosnovanie} />
        </p>
      )}
      {polnyy ? (
        <ol className="z11-card__steps">
          {l.shagi.map((s) => (
            <li key={s}>
              <Tex text={s} />
            </li>
          ))}
        </ol>
      ) : (
        <Details title="Как это работает">
          <ol className="z11-card__steps">
            {l.shagi.map((s) => (
              <li key={s}>
                <Tex text={s} />
              </li>
            ))}
          </ol>
        </Details>
      )}
    </section>
  );
}

function KartaLovushka({ id }: { id: string }) {
  const l = LOVUSHKI[id];
  if (!l) {
    return null;
  }
  return (
    <section className="z11-card z11-card--lovushka">
      <h4 className="z11-card__title">
        <Piktogramma name="alert" className="z11-card__icon" />
        {l.title}
      </h4>
      <p className="z11-card__text">
        <Tex text={l.text} />
      </p>
      {l.tex === undefined ? null : (
        <Krupno className="z11-card__formula z11-card__formula--warn" tex={l.tex} />
      )}
    </section>
  );
}

function Telo({ r, trenazher }: { r: RazdelTeorii11; trenazher: string }) {
  const tipy = r.section ? SUBTYPES.filter((st) => st.section === r.section) : [];
  const polnyy = r.id === 'layfhaki';
  return (
    <div className={`z11-teor${r.section ? ` ${tsvetRazdela(r.section)}` : ''}`}>
      <div className="z11-teor__lead">
        {r.section ? <IkonkaRazdela section={r.section} className="z11-teor__icon" /> : null}
        <p>
          <Tex text={r.lead} />
        </p>
      </div>

      {r.vvedenie ? (
        <section className="z11-card z11-vved" aria-label={r.vvedenie.title}>
          <h4 className="z11-card__title">
            <Piktogramma name="drop" className="z11-card__icon" />
            {r.vvedenie.title}
          </h4>
          <p className="z11-card__text">
            <Tex text={r.vvedenie.opredelenie} />
          </p>
          <ul className="z11-vved__list">
            {r.vvedenie.kartinki.map((k) => (
              <li className="z11-vved__item" key={k.title}>
                <Image className="z11-vved__pic" src={k.src} alt={k.alt} width={480} height={480} />
                <span className="z11-vved__title">{k.title}</span>
                <span className="z11-vved__text">
                  <Tex text={k.text} />
                </span>
              </li>
            ))}
          </ul>
          <p className="z11-vved__glavnoe">
            <Tex text={r.vvedenie.glavnoe} />
          </p>
        </section>
      ) : null}

      {r.formula || r.tablitsa ? (
        <div
          className={
            r.tablitsa?.legenda ? 'z11-teor__pair z11-teor__pair--stack' : 'z11-teor__pair'
          }
        >
          {r.formula ? (
            <section className="z11-card">
              <h4 className="z11-card__title">
                <Piktogramma name="book" className="z11-card__icon" />
                Главная формула
              </h4>
              <Krupno className="z11-card__formula" tex={r.formula.tex} />
              <p className="z11-card__podpis">
                <Tex text={r.formula.podpis} />
              </p>
            </section>
          ) : null}
          {r.tablitsa ? (
            <section className="z11-card">
              <h4 className="z11-card__title">
                <Piktogramma name="table" className="z11-card__icon" />
                {r.tablitsa.title}
              </h4>
              <p className="z11-card__lead">
                <Tex text={r.tablitsa.primer} />
              </p>
              {r.tablitsa.legenda ? (
                <ul className="z11-legenda">
                  {r.tablitsa.legenda.map((l) => (
                    <li key={l}>
                      <Tex text={l} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {r.tablitsa.tables.map((t, i) => (
                <Tablitsa11 table={t} key={i} />
              ))}
              {r.tablitsa.note === undefined ? null : (
                <p className="z11-card__note">
                  <Tex text={r.tablitsa.note} />
                </p>
              )}
            </section>
          ) : null}
        </div>
      ) : null}

      {r.idei.length > 0 ? (
        <section className="z11-card z11-card--idei">
          <h4 className="z11-card__title">
            <Piktogramma name="flag" className="z11-card__icon" />
            Главное
          </h4>
          <ul className="z11-card__list">
            {r.idei.map((t) => (
              <li key={t}>
                <Tex text={t} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {r.kartochki ? (
        <div className="z11-teor__grid">
          {r.kartochki.map((k) => (
            <section className="z11-card" key={k.title}>
              <h4 className="z11-card__title">{k.title}</h4>
              <p className="z11-card__text">
                <Tex text={k.text} />
              </p>
              {k.tex === undefined ? null : <Krupno className="z11-card__formula" tex={k.tex} />}
            </section>
          ))}
        </div>
      ) : null}

      {r.layfhaki.length > 0 ? (
        <div className={polnyy ? 'z11-teor__stack' : 'z11-teor__grid'}>
          {r.layfhaki.map((id) => (
            <KartaLayfhak id={id} polnyy={polnyy} key={id} />
          ))}
        </div>
      ) : null}

      {r.lovushki.length > 0 ? (
        <div className="z11-teor__grid">
          {r.lovushki.map((id) => (
            <KartaLovushka id={id} key={id} />
          ))}
        </div>
      ) : null}

      {tipy.length > 0 ? (
        <section className="z11-tipy" aria-label="Типы задач этого раздела">
          <h4 className="z11-tipy__title">Типы задач этого раздела</h4>
          <ul className="z11-tipy__list">
            {tipy.map((st) => (
              <li className="z11-tip" key={st.id}>
                <MiniKartinka id={st.id} section={st.section} className="z11-tip__pic" />
                <span className="z11-tip__body">
                  <span className="z11-tip__code">{kodNaSayte(st.id)}</span>
                  <span className="z11-tip__title">{st.title}</span>
                  <span className="z11-tip__foot">
                    <Zvezdy level={st.level} />
                    <Link
                      className="btn btn--secondary btn--sm z11-tip__btn"
                      href={`${trenazher}?tip=${st.id}`}
                    >
                      Решать
                    </Link>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/**
 * Вкладка «Теория» задания №11 (макет docs/mockups/zadanie-11/
 * teoriya.png): разделы подряд, содержание рядом — общая оболочка
 * теории (TeoriyaShell), та же, что у №2 и №4. Тексты —
 * content/teoriya11.ts, плитки типов — из дерева подтипов.
 */
export function Teoriya11({ vkladka, base }: { vkladka: string; base: string }) {
  const tela = Object.fromEntries(
    RAZDELY_TEORII_11.map((r) => [
      r.id,
      <Telo r={r} trenazher={`${base}/trenazher/`} key={r.id} />,
    ]),
  );
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={RAZDELY_TEORII_11.map((r) => ({ id: r.id, title: r.title }))}
      tela={tela}
      dekor={{
        kartinka: <IkonkaRazdela section="DP" className="z11-dekor" />,
        note: 'Таблица — половина решения',
      }}
      trackKey={PROGRESS_11.teoriyaKey}
    />
  );
}
