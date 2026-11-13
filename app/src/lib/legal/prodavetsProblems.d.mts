export interface ProdavetsConfig {
  inn: string;
  pochta: string;
  dataOferty: string;
  telegram: string;
  srokOtkrytiyaChasov: string;
}
export function prodavetsProblems(config: Partial<ProdavetsConfig>): string[];
