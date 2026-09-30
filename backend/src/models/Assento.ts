/**
 * Assento
 * -------
 * Representa um assento físico dentro de um voo específico.
 *
 * RELACIONAMENTO:
 * - MUITOS Assentos pertencem a 1 Voo (ManyToOne / inverso de Voo.assentos).
 *
 * REGRA DE NEGÓCIO (validada no ReservaService, não aqui):
 * - Usuário PADRAO só pode reservar assentos com classe ECONOMICO.
 * - Usuário VIP/ADMIN pode reservar ECONOMICO ou VIP.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ClasseAssento } from "../enums/ClasseAssento";
import { Voo } from "./Voo";

@Entity("assento")
export class Assento {
  /** Identificador único do assento. */
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** Número/identificação do assento dentro da aeronave (ex: "12A", "3C"). */
  @Column({ type: "varchar", length: 10 })
  numero!: string;

  /** Classe do assento: ECONOMICO ou VIP. */
  @Column({ type: "varchar", length: 20 })
  classe!: ClasseAssento;

  /** Indica se o assento está livre (true) ou já reservado/vendido (false). */
  @Column({ type: "boolean", default: true })
  disponivel!: boolean;

  /** Voo ao qual este assento pertence. */
  @ManyToOne(() => Voo, (voo) => voo.assentos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "voo_id" })
  voo!: Voo;

  /**
   * Marca o assento como ocupado (chamado ao confirmar uma reserva,
   * via ReservaService). Mantém o encapsulamento: o estado interno
   * "disponivel" só muda através deste método, evitando que qualquer
   * parte do código defina o valor diretamente sem controle.
   */
  public reservar(): void {
    if (!this.disponivel) {
      throw new Error("Este assento já está ocupado.");
    }
    this.disponivel = false;
  }

  /**
   * Libera o assento novamente (chamado ao cancelar uma reserva ou
   * quando um voo inteiro é cancelado pelo ADM e todas as reservas
   * são reembolsadas).
   */
  public liberar(): void {
    this.disponivel = true;
  }
}
