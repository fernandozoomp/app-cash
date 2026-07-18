# 💰 Meu Caixa — Controle Financeiro

Aplicativo web (PWA) para controle de caixa de **3 empreendimentos**:
**Adega**, **Empréstimos** e **Sucatas**.

> Projeto didático e funcional, construído com as melhores práticas de 2026:
> Next.js 16 + TypeScript + Supabase + Vercel. Gratuitos no plano inicial.

---

## ✨ Funcionalidades

| Módulo | O que faz |
|---|---|
| 🏠 **Dashboard** | Visão geral: saldo, entradas/saídas do mês, saldo por empreendimento, próximos vencimentos |
| 💵 **Caixa** | Lançar entradas/saídas, listar histórico, excluir, ver fechamento do dia |
| 🤝 **Empréstimos** | Cadastrar clientes, criar empréstimos com **cálculo automático de parcelas** (Tabela Price ou juros simples), receber parcelas (com registro automático no caixa) |
| 👥 **Clientes** | CRUD completo: cadastrar, editar, excluir, listar |
| ♻️ **Sucatas** | Compra/venda por peso, cálculo de total e lucro automático |
| 🍷 **Adega** | Resumo das vendas e despesas da adega |
| 📊 **Relatórios** | Histórico mensal dos últimos 6 meses, total por empreendimento |

---

## 🏗️ Stack técnica

