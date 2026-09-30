/**
 * UpgradeVIPService
 * -----------------
 * Responsável pelo fluxo de upgrade de um UsuarioPadrao para UsuarioVIP.
 *
 * FLUXO (conforme especificação do projeto):
 *   1. usuário padrão clica em "Tornar-se VIP" (frontend)
 *   2. sistema exibe valor do upgrade (consultarValorUpgrade())
 *   3. usuário clica em "Confirmar Pagamento"
 *   4. sistema converte a conta para VIP (confirmarUpgrade())
 *   5. sistema envia notificação
 *
 * DESAFIO TÉCNICO (Single Table Inheritance no TypeORM):
 * Como UsuarioPadrao e UsuarioVIP são classes diferentes mapeadas pela
 * mesma tabela "usuario" através de uma coluna discriminadora
 * ("tipo_discriminador", ver @ChildEntity em UsuarioPadrao.ts e
 * UsuarioVIP.ts), não é possível simplesmente "mudar o tipo" de uma
 * instância já carregada em memória - o TypeORM não permite trocar a
 * classe de um objeto já instanciado.
 *
 * TENTATIVA INICIAL (com bug): criar "new UsuarioVIP(...)" com o mesmo
 * id e chamar repository.save(). Isso FALHA: o método .save() do
 * TypeORM decide entre INSERT/UPDATE verificando se a entidade foi
 * carregada do banco através de uma query - uma instância "montada na
 * mão" com "new" é sempre tratada como registro NOVO, mesmo
 * informando um id que já existe. O resultado é uma tentativa de
 * INSERT duplicado, que viola a constraint UNIQUE do e-mail.
 *
 * SOLUÇÃO CORRETA: executar um UPDATE explícito na tabela "usuario"
 * via QueryBuilder, alterando apenas a coluna discriminadora
 * ("tipo_discriminador") e a coluna "tipo" para o registro já
 * existente (identificado pelo id). Depois, buscamos o registro
 * novamente no banco - agora o TypeORM o materializa automaticamente
 * como UsuarioVIP, pois a coluna discriminadora já foi alterada.
 * Do ponto de vista do usuário final e do restante do sistema, é como
 * se a conta tivesse "evoluído" de Padrao para VIP - o id se mantém
 * o mesmo, preservando o histórico de reservas (que referenciam o
 * usuário pelo id, e não pela classe TypeScript em si).
 */

import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { NotificacaoService } from "./NotificacaoService";
import { AppDataSource } from "../database/data-source";
import { Usuario } from "../models/Usuario";
import { UsuarioPadrao } from "../models/UsuarioPadrao";
import { TipoUsuario } from "../enums/TipoUsuario";

/** Valor simbólico cobrado para o upgrade de conta para VIP. */
const VALOR_UPGRADE_VIP = 199.9;

export class UpgradeVIPService {
  private usuarioRepository: UsuarioRepository;
  private notificacaoService: NotificacaoService;

  constructor() {
    this.usuarioRepository = new UsuarioRepository();
    this.notificacaoService = new NotificacaoService();
  }

  /**
   * Retorna o valor simbólico cobrado pelo upgrade para VIP.
   * Usado pelo frontend para exibir o valor antes da confirmação
   * (passo 2 do fluxo).
   */
  public consultarValorUpgrade(): number {
    return VALOR_UPGRADE_VIP;
  }

  /**
   * Confirma o upgrade de um usuário PADRAO para VIP.
   * Lança erro se o usuário não for encontrado ou não for PADRAO
   * (não faz sentido fazer upgrade de quem já tem benefícios VIP ou mais).
   */
  public async confirmarUpgrade(usuarioId: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);

    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }

    if (!(usuario instanceof UsuarioPadrao)) {
      throw new Error(
        "Apenas usuários padrão podem solicitar upgrade para VIP."
      );
    }

    // UPDATE explícito na tabela "usuario", trocando apenas o
    // discriminador de herança e a coluna "tipo" do registro já
    // existente. Isso evita o erro de UNIQUE constraint que ocorreria
    // se tentássemos "salvar" uma instância nova com o mesmo id (ver
    // explicação detalhada no comentário no topo do arquivo).
    await AppDataSource.createQueryBuilder()
      .update("usuario")
      .set({
        tipo: TipoUsuario.VIP,
        tipo_discriminador: TipoUsuario.VIP,
      })
      .where("id = :id", { id: usuarioId })
      .execute();

    // Busca o usuário novamente: agora que a coluna discriminadora foi
    // alterada no banco, o TypeORM materializa automaticamente o
    // registro como uma instância de UsuarioVIP (polimorfismo do
    // Single Table Inheritance).
    const usuarioAtualizado = await this.usuarioRepository.buscarPorId(usuarioId);

    if (!usuarioAtualizado) {
      throw new Error("Erro inesperado: usuário não encontrado após o upgrade.");
    }

    await this.notificacaoService.notificar(
      usuarioAtualizado,
      "Parabéns! Seu upgrade para VIP foi confirmado. Aproveite seus novos benefícios."
    );

    return usuarioAtualizado;
  }
}
