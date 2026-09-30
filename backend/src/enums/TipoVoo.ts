/**
 * Enum TipoVoo
 * ------------
 * Classifica um voo de acordo com sua rota.
 *
 * É usado em duas frentes principais:
 * 1. Voo.ts -> cada voo tem um tipoVoo fixo.
 * 2. Desconto.ts -> cada desconto criado pelo ADM se aplica a um tipoVoo
 *    específico (ex: 10% de desconto só em voos INTERNACIONAIS).
 */
export enum TipoVoo {
  /** Voo dentro do mesmo país. */
  NACIONAL = "NACIONAL",

  /** Voo entre países diferentes. */
  INTERNACIONAL = "INTERNACIONAL",
}
