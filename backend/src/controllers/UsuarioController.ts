/**
 * UsuarioController
 * -----------------
 * Expõe rotas relacionadas a:
 * - Gerenciamento de usuários (apenas ADMIN)
 * - Upgrade de conta para VIP
 * - Consulta de notificações do próprio usuário
 *
 * ROTAS:
 * GET    /usuarios                       -> lista todos os usuários (ADMIN)
 * GET    /usuarios/:id                   -> busca um usuário pelo id
 * DELETE /usuarios/:id                   -> remove um usuário (ADMIN)
 * GET    /usuarios/upgrade-vip/valor      -> consulta o valor do upgrade VIP
 * POST   /usuarios/upgrade-vip            -> confirma o upgrade para VIP
 * GET    /usuarios/:id/notificacoes       -> lista notificações do usuário
 * PATCH  /usuarios/notificacoes/:id/lida  -> marca notificação como lida
 *
 * Todas as rotas que exigem identificação do solicitante usam o
 * middleware "exigirAutenticacao" (header x-user-id).
 */

import { Router, Request, Response } from "express";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { UpgradeVIPService } from "../services/UpgradeVIPService";
import { NotificacaoService } from "../services/NotificacaoService";
import { exigirAutenticacao } from "./autenticacaoMiddleware";
import { Usuario } from "../models/Usuario";

const router = Router();
const usuarioRepository = new UsuarioRepository();
const upgradeVIPService = new UpgradeVIPService();
const notificacaoService = new NotificacaoService();

function sanitizarUsuario(usuario: Usuario): Record<string, unknown> {
  const usuarioPlano = usuario as unknown as Record<string, unknown>;
  const copia = { ...usuarioPlano };
  delete copia.senha;
  return copia;
}

/**
 * GET /usuarios
 * Lista todos os usuários cadastrados. Apenas ADMIN pode acessar.
 */
router.get(
  "/",
  exigirAutenticacao,
  async (req: Request, res: Response) => {
    try {
      if (!req.usuarioAutenticado!.isAdmin()) {
        res.status(403).json({ erro: "Apenas administradores podem listar usuários." });
        return;
      }

      const usuarios = await usuarioRepository.listarTodos();
      res.status(200).json(usuarios.map(sanitizarUsuario));
    } catch (erro) {
      res.status(500).json({ erro: (erro as Error).message });
    }
  }
);

/**
 * GET /usuarios/upgrade-vip/valor
 * Retorna o valor simbólico cobrado pelo upgrade para VIP.
 * Posicionada antes de "/:id" para não ser confundida com um id de usuário.
 */
router.get("/upgrade-vip/valor", (req: Request, res: Response) => {
  const valor = upgradeVIPService.consultarValorUpgrade();
  res.status(200).json({ valor });
});

/**
 * POST /usuarios/upgrade-vip
 * Confirma o upgrade do usuário autenticado para VIP.
 */
router.post(
  "/upgrade-vip",
  exigirAutenticacao,
  async (req: Request, res: Response) => {
    try {
      const usuarioAtualizado = await upgradeVIPService.confirmarUpgrade(
        req.usuarioAutenticado!.id
      );
      res.status(200).json(sanitizarUsuario(usuarioAtualizado));
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }
);

/**
 * GET /usuarios/:id/notificacoes
 * Lista as notificações do usuário informado. Por simplicidade,
 * qualquer usuário autenticado pode consultar suas próprias
 * notificações (validação básica: só pode ver as próprias, a menos
 * que seja ADMIN).
 */
router.get(
  "/:id/notificacoes",
  exigirAutenticacao,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const solicitante = req.usuarioAutenticado!;

      if (solicitante.id !== id && !solicitante.isAdmin()) {
        res.status(403).json({ erro: "Você só pode consultar suas próprias notificações." });
        return;
      }

      const notificacoes = await notificacaoService.listarPorUsuario(id);
      res.status(200).json(notificacoes);
    } catch (erro) {
      res.status(500).json({ erro: (erro as Error).message });
    }
  }
);

/**
 * PATCH /usuarios/notificacoes/:id/lida
 * Marca uma notificação específica como lida.
 */
router.patch(
  "/notificacoes/:id/lida",
  exigirAutenticacao,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const notificacao = await notificacaoService.marcarComoLida(id);

      if (!notificacao) {
        res.status(404).json({ erro: "Notificação não encontrada." });
        return;
      }

      res.status(200).json(notificacao);
    } catch (erro) {
      res.status(500).json({ erro: (erro as Error).message });
    }
  }
);

/**
 * GET /usuarios/:id
 * Busca um usuário específico pelo id.
 */
router.get("/:id", exigirAutenticacao, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const solicitante = req.usuarioAutenticado!;

    if (solicitante.id !== id && !solicitante.isAdmin()) {
      res.status(403).json({ erro: "Você só pode consultar seu próprio perfil." });
      return;
    }

    const usuario = await usuarioRepository.buscarPorId(id);
    if (!usuario) {
      res.status(404).json({ erro: "Usuário não encontrado." });
      return;
    }

    res.status(200).json(sanitizarUsuario(usuario));
  } catch (erro) {
    res.status(500).json({ erro: (erro as Error).message });
  }
});

/**
 * DELETE /usuarios/:id
 * Remove um usuário do sistema. Apenas ADMIN pode realizar esta ação.
 */
router.delete(
  "/:id",
  exigirAutenticacao,
  async (req: Request, res: Response) => {
    try {
      if (!req.usuarioAutenticado!.isAdmin()) {
        res.status(403).json({ erro: "Apenas administradores podem remover usuários." });
        return;
      }

      await usuarioRepository.remover(req.params.id);
      res.status(204).send();
    } catch (erro) {
      res.status(500).json({ erro: (erro as Error).message });
    }
  }
);

export default router;
