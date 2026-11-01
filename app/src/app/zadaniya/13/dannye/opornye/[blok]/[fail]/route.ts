import {
  otvetFayla13,
  vseFayly13,
  type ParametryFayla13,
} from '@/lib/zadanie13/opornye/zakrytoe-server';

/* Разбор и подсказки задачи «Опорных задач» №13 — файлом сборки (lib/zadanie13/opornye/zakrytoe.ts). */
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): ParametryFayla13[] {
  return vseFayly13();
}

export function GET(_request: Request, { params }: { params: Promise<ParametryFayla13> }) {
  return otvetFayla13(params);
}
