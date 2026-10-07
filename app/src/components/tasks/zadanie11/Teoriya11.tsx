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

/** Подпункты раздела в содержании: что есть в теле раздела, по порядку. */
export function podpunkty(r: RazdelTeorii11): { id: string; title: string }[] {
  const out: { id: string; title: string }[] = [];
  if (r.vvedenie) out.push({ id: `${r.id}-opredelenie`, title: 'Определение' });
  if (r.formula) out.push({ id: `${r.id}-formula`, title: 'Главная формула' });
  if (r.tablitsa || r.paraTablits) out.push({ id: `${r.id}-tablitsa`, title: 'Таблица' });
  if (r.zapomnit || r.layfhaki.length > 0) {
    out.push({ id: `${r.id}-layfhaki`, title: 'Лайфхаки' });
  }
  if (r.lovushki.length > 0) out.push({ id: `${r.id}-lovushki`, title: 'Ловушки' });
  if (r.section) out.push({ id: `${r.id}-tipy`, title: 'Типы задач' });
  return out;
}

/** Строчная формула набором KaTeX с крупными дробями. */
function Strochno({ tex, className }: { tex: string; className?: string }) {
  const html = katex.renderToString(tex, { throwOnError: true, displayFrac: true });
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Главная формула с легендой и карточками-следствиями (макет
 * teoriya-smesi.png): слева формула и цветные метки обозначений,
 * справа — две формулы, выраженные из неё, со стрелками.
 */
function FormulaSoSledstviyami({ r }: { r: RazdelTeorii11 }) {
  const f = r.formula;
  if (!f) {
    return null;
  }
  return (
    <section className="z11-card z11-glavnaya" id={`${r.id}-formula`}>
      <h4 className="z11-card__title">
        <Piktogramma name="book" className="z11-card__icon" />
        Главная формула
      </h4>
      <div className="z11-glavnaya__body">
        <div className="z11-glavnaya__formula">
          <Krupno className="z11-card__formula" tex={f.tex} />
          {f.legenda ? (
            <ul className="z11-legenda z11-legenda--tsvet">
              {f.legenda.map((l) => (
                <li key={l.tex} className={`z11-legenda__item z11-metka--${l.tsvet}`}>
                  <span className="z11-legenda__dot" aria-hidden="true" />
                  <Strochno tex={l.tex} className="z11-legenda__tex" />
                  <span>
                    — <Tex text={l.text} />
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="z11-card__podpis">
            <Tex text={f.podpis} />
          </p>
        </div>
        {f.sledstviya ? (
          <ul className="z11-sledstviya">
            {f.sledstviya.map((sl, i) => (
              <li key={sl.title} className={`z11-sledstvie z11-sledstvie--${i}`}>
                <Piktogramma name="arrow" className="z11-sledstvie__arrow" />
                <span className="z11-sledstvie__title">{sl.title}:</span>
                <Krupno className="z11-sledstvie__tex" tex={sl.tex} />
                <span className="z11-sledstvie__podpis">{sl.podpis}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

/** Жёлтый лайфхак «как запомнить»: треугольник формулы. */
function Zapomnit({ z }: { z: NonNullable<RazdelTeorii11['zapomnit']> }) {
  return (
    <section className="z11-card z11-zapomnit">
      <h4 className="z11-card__title">
        <Piktogramma name="bulb" className="z11-card__icon" />
        {z.title}
      </h4>
      <div className="z11-zapomnit__body">
        <div
          className="z11-treug"
          role="img"
          aria-label="Треугольник: масса вещества сверху, масса раствора и p/100 снизу"
        >
          <svg viewBox="0 0 200 170" aria-hidden="true" focusable="false">
            <polygon className="z11-treug__verh" points="100,8 48,95 152,95" />
            <polygon className="z11-treug__levo" points="48,95 8,162 100,162 100,95" />
            <polygon className="z11-treug__pravo" points="100,95 100,162 192,162 152,95" />
            <polygon className="z11-treug__kontur" points="100,8 8,162 192,162" />
            <path className="z11-treug__kontur" d="M48 95H152M100 95V162" />
          </svg>
          <Strochno tex={z.verh} className="z11-treug__m z11-treug__m--verh" />
          <Strochno tex={z.niz[0]} className="z11-treug__m z11-treug__m--levo" />
          <Strochno tex={z.niz[1]} className="z11-treug__m z11-treug__m--pravo" />
        </div>
        <div className="z11-zapomnit__text">
          <p className="z11-zapomnit__pravilo">
            <Tex text={z.pravilo} />
          </p>
          <p className="z11-zapomnit__sovet">
            <Tex text={z.sovet} />
          </p>
        </div>
      </div>
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
        <section className="z11-card z11-vved" id={`${r.id}-opredelenie`}>
          <h4 className="z11-card__title">
            <Piktogramma name="flag" className="z11-card__icon" />
            {r.vvedenie.title}
          </h4>
          <p className="z11-vved__opredelenie">
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

      {r.formula?.sledstviya ? (
        <div className="z11-teor__formula-ryad">
          <FormulaSoSledstviyami r={r} />
          {r.zapomnit ? (
            <div id={`${r.id}-layfhaki`}>
              <Zapomnit z={r.zapomnit} />
            </div>
          ) : null}
        </div>
      ) : null}

      {r.paraTablits ? (
        <div className="z11-teor__para" id={`${r.id}-tablitsa`}>
          {r.paraTablits.map((pt) => (
            <section className="z11-card" key={pt.title}>
              <h4 className="z11-card__title">
                <Piktogramma name="table" className="z11-card__icon" />
                {pt.title}
              </h4>
              <p className="z11-card__lead">
                <Tex text={pt.primer} />
              </p>
              <Tablitsa11 table={pt.table} />
              <p className="z11-card__note">
                <Tex text={pt.note} />
              </p>
            </section>
          ))}
        </div>
      ) : null}

      {(r.formula && !r.formula.sledstviya) || r.tablitsa ? (
        <div
          className={
            r.tablitsa?.legenda ? 'z11-teor__pair z11-teor__pair--stack' : 'z11-teor__pair'
          }
        >
          {r.formula && !r.formula.sledstviya ? (
            <section className="z11-card" id={`${r.id}-formula`}>
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
            <section className="z11-card" id={`${r.id}-tablitsa`}>
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
        <div
          className={polnyy ? 'z11-teor__stack' : 'z11-teor__grid'}
          id={r.zapomnit ? undefined : `${r.id}-layfhaki`}
        >
          {r.layfhaki.map((id) => (
            <KartaLayfhak id={id} polnyy={polnyy} key={id} />
          ))}
        </div>
      ) : null}

      {r.lovushki.length > 0 ? (
        <div className="z11-teor__grid" id={`${r.id}-lovushki`}>
          {r.lovushki.map((id) => (
            <KartaLovushka id={id} key={id} />
          ))}
        </div>
      ) : null}

      {tipy.length > 0 ? (
        <section className="z11-tipy" aria-label="Типы задач этого раздела" id={`${r.id}-tipy`}>
          <h4 className="z11-tipy__title">
            <Piktogramma name="grid" />
            Типы задач этого раздела
          </h4>
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
      razdely={RAZDELY_TEORII_11.map((r) => ({
        id: r.id,
        title: r.title,
        podpunkty: podpunkty(r),
      }))}
      tela={tela}
      dekor={{
        kartinka: <IkonkaRazdela section="DP" className="z11-dekor" />,
        note: 'Таблица — половина решения',
      }}
      trackKey={PROGRESS_11.teoriyaKey}
    />
  );
}
