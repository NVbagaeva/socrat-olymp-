import { StranitsaKartochek, metadataKartochek } from '@/components/kartochki/StranitsaKartochek';

export const metadata = metadataKartochek(9);

/** Вкладка «Карточки» №9: проверка теории. Колода — content/kartochki/09-proizvodnaya.ts. */
export default function Page() {
  return <StranitsaKartochek task={9} />;
}
