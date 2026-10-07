import Image from 'next/image';
import Link from 'next/link';
import { Details } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { TeoriyaShell } from '@/components/tasks/veroyatnost/teoriya/TeoriyaShell';
import {
  LAYFHAKI,
  LOVUSHKI,
  RAZDELY_TEORII_11,
  TEORIYA_11,
  type Priem,
  type RazdelTeorii11,
} from '@/content/teoriya11';
import { OPORNYE } from '@/content/opornye';
import { O_ZADANII_11, PROGRESS_11, VSTUPLENIYA_11 } from '@/content/zadanie11';
import { katex } from '@/lib/graph/katex';
import { typeset } from '@/lib/tex';
import { BLOKI } from '@/lib/zadanie11/prep/bloki';
import { kodNaSayte } from '@/lib/zadanie11/taxonomy';
import { SUBTYPES } from '@/lib/zadanie11/prototypes';
import type { LifehackId, SectionId } from '@/lib/zadanie11/types';
import {
  IkonkaBloka,
  IkonkaRazdela,
  MiniKartinka,
  Piktogramma,
  tsvetRazdela,
  Zvezdy,
} from './Piktogrammy';
import { PoprobuySam11 } from './PoprobuySam11';
import { Tablitsa11 } from './Tablitsa11';

/** Разделы с задачами — без вступления и сводных списков. */
const RAZDELY_ZADACH = RAZDELY_TEORII_11.filter((r) => r.section);

/**
 * В каком разделе карточка лайфхака или ловушки встречается впервые:
 * там она получает якорь (#layfhak-id, #lovushka-id), туда ведут
 * сводные списки и ссылки из тренажёра. Повторы в других разделах —
 * без якоря: один id на странице.
 */
function pervyeVhozhdeniya(key: 'layfhaki' | 'lovushki'): Map<string, RazdelTeorii11> {
  const out = new Map<string, RazdelTeorii11>();
  for (const r of RAZDELY_TEORII_11.filter((x) => x.id !== 'layfhaki' && x.id !== 'lovushki')) {
    for (const id of r[key]) {
      if (!out.has(id)) out.set(id, r);
    }
  }
  return out;
}
const PERVYY_LAYFHAK = pervyeVhozhdeniya('layfhaki');
const PERVAYA_LOVUSHKA = pervyeVhozhdeniya('lovushki');

