import { StranitsaKartochek, metadataKartochek } from '@/components/kartochki/StranitsaKartochek';

export const metadata = metadataKartochek(5);

/** Вкладка «Карточки» №5: проверка теории. Колода — content/kartochki/05-veroyatnost.ts. */
export default function Page() {
  return <StranitsaKartochek task={5} />;
}
