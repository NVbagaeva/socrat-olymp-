import { Tex } from '@/components/ui/Tex';
import { krugHtml, krugiHtml, krugiOtbora, krugSerii } from '@/lib/zadanie14/krugHtml';
import type { KrugSpec } from '@/lib/zadanie14/krug';
import type { Risunok14 } from '@/lib/zadanie14/teoriyaTipy';
import { ZhivoeDelenie13, ZhivoyUgol13 } from '@/components/zhivye/krug13/Kartochki';
import { KrugSechenie14 } from './KrugSechenie14';
import { TablicaKorni14 } from './TablicaKorni14';

/**
 * Тригонометрическая окружность №14 (движок lib/zadanie14/krug.ts):
 * готовая разметка — SVG и подписи KaTeX. Набирается там, где
 * отрисована страница; на клиенте не пересчитывается.
 */
export function Krug14({ spec, className }: { spec: KrugSpec; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: krugHtml(spec) }} />;
}

export function Krugi14({ specs, className }: { specs: KrugSpec[]; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: krugiHtml(specs) }} />;
}

/** Якорь первого макета окружности (четверти / пополам / на три части). */
export const MAKETY_ID = 'makety-okruzhnosti';

/** Рисунок теории или разбора по описанию. */
export function Risunok14View({ r }: { r: Risunok14 }) {
  const podpis =
    'podpis' in r && r.podpis ? (
      <figcaption className="z14-ris__podpis">
        <Tex text={r.podpis} />
      </figcaption>
    ) : null;
  let telo: React.ReactNode;
  switch (r.vid) {
    case 'krug':
      telo = <Krug14 spec={r.spec} />;
      break;
    case 'serii':
      telo = <Krug14 spec={krugSerii(r.serii)} />;
      break;
    case 'otbor':
      telo = <Krugi14 specs={krugiOtbora(r.serii, r.promezhutok)} />;
      break;
    case 'zhivoy':
      telo = <ZhivoyUgol13 />;
      break;
    case 'delenie':
      telo = <ZhivoeDelenie13 />;
      break;
    case 'sechenie':
      telo = <KrugSechenie14 funkciya={r.funkciya} />;
      break;
    case 'tablica-korni':
      telo = <TablicaKorni14 />;
      break;
  }
  return (
    <figure className="z14-ris" {...(r.vid === 'delenie' ? { id: MAKETY_ID } : {})}>
      {telo}
      {podpis}
    </figure>
  );
}
