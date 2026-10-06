import { protoKartochki } from './ProtoKartochki';
import { Generator2Screen } from './Generator2Screen';

/** Вкладка «Генератор» задания №2: вариант для печати. */
export function Generator2Tab({ base }: { base: string }) {
  return <Generator2Screen base={base} skills={protoKartochki()} />;
}
