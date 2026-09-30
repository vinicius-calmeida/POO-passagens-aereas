/**
 * Enum TipoUsuario
 * ----------------
 * Representa o perfil de acesso de um usuário dentro do sistema.
 *
 * É usado principalmente pelo AuthService para liberar (ou negar)
 * funcionalidades de acordo com o tipo de conta autenticada, e também
 * é persistido no banco de dados como uma coluna do tipo "enum" (string)
 * na tabela de usuários (ver discriminação de herança em Usuario.ts).
 */
export enum TipoUsuario {
  /** Usuário comum: pode comprar passagens econômicas, ver e cancelar reservas. */
  PADRAO = "PADRAO",

  /** Usuário VIP: tudo do padrão + descontos, assentos VIP e notificações antecipadas. */
  VIP = "VIP",

  /** Administrador: tudo do VIP + gerenciamento de voos, usuários, descontos e relatórios. */
  ADMIN = "ADMIN",
}
