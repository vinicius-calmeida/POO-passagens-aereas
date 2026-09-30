/**
 * ReservaRepository
 * -----------------
 * Camada de acesso a dados (Repository Pattern) para a entidade Reserva.
 *
 * Centraliza as queries de busca de reservas por usuário e por voo,
 * úteis tanto para o usuário final ("minhas reservas") quanto para o
 * ADM (ex: notificar todos os passageiros de um voo atrasado/cancelado).
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Reserva } from "../models/Reserva";

export class ReservaRepository {
  private repository: Repository<Reserva>;

  constructor() {
    this.repository = AppDataSource.getRepository(Reserva);
  }

  /** Salva uma reserva (cria se for nova, atualiza se já existir). */
  public async salvar(reserva: Reserva): Promise<Reserva> {
    return this.repository.save(reserva);
  }

  /** Busca uma reserva pelo id. */
  public async buscarPorId(id: string): Promise<Reserva | null> {
    return this.repository.findOne({ where: { id } });
  }

  /** Lista todas as reservas feitas por um usuário específico. */
  public async listarPorUsuario(usuarioId: string): Promise<Reserva[]> {
    return this.repository.find({
      where: { usuario: { id: usuarioId } },
    });
  }

  /**
   * Lista todas as reservas de um voo específico.
   * Usado pelo VooService para notificar passageiros em caso de
   * atraso/cancelamento, e para reembolsar todas as reservas quando
   * o voo é cancelado.
   */
  public async listarPorVoo(vooId: string): Promise<Reserva[]> {
    return this.repository.find({
      where: { voo: { id: vooId } },
    });
  }

  /** Retorna todas as reservas do sistema (útil para relatórios do ADM). */
  public async listarTodas(): Promise<Reserva[]> {
    return this.repository.find();
  }
}
