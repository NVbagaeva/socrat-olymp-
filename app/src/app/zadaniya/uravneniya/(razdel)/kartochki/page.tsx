import { StranitsaKartochek, metadataKartochek } from '@/components/kartochki/StranitsaKartochek';

export const metadata = metadataKartochek(7);

/** Вкладка «Карточки» №7: проверка теории. Колода — content/kartochki/07-uravneniya.ts. */
export default function Page() {
  return <StranitsaKartochek task={7} />;
}