/** Формула крупно (display), набранная на сервере. */
function Krupno({ tex, className }: { tex: string; className?: string }) {
  const html = katex.renderToString(tex, { throwOnError: true, displayMode: true });
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function KartaLayfhak({ id, yakor }: { id: LifehackId; yakor: boolean }) {
  const l = LAYFHAKI[id];
  return (
    <section className="z11-card z11-card--layfhak" id={yakor ? `layfhak-${id}` : undefined}>
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
      <Details title="Как это работает">
        <ol className="z11-card__steps">
          {l.shagi.map((s) => (
            <li key={s}>
              <Tex text={s} />
            </li>
          ))}
        </ol>
      </Details>
      {id === 'fast-count' ? (
        <a className="z11-card__link" href="#teoriya-bystryy-schet">
          <Piktogramma name="bolt" />
          {TEORIYA_11.kBystromu}
        </a>
      ) : null}
    </section>
  );
}

function KartaLovushka({ id, yakor }: { id: string; yakor: boolean }) {
  const l = LOVUSHKI[id];
  if (!l) {
    return null;
  }
  return (
    <section className="z11-card z11-card--lovushka" id={yakor ? `lovushka-${id}` : undefined}>
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

/**
 * Подпункты раздела в содержании — одна схема для всех разделов с
 * задачами: Что это и зачем → Формулы → Таблица → Лайфхаки → Ловушки →
 * Типы задач → Теперь — задачи (чего нет в разделе, то скрыто). У
 * вводного раздела и «Быстрого счёта» — свои пункты.
 */
export function podpunkty(r: RazdelTeorii11): { id: string; title: string }[] {
  const out: { id: string; title: string }[] = [];
  if (r.priemy) {
    return r.priemy.map((p) => ({ id: `${r.id}-${p.id}`, title: p.kratko }));
  }
  if (r.section) out.push({ id: `${r.id}-vstup`, title: TEORIYA_11.vstup.title });
  if (r.idei.length > 0 && !r.section) {
    out.push({ id: `${r.id}-idei`, title: r.ideiTitle ?? TEORIYA_11.idei });
  }
  if (r.formula) out.push({ id: `${r.id}-formula`, title: 'Формулы' });
  if (r.tablitsa || r.paraTablits) {
    out.push({ id: `${r.id}-tablitsa`, title: r.section ? 'Таблица' : 'Три таблицы' });
  }
  if (r.kartochki && !r.section) out.push({ id: `${r.id}-kartochki`, title: 'ОДЗ и смысл задачи' });
  if (r.zapomnit || r.layfhaki.length > 0) {
    out.push({ id: `${r.id}-layfhaki`, title: 'Лайфхаки' });
  }
  if (r.lovushki.length > 0) out.push({ id: `${r.id}-lovushki`, title: 'Ловушки' });
  if (r.section) {
    out.push({ id: `${r.id}-tipy`, title: 'Типы задач' });
    out.push({ id: `${r.id}-teper`, title: TEORIYA_11.teper.title });
  }
  return out;
}

/** Строчная формула набором KaTeX с крупными дробями. */
function Strochno({ tex, className }: { tex: string; className?: string }) {
  const html = katex.renderToString(tex, { throwOnError: true, displayFrac: true });
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** «Что это и зачем» — то же вступление, что в карточке на «О задании». */
function Vstup({ r }: { r: RazdelTeorii11 & { section: SectionId } }) {
  const v = VSTUPLENIYA_11[r.section];
  const { vstup } = TEORIYA_11;
  return (
    <section className="z11-vstup z11-vstup--teor" id={`${r.id}-vstup`}>
      <div className="z11-vstup__blok">
        <p className="z11-vstup__label">{vstup.chto}</p>
        <p className="z11-vstup__chto">
          <Tex text={v.chto} />
        </p>
      </div>
      <div className="z11-vstup__blok">
        <p className="z11-vstup__label">{vstup.zachem}</p>
        <p className="z11-vstup__text">
          <Tex text={v.zachem} />
        </p>
      </div>
      <div className="z11-vstup__blok">
        <p className="z11-vstup__label">{vstup.glavnoe}</p>
        <ol className="z11-vstup__glavnoe">
          {v.glavnoe.map((t) => (
            <li key={t}>
              <Tex text={t} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/**
 * «Теперь — задачи»: опорные блоки раздела (свои и те, что нужны перед
 * ним — O_ZADANII_11.pered) и кнопка в тренажёр по типам раздела.
 */
function Teper({ r, base }: { r: RazdelTeorii11 & { section: SectionId }; base: string }) {
  const pered = O_ZADANII_11.pered[r.section] ?? [];
  const bloki = BLOKI.filter((b) => b.razdel === r.section || pered.includes(b.nazvanie));
  const tipy = SUBTYPES.filter((st) => st.section === r.section);
  const t = TEORIYA_11.teper;
  return (
    <section className="z11-card z11-teper" id={`${r.id}-teper`}>
      <h4 className="z11-card__title">
        <Piktogramma name="flag" className="z11-card__icon" />
        {t.title}
      </h4>
      <p className="z11-card__lead">{t.lead}</p>
      {bloki.length === 0 ? null : (
        <ul className="z11-teper__bloki">
          {bloki.map((b) => (
            <li key={b.id}>
              <Link className="z11-teper__blok" href={`${base}/${OPORNYE.tail}${b.slug}/`}>
                <IkonkaBloka razdel={b.razdel} className="z11-teper__ikonka" />
                <span className="z11-teper__name">{b.nazvanie}</span>
                <span className="z11-teper__count">{t.zadach(b.zadachi.length)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link
        className="btn btn--primary z11-teper__go"
        href={`${base}/trenazher/?tipy=${tipy.map((st) => st.id).join(',')}`}
      >
        <Piktogramma name="play" />
        {t.reshat(tipy.length)}
      </Link>
    </section>
  );
}

/** Приём быстрого счёта: правило → пример → «попробуй сам». */
function KartaPriem({ r, p }: { r: RazdelTeorii11; p: Priem }) {
  const t = TEORIYA_11.priem;
  return (
    <section className="z11-card z11-priem" id={`${r.id}-${p.id}`}>
      <h4 className="z11-card__title">
        <Piktogramma name="bolt" className="z11-card__icon" />
        {p.title}
      </h4>
      <div className="z11-priem__zony">
        <div className="z11-priem__zona">
          <p className="z11-priem__label">{t.pravilo}</p>
          <p className="z11-priem__text">
            <Tex text={p.pravilo} />
          </p>
        </div>
        <div className="z11-priem__zona z11-priem__zona--primer">
          <p className="z11-priem__label">{t.primer}</p>
          <ol className="z11-priem__primer">
            {p.primer.map((line) => (
              <li key={line}>
                <Tex text={line} />
              </li>
            ))}
          </ol>
        </div>
        <div className="z11-priem__zona z11-priem__zona--sam">
          <p className="z11-priem__label">{t.poprobuy}</p>
          <PoprobuySam11
            zadaniya={p.poprobuy.map((z) => ({ qHtml: typeset(z.q), otvet: z.otvet }))}
          />
        </div>
      </div>
    </section>
  );
}

/** Сводный список лайфхаков или ловушек: одна строка — ссылка в раздел. */
function Svod({ vid }: { vid: 'layfhaki' | 'lovushki' }) {
  const items =
    vid === 'layfhaki'
      ? Object.values(LAYFHAKI).map((l) => ({
          id: l.id,
          title: l.title,
          text: l.lead,
          razdel: PERVYY_LAYFHAK.get(l.id),
          href: `#layfhak-${l.id}`,
        }))
      : Object.values(LOVUSHKI).map((l) => ({
          id: l.id,
          title: l.title,
          text: l.text,
          razdel: PERVAYA_LOVUSHKA.get(l.id),
          href: `#lovushka-${l.id}`,
        }));
  return (
    <ul className={`z11-svod z11-svod--${vid}`}>
      {items.map((it) => (
        <li key={it.id} className="z11-svod__item">
          <Piktogramma name={vid === 'layfhaki' ? 'bulb' : 'alert'} className="z11-svod__ikonka" />
          <span className="z11-svod__body">
            <a className="z11-svod__title" href={it.razdel === undefined ? undefined : it.href}>
              {it.title}
            </a>
            <span className="z11-svod__text">
              <Tex text={it.text} />
            </span>
            {it.razdel === undefined ? null : (
              <span className="z11-svod__razdel">
                {TEORIYA_11.svod.vRazdele} «{it.razdel.title}»
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
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
    <section className="z11-card z11-glavnaya">
      <h4 className="z11-blok-title">Главная формула</h4>
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

function Telo({ r, base }: { r: RazdelTeorii11; base: string }) {
  const tipy = r.section ? SUBTYPES.filter((st) => st.section === r.section) : [];
  const sSektsiey = r.section ? (r as RazdelTeorii11 & { section: SectionId }) : null;
  if (r.id === 'layfhaki' || r.id === 'lovushki') {
    return (
      <div className="z11-teor">
        <div className="z11-teor__lead">
          <p>
            <Tex text={r.lead} />
          </p>
        </div>
        <p className="z11-svod__lead">{TEORIYA_11.svod[r.id]}</p>
        <Svod vid={r.id} />
      </div>
    );
  }
  return (
    <div className={`z11-teor${r.section ? ` ${tsvetRazdela(r.section)}` : ''}`}>
      <div className="z11-teor__lead">
        {r.section ? <IkonkaRazdela section={r.section} className="z11-teor__icon" /> : null}
        <p>
          <Tex text={r.lead} />
        </p>
      </div>

      {sSektsiey ? <Vstup r={sSektsiey} /> : null}

      {r.vvedenie ? (
        <section className="z11-card z11-vved">
          <h4 className="z11-blok-title">{r.vvedenie.title}</h4>
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

      {r.idei.length > 0 && !r.section ? (
        <section className="z11-card z11-card--idei" id={`${r.id}-idei`}>
          <h4 className="z11-card__title">
            <Piktogramma name="flag" className="z11-card__icon" />
            {r.ideiTitle ?? TEORIYA_11.idei}
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

      {r.formula?.sledstviya ? (
        <div className="z11-teor__formula-ryad" id={`${r.id}-formula`}>
          <FormulaSoSledstviyami r={r} />
          {r.zapomnit ? (
            <div id={`${r.id}-layfhaki`}>
              <Zapomnit z={r.zapomnit} />
            </div>
          ) : null}
        </div>
      ) : null}

      {r.paraTablits ? (
        <div
          className={`z11-teor__para z11-teor__para--${r.paraTablits.length}`}
          id={r.tablitsa ? undefined : `${r.id}-tablitsa`}
        >
          {r.paraTablits.map((pt) => (
            <section className="z11-card" key={pt.title}>
              <h4 className="z11-card__title">
                <Piktogramma name="table" className="z11-card__icon" />
                <Tex text={pt.title} />
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

      {r.idei.length > 0 && r.section ? (
        <section className="z11-card z11-card--idei">
          <h4 className="z11-card__title">
            <Piktogramma name="flag" className="z11-card__icon" />
            {r.ideiTitle ?? TEORIYA_11.idei}
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
        <div className="z11-teor__grid" id={r.section ? undefined : `${r.id}-kartochki`}>
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

      {r.priemy ? (
        <div className="z11-teor__stack">
          {r.priemy.map((p) => (
            <KartaPriem r={r} p={p} key={p.id} />
          ))}
        </div>
      ) : null}

      {r.layfhaki.length > 0 ? (
        <div className="z11-teor__grid" id={r.zapomnit ? undefined : `${r.id}-layfhaki`}>
          {r.layfhaki.map((id) => (
            <KartaLayfhak id={id} yakor={PERVYY_LAYFHAK.get(id) === r} key={id} />
          ))}
        </div>
      ) : null}

      {r.lovushki.length > 0 ? (
        <div className="z11-teor__grid" id={`${r.id}-lovushki`}>
          {r.lovushki.map((id) => (
            <KartaLovushka id={id} yakor={PERVAYA_LOVUSHKA.get(id) === r} key={id} />
          ))}
        </div>
      ) : null}

      {tipy.length > 0 ? (
        <section className="z11-tipy" aria-label="Типы задач этого раздела" id={`${r.id}-tipy`}>
          <h4 className="z11-tipy__title">Типы задач этого раздела</h4>
          <ul className="z11-tipy__list">
            {tipy.map((st) => (
              <li className="z11-tip" key={st.id} title={kodNaSayte(st.id)}>
                <MiniKartinka id={st.id} section={st.section} className="z11-tip__pic" />
                <span className="z11-tip__body">
                  <span className="z11-tip__title">{st.title}</span>
                  <span className="z11-tip__foot">
                    <Zvezdy level={st.level} />
                    <Link
                      className="btn btn--secondary btn--sm z11-tip__btn"
                      href={`${base}/trenazher/?tip=${st.id}`}
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

      {sSektsiey ? <Teper r={sSektsiey} base={base} /> : null}
    </div>
  );
}

/**
 * Вкладка «Теория» задания №11 (макет docs/mockups/zadanie-11/
 * teoriya.png): разделы подряд, содержание рядом — общая оболочка
 * теории (TeoriyaShell), та же, что у №2 и №4. Тексты —
 * content/teoriya11.ts, плитки типов — из дерева подтипов. У каждого
 * раздела с задачами одна схема: что это и зачем → формулы → таблица
 * → лайфхаки → ловушки → типы задач → «Теперь — задачи».
 */
export function Teoriya11({ vkladka, base }: { vkladka: string; base: string }) {
  const tela = Object.fromEntries(
    RAZDELY_TEORII_11.map((r) => [r.id, <Telo r={r} base={base} key={r.id} />]),
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

export { RAZDELY_ZADACH };
