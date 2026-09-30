/**
 * Voo
 * ---
 * Representa um voo cadastrado no sistema.
 *
 * RELACIONAMENTOS:
 * - 1 Voo tem MUITOS Assentos (OneToMany / ManyToOne com Assento).
 * - 1 Voo tem MUITAS Reservas (OneToMany / ManyToOne com Reserva).
 *
 * REGRAS DE NEGÓCIO IMPORTANTES (aplicadas no VooService, não aqui):
 * - status NOVA: voo com menos de 2 dias desde dataCadastro.
 * - status ULTIMAS_PASSAGENS: quando restam <= 10 assentos disponíveis.
 * - status ESGOTADA: quando não há nenhum assento disponível.
 * - status ATRASADA / CANCELADA: somente ADMIN pode definir manualmente.
 *
 * Esta classe é deliberadamente "anêmica" em termos de regras de negócio
 * complexas (ela não decide, por exemplo, se deve virar ESGOTADA) -
 * isso é responsabilidade do VooService, mantendo a separação de
 * camadas (Model = dados e estrutura / Service = regras de negócio).
 * A classe expõe, porém, alguns métodos utilitários simples e ligados
 * diretamente ao seu próprio estado (ver "contarAssentosDisponiveis").
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { TipoVoo } from "../enums/TipoVoo";
import { StatusVoo } from "../enums/StatusVoo";
import { Assento } from "./Assento";
import { Reserva } from "./Reserva";
import { ClasseAssento } from "../enums/ClasseAssento";

@Entity("voo")
export class Voo {
  /** Identificador único do voo. */
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** Cidade/aeroporto de origem. */
  @Column({ type: "varchar", length: 100 })
  origem!: string;

  /** Cidade/aeroporto de destino. */
  @Column({ type: "varchar", length: 100 })
  destino!: string;

  /** Data e horário de partida do voo. */
  @Column({ type: "datetime" })
  dataHora!: Date;

  /** Preço base do voo (sem descontos aplicados). */
  @Column({ type: "float" })
  precoBase!: number;

  /** Classifica o voo como NACIONAL ou INTERNACIONAL. */
  @Column({ type: "varchar", length: 20 })
  tipoVoo!: TipoVoo;

  /** Status atual do voo (NOVA, A_VENDA, ULTIMAS_PASSAGENS, ESGOTADA, ATRASADA, CANCELADA). */
  @Column({ type: "varchar", length: 25, default: StatusVoo.NOVA })
  status!: StatusVoo;

  /** Data em que o voo foi cadastrado no sistema (usada para calcular o status NOVA). */
  @CreateDateColumn()
  dataCadastro!: Date;

  /**
   * Lista de assentos deste voo.
   * "cascade: true" garante que, ao salvar um Voo com assentos novos
   * (ainda sem id), o TypeORM salva os assentos automaticamente junto.
   */
  @OneToMany(() => Assento, (assento) => assento.voo, { cascade: true })
  assentos!: Assento[];

  /** Lista de reservas feitas para este voo. */
  @OneToMany(() => Reserva, (reserva) => reserva.voo)
  reservas!: Reserva[];

  /**
   * Conta quantos assentos de determinada classe (ou de todas as
   * classes, se não informado) ainda estão disponíveis para venda.
   *
   * Método utilitário simples sobre o próprio estado do objeto -
   * diferente de regras de negócio mais complexas (que ficam no
   * VooService), este cálculo só "lê" os dados que o próprio Voo
   * já possui em memória (assentos), sem decidir nada sobre o
   * sistema como um todo.
   */
  public contarAssentosDisponiveis(classe?: ClasseAssento): number {
    if (!this.assentos) return 0;

    return this.assentos.filter((assento) => {
      const disponivel = assento.disponivel;
      const classeCorresponde = classe ? assento.classe === classe : true;
      return disponivel && classeCorresponde;
    }).length;
  }

  /**
   * Verifica se o voo já se encontra em um status "final" (não pode
   * mais receber novas compras): ESGOTADA, ATRASADA, CANCELADA ou
   * REALIZADO (a dataHora do voo já passou).
   */
  public estaIndisponivelParaCompra(): boolean {
    return (
      this.status === StatusVoo.ESGOTADA ||
      this.status === StatusVoo.ATRASADA ||
      this.status === StatusVoo.CANCELADA ||
      this.status === StatusVoo.REALIZADO
    );
  }
}
