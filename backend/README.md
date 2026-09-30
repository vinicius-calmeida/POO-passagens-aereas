# ✈️ Backend — Sistema de Compra de Passagens de Avião

API REST em **TypeScript + Node.js + Express**, com banco de dados **SQLite** gerenciado pelo **TypeORM**. É aqui que vive toda a regra de negócio do sistema.

> Para a visão geral do projeto (frontend + backend), veja o [README da raiz](../README.md).

---

## 📑 Índice

1. [Como o backend funciona](#-como-o-backend-funciona)
2. [Conceitos de POO usados aqui](#-conceitos-de-poo-usados-aqui)
3. [Tecnologias](#-tecnologias)
4. [Estrutura de pastas](#-estrutura-de-pastas)
5. [Instalação e execução](#-instala%C3%A7%C3%A3o-e-execu%C3%A7%C3%A3o)
6. [Principais endpoints da API](#-principais-endpoints-da-api)
7. [Regras de negócio importantes](#-regras-de-neg%C3%B3cio-importantes)
8. [Limitações conhecidas](#-limita%C3%A7%C3%B5es-conhecidas)

---

## 🧠 Como o backend funciona

O código é organizado em **camadas**, cada uma com uma única responsabilidade. Uma requisição passa por elas nesta ordem:

```
Requisição HTTP
      ↓
Controllers     → recebe a requisição, identifica quem está pedindo, devolve a resposta
      ↓
Services        → aqui vive a REGRA DE NEGÓCIO (o que pode, o que não pode, cálculos)
      ↓
Repositories     → busca e salva dados no banco
      ↓
Models           → representam as "coisas" do sistema (Usuário, Voo, Reserva...)
      ↓
Banco de dados (SQLite)
```

Por que separar assim? Porque cada camada só conhece a camada imediatamente abaixo dela. Um Controller nunca fala direto com o banco; um Service nunca monta uma resposta HTTP. Isso torna o código mais fácil de entender, testar e modificar — uma mudança na forma como os dados são salvos, por exemplo, não deveria afetar a regra de negócio.

---

## 🎓 Conceitos de POO usados aqui

O projeto foi pensado para aplicar os pilares da Programação Orientada a Objetos de forma bem concreta:

| Conceito | Onde aparece no código |
|---|---|
| **Abstração** | A classe `Usuario` é abstrata — nunca existe um "usuário genérico" de fato, sempre é um Padrão, um VIP ou um Admin. |
| **Herança** | `UsuarioPadrao`, `UsuarioVIP` e `Admin` herdam de `Usuario`, reaproveitando dados e comportamentos comuns (nome, e-mail, validação de senha). |
| **Polimorfismo** | O método `getPermissoes()` existe em todas as subclasses de `Usuario`, mas cada uma devolve uma lista diferente. O sistema chama `usuario.getPermissoes()` sem precisar saber qual tipo específico é — cada objeto "sabe" responder por si. O mesmo vale para `isAdmin()` e `possuiBeneficiosVIP()`. |
| **Encapsulamento** | A senha do usuário é um atributo protegido, só acessível através do método `validarSenha()`. O estado de um assento (ocupado ou livre) só muda através dos métodos `reservar()`/`liberar()`, nunca diretamente. |
| **Enums** | Usados para representar conjuntos fixos de valores, como o status de um voo (`NOVA`, `A_VENDA`, `CANCELADA`...) ou o tipo de usuário (`PADRAO`, `VIP`, `ADMIN`), evitando textos soltos e erros de digitação. |

Esses conceitos não são só "teoria aplicada por aplicar" — eles resolvem problemas reais do projeto. Por exemplo, o polimorfismo é o que permite que o sistema saiba automaticamente que um Admin pode comprar assento VIP, sem precisar de um monte de `if (tipo === "ADMIN" || tipo === "VIP")` espalhado pelo código.

---

## 🛠 Tecnologias

| Tecnologia | Para que serve aqui |
|---|---|
| **TypeScript** | Linguagem principal — tipagem estática ajuda a evitar erros bobos |
| **Node.js** | Ambiente que executa o código no servidor |
| **Express** | Framework que organiza as rotas da API REST |
| **TypeORM** | Faz a ponte entre as classes do código e as tabelas do banco de dados |
| **SQLite** | Banco de dados — um único arquivo local, sem precisar instalar servidor separado |

---

## 🌳 Estrutura de pastas

```
backend/
└── src/
    ├── app.ts              → ponto de entrada, monta o servidor
    ├── enums/               → valores fixos (TipoUsuario, StatusVoo, etc.)
    ├── models/              → as "entidades" do sistema (Usuario, Voo, Reserva...)
    ├── repositories/         → acesso direto ao banco de dados
    ├── services/            → regras de negócio
    ├── controllers/          → rotas da API
    ├── database/            → configuração da conexão com o banco
    ├── utils/               → pequenas funções auxiliares
    └── tests/               → script de demonstração de todos os fluxos
```

---

## 💻 Instalação e execução

### Pré-requisito
[Node.js](https://nodejs.org/) 18 ou superior.

### Passo a passo

```bash
cd backend
npm install     # instala as dependências
npm run dev     # inicia o servidor em modo desenvolvimento
```

Quando tudo der certo, aparece:
```
✅ Conexão com o banco de dados (SQLite) estabelecida com sucesso.
🚀 Servidor rodando em http://localhost:3000
```

O arquivo do banco (`database.sqlite`) é criado automaticamente na primeira execução, dentro da própria pasta `backend/`.

### Outros comandos úteis

| Comando | O que faz |
|---|---|
| `npm run build` | Compila o TypeScript para JavaScript puro |
| `npm start` | Executa a versão já compilada (uso em produção) |
| `npm run test:sistema` | Roda um script que simula todo o fluxo do sistema (cadastro, compra, upgrade, cancelamento...) e imprime o resultado no terminal |

> 💡 Quer testar com o banco "zerado"? Pare o servidor e apague o arquivo `database.sqlite` antes de rodar de novo.

---

## 📡 Principais endpoints da API

| Recurso | Endpoints |
|---|---|
| Autenticação | `POST /auth/cadastro`, `POST /auth/login` |
| Usuários | `GET /usuarios`, `GET /usuarios/:id`, `POST /usuarios/upgrade-vip`, `GET /usuarios/:id/notificacoes` |
| Voos | `GET /voos`, `POST /voos` (admin), `PATCH /voos/:id/atrasar` (admin), `PATCH /voos/:id/cancelar` (admin) |
| Reservas | `POST /reservas`, `GET /reservas/minhas`, `POST /reservas/:id/confirmar-pagamento`, `PATCH /reservas/:id/cancelar` |
| Descontos | `GET /descontos/ativos`, `POST /descontos` (admin) |

A autenticação é simplificada: depois do login, o cliente envia o `id` do usuário no header `x-user-id` em toda requisição que precisa saber quem está pedindo.

---

## 📐 Regras de negócio importantes

- Um voo passa por status automáticos conforme a data e a quantidade de assentos: `NOVA` → `A_VENDA` → `ULTIMAS_PASSAGENS` → `ESGOTADA`, e se a data já passou, vira `REALIZADO`. Os status `ATRASADA` e `CANCELADA` só podem ser definidos manualmente pelo administrador.
- Não é possível cadastrar (ou alterar) um voo com data no passado.
- Cancelar um voo reembolsa automaticamente todas as reservas confirmadas e notifica todos os passageiros.
- Usuário Padrão só pode reservar assento Econômico; VIP e Admin podem reservar Econômico ou VIP.
- Descontos podem ser **Gerais** (qualquer usuário) ou **VIP** (só quem tem benefícios VIP). Quando mais de um desconto se aplica, vale apenas o de maior percentual — eles nunca se somam.

---

## ⚠️ Limitações conhecidas

- Senhas são armazenadas em texto puro (sem hash) — adequado só para fins didáticos.
- A autenticação via header `x-user-id` não é segura para um ambiente real de produção.
- Não há integração financeira real — o pagamento é só uma confirmação simbólica dentro do próprio sistema.
