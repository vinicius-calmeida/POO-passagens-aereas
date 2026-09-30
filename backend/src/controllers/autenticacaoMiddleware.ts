/**
 * autenticacaoMiddleware.ts
 * -------------------------
 * Middleware Express simples para identificar QUEM está fazendo a
 * requisição à API.
 *
 * Por que isso existe e por que não está na lista original de
 * controllers/services do projeto?
 * A especificação pede uma API REST funcional, mas não entra em
 * detalhes sobre o mecanismo de sessão/token (JWT, cookies, etc.),
 * que é um tópico de segurança mais avançado e fora do escopo
 * acadêmico deste projeto (POO + arquitetura em camadas).
 *
 * Para manter o foco no que foi pedido, usamos uma abordagem simples:
 * depois do login (AuthController.login), o FRONTEND passa a enviar
 * o id do usuário autenticado no header HTTP "x-user-id" em toda
 * requisição que exige autenticação. Este middleware lê esse header,
 * busca o usuário correspondente no banco e o disponibiliza em
 * "req.usuarioAutenticado" para os controllers usarem nas validações
 * de permissão (ex: "apenas ADMIN pode cadastrar voo").
 *
 * Isso é claramente uma simplificação didática (não é seguro para um
 * sistema em produção real, onde se usaria JWT/sessão com assinatura
 * criptográfica), mas é suficiente para demonstrar a arquitetura em
 * camadas e os fluxos de permissão pedidos no projeto.
 */

import { Request, Response, NextFunction } from "express";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { Usuario } from "../models/Usuario";

// Estende a interface Request do Express para incluir o usuário
// autenticado, evitando o uso de "any" espalhado pelos controllers.
declare global {
  namespace Express {
    interface Request {
      usuarioAutenticado?: Usuario;
    }
  }
}

const usuarioRepository = new UsuarioRepository();

/**
 * Middleware OBRIGATÓRIO: bloqueia a requisição com 401 caso o header
 * "x-user-id" não esteja presente ou não corresponda a um usuário
 * válido. Usado em rotas que exigem login (ex: comprar passagem,
 * cadastrar voo).
 */
export async function exigirAutenticacao(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const usuarioId = req.header("x-user-id");

  if (!usuarioId) {
    res.status(401).json({
      erro: "Header 'x-user-id' é obrigatório. Faça login primeiro.",
    });
    return;
  }

  const usuario = await usuarioRepository.buscarPorId(usuarioId);

  if (!usuario) {
    res.status(401).json({ erro: "Usuário autenticado não encontrado." });
    return;
  }

  req.usuarioAutenticado = usuario;
  next();
}
