/**
 * VooService
 * ----------
 * Centraliza toda a regra de negócio relacionada a voos: cadastro,
 * busca, atualização de status (automática e manual) e os efeitos de
 * atraso/cancelamento (notificações e reembolsos).
 *
 * REGRAS DE STATUS (ver enum StatusVoo para detalhes):
 * - NOVA: calculado automaticamente (menos de 2 dias desde o cadastro).
 * - A_VENDA: situação normal.
 * - ULTIMAS_PASSAGENS: <= 10 assentos disponíveis.
 * - ESGOTADA: 0 assentos disponíveis.
 * - REALIZADO: calculado automaticamente quando a dataHora do voo já
 *   passou (tem prioridade sobre ESGOTADA/ULTIMAS_PASSAGENS/NOVA/A_VENDA).
 * - ATRASADA / CANCELADA: somente ADMIN pode definir manualmente.
 *
 * REGRA DE DATA: o ADMIN não pode cadastrar nem alterar um voo para
 * uma dataHora no passado (ver cadastrarVoo() e alterarVoo()). A
 * busca pública de voos (listarTodos()/buscarPorOrigemDestino(), com
 * incluirRealizados=false, que é o padrão) nunca retorna voos com
 * status REALIZADO; a tela administrativa pode pedir o histórico
 * completo passando incluirRealizados=true.
 *
 * Dependências: VooRepository (dados de voo), ReservaRepository
 * (para localizar passageiros ao notificar/reembolsar) e
 * NotificacaoService (para disparar os avisos).
 */

import { VooRepository } from "../repositories/VooRepository";
import { ReservaRepository } from "../repositories/ReservaRepository";
import { NotificacaoService } from "./NotificacaoService";
import { Voo } from "../models/Voo";
import { Assento } from "../models/Assento";
import { Usuario } from "../models/Usuario";
import { TipoVoo } from "../enums/TipoVoo";
import { StatusVoo } from "../enums/StatusVoo";
import { ClasseAssento } from "../enums/ClasseAssento";
import { GeradorId } from "../utils/GeradorId";

/** Quantidade de assentos VIP gerados automaticamente ao cadastrar um voo (o restante é ECONOMICO). */
const ASSENTOS_VIP_PADRAO = 8;

/** Limite de assentos disponíveis para o voo entrar em status ULTIMAS_PASSAGENS. */
const LIMITE_ULTIMAS_PASSAGENS = 10;

/** Dias após o cadastro em que o voo deixa de ser considerado NOVA. */
const DIAS_LIMITE_VOO_NOVO = 2;

export class VooService {
  private vooRepository: VooRepository;
  private reservaRepository: ReservaRepository;
  private notificacaoService: NotificacaoService;

  constructor() {
    this.vooRepository = new VooRepository();
    this.reservaRepository = new ReservaRepository();
    this.notificacaoService = new NotificacaoService();
  }

  /**
   * Cadastra um novo voo no sistema. Apenas ADMIN pode realizar esta
   * operação (validado via solicitante.isAdmin(), método polimórfico).
   *
   * Gera automaticamente a lista de assentos do voo: os primeiros
   * "ASSENTOS_VIP_PADRAO" assentos são da classe VIP, o restante é
   * ECONOMICO.
   */
  public async cadastrarVoo(
    solicitante: Usuario,
    origem: string,
    destino: string,
    dataHora: Date,
    precoBase: number,
    tipoVoo: TipoVoo,
    quantidadeAssentos: number
  ): Promise<Voo> {
    if (!solicitante.isAdmin()) {
      throw new Error("Apenas administradores podem cadastrar voos.");
    }

    if (precoBase <= 0) {
      throw new Error("O preço base do voo deve ser maior que zero.");
    }

    if (quantidadeAssentos <= 0) {
      throw new Error("A quantidade de assentos deve ser maior que zero.");
    }

    if (dataHora.getTime() <= Date.now()) {
      throw new Error(
        "A data e horário do voo devem ser no futuro. Não é possível cadastrar voos com data/horário já passados."
      );
    }

    const voo = new Voo();
    voo.origem = origem;
    voo.destino = destino;
    voo.dataHora = dataHora;
    voo.precoBase = precoBase;
    voo.tipoVoo = tipoVoo;
    voo.status = StatusVoo.NOVA;
    voo.assentos = this.gerarAssentos(quantidadeAssentos);

    const vooSalvo = await this.vooRepository.salvar(voo);

    // Notificação de "novo voo criado" para usuários VIP/Admin é
    // disparada pelo Controller (que tem acesso à lista de usuários),
    // mantendo este método focado apenas na criação do voo em si.

    return vooSalvo;
  }

