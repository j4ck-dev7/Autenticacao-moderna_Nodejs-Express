import { rateLimit } from 'express-rate-limit';
import { logger } from '../config/logger.js';

// Em rotas principais, o recomendado é de 300 requisições por minuto, desde que não seja feito alguma consulta
// banco de dados.
export const mainPageLimit = rateLimit({
    windowMs: 60 * 1000, // Tempo de janela em milissegundos
    limit: 5, // Limite de requisições por janela (windowMs) pelo ip
    standardHeaders: true, // Retorna as informações do rate limit dentro dos cabeçalhos do RateLimit-*
    legacyHeaders: false, // Desativa os cabeçalhos X-RateLimit-*
    message: 'Muitas requisições, por favor tente novamente mais tarde.',
    handler: (req, res, next, options) => {
        logger.warn(`IP ${req.ip} excedeu o limite de requisições para a rota ${req.originalUrl}`, {
            usuario: req.user ? req.user.id : 'Desconecido',
            ip: req.ip,
            rota: req.originalUrl,
            metodo: req.method
        });
        res.status(options.statusCode).json({ message: options.message });
    }
});

// Em rotas Post para autenticação, o recomendado é de 3-5 requisições a cada 15 minutos, isso previne ataques de 
// força bruta.
export const autenticacaoLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Você excedeu o limite de requisições, por favor tente novamente mais tarde.',
    handler: (req, res, next, options) => {
        logger.warn(`IP ${req.ip} excedeu o limite de requisições para a rota ${req.originalUrl}`, {
            usuario: req.user ? req.user.id : 'Desconecido',
            ip: req.ip,
            rota: req.originalUrl,
            metodo: req.method
        });
        res.status(options.statusCode).json({ message: options.message });
    }
});

// Rate-limit para rotas para obter a url de autenticação Oauth
export const Oauth2UrlLimit = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Você excedeu o limite de requisições, por favor tente novamente mais tarde.',
    handler: (req, res, next, options) => {
        logger.warn(`IP ${req.ip} excedeu o limite de requisições para a rota ${req.originalUrl}`, {
            usuario: req.user ? req.user.id : 'Desconecido',
            ip: req.ip,
            rota: req.originalUrl,
            metodo: req.method
        });
        res.status(options.statusCode).json({ message: options.message });
    }
});

// Rate-limit para rotas de autenticação Oauth, 10 requisições a cada 15 minutos, isso previne ataques de força
// bruta, já que nesta rota envolver consultas | escritas no banco de dados.
export const Oauth2AuthenticationLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Você excedeu o limite de requisições, por favor tente novamente mais tarde.',
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({ message: options.message });
    }
});