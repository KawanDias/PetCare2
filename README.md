# DOCUMENTAÇÃO TÉCNICA - PROJETO PETCARE

## 1. Visão Geral do Projeto

### Nome do sistema

**PetCare - Plataforma de Gestão e Adoção de Pets**

### Descrição

O PetCare é uma aplicação web para intermediar a adoção responsável de animais. O sistema permite que visitantes consultem pets disponíveis, visualizem seus detalhes e iniciem uma solicitação de adoção. Usuários autenticados podem acompanhar seus dados e solicitações, enquanto o administrador gerencia o cadastro, a atualização e a remoção dos pets por meio de um painel protegido.

O projeto utiliza o Next.js com App Router. As páginas públicas consomem rotas REST implementadas no próprio Next.js, e essas rotas fazem a comunicação server-side com o Firebase Realtime Database. O Firebase Authentication é utilizado para autenticação de usuários e emissão de tokens de sessão.

### Tecnologias utilizadas

- **Next.js 15** com App Router e Route Handlers.
- **React 19** e **TypeScript**.
- **Tailwind CSS** para estilos responsivos.
- **Firebase Authentication** para autenticação e tokens.
- **Firebase Realtime Database** para persistência remota.
- **Next PWA** para recursos de Progressive Web App.
- **Vercel** para hospedagem e execução das rotas serverless.
- **Lucide React** e **Framer Motion** para ícones e interações.

### Principais áreas

| Área | Rota | Finalidade |
|---|---|---|
| Home | `/` | Apresentação e pets em destaque |
| Catálogo | `/pets` | Consulta, busca e filtragem |
| Detalhes | `/pets/[id]` | Galeria, características e adoção |
| Login | `/login` | Autenticação via Firebase |
| Cadastro | `/cadastro` | Criação da conta |
| Perfil | `/perfil` | Consulta e edição dos dados |
| Administração | `/admin` | CRUD de pets |

## 2. Mapeamento de Requisitos Atendidos

### 2.1 Requisitos funcionais (RF)

| Código | Requisito | Atendimento |
|---|---|---|
| **RF001** | Cadastro de usuário | `/cadastro` cria usuários via Firebase Authentication e coleta nome, e-mail e senha. Dados complementares são persistidos em `users/{uid}` por `/api/profile`. |
| **RF002** | Edição de usuário | Usuários autenticados editam seus dados em `/perfil` por meio de `PUT /api/profile`, com validação server-side. |
| **RF003** | Autenticação | O Firebase Authentication gerencia cadastro, login e sessão. O `AuthProvider` acompanha o usuário e identifica o papel administrativo. |
| **RF004** | Gerenciamento de pets | O administrador possui CRUD de pets com `id`, `name`, `species`, `breed`, `age`, `size`, `sex`, `coat`, cuidados, descrição, fotos e destaque. |
| **RF005** | Consulta e relatórios | `/pets` permite busca por nome, raça e personalidade e filtragem por espécie. O painel administrativo possui busca por nome. |
| **RF006** | Edição de registros | O formulário controlado pré-carrega inputs e selects. Valores são normalizados para acentos, maiúsculas e aliases legados. |
| **RF007** | Exclusão de registros | A exclusão exige confirmação, valida a existência do registro na API e atualiza a lista após sucesso. |
| **RF008** | Relacionamento entre entidades | Solicitações em `users/{uid}/adoptionRequests` relacionam usuário, pet, status e data. |
| **RF009** | Controle de acesso | `/admin` exige usuário com role `admin`; as APIs de escrita também executam `requireAdmin` no servidor. |
| **RF010** | Validação de dados | Front-end e Route Handlers validam campos obrigatórios, imagens, autenticação, autorização e existência do recurso. |

### 2.2 Requisitos não funcionais (RNF)

| Código | Requisito | Atendimento |
|---|---|---|
| **RNF001** | Arquitetura REST | As rotas utilizam `GET`, `POST`, `PUT`, `PATCH` e `DELETE`. |
| **RNF002** | Banco de dados | Persistência remota no Firebase Realtime Database. |
| **RNF003** | Separação front-end/back-end | Componentes consomem `/api/*`; servidor e `src/lib/server-api.ts` acessam o Firebase. |
| **RNF004** | Segurança de senhas | O PetCare não grava senhas; o Firebase Authentication gerencia as credenciais. |
| **RNF005** | Tratamento de erros | A API retorna JSON com status `200`, `201`, `400`, `401`, `403`, `404`, `500`, `502` e `503`, conforme o caso. |
| **RNF006** | Documentação da API | Os contratos das rotas estão descritos na seção 3. |

## 3. Documentação detalhada da API REST

### 3.1 Convenções

