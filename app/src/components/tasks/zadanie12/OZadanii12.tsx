import { createHash } from 'node:crypto';
import Link from 'next/link';
import { FORMULY12, SHAPKA12, TIPY12_OPASNO, VIDY12_TON } from '@/content/zadanie12';
import { OPORNYE } from '@/content/opornye';
import { findSection } from '@/content/sections';
import { skillTitle } from '@/content/skills12';
import { functionTypes } from '@/data/functionTypes';
import { assetUrl } from '@/lib/assetUrl';
import { href, ZADANIYA } from '@/lib/paths';
import { typeset } from '@/lib/tex';
import { podtemaNabora } from '@/lib/ves12/trenazher12';
import { katalog12 } from '@/lib/ves12/trening/katalog';
import { primer12 } from '@/lib/ves12/trening/primer';
import { FormulyRamka, KartaGruppa, KartaShapka, KartaTip } from '../karta';
import { YakorTipa } from '../karta/YakorTipa';
import { RazdelIkonka } from '../razdely/RazdelIkonka';
import { ikonkaRazdela } from '../razdely/ikonka';
import { podtemaVkladki } from '../razdely/razdely12';
import { GruppaProgress12 } from './GruppaProgress12';
import { Primer12, PrimerLazy12 } from './Primer12';

/**
 * Вкладка «О задании» узла №12: карта задания по типам («Стеклянная
 * сцена», общие компоненты components/tasks/karta — как у №7, №6, №3).
 *
 * Шапка (что проверяет, балл, минуты, чем опасно) с обложкой раздела,
 * семь видов функций группами — у каждой крупная плитка вида, прогресс
 * ученика и ссылка на весь раздел вида; внутри — 42 типа (наборы движка)
 * с разобранным примером: условие, закреплённый чертёж, шаги, «Где
 * теряют балл». Внизу — «Что нужно знать». Кодов наборов на карте нет.
 */

/** Якорь типа: «12Q.B» → «12Q-B» (точка в id не годится для адреса). */
export function yakorTipa12(nabor: string): string {
  return nabor.replace('.', '-');
}

export function tipTrenazherHref12(nabor: string): string {
  return `${ZADANIYA}/12/trenazher/?tip=${encodeURIComponent(nabor)}`;
}

export function OZadanii12() {
  const section = findSection('12');
  const katalog = katalog12();
  const vidNabora = podtemaNabora();
  const nabory = Object.keys(katalog);
  /* Версия файлов примеров: меняется вместе с ними (кеш браузера). */
  const primery = Object.fromEntries(nabory.map((n) => [n, primer12(katalog, n)]));
  const versiya = createHash('sha1').update(JSON.stringify(primery)).digest('hex').slice(0, 10);

  const vidy = functionTypes
    .map((vid) => ({ vid, nabory: nabory.filter((n) => vidNabora[n] === vid.id) }))
    .filter((v) => v.nabory.length > 0);

  return (
    <div className="kz z12-karta">
      <YakorTipa />
      <KartaShapka
        nadzagolovok={SHAPKA12.nadzagolovok}
        zagolovok={SHAPKA12.zagolovok}
        lead={SHAPKA12.lead}
        fakty={SHAPKA12.fakty(nabory.length, vidy.length)}
        opasnoTitle={SHAPKA12.opasnoTitle}
        opasno={SHAPKA12.opasno.map((line) => typeset(line))}
        oblozhka={
          /* Обложка раздела — готовая картинка, как есть: без обрезки и
             пережатия, прозрачный фон на стекле шапки. */
          <img
            src={assetUrl('/images/task-12.webp')}
            alt={SHAPKA12.oblozhkaAlt}
            width={512}
            height={512}
            decoding="async"
          />
        }
      />

      <section className="kz-razdel" aria-labelledby="z12-gruppy-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z12-gruppy-title">
            {SHAPKA12.gruppyTitle}
          </h3>
          <p className="stk-lead">{SHAPKA12.gruppyLead}</p>
        </div>
        <div className="kz-gruppy">
          {vidy.map(({ vid, nabory: tipy }, gi) => {
            const subtopic = section?.subtopics.find((s) => s.id === vid.id);
            const vidHref = href(ZADANIYA, '12', vid.id);
            const opornyeHref =
              subtopic !== undefined && podtemaVkladki(subtopic).prep
                ? `${vidHref}${OPORNYE.tail}`
                : vidHref;
            return (
              <KartaGruppa
                key={vid.id}
                id={vid.id}
                nazvanie={vid.title}
                znakHtml=""
                znak={
                  <RazdelIkonka
                    icon={ikonkaRazdela('12', vid.icon)}
                    sizes="(min-width: 768px) 132px, 104px"
                    eager={gi < 2}
                  />
                }
                ton={VIDY12_TON[vid.id] ?? 'blue'}
                tipov={tipy.length}
                progress={<GruppaProgress12 nabory={tipy} />}
                labels={SHAPKA12}
                open={gi === 0}
              >
                <Link className="stk-ssylka z12-vid-ssylka" href={vidHref}>
                  {SHAPKA12.vidOtkryt(vid.title)} <span aria-hidden="true">→</span>
                </Link>
                {tipy.map((nabor, i) => {
                  const open = gi === 0 && i === 0;
                  const opasno = TIPY12_OPASNO[nabor];
                  const props = {
                    opasnoHtml: opasno === undefined ? undefined : typeset(opasno),
                    trenirovatHref: tipTrenazherHref12(nabor),
                    opornyeHref,
                  };
                  const primer = primery[nabor];
                  return (
                    <KartaTip
                      key={nabor}
                      id={yakorTipa12(nabor)}
                      nazvanieHtml={typeset(skillTitle[nabor] ?? nabor)}
                      open={open}
                    >
                      {/* Раскрытый с самого начала пример — в разметке;
                          остальные приезжают файлом по раскрытию. */}
                      {open && primer !== null && primer !== undefined ? (
                        <Primer12 primer={primer} {...props} />
                      ) : (
                        <PrimerLazy12 nabor={nabor} versiya={versiya} {...props} />
                      )}
                    </KartaTip>
                  );
                })}
              </KartaGruppa>
            );
          })}
        </div>
      </section>

      <section className="kz-razdel kz-znat" aria-labelledby="z12-znat-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z12-znat-title">
            {SHAPKA12.znatTitle}
          </h3>
          <p className="stk-lead">{SHAPKA12.znatLead}</p>
        </div>
        <div className="kz-znat__setka">
          {FORMULY12.map((g) => (
            <FormulyRamka
              key={g.vid}
              nazvanie={functionTypes.find((t) => t.id === g.vid)?.title ?? g.vid}
              ton={VIDY12_TON[g.vid] ?? 'blue'}
              formuly={g.formuly.map((f) => ({
                html: typeset(`$${f.tex}$`),
                primerHtml: typeset(`$${f.primer}$`),
              }))}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