- **[Next.js 16](https://nextjs.org/)** (App Router, Server Components, Server Actions)
- **[TypeScript](https://www.typescriptlang.org/)** (tipagem estática)
- **[Tailwind CSS 4](https://tailwindcss.com/)** (estilos utilitários)
- **[shadcn/ui](https://ui.shadcn.com/)** (componentes acessíveis e bonitos)
- **[Supabase](https://supabase.com/)** (PostgreSQL + Auth + RLS)
- **[Vercel](https://vercel.com/)** (hospedagem gratuita)
- **[lucide-react](https://lucide.dev/)** (ícones)
- **[react-hook-form](https://react-hook-form.com/)** + **[zod](https://zod.dev/)** (formulários)

---

## 📋 Pré-requisitos

- **Node.js 20+** (recomendado via [Homebrew](https://brew.sh/): `brew install node`)
- **Conta gratuita** no [Supabase](https://supabase.com/)

---

## 🚀 Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o template e preencha com seus dados do Supabase:

```bash
cp .env.example .env.local
```

Edite `.env.local` com:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

> 🔎 **Onde achar**: painel do Supabase → **Project Settings** → **API**

### 3. Criar as tabelas no banco

1. No painel do Supabase, abra **SQL Editor** → **New query**
2. Cole o conteúdo de `supabase/schema.sql`
3. Clique em **Run**

Isso cria as 7 tabelas + políticas de segurança (RLS).

### 4. Rodar o projeto

```bash
npm run dev
```

Abra **http://localhost:3000** no navegador.

### 5. Criar sua conta

Acesse `/cadastro`, crie sua conta e comece a usar.

---

## 🔐 Segurança

Este projeto implementa **3 camadas de proteção**:

1. **Autenticação** (Supabase Auth): login com e-mail + senha.
2. **Row Level Security (RLS)**: cada usuário só vê e edita seus próprios dados. Mesmo que alguém descubra sua URL do Supabase, não consegue acessar nada.
3. **HTTPS**: todo o tráfego é criptografado (automático no Vercel).

**Regras de ouro:**
- 🔒 **Nunca** compartilhe sua chave `service_role` (tem acesso total).
- 🔒 **Nunca** faça commit do arquivo `.env.local` (ele já está no `.gitignore`).
- ✅ A chave `anon` é segura para o navegador porque o RLS protege os dados.

---

## 📁 Estrutura do projeto

```
controle-caixa/
├── src/
│   ├── app/
│   │   ├── (app)/              ← Páginas PROTEGIDAS (com sidebar)
│   │   │   ├── layout.tsx      ← Verifica login, mostra sidebar
│   │   │   ├── page.tsx        ← Dashboard
│   │   │   ├── caixa/          ← Fluxo de caixa
│   │   │   ├── emprestimos/    ← Empréstimos
│   │   │   ├── clientes/       ← Clientes
│   │   │   ├── adega/          ← Adega
│   │   │   ├── sucatas/        ← Sucatas
│   │   │   └── relatorios/     ← Relatórios
│   │   ├── (auth)/             ← Páginas PÚBLICAS (login, cadastro)
│   │   ├── actions/            ← Server Actions (lógica no servidor)
│   │   │   ├── auth.ts         ← login, cadastro, logout
│   │   │   ├── caixa.ts        ← CRUD de transações
│   │   │   ├── clientes.ts     ← CRUD de clientes
│   │   │   ├── emprestimos.ts  ← Empréstimos + parcelas
│   │   │   └── sucatas.ts      ← CRUD de sucatas
│   │   ├── globals.css         ← Estilos + tema (verde esmeralda)
│   │   ├── layout.tsx          ← Layout raiz (fontes, Toaster, PWA)
│   │   └── manifest.ts         ← Configuração do PWA
│   ├── components/
│   │   ├── ui/                 ← Componentes do shadcn
│   │   ├── forms/              ← Formulários (transação, cliente, etc)
│   │   ├── lists/              ← Listas (transações, clientes, etc)
│   │   ├── app-layout.tsx      ← Moldura das páginas internas
│   │   ├── sidebar.tsx         ← Barra lateral + logout
│   │   └── page-header.tsx     ← Título padrão das páginas
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts       ← Cliente para Server Components
│   │   │   ├── client.ts       ← Cliente para Client Components
│   │   │   └── middleware.ts   ← Renovação de sessão
│   │   ├── auth/
│   │   │   └── session.ts      ← Helpers de sessão
│   │   ├── finance/
│   │   │   └── calculadora.ts  ← Cálculo de empréstimos (Price/simples)
│   │   ├── types/
│   │   │   └── database.ts     ← Tipos TypeScript das tabelas
│   │   ├── constants.ts        ← Nome do app, menu, formatadores
│   │   └── utils.ts            ← utilidades (cn, etc)
│   └── proxy.ts                ← Proxy (middleware) do Next 16
├── public/                     ← Ícones do PWA
├── supabase/
│   └── schema.sql              ← Script de criação das tabelas
├── .env.example                ← Template de variáveis
├── .env.local                  ← Variáveis REAIS (gitignored)
└── package.json
```

---

## 💰 Cálculo de empréstimos

O módulo de empréstimos suporta dois sistemas:

### Tabela Price (parcelas iguais)
Fórmula: `PMT = PV × i / (1 − (1 + i)^−n)`

Todas as parcelas têm o **mesmo valor**. No início você paga mais juros, no final mais principal. É o sistema usado em financiamentos de banco.

### Juros simples
`Juros = Principal × Taxa × N`, dividido igualmente nas parcelas. Mais simples de entender para o cliente.

O cálculo roda em **tempo real** no formulário (preview) e novamente no servidor (autoritativo) ao salvar.

---

## 📱 PWA — Instalar no celular

Depois de publicado na Vercel:

- **Android (Chrome)**: menu `⋮` → **Instalar app**
- **iPhone (Safari)**: botão Compartilhar → **Adicionar à Tela de Início**

O app terá ícone próprio, abre em tela cheia e funciona como um app nativo.

---

## ☁️ Deploy na Vercel

1. Faça push do projeto para o GitHub.
2. Acesse [vercel.com/new](https://vercel.com/new).
3. Importe o repositório.
4. Configure as variáveis de ambiente (mesmas do `.env.local`).
5. Clique em **Deploy**.

Pronto! Seu app estará no ar em minutos.

---

## 💲 Custos

| Serviço | Plano gratuito |
|---|---|
| Supabase | 500 MB de banco, 50.000 usuários |
| Vercel | Hospedagem ilimitada para uso pessoal |
| GitHub | Repositórios privados ilimitados |

⚠️ O Supabase Free **pausa projetos inativos após 7 dias**. Como o app será usado diariamente, isso não será problema.

---

## 🗺️ Roadmap (próximos passos)

- [ ] Exportar relatórios em PDF
- [ ] Notificações push de vencimentos
- [ ] Controle de estoque detalhado da adega (produtos)
- [ ] App nativo (React Native) — opcional
- [ ] Multiusuário com papéis (caixa, gerente)

---

## 📞 Suporte

Projeto desenvolvido de forma didática. Para dúvidas sobre o código, consulte os comentários em cada arquivo — todos explicam o "porquê" das decisões.
