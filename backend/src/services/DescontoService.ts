/**
 * DescontoService
 * ---------------
 * Responsável pelo gerenciamento de descontos do sistema.
 *
 * REGRAS DE NEGÓCIO:
 * - Apenas ADMIN pode criar ou remover (desativar) descontos
 *   (validação feita aqui através do método isAdmin() do Usuario,
 *   reaproveitando o polimorfismo definido em Usuario.ts).
 * - Cada desconto pertence a um público (GERAL ou VIP, ver enum
 *   PublicoDesconto). Descontos GERAL são recebidos automaticamente
 *   por QUALQUER usuário; descontos VIP, apenas por usuários com
 *   benefícios VIP (UsuarioVIP ou Admin). Em ambos os casos, não há
 *   nenhuma ação manual do usuário - o desconto aplicável é resolvido
 *   automaticamente (ver buscarMelhorDesconto()).
 * - Cada desconto se aplica a um TipoVoo específico.
 * - Descontos não se acumulam: quando mais de um desconto ativo é
 *   elegível para o usuário e tipo de voo, aplica-se apenas o de
 *   maior percentual.
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Desconto } from "../models/Desconto";
import { TipoVoo } from "../enums/TipoVoo";
import { PublicoDesconto } from "../enums/PublicoDesconto";
import { Usuario } from "../models/Usuario";

export class DescontoService {
  private repository: Repository<Desconto>;

  constructor() {
    this.repository = AppDataSource.getRepository(Desconto);
  }

  /**
   * Cria um novo desconto no sistema.
   * Lança erro se o usuário solicitante não for ADMIN, reaproveitando
   * o método polimórfico isAdmin() (POLIMORFISMO: funciona para
   * qualquer subclasse de Usuario, sem precisar de "instanceof").
   */
  public async criar(
    solicitante: Usuario,
    nome: string,
    percentual: number,
    tipoVooAplicavel: TipoVoo,
    publico: PublicoDesconto = PublicoDesconto.GERAL
  ): Promise<Desconto> {
    if (!solicitante.isAdmin()) {
      throw new Error("Apenas administradores podem criar descontos.");
    }

    if (percentual <= 0 || percentual > 100) {
      throw new Error("O percentual de desconto deve estar entre 1 e 100.");
    }

    const desconto = new Desconto();
    desconto.nome = nome;
    desconto.percentual = percentual;
    desconto.tipoVooAplicavel = tipoVooAplicavel;
    desconto.publico = publico;
    desconto.ativo = true;

    return this.repository.save(desconto);
  }

  /**
   * Remove (na prática, desativa) um desconto.
   * Mantemos o registro no banco por questões de histórico/relatórios,
   * mas ele deixa de ser aplicado em novas compras.
   */
  public async remover(solicitante: Usuario, descontoId: string): Promise<Desconto> {
    if (!solicitante.isAdmin()) {
      throw new Error("Apenas administradores podem remover descontos.");
    }

    const desconto = await this.repository.findOne({
      where: { id: descontoId },
    });

    if (!desconto) {
      throw new Error("Desconto não encontrado.");
    }

    desconto.desativar();
    return this.repository.save(desconto);
  }

  /** Lista todos os descontos cadastrados (ativos e inativos), útil para relatórios do ADM. */
  public async listarTodos(): Promise<Desconto[]> {
    return this.repository.find();
  }

  /** Lista apenas os descontos atualmente ativos. */
  public async listarAtivos(): Promise<Desconto[]> {
    return this.repository.find({ where: { ativo: true } });
  }

  /**
   * Busca o melhor desconto ativo aplicável a um determinado tipo de
   * voo E elegível para o usuário (considerando se ele possui ou não
   * benefícios VIP). Entre todos os descontos elegíveis (GERAL sempre
   * é elegível; VIP só se o usuário tiver benefícios VIP), retorna o
   * de MAIOR PERCENTUAL - os descontos nunca se acumulam. Retorna
   * null se não houver nenhum desconto ativo elegível.
   *
   * Este método é o ponto de integração com o ReservaService: ao
   * comprar uma passagem, o ReservaService chama este método para
   * aplicar o desconto automaticamente, sem que o usuário precise
   * inserir nenhum cupom - tanto para usuários PADRAO (que só são
   * elegíveis a descontos GERAL) quanto para VIP/Admin (elegíveis a
   * GERAL e VIP, prevalecendo o de maior percentual).
   */
  public async buscarMelhorDesconto(
    tipoVoo: TipoVoo,
    usuarioPossuiBeneficiosVIP: boolean
  ): Promise<Desconto | null> {
    const descontosAtivos = await this.repository.find({
      where: { tipoVooAplicavel: tipoVoo, ativo: true },
    });

    const descontosElegiveis = descontosAtivos.filter((desconto) =>
      desconto.aplicavelPara(usuarioPossuiBeneficiosVIP)
    );

    if (descontosElegiveis.length === 0) return null;

    return descontosElegiveis.reduce((melhor, atual) =>
      atual.percentual > melhor.percentual ? atual : melhor
    );
  }
}
