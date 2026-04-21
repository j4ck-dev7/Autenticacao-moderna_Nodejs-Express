# Autenticação Moderna

[![Node.js](https://img.shields.io/badge/Node.js-v22.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1-blue)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-brightgreen)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-5.x-red)](https://redis.io/)
[![Jest](https://img.shields.io/badge/Jest-30.x-red)](https://jestjs.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Um projeto robusto de autenticação moderna com suporte a **login local** (email/senha) e **OAuth2 com Google**, incluindo segurança em nível de produção com rate limiting, proteção CSRF, criptografia de senhas, validações rigorosas, logging detalhado, **verificação de email com Nodemailer** e **testes unitários completos com Jest**.

Desenvolvido com **Node.js + Express + MongoDB + Mongoose + Redis** e testado com **Jest** e **Insomnia**.

## 🚀 Endpoints Principais

### Autenticação Local
- `POST   /api/user/signUp` → Registro com email e senha  
- `POST   /api/user/signIn` → Login com email e senha
- `GET    /api/user/verify-email?token=...` → Verificar email e ativar conta
- `POST   /api/user/change-password` → Alterar senha (requer autenticação)

### Autenticação OAuth2 (Google)
- `GET    /api/user/Oauth/google/get/url/signUp` → Obter URL para registro com Google
- `GET    /api/user/Oauth/google/get/url/signIn` → Obter URL para login com Google
- `GET    /api/user/Oauth/signUp` → Callback para registro com Google
- `GET    /api/user/Oauth/signIn` → Callback para login com Google

### Rotas Protegidas
- `GET    /api/user/main` → Página principal (requer autenticação e email verificado)

## 📦 Tecnologias

| Tecnologia           | Versão  | Uso                                      |
|----------------------|---------|------------------------------------------|
| Node.js              | 22.x.x  | Runtime                                  |
| Express              | 5.x.x   | Framework web                            |
| Mongoose             | 8.x.x   | ODM MongoDB                              |
| MongoDB              | 6.x.x   | Banco de dados                           |
| Redis                | 5.x.x   | Cache e armazenamento de sessões         |
| jsonwebtoken         | 9.0.2   | JWT para autenticação e verificação      |
| bcryptjs             | 3.x.x   | Hash e criptografia de senhas            |
| joi                  | 17.x.x  | Validação de entrada                     |
| express-session      | 1.19.0  | Gerenciamento de sessões                 |
| connect-redis        | 9.x.x   | Store de sessões com Redis               |
| google-auth-library  | 10.x.x  | OAuth2 com Google                        |
| **nodemailer**       | **8.x.x** | **Envio de emails para verificação**    |
| express-rate-limit   | 8.x.x   | Rate limiting                            |
| rate-limit-redis     | 4.x.x   | Store de rate limit com Redis            |
| express-slow-down    | 3.x.x   | Slow down middleware                     |
| helmet               | 8.x.x   | Proteção de headers HTTP                 |
| winston              | 3.x.x   | Logging estruturado                      |
| **jest**             | **30.x.x** | **Testes unitários com suporte ESM**   |

## ⚙️ Configuração e Instalação

### Clone e instalação
```bash
# Clone o repositório
git clone https://github.com/j4ck-dev7/Autenticacao-moderna_Nodejs-Express.git
cd Autenticacao-moderna_Nodejs-Express

# Instale as dependências
npm install
```

### Variáveis de Ambiente (.env)

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Servidor
PORT=5000

# MongoDB
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/auth-db?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://localhost:6379

# Segurança e Autenticação
SESSION_SECRET=sua-chave-secreta-muito-segura-com-32-caracteres-minimo
SECRET=outra-chave-super-secreta-tambem-com-32-caracteres

# Google OAuth2
GOOGLE_CLIENT_ID=seu-client-id-do-google-cloud.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=sua-client-secret-do-google-cloud
GOOGLE_REDIRECT_URL_SIGNIN=http://localhost:5000/api/user/Oauth/signIn
GOOGLE_REDIRECT_URL_SIGNUP=http://localhost:5000/api/user/Oauth/signUp

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app  # Google App Password

EMAIL_VERIFICATION_SECRET=sua-chave-secreta-para-tokens-verificacao
VERIFICATION_EMAIL_EXPIRY=600  # 10 minutos em segundos
```

> ⚠️ **Importante - Email**:
> - Para Gmail: Use [Google App Passwords](https://support.google.com/accounts/answer/185833) em vez da senha de conta
> - Para outros serviços: Use credenciais correspondentes (SendGrid, Mailgun, etc.)
> - Em produção, use um gerenciador de segredos como HashiCorp Vault, AWS Secrets Manager ou Azure Key Vault
## 🔐 Autenticação

### 1️⃣ Autenticação Local (Email e Senha)

#### Registrar novo usuário
```http
POST http://localhost:5000/api/user/signUp
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "SenhaSegura123!@#"
}
```

**Resposta de sucesso (201):**
```json
{
  "message": "Para concluir o registro, verifique seu email"
}
```

**Fluxo após signup:**
1. Email de verificação é enviado para o email fornecido
2. Email contém link com token JWT válido por 10 minutos
3. Usuário clica no link para verificar email
4. Conta é ativada e usuário pode fazer login

#### Verificar email (após clicar no link)
```http
GET http://localhost:5000/api/user/verify-email?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de sucesso (200):**
```json
{
  "message": "Email verificado com sucesso"
}
```

#### Fazer login
```http
POST http://localhost:5000/api/user/signIn
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "SenhaSegura123!@#"
}
```

**Resposta de sucesso (200):**
- Redirecionamento para `/api/user/main`
- Session salva no Redis
- Cookie de sessão configurado (HttpOnly, Secure, SameSite=Strict)

#### Alterar senha (requer autenticação)
```http
POST http://localhost:5000/api/user/change-password
Content-Type: application/json
Cookie: connect.sid=seu-session-id

{
  "password": "SenhaSegura123!@#",
  "newPassword": "NovaSenhaSegura456!@#",
  "confirmNewPassword": "NovaSenhaSegura456!@#"
}
```

### 2️⃣ Autenticação OAuth2 com Google

#### Passo 1: Obter URL de autenticação do Google
```http
GET http://localhost:5000/api/user/Oauth/google/get/url/signUp
```

**Resposta (200):**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

#### Passo 2: Redirecionar para Google
Redirecione o usuário para a URL retornada, onde ele fará login com sua conta Google.

#### Passo 3: Google redireciona de volta para a aplicação
```http
GET http://localhost:5000/api/user/Oauth/signUp?code=...&state=...
```

A aplicação processa o callback, cria a sessão e redireciona para `/api/user/main`.

**Fluxo OAuth2:**
1. Sistema gera `state` aleatório e armazena em sessão (proteção CSRF)
2. Usuário é redirecionado para Google com `state`
3. Google retorna com `code` e `state`
4. Sistema valida se `state` corresponde (proteção CSRF)
5. Sistema troca `code` por tokens
6. Sistema valida ID token
7. Usuário é criado/logado e sessão é iniciada

## 📧 Email e Notificações (Nodemailer)

A aplicação utiliza **Nodemailer** para envio de emails, com suporte a verificação de email e notificações:

### 📤 Recursos de Email

#### Verificação de Email
- Email de verificação é enviado automaticamente após o signup
- Link contém token JWT com expiração de 10 minutos
- Usuário deve clicar no link para ativar a conta
- Após verificação, usuário pode fazer login normalmente

#### Configuração
```javascript
// src/config/nodemailer.js
import * as nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.SMTP_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN
    }
});
```

#### Fluxo de Verificação de Email
1. Usuário se registra com email
2. Token JWT é gerado com ID e email do usuário
3. Email HTML é enviado contendo link de verificação
4. Usuário clica no link e token é verificado
5. Status da conta muda de `pending` para `active`
6. Email é marcado como `isVerified: true`
7. Usuário agora pode fazer login

#### Modelo de Dados (User)
```javascript
{
  email: { type: String, unique: true, minlength: 13, maxlength: 50 },
  isVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'pending', 'blocked'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}
```

#### Email HTML Template
```javascript
await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Verificação de Email',
    html: `<p>Olá ${name},</p>
           <p>Obrigado por se registrar. Por favor, clique no link abaixo para verificar seu email:</p>
           <a href="${verificationLink}">Verificar Email</a>
           <p>Este link expira em 10 minutos.</p>`
});
```

## ⚙️ Proteções de Segurança

A aplicação implementa múltiplas camadas de proteção para garantir a segurança em nível de produção:

### 🔐 Autenticação e Sessões
- **Sessões com Redis**: Sessões são armazenadas em Redis com TTL configurável, escalável para ambientes distribuídos
- **HttpOnly Cookies**: Cookies de sessão não acessíveis via JavaScript (proteção contra XSS)
- **SameSite Strict**: Proteção contra CSRF ao enviar cookies apenas em requisições same-origin
- **Secure Cookie**: Em produção, cookies são enviados apenas via HTTPS
- **Regeneração de Sessão**: ID da sessão é regenerado após login (proteção contra session fixation)

### 🚫 Rate Limiting
- **Proteção contra Brute Force**: Limite de requisições por IP/usuário
- **Proteção contra DoS/DDoS**: Limites específicos por rota
- **Armazenamento em Redis**: Suporta ambientes distribuídos com múltiplas instâncias
- **Rate Limits por Rota**:
  - Autenticação (signUp/signIn): 5 req/min
  - Página principal: 5 req/min
  - OAuth2 URLs: 10 req/min
  - OAuth2 autenticação: 10 req/min

### 🐢 Slow Down Middleware
- **Atraso Exponencial**: `hits^2 * 100ms` até máximo de 25s
- **Previne Brute Force**: Mantém conexão aberta mas torna impraticável atacar rapidamente
- **Começa após limite**: Primeira tentativa sem atraso, depois atraso progressivo

### 🔒 Criptografia
- **Bcryptjs**: Hash de senhas com salt rounds configurado
- **CryptoJS**: Criptografia adicional para dados sensíveis quando necessário
- **Variáveis de ambiente lungadas**: Mínimo de 32 caracteres com letras maiúsculas, minúsculas, números e caracteres especiais

### 🌐 Headers HTTP Seguros (Helmet)
- **Frameguard**: Proteção contra Clickjacking (X-Frame-Options)
- **XSS Filter**: Ativa o filtro XSS do navegador (X-XSS-Protection)
- **NoSniff**: Previne MIME type sniffing (X-Content-Type-Options)
- **HSTS**: Força HTTPS por 1 ano (máxAge: 31536000)
- **Content Security Policy**: Bloqueia recursos externo não autorizado

### 🔄 Proteção CSRF
- **State Parameter**: Validação de state em fluxos OAuth2
- **Session Regeneration**: ID regenerado após login para prevenir session fixation

### ✅ Validação de Entrada
- **Joi Schemas**: Validação rigorosa de todos os inputs
- **Email**: Formato válido, 13-50 caracteres
- **Senha**: Mínimo 8 caracteres, deve incluir:
  - Letra maiúscula
  - Letra minúscula
  - Número
  - Caractere especial (@$!%*?&)
- **Nome**: 3-50 caracteres
- **Sanitização**: Remoção de caracteres inesperados

### 📝 Logging e Monitoramento
- **Winston Logger**: Logging estruturado com níveis (error, warn, info, debug)
- **Logs separados**:
  - `logs/app.log`: Todos os logs
  - `logs/seguranca/`: Logs de segurança (tentativas de acesso, CSRF, rate limit)
  - `logs/tratadas/`: Logs de erros tratados
- **Contexto detalhado**: IP, user ID, duração, método HTTP, status code
- **Rastreabilidade**: Todos os eventos críticos são registrados

### 🔌 CORS Configurado
- **Origem restrita**: Apenas `http://localhost:5000` (configurável em produção)
- **Métodos permitidos**: GET, POST
- **Headers permitidos**: Content-Type, Authorization
- **Credentials**: Permitido para suportar cookies

## 📋 Testes Unitários

Os testes unitários foram implementados com **Jest** seguindo a arquitetura ESM com mocks appropriados. Cobertura completa nas seguintes camadas:

### 📊 Matriz de Cobertura de Testes

| Módulo                    | Service | Controller | Middleware | Arquivo Teste                  |
|---------------------------|---------|------------|------------|--------------------------------|
| **Autenticação Local**     | ✅      | ✅         | ✅         | userService.test.js            |
| **Autenticação OAuth2**    | ✅      | ✅         | ✅         | userController.test.js         |
| **Verificação de Email**   | ✅      | ✅         | ✅         | authMiddleware.test.js         |
| **Alterar Senha**          | ✅      | ✅         | ✅         | loggerMiddleware.test.js       |
| **Rate Limiting**          | -       | -          | ✅         | rateLimitMiddleware.test.js    |
| **Slow Down**              | -       | -          | ✅         | slowDownMiddleware.test.js     |
| **Validações**             | -       | -          | ✅         | validateMiddleware.test.js     |

### 🏗️ Estrutura de Testes

#### Testes de Service (`tests/userService.test.js`)
**Objetivo**: Validar lógica de negócio com 40+ casos de teste

```bash
npm test -- tests/userService.test.js
```

**Cobertura:**
- ✅ **OAuth2** (8 testes): signup, signin, verificação de estado, erros
- ✅ **Registro Local** (3 testes): criação, email duplicado, envio de email
- ✅ **Login Local** (5 testes): credenciais válidas, senha incorreta, email não verificado
- ✅ **Verificação de Email** (6 testes): token válido, inválido, expirado, email já verificado
- ✅ **Reset de Senha** (5 testes): sucesso, senhas coincidentes, complexidade

#### Testes de Controller (`tests/userController.test.js`)
**Objetivo**: Validar HTTP responses e status codes com 30+ testes

```bash
npm test -- tests/userController.test.js
```

**Cobertura:**
- ✅ **URLs OAuth2** (4 testes): geração correta, tratamento de erros
- ✅ **Callbacks OAuth2** (6 testes): state validation, sessão, redirecionamento
- ✅ **Signup/Signin** (8 testes): status codes, resposta, autenticação
- ✅ **Verificação Email** (4 testes): token válido, inválido, email já verificado
- ✅ **Alterar Senha** (5 testes): sucesso, erros de validação
- ✅ **Página Principal** (2 testes): acesso autorizado, erros

#### Testes de Middleware

**Auth Middleware** (`tests/authMiddleware.test.js`) - 6 testes
```bash
npm test -- tests/authMiddleware.test.js
```
- ✅ Valida se usuário está autenticado
- ✅ Retorna 401 se sessão não existir
- ✅ Retorna 401 se o usuário não existir
- ✅ Retorna 401 se o usuário não é verificado
- ✅ Loga eventos de acesso
- ✅ Tratamento de erros internos

**Logger Middleware** (`tests/loggerMiddleware.test.js`) - 8 testes
```bash
npm test -- tests/loggerMiddleware.test.js
```
- ✅ Registra requisições HTTP com duração
- ✅ Loga avisos para status 400+
- ✅ Captura user-agent e IP
- ✅ Mede duração corretamente

**Validação Middleware** (`tests/validateMiddleware.test.js`) - 24 testes
```bash
npm test -- tests/validateMiddleware.test.js
```
- ✅ Email válido e comprimento (13-50 caracteres)
- ✅ Senhas com complexidade (maiúscula, minúscula, número, caractere especial)
- ✅ Nomes com comprimento mínimo (3) e máximo (50)
- ✅ Coincidência de senhas para reset
- ✅ Campos obrigatórios

**Rate Limit Middleware** (`tests/rateLimitMiddleware.test.js`) - 12 testes
```bash
npm test -- tests/rateLimitMiddleware.test.js
```
- ✅ Limite por rota:
  - mainPageLimit: 5 req/min
  - autenticacaoLimit: 5 req/min
  - Oauth2UrlLimit: 10 req/min
  - Oauth2AuthenticationLimit: 10 req/min
- ✅ Store Redis para dados persistidos
- ✅ Handlers customizados com logging
- ✅ Key generator por IP/User ID

**Slow Down Middleware** (`tests/slowDownMiddleware.test.js`) - 14 testes
```bash
npm test -- tests/slowDownMiddleware.test.js
```
- ✅ Atraso exponencial: `hits^2 * 100ms`
- ✅ Máximo de 25 segundos
- ✅ Começa após 3 requisições
- ✅ Documentação detalhada de funcionamento

### 🧪 Executar Testes

```bash
# Todos os testes
npm test

# Arquivo específico
npm test tests/userService.test.js

# Com padrão
npm test -- service.test

# Com saída detalhada
npm test -- --verbose

# Com cobertura (se configurado em jest.config.js)
npm test -- --coverage
```

### 📝 Padrão de Mocks

Os testes utilizam mocks para simular dependências externas:

```javascript
// Mock de repositório (banco de dados)
jest.unstable_mockModule('../src/repositories/userRepository.js', () => ({
    VerifyEmailExists: jest.fn(),
    createUser: jest.fn(),
    findUserByEmail: jest.fn()
}));

// Mock de bcryptjs
jest.unstable_mockModule('bcryptjs', () => ({
    default: {
        hashSync: jest.fn((password) => `$2a$10$hashed_${password}`),
        compare: jest.fn(async (password, hash) => hash === `$2a$10$hashed_${password}`)
    }
}));

// Mock de nodemailer
jest.unstable_mockModule('../src/config/nodemailer.js', () => ({
    transporter: {
        sendMail: jest.fn(async () => ({ messageId: 'mock_message_id' }))
    }
}));

// Mock de JWT
jest.unstable_mockModule('jsonwebtoken', () => ({
    default: {
        sign: jest.fn(() => 'mock_token_jwt'),
        verify: jest.fn((token) => ({ id: 'user_id_123', email: 'test@test.com' }))
    }
}));

// Mock de logger
jest.unstable_mockModule('../src/config/logger.js', () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));
```

### 🔍 Métodos de Teste Importantes (Jest)

| Método                      | Propósito                                    |
|-----------------------------|----------------------------------------------|
| `describe()`                | Agrupa testes relacionados                   |
| `test()` ou `it()`         | Define um caso de teste                      |
| `expect()`                  | Faz assertions                               |
| `jest.fn()`                 | Cria funções mock                            |
| `jest.clearAllMocks()`      | Limpa histórico de mocks                     |
| `toHaveBeenCalled()`       | Verifica se função foi chamada               |
| `toHaveBeenCalledWith()`   | Verifica argumentos da chamada               |
| `rejects.toThrow()`        | Verifica se promise lança erro               |
| `resolves.toEqual()`       | Verifica valor de promise resolvida         |
| `beforeEach()`              | Executa antes de cada teste                  |
| `afterEach()`               | Executa depois de cada teste                 |

### 📚 Documentação nos Testes

Todos os testes contêm comentários explicando:
- **Por que** o teste é necessário
- **Como** funciona o método testado
- **Quando** usar esse padrão
- **Exemplos** de uso

## 📄 Licença
Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

**Contribuições são bem-vindas!** Para questões, sugestões ou relatórios de bugs, abra uma issue no repositório.