- As rotas são relativas à URL de implantação, por exemplo `https://dominio.vercel.app/api/pets`.
- Corpos devem usar `Content-Type: application/json`.
- Rotas protegidas recebem `Authorization: Bearer <Firebase ID token>`.
- O ID do pet é a chave gerada pelo Realtime Database.
- Os nomes efetivos usados pelo código estão em inglês (`name`, `species`, `breed`), embora a interface esteja em português.

### 3.2 Autenticação e usuários

As telas `/cadastro` e `/login` utilizam diretamente o SDK cliente do Firebase Authentication. Portanto, **não existem atualmente** as rotas REST `/api/auth/register` e `/api/auth/login`. Os contratos conceituais são atendidos pelo Firebase:

- Cadastro: `createUserWithEmailAndPassword(auth, email, senha)`.
- Login: `signInWithEmailAndPassword(auth, email, senha)`.
- Sessão: `onAuthStateChanged`.
- Token: `user.getIdToken()`.

Contratos previstos caso sejam criados Route Handlers próprios:

```text
POST /api/auth/register
Body: { "nome": "string", "email": "string", "senha": "string" }
Sucesso: 201 Created | Dados inválidos: 400 Bad Request

POST /api/auth/login
Body: { "email": "string", "senha": "string" }
Sucesso: 200 OK | Credenciais inválidas: 401 Unauthorized
```

#### `GET /api/profile`

- **Descrição:** retorna o perfil autenticado.
- **Autenticação:** obrigatória.
- **Resposta:** `200 OK` com o perfil, `uid` e `email`.
- **Erro:** `401 Unauthorized`.

#### `PUT /api/profile`

- **Descrição:** cria ou substitui os dados principais do perfil.
- **Body mínimo:** `{ "displayName": "string", "email": "string" }`.
- **Respostas:** `201 Created`, `400 Bad Request` ou `403 Forbidden`.

#### `PATCH /api/profile`

- **Descrição:** atualiza parcialmente o perfil.
- **Respostas:** `200 OK`, `401 Unauthorized` ou `403 Forbidden`.

### 3.3 Gerenciamento de pets

#### `GET /api/pets`

- **Descrição:** lista os pets cadastrados.
- **Autenticação:** não exigida.
- **Filtragem:** a implementação atual filtra no cliente; não há query param server-side para espécie.
- **Resposta `200 OK`:**

```json
[
  {
    "id": "-O123abc456",
    "name": "Lulucia",
    "species": "Cachorro",
    "breed": "American Bully",
    "age": "3",
    "size": "Médio",
    "sex": "Fêmea",
    "coat": "Blue",
    "vaccinated": "Sim",
    "neutered": "Não",
    "dewormed": "Sim",
    "temperament": "Dócil",
    "description": "Pet carinhosa e brincalhona.",
    "imageUrls": ["data:image/jpeg;base64,..."],
    "emDestaque": true
  }
]
```

- **Erro:** `502 Bad Gateway` para resposta inválida ou falha no Firebase.

#### `GET /api/pets/[id]`

- **Descrição:** consulta um pet pelo ID/key.
- **Respostas:** `200 OK`, `404 Not Found` ou `502 Bad Gateway`.

#### `POST /api/pets`

- **Descrição:** cadastra um pet.
- **Autenticação:** obrigatória; somente o administrador master.
- **Body:** `name`, `species`, `breed`, `age`, `size`, `sex`, `coat`, `vaccinated`, `neutered`, `dewormed`, `temperament`, `description`, `imageUrls` e `emDestaque`. Os aliases `images` e `image` são mantidos para compatibilidade.
- **Validações:** campos principais obrigatórios e de uma a cinco fotos.
- **Respostas:** `201 Created`, `400 Bad Request`, `401 Unauthorized` ou `403 Forbidden`.

#### `PUT /api/pets/[id]`

