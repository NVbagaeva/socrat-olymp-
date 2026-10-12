import { LegalPage, legalMetadata } from '@/components/legal/LegalPage';

export const metadata = legalMetadata('politika');

export default function Page() {
  return <LegalPage id="politika" />;
}
