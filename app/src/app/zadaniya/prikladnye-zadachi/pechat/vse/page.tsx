import type { Metadata } from 'next';
import { List10 } from '@/components/tasks/zadanie10/List10';
import { zadanie10Title } from '@/content/zadanie10';
import { kartinkiZadach10 } from '@/lib/zadanie10/kartinkiZadach10';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '@/app/zadaniya/grafiki-funkciy/[type]/pechat/pechat.css';
import '@/components/tasks/zadanie10/razbor10.css';
import '../../zadanie10.css';
import '../pechat10.css';

export const metadata: Metadata = {
  title: zadanie10Title('Всё одним файлом'),
  robots: { index: false, follow: false },
};

/** «Всё одним файлом» №10: лист ученика, затем лист учителя — те же задачи по тому же адресу. */
export default function Pechat10Vse() {
  return <List10 ill={kartinkiZadach10()} vid="vse" />;
}
