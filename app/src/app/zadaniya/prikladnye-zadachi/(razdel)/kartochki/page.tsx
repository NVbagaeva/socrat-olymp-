import { StranitsaKartochek, metadataKartochek } from '@/components/kartochki/StranitsaKartochek';

export const metadata = metadataKartochek(10);

/** Вкладка «Карточки» №10: проверка теории. Колода — content/kartochki/10-prikladnye.ts. */
export default function Page() {
  return <StranitsaKartochek task={10} />;
}
