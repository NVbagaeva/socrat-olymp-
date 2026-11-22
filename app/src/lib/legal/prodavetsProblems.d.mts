export interface ProdavetsConfig {
  inn: string;
  pochta: string;
  dataOferty: string;
}
export function prodavetsProblems(config: Partial<ProdavetsConfig>): string[];
