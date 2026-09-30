/**
 * Enum PublicoDesconto
 * --------------------
 * Define para qual público um desconto se aplica.
 *
 * Criado para atender a uma evolução da regra de negócio original do
 * projeto: inicialmente, todo desconto cadastrado pelo ADM era
 * recebido automaticamente apenas por usuários VIP/Admin. Esta
 * distinção permite que o ADM também crie promoções abertas a TODOS
 * os usuários (incluindo PADRAO), mantendo separado o conceito de
 * "benefício exclusivo de assinatura VIP" do conceito de "promoção
 * geral de marketing".
 *
 * Regra de prioridade (ver DescontoService.buscarMelhorDesconto()):
 * quando um usuário VIP/Admin compra uma passagem e existem descontos
 * ativos de ambos os públicos para o mesmo tipo de voo, aplica-se
 * apenas o de MAIOR PERCENTUAL entre os dois (os descontos não se
 * acumulam).
 */
export enum PublicoDesconto {
  /** Desconto visível e aplicado para qualquer usuário (PADRAO, VIP ou ADMIN). */
  GERAL = "GERAL",

  /** Desconto exclusivo para usuários com benefícios VIP (UsuarioVIP ou Admin). */
  VIP = "VIP",
}
