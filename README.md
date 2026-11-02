# 🐾 PetCare — Plataforma de Adoção de Animais
> **Projeto Integrador** — Tecnologia em Análise e Desenvolvimento de Sistemas (IFPR - Campus Telêmaco Borba)
> **Orientadora:** Prof.ª Melissa Cordeiro

---

## 📌 1. Sobre o Projeto

O **PetCare** é uma aplicação web full-stack desenvolvida em **Next.js (App Router)** e **Firebase Realtime Database**, criada para conectar protetores/ONGs de animais a potenciais adotantes. O sistema permite o gerenciamento completo (CRUD) do catálogo de pets, controle de favoritos, autenticação de usuários e um fluxo administrativo em tempo real para análise e gestão de solicitações de adoção.

O projeto foi desenvolvido com foco em adoção responsável, separando as responsabilidades entre:

- **Visitantes:** consulta do catálogo, filtros, detalhes e acesso ao fluxo de adoção.
- **Usuários autenticados:** manutenção do perfil, favoritos e acompanhamento das solicitações.
- **Administradores:** cadastro, edição e remoção de pets, além da análise das solicitações.
- **Firebase:** autenticação, persistência, sincronização em tempo real e regras de autorização.

### Áreas e rotas principais

| Área | Rota | Finalidade |
|---|---|---|
| Página inicial | `/` | Apresentação do PetCare e pets em destaque |
| Catálogo | `/pets` | Busca e consulta de pets disponíveis |
| Detalhes do pet | `/pets/[id]` | Características, galeria, favoritos e acesso à adoção |
| Formulário de adoção | `/pets/[id]/adocao` | Cadastro de uma solicitação vinculada ao pet |
| Login | `/login` | Autenticação de usuários |
| Cadastro | `/cadastro` | Criação de novas contas |
| Perfil | `/perfil` | Dados pessoais, endereço, favoritos e solicitações |
| Administração | `/admin` | Gerenciamento protegido de pets e solicitações |

---

## 🛠️ 2. Tecnologias Utilizadas

- **Front-end / Framework:** Next.js (App Router, React, TypeScript)
- **Estilização:** Tailwind CSS (interface responsiva e moderna)
- **Back-end / Persistência:** Firebase Realtime Database, com escuta reativa `onValue` e operações assíncronas
- **Autenticação:** Firebase Authentication
- **Hospedagem & Deploy:** Vercel, com integração contínua e variáveis de ambiente
- **PWA:** `next-pwa` para instalação e cache do aplicativo
- **Interface:** Lucide React para ícones e Framer Motion para animações
- **Qualidade:** TypeScript, ESLint e build de produção do Next.js

### Dependências de execução

- Node.js 18.18 ou superior
- npm
- Projeto Firebase com Authentication e Realtime Database habilitados
- Conta Vercel para publicação, caso o deploy seja necessário

---

## 🎯 3. Cobertura dos Requisitos do Projeto Integrador

### ✅ Requisitos Funcionais (RF)

- **RF001 - Cadastro de Usuário:** tela `/cadastro` com validação no front-end e criação de conta por `createUserWithEmailAndPassword` do Firebase Authentication.
- **RF002 - Edição e Perfil do Usuário:** área `/perfil` para edição de dados cadastrais, endereço, favoritos e acompanhamento do histórico de solicitações.
- **RF003 - Autenticação:** login, logout e observação da sessão por Firebase Authentication e `onAuthStateChanged`.
- **RF004 / RF006 / RF007 - Gerenciamento do Recurso Principal (Pets):** CRUD completo do recurso principal **Pet**, contemplando:
  1. `name` / `nome` (String)
  2. `species` / `especie` (Cachorro, Gato, Aves ou Outros)
  3. `breed` / `raca` (String)
  4. `age` / `idade` (Anos ou meses)
  5. `size` / `porte` (Pequeno, Médio ou Grande)
  6. `sex` / `sexo` (Fêmea ou Macho)
  7. `coat` / `cor` / `pelagem` (String)
  8. `description` / `historia` (String)
  9. `imageUrls` / `images` / `image` (uma a cinco imagens em URL ou Base64)
  10. `status` (Disponível ou Adotado)
  11. `vaccinated`, `neutered` e `dewormed` (cuidados de saúde)
  12. `temperament` (personalidade)
