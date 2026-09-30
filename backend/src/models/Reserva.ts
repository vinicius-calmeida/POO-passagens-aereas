/**
 * Reserva
 * -------
 * Representa a reserva/compra de um assento de um voo por um usuário.
 *
 * RELACIONAMENTOS:
 * - MUITAS Reservas pertencem a 1 Usuario (ManyToOne).
 * - MUITAS Reservas pertencem a 1 Voo (ManyToOne).
 * - 1 Reserva está ligada a 1 Assento específico (ManyToOne; na prática,
 *   cada Assento só é usado por, no máximo, uma Reserva ativa por vez,
 *   regra garantida pelo ReservaService através do campo "disponivel"
 *   do Assento).
 *
 * FLUXO DE STATUS (ver enum StatusReserva para detalhes):
 *   PENDENTE_PAGAMENTO -> CONFIRMADA -> (CANCELADA | REEMBOLSADA)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { StatusReserva } from "../enums/StatusReserva";
import { Usuario } from "./Usuario";
import { Voo } from "./Voo";
import { Assento } from "./Assento";

@Entity("reserva")
export class Reserva {
  /** Identificador único da reserva. */
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** Usuário que fez a reserva. */
  @ManyToOne(() => Usuario, { eager: true })
  @JoinColumn({ name: "usuario_id" })
  usuario!: Usuario;

  /** Voo reservado. */
  @ManyToOne(() => Voo, (voo) => voo.reservas, { eager: true })
  @JoinColumn({ name: "voo_id" })
  voo!: Voo;

  /** Assento específico reservado dentro do voo. */
  @ManyToOne(() => Assento, { eager: true })
  @JoinColumn({ name: "assento_id" })
  assento!: Assento;

  /**
   * Valor final cobrado pela passagem, já com eventuais descontos
   * (automáticos de VIP ou promocionais) aplicados. Calculado pelo
   * ReservaService no momento da criação da reserva.
   */
  @Column({ type: "float" })
  valorFinal!: number;

  /** Status atual da reserva. */
  @Column({
    type: "varchar",
    length: 25,
    default: StatusReserva.PENDENTE_PAGAMENTO,
  })
  status!: StatusReserva;

  /** Data em que a reserva foi criada. */
  @CreateDateColumn()
  dataCriacao!: Date;

  /**
   * Confirma o pagamento da reserva, fazendo a transição de
   * PENDENTE_PAGAMENTO -> CONFIRMADA.
   * Lança erro se a reserva não estiver no status esperado, evitando
   * transições inválidas (ex: confirmar uma reserva já cancelada).
   */
  public confirmarPagamento(): void {
    if (this.status !== StatusReserva.PENDENTE_PAGAMENTO) {
      throw new Error(
        `Não é possível confirmar pagamento de uma reserva com status ${this.status}.`
      );
    }
    this.status = StatusReserva.CONFIRMADA;
  }

  /**
   * Cancela a reserva (ação do próprio usuário).
   * Pode ser feita tanto a partir de PENDENTE_PAGAMENTO quanto de
   * CONFIRMADA (ex: usuário desiste da viagem depois de já ter pagado).
   */
  public cancelar(): void {
    if (
      this.status === StatusReserva.CANCELADA ||
      this.status === StatusReserva.REEMBOLSADA
    ) {
      throw new Error("Esta reserva já está cancelada ou reembolsada.");
    }
    this.status = StatusReserva.CANCELADA;
  }

  /**
   * Marca a reserva como REEMBOLSADA. Usado exclusivamente quando o
   * ADM cancela o voo inteiro (todas as reservas daquele voo mudam
   * automaticamente para este status, ver VooService.cancelarVoo()).
   */
  public reembolsar(): void {
    this.status = StatusReserva.REEMBOLSADA;
  }
}
