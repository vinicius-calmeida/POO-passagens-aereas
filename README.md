# ✈️ Sistema de Compra de Passagens de Avião

Projeto acadêmico **fullstack** que simula um sistema de venda de passagens aéreas, com três tipos de usuário (Padrão, VIP e Administrador), gerenciamento de voos, reservas, pagamento simbólico, upgrade de conta e descontos.

O projeto é dividido em duas partes independentes:

| Parte | Tecnologia | O que faz |
|---|---|---|
| **[`backend/`](./backend/README.md)** | TypeScript + Node.js + Express + TypeORM + SQLite | API REST com toda a regra de negócio e persistência de dados |
| **[`frontend/`](./frontend/README.md)** | TypeScript + React + Vite + Material UI | Interface web que consome essa API |

Cada pasta tem seu próprio README com detalhes técnicos. Este README dá a visão geral do projeto como um todo.

---

## 📑 Índice

1. [Sobre o projeto](#-sobre-o-projeto)
2. [Tipos de usuário e o que cada um pode fazer](#-tipos-de-usu%C3%A1rio-e-o-que-cada-um-pode-fazer)
3. [Principais funcionalidades](#-principais-funcionalidades)
4. [Tecnologias utilizadas](#-tecnologias-utilizadas)
5. [Estrutura de pastas](#-estrutura-de-pastas)
6. [Como rodar o projeto](#-como-rodar-o-projeto)
7. [Roteiro de teste completo](#-roteiro-de-teste-completo)
8. [Decisões de projeto e limitações conhecidas](#-decis%C3%B5es-de-projeto-e-limita%C3%A7%C3%B5es-conhecidas)

---

## 📖 Sobre o projeto

O sistema simula uma agência de viagens aéreas. Um administrador cadastra voos e descontos; usuários comuns buscam voos, escolhem um assento e compram a passagem (com pagamento simbólico, sem nenhuma integração financeira real); usuários podem evoluir para uma conta VIP e passar a ter acesso a assentos exclusivos e descontos automáticos.

O projeto foi construído em camadas separadas (backend e frontend conversam só por HTTP, como em um sistema real), e o backend segue princípios de Programação Orientada a Objetos (POO) com bastante rigor, já que esse era um objetivo central do projeto.

---

## 👥 Tipos de usuário e o que cada um pode fazer

| Funcionalidade | Padrão | VIP | Administrador |
|---|:---:|:---:|:---:|
| Buscar e visualizar voos | ✅ | ✅ | ✅ |
| Comprar assento econômico | ✅ | ✅ | ✅ |
| Comprar assento VIP | ❌ | ✅ | ✅ |
| Receber descontos gerais (promoções) | ✅ | ✅ | ✅ |
| Receber descontos exclusivos VIP | ❌ | ✅ | ✅ |
| Receber notificação antecipada de novos voos | ❌ | ✅ | ✅ |
| Cancelar a própria reserva | ✅ | ✅ | ✅ |
| Fazer upgrade para VIP | ✅ | — | — |
| Cadastrar / alterar voos | ❌ | ❌ | ✅ |
| Marcar voo como atrasado / cancelado | ❌ | ❌ | ✅ |
| Criar / remover descontos | ❌ | ❌ | ✅ |
| Gerenciar usuários | ❌ | ❌ | ✅ |
| Ver relatórios do sistema | ❌ | ❌ | ✅ |

Um usuário Administrador acumula todos os benefícios de um VIP, que por sua vez acumula todos os benefícios de um Padrão — é uma hierarquia de permissões.

---

## ⚙️ Principais funcionalidades

- **Autenticação simples** (cadastro e login)
- **Busca de voos** por origem/destino, com status que muda automaticamente (novo, à venda, últimas passagens, esgotado, realizado) e também manualmente pelo administrador (atrasado, cancelado)
- **Compra de passagem**: escolha de assento (econômico ou VIP) → reserva pendente → confirmação de pagamento simbólico → reserva confirmada
- **Histórico de reservas** completo, incluindo voos antigos e futuros
- **Cancelamento de reserva** pelo próprio usuário
- **Upgrade de conta para VIP**, com efeito imediato em toda a interface
- **Descontos automáticos**, sem necessidade de cupom, com dois tipos: descontos gerais (para qualquer usuário) e descontos exclusivos VIP — o sistema sempre aplica o melhor desconto disponível para aquele usuário e tipo de voo, mostrando o preço original riscado e o valor com desconto em destaque
- **Notificações** automáticas em eventos importantes: compra confirmada, upgrade confirmado, novo voo (para VIP), voo atrasado, voo cancelado (com reembolso automático de todas as reservas daquele voo)
- **Painel administrativo**: cadastro de voos e descontos, gerenciamento de usuários e relatórios com métricas do sistema

---

## 🛠 Tecnologias utilizadas

| Camada | Tecnologias |
|---|---|
| Backend | TypeScript, Node.js, Express, TypeORM, SQLite |
| Frontend | TypeScript, React, Vite, React Router, Material UI (MUI) |

Veja os detalhes de cada uma nos READMEs específicos.

---

## 🌳 Estrutura de pastas

```
sistema-passagens-aereas/
├── README.md            (este arquivo)
├── backend/
│   ├── README.md
│   └── src/             (código-fonte da API)
└── frontend/
    ├── README.md
    └── src/             (código-fonte da interface)
```

---

## ▶️ Como rodar o projeto

O backend e o frontend são dois processos separados, que precisam rodar **ao mesmo tempo**, em dois terminais diferentes.

### Pré-requisito

[Node.js](https://nodejs.org/) versão 18 ou superior instalado.

### Passo a passo

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run dev
```
Aguarde aparecer `🚀 Servidor rodando em http://localhost:3000`.

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Aguarde aparecer o endereço local, normalmente `http://localhost:5173`.

Abra **http://localhost:5173** no navegador. O backend precisa estar rodando para o frontend funcionar — ele faz todas as chamadas de dados para a API.

> 💡 Detalhes mais técnicos de instalação (estrutura interna, variáveis, scripts disponíveis) estão nos READMEs de cada pasta.

---

## 🧪 Roteiro de teste completo

1. **Cadastre um administrador** (`/cadastro`, marcando a opção de Administrador) e, em outra aba ou navegador anônimo, **cadastre um usuário comum**.
2. Como administrador, **cadastre um voo** e, opcionalmente, **crie um desconto** (geral ou exclusivo VIP).
3. Como usuário comum, **busque o voo**, escolha um assento econômico e **reserve**.
4. Em "Minhas Reservas", **confirme o pagamento**.
5. Clique em **"Tornar-se VIP"** e confirme o upgrade — note que a interface já reflete o novo status imediatamente.
6. Reserve agora um **assento VIP** no mesmo voo e confirme o pagamento — observe o desconto aplicado automaticamente, se houver algum cadastrado.
7. Como administrador, **marque o voo como atrasado** — o usuário recebe uma notificação.
8. Como administrador, **cancele o voo** — todas as reservas daquele voo são reembolsadas automaticamente, e o usuário é notificado.
9. Confira o **histórico completo** em "Minhas Reservas" (a reserva reembolsada continua visível) e os **relatórios** no painel administrativo.

Alternativa rápida sem usar a interface: o backend tem um script (`npm run test:sistema`, dentro da pasta `backend/`) que executa automaticamente todo esse roteiro e imprime o resultado no terminal.

---

## 📋 Decisões de projeto e limitações conhecidas

Por ser um projeto acadêmico focado em arquitetura e boas práticas de POO, algumas simplificações foram feitas de propósito:

- **Sem hash de senha**: senhas são salvas em texto puro no banco. Em um sistema real, usaria-se um algoritmo de hash (bcrypt, por exemplo).
- **Autenticação simplificada**: não há tokens (JWT) nem sessões de servidor. O frontend guarda o id do usuário logado e o envia em um header a cada requisição. Funciona bem para fins de demonstração, mas não é seguro para produção.
- **Pagamento simbólico**: não existe nenhuma integração com gateway de pagamento real — é apenas uma confirmação dentro do próprio sistema.
- **Banco de dados local (SQLite)**: o banco é um único arquivo gerado automaticamente, sem necessidade de instalar nenhum servidor de banco de dados separado.

Esses pontos estão documentados com mais detalhes nos READMEs de backend e frontend.
