/**
 * DescontoController
 * -------------------
 * Expõe rotas relacionadas ao gerenciamento de descontos.
 *
 * NOTA DE DESENVOLVIMENTO: este controller não fazia parte da lista
 * original de controllers do projeto (apenas Auth, Usuario, Voo e
 * Reserva estavam previstos), mas o DescontoService já existia desde
 * o Bloco 7 do backend, sem nenhuma rota HTTP que o expusesse. Ele foi
 * adicionado agora para que a tela administrativa de gerenciamento de
 * descontos do frontend (Bloco F10) tenha uma API real para consumir.
 *
 * ROTAS:
 * GET    /descontos              -> lista todos os descontos (ADMIN, para gerenciamento)
 * GET    /descontos/ativos        -> lista apenas os descontos ativos (rota pública, informativa)
 * POST   /descontos               -> cria um novo desconto (ADMIN)
 * PATCH  /descontos/:id/remover    -> desativa um desconto (ADMIN)
 */

import { Router, Request, Response } from "express";
import { DescontoService } from "../services/DescontoService";
import { exigirAutenticacao } from "./autenticacaoMiddleware";
import { TipoVoo } from "../enums/TipoVoo";
import { PublicoDesconto } from "../enums/PublicoDesconto";

const router = Router();
const descontoService = new DescontoService();

/**
 * GET /descontos
 * Lista todos os descontos (ativos e inativos). Apenas ADMIN, pois
 * expõe o histórico completo usado para fins de gerenciamento.
 */
router.get("/", exigirAutenticacao, async (req: Request, res: Response) => {
  try {
    if (!req.usuarioAutenticado!.isAdmin()) {
      res.status(403).json({ erro: "Apenas administradores podem listar todos os descontos." });
      return;
    }

    const descontos = await descontoService.listarTodos();
    res.status(200).json(descontos);
  } catch (erro) {
    res.status(500).json({ erro: (erro as Error).message });
  }
});

/**
 * GET /descontos/ativos
 * Lista apenas os descontos atualmente ativos. Rota pública, útil
 * para exibir promoções vigentes na tela de busca de voos, por exemplo.
 */
router.get("/ativos", async (req: Request, res: Response) => {
  try {
    const descontos = await descontoService.listarAtivos();
    res.status(200).json(descontos);
  } catch (erro) {
    res.status(500).json({ erro: (erro as Error).message });
  }
});

/**
 * POST /descontos
 * Cria um novo desconto. Apenas ADMIN.
 * Body esperado: { nome, percentual, tipoVooAplicavel, publico? }
 * "publico" é opcional - se omitido, o desconto é criado como GERAL
 * (visível e aplicado para qualquer usuário).
 */
router.post("/", exigirAutenticacao, async (req: Request, res: Response) => {
  try {
    const { nome, percentual, tipoVooAplicavel, publico } = req.body;

    const desconto = await descontoService.criar(
      req.usuarioAutenticado!,
      nome,
      Number(percentual),
      tipoVooAplicavel as TipoVoo,
      (publico as PublicoDesconto) ?? PublicoDesconto.GERAL
    );

    res.status(201).json(desconto);
  } catch (erro) {
    res.status(400).json({ erro: (erro as Error).message });
  }
});

/**
 * PATCH /descontos/:id/remover
 * Desativa um desconto (remoção lógica, preservando histórico).
 * Apenas ADMIN.
 */
router.patch(
  "/:id/remover",
  exigirAutenticacao,
  async (req: Request, res: Response) => {
    try {
      const desconto = await descontoService.remover(
        req.usuarioAutenticado!,
        req.params.id
      );
      res.status(200).json(desconto);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }
);

export default router;
