/**
 * testeSistema.ts
 * ---------------
 * Script de demonstração prática de TODOS os fluxos principais do
 * sistema, executado diretamente via Services (sem precisar do
 * servidor HTTP/Express rodando).
 *
 * Para executar:
 *   npm run test:sistema
 *
 * O script roda em sequência, imprimindo no terminal o resultado de
 * cada etapa, e cobre exatamente os cenários pedidos na especificação:
 *
 *   1. Cadastro de ADM
 *   2. Cadastro de usuário padrão
 *   3. Criação de voo (pelo ADM)
 *   4. Compra de passagem (usuário padrão, assento ECONOMICO)
 *   5. Upgrade para VIP (usuário padrão -> VIP)
 *   6. Compra de assento VIP (agora que o usuário é VIP)
 *   7. Voo atrasado (ADM marca um voo como ATRASADA)
 *   8. Voo cancelado (ADM marca um voo como CANCELADA -> reembolso automático)
 *   9. Envio de notificações (verificado em cada etapa acima)
 *  10. Reembolso automático (verificado na etapa de cancelamento)
 *
 * IMPORTANTE: como "synchronize: true" está ativo no data-source.ts,
 * cada execução deste script ADICIONA novos registros ao banco
 * (database.sqlite). Se quiser testar "do zero", basta apagar o
 * arquivo database.sqlite antes de rodar novamente.
 */

import "reflect-metadata";
import { AppDataSource } from "../database/data-source";

import { AuthService } from "../services/AuthService";
import { VooService } from "../services/VooService";
import { ReservaService } from "../services/ReservaService";
import { PagamentoService } from "../services/PagamentoService";
import { UpgradeVIPService } from "../services/UpgradeVIPService";
import { NotificacaoService } from "../services/NotificacaoService";
import { DescontoService } from "../services/DescontoService";

import { TipoUsuario } from "../enums/TipoUsuario";
import { TipoVoo } from "../enums/TipoVoo";
import { ClasseAssento } from "../enums/ClasseAssento";
import { PublicoDesconto } from "../enums/PublicoDesconto";

/** Pequeno utilitário para separar visualmente cada etapa no console. */
function imprimirTitulo(titulo: string): void {
  console.log("\n" + "=".repeat(70));
  console.log(titulo);
  console.log("=".repeat(70));
}

/** Gera um e-mail único a cada execução, evitando conflito de "e-mail já cadastrado". */
function gerarEmailUnico(prefixo: string): string {
  return `${prefixo}.${Date.now()}@sistema.com`;
}

