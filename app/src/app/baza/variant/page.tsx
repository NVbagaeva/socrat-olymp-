import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Pusto } from '@/components/baza/Pusto';
import '@/app/zadaniya/zadaniya.css';
import '@/app/zadaniya/[task]/section.css';
import '@/components/baza/baza.css';

export const metadata: Metadata = {
  title: 'Вариант базы — Будет на ЕГЭ',
  description: 'Вариант ЕГЭ по базовой математике: 21 задание, 180 минут, отметка 2–5.',
};

/* Этап 1: адрес и навигация. Сборщик варианта базы подключается на
   этапе 2 (уровень в lib/variant). */
export default function BazaVariantPage() {
  return (
    <AppShell active="variant" level="base">
      <main className="app-main">
        <Pusto vkladka="Вариант базы" />
      </main>
    </AppShell>
  );
}
