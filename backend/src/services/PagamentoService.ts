/**
 * PagamentoService
 * ----------------
 * Responsável EXCLUSIVAMENTE por simular a confirmação de pagamento
 * de uma reserva.
 *
 * Conforme a especificação do projeto, não existe integração
 * financeira real - o pagamento é simbólico. O fluxo completo é:
 *   1. usuário seleciona voo (ReservaService.criarReserva)
 *   2. usuário seleciona assento (ReservaService.criarReserva)
 *   3. sistema cria reserva com status PENDENTE_PAGAMENTO
 *   4. sistema exibe botão "Confirmar Pagamento" (responsabilidade do frontend)
 *   5. usuário confirma -> ESTE SERVICE é chamado
 *   6. reserva passa para CONFIRMADA
 *   7. sistema envia notificação de compra confirmada
 *
 * Por que um service separado do ReservaService?
 * Separação de responsabilidades: ReservaService lida com a CRIAÇÃO
 * da reserva (escolha de voo/assento, validação de classe, cálculo de
 * preço). PagamentoService lida apenas com a TRANSIÇÃO de status de
 * pagamento. Isso reflete fielmente a divisão de etapas do fluxo de
 * compra descrito na especificação do projeto.
 */

import { ReservaRepository } from "../repositories/ReservaRepository";
import { NotificacaoService } from "./NotificacaoService";
import { Reserva } from "../models/Reserva";
import { Usuario } from "../models/Usuario";

export class PagamentoService {
  private reservaRepository: ReservaRepository;
  private notificacaoService: NotificacaoService;

  constructor() {
    this.reservaRepository = new ReservaRepository();
    this.notificacaoService = new NotificacaoService();
  }

  /**
   * Confirma o pagamento simbólico de uma reserva.
   * Apenas o próprio usuário (dono da reserva) ou um Admin podem
   * confirmar o pagamento.
   */
  public async confirmarPagamento(
    solicitante: Usuario,
    reservaId: string
  ): Promise<Reserva> {
    const reserva = await this.reservaRepository.buscarPorId(reservaId);
    if (!reserva) {
      throw new Error("Reserva não encontrada.");
    }

    const ehDonoDaReserva = reserva.usuario.id === solicitante.id;
    if (!ehDonoDaReserva && !solicitante.isAdmin()) {
      throw new Error("Você não tem permissão para confirmar o pagamento desta reserva.");
    }

    // confirmarPagamento() é um método da própria entidade Reserva, que
    // valida a transição de status (PENDENTE_PAGAMENTO -> CONFIRMADA)
    // e lança erro caso o status atual não permita essa transição.
    reserva.confirmarPagamento();
    const reservaConfirmada = await this.reservaRepository.salvar(reserva);

    await this.notificacaoService.notificar(
      reserva.usuario,
      `Pagamento confirmado! Sua passagem de ${reserva.voo.origem} para ${reserva.voo.destino} está garantida.`
    );

    return reservaConfirmada;
  }
}
