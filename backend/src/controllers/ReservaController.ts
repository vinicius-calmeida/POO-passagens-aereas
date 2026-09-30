/**
 * ReservaController
 * -----------------
 * Expõe rotas relacionadas à compra de passagens (reservas) e ao
 * pagamento simbólico.
 *
 * ROTAS:
 * POST   /reservas                       -> cria uma nova reserva (PENDENTE_PAGAMENTO)
 * POST   /reservas/:id/confirmar-pagamento -> confirma o pagamento simbólico (CONFIRMADA)
 * PATCH  /reservas/:id/cancelar           -> cancela uma reserva
 * GET    /reservas/minhas                 -> lista as reservas do usuário autenticado
 * GET    /reservas                        -> lista todas as reservas (ADMIN, relatórios)
 * GET    /reservas/:id                    -> busca uma reserva específica
 *
 * Todas as rotas exigem autenticação (header x-user-id), pois reservas
 * sempre pertencem a um usuário identificado.
 */

import { Router, Request, Response } from "express";
import { ReservaService } from "../services/ReservaService";
import { PagamentoService } from "../services/PagamentoService";
import { exigirAutenticacao } from "./autenticacaoMiddleware";

const router = Router();
const reservaService = new ReservaService();
const pagamentoService = new PagamentoService();

/**
 * POST /reservas
 * Cria uma nova reserva para o usuário autenticado.
 * Body esperado: { vooId, assentoId }
 *
 * Internamente, o ReservaService:
 * - valida se o voo está disponível para compra;
 * - valida se o usuário pode reservar a classe do assento escolhido
 *   (PADRAO só ECONOMICO; VIP/ADMIN qualquer classe);
 * - calcula o valor final já com desconto automático para VIP/ADMIN.
 */
router.post("/", exigirAutenticacao, async (req: Request, res: Response) => {
  try {
    const { vooId, assentoId } = req.body;

    const reserva = await reservaService.criarReserva(
      req.usuarioAutenticado!,
      vooId,
      assentoId
    );

    res.status(201).json(reserva);
  } catch (erro) {
    res.status(400).json({ erro: (erro as Error).message });
  }
});

/**
 * GET /reservas/minhas
 * Lista todas as reservas do usuário autenticado.
 * Posicionada antes de "/:id" para não ser interpretada como um id de reserva.
 */
router.get(
  "/minhas",
  exigirAutenticacao,
  async (req: Request, res: Response) => {
    try {
      const reservas = await reservaService.listarPorUsuario(
        req.usuarioAutenticado!.id
      );
      res.status(200).json(reservas);
    } catch (erro) {
      res.status(500).json({ erro: (erro as Error).message });
    }
  }
);

/**
 * GET /reservas
 * Lista todas as reservas do sistema. Apenas ADMIN (usado para relatórios).
 */
router.get("/", exigirAutenticacao, async (req: Request, res: Response) => {
  try {
    if (!req.usuarioAutenticado!.isAdmin()) {
      res.status(403).json({ erro: "Apenas administradores podem listar todas as reservas." });
      return;
    }

    const reservas = await reservaService.listarTodas();
    res.status(200).json(reservas);
  } catch (erro) {
    res.status(500).json({ erro: (erro as Error).message });
  }
});

/**
 * GET /reservas/:id
 * Busca uma reserva específica pelo id.
 */
router.get("/:id", exigirAutenticacao, async (req: Request, res: Response) => {
  try {
    const reserva = await reservaService.buscarPorId(req.params.id);

    if (!reserva) {
      res.status(404).json({ erro: "Reserva não encontrada." });
      return;
    }

    const solicitante = req.usuarioAutenticado!;
    if (reserva.usuario.id !== solicitante.id && !solicitante.isAdmin()) {
      res.status(403).json({ erro: "Você não tem permissão para ver esta reserva." });
      return;
    }

    res.status(200).json(reserva);
  } catch (erro) {
    res.status(500).json({ erro: (erro as Error).message });
  }
});

/**
 * POST /reservas/:id/confirmar-pagamento
 * Confirma o pagamento simbólico da reserva, transicionando
 * PENDENTE_PAGAMENTO -> CONFIRMADA e disparando notificação.
 */
router.post(
  "/:id/confirmar-pagamento",
  exigirAutenticacao,
  async (req: Request, res: Response) => {
    try {
      const reserva = await pagamentoService.confirmarPagamento(
        req.usuarioAutenticado!,
        req.params.id
      );
      res.status(200).json(reserva);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }
);

/**
 * PATCH /reservas/:id/cancelar
 * Cancela uma reserva (do próprio usuário, ou de qualquer uma se for ADMIN).
 * Libera o assento correspondente para nova venda.
 */
router.patch(
  "/:id/cancelar",
  exigirAutenticacao,
  async (req: Request, res: Response) => {
    try {
      const reserva = await reservaService.cancelarReserva(
        req.usuarioAutenticado!,
        req.params.id
      );
      res.status(200).json(reserva);
    } catch (erro) {
      res.status(400).json({ erro: (erro as Error).message });
    }
  }
);

export default router;
