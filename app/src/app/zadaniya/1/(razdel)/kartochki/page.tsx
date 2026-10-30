import { StranitsaKartochek, metadataKartochek } from '@/components/kartochki/StranitsaKartochek';

export const metadata = metadataKartochek(1);

/** Вкладка «Карточки» №1: проверка теории. Колода — content/kartochki/01-planimetriya.ts. */
export default function Page() {
  return <StranitsaKartochek task={1} />;
}
