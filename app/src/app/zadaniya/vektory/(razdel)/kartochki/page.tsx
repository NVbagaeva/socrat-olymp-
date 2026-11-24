import { StranitsaKartochek, metadataKartochek } from '@/components/kartochki/StranitsaKartochek';

export const metadata = metadataKartochek(2);

/** Вкладка «Карточки» №2: проверка теории. Колода — content/kartochki/02-vektory.ts. */
export default function Page() {
  return <StranitsaKartochek task={2} />;
}
