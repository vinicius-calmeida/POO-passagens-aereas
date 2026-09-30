/**
 * AuthController
 * --------------
 * Expõe as rotas HTTP relacionadas a autenticação e cadastro de
 * usuários, delegando toda a regra de negócio ao AuthService.
 *
 * ROTAS:
 * POST /auth/cadastro -> cria um novo usuário (PADRAO, VIP ou ADMIN)
 * POST /auth/login     -> autentica um usuário e retorna seus dados
 * POST /auth/logout    -> logout simbólico
 *
 * Padrão de resposta da API:
 * - Sucesso: respondemos com o objeto solicitado (200/201).
 * - Erro de negócio (ex: e-mail duplicado): respondemos 400 com
 *   { erro: "mensagem" }.
 * - Erro inesperado: respondemos 500.
 *
 * Observação sobre a senha na resposta: por simplicidade, o "as any"
 * /desestruturação remove a senha antes de devolver o usuário ao
 * cliente, evitando expor o atributo (mesmo que protegido na classe,
 * o TypeORM o materializa como propriedade comum em tempo de
 * execução, então fazemos esse cuidado extra na camada HTTP).
 */

import { Router, Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { TipoUsuario } from "../enums/TipoUsuario";
import { Usuario } from "../models/Usuario";

const router = Router();
const authService = new AuthService();

/**
 * Remove o campo "senha" do objeto antes de enviá-lo como resposta
 * HTTP, evitando expor dados sensíveis mesmo em um projeto acadêmico.
 */
function sanitizarUsuario(usuario: Usuario): Record<string, unknown> {
  const { ...usuarioPlano } = usuario as unknown as Record<string, unknown>;
  delete usuarioPlano.senha;
  return usuarioPlano;
}

/**
 * POST /auth/cadastro
 * Body esperado: { nome, email, senha, tipo? }
 * "tipo" é opcional - se omitido, o usuário é cadastrado como PADRAO.
 * Apenas para fins de teste/demonstração este endpoint permite
 * cadastrar diretamente um ADMIN informando tipo: "ADMIN" (em um
 * sistema real, a criação de administradores seria restrita a um
 * processo separado e mais controlado).
 */
router.post("/cadastro", async (req: Request, res: Response) => {
  try {
    const { nome, email, senha, tipo } = req.body;

    const tipoUsuario: TipoUsuario = tipo
      ? (TipoUsuario[tipo as keyof typeof TipoUsuario] ?? TipoUsuario.PADRAO)
      : TipoUsuario.PADRAO;

    const usuario = await authService.cadastrar(nome, email, senha, tipoUsuario);

    res.status(201).json(sanitizarUsuario(usuario));
  } catch (erro) {
    res.status(400).json({ erro: (erro as Error).message });
  }
});

/**
 * POST /auth/login
 * Body esperado: { email, senha }
 * Retorna os dados do usuário autenticado. O frontend deve guardar o
 * "id" retornado e enviá-lo no header "x-user-id" nas próximas
 * requisições que exigirem autenticação (ver autenticacaoMiddleware.ts).
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;
    const usuario = await authService.login(email, senha);

    res.status(200).json(sanitizarUsuario(usuario));
  } catch (erro) {
    res.status(401).json({ erro: (erro as Error).message });
  }
});

/**
 * POST /auth/logout
 * Body esperado: { usuarioId }
 * Logout simbólico (API stateless) - ver comentário no AuthService.
 */
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.body;
    const resultado = await authService.logout(usuarioId);
    res.status(200).json(resultado);
  } catch (erro) {
    res.status(400).json({ erro: (erro as Error).message });
  }
});

export default router;
