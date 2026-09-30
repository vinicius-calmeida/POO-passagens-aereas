/**
 * UsuarioRepository
 * -----------------
 * Camada de acesso a dados (Repository Pattern) para a entidade Usuario
 * e suas subclasses (UsuarioPadrao, UsuarioVIP, Admin).
 *
 * POR QUE TER UM REPOSITORY SEPARADO DO SERVICE?
 * - Separação de responsabilidades: o Repository SÓ sabe conversar com
 *   o banco de dados (queries). Ele não conhece regras de negócio
 *   (ex: "VIP recebe desconto automático" não é problema do Repository).
 * - Os Services (AuthService, UpgradeVIPService, etc.) dependem deste
 *   Repository para buscar/salvar dados, mas nunca importam o TypeORM
 *   diretamente. Isso facilita trocar a tecnologia de persistência no
 *   futuro sem precisar alterar a lógica de negócio.
 *
 * Como a tabela "usuario" usa Single Table Inheritance (ver Usuario.ts),
 * todas as consultas aqui usam o repositório da classe BASE (Usuario).
 * O TypeORM automaticamente devolve instâncias da subclasse correta
 * (UsuarioPadrao, UsuarioVIP ou Admin) com base na coluna discriminadora.
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Usuario } from "../models/Usuario";

export class UsuarioRepository {
  /** Repositório nativo do TypeORM para a entidade base Usuario. */
  private repository: Repository<Usuario>;

  constructor() {
    this.repository = AppDataSource.getRepository(Usuario);
  }

  /**
   * Salva um usuário (cria se for novo, atualiza se já existir).
   * Funciona com qualquer subclasse (UsuarioPadrao, UsuarioVIP, Admin)
   * graças ao polimorfismo do TypeORM com Single Table Inheritance.
   */
  public async salvar(usuario: Usuario): Promise<Usuario> {
    return this.repository.save(usuario);
  }

  /** Busca um usuário pelo id. Retorna null se não encontrado. */
  public async buscarPorId(id: string): Promise<Usuario | null> {
    return this.repository.findOne({ where: { id } });
  }

  /** Busca um usuário pelo e-mail (usado no login). Retorna null se não encontrado. */
  public async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.repository.findOne({ where: { email } });
  }

  /** Retorna todos os usuários cadastrados no sistema. */
  public async listarTodos(): Promise<Usuario[]> {
    return this.repository.find();
  }

  /** Remove um usuário do sistema pelo id. */
  public async remover(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  /** Verifica se já existe um usuário cadastrado com o e-mail informado. */
  public async existeEmail(email: string): Promise<boolean> {
    const usuario = await this.buscarPorEmail(email);
    return usuario !== null;
  }
}