- **RF005 - Consulta, Relatórios e Filtros:** catálogo público com busca dinâmica por nome, raça e personalidade, além de filtragem por espécie e disponibilidade.
- **RF008 - Relacionamento entre Entidades:** associação entre **Usuário**, **Pet** e **Solicitação de Adoção** por `userId`, `petId` e o nó `/solicitacoes`.
- **RF009 - Controle de Acesso:** rota administrativa `/admin` protegida por autenticação, role administrativa e validação server-side nas APIs.
- **RF010 - Validação de Dados:** formulários com campos obrigatórios, máscaras, consulta automática de endereço por CEP, validação de CPF e mensagens de erro amigáveis.

### 🛡️ Requisitos Não Funcionais (RNF)

- **RNF001 & RNF003 - Arquitetura e Separação:** interface em componentes React, Route Handlers no Next.js e camada de acesso server-side ao Firebase em `src/lib/server-api.ts`.
- **RNF002 - Banco de Dados:** persistência em nuvem no Firebase Realtime Database, sem dependência exclusiva de dados estáticos ou em memória.
- **RNF004 - Segurança de Senhas:** o PetCare não grava senhas; o Firebase Authentication gerencia as credenciais.
- **RNF005 - Documentação e Tratamento de Erros:** Route Handlers retornam JSON e códigos HTTP apropriados, com tratamento explícito de falhas de autenticação, autorização, validação e comunicação com o banco.
- **RNF006 - Responsividade e Acessibilidade:** interface responsiva com Tailwind CSS, navegação por abas, textos de estado vazio, `aria-label` e feedback visual.
- **RNF007 - Sincronização:** solicitações e notificações administrativas são atualizadas em tempo real por listeners do Realtime Database.

---

## 🚀 4. Funcionalidades de Destaque

### 4.1 Painel de Administração (`/admin`)

1. **Gerenciar pets:** lista, busca, edição dinâmica pelo ID real do Firebase e exclusão com confirmação.
2. **Cadastrar pet:** formulário com dados de identificação, saúde, personalidade, descrição, destaque e seleção de uma a cinco fotos.
3. **Solicitações de adoção:** listener em tempo real do nó `/solicitacoes`, contador de solicitações ativas no sino de notificações e ações de aceitar ou negar.
4. **Solicitações finalizadas:** separação de solicitações aceitas, adotadas, negadas, recusadas ou concluídas.
5. **Exclusão administrativa:** o botão de exclusão remove fisicamente o registro com `remove(ref(database, "solicitacoes/{id}"))`.
6. **Comunicação:** links de WhatsApp e e-mail são montados a partir dos dados reais do solicitante.

### 4.2 Área do Adotante (`/perfil`)

- **Minhas Solicitações:** acompanhamento em abas de solicitações ativas e finalizadas.
- **Status sincronizado:** `pendente` é apresentado como “Em andamento”; `approved`, `aprovado`, `adotado` e `completed` como “Aceita”; `negado`, `recusado` e `cancelled` como “Negada”.
- **Soft delete independente:** o botão `X` oculta uma solicitação finalizada somente para o usuário, gravando `excluidoPeloUsuario: true`. O registro continua disponível ao administrador.
- **Favoritos:** inclusão e remoção de pets favoritos vinculados ao usuário autenticado.
- **Perfil e endereço:** edição de dados pessoais e endereço utilizado para adoção responsável.

### 4.3 Experiência pública

- Galeria com imagem principal, miniaturas, setas e lightbox.
- CTA de adoção com formulário vinculado ao ID do pet.
- Upload de uma a cinco imagens em Base64 no painel administrativo.
- Identidade visual acolhedora, responsiva e compatível com instalação como PWA.

---

## 📡 5. Documentação da API / Estrutura de Dados (Firebase Realtime DB)

### 5.1 Convenções da API

