# Autenticação Moderna

[![Node.js](https://img.shields.io/badge/Node.js-v22.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1-blue)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-brightgreen)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-5.x-red)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Um projeto robusto de autenticação moderna com suporte a login local (email/senha) e OAuth2 (Google), incluindo segurança em nível de produção com rate limiting, proteção CSRF, criptografia de senhas, validações rigorosas e logging detalhado.

Desenvolvido com **Node.js + Express + MongoDB + Mongoose + Redis** e testado com **Jest** e **Insomnia**.

## 🚀 Endpoints Principais

### Autenticação Local
- `POST   /api/user/signUp` → Registro com email e senha  
- `POST   /api/user/signIn` → Login com email e senha
- `POST   /api/user/change-password` → Alterar senha (requer autenticação)

### Autenticação OAuth2 (Google)
- `GET    /api/user/Oauth/google/get/url/signUp` → Obter URL para registro com Google
- `GET    /api/user/Oauth/google/get/url/signIn` → Obter URL para login com Google
- `GET    /api/user/Oauth/signUp` → Callback para registro com Google
- `GET    /api/user/Oauth/signIn` → Callback para login com Google

### Rotas Protegidas
- `GET    /api/user/main` → Página principal (requer autenticação)

## 📦 Tecnologias

| Tecnologia           | Versão  | Uso                                      |
|----------------------|---------|------------------------------------------|
| Node.js              | 22.x.x  | Runtime                                  |
| Express              | 5.x.x   | Framework web                            |
| Mongoose             | 8.x.x   | ODM MongoDB                              |
| MongoDB              | 6.x.x   | Banco de dados                           |
| Redis                | 5.x.x   | Cache e armazenamento de sessões         |
| jsonwebtoken         | 9.0.2   | JWT para autenticação                    |
| bcryptjs             | 3.x.x   | Hash e criptografia de senhas            |
| joi                  | 17.x.x  | Validação de entrada                     |
| express-session      | 1.19.0  | Gerenciamento de sessões                 |
| connect-redis        | 9.x.x   | Store de sessões com Redis               |
| google-auth-library  | 10.x.x  | OAuth2 com Google                        |
| express-rate-limit   | 8.x.x   | Rate limiting                            |
| rate-limit-redis     | 4.x.x   | Store de rate limit com Redis            |
| express-slow-down    | 3.x.x   | Slow down middleware                     |
| helmet               | 8.x.x   | Proteção de headers HTTP                 |
| winston              | 3.x.x   | Logging estruturado                      |
| jest                 | 30.x.x  | Testes unitários                         |

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
```

> ⚠️ **Importante**: Em produção, use um gerenciador de segredos como HashiCorp Vault, AWS Secrets Manager ou Azure Key Vault. Nunca armazene variáveis sensíveis em arquivos `.env` em produção.
## 🔐 Autenticação

### 1️⃣ Autenticação Local (Email e Senha)

#### Registrar novo usuário
```http
POST http://localhost:5000/api/user/signUp
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "SenhaSegura123!"
}
```

**Resposta de sucesso (201):**
```json
{
  "message": "Usuário criado com sucesso",
  "user": {
    "_id": "...",
    "name": "João Silva",
    "email": "joao@example.com",
    "autenticationType": "local"
  }
}
```

#### Fazer login
```http
POST http://localhost:5000/api/user/signIn
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "SenhaSegura123!"
}
```

**Resposta de sucesso (200):**
```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "_id": "...",
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

