/**
 * NotificacaoService
 * ------------------
 * Centraliza a criação e o gerenciamento de notificações do sistema.
 *
 * Por que este service existe separado dos outros?
 * Praticamente todos os outros services (VooService, ReservaService,
 * PagamentoService, UpgradeVIPService, DescontoService) precisam, em
 * algum momento, "avisar" um ou mais usuários sobre algo que aconteceu.
 * Em vez de cada um desses services manipular a tabela "notificacao"
 * diretamente, eles delegam essa responsabilidade para o
 * NotificacaoService, seguindo o princípio de responsabilidade única
 * (Single Responsibility Principle).
 *
 * EVENTOS QUE GERAM NOTIFICAÇÃO (conforme especificação do projeto):
 * - Compra confirmada
 * - Upgrade VIP confirmado
 * - Novo voo criado (notificação antecipada para VIP/Admin)
 * - Voo atrasado
 * - Voo cancelado
 * - Promoções / Descontos
 *
 * Observação de arquitetura: este service acessa o banco diretamente
 * através de "AppDataSource.getRepository(Notificacao)" em vez de um
 * Repository dedicado (como UsuarioRepository, VooRepository e
 * ReservaRepository). Isso porque a entidade Notificacao é simples e
 * tem um único ponto de escrita (este service) - criar uma camada de
 * Repository extra para ela adicionaria complexidade sem benefício
 * real neste projeto acadêmico.
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Notificacao } from "../models/Notificacao";
import { Usuario } from "../models/Usuario";

export class NotificacaoService {
  private repository: Repository<Notificacao>;

  constructor() {
    this.repository = AppDataSource.getRepository(Notificacao);
  }

  /**
   * Cria e persiste uma nova notificação para um usuário específico.
   * Método central usado por todos os outros services do sistema.
   */
  public async notificar(usuario: Usuario, mensagem: string): Promise<Notificacao> {
    const notificacao = new Notificacao();
    notificacao.usuario = usuario;
    notificacao.mensagem = mensagem;
    notificacao.lida = false;

    return this.repository.save(notificacao);
  }

  /**
   * Notifica uma lista de usuários com a mesma mensagem.
   * Útil para eventos em massa, como atraso/cancelamento de voo
   * (todos os passageiros recebem a mesma mensagem).
   */
  public async notificarVarios(
    usuarios: Usuario[],
    mensagem: string
  ): Promise<Notificacao[]> {
    const notificacoes = usuarios.map((usuario) => {
      const notificacao = new Notificacao();
      notificacao.usuario = usuario;
      notificacao.mensagem = mensagem;
      notificacao.lida = false;
      return notificacao;
    });

    return this.repository.save(notificacoes);
  }

  /** Lista todas as notificações de um usuário, da mais recente para a mais antiga. */
  public async listarPorUsuario(usuarioId: string): Promise<Notificacao[]> {
    return this.repository.find({
      where: { usuario: { id: usuarioId } },
      order: { data: "DESC" },
    });
  }

  /** Marca uma notificação específica como lida. */
  public async marcarComoLida(notificacaoId: string): Promise<Notificacao | null> {
    const notificacao = await this.repository.findOne({
      where: { id: notificacaoId },
    });

    if (!notificacao) return null;

    notificacao.marcarComoLida();
    return this.repository.save(notificacao);
  }

  /** Conta quantas notificações não lidas um usuário possui (útil para um "badge" no frontend). */
  public async contarNaoLidas(usuarioId: string): Promise<number> {
    return this.repository.count({
      where: { usuario: { id: usuarioId }, lida: false },
    });
  }
}
