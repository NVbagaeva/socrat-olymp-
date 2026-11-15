import { ZADACHA_VARIANTA13, type Vid13 } from '@/content/ekonomicheskie13';
import { typeset } from '@/lib/tex';
import { syuzhetyVida } from '@/lib/zadanie13/varianty17';
import { KartaGruppa, KartaTip } from '../karta';
import { ZadachaVarianta13 } from './ZadachaVarianta13';

const LABELS = { tipov: ZADACHA_VARIANTA13.zadach };

/**
 * Задачи прежнего №17 из вариантов одного вида, по сюжетам: группа на
 * сюжет, в ней карточка на задачу (название — начало условия, ниже —
 * откуда задача). Группы и карточки — общая карта задания
 * (components/tasks/karta); задача собирается в браузере по раскрытию.
 * Якоря: #gruppa-{сюжет}, #tip-{pv27-5 | ev3}.
 */
export async function ZadachiIzVariantov13({ vid }: { vid: Vid13 }) {
  const gruppy = await syuzhetyVida(vid);
  return (
    <div className="kz-gruppy">
      {gruppy.map(({ syuzhet, zadachi }) => (
        <KartaGruppa
          key={syuzhet.id}
          id={syuzhet.id}
          nazvanie={syuzhet.nazvanie}
          znakHtml={typeset(`$${syuzhet.znak}$`)}
          ton={syuzhet.ton}
          tipov={zadachi.length}
          progress={null}
          labels={LABELS}
        >
          <p className="stk-lead z13-gruppa__lead">{syuzhet.lead}</p>
          {zadachi.map((z) => (
            <KartaTip key={z.id} id={z.id} nazvanieHtml={typeset(z.nachalo)} lead={z.otkuda}>
              <ZadachaVarianta13 k={z.k} v={z.v} />
            </KartaTip>
          ))}
        </KartaGruppa>
      ))}
    </div>
  );
}