  /**
   * Gera a lista de assentos de um voo novo, distribuindo a
   * quantidade informada entre VIP (até ASSENTOS_VIP_PADRAO) e
   * ECONOMICO (o restante).
   */
  private gerarAssentos(quantidadeTotal: number): Assento[] {
    const numerosAssento = GeradorId.gerarNumerosAssento(quantidadeTotal);
    const quantidadeVip = Math.min(ASSENTOS_VIP_PADRAO, quantidadeTotal);

    return numerosAssento.map((numero, index) => {
      const assento = new Assento();
      assento.numero = numero;
      assento.classe =
        index < quantidadeVip ? ClasseAssento.VIP : ClasseAssento.ECONOMICO;
      assento.disponivel = true;
      return assento;
    });
  }

  /** Busca um voo pelo id, já recalculando seu status automático antes de retornar. */
  public async buscarPorId(id: string): Promise<Voo | null> {
    const voo = await this.vooRepository.buscarPorId(id);
    if (!voo) return null;

    return this.atualizarStatusAutomatico(voo);
  }

  /**
   * Lista os voos do sistema, recalculando o status automático
   * (NOVA / A_VENDA / ULTIMAS_PASSAGENS / ESGOTADA / REALIZADO) de
   * cada um antes de retornar. Voos em ATRASADA ou CANCELADA não são
   * recalculados, pois esses status são definidos manualmente pelo
   * ADM e devem permanecer até nova decisão administrativa.
   *
   * @param incluirRealizados Se false (padrão), voos cuja dataHora já
   * passou (status REALIZADO) são removidos do resultado - é o
   * comportamento esperado para a busca pública de voos, onde só
   * interessa ver voos futuros disponíveis para compra. Se true,
   * todos os voos são retornados, incluindo os já realizados - usado
   * pela tela administrativa de gerenciamento de voos.
   */
  public async listarTodos(incluirRealizados: boolean = false): Promise<Voo[]> {
    const voos = await this.vooRepository.listarTodos();
    const voosAtualizados = await Promise.all(
      voos.map((voo) => this.atualizarStatusAutomatico(voo))
    );

    if (incluirRealizados) {
      return voosAtualizados;
    }

    return voosAtualizados.filter((voo) => voo.status !== StatusVoo.REALIZADO);
  }

  /** Busca voos filtrando por origem e/ou destino. Mesmo comportamento de filtro de "incluirRealizados" de listarTodos(). */
  public async buscarPorOrigemDestino(
    origem?: string,
    destino?: string,
    incluirRealizados: boolean = false
  ): Promise<Voo[]> {
    const voos = await this.vooRepository.buscarPorOrigemDestino(
      origem,
      destino
    );
    const voosAtualizados = await Promise.all(
      voos.map((voo) => this.atualizarStatusAutomatico(voo))
    );

    if (incluirRealizados) {
      return voosAtualizados;
    }

    return voosAtualizados.filter((voo) => voo.status !== StatusVoo.REALIZADO);
  }

  /**
   * Recalcula e persiste o status automático de um voo, com base em
   * sua data de partida, data de cadastro e na quantidade de assentos
   * disponíveis.
   *
   * Esta lógica NÃO se aplica caso o voo já esteja em ATRASADA ou
   * CANCELADA, pois esses são status manuais definidos pelo ADM e têm
   * prioridade sobre o cálculo automático.
   *
   * PRIORIDADE DE REGRAS: a verificação de REALIZADO (voo cuja
   * dataHora já passou) tem prioridade sobre ESGOTADA/ULTIMAS_PASSAGENS,
   * pois um voo que já ocorreu não faz mais sentido aparecer como
   * "disponível" ou "últimas passagens", independentemente da
   * quantidade de assentos que ainda constem como livres no banco.
   */
  private async atualizarStatusAutomatico(voo: Voo): Promise<Voo> {
    if (voo.status === StatusVoo.ATRASADA || voo.status === StatusVoo.CANCELADA) {
      return voo;
    }

    const vooJaPassou = new Date(voo.dataHora).getTime() <= Date.now();

    if (vooJaPassou) {
      if (voo.status !== StatusVoo.REALIZADO) {
        voo.status = StatusVoo.REALIZADO;
        return this.vooRepository.salvar(voo);
      }
      return voo;
    }

    const diasDesdeCadastro =
      (Date.now() - new Date(voo.dataCadastro).getTime()) /
      (1000 * 60 * 60 * 24);

    const assentosDisponiveis = voo.contarAssentosDisponiveis();

    let novoStatus: StatusVoo;

    if (assentosDisponiveis === 0) {
      novoStatus = StatusVoo.ESGOTADA;
    } else if (assentosDisponiveis <= LIMITE_ULTIMAS_PASSAGENS) {
      novoStatus = StatusVoo.ULTIMAS_PASSAGENS;
    } else if (diasDesdeCadastro < DIAS_LIMITE_VOO_NOVO) {
      novoStatus = StatusVoo.NOVA;
    } else {
      novoStatus = StatusVoo.A_VENDA;
    }

    if (novoStatus !== voo.status) {
      voo.status = novoStatus;
      return this.vooRepository.salvar(voo);
    }

    return voo;
  }

