/**
 * Enum StatusVoo
 * --------------
 * Representa o ciclo de vida de um voo dentro do sistema.
 *
 * Transições automáticas (calculadas pelo VooService, não definidas manualmente):
 *   NOVA                 -> quando o voo tem menos de 2 dias desde o cadastro.
 *   A_VENDA              -> situação normal, voo disponível.
 *   ULTIMAS_PASSAGENS    -> quando restam 10 assentos disponíveis ou menos.
 *   ESGOTADA             -> quando não há mais nenhum assento disponível.
 *   REALIZADO            -> quando a dataHora do voo já passou (voo já ocorreu).
 *
 * Transições manuais (somente ADMIN pode definir):
 *   ATRASADA             -> dispara notificação a todos os passageiros.
 *   CANCELADA            -> dispara notificação a todos os passageiros
 *                            e reembolsa automaticamente todas as reservas.
 */
export enum StatusVoo {
  /** Voo recém-cadastrado (menos de 2 dias). VIPs recebem notificação antecipada. */
  NOVA = "NOVA",

  /** Voo disponível normalmente para compra. */
  A_VENDA = "A_VENDA",

  /** Restam 10 assentos disponíveis ou menos. */
  ULTIMAS_PASSAGENS = "ULTIMAS_PASSAGENS",

  /** Não há mais assentos disponíveis para venda. */
  ESGOTADA = "ESGOTADA",

  /** A data/horário do voo já passou. Não aparece na busca pública por padrão. */
  REALIZADO = "REALIZADO",

  /** Voo atrasado. Definido manualmente pelo ADM. */
  ATRASADA = "ATRASADA",

  /** Voo cancelado. Definido manualmente pelo ADM. Gera reembolso automático. */
  CANCELADA = "CANCELADA",
}
