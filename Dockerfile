FROM node:20-alpine

WORKDIR /usr/src/app

# Instala apenas dependências de produção por padrão
COPY package.json package-lock.json* ./
RUN npm install --production

# Copia o código da aplicação
COPY . .

# Porta default (pode ser sobrescrita por variáveis de ambiente)
ENV PORT=5000
EXPOSE 5000

# Comando padrão
CMD ["node", "server.js"]
