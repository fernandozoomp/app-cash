# 💰 Meu Caixa — Projeto de Teste

> ⚠️ **Atenção:** Este é um **projeto de teste**, criado para explorar e validar
> funcionalidades. **Não deve ser usado para controle financeiro real.**
> Os dados são armazenados em um banco gratuito (Supabase Free Tier) que pode
> pausar após 7 dias sem uso, e a aplicação não tem garantias de disponibilidade,
> backup ou suporte.

---

## 🎯 Sobre este projeto

Aplicativo web (PWA) construído para **testar funcionalidades** de um sistema
de controle de caixa para múltiplos empreendimentos — no caso, **Adega**,
**Empréstimos** e **Sucatas**.

O objetivo é **aprender e validar** ideias como:

- ✅ Como construir um app completo do zero (front + back + deploy)
- ✅ Como funciona autenticação com Supabase
- ✅ Como implementar segurança por usuário (RLS)
- ✅ Como calcular empréstimos (Tabela Price e juros simples)
- ✅ Como importar extrato bancário via CSV
- ✅ Como publicar na internet gratuitamente (Vercel)
- ✅ Como transformar um site em app instalável no celular (PWA)

> 📚 **Para quem é este README?** Para qualquer pessoa curiosa que queira
> entender o que foi construído, como rodar localmente, e o que cada parte faz.
> Não assume conhecimento prévio de programação.

---

## 🚦 Estado do projeto

| Item | Status |
|---|---|
| Funcionalidades principais | ✅ Implementadas |
| Autenticação (login/cadastro/recuperar senha) | ✅ Funcionando |
| Banco de dados (7 tabelas com RLS) | ✅ Configurado |
| Deploy (Vercel) | ✅ No ar |
| PWA (instalável no celular) | ✅ Funcionando |
| **Pronto para produção real?** | ❌ **NÃO** — é um teste |
| Tem garantia de disponibilidade? | ❌ Não |
| Tem backup automático confiável? | ❌ Não |
| Tem suporte? | ❌ Não |

**Por que não usar em produção?** Este é um projeto experimental. Para uso
real, faltaria: monitoramento 24/7, backups automáticos verificados, plano
pago do Supabase (sem pausa por inatividade), testes automatizados,
auditoria de segurança, e mais.

---

## ✨ Funcionalidades implementadas (para teste)

| Módulo | O que faz |
|---|---|
| 🏠 **Dashboard** | Visão geral com saldo, entradas/saídas do mês, saldo por empreendimento, próximos vencimentos e empty states acolhedores |
| 💵 **Caixa** | Lançar entradas/saídas manualmente **OU importar via CSV** (extrato bancário com detecção automática de banco), listar histórico, excluir com confirmação elegante |
| 🤝 **Empréstimos** | Cadastrar clientes, criar empréstimos com **cálculo automático de parcelas** (Tabela Price ou juros simples), preview em tempo real, receber parcelas (com entrada automática no caixa), barra de progresso visual |
| 👥 **Clientes** | CRUD completo com máscara de telefone brasileiro, editar/excluir com confirmação |
| ♻️ **Sucatas** | Compra/venda por peso, cálculo de total e lucro automático |
| 🍷 **Adega** | Resumo das vendas e despesas da adega, atalho para lançar vendas |
| 📊 **Relatórios** | Histórico mensal dos últimos 6 meses, total por empreendimento |
| 🔐 **Auth** | Login, cadastro (com medidor de força de senha), recuperar senha, atualizar senha |
| 📱 **PWA** | Instalável no celular (Android + iPhone), funciona como app nativo |

---

## 🏗️ Stack técnica (ferramentas usadas)

