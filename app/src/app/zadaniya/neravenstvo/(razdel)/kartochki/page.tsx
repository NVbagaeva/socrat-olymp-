import { StranitsaKartochek, metadataKartochek } from '@/components/kartochki/StranitsaKartochek';

export const metadata = metadataKartochek(16);

/** Вкладка «Карточки» №16: проверка теории. Колода — content/kartochki/16-neravenstva.ts. */
export default function Page() {
  return <StranitsaKartochek task={16} />;
}
