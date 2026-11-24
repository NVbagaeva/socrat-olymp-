import { StranitsaKartochek, metadataKartochek } from '@/components/kartochki/StranitsaKartochek';

export const metadata = metadataKartochek(4);

/** Вкладка «Карточки» №4: проверка теории. Колода — content/kartochki/04-veroyatnost.ts. */
export default function Page() {
  return <StranitsaKartochek task={4} />;
}
