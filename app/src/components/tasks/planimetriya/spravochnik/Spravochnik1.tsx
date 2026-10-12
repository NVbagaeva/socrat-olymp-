import { Tex } from '@/components/ui/Tex';
import { TeoriyaShell } from '@/components/tasks/veroyatnost/teoriya/TeoriyaShell';
import {
  BLOKI_SPRAVOCHNIKA,
  KAK_POLZOVATSYA_1,
  RAZDELY_SPRAVOCHNIKA_1,
  SPRAVOCHNIK_1,
  type Razdel1,
} from '@/content/spravochnik1';
import { PDF_SPRAVOCHNIKA_1 } from '@/content/spravochnik1/pdf';
import { PROGRESS_1 } from '@/content/zadanie1';
import { chertezhTemy } from '@/lib/planimetriya/spravochnik-chertezhi';
import { renderPlan } from '@/lib/planimetriya/render';
import { Poisk1 } from './Poisk1';
import { SkachatPdf1 } from './SkachatPdf1';
import { TemaKartochka1 } from './TemaKartochka1';

/** Заголовок темы для содержания: без TeX, «$30^\\circ$» → «30°». */
function bezTex(s: string): string {
  return s.replace(/\$([^$]*)\$/g, (_, f: string) =>
    f.replace(/\^\\circ/g, '°').replace(/\\/g, ''),
  );
}

/** Вид блока легенды → класс цвета (spravochnik1-web.css). */
const VID: Record<string, string> = {
  opredeleniya: 'def',
  svoystva: 'svo',
  priznaki: 'pri',
  teoremy: 'teo',
  vazhno: 'vaz',
  primery: 'primer',
};

/** «Как пользоваться»: легенда цветов блоков и обозначения. */
function KakPolzovatsya() {
  return (
    <details className="spr1-kak">
      <summary className="spr1-kak__title">{KAK_POLZOVATSYA_1.title}</summary>
      <ul className="spr1-kak__legenda">
        {KAK_POLZOVATSYA_1.legenda.map((l) => (
          <li className="spr1-kak__item" key={l.blok}>
            <span className={`spr1-blok__label spr1-kak__label spr1-kak__label--${VID[l.blok]}`}>
              {BLOKI_SPRAVOCHNIKA[l.blok]}
            </span>
            <span className="spr1-kak__tekst">{l.tekst}</span>
          </li>
        ))}
      </ul>
      <p className="spr1-kak__oboznacheniya">
        <strong>{KAK_POLZOVATSYA_1.oboznacheniya.title}.</strong>{' '}
        <Tex text={KAK_POLZOVATSYA_1.oboznacheniya.tekst} />
      </p>
    </details>
  );
}

/** Раздел справочника: вступление и сетка карточек. */
function Razdel({ r, trenazher }: { r: Razdel1; trenazher?: (proto: number) => string }) {
  return (
    <div className="spr1-razdel">
      <p className="spr1-razdel__lead">
        <Tex text={r.lead} />
      </p>
      <ul className="spr1-grid">
        {r.temy.map((t) => (
          <TemaKartochka1 t={t} trenazher={trenazher} key={t.id} />
        ))}
      </ul>
    </div>
  );
}

/**
 * Вкладка «Теория» задания №1 — «Справочник по планиметрии»: 11
 * разделов из одного источника данных (content/spravochnik1).
 *
 * Оболочка — теория №4 и №2 (TeoriyaShell): содержание стоит липкой
 * колонкой, на узком экране его открывает кнопка «Содержание»; у
 * открытого раздела в содержании видны его темы. Под заголовком —
 * подзаголовок, «Скачать справочник» (готовый PDF, с примерами или без), «Как
 * пользоваться» и поиск по темам. Страница
 * серверная: формулы набирает KaTeX, чертежи рисует движок на сборке.
 */
export function Spravochnik1({
  trenazher,
  pdf,
}: {
  trenazher?: (proto: number) => string;
  /** Адрес печатной страницы: «Открыть для печати» под кнопкой «Скачать справочник». */
  pdf?: string;
}) {
  const razdely = RAZDELY_SPRAVOCHNIKA_1.map((r) => ({
    id: r.id,
    title: r.title,
    podpunkty: r.temy.map((t) => ({ id: `k-${t.id}`, title: bezTex(t.title) })),
  }));
  const tela = Object.fromEntries(
    RAZDELY_SPRAVOCHNIKA_1.map((r) => [r.id, <Razdel r={r} trenazher={trenazher} key={r.id} />]),
  );
  const dekor = chertezhTemy('centralnyy-vpisannyy');
  const d = Array.isArray(dekor) ? dekor[0] : dekor;
  return (
    <TeoriyaShell
      vkladka={SPRAVOCHNIK_1.title}
      podZagolovkom={
        <div className="spr1-shapka">
          <div className="spr1-shapka__ryad">
            <p className="spr1-shapka__lead">{SPRAVOCHNIK_1.lead}</p>
            {pdf === undefined ? null : <SkachatPdf1 fayly={PDF_SPRAVOCHNIKA_1} pechat={pdf} />}
          </div>
          <Poisk1 />
          <KakPolzovatsya />
        </div>
      }
      razdely={razdely}
      tela={tela}
      dekor={{
        kartinka:
          d === undefined ? null : (
            <span
              className="pl-wrap z1-dekor spr1-dekor"
              aria-hidden="true"
              dangerouslySetInnerHTML={{
                __html: renderPlan(d.scena, { ...d.optsii, shirina: 200, vysota: 140 }),
              }}
            />
          ),
        note: 'Вписанный угол — половина центрального: с этого начинаются все задачи на окружность.',
      }}
      trackKey={PROGRESS_1.teoriyaKey}
    />
  );
}
