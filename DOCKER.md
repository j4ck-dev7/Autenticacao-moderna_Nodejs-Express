DOCKER — Guia rápido (básico → avançado)
=====================================

Este documento explica como usar Docker com este projeto, desde comandos básicos até tópicos avançados para estudo.

1) Pré-requisitos
- Docker Engine (Linux/Windows/Mac) instalado
- Docker Compose (ou plugin `docker compose`) — muitas distribuições já incluem como plugin

Checagem rápida (Linux):

```bash
docker --version
docker-compose --version   # ou: docker compose version
```

Se Docker não estiver instalado, siga as instruções oficiais: https://docs.docker.com/get-docker/

2) Estrutura adicionada ao projeto
- `Dockerfile` — imagem da aplicação Node.js
- `docker-compose.yml` — orquestra `app`, `mongo` e `redis` para desenvolvimento
- `.dockerignore` — arquivos ignorados no contexto de build

3) Primeiro contato — rodar a aplicação localmente

- Crie um arquivo `.env` na raiz com as variáveis necessárias (veja `README.md`).
- Build + start (modo desenvolvimento):

```bash
docker-compose up --build
# ou (detached):
docker-compose up --build -d
```

- Parar e remover containers:

```bash
docker-compose down
# remover volumes persistentes do mongo (cuidado com dados):
docker-compose down -v
```

4) Observações específicas deste projeto
- `docker-compose.yml` configura `MONGO_URL=mongodb://mongo:27017/authdb` e `REDIS_URL=redis://redis:6379`.
- Em desenvolvimento o serviço `app` está montado com `./:/usr/src/app` para permitir edição ao vivo.
- Em produção remova `volumes` do serviço `app` e use imagens imutáveis.

5) Boas práticas para `Dockerfile`
- Use imagens oficiais pequenas (ex: `node:18-alpine`) para reduzir tamanho.
- Use `COPY package*.json ./` + `npm install` antes de copiar o código para aproveitar cache de camadas.
- Para produção, prefira builds multistage (builder) para reduzir artefatos finais.

Exemplo (multistage simplificado):

```Dockerfile
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY . .

FROM node:18-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app .
CMD ["node", "server.js"]
```

6) Fluxos úteis (desenvolvimento vs produção)
- Desenvolvimento: monte código com volumes e use `nodemon` (ou `npm run dev`) dentro do container.
- Produção: não monte volumes, defina variáveis via orquestrador/secret manager, habilite `NODE_ENV=production`.

7) Comandos úteis — cheat sheet
- Build manual da imagem da app:

```bash
docker build -t minha-app:dev .
# Rodar apenas a app ligada ao mongo/redis existentes:
docker run --env-file .env -p 5000:5000 --name minha-app --link mongo:mongo --link redis:redis minha-app:dev
```

- Logs:

```bash
docker-compose logs -f app
```

8) Deploy / produção
- Não use docker-compose para ambientes de produção com alta disponibilidade;
  prefira orquestradores: Kubernetes (mais comum) ou Docker Swarm.
- Use imagens versionadas, pipelines CI/CD, scanners de segurança (ex: Trivy), e assinaturas de imagem.

9) Segurança e segredos
- Nunca commit `.env` no repositório.
- Para produção use gerenciadores de segredos: AWS Secrets Manager, Vault, ou `docker secrets`/Kubernetes Secrets.
- Defina `USER` não-root no contêiner quando possível.

10) Otimização e melhores práticas
- Minimize o número de camadas no `Dockerfile`.
- Remova dependências de desenvolvimento em builds de produção.
- Use `--no-cache` apenas quando precisar invalidar o cache intencionalmente.

11) Tópicos avançados para estudar
- Dockerfile: camadas, cache, multistage builds
- Imagem minimalista: Alpine vs distroless
- Networking: bridge, host, overlay, DNS interno do compose
- Volumes e persistência de dados
- Saúde do container: `HEALTHCHECK`
- Logs e telemetry (ELK/EFK, Grafana, Prometheus)
- Orquestração: Kubernetes (pods, deployments, services), Helm
- Segurança: rootless Docker, user namespaces, capabilities, scanning (Trivy), image signing
- Runtime alternatives: Podman, containerd, CRI-O
- CI/CD: GitHub Actions / GitLab CI pipelines para build/push
- Registry: Docker Hub, GitHub Container Registry, AWS ECR

12) Troubleshooting veloz
- Erro de permissão no socket Docker: adicione seu usuário ao grupo `docker` (Linux) ou use `sudo`.
- Problemas com portas já em uso: verifique `docker ps` e `docker-compose ps`.

13) Links úteis
- Docker docs: https://docs.docker.com/
- Dockerfile best practices: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/
- Docker Compose: https://docs.docker.com/compose/

---
