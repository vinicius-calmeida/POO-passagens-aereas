/**
 * UsuarioPadrao
 * -------------
 * Representa o usuário comum do sistema (sem benefícios VIP).
 *
 * HERANÇA: estende Usuario, reaproveitando id, nome, email, senha,
 * dataCadastro e tipo.
 *
 * Pode:
 * - Fazer login
 * - Visualizar voos
 * - Comprar passagens (apenas assentos ECONOMICO)
 * - Visualizar e cancelar suas próprias reservas
 * - Solicitar upgrade para VIP
 *
 * Não pode:
 * - Comprar assentos VIP
 * - Cadastrar/alterar voos
 * - Criar descontos
 */

import { ChildEntity } from "typeorm";
import { Usuario } from "./Usuario";
import { TipoUsuario } from "../enums/TipoUsuario";

// @ChildEntity marca esta classe como uma "subtabela virtual" dentro da
// tabela única "usuario" (Single Table Inheritance). O TypeORM usa o
// valor informado para preencher a coluna discriminadora "tipo_discriminador".
@ChildEntity(TipoUsuario.PADRAO)
export class UsuarioPadrao extends Usuario {
  constructor(nome?: string, email?: string, senha?: string) {
    // Chama o construtor da classe base (Usuario) para inicializar os
    // atributos comuns.
    super(nome, email, senha);
    this.tipo = TipoUsuario.PADRAO;
  }

  /**
   * POLIMORFISMO: implementação específica de getPermissoes() para o
   * usuário padrão. Cada subclasse retorna uma lista diferente.
   */
  public getPermissoes(): string[] {
    return [
      "LOGIN",
      "VISUALIZAR_VOOS",
      "COMPRAR_PASSAGEM_ECONOMICA",
      "VISUALIZAR_RESERVAS",
      "CANCELAR_RESERVA",
      "SOLICITAR_UPGRADE_VIP",
    ];
  }

  // possuiBeneficiosVIP() e isAdmin() não são sobrescritos aqui:
  // o UsuarioPadrao usa a implementação padrão da classe base (ambos "false").
}
