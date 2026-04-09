import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { logger } from '../config/logger.js';
import { RedisStore } from 'rate-limit-redis';
import { client } from '../config/redis.js';

// Em rotas principais, o recomendado é de 300 requisições por minuto, desde que não seja feito alguma consulta
// banco de dados.
export const mainPageLimit = rateLimit({
    windowMs: 60 * 1000, // Tempo de janela em milissegundos
    limit: 5, // Limite de requisições por janela (windowMs) pelo ip
    standardHeaders: true, // Retorna as informações do rate limit dentro dos cabeçalhos do RateLimit-*
    legacyHeaders: false, // Desativa os cabeçalhos X-RateLimit-*
    store: new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
    }), // Onde armazenar os dados do rate limit, neste caso usando Redis, o que é recomendado para aplicações em produção, já que o armazenamento em memória (MemoryStore) não é recomendado para produção, pois não é escalável e pode causar problemas de memória.
    keyGenerator: (req) => {
        if(req.session && req.session.user) return req.session.user
        return ipKeyGenerator(req.ip)
    },
    message: 'Muitas requisições, por favor tente novamente mais tarde.',
    handler: (req, res, next, options) => {
        logger.warn(`IP ${req.ip} excedeu o limite de requisições para a rota ${req.originalUrl}`, {
            usuario: req.session ? req.session.user : 'Desconecido',
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
    store: new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
    }), // Onde armazenar os dados do rate limit, neste caso usando Redis, o que é recomendado para aplicações em produção, já que o armazenamento em memória (MemoryStore) não é recomendado para produção, pois não é escalável e pode causar problemas de memória.
    keyGenerator: (req) => {
        if(req.session && req.session.user) return req.session.user
        return ipKeyGenerator(req.ip)
    },
    message: 'Você excedeu o limite de requisições, por favor tente novamente mais tarde.',
    handler: (req, res, next, options) => {
        logger.warn(`IP ${req.ip} excedeu o limite de requisições para a rota ${req.originalUrl}`, {
            usuario: req.session && req.session.user ? req.session.user.id : 'Desconecido',
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
    store: new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
    }), // Onde armazenar os dados do rate limit, neste caso usando Redis, o que é recomendado para aplicações em produção, já que o armazenamento em memória (MemoryStore) não é recomendado para produção, pois não é escalável e pode causar problemas de memória.
    keyGenerator: (req) => {
        if(req.session && req.session.user) return req.session.user
        return ipKeyGenerator(req.ip)
    },
    message: 'Você excedeu o limite de requisições, por favor tente novamente mais tarde.',
    handler: (req, res, next, options) => {
        logger.warn(`IP ${req.ip} excedeu o limite de requisições para a rota ${req.originalUrl}`, {
            usuario: req.session && req.session.user ? req.session.user.id : 'Desconecido',
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
    store: new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
    }), // Onde armazenar os dados do rate limit, neste caso usando Redis, o que é recomendado para aplicações em produção, já que o armazenamento em memória (MemoryStore) não é recomendado para produção, pois não é escalável e pode causar problemas de memória.
    keyGenerator: (req) => {
        if(req.session && req.session.user) return req.session.user
        return ipKeyGenerator(req.ip)
    },
    message: 'Você excedeu o limite de requisições, por favor tente novamente mais tarde.',
    handler: (req, res, next, options) => {
        logger.warn(`IP ${req.ip} excedeu o limite de requisições para a rota ${req.originalUrl}`, {
            usuario: req.session ? req.session.user : 'Desconecido',
            ip: req.ip,
            rota: req.originalUrl,
            metodo: req.method
        });
        res.status(options.statusCode).json({ message: options.message });
    }
});