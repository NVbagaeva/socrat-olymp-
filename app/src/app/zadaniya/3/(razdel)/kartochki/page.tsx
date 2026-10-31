import { StranitsaKartochek, metadataKartochek } from '@/components/kartochki/StranitsaKartochek';

export const metadata = metadataKartochek(3);

/** Вкладка «Карточки» №3: проверка теории. Колода — content/kartochki/03-stereometriya.ts. */
export default function Page() {
  return <StranitsaKartochek task={3} />;
}