- A URL base é `https://<dominio>/api`.
- Os corpos das requisições devem usar `Content-Type: application/json`.
- Rotas protegidas utilizam `Authorization: Bearer <Firebase ID token>`.
- O ID de um pet ou solicitação corresponde à chave gerada pelo Realtime Database.
- A autenticação de usuários é feita diretamente pelo SDK do Firebase; não existem atualmente Route Handlers próprios `/api/auth/login` ou `/api/auth/register`.

### 5.2 API de pets

#### `GET /api/pets`

Lista todos os pets. Não exige autenticação.

**Resposta `200 OK`:**

```json
[
  {
    "id": "-O123abc456",
    "name": "Thor",
    "species": "Cachorro",
    "breed": "SRD",
    "age": "2 anos",
    "size": "Médio",
    "sex": "Macho",
    "coat": "Caramelo",
    "vaccinated": "Sim",
    "neutered": "Sim",
    "dewormed": "Sim",
    "temperament": "Brincalhão",
    "description": "Pet dócil e sociável.",
    "imageUrls": ["data:image/jpeg;base64,..."],
    "emDestaque": true,
    "status": "disponivel"
  }
]
```

#### `GET /api/pets/{id}`

Consulta um pet pelo ID. Retorna `200 OK`, `404 Not Found` ou `502 Bad Gateway`.

#### `POST /api/pets`

Cadastra um pet. Exige autenticação e permissão de administrador.

**Campos obrigatórios:** `name`, `species`, `breed`, `age`, `size`, `sex`, `description` e `imageUrls`.

**Respostas:** `201 Created`, `400 Bad Request`, `401 Unauthorized` ou `403 Forbidden`.

#### `PUT /api/pets/{id}`

Atualiza um pet existente pelo ID. Exige administrador. Aceita o mesmo conjunto de campos do `POST`.

