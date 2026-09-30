/**
 * data-source.ts
 * --------------
 * Ponto único de configuração da conexão com o banco de dados.
 *
 * Utilizamos SQLite porque:
 * - não exige instalação de servidor de banco de dados;
 * - persiste tudo em um único arquivo local (database.sqlite);
 * - é ideal para projetos acadêmicos e ambientes de desenvolvimento/teste.
 *
 * O TypeORM usa decorators (@Entity, @Column, @OneToMany, etc.) diretamente
 * nas classes de src/models/. Por isso, ao invés de listar caminhos em
 * string (glob), importamos e registramos cada entidade explicitamente em
 * "entities". Isso evita problemas de resolução de caminho quando o projeto
 * é compilado de TypeScript (.ts) para JavaScript (.js).
 *
 * IMPORTANTE: este arquivo só vai compilar corretamente depois que os
 * arquivos do Bloco 4 (models) existirem, pois ele os importa diretamente.
 */

import "reflect-metadata"; // OBRIGATÓRIO: precisa ser importado antes de qualquer decorator do TypeORM ser usado
import { DataSource } from "typeorm";

// Entidades (serão criadas no Bloco 4 - Models)
import { Usuario } from "../models/Usuario";
import { UsuarioPadrao } from "../models/UsuarioPadrao";
import { UsuarioVIP } from "../models/UsuarioVIP";
import { Admin } from "../models/Admin";
import { Voo } from "../models/Voo";
import { Assento } from "../models/Assento";
import { Reserva } from "../models/Reserva";
import { Notificacao } from "../models/Notificacao";
import { Desconto } from "../models/Desconto";

/**
 * AppDataSource
 * -------------
 * Instância única (singleton) da conexão com o banco de dados.
 * É exportada para ser usada em:
 * - app.ts (para inicializar a conexão ao iniciar o servidor)
 * - repositories/* (para obter os repositórios de cada entidade)
 */
export const AppDataSource = new DataSource({
  type: "sqlite",

  // Caminho do arquivo do banco de dados. Será criado automaticamente
  // na raiz da pasta "backend/" na primeira execução, caso não exista.
  database: "database.sqlite",

  /**
   * synchronize: true
   * -----------------
   * Faz o TypeORM criar/atualizar automaticamente as tabelas do banco
   * de dados com base nas entidades definidas, sem precisar escrever
   * SQL manualmente nem gerar migrations.
   *
   * Ideal para ambiente acadêmico/desenvolvimento. NÃO é recomendado
   * em produção (lá se usaria "migrations" para alterar tabelas com
   * mais segurança e controle de versão do schema).
   */
  synchronize: true,

  /**
   * logging: false
   * --------------
   * Se true, o TypeORM imprime no console todas as queries SQL executadas.
   * Útil para depuração, mas deixamos desligado por padrão para não
   * poluir o terminal. Pode ser alterado para true durante o desenvolvimento.
   */
  logging: false,

  // Lista de todas as entidades (tabelas) que o TypeORM deve gerenciar.
  // Usuario é a classe base (não terá tabela própria isolada - ver
  // explicação de herança em Usuario.ts no Bloco 4).
  entities: [
    Usuario,
    UsuarioPadrao,
    UsuarioVIP,
    Admin,
    Voo,
    Assento,
    Reserva,
    Notificacao,
    Desconto,
  ],

  // Não usamos migrations neste projeto acadêmico (synchronize cuida disso)
  migrations: [],

  // Não usamos subscribers (ganchos de eventos do TypeORM) neste projeto
  subscribers: [],
});
