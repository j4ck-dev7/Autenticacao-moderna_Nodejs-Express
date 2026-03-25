# Autenticação Moderna

[![Node.js](https://img.shields.io/badge/Node.js-v22.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1-blue)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-brightgreen)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Um projeto simples de login e register, com autenticação com JWT + cookie, criptografia, uso correto de métodos http, testes unitários e validações. 
Desenvolvida com **Node.js + Express + Mongoose + MongoDB** e testada com **Insomnia** e **jest**.

- `POST   /app/signUp` → Registro  
- `POST   /app/signIn` → Login
- `GET   /api/user/Oauth/google/get/url/signUp` → Registro - Rota para obter o link para o redirecionamento para a página de login com o google
- `GET   /api/user/Oauth/google/get/url/signIn` → Login - Rota para obter o link para o redirecionamento para a página de login com o google

## 📦 Tecnologias

| Tecnologia         | Versão  | Uso                          |
|--------------------|---------|------------------------------|
| Node.js            | 20.x.x  | Runtime                      |
| Express            | 5.x.x   | Framework web                |
| Mongoose           | 8.x.x   | ODM MongoDB                  |
| MongoDB            | 6.x.x   | Banco de dados               |
| jsonwebtoken       | 9.0.2   | JWT                          |
| jest               | 30.x.x  | Testes unitários             |
| bcryptjs           | 3.x.x   | Hash de senhas               |
| joi                | 7.x.x   | Validação de entrada         |
| cookie-parser      | 1.x.x   | Leitura de cookies           |
| google-auth-library| 1.x.x   | Oauth2                       |
| express-rate-limit | 8.x.x   | Rate limiter                 |

## ⚙️ Instalação

```bash
# Clone o repositório
git clone https://github.com/j4ck-dev7/Autenticacao-moderna_Nodejs-Express

# Instale as dependências
npm install
```

## Variáveis de ambiente (.env)
```env
PORT=5000
MONGO_URL=mongodb+srv://username:password@cluster1.mongodb.net/blogapi?retryWrites=true&w=majority&appName=Cluster1
SECRET=SuaChaveSuperSecretaAqui!
GOOGLE_CLIENT_ID = Google Cloud
GOOGLE_CLIENT_SECRET = Google Cloud
GOOGLE_REDIRECT_URL_SIGNIN = Google Cloud
GOOGLE_REDIRECT_URL_SIGNUP = Google Cloud
```
## 🔐 Autenticação
### Autenticação com email e senha
1. Criar usuário
   ```http
   POST http://localhost:5000/app/signUp
   Content-Type: application/json
   
   {
     "name": "User",
     "email": "user@gmail.com",
     "password": "user123",
   }
   ```

2. Logar
   ```http
   POST http://localhost:5000/app/signIn
   Content-Type: application/json
   
   {
     "email": "user@gmail.com",
     "password": "user123",
   }
   ```
### Autenticação com Oauth2
1. Criar usuário com Oauth2
   Obter o link para autenticar com o google
   ```http
   POST http://localhost:5000/api/user/Oauth/google/get/url/signUp
   Content-Type: application/json
   
   {
     "url": "url para redirecionar á página de login com o google"
   }
   ```

2. Logar usuário com Oauth2
   Obter o link para autenticar com o google
   ```http
   POST http://localhost:5000/api/user/Oauth/google/get/url/signIn
   Content-Type: application/json
   
   {
     "url": "url para redirecionar á página de login com o google"
   }
   ```

## 🔐 Proteções
1. Rate-limit com express-rate-limit para proteção à ataques de força bruta, Dos/DDoS, Scraping e Abuso de API
2. Proteção na rota principal, pode ser acessado apenas quando autenticado

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
