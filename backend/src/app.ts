/**
 * app.ts
 * ------
 * Ponto de entrada (entry point) da aplicação backend.
 *
 * Responsabilidades deste arquivo:
 * 1. Inicializar a conexão com o banco de dados (AppDataSource).
 * 2. Configurar o servidor Express (middlewares globais: JSON, CORS).
 * 3. Registrar todas as rotas dos Controllers, cada uma em seu próprio
 *    "prefixo" de URL (ex: tudo que começa com /auth vai para o
 *    AuthController).
 * 4. Iniciar o servidor HTTP, escutando em uma porta configurável.
 *
 * Para rodar em modo desenvolvimento (com reinício automático):
 *   npm run dev
 *
 * Para rodar em modo produção (compilado):
 *   npm run build
 *   npm start
 */

import "reflect-metadata"; // Necessário antes de qualquer uso de decorator do TypeORM
import express, { Request, Response } from "express";
import cors from "cors";
import { AppDataSource } from "./database/data-source";

// Importação das rotas de cada Controller (Bloco 8)
import authRoutes from "./controllers/AuthController";
import usuarioRoutes from "./controllers/UsuarioController";
import vooRoutes from "./controllers/VooController";
import reservaRoutes from "./controllers/ReservaController";
import descontoRoutes from "./controllers/DescontoController";

const app = express();
const PORTA = process.env.PORT ? Number(process.env.PORT) : 3000;

/**
 * Middlewares globais
 * --------------------
 * - cors(): permite que o frontend (rodando em outra porta/domínio,
 *   ex: http://localhost:5173 no caso de um futuro frontend Vite/React)
 *   consiga fazer requisições para esta API sem ser bloqueado pelo
 *   navegador.
 * - express.json(): faz o parser automático do corpo (body) das
 *   requisições no formato JSON, populando "req.body".
 */
app.use(cors());
app.use(express.json());

/**
 * Rota de health-check simples, útil para verificar rapidamente se a
 * API está no ar (ex: usada por ferramentas de monitoramento, ou só
 * para você testar no navegador: http://localhost:3000).
 */
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    sistema: "Sistema de Compra de Passagens de Avião - API",
    status: "online",
    versao: "1.0.0",
  });
});

/**
 * Registro das rotas de cada Controller, cada uma com seu prefixo:
 * - /auth/...      -> AuthController     (login, cadastro, logout)
 * - /usuarios/...  -> UsuarioController  (gerenciamento, upgrade VIP, notificações)
 * - /voos/...      -> VooController      (busca, cadastro, status de voos)
 * - /reservas/...  -> ReservaController  (compra de passagens, pagamento, cancelamento)
 */
app.use("/auth", authRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/voos", vooRoutes);
app.use("/reservas", reservaRoutes);
app.use("/descontos", descontoRoutes);

/**
 * Middleware de tratamento de rota não encontrada (404).
 * Deve ser registrado DEPOIS de todas as rotas válidas.
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
});

/**
 * Inicialização da aplicação:
 * 1. Conecta ao banco de dados SQLite (cria o arquivo database.sqlite
 *    e as tabelas automaticamente, graças a "synchronize: true" em
 *    data-source.ts).
 * 2. Só depois de a conexão estar pronta, inicia o servidor HTTP -
 *    isso evita que a API aceite requisições antes do banco estar
 *    disponível.
 */
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Conexão com o banco de dados (SQLite) estabelecida com sucesso.");

    app.listen(PORTA, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORTA}`);
      console.log("📋 Rotas disponíveis:");
      console.log("   POST   /auth/cadastro");
      console.log("   POST   /auth/login");
      console.log("   POST   /auth/logout");
      console.log("   GET    /usuarios");
      console.log("   GET    /usuarios/:id");
      console.log("   DELETE /usuarios/:id");
      console.log("   GET    /usuarios/upgrade-vip/valor");
      console.log("   POST   /usuarios/upgrade-vip");
      console.log("   GET    /usuarios/:id/notificacoes");
      console.log("   PATCH  /usuarios/notificacoes/:id/lida");
      console.log("   GET    /voos");
      console.log("   GET    /voos/:id");
      console.log("   POST   /voos");
      console.log("   PUT    /voos/:id");
      console.log("   PATCH  /voos/:id/atrasar");
      console.log("   PATCH  /voos/:id/cancelar");
      console.log("   DELETE /voos/:id");
      console.log("   POST   /reservas");
      console.log("   GET    /reservas/minhas");
      console.log("   GET    /reservas");
      console.log("   GET    /reservas/:id");
      console.log("   POST   /reservas/:id/confirmar-pagamento");
      console.log("   PATCH  /reservas/:id/cancelar");
      console.log("   GET    /descontos");
      console.log("   GET    /descontos/ativos");
      console.log("   POST   /descontos");
      console.log("   PATCH  /descontos/:id/remover");
    });
  })
  .catch((erro) => {
    console.error("❌ Erro ao conectar com o banco de dados:", erro);
    process.exit(1);
  });

export default app;
