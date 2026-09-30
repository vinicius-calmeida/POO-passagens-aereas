/**
 * Usuario (classe abstrata)
 * -------------------------
 * Classe base de toda a hierarquia de usuários do sistema.
 *
 * CONCEITOS DE POO APLICADOS AQUI:
 *
 * - ABSTRAÇÃO: "Usuario" nunca existe sozinho no mundo real do sistema -
 *   todo usuário É um UsuarioPadrao, um UsuarioVIP ou um Admin. Por isso
 *   a classe é "abstract": não pode ser instanciada diretamente
 *   (new Usuario() geraria erro de compilação).
 *
 * - ENCAPSULAMENTO: os atributos sensíveis (como a senha) são "protected",
 *   ou seja, acessíveis apenas pela própria classe e suas subclasses,
 *   nunca diretamente por código externo. O acesso controlado é feito
 *   por métodos públicos (getters) ou pela lógica de autenticação.
 *
 * - HERANÇA: UsuarioPadrao, UsuarioVIP e Admin estendem (extends) esta
 *   classe e reaproveitam id, nome, email, senha e dataCadastro.
 *
 * - POLIMORFISMO: o método "getPermissoes()" é declarado aqui como
 *   abstrato (sem corpo) e cada subclasse o implementa de forma
 *   diferente. Assim, em qualquer lugar do sistema que recebermos um
 *   "Usuario" (sem saber se é Padrao, VIP ou Admin), podemos chamar
 *   usuario.getPermissoes() e obter a resposta certa para o tipo real
 *   daquele objeto, sem precisar de "if/else" para cada tipo.
 *
 * MAPEAMENTO COM O BANCO DE DADOS (TypeORM):
 *
 * Usamos a estratégia "Single Table Inheritance" (Tabela única de
 * herança): todos os tipos de usuário (Padrao, VIP, Admin) são
 * armazenados na MESMA tabela "usuario" no SQLite, com uma coluna
 * extra chamada "tipo" que guarda o discriminador (qual subclasse
 * aquele registro representa). Isso é simples, eficiente e perfeito
 * para SQLite, que não tem suporte nativo confortável para várias
 * tabelas relacionadas por herança.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  TableInheritance,
  CreateDateColumn,
} from "typeorm";
import { TipoUsuario } from "../enums/TipoUsuario";

@Entity("usuario")
// Define que esta tabela usa herança de tabela única (Single Table Inheritance)
// e que a coluna discriminadora se chama "tipo_discriminador".
@TableInheritance({ column: { type: "varchar", name: "tipo_discriminador" } })
export abstract class Usuario {
  /** Identificador único do usuário (chave primária, gerado automaticamente). */
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** Nome completo do usuário. */
  @Column({ type: "varchar", length: 150 })
  nome!: string;

  /** E-mail do usuário, usado como login. Deve ser único no sistema. */
  @Column({ type: "varchar", length: 150, unique: true })
  email!: string;

  /**
   * Senha do usuário.
   * Protegida (protected): só a própria classe e subclasses podem acessá-la
   * diretamente. Qualquer verificação externa deve passar pelo AuthService.
   *
   * Observação: em um sistema real, a senha seria armazenada com hash
   * (bcrypt, argon2 etc.). Como este é um projeto acadêmico focado em POO
   * e arquitetura, mantemos a senha em texto puro para simplificar.
   */
  @Column({ type: "varchar", length: 255 })
  protected senha!: string;

  /** Data em que o usuário foi cadastrado no sistema. */
  @CreateDateColumn()
  dataCadastro!: Date;

  /**
   * Tipo do usuário (PADRAO, VIP ou ADMIN).
   * É preenchido automaticamente pelo construtor de cada subclasse,
   * e também é útil para respostas de API e regras de autorização
   * rápidas, sem precisar checar "instanceof".
   */
  @Column({ type: "varchar", length: 20 })
  tipo!: TipoUsuario;

  /**
   * Construtor protegido: força que apenas as subclasses possam
   * chamar "super(...)" para inicializar os campos comuns. Ninguém
   * pode fazer "new Usuario(...)" diretamente (além disso, a classe
   * já é abstract, então o TypeScript já bloqueia isso na compilação).
   */
  protected constructor(nome?: string, email?: string, senha?: string) {
    if (nome) this.nome = nome;
    if (email) this.email = email;
    if (senha) this.senha = senha;
  }

  /**
   * Verifica se a senha informada corresponde à senha do usuário.
   * É o único jeito "público" de comparar a senha, mantendo o
   * encapsulamento do atributo "senha".
   */
  public validarSenha(senhaInformada: string): boolean {
    return this.senha === senhaInformada;
  }

  /**
   * Permite alterar a senha do usuário de forma controlada.
   */
  public alterarSenha(novaSenha: string): void {
    this.senha = novaSenha;
  }

  /**
   * Método ABSTRATO: cada subclasse (UsuarioPadrao, UsuarioVIP, Admin)
   * é obrigada a implementar sua própria versão, retornando a lista de
   * permissões/funcionalidades que aquele tipo de usuário possui.
   *
   * Este é o exemplo mais claro de POLIMORFISMO no projeto: o mesmo
   * método, chamado a partir de uma variável do tipo "Usuario", se
   * comporta de forma diferente dependendo do tipo real do objeto.
   */
  public abstract getPermissoes(): string[];

  /**
   * Indica se este usuário tem direito a benefícios de VIP
   * (descontos, assentos VIP, notificação antecipada).
   * Por padrão é "false"; UsuarioVIP e Admin sobrescrevem para "true".
   */
  public possuiBeneficiosVIP(): boolean {
    return false;
  }

  /**
   * Indica se este usuário tem privilégios administrativos.
   * Por padrão é "false"; apenas Admin sobrescreve para "true".
   */
  public isAdmin(): boolean {
    return false;
  }
}
