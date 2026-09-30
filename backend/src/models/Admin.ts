/**
 * Admin
 * -----
 * Representa o administrador do sistema.
 *
 * HERANÇA: estende Usuario. Em termos de regras de negócio, o Admin
 * "possui tudo do VIP" - por isso ele também sobrescreve
 * possuiBeneficiosVIP() para "true" (um Admin pode, por exemplo,
 * comprar um assento VIP para si mesmo durante testes/operação).
 *
 * Permissões exclusivas:
 * - Cadastrar novos voos
 * - Alterar voos (rota, preço, data/hora)
 * - Alterar status dos voos (ATRASADA, CANCELADA)
 * - Gerenciar usuários
 * - Criar e remover descontos
 * - Consultar relatórios
 */

import { ChildEntity } from "typeorm";
import { Usuario } from "./Usuario";
import { TipoUsuario } from "../enums/TipoUsuario";

@ChildEntity(TipoUsuario.ADMIN)
export class Admin extends Usuario {
  constructor(nome?: string, email?: string, senha?: string) {
    super(nome, email, senha);
    this.tipo = TipoUsuario.ADMIN;
  }

  /**
   * POLIMORFISMO: a versão de getPermissoes() do Admin é a mais completa
   * de toda a hierarquia, incluindo tudo do VIP mais as permissões de
   * gerenciamento exclusivas do administrador.
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
      "CADASTRAR_VOO",
      "ALTERAR_VOO",
      "ALTERAR_STATUS_VOO",
      "GERENCIAR_USUARIOS",
      "CRIAR_DESCONTO",
      "REMOVER_DESCONTO",
      "CONSULTAR_RELATORIOS",
    ];
  }

  /** Admin também possui benefícios de VIP (herda tudo do VIP, conforme regra de negócio). */
  public override possuiBeneficiosVIP(): boolean {
    return true;
  }

  /** Sobrescreve para indicar que este usuário tem privilégios administrativos. */
  public override isAdmin(): boolean {
    return true;
  }
}