  /**
   * Altera os dados de um voo existente (rota, data/hora ou preço).
   * Apenas ADMIN pode alterar voos. Não permite alterar o "status"
   * através deste método - isso é feito por marcarAtrasado() e
   * marcarCancelado(), que possuem efeitos colaterais específicos
   * (notificações e reembolsos).
   */
  public async alterarVoo(
    solicitante: Usuario,
    vooId: string,
    dados: Partial<Pick<Voo, "origem" | "destino" | "dataHora" | "precoBase">>
  ): Promise<Voo> {
    if (!solicitante.isAdmin()) {
      throw new Error("Apenas administradores podem alterar voos.");
    }

    const voo = await this.vooRepository.buscarPorId(vooId);
    if (!voo) {
      throw new Error("Voo não encontrado.");
    }

    if (dados.dataHora !== undefined && dados.dataHora.getTime() <= Date.now()) {
      throw new Error(
        "A data e horário do voo devem ser no futuro. Não é possível alterar o voo para uma data/horário já passado."
      );
    }

    if (dados.origem !== undefined) voo.origem = dados.origem;
    if (dados.destino !== undefined) voo.destino = dados.destino;
    if (dados.dataHora !== undefined) voo.dataHora = dados.dataHora;
    if (dados.precoBase !== undefined) voo.precoBase = dados.precoBase;

    return this.vooRepository.salvar(voo);
  }

  /**
   * Marca o voo como ATRASADA. Somente ADMIN pode realizar esta ação.
   * Todos os passageiros com reservas neste voo recebem notificação.
   */
  public async marcarAtrasado(solicitante: Usuario, vooId: string): Promise<Voo> {
    if (!solicitante.isAdmin()) {
      throw new Error("Apenas administradores podem marcar um voo como atrasado.");
    }

    const voo = await this.vooRepository.buscarPorId(vooId);
    if (!voo) {
      throw new Error("Voo não encontrado.");
    }

    voo.status = StatusVoo.ATRASADA;
    const vooAtualizado = await this.vooRepository.salvar(voo);

    await this.notificarPassageiros(
      vooId,
      "Seu voo sofreu atraso. Consulte os detalhes."
    );

    return vooAtualizado;
  }

  /**
   * Marca o voo como CANCELADA. Somente ADMIN pode realizar esta ação.
   * Todos os passageiros recebem notificação e TODAS as reservas
   * deste voo são automaticamente alteradas para REEMBOLSADA.
   */
  public async marcarCancelado(solicitante: Usuario, vooId: string): Promise<Voo> {
    if (!solicitante.isAdmin()) {
      throw new Error("Apenas administradores podem cancelar um voo.");
    }

    const voo = await this.vooRepository.buscarPorId(vooId);
    if (!voo) {
      throw new Error("Voo não encontrado.");
    }

    voo.status = StatusVoo.CANCELADA;
    const vooAtualizado = await this.vooRepository.salvar(voo);

    // Reembolsa automaticamente todas as reservas deste voo.
    const reservas = await this.reservaRepository.listarPorVoo(vooId);
    for (const reserva of reservas) {
      reserva.reembolsar();
      await this.reservaRepository.salvar(reserva);
    }

    await this.notificarPassageiros(
      vooId,
      "Seu voo foi cancelado. O reembolso já foi realizado."
    );

    return vooAtualizado;
  }

  /**
   * Busca todos os passageiros (usuários) com reservas em um voo e
   * envia a mesma mensagem de notificação para todos eles.
   * Reaproveitado tanto por marcarAtrasado() quanto por
   * marcarCancelado(), evitando duplicação de código.
   */
  private async notificarPassageiros(vooId: string, mensagem: string): Promise<void> {
    const reservas = await this.reservaRepository.listarPorVoo(vooId);
    const usuarios = reservas.map((reserva) => reserva.usuario);

    if (usuarios.length > 0) {
      await this.notificacaoService.notificarVarios(usuarios, mensagem);
    }
  }

  /** Remove um voo do sistema (apenas ADMIN). */
  public async removerVoo(solicitante: Usuario, vooId: string): Promise<void> {
    if (!solicitante.isAdmin()) {
      throw new Error("Apenas administradores podem remover voos.");
    }
    await this.vooRepository.remover(vooId);
  }
}
