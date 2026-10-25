'use client';

/** Входные компоненты служебных страниц онлайн-варианта в кабинете. */

import { KabinetGate } from '@/components/kabinet/KabinetGate';
import { IssueVariant } from './IssueVariant';
import { VariantWorkPage } from './VariantWorkPage';

export function IssueVariantScreen() {
  return <KabinetGate roles={['tutor']}>{() => <IssueVariant />}</KabinetGate>;
}

export function VariantWorkScreen() {
  return <KabinetGate>{(me) => <VariantWorkPage me={me} />}</KabinetGate>;
}