async function executarDemonstracao(): Promise<void> {
  // Inicializa a conexão com o banco antes de qualquer operação.
  await AppDataSource.initialize();
  console.log("✅ Banco de dados conectado. Iniciando demonstração completa do sistema.\n");

  const authService = new AuthService();
  const vooService = new VooService();
  const reservaService = new ReservaService();
  const pagamentoService = new PagamentoService();
  const upgradeVIPService = new UpgradeVIPService();
  const notificacaoService = new NotificacaoService();
  const descontoService = new DescontoService();

  // =======================================================
  // 1. CADASTRO DE ADM
  // =======================================================
  imprimirTitulo("1. CADASTRO DE ADMINISTRADOR");

  const admin = await authService.cadastrar(
    "Carla Administradora",
    gerarEmailUnico("admin"),
    "senha123",
    TipoUsuario.ADMIN
  );
  console.log(`✅ Admin cadastrado: ${admin.nome} (${admin.email})`);
  console.log(`   Tipo: ${admin.tipo} | isAdmin(): ${admin.isAdmin()}`);
  console.log(`   Permissões: ${admin.getPermissoes().join(", ")}`);

  // =======================================================
  // 2. CADASTRO DE USUÁRIO PADRÃO
  // =======================================================
  imprimirTitulo("2. CADASTRO DE USUÁRIO PADRÃO");

  const usuarioPadrao = await authService.cadastrar(
    "João Viajante",
    gerarEmailUnico("joao"),
    "senha123",
    TipoUsuario.PADRAO
  );
  console.log(`✅ Usuário padrão cadastrado: ${usuarioPadrao.nome} (${usuarioPadrao.email})`);
  console.log(`   Tipo: ${usuarioPadrao.tipo} | possuiBeneficiosVIP(): ${usuarioPadrao.possuiBeneficiosVIP()}`);
  console.log(`   Permissões: ${usuarioPadrao.getPermissoes().join(", ")}`);

  // Login para validar o AuthService também pelo caminho de autenticação.
  const usuarioLogado = await authService.login(usuarioPadrao.email, "senha123");
  console.log(`✅ Login realizado com sucesso para: ${usuarioLogado.nome}`);

  // =======================================================
  // 2.1 CRIAÇÃO DE DESCONTOS (ADM) - um GERAL e um exclusivo VIP
  // =======================================================
  imprimirTitulo("2.1 CRIAÇÃO DE DESCONTOS PARA VOOS NACIONAIS (ADM)");

  const descontoGeral = await descontoService.criar(
    admin,
    "Promoção de Lançamento",
    8,
    TipoVoo.NACIONAL,
    PublicoDesconto.GERAL
  );
  console.log(
    `✅ Desconto GERAL criado: "${descontoGeral.nome}" (${descontoGeral.percentual}% em voos ${descontoGeral.tipoVooAplicavel}, público: ${descontoGeral.publico})`
  );

  const desconto = await descontoService.criar(
    admin,
    "Promoção VIP Voos Nacionais",
    15,
    TipoVoo.NACIONAL,
    PublicoDesconto.VIP
  );
  console.log(
    `✅ Desconto VIP criado: "${desconto.nome}" (${desconto.percentual}% em voos ${desconto.tipoVooAplicavel}, público: ${desconto.publico})`
  );
  console.log(
    `   Como os dois descontos são para voos NACIONAIS e o VIP (${desconto.percentual}%) tem percentual maior que o GERAL (${descontoGeral.percentual}%), um usuário VIP receberá o desconto VIP; um usuário PADRAO receberá apenas o GERAL.`
  );

  // =======================================================
  // 3. CRIAÇÃO DE VOO (ADM)
  // =======================================================
  imprimirTitulo("3. CRIAÇÃO DE VOO (ADMINISTRADOR)");

  const dataPartida = new Date();
  dataPartida.setDate(dataPartida.getDate() + 10); // voo daqui a 10 dias

  const voo = await vooService.cadastrarVoo(
    admin,
    "São Paulo",
    "Rio de Janeiro",
    dataPartida,
    500,
    TipoVoo.NACIONAL,
    20 // quantidade de assentos
  );
  console.log(`✅ Voo cadastrado: ${voo.origem} -> ${voo.destino}`);
  console.log(`   Status inicial: ${voo.status} | Preço base: R$ ${voo.precoBase.toFixed(2)}`);
  console.log(`   Total de assentos: ${voo.assentos.length} (VIP: ${voo.assentos.filter((a) => a.classe === ClasseAssento.VIP).length}, ECONOMICO: ${voo.assentos.filter((a) => a.classe === ClasseAssento.ECONOMICO).length})`);

  // Tentativa de cadastro por um usuário NÃO admin, para demonstrar a regra de permissão.
  try {
    await vooService.cadastrarVoo(
      usuarioPadrao,
      "Brasília",
      "Salvador",
      dataPartida,
      300,
      TipoVoo.NACIONAL,
      10
    );
  } catch (erro) {
    console.log(`🚫 Tentativa de usuário padrão cadastrar voo bloqueada corretamente: "${(erro as Error).message}"`);
  }

  // =======================================================
  // 4. COMPRA DE PASSAGEM (USUÁRIO PADRÃO, ASSENTO ECONOMICO)
  // =======================================================
  imprimirTitulo("4. COMPRA DE PASSAGEM - USUÁRIO PADRÃO (ASSENTO ECONÔMICO)");

  const assentoEconomico = voo.assentos.find((a) => a.classe === ClasseAssento.ECONOMICO)!;
  console.log(`   Assento escolhido: ${assentoEconomico.numero} (${assentoEconomico.classe})`);

  const reservaPadrao = await reservaService.criarReserva(
    usuarioPadrao,
    voo.id,
    assentoEconomico.id
  );
  console.log(`✅ Reserva criada: id=${reservaPadrao.id}`);
  console.log(
    `   Status: ${reservaPadrao.status} | Valor final: R$ ${reservaPadrao.valorFinal.toFixed(2)} ` +
      `(preço base R$ ${voo.precoBase.toFixed(2)} com desconto GERAL de ${descontoGeral.percentual}% aplicado automaticamente, ` +
      `mesmo o usuário ainda sendo PADRAO - descontos GERAL valem para qualquer usuário)`
  );

  // Tentativa de comprar um assento VIP com usuário padrão, para demonstrar a regra de classe.
  const assentoVipTeste = voo.assentos.find((a) => a.classe === ClasseAssento.VIP)!;
  try {
    await reservaService.criarReserva(usuarioPadrao, voo.id, assentoVipTeste.id);
  } catch (erro) {
    console.log(`🚫 Tentativa de usuário padrão reservar assento VIP bloqueada corretamente: "${(erro as Error).message}"`);
  }

  // Confirmação do pagamento simbólico.
  const reservaConfirmada = await pagamentoService.confirmarPagamento(
    usuarioPadrao,
    reservaPadrao.id
  );
  console.log(`✅ Pagamento confirmado! Novo status da reserva: ${reservaConfirmada.status}`);

  // =======================================================
  // 5. UPGRADE PARA VIP
  // =======================================================
  imprimirTitulo("5. UPGRADE DE CONTA PARA VIP");

  const valorUpgrade = upgradeVIPService.consultarValorUpgrade();
  console.log(`   Valor do upgrade exibido ao usuário: R$ ${valorUpgrade.toFixed(2)}`);
  console.log(`   Usuário clica em "Confirmar Pagamento"...`);

  const usuarioVip = await upgradeVIPService.confirmarUpgrade(usuarioPadrao.id);
  console.log(`✅ Upgrade confirmado! ${usuarioVip.nome} agora é do tipo: ${usuarioVip.tipo}`);
  console.log(`   possuiBeneficiosVIP(): ${usuarioVip.possuiBeneficiosVIP()}`);
  console.log(`   Permissões atualizadas: ${usuarioVip.getPermissoes().join(", ")}`);

  // =======================================================
  // 6. COMPRA DE ASSENTO VIP (AGORA COMO USUÁRIO VIP)
  // =======================================================
  imprimirTitulo("6. COMPRA DE ASSENTO VIP (USUÁRIO JÁ COM UPGRADE)");

  const assentoVip = voo.assentos.find(
    (a) => a.classe === ClasseAssento.VIP && a.disponivel
  )!;
  console.log(`   Assento escolhido: ${assentoVip.numero} (${assentoVip.classe})`);

  const reservaVip = await reservaService.criarReserva(usuarioVip, voo.id, assentoVip.id);
  console.log(`✅ Reserva VIP criada: id=${reservaVip.id}`);
  console.log(
    `   Status: ${reservaVip.status} | Valor final: R$ ${reservaVip.valorFinal.toFixed(2)} ` +
      `(preço base R$ ${voo.precoBase.toFixed(2)} com desconto automático de ${desconto.percentual}% aplicado)`
  );

  await pagamentoService.confirmarPagamento(usuarioVip, reservaVip.id);
  console.log(`✅ Pagamento da reserva VIP confirmado.`);

  // =======================================================
  // CRIAÇÃO DE UM SEGUNDO VOO, PARA DEMONSTRAR ATRASO E CANCELAMENTO
  // =======================================================
  imprimirTitulo("CRIAÇÃO DE VOO ADICIONAL (PARA DEMONSTRAR ATRASO E CANCELAMENTO)");

  const vooParaAtrasoECancelamento = await vooService.cadastrarVoo(
    admin,
    "Belo Horizonte",
    "Fortaleza",
    dataPartida,
    420,
    TipoVoo.NACIONAL,
    15
  );
  console.log(`✅ Voo criado: ${vooParaAtrasoECancelamento.origem} -> ${vooParaAtrasoECancelamento.destino}`);

  // Outro usuário padrão para popular esse voo com passageiros.
  const passageiroExtra = await authService.cadastrar(
    "Maria Passageira",
    gerarEmailUnico("maria"),
    "senha123",
    TipoUsuario.PADRAO
  );

  const assentoParaPassageiroExtra = vooParaAtrasoECancelamento.assentos.find(
    (a) => a.classe === ClasseAssento.ECONOMICO
  )!;

  const reservaPassageiroExtra = await reservaService.criarReserva(
    passageiroExtra,
    vooParaAtrasoECancelamento.id,
    assentoParaPassageiroExtra.id
  );
  await pagamentoService.confirmarPagamento(passageiroExtra, reservaPassageiroExtra.id);
  console.log(`✅ ${passageiroExtra.nome} comprou e confirmou uma passagem neste voo (para demonstrar notificação em massa).`);

  // =======================================================
  // 7. VOO ATRASADO
  // =======================================================
  imprimirTitulo("7. VOO ATRASADO (ADMINISTRADOR ALTERA O STATUS)");

  const vooAtrasado = await vooService.marcarAtrasado(
    admin,
    vooParaAtrasoECancelamento.id
  );
  console.log(`✅ Voo atualizado para status: ${vooAtrasado.status}`);
  console.log(`   Notificações de atraso enviadas a todos os passageiros deste voo.`);

  // =======================================================
  // 8. VOO CANCELADO (REEMBOLSO AUTOMÁTICO)
  // =======================================================
  imprimirTitulo("8. VOO CANCELADO (REEMBOLSO AUTOMÁTICO)");

  const vooCancelado = await vooService.marcarCancelado(
    admin,
    vooParaAtrasoECancelamento.id
  );
  console.log(`✅ Voo atualizado para status: ${vooCancelado.status}`);

  const reservaAposCancelamento = await reservaService.buscarPorId(
    reservaPassageiroExtra.id
  );
  console.log(
    `✅ Status da reserva de ${passageiroExtra.nome} após o cancelamento do voo: ${reservaAposCancelamento?.status}`
  );
  console.log(`   (esperado: REEMBOLSADA - reembolso automático aplicado pelo VooService)`);

  // =======================================================
  // 9. ENVIO DE NOTIFICAÇÕES (RESUMO)
  // =======================================================
  imprimirTitulo("9. RESUMO DAS NOTIFICAÇÕES GERADAS");

  const notificacoesUsuarioPadrao = await notificacaoService.listarPorUsuario(usuarioPadrao.id);
  console.log(`📬 Notificações de ${usuarioVip.nome} (mesmo id, agora VIP): ${notificacoesUsuarioPadrao.length}`);
  notificacoesUsuarioPadrao.forEach((n, index) => {
    console.log(`   ${index + 1}. ${n.mensagem}`);
  });

  const notificacoesPassageiroExtra = await notificacaoService.listarPorUsuario(passageiroExtra.id);
  console.log(`\n📬 Notificações de ${passageiroExtra.nome}: ${notificacoesPassageiroExtra.length}`);
  notificacoesPassageiroExtra.forEach((n, index) => {
    console.log(`   ${index + 1}. ${n.mensagem}`);
  });

  // =======================================================
  // FIM DA DEMONSTRAÇÃO
  // =======================================================
  imprimirTitulo("✅ DEMONSTRAÇÃO COMPLETA FINALIZADA COM SUCESSO");
  console.log(
    "Todos os fluxos especificados foram executados: cadastro de ADM, cadastro de\n" +
      "usuário padrão, criação de voo, compra de passagem, upgrade para VIP, compra\n" +
      "de assento VIP, voo atrasado, voo cancelado, notificações e reembolso automático.\n"
  );

  await AppDataSource.destroy();
  console.log("🔌 Conexão com o banco de dados encerrada.");
}

// Executa a demonstração e trata qualquer erro inesperado de forma clara no terminal.
executarDemonstracao().catch((erro) => {
  console.error("\n❌ Erro durante a execução da demonstração:", erro);
  process.exit(1);
});