- **Descrição:** atualiza um pet existente.
- **Autenticação:** obrigatória; somente o administrador master.
- **Body:** mesmo contrato do `POST`.
- **Respostas:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden` ou `404 Not Found`.

#### `DELETE /api/pets/[id]`

- **Descrição:** remove um pet pelo ID.
- **Autenticação:** obrigatória; somente o administrador master.
- **Respostas:** `204 No Content`, `401 Unauthorized`, `403 Forbidden` ou `404 Not Found`.

### 3.4 Solicitações de adoção

#### `GET /api/adoptions`

- **Descrição:** lista as solicitações do usuário autenticado em ordem decrescente de criação.
- **Resposta `200 OK`:** itens com `id`, `petId`, `petName`, `imageUrl`, `status`, `createdAt` e `userId`.
- **Erro:** `401 Unauthorized`.

#### `POST /api/adoptions`

- **Body:** `{ "petId": "string", "petName": "string", "imageUrl": "string" }`.
- **Descrição:** confirma a existência do pet e cria solicitação com status `pending`.
- **Respostas:** `201 Created`, `400 Bad Request`, `401 Unauthorized` ou `404 Not Found`.

### 3.5 Agendamentos

#### `GET /api/bookings`

Lista os agendamentos do usuário; administrador pode visualizar todos. Exige autenticação e retorna `200 OK` ou `401 Unauthorized`.

#### `POST /api/bookings`

Cria agendamento com `customerName`, `customerPhone`, `serviceId`, `date` e `time`. Retorna `201 Created`, `400 Bad Request` ou `401 Unauthorized`.

### 3.6 Conteúdo público

#### `GET /api/content/[resource]`

Consulta os recursos permitidos `services`, `gallery`, `products` e `professionals`. Retorna `200 OK` com os itens e seus IDs ou `404 Not Found` para recurso não permitido.

### 3.7 Integrações opcionais

- **`POST /api/notifications/booking`:** valida dados de notificação. Retorna `400`, `503` quando provedores não estão configurados ou `501` enquanto a integração não estiver implementada.
- **`POST /api/payments/create`:** valida `bookingId` e `amountCents`. Retorna `400`, `503` sem gateway configurado ou `501` enquanto a integração não estiver implementada.
- **`POST /api/payments/webhook`:** rota reservada para webhooks de pagamento e deve ser configurada com assinatura do provedor antes do uso em produção.

## 4. Modelo de dados

### 4.1 Pet

```text
pets/{petId}
  name: string
  species: string
  breed: string
  age: string
  size: string
  sex: string
  coat: string
  vaccinated: "Sim" | "Não"
  neutered: "Sim" | "Não"
  dewormed: "Sim" | "Não"
  temperament: string
  description: string
  imageUrls: string[]
  images?: string[]
  image?: string
  emDestaque: boolean
```

### 4.2 Usuário e adoção

```text
users/{uid}
  displayName: string
  email: string
  role: "cliente" | "admin"

users/{uid}/adoptionRequests/{requestId}
  petId: string
  petName: string
  imageUrl: string
  status: "pending"
  createdAt: string ISO-8601
  userId: string
```

### 4.3 Regras de acesso

- Leitura de `pets` é pública.
- Escrita de `pets` exige usuário autenticado com e-mail administrativo.
- Usuário comum lê e altera somente seus dados permitidos.
- Solicitações de adoção ficam vinculadas ao `uid` autenticado.
- As regras estão em `database.rules.json`.

## 5. Instruções de execução

### Pré-requisitos

- Node.js 20 ou superior.
- npm.
- Projeto Firebase configurado.
- Acesso à internet para Firebase e, em produção, conta Vercel.

### Instalação e desenvolvimento

```bash
npm install
npm run dev
```

A aplicação fica disponível, por padrão, em `http://localhost:3000`.

### Build e produção

```bash
npm run build
npm start
```

O build compila o projeto, verifica tipos e gera as páginas estáticas.

## 6. Variáveis de ambiente

### Firebase obrigatório

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
```

### Administração e integrações opcionais

```env
NEXT_PUBLIC_ADMIN_EMAIL=
NEXT_PUBLIC_LOCAL_ADMIN_PASSWORD=
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
MERCADO_PAGO_ACCESS_TOKEN=
ASAAS_API_KEY=
PAYMENT_WEBHOOK_SECRET=
```

Use `.env.local` para valores locais e mantenha-o fora do Git. O arquivo `.env.example` contém a referência das variáveis. Segredos de provedores e webhooks nunca devem ser publicados no repositório.

## 7. Fluxo principal de adoção

1. O visitante acessa `/pets`.
2. O catálogo chama `GET /api/pets`.
3. O visitante abre `/pets/[id]` para visualizar fotos, características, história e cuidados.
4. Se não estiver autenticado, é direcionado ao login.
5. O usuário autenticado envia `POST /api/adoptions`.
6. A API valida o usuário, confirma que o pet existe e grava a solicitação em `users/{uid}/adoptionRequests`.
7. O usuário acompanha o histórico no perfil.
8. O administrador utiliza `/admin` para manter o catálogo.

## 8. Segurança e confiabilidade

- O servidor valida o Firebase ID token e não confia em uma `role` enviada pelo cliente.
- A URL do Realtime Database é normalizada e possui fallback defensivo.
- Edição e exclusão verificam a existência do registro antes da operação.
- O cadastro limita a galeria a cinco imagens.
- As APIs retornam erros em JSON com status HTTP apropriado.
- Antes da publicação, executar `npm run build` e revisar as variáveis na Vercel.

## 9. Estrutura de pastas relevante

```text
src/
  app/
    api/
      adoptions/route.ts
      bookings/route.ts
      content/[resource]/route.ts
      pets/route.ts
      pets/[id]/route.ts
      profile/route.ts
    admin/page.tsx
    pets/page.tsx
    pets/[id]/page.tsx
  components/
  lib/
    api.ts
    firebase.ts
    server-api.ts
    catalog-data.ts
database.rules.json
.env.example
```
