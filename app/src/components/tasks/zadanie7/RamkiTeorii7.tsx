import { TEORIYA_7_DLYA_PROTOTIPA, vseKartochki7, type Kartochka7 } from '@/content/teoriya7';
import { KartochkaTelo7 } from './KartochkaTelo7';

/** Рамки теории: карточки теории прототипов листа, каждая один раз. */
export function RamkiTeorii7({ prototipy }: { prototipy: string[] }) {
  const vse = vseKartochki7();
  const ids = [...new Set(prototipy.flatMap((p) => TEORIYA_7_DLYA_PROTOTIPA(p)?.kartochka ?? []))];
  const kartochki = ids.flatMap((id) => vse.find((k) => k.id === id) ?? []) as Kartochka7[];
  return (
    <div className="z7-list__teoriya">
      {kartochki.map((k) => (
        <KartochkaTelo7 key={k.id} k={k} />
      ))}
    </div>
  );
}
