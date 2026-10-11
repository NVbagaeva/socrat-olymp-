import { LegalPage, legalMetadata } from '@/components/legal/LegalPage';

export const metadata = legalMetadata('soglashenie');

export default function Page() {
  return <LegalPage id="soglashenie" />;
}