**Respostas:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden` ou `404 Not Found`.

#### `DELETE /api/pets/{id}`

Remove um pet pelo ID. Exige administrador.

**Respostas:** `200 OK`, `401 Unauthorized`, `403 Forbidden` ou `404 Not Found`.

### 5.3 API de solicitações de adoção

No código atual, os Route Handlers ficam em `/api/adoptions`, enquanto a persistência direta do cliente utiliza o nó `/solicitacoes`.

#### `GET /api/adoptions`

Retorna solicitações normalizadas. Usuários autenticados recebem suas próprias solicitações; administradores recebem a lista completa. O endpoint mantém fallback de leitura para registros legados em `users/{uid}/adoptionRequests`.

**Respostas:** `200 OK` ou `401 Unauthorized`.

#### `POST /api/adoptions`

Cria uma solicitação vinculada ao pet e ao usuário autenticado.

**Campos principais:**

```json
{
  "petId": "-O123abc456",
  "petNome": "Thor",
  "petFoto": "https://...",
  "nomeAdotante": "Nome do adotante",
  "cpf": "00000000000",
  "telefone": "(42) 99999-9999",
  "email": "pessoa@email.com",
  "endereco": {
    "cep": "84261000",
    "rua": "Rua Exemplo",
    "bairro": "Centro",
    "numero": "123",
    "cidade": "Telêmaco Borba",
    "uf": "PR"
  },
  "justificativa": "Motivação para a adoção"
}
```

O servidor grava `status: "pendente"`, `dataCriacao` e `userId`. CPF e CEP são normalizados e validados.

**Respostas:** `201 Created`, `400 Bad Request`, `401 Unauthorized` ou `404 Not Found`.

#### `PATCH /api/adoptions`

Atualiza o status de uma solicitação. Exige administrador.

```json
{
  "requestId": "-O123request",
  "status": "approved"
}
```

Os status aceitos pelo endpoint são `approved`, `negado` e `completed`. Em caso de aprovação, o registro também pode ser copiado para o histórico do usuário em `usuarios/{userId}/historico`.

**Respostas:** `200 OK`, `400 Bad Request`, `403 Forbidden` ou `404 Not Found`.

#### Operações diretas no nó `/solicitacoes`

O formulário público e os componentes realtime também usam o SDK cliente:

- **Criação:** `push(ref(database, "solicitacoes"), payload)`.
- **Leitura administrativa:** `onValue(ref(database, "solicitacoes"), ...)`.
- **Leitura do usuário:** query por `orderByChild("userId")` e `equalTo(user.uid)`.
- **Soft delete do usuário:** `update(ref(database, "solicitacoes/{id}"), { excluidoPeloUsuario: true })`.
- **Exclusão física do administrador:** `remove(ref(database, "solicitacoes/{id}"))`.

Não há Route Handler `DELETE /api/adoptions` implementado atualmente; a exclusão administrativa é feita diretamente pelo SDK autorizado.

### 5.4 Outros endpoints

| Endpoint | Métodos | Finalidade |
|---|---|---|
| `/api/profile` | `GET`, `PUT`, `PATCH` | Consulta e atualização do perfil autenticado |
| `/api/bookings` | `GET`, `POST`, `PATCH`, `DELETE` | Compatibilidade com agendamentos legados |
| `/api/notifications/booking` | `GET` | Notificações relacionadas a agendamentos |
| `/api/content/{resource}` | `GET` | Leitura de recursos de conteúdo |
| `/api/pets/{id}` | `GET`, `PUT`, `DELETE` | Operações individuais de pets |
| `/api/payments/create` | `POST` | Integração opcional de pagamentos |
| `/api/payments/webhook` | `POST` | Recepção de webhook de pagamentos |

### 5.5 Nós principais do Realtime Database

#### `/pets`

Cada chave representa um pet e contém os dados de identificação, saúde, personalidade, imagens, destaque e status.

#### `/solicitacoes`

Cada chave representa uma solicitação:

```json
{
  "petId": "-O123abc456",
  "petNome": "Thor",
  "petFoto": "data:image/jpeg;base64,...",
  "nomeAdotante": "Nome do adotante",
  "cpf": "00000000000",
  "telefone": "(42) 99999-9999",
  "email": "pessoa@email.com",
  "userId": "firebase-user-id",
  "endereco": {
    "cep": "84261000",
    "rua": "Rua Exemplo",
    "bairro": "Centro",
    "numero": "123"
  },
  "justificativa": "Motivação",
  "status": "pendente",
  "dataCriacao": "2026-11-02T10:00:00.000Z",
  "excluidoPeloUsuario": false
}
```

#### `/users/{uid}` e `/usuarios/{uid}`

O nó `users` armazena perfis e compatibilidade com solicitações legadas. O nó `usuarios` mantém favoritos e histórico de adoções.

### 5.6 Regras de segurança

As regras versionadas em `database.rules.json` definem:

- leitura pública dos pets;
- escrita de pets somente para o e-mail administrativo configurado;
- leitura completa de `/solicitacoes` para o administrador;
- leitura filtrada pelo `userId` para o usuário autenticado;
- escrita de uma solicitação pelo próprio usuário ou administrador;
- índices para `status`, `dataCriacao`, `userId` e `usuarioId`.

Alterar `database.rules.json` no repositório **não publica automaticamente** as regras no Firebase. Após uma alteração, publique o conteúdo no Firebase Console ou pelo Firebase CLI e valide as permissões no ambiente de produção.

---

## ⚙️ 6. Como Executar o Projeto Localmente

### 6.1 Pré-requisitos

1. Instale Node.js 18.18 ou superior.
2. Configure um projeto no Firebase.
3. Habilite Firebase Authentication (e-mail e senha).
4. Habilite o Firebase Realtime Database.
5. Defina uma conta administrativa com o mesmo e-mail usado nas regras.

### 6.2 Clonar o repositório

```bash
git clone https://github.com/KawanDias/PetCare2.git
cd PetCare2
```

### 6.3 Instalar dependências

```bash
npm install
```

### 6.4 Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz. Não publique esse arquivo no repositório.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://seu-banco-default-rtdb.firebaseio.com
NEXT_PUBLIC_ADMIN_EMAIL=admin@exemplo.com
```

As configurações `NEXT_PUBLIC_*` são utilizadas pelo SDK cliente. A chave de API do Firebase é uma configuração pública do cliente, mas tokens, chaves de serviços externos e credenciais administrativas nunca devem ser versionados.

### 6.5 Executar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### 6.6 Validar a produção localmente