#### Alterar senha (requer autenticação)
```http
POST http://localhost:5000/api/user/change-password
Content-Type: application/json
Cookie: connect.sid=seu-session-id

{
  "currentPassword": "SenhaSegura123!",
  "newPassword": "NovaSenhaSegura456!"
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

## �️ Proteções de Segurança

A aplicação implementa múltiplas camadas de proteção para garantir a segurança em nível de produção:

### 🔐 Autenticação e Sessões
- **Sessões com Redis**: Sessões são armazenadas em Redis com TTL de 5 minutos, escalável para ambientes distribuídos
- **HttpOnly Cookies**: Cookies de sessão não acessíveis via JavaScript (proteção contra XSS)
- **SameSite Strict**: Proteção contra CSRF ao enviar cookies apenas em requisições same-origin
- **Secure Cookie**: Em produção, cookies são enviados apenas via HTTPS

### 🚫 Rate Limiting
- **Proteção contra Brute Force**: Limite de 5 requisições por minuto em rotas de autenticação
- **Proteção contra DoS/DDoS**: Limites específicos por rota e IP/usuário
- **Armazenamento em Redis**: Suporta ambientes distribuídos com múltiplas instâncias
- **Rate Limits por Rota**:
  - Autenticação (signUp/signIn): 5 req/min
  - Página principal: 5 req/min
  - OAuth2 URLs: 5 req/min
  - OAuth2 autenticação: 5 req/min

### 🐢 Slow Down Middleware
- Progressivamente desacelera requisições que excedem limites
- Previne abuso de API sem rejeitar requisições legitimamente aceleradas

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
- **Regeneração de Sessão**: Session ID regenerado após login/signup para prevenir session fixation
- **CSURF Protection**: Middleware de proteção CSRF implementado

### ✅ Validação de Entrada
- **Joi Schemas**: Validação rigorosa de todos os inputs
- **Email validation**: Validação de formato de email
- **Senha**: Mínimo de 8 caracteres
- **Nome**: Entre 3 e 50 caracteres
- **Sanitização**: Remoção de caracteres não esperados

### 📝 Logging e Monitoramento
- **Winston Logger**: Logging estruturado com níveis (error, warn, info, debug)
- **Logs separados**:
  - `logs/app.log`: Todos os logs
  - `logs/seguranca/`: Logs de segurança (tentativas de acesso, CSRF, etc.)
- **Contexto detalhado**: IP do usuário, ID do usuário, duração da operação, método HTTP
- **Rastreabilidade**: Todos os eventos de autenticação são registrados

### 🔌 CORS Configurado
- **Origem restrita**: Apenas `http://localhost:5000` (configurável em produção)
- **Métodos permitidos**: GET, POST
- **Headers permitidos**: Content-Type, Authorization
- **Credentials**: Permitido para suportar cookies

## 📋 Testes Unitários
Os testes unitários foram aplicados nas seguintes camadas e módulos:
| Módulo                 | Service | Controller | Tipos de Teste                 |
|------------------------|---------|------------|--------------------------------|  
| **Usuário (Login)**    | ✅      | ✅         | Sucesso, Erro, Autenticação    |
| **Usuário (Register)** | ✅      | ✅         | Sucesso, Erro, Validação       |

## 🏗️ Estrutura de Testes

### Camada de Service
A camada de Service contém a lógica de negócio da aplicação. Os testes irão validar:

- **Casos de Sucesso**: Operações executadas corretamente
- **Casos de Erro**: Tratamento de exceções e erros esperados
- **Validações**: Regras de negócio e constraints

### Camada de Controller
A camada de Controller gerencia as requisições HTTP. Os testes irão validar:

- **Respostas Bem-Sucedidas**: Status 200, 201, etc.
- **Erros HTTP**: Status 400, 401, 403, 404, 500, etc.
- **Autenticação e Autorização**: Validação de tokens e permissões
- **Validação de Entrada**: Dados malformados ou inválidos

## 📄 Licença
Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🔮 Funcionalidades Futuras

### 📧 Verificação de Conta por Email/Gmail

**Status**: ⏳ Planejado

Esta funcionalidade implementará um sistema robusto de verificação de email para validar a propriedade de contas de usuários durante o registro. Incluirá:

#### Componentes da Implementação
- **Geração de tokens de verificação**: Tokens aleatórios e seguros com expiração
- **Envio de emails**: Integração com Gmail API ou serviço de email (SendGrid, Nodemailer, etc.)
- **Armazenamento de token**: Campo no modelo User para armazenar token de verificação
- **Validação de email**: Confirmação de propriedade do email antes de ativar a conta
- **Reenvio de email**: Permitir reenviar link de verificação
- **Expiração de token**: Tokens expiram após X horas (ex: 24 horas)
- **Logging**: Rastreamento completo de tentativas de verificação

#### Fluxo Esperado
1. Usuário realiza signup com email
2. Sistema gera token de verificação
3. Email é enviado com link contendo o token
4. Usuário clica no link e email é marcado como verificado
5. Usuário agora pode fazer login normalmente

#### Endpoints Previstos
```http
POST /api/user/verify-email/:token
POST /api/user/resend-verification-email
PUT /api/user/profile/email  # Para alterar email
```

#### Modelo de Dados
```javascript
{
  email: { verified: Boolean, verificationToken: String, verificationExpires: Date },
  status: { type: String, enum: ['pending', 'active', 'blocked'] }
}
```

#### Proteções Adicionais
- Limite de 3 reenvios de email por hora
- Expiração progressiva de tokens
- Log de tentativas de verificação suspeitas
- Notificação por email se o email não for verificado por X dias

**Próximos passos**: Definir provedor de email, esquema de tokens, e implementar fluxo completo com testes.
