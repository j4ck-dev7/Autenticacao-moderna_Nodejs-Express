FROM node:20-alpine

WORKDIR /app

# Instala apenas dependências de produção por padrão
COPY package.json package-lock.json* ./
RUN npm install

# Copia o código da aplicação
COPY . .

RUN mkdir -p logs/

# Porta default (pode ser sobrescrita por variáveis de ambiente)
EXPOSE 5000

# Comando padrão
CMD ["npm", "start"]
