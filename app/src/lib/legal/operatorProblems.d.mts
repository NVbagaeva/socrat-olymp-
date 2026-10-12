export interface LegalOperatorConfig {
  fio: string;
  pochta: string;
  data: string;
}
export function legalConfigProblems(config: Partial<LegalOperatorConfig>): string[];
