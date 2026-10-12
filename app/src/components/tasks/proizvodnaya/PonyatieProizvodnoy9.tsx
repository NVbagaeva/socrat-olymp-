import Link from 'next/link';
import {
  Abzacy,
  RamkaFormula,
  RamkaOpredelenie,
  RamkaPrimer,
  RamkaVazhno,
  RamkaVyvod,
  RamkaZadacha,
} from '@/components/teoriya/Ramki';
import { Tex } from '@/components/ui/Tex';
import { PONYATIE_9 as T } from '@/content/theoryPonyatie9';
import { href } from '@/lib/paths';
import { stsenaSvg, type StsenaId } from '@/lib/proizvodnaya/stseny';
import { FiguraSvg9 } from './FiguraSvg9';
import { ZhivayaSekushchaya, ZhivayaSkorost, ZhivoyModul } from './ZhivyeRisunki9';

/**
 * Блок теории №9 «Понятие производной» — первый в «Теории». Логика —
 * по конспекту: две задачи (скорость, касательная) приводят к одному
 * пределу, это и есть производная; затем — где производной нет.
 * Тексты — content/theoryPonyatie9.ts, рамки — components/teoriya/Ramki,
 * рисунки — движок №9 (stsenyPonyatiya.ts, osDvizheniya.ts).
 */

function Risunok({ id, label }: { id: StsenaId; label: string }) {
  return (
    <div className="ramka__risunok">
      <FiguraSvg9 svg={stsenaSvg(id)} label={label} />
    </div>
  );
}

function Podrazdel({
  id,
  no,
  title,
  children,
}: {
  id: string;
  no: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rich-sub z9-sub" id={id}>
      <h4 className="rich-sub__title">
        <span className="rich-sub__no">{no}</span>
        <Tex text={title} />
      </h4>
      {children}
    </section>
  );
}

export function PonyatieProizvodnoy9() {
  return (
    <div className="rich z9-teoriya z9-ponyatie">
      <div className="rich-text rich-text--lead">
        <Abzacy paras={T.vvedenie} />
      </div>

      <Podrazdel id={T.razdely.zadachi.id} no="I." title={T.razdely.zadachi.title}>
        <RamkaZadacha no={1} title={T.skorost.title}>
          <Abzacy paras={T.skorost.uslovie} />
          <ZhivayaSkorost />
          <Abzacy paras={T.skorost.hod} />
          <RamkaFormula formula={T.skorost.formula} podpis={T.skorost.formulaPodpis} />
        </RamkaZadacha>

        <RamkaZadacha no={2} title={T.kasatelnaya.title}>
          <RamkaOpredelenie title="Касательная">
            <Abzacy paras={T.kasatelnaya.opredelenie} />
          </RamkaOpredelenie>
          <Risunok id="ponyatie-sekushchie" label="Секущие стремятся к касательной" />
          <RamkaVazhno>
            <Abzacy paras={T.kasatelnaya.vazhno} />
          </RamkaVazhno>
          <Abzacy paras={T.kasatelnaya.ugol} />
          <Risunok
            id="ponyatie-prirashcheniya"
            label="Приращения аргумента и функции, секущая и касательная"
          />
          <Abzacy paras={T.kasatelnaya.hod} />
          <RamkaFormula formula={T.kasatelnaya.formula} podpis={T.kasatelnaya.formulaPodpis} />
          <ZhivayaSekushchaya />
          <p className="ramka__p z9-ssylka">
            <Tex text={T.kasatelnaya.ssylka.text} />{' '}
            <a href={`#${T.kasatelnaya.ssylka.anchor}`}>{T.kasatelnaya.ssylka.link}</a>.
          </p>
        </RamkaZadacha>
      </Podrazdel>

      <Podrazdel id={T.razdely.proizvodnaya.id} no="II." title={T.razdely.proizvodnaya.title}>
        <Abzacy paras={T.proizvodnaya.vvod} />
        <RamkaOpredelenie title="Определение производной" formula={T.proizvodnaya.formula}>
          <Abzacy paras={T.proizvodnaya.opredelenie} />
        </RamkaOpredelenie>
        <RamkaVyvod>
          <Abzacy paras={T.proizvodnaya.vyvod} />
          <p className="ramka__p">
            Подробнее: <a href={`#${T.proizvodnaya.ssylki.fiz}`}>физический смысл производной</a>,{' '}
            <a href={`#${T.proizvodnaya.ssylki.geom}`}>геометрический смысл производной</a>.
          </p>
        </RamkaVyvod>
        <RamkaOpredelenie title="Алгоритм: производная по определению">
          <ol className="ramka__algoritm">
            {T.proizvodnaya.algoritm.map((shag) => (
              <li key={shag}>
                <Tex text={shag} />
              </li>
            ))}
          </ol>
        </RamkaOpredelenie>
        <RamkaPrimer
          title={T.proizvodnaya.primer.title}
          uslovie={T.proizvodnaya.primer.uslovie}
          shagi={T.proizvodnaya.primer.shagi}
          otvet={T.proizvodnaya.primer.otvet}
        />
      </Podrazdel>

      <Podrazdel id={T.razdely.net.id} no="III." title={T.razdely.net.title}>
        <Abzacy paras={T.net.vvod} />
        <RamkaPrimer title={T.net.primer1.title} shagi={T.net.primer1.shagi}>
          <Risunok id="ponyatie-vertikalnaya" label="Вертикальная касательная" />
        </RamkaPrimer>
        <RamkaPrimer title={T.net.primer2.title} shagi={T.net.primer2.shagi}>
          <Risunok id="ponyatie-ostrie" label="Острие: касательная — ось Oy" />
        </RamkaPrimer>
        <RamkaPrimer
          title={T.net.primer3.title}
          uslovie={T.net.primer3.uslovie}
          shagi={T.net.primer3.shagi}
          otvet={T.net.primer3.otvet}
        >
          <Risunok id="ponyatie-galochka" label="График модуля: излом в нуле" />
        </RamkaPrimer>
        <ZhivoyModul />
        <RamkaVazhno>
          <Abzacy paras={T.net.odnostoronnie} />
        </RamkaVazhno>
        <RamkaVyvod>
          <Abzacy paras={T.net.vyvod} />
        </RamkaVyvod>
      </Podrazdel>

      <Podrazdel id={T.razdely.ege.id} no="IV." title={T.razdely.ege.title}>
        <Abzacy paras={T.ege.vvod} />
        <ul className="z9-ege-ssylki">
          {T.ege.ssylki.map((s) => (
            <li key={s.gruppa}>
              <Link href={href('zadaniya', 9, 'trenazher', `?g=${s.gruppa}`)}>
                <Tex text={s.text} />
              </Link>
              <span className="z9-ege-ssylki__note">
                <Tex text={s.note} />
              </span>
            </li>
          ))}
        </ul>
      </Podrazdel>
    </div>
  );
}
