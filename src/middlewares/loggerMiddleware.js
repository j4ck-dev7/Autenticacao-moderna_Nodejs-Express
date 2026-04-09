import { logger } from "../config/logger.js";

export const loggerMiddleware = (req, res, next) => {
    const inicio = Date.now();

    const originalSend = res.send 
    res.send = function(data) {
        const duracao = Date.now() - inicio;

        logger.info('Requisição HTTP', {
            metodo: req.method,
            rota: req.path,
            statusCode: res.statusCode,
            duracao: `${duracao}ms`,
            usuarioId: req.session && req.session.user ? req.session.user : 'Desconhecido',
            ip: req.ip,
            userAgent: req.get('user-agent')
        });

        if(res.statusCode >= 400) {
            logger.warn('Erro na requisição', {
                metodo: req.method,
                rota: req.path,
                statusCode: res.statusCode,
                corpo: data,
                usuarioId: req.session && req.session.user ? req.session.user : 'Desconhecido'
            });
        }

        return originalSend.call(this, data);
    };

    next();
}