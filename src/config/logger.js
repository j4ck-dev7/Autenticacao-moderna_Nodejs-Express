import winston from 'winston';

const nivel = {
    level: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
        silly: 5
    },

    colors: {
        error: 'red',
        warn: 'red',
        info: 'yellow',
        http: 'green',
        debug: 'blue',
        silly: 'gray'
    }
};

winston.addColors(nivel.colors);

export const logger = winston.createLogger({
    levels: nivel.level,
    format: winston.format.json(), // Será necessário trocar o formato para algo mais legível, como winston.format.simple() ou winston.format.printf()
    transports: [
        // Todos os logs do projeto
        new winston.transports.File({
            filename: 'logs/app.log',
            format: winston.format.json(), // Será necessário trocar o formato para algo mais legível, como winston.format.simple() ou winston.format.printf()
            maxsize: 1000000,
            maxFiles: 5,
        }),

        // Logs de erro
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.json(), // Será necessário trocar o formato para algo mais legível, como winston.format.simple() ou winston.format.printf()
            maxsize: 1000000,
            maxFiles: 5,
        }),

        // Logs de segurança (Tentativas de acesso, autenticação, etc.)
        new winston.transports.File({
            filename: 'logs/security.log',
            format: winston.format.json(), // Será necessário trocar o formato para algo mais legível, como winston.format.simple() ou winston.format.printf()
            maxsize: 1000000,
            maxFiles: 5,
        })
    ],
    exceptionHandlers: [ // Exceções não tratadas, como erros de programação ou falhas inesperadas
        new winston.transports.File({
            filename: 'logs/seguranca/exceptions.log',
            format: winston.format.json(), // Será necessário trocar o formato para algo mais legível, como winston.format.simple() ou winston.format.printf()
            maxsize: 1000000,
            maxFiles: 5,
        })
    ],
    rejectionHandlers: [ // Rejeições de promessas não tratadas, como falhas em operações assíncronas
        new winston.transports.File({
            filename: 'logs/tratadas/rejections.log',
            format: winston.format.json(), // Será necessário trocar o formato para algo mais legível, como winston.format.simple() ou winston.format.printf()
            maxsize: 1000000,
            maxFiles: 5,
        })
    ]
});