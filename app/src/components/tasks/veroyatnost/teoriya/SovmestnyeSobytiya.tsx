import { DvaKruga } from '@/components/probability';
import { RamkaOpredelenie, RamkaVyvod } from '@/components/teoriya/Ramki';
import { Tex } from '@/components/ui/Tex';
import { SOVMESTNYE } from '@/content/veroyatnost-teoriya5';
import { YAKOR_5 } from '@/lib/veroyatnost/teoriya-yakorya';
import { Abzacy5, Formula5, Razbor5, Risunok5, SpisokVyvoda } from './Teoriya5Bloki';

/**
 * Раздел теории №5 «Совместные и несовместные события» — сложение
 * вероятностей. Понятия введены в теории №4 (карточки «События могут
 * быть связаны»); здесь — формулы сложения, почему в одной из них
 * вычитают общую часть, и к каждому правилу — задача с разбором.
 */
export function SovmestnyeSobytiya() {
  const { lead, opredeleniya, oboznacheniya, nesovm, sovm, vyvod } = SOVMESTNYE;
  return (
    <div className="t5-razdel">
      <p className="vteor-blok__lead">{lead}</p>

      {/* Два определения рядом: на широком экране в ряд, на узком — друг под другом. */}
      <div className="t5-para" id={YAKOR_5.sovm('opredeleniya')}>
        {[opredeleniya.sovmestnye, opredeleniya.nesovmestnye].map((o) => (
          <RamkaOpredelenie key={o.title} title={o.title}>
            <p className="ramka__p">
              <Tex text={o.text} />
            </p>
            <p className="ramka__p t5-primer-zhizn">
              <span className="t5-primer-zhizn__metka">Пример.</span> <Tex text={o.primer} />
            </p>
          </RamkaOpredelenie>
        ))}
      </div>

      <section className="t5-oboznacheniya">
        <p className="t5-oboznacheniya__title">{oboznacheniya.title}</p>
        <Abzacy5 stroki={oboznacheniya.stroki} className="t5-oboznacheniya__p" />
      </section>

      {/* Правило 1 и его задача. */}
      <section className="t5-pravilo" id={YAKOR_5.sovm('nesovmestnye')}>
        <h4 className="t5-pravilo__title">{nesovm.title}</h4>
        <Formula5 formula={nesovm.formula} podpis={nesovm.podpis} />
        <Razbor5 z={nesovm.zadacha} ton="belyy" yakor="t5-sovm-zadacha-kubik" />
      </section>

      {/* Правило 2: почему вычитаем — рисунок кругов, затем задача. */}
      <section className="t5-pravilo" id={YAKOR_5.sovm('sovmestnye')}>
        <h4 className="t5-pravilo__title">{sovm.title}</h4>
        <Formula5 formula={sovm.formula} podpis={sovm.podpis} />
        <div className="t5-pochemu-blok">
          <h5 className="t5-pochemu-blok__title">
            <Tex text={sovm.pochemu.title} zagolovok />
          </h5>
          <div className="t5-pochemu-blok__telo">
            <div>
              <Abzacy5 stroki={sovm.pochemu.text} className="t5-p" />
            </div>
            <Risunok5 podpis={sovm.pochemu.podpisRisunka}>
              <DvaKruga podpisi={sovm.pochemu.podpisi} alt={sovm.pochemu.alt} />
            </Risunok5>
          </div>
        </div>
      </section>

      <Razbor5 z={sovm.zadacha} ton="goluboy" yakor={YAKOR_5.sovm('kofe')} />

      <RamkaVyvod title={vyvod.title} id={YAKOR_5.sovm('vyvod')}>
        <SpisokVyvoda punkty={vyvod.punkty} />
      </RamkaVyvod>
    </div>
  );
}