```bash
npm run build
npm start
```

O comando `npm run build` executa a compilação, a verificação de tipos e a geração das páginas do Next.js.

### 6.7 Publicar regras do Firebase

Antes de testar solicitações em produção:

1. Abra o Realtime Database no Firebase Console.
2. Acesse a aba **Rules**.
3. Cole o conteúdo de `database.rules.json`.
4. Publique as regras.
5. Teste login, envio de solicitação, leitura do perfil e ações administrativas.

### 6.8 Deploy na Vercel

1. Importe o repositório no painel da Vercel.
2. Configure as variáveis `NEXT_PUBLIC_*` nos ambientes **Production** e **Preview**.
3. Execute o deploy.
4. Confirme a URL do Realtime Database e as regras publicadas.
5. Valide o fluxo completo: cadastro, login, envio, aprovação e sincronização da solicitação.

---

## 🗂️ 7. Organização do Código

```text
PetCare2/
├── public/                    # Logo, imagens públicas e service worker
├── src/
│   ├── app/                   # Páginas App Router e Route Handlers
│   │   ├── admin/             # Painel administrativo
│   │   ├── api/               # APIs REST do Next.js
│   │   ├── cadastro/          # Cadastro de usuários
│   │   ├── login/             # Login
│   │   ├── perfil/            # Área autenticada do usuário
│   │   └── pets/              # Catálogo, detalhes e adoção
│   ├── components/            # Componentes reutilizáveis
│   └── lib/                   # Firebase, API client/server e modelos
├── database.rules.json        # Regras do Firebase Realtime Database
├── next.config.mjs            # Configuração do Next.js e PWA
├── package.json               # Scripts e dependências
├── tailwind.config.ts         # Configuração do Tailwind CSS
└── tsconfig.json              # Configuração do TypeScript
```

### Princípios adotados

- IDs do Firebase são preservados e utilizados nas rotas dinâmicas.
- Dados legados são normalizados para manter compatibilidade.
- Operações administrativas são protegidas no cliente e no servidor.
- Listeners realtime são desinscritos no retorno dos `useEffect`.
- O usuário pode ocultar sua solicitação, mas não apagar o histórico administrativo.

---

## 🧪 8. Validação e Testes Manuais

### Fluxo público

1. Acesse `/pets`.
2. Abra os detalhes de um pet.
3. Acesse o formulário de adoção.
4. Preencha CPF, telefone, e-mail, endereço e justificativa.
5. Confirme o envio.
6. Verifique a criação do registro em `/solicitacoes`.

### Fluxo administrativo

1. Entre com a conta administrativa.
2. Acesse `/admin`.
3. Confirme o contador do sino.
4. Verifique a solicitação na aba ativa.
5. Aceite ou negue a solicitação.
6. Confirme a mudança de status no perfil.
7. Teste a exclusão física somente no painel administrativo.

### Fluxo do usuário

1. Acesse `/perfil`.
2. Abra **Minhas Solicitações**.
3. Confira a separação entre ativas e finalizadas.
4. Oculte uma solicitação finalizada pelo botão `X`.
5. Confirme que ela desapareceu do perfil, mas permanece no painel administrativo.

---

## 👥 9. Equipe e Contexto Acadêmico

Este repositório contém o desenvolvimento do Projeto Integrador do curso de **Tecnologia em Análise e Desenvolvimento de Sistemas do IFPR — Campus Telêmaco Borba**.

- **Projeto:** PetCare — Plataforma de Adoção de Animais
- **Instituição:** Instituto Federal do Paraná (IFPR)
- **Campus:** Telêmaco Borba
- **Orientadora:** Prof.ª Melissa Cordeiro
- **Repositório:** [KawanDias/PetCare2](https://github.com/KawanDias/PetCare2)

---

## 📄 10. Licença e Uso Acadêmico

O projeto é disponibilizado para fins acadêmicos, de demonstração e avaliação do Projeto Integrador. Antes de utilizar o sistema em produção, revise as regras do Firebase, as permissões administrativas, as políticas de privacidade e a proteção dos dados pessoais tratados no formulário de adoção.
