/**
 * VooRepository
 * -------------
 * Camada de acesso a dados (Repository Pattern) para a entidade Voo.
 *
 * Centraliza todas as queries relacionadas a voos, incluindo buscas
 * com filtros (origem/destino) e o carregamento dos assentos
 * relacionados (relation "assentos"), que é necessário para o
 * VooService calcular disponibilidade e status.
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Voo } from "../models/Voo";

export class VooRepository {
  private repository: Repository<Voo>;

  constructor() {
    this.repository = AppDataSource.getRepository(Voo);
  }

  /** Salva um voo (cria se for novo, atualiza se já existir). Com cascade, salva os assentos junto. */
  public async salvar(voo: Voo): Promise<Voo> {
    return this.repository.save(voo);
  }

  /** Busca um voo pelo id, já trazendo a lista de assentos relacionados. */
  public async buscarPorId(id: string): Promise<Voo | null> {
    return this.repository.findOne({
      where: { id },
      relations: ["assentos"],
    });
  }

  /** Retorna todos os voos cadastrados, com seus respectivos assentos. */
  public async listarTodos(): Promise<Voo[]> {
    return this.repository.find({ relations: ["assentos"] });
  }

  /**
   * Busca voos filtrando por origem e/ou destino (busca textual parcial,
   * sem diferenciar maiúsculas/minúsculas seria ideal em um banco
   * mais robusto; em SQLite, o "Like" já é case-insensitive por padrão
   * para caracteres ASCII).
   */
  public async buscarPorOrigemDestino(
    origem?: string,
    destino?: string
  ): Promise<Voo[]> {
    const queryBuilder = this.repository
      .createQueryBuilder("voo")
      .leftJoinAndSelect("voo.assentos", "assentos");

    if (origem) {
      queryBuilder.andWhere("voo.origem LIKE :origem", {
        origem: `%${origem}%`,
      });
    }

    if (destino) {
      queryBuilder.andWhere("voo.destino LIKE :destino", {
        destino: `%${destino}%`,
      });
    }

    return queryBuilder.getMany();
  }

  /** Remove um voo do sistema pelo id. */
  public async remover(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
