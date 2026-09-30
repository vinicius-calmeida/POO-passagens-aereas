/**
 * GeradorId
 * ---------
 * Classe utilitária (helper) com métodos estáticos para geração de
 * identificadores e códigos auxiliares usados em diferentes pontos do
 * sistema.
 *
 * Observação sobre os IDs principais das entidades:
 * Os IDs das entidades persistidas no banco (Usuario, Voo, Reserva, etc.)
 * já são gerados automaticamente pelo TypeORM através do decorator
 * "@PrimaryGeneratedColumn('uuid')" (ver models/). Esta classe NÃO
 * substitui isso - ela serve para gerar identificadores auxiliares que
 * não vêm do banco, como números de assento durante o cadastro de um
 * voo novo (ex: "1A", "1B", "2A"...) ou códigos de confirmação exibidos
 * ao usuário.
 *
 * Por que uma classe com métodos estáticos (e não funções soltas)?
 * Para fins didáticos de POO: agrupa utilitários relacionados sob um
 * mesmo namespace/classe, deixando claro de onde vêm ("GeradorId.algo()"),
 * sem precisar instanciar objetos (new GeradorId()) para uma operação
 * que não guarda estado.
 */

export class GeradorId {
  // Impede que esta classe seja instanciada (new GeradorId()), já que
  // todos os seus métodos são estáticos e não fazem sentido em uma
  // instância. Reforça a intenção de "classe utilitária".
  private constructor() {}

  /**
   * Gera um identificador único genérico (UUID v4 simplificado),
   * útil para identificar objetos em memória antes de serem
   * persistidos no banco, ou para gerar códigos de referência.
   */
  public static gerarUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      (caractere) => {
        const valorAleatorio = (Math.random() * 16) | 0;
        const valorFinal =
          caractere === "x" ? valorAleatorio : (valorAleatorio & 0x3) | 0x8;
        return valorFinal.toString(16);
      }
    );
  }

  /**
   * Gera os números de assento de uma aeronave no formato
   * "FILEIRA + LETRA" (ex: "1A", "1B", "1C", "2A"...), distribuindo
   * "assentosPorFileira" letras (A, B, C, D...) por fileira, até
   * atingir a quantidade total solicitada.
   *
   * Usado pelo VooService ao cadastrar um novo voo, para gerar
   * automaticamente a lista de assentos.
   */
  public static gerarNumerosAssento(
    quantidadeTotal: number,
    assentosPorFileira: number = 6
  ): string[] {
    const letras = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const numeros: string[] = [];

    let fileira = 1;
    let posicaoNaFileira = 0;

    for (let i = 0; i < quantidadeTotal; i++) {
      if (posicaoNaFileira >= assentosPorFileira) {
        fileira++;
        posicaoNaFileira = 0;
      }
      numeros.push(`${fileira}${letras[posicaoNaFileira]}`);
      posicaoNaFileira++;
    }

    return numeros;
  }

  /**
   * Gera um código de confirmação curto e legível (ex: "A1B2C3"),
   * útil para exibir ao usuário como "número de referência" da
   * reserva em mensagens de notificação, sem expor o UUID completo.
   */
  public static gerarCodigoConfirmacao(): string {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let codigo = "";
    for (let i = 0; i < 6; i++) {
      codigo += caracteres.charAt(
        Math.floor(Math.random() * caracteres.length)
      );
    }
    return codigo;
  }
}
