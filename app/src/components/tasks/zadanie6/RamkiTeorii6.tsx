import { TEORIYA_6_DLYA_PROTOTIPA, vseKartochki6, type Kartochka6 } from '@/content/teoriya6';
import { KartochkaTelo6 } from './KartochkaTelo6';

/** Рамки теории: карточки теории прототипов листа, каждая один раз — те же, что во вкладке «Теория». */
export function RamkiTeorii6({ prototipy }: { prototipy: string[] }) {
  const vse = vseKartochki6();
  const ids = [...new Set(prototipy.flatMap((p) => TEORIYA_6_DLYA_PROTOTIPA(p)?.kartochka ?? []))];
  const kartochki = ids.flatMap((id) => vse.find((k) => k.id === id) ?? []) as Kartochka6[];
  return (
    <div className="z6-list__teoriya">
      {kartochki.map((k) => (
        <KartochkaTelo6 key={k.id} k={k} />
      ))}
    </div>
  );
}
