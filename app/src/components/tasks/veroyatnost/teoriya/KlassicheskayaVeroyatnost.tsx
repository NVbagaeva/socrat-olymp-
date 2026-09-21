import type { ReactNode } from 'react';
import Image from 'next/image';
import { AlertIcon } from '@/components/ui';
import { KLASSICHESKAYA } from '@/content/veroyatnost-teoriya';
import { typeset } from '@/lib/tex';
import { voprosyPonimaniya } from '@/lib/veroyatnost/teoriya-ponimanie';
import { HintIcon } from '../../prep/PrepIcons';
import { KostIcon, TreugolnikIcon, ZakladkaIcon } from './IkonkiTeorii';
import { ProverPonimanie } from './ProverPonimanie';

/**
 * Раздел теории «Классическая вероятность» — второй раздел вкладки.
 *
 * Шесть карточек в два ряда по макету: определение, почему вероятность
 * не больше единицы, разобранный пример, равновозможные исходы,
 * самопроверка и признаки такой задачи на экзамене.
 *
 * Обозначения — как во всём задании №4: $m$ — благоприятные исходы,
 * $n$ — все равновозможные. В макете буквы стояли наоборот; тексты в
 * конфиге приведены к принятой записи, иначе теория разошлась бы с
 * разборами задач.
 *
 * Тексты и формулы — из конфига раздела, формулы набираются KaTeX на
 * сборке. Верного ответа самопроверки здесь нет: блок получает
 * вопросы с отпечатками (lib/veroyatnost/teoriya-ponimanie).
 */

/** Строка с формулами внутри текста. */
function Stroka({ tex, className }: { tex: string; className: string }) {
  return <p className={className} dangerouslySetInnerHTML={{ __html: typeset(tex, true) }} />;
}

/** Формула отдельной строкой в рамке — общая для карточек теории. */
function Formula({ tex }: { tex: string }) {
  return <Stroka tex={tex} className="vteor-formula" />;
}

/**
 * Заголовок с формулой: знак препинания сразу после формулы не
 * отрывается от неё — «P(A) ≤ 1?» переносится целиком, а не так,
 * что вопросительный знак остаётся на новой строке один.
 */
function zagolovokSFormuloy(text: string): string {
  return typeset(
    text.replace(/(\$[^$]+\$)([?!.,:;])/g, '<span class="vklass__nerazryv">$1$2</span>'),
    true,
  );
}

/** Заголовок карточки со значком. */
function Zagolovok({ znak, children }: { znak: ReactNode; children: ReactNode }) {
  return (
    <h4 className="vklass__title">
      <span className="vklass__ico" aria-hidden="true">
        {znak}
      </span>
      {children}
    </h4>
  );
}

export function KlassicheskayaVeroyatnost() {
  const { lead, opredelenie, pochemu, primer, ravnovozmozhnye, kakUznat } = KLASSICHESKAYA;

  return (
    <>
      <p className="vteor-blok__lead">{lead}</p>

      <ul className="vklass__grid">
        {/* ── Определение и формула ──────────────────────────────── */}
        <li className="vklass">
          <Zagolovok znak={<ZakladkaIcon />}>{opredelenie.title}</Zagolovok>
          <Stroka className="vklass__vrezka" tex={opredelenie.text} />
          <Formula tex={opredelenie.formula} />
          <ul className="vklass__bukvy">
            {opredelenie.bukvy.map((bukva) => (
              <li key={bukva.id}>
                <Stroka className="vklass__bukva" tex={bukva.text} />
              </li>
            ))}
          </ul>
          <Stroka className="vklass__snoska" tex={opredelenie.plashka} />
        </li>

        {/* ── Почему вероятность не больше единицы ───────────────── */}
        <li className="vklass">
          <Zagolovok
            znak={
              <span className="vklass__znak vklass__znak--accent">
                <AlertIcon />
              </span>
            }
          >
            <span dangerouslySetInnerHTML={{ __html: zagolovokSFormuloy(pochemu.title) }} />
          </Zagolovok>
          <p className="vklass__text">{pochemu.text}</p>
          <Formula tex={pochemu.formula} />
          <p className="vklass__vyvod">{pochemu.vyvod}</p>
          <p className="vklass__snoska">
            <b className="vklass__snoska-label">{pochemu.ravna.label}</b>
            {pochemu.ravna.text}
          </p>
        </li>

        {/* ── Разобранный пример ─────────────────────────────────── */}
        <li className="vklass">
          <Zagolovok znak={<ZakladkaIcon />}>{primer.title}</Zagolovok>
          <p className="vklass__text">{primer.usloviye}</p>

          <div className="vklass-primer">
            <Image
              className="vklass-primer__foto"
              src={primer.kartinka.src}
              alt={primer.kartinka.alt}
              width={primer.kartinka.width}
              height={primer.kartinka.height}
            />
            <div className="vklass-primer__schet">
              {primer.schet.map((stroka) => (
                <Stroka key={stroka} className="vklass-primer__stroka" tex={stroka} />
              ))}
              <Stroka className="vklass-primer__itog" tex={primer.itog} />
            </div>
          </div>

          <div className="vklass-nelzya">
            <h5 className="vklass-nelzya__title">
              <span className="vklass__znak vklass__znak--accent" aria-hidden="true">
                <TreugolnikIcon />
              </span>
              {primer.nelzya.title}
            </h5>
            <div className="vklass-nelzya__ryad">
              <Stroka className="vklass-nelzya__formula" tex={primer.nelzya.formula} />
              <p className="vklass-nelzya__metka">{primer.nelzya.metka}</p>
            </div>
            <p className="vklass__text">{primer.nelzya.text}</p>
          </div>
        </li>

        {/* ── Равновозможные исходы ──────────────────────────────── */}
        <li className="vklass">
          <Zagolovok znak={<KostIcon />}>{ravnovozmozhnye.title}</Zagolovok>
          <p className="vklass__text">{ravnovozmozhnye.text}</p>
          <p className="vklass__text">
            <b>{ravnovozmozhnye.primerLabel}</b> {ravnovozmozhnye.primer}
          </p>
          <figure className="vklass-kosti">
            <Image
              className="vklass-kosti__foto"
              src={ravnovozmozhnye.kartinka.src}
              alt={ravnovozmozhnye.kartinka.alt}
              width={ravnovozmozhnye.kartinka.width}
              height={ravnovozmozhnye.kartinka.height}
            />
            <figcaption className="vklass-kosti__plashka">{ravnovozmozhnye.plashka}</figcaption>
          </figure>
          <p className="vklass__snoska">{ravnovozmozhnye.snoska}</p>
        </li>

        {/* ── Самопроверка ───────────────────────────────────────── */}
        <li className="vklass">
          <ProverPonimanie voprosy={voprosyPonimaniya()} />
        </li>

        {/* ── Признаки такой задачи на экзамене ──────────────────── */}
        <li className="vklass">
          <Zagolovok znak={<HintIcon />}>{kakUznat.title}</Zagolovok>
          <p className="vklass__text">{kakUznat.text}</p>
          <ol className="vklass-shagi">
            {kakUznat.shagi.map((shag, i) => (
              <li className="vklass-shag" key={shag}>
                <span className="vklass-shag__no" aria-hidden="true">
                  {i + 1}
                </span>
                <span>{shag}</span>
              </li>
            ))}
          </ol>
          <p className="vklass__snoska">{kakUznat.snoska}</p>
        </li>
      </ul>
    </>
  );
}
