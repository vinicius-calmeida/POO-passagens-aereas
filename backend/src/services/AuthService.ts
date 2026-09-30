/**
 * AuthService
 * -----------
 * Responsável pela autenticação e cadastro de usuários no sistema.
 *
 * RESPONSABILIDADES:
 * - login(): autentica um usuário pelo e-mail/senha e identifica seu
 *   tipo (PADRAO, VIP ou ADMIN), liberando funcionalidades de acordo
 *   com o perfil.
 * - cadastrar(): cria um novo usuário, instanciando a SUBCLASSE
 *   correta de Usuario (UsuarioPadrao, UsuarioVIP ou Admin) com base
 *   no tipo informado.
 * - logout(): nesta API stateless (sem sessão de servidor), o logout
 *   é simbólico - o "estado de login" fica a cargo de quem consome a
 *   API (frontend), mas o método é mantido para completude da
 *   especificação e poderia, no futuro, ser usado para invalidar
 *   tokens/sessões.
 *
 * Este service depende apenas do UsuarioRepository - nunca acessa o
 * TypeORM diretamente, respeitando a separação de camadas.
 */

import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { Usuario } from "../models/Usuario";
import { UsuarioPadrao } from "../models/UsuarioPadrao";
import { UsuarioVIP } from "../models/UsuarioVIP";
import { Admin } from "../models/Admin";
import { TipoUsuario } from "../enums/TipoUsuario";

export class AuthService {
  private usuarioRepository: UsuarioRepository;

  constructor() {
    this.usuarioRepository = new UsuarioRepository();
  }

  /**
   * Cadastra um novo usuário no sistema.
   *
   * POLIMORFISMO/FACTORY: com base no "tipo" informado, instanciamos a
   * subclasse concreta correta. Quem chama este método (o
   * AuthController) não precisa saber os detalhes de cada subclasse -
   * apenas recebe de volta um objeto do tipo "Usuario" e pode tratá-lo
   * de forma uniforme (ex: chamando usuario.getPermissoes()).
   */
  public async cadastrar(
    nome: string,
    email: string,
    senha: string,
    tipo: TipoUsuario = TipoUsuario.PADRAO
  ): Promise<Usuario> {
    if (!nome || !email || !senha) {
      throw new Error("Nome, e-mail e senha são obrigatórios.");
    }

    const emailJaCadastrado = await this.usuarioRepository.existeEmail(email);
    if (emailJaCadastrado) {
      throw new Error("Já existe um usuário cadastrado com este e-mail.");
    }

    let novoUsuario: Usuario;

    switch (tipo) {
      case TipoUsuario.VIP:
        novoUsuario = new UsuarioVIP(nome, email, senha);
        break;
      case TipoUsuario.ADMIN:
        novoUsuario = new Admin(nome, email, senha);
        break;
      case TipoUsuario.PADRAO:
      default:
        novoUsuario = new UsuarioPadrao(nome, email, senha);
        break;
    }

    return this.usuarioRepository.salvar(novoUsuario);
  }

  /**
   * Autentica um usuário pelo e-mail e senha.
   * Retorna o usuário autenticado (já com o tipo correto resolvido
   * pelo TypeORM via Single Table Inheritance) ou lança erro caso as
   * credenciais sejam inválidas.
   */
  public async login(email: string, senha: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.buscarPorEmail(email);

    if (!usuario) {
      throw new Error("E-mail ou senha inválidos.");
    }

    // validarSenha() é um método público de Usuario que compara com o
    // atributo protegido "senha", mantendo o encapsulamento.
    const senhaValida = usuario.validarSenha(senha);
    if (!senhaValida) {
      throw new Error("E-mail ou senha inválidos.");
    }

    return usuario;
  }

  /**
   * Logout simbólico. Em uma API stateless (sem sessão guardada no
   * servidor), não há nada para "destruir" no backend - este método
   * existe para completude da especificação e como ponto de extensão
   * futuro (ex: invalidação de token JWT, blacklist, etc.).
   */
  public async logout(usuarioId: string): Promise<{ mensagem: string }> {
    return { mensagem: `Usuário ${usuarioId} deslogado com sucesso.` };
  }
}
