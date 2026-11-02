import { StranitsaKartochek, metadataKartochek } from '@/components/kartochki/StranitsaKartochek';

export const metadata = metadataKartochek(6);

/** Вкладка «Карточки» №6: проверка теории. Колода — content/kartochki/06-sluchaynye-velichiny.ts. */
export default function Page() {
  return <StranitsaKartochek task={6} />;
}
