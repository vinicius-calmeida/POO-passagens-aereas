/**
 * Enum ClasseAssento
 * ------------------
 * Define a classe de um assento dentro de um voo.
 *
 * Regra de negócio (validada em ReservaService):
 * - Usuário PADRAO -> só pode reservar assentos ECONOMICO.
 * - Usuário VIP e ADMIN -> podem reservar ECONOMICO ou VIP.
 */
export enum ClasseAssento {
  /** Assento padrão, disponível para todos os tipos de usuário. */
  ECONOMICO = "ECONOMICO",

  /** Assento exclusivo para usuários VIP (e ADMIN, que herda os benefícios de VIP). */
  VIP = "VIP",
}
