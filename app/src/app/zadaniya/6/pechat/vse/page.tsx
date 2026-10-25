import type { Metadata } from 'next';
import { List6 } from '@/components/tasks/zadanie6/List6';
import { zadanie6Title } from '@/content/zadanie6';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '@/lib/sheet/probability-sheet.css';
import '@/app/zadaniya/[task]/[type]/pechat/pechat.css';
import '@/components/probability/probability.css';
import '@/components/tasks/zadanie6/zadanie6.css';
import '../../zadanie6.css';
import '../pechat6.css';

export const metadata: Metadata = {
  title: zadanie6Title('Всё одним файлом'),
  robots: { index: false, follow: false },
};

/** «Всё одним файлом» №6: лист ученика, затем лист учителя — те же задачи по тому же адресу. */
export default function Pechat6Vse() {
  return <List6 vid="vse" />;
}
