import { StranitsaKartochek, metadataKartochek } from '@/components/kartochki/StranitsaKartochek';

export const metadata = metadataKartochek(13);

/** Вкладка «Карточки» №13: проверка теории. Колода — content/kartochki/13-ekonomicheskie.ts. */
export default function Page() {
  return <StranitsaKartochek task={13} />;
}
