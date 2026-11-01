import { StranitsaKartochek, metadataKartochek } from '@/components/kartochki/StranitsaKartochek';

export const metadata = metadataKartochek(11);

/** Вкладка «Карточки» №11: проверка теории. Колода — content/kartochki/11-tekstovye.ts. */
export default function Page() {
  return <StranitsaKartochek task={11} />;
}
