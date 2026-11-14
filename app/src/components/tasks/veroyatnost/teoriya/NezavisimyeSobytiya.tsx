import { RamkaOpredelenie, RamkaVyvod } from '@/components/teoriya/Ramki';
import { Tex } from '@/components/ui/Tex';
import { NEZAVISIMYE, type Zadacha5 } from '@/content/veroyatnost-teoriya5';
import { YAKOR_5 } from '@/lib/veroyatnost/teoriya-yakorya';
import {
  Abzacy5,
  Formula5,
  NePutay,
  Razbor5,
  ShagiPlashki,
  SpisokVyvoda,
  type Ton5,
} from './Teoriya5Bloki';

/**
 * Раздел теории №5 «Независимые события» — умножение вероятностей,
 * «Не путай!» (независимые ≠ несовместные) и «хотя бы один» через
 * противоположное событие. Понятие независимости введено в теории
 * №4; здесь — правило и задачи с разбором к каждому правилу.
 */
export function NezavisimyeSobytiya() {
  const { lead, opredelenie, umnozhenie, neputay, hotyaBy, zadachi, vyvod } = NEZAVISIMYE;
  const { biatlon, prodavtsy, popytki } = zadachi;
  /* Карточки задач чередуют тон: белое стекло, голубое, снова белое. */
  const zadachaHotyaBy: readonly [Zadacha5, Ton5, 'prodavtsy' | 'popytki'][] = [
    [prodavtsy, 'goluboy', 'prodavtsy'],
    [popytki, 'belyy', 'popytki'],
  ];
  return (
    <div className="t5-razdel">
      <p className="vteor-blok__lead">{lead}</p>

      <RamkaOpredelenie title={opredelenie.title} id={YAKOR_5.nezav('opredelenie')}>
        <p className="ramka__p">
          <Tex text={opredelenie.text} />
        </p>
        {opredelenie.primery.map((p) => (
          <p className="ramka__p t5-primer-zhizn" key={p}>
            <Tex text={p} />
          </p>
        ))}
      </RamkaOpredelenie>

      <section className="t5-pravilo" id={YAKOR_5.nezav('umnozhenie')}>
        <h4 className="t5-pravilo__title">{umnozhenie.title}</h4>
        <Formula5 formula={umnozhenie.formula} podpis={umnozhenie.podpis} />
        <Razbor5 z={umnozhenie.zadacha} ton="belyy" yakor="t5-nezav-zadacha-moneta-kubik" />
      </section>

      <NePutay title={neputay.title} yakor={YAKOR_5.nezav('neputay')}>
        <p className="t5-neputay__text">
          <Tex text={neputay.text} />
        </p>
        <div className="t5-neputay__primer">
          <p className="t5-neputay__primer-title">{neputay.primer.title}</p>
          <ShagiPlashki shagi={neputay.primer.shagi} />
        </div>
      </NePutay>

      <Razbor5 z={biatlon} ton="goluboy" yakor={YAKOR_5.nezav('biatlon')} />

      <section className="t5-pravilo" id={YAKOR_5.nezav('hotya-by')}>
        <h4 className="t5-pravilo__title">{hotyaBy.title}</h4>
        <Formula5 formula={hotyaBy.formula} />
        <Abzacy5 stroki={hotyaBy.text} className="t5-p" />
        {zadachaHotyaBy.map(([z, ton, id]) => (
          <Razbor5 key={z.id} z={z} ton={ton} yakor={YAKOR_5.nezav(id)} />
        ))}
      </section>

      <RamkaVyvod title={vyvod.title} id={YAKOR_5.nezav('vyvod')}>
        <SpisokVyvoda punkty={vyvod.punkty} />
      </RamkaVyvod>
    </div>
  );
}
