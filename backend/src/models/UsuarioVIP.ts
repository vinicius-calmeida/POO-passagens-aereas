/**
 * UsuarioVIP
 * ----------
 * Representa o usuário com status VIP, que possui tudo que o
 * UsuarioPadrao possui, além de benefícios extras.
 *
 * HERANÇA: estende Usuario diretamente (não estende UsuarioPadrao,
 * pois "ser VIP" não é uma especialização de "ser Padrao" em termos de
 * modelagem - são dois papéis distintos, ambos derivados de Usuario).
 * A transição de Padrao -> VIP é tratada como uma operação de negócio
 * (UpgradeVIPService), não como herança de classes.
 *
 * Benefícios adicionais:
 * - Desconto em voos nacionais e internacionais
 * - Recebe notificações antecipadas (voos com status NOVA)
 * - Pode comprar assentos VIP e ECONOMICO
 */

import { ChildEntity } from "typeorm";
import { Usuario } from "./Usuario";
import { TipoUsuario } from "../enums/TipoUsuario";

@ChildEntity(TipoUsuario.VIP)
export class UsuarioVIP extends Usuario {
  constructor(nome?: string, email?: string, senha?: string) {
    super(nome, email, senha);
    this.tipo = TipoUsuario.VIP;
  }

  /**
   * POLIMORFISMO: o usuário VIP tem uma lista de permissões mais ampla
   * que o usuário padrão, incluindo a compra de assentos VIP.
   */
  public getPermissoes(): string[] {
    return [
      "LOGIN",
      "VISUALIZAR_VOOS",
      "COMPRAR_PASSAGEM_ECONOMICA",
      "COMPRAR_PASSAGEM_VIP",
      "VISUALIZAR_RESERVAS",
      "CANCELAR_RESERVA",
      "RECEBER_DESCONTO_AUTOMATICO",
      "RECEBER_NOTIFICACAO_ANTECIPADA",
    ];
  }

  /**
   * Sobrescreve (override) o comportamento padrão da classe base:
   * usuários VIP sempre têm direito aos benefícios de VIP.
   * Este é outro exemplo de POLIMORFISMO: o mesmo método se comporta
   * de forma diferente dependendo da classe concreta do objeto.
   */
  public override possuiBeneficiosVIP(): boolean {
    return true;
  }
}