- **[Next.js 16](https://nextjs.org/)** — framework React (App Router, Server Components, Server Actions)
- **[TypeScript](https://www.typescriptlang.org/)** — tipagem estática (evita bugs)
- **[Tailwind CSS 4](https://tailwindcss.com/)** — estilos utilitários
- **[shadcn/ui](https://ui.shadcn.com/)** — componentes acessíveis e bonitos
- **[Supabase](https://supabase.com/)** — PostgreSQL + Auth + RLS (camada gratuita)
- **[Vercel](https://vercel.com/)** — hospedagem gratuita
- **[lucide-react](https://lucide.dev/)** — ícones
- **[react-hook-form](https://react-hook-form.com/)** + **[zod](https://zod.dev/)** — formulários com validação

### 🎓 Skills de IA usadas no aperfeiçoamento

Para a revisão de design, UX, financeiro e frontend, foram usadas skills do
repositório público [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills):

- `ui-design-system` — tokens de design, 8pt grid, contraste WCAG
- `content-humanizer` + `behuman` — textos naturalizados
- `ux-researcher-designer` — fluxos e empty states
- `financial-analyst` — precisão monetária
- `senior-frontend` + `cs-frontend-review` — boas práticas
- `a11y-audit` — acessibilidade WCAG AA

---

## 📋 Pré-requisitos (para rodar localmente)

- **Node.js 20+** (recomendado via [Homebrew](https://brew.sh/): `brew install node`)
- **Conta gratuita** no [Supabase](https://supabase.com/)
- **Conta gratuita** no [GitHub](https://github.com/) (para acessar o código)

---

## 🚀 Como rodar localmente (passo a passo)

### 1. Clonar o repositório

```bash
git clone https://github.com/fernandozoomp/app-cash.git
cd app-cash
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie o template e preencha com seus dados do Supabase:

```bash
cp .env.example .env.local
```

Edite `.env.local` com:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-publishable-key-aqui
```

> 🔎 **Onde achar**: painel do Supabase → **Project Settings** → **API** →
> "Project URL" e "Publishable key".

### 4. Criar as tabelas no banco

1. No painel do Supabase, abra **SQL Editor** → **New query**
2. Cole o conteúdo de `supabase/schema.sql`
3. Clique em **Run**

Isso cria as 7 tabelas + políticas de segurança (RLS).

### 5. Rodar o projeto

```bash
npm run dev
```

Abra **http://localhost:3000** no navegador.

### 6. Criar sua conta de teste

Acesse `/cadastro`, crie uma conta com qualquer e-mail e comece a explorar.

---

## 🔐 Como a segurança funciona (mesmo sendo um teste)

Mesmo sendo projeto de teste, a segurança foi implementada de forma profissional
— ótimo para aprender os conceitos:

1. **Autenticação** (Supabase Auth): login com e-mail + senha + confirmação.
2. **Row Level Security (RLS)**: cada usuário só vê e edita **seus próprios**
   dados. Mesmo que alguém descubra sua URL do Supabase, não acessa nada.
3. **HTTPS**: todo tráfego é criptografado (automático na Vercel).

**Regras de ouro:**
- 🔒 **Nunca** compartilhe sua chave `service_role` (tem acesso total).
- 🔒 **Nunca** faça commit do arquivo `.env.local` (já está no `.gitignore`).
- ✅ A chave `anon` (publishable) é segura no navegador porque o RLS protege os dados.

---

## 📁 Estrutura do projeto

```
app-cash/
├── src/
│   ├── app/
│   │   ├── (app)/              ← Páginas PROTEGIDAS (com sidebar)
│   │   │   ├── page.tsx        ← Dashboard
│   │   │   ├── caixa/          ← Fluxo de caixa + importação CSV
│   │   │   ├── emprestimos/    ← Empréstimos com cálculo de parcelas
│   │   │   ├── clientes/       ← Clientes (CRUD)
│   │   │   ├── adega/          ← Adega
│   │   │   ├── sucatas/        ← Sucatas
│   │   │   └── relatorios/     ← Relatórios mensais
│   │   ├── (auth)/             ← Páginas PÚBLICAS (login, cadastro, recuperar)
│   │   ├── actions/            ← Server Actions (lógica no servidor)
│   │   │   ├── auth.ts         ← login, cadastro, logout, recuperar senha
│   │   │   ├── caixa.ts        ← CRUD de transações
│   │   │   ├── clientes.ts     ← CRUD de clientes
│   │   │   ├── emprestimos.ts  ← Empréstimos + parcelas
│   │   │   ├── sucatas.ts      ← CRUD de sucatas
│   │   │   └── csv.ts          ← Importação de CSV
│   │   ├── globals.css         ← Design system (cores, tipografia, animações)
│   │   ├── layout.tsx          ← Layout raiz (fontes, Toaster, PWA)
│   │   └── manifest.ts         ← Configuração do PWA
│   ├── components/
│   │   ├── ui/                 ← Componentes do shadcn
│   │   ├── forms/              ← Formulários (transação, cliente, CSV, etc)
│   │   ├── lists/              ← Listas (transações, clientes, etc)
│   │   ├── confirm-dialog.tsx  ← Confirmação elegante
│   │   ├── empty-state.tsx     ← Estados vazios amigáveis
│   │   ├── app-layout.tsx      ← Moldura das páginas internas
│   │   ├── sidebar.tsx         ← Barra lateral + logout
│   │   └── page-header.tsx     ← Título padrão das páginas
│   ├── lib/
│   │   ├── csv/parser.ts       ← Parser de CSV (detecção de banco)
│   │   ├── supabase/           ← Clients Supabase (server/browser)
│   │   ├── auth/session.ts     ← Helpers de sessão
│   │   ├── finance/calculadora.ts ← Cálculo de empréstimos (Price/simples)
│   │   ├── types/database.ts   ← Tipos TypeScript das tabelas
│   │   ├── constants.ts        ← Config global, tradução de categorias
│   │   └── utils.ts            ← Utilidades (cn, etc)
│   └── proxy.ts                ← Proxy/middleware do Next 16 (renova sessão)
├── public/                     ← Ícones do PWA
├── supabase/
│   ├── schema.sql              ← Script de criação das tabelas
│   └── fix-parcelas-rls.sql    ← Fix da política de INSERT de parcelas
├── .env.example                ← Template de variáveis (público)
├── .env.local                  ← Variáveis REAIS (gitignored)
└── package.json
```

---

## 💰 Como o cálculo de empréstimos funciona

O módulo de empréstimos suporta dois sistemas (clássicos do mercado brasileiro):

### Tabela Price (parcelas iguais)

Fórmula: `PMT = PV × i / (1 − (1 + i)^−n)`

Todas as parcelas têm o **mesmo valor**. No início você paga mais juros, no final
mais principal. É o sistema usado em financiamentos de banco.

**Exemplo:** R$ 1.000,00 a 5% ao mês em 10x → 10 parcelas de R$ 129,50
(total R$ 1.295,04; juros R$ 295,04).

### Juros simples

`Juros = Principal × Taxa × N`, dividido igualmente nas parcelas. Mais simples
de entender para o cliente.

O cálculo roda em **tempo real** no formulário (preview) e novamente no servidor
(autoritativo) ao salvar — garantindo que o que o usuário vê é o que será salvo.

---

## 📄 Como a importação de CSV funciona

A feature de importação de extrato bancário foi desenhada para ser prática:

1. **Detecção automática**: identifica o banco pelo padrão das colunas
   (Nubank, Itaú, Bradesco, Banco Inter, ou genérico).
2. **Normalização**: converte datas (`DD/MM/YYYY`, `YYYY-MM-DD`, etc.) e
   valores brasileiros (`1.234,56` → `1234.56`) automaticamente.
3. **Preview**: mostra as transações detectadas antes de importar.
4. **Importação em lote**: salva todas de uma vez.
5. **Funciona no celular e desktop**.

> ⚠️ Como é um projeto de teste, **sempre confira os valores importados**
> antes de confiar neles. O parser pode errar em formatos diferentes dos testados.

---

## 📱 PWA — Instalar no celular

Depois de publicado:

- **Android (Chrome)**: menu `⋮` → **Instalar app**
- **iPhone (Safari)**: botão Compartilhar → **Adicionar à Tela de Início**

O app terá ícone próprio, abre em tela cheia e funciona como um app nativo.

---

## ☁️ Deploy na Vercel (como foi publicado)

1. Código enviado para o GitHub.
2. Em [vercel.com/new](https://vercel.com/new), importou-se o repositório.
3. Configurou-se as variáveis de ambiente (mesmas do `.env.local`).
4. Clicou-se em **Deploy**.
5. Pronto — a Vercel faz deploy automático a cada push no GitHub.

---

## 💲 Custos (tudo gratuito no teste)

| Serviço | Plano gratuito |
|---|---|
| Supabase | 500 MB de banco, 50.000 usuários |
| Vercel | Hospedagem ilimitada para uso pessoal |
| GitHub | Repositórios privados/públicos ilimitados |

⚠️ O Supabase Free **pausa projetos inativos após 7 dias**. Como é um teste,
isso não é problema — basta acessar o painel e "resumir" o projeto quando
quiser usar de novo.

---

## ⚠️ Limitações conhecidas (por ser um teste)

- **Sem backup automático confiável**: se o Supabase pausar por inatividade
  prolongada, os dados podem ficar indisponíveis.
- **Sem monitoramento**: se algo quebrar em produção, ninguém é avisado.
- **Sem testes automatizados**: bugs podem passar despercebidos.
- **Sem suporte a múltiplos usuários reais**: a sessão simples não atende
  cenários de equipe com papéis diferentes.
- **CSV parser é heurístico**: pode falhar em formatos de banco diferentes dos
  testados (Nubank, Itaú, Bradesco).
- **Não há como editar transações** (apenas criar e excluir).
- **A adega não tem controle de estoque detalhado** (apenas resumo por categoria).

---

## 🗺️ O que poderia vir depois (ideias, não compromissos)

- [ ] Exportar relatórios em PDF
- [ ] Notificações push de vencimentos
- [ ] Controle de estoque detalhado da adega (produtos)
- [ ] Edição de transações
- [ ] Conciliação entre transação manual vs importada
- [ ] Multiusuário com papéis (caixa, gerente, dono)
- [ ] Testes automatizados (Jest, Playwright)
- [ ] CI/CD com verificações automáticas
- [ ] Transformar em app de produção real (com backups, monitoramento, plano pago)

---

## 📞 Aviso final

Este projeto foi feito para **aprender**. Use à vontade para estudar, testar,
modificar, quebrar, refazer. Mas **não confie nele para dinheiro real**.

Se ele te ajudou a entender como apps modernos funcionam — Next.js, Supabase,
autenticação, segurança, PWA, deploy — cumpriu seu papel. 🎓

---

## 📄 Licença

Projeto de uso livre para fins educacionais. Sem garantias.
