/**
 * Notificacao
 * -----------
 * Representa uma notificação enviada a um usuário.
 *
 * RELACIONAMENTO:
 * - MUITAS Notificações pertencem a 1 Usuario (ManyToOne).
 *
 * EVENTOS QUE GERAM NOTIFICAÇÃO (disparados pelos respectivos Services):
 * - Compra confirmada            -> PagamentoService / ReservaService
 * - Upgrade VIP confirmado       -> UpgradeVIPService
 * - Novo voo criado              -> VooService (apenas para usuários VIP/Admin, antecipado)
 * - Voo atrasado                 -> VooService
 * - Voo cancelado                -> VooService
 * - Promoções / Descontos        -> DescontoService
 *
 * Esta entidade é deliberadamente simples: a lógica de "para quem
 * enviar" e "quando enviar" fica no NotificacaoService.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Usuario } from "./Usuario";

@Entity("notificacao")
export class Notificacao {
  /** Identificador único da notificação. */
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** Texto da notificação exibido ao usuário. */
  @Column({ type: "varchar", length: 500 })
  mensagem!: string;

  /** Data e horário em que a notificação foi gerada. */
  @CreateDateColumn()
  data!: Date;

  /** Indica se o usuário já visualizou a notificação. */
  @Column({ type: "boolean", default: false })
  lida!: boolean;

  /** Usuário destinatário desta notificação. */
  @ManyToOne(() => Usuario, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "usuario_id" })
  usuario!: Usuario;

  /**
   * Marca a notificação como lida. Mantém o encapsulamento: o campo
   * "lida" só é alterado através deste método, e não diretamente.
   */
  public marcarComoLida(): void {
    this.lida = true;
  }
}
