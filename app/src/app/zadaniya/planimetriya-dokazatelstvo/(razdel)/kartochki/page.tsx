import { StranitsaKartochek, metadataKartochek } from '@/components/kartochki/StranitsaKartochek';

export const metadata = metadataKartochek(18);

/**
 * Вкладка «Карточки» №18: карточки ключевых схем на общем движке.
 * Колода — content/kartochki/18-klyuchevye-skhemy.ts.
 */
export default function Page() {
  return <StranitsaKartochek task={18} />;
}
