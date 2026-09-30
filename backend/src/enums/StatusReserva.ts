/**
 * Enum StatusReserva
 * ------------------
 * Representa o ciclo de vida de uma reserva de passagem.
 *
 * Fluxo normal (caminho feliz):
 *   PENDENTE_PAGAMENTO -> CONFIRMADA
 *
 * Fluxos alternativos:
 *   PENDENTE_PAGAMENTO -> CANCELADA   (usuário cancela antes de pagar, ou desiste)
 *   CONFIRMADA         -> CANCELADA   (usuário cancela uma reserva já paga)
 *   CONFIRMADA         -> REEMBOLSADA (ADM cancela o VOO inteiro -> reembolso automático)
 */
export enum StatusReserva {
  /** Reserva criada, aguardando confirmação do pagamento simbólico. */
  PENDENTE_PAGAMENTO = "PENDENTE_PAGAMENTO",

  /** Pagamento confirmado, passagem garantida. */
  CONFIRMADA = "CONFIRMADA",

  /** Reserva cancelada pelo próprio usuário. */
  CANCELADA = "CANCELADA",

  /** Reserva reembolsada automaticamente porque o voo foi cancelado pelo ADM. */
  REEMBOLSADA = "REEMBOLSADA",
}
