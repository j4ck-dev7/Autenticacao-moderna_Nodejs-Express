// Neste arquivo, será utilizado express-slow-down para limitar a taxa de requisições e evitar ataques de negação de serviço
// (DDoS). O middleware irá ajudar a manter estabilidade, seguraça e desempenho do servidor. Ele controla a sobrecarga do servidor
// além de oferecer uma camada adiconal de proteção contra ataques de força bruta, junto com rate limiting, ele adiciona mais outra 
// camada de proteção.
// A aplicação de atraso pode depender de vários fatores, podendo ser aplicado de acordo com
// o rate limiting como uma janela de 1 minuto para o rate limiting e 30 segundo de janela
// para o slow down ou então com janelas semelhantes, mas a escolha vai depender do fluxo de dados
// da rota (Interações com banco de dados, apesar que em leituras, caching é mais eficiente, mas em casos de dados
// dinâmicos, slow down pode ser mais efetivo). Slow down é recomendado em rotas put ou post, onde essas ações são
// mais custosas ao banco, além de causar problemas de concorrência.

import slowDown from "express-slow-down";
import { RedisStore } from 'rate-limit-redis';
import { client } from '../config/redis.js';
import { ipKeyGenerator } from "express-rate-limit";

// Em rotas de autenticação, o recomendado é de 3-5 requisições a cada 15 minutos, isso previne ataques de força bruta.
export const authenticationSlowDown = slowDown({
    windowMs: 60 * 1000,
    delayAfter: 3, // Começa a atrasar após x requisições
    // O delayMs é o atraso aplicado a cada tentativa, seja progressivo ou exponencial.
    delayMs: (hits) => hits ** 2 * 100, // Atraso exponencial.
    maxDelayMs: 25 * 1000,
    store: new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
        prefix: 'slowdown:'
    }), // Onde armazenar os dados do rate limit, neste caso usando Redis, o que é recomendado para aplicações em produção, já que o armazenamento em memória (MemoryStore) não é recomendado para produção, pois não é escalável e pode causar problemas de memória.
    keyGenerator: (req) => {
        if(req.session && req.session.user) return req.session.user
        return ipKeyGenerator(req.ip)
    },
    handler: (req, res, next, options) => {
        logger.warn(`IP ${req.ip} excedeu o limite de requisições livres para a rota ${req.originalUrl}, aplicando atraso`, {
            usuario: req.session && req.session.user ? req.session.user.id : 'Desconecido',
            ip: req.ip,
            rota: req.originalUrl,
            metodo: req.method
        });
    }
});

// Em rotas que há escritas no banco de dados, o ideal é 5 - 10 requisições dentro de 15 minutos
// com atraso progressivo ou exponencial, isso previne ataques de força bruta, além de evitar sobrecarga do servidor.
export const createUserSlowDown = slowDown({
    windowMs: 60 * 1000,
    delayAfter: 3, // Começa a atrasar após x requisições
    // O delayMs é o atraso aplicado a cada tentativa, seja progressivo ou exponencial.
    delayMs: (hits) => hits ** 2 * 100, // Atraso exponencial.
    maxDelayMs: 25 * 1000,
    store: new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
    }), // Onde armazenar os dados do rate limit, neste caso usando Redis, o que é recomendado para aplicações em produção, já que o armazenamento em memória (MemoryStore) não é recomendado para produção, pois não é escalável e pode causar problemas de memória.
    keyGenerator: (req) => {
        if(req.session && req.session.user) return req.session.user
        return ipKeyGenerator(req.ip)
    },
    handler: (req, res, next, options) => {
        logger.warn(`IP ${req.ip} excedeu o limite de requisições livres para a rota ${req.originalUrl}, aplicando atraso`, {
            usuario: req.session && req.session.user ? req.session.user.id : 'Desconecido',
            ip: req.ip,
            rota: req.originalUrl,
            metodo: req.method
        });
    }
});

// Em páginas principais, normalmente há muitas consultas ao banco, mas os dados retornados vem apartir
// de uma consulta pelos mais vistos, mais recentes ou melhores avaliados, então o caching é uma alternativa 
// mais eficiente, portanto o slow down pode ser aplicado em uma janela mais longa.
export const mainPageSlowDown = slowDown({
    windowMs: 60 * 1000,
    delayAfter: 3, // Começa a atrasar após x requisições
    // O delayMs é o atraso aplicado a cada tentativa, seja progressivo ou exponencial.
    delayMs: (hits) => hits ** 2 * 100,
    maxDelayMs: 25 * 1000,
    store: new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
        prefix: 'slowdown:'
    }), // Onde armazenar os dados do rate limit, neste caso usando Redis, o que é recomendado para aplicações em produção, já que o armazenamento em memória (MemoryStore) não é recomendado para produção, pois não é escalável e pode causar problemas de memória.
    keyGenerator: (req) => {
        if(req.session && req.session.user) return req.session.user;
        return ipKeyGenerator(req.ip);
    },
    handler: (req, res, next, options) => {
        logger.warn(`IP ${req.ip} excedeu o limite de requisições livres para a rota ${req.originalUrl}, aplicando atraso`, {
            usuario: req.session && req.session.user ? req.session.user.id : 'Desconecido',
            ip: req.ip,
            rota: req.originalUrl,
            metodo: req.method
        });
    }
});

export const Oauth2UrlSlowDown = slowDown({
    windowMs: 60 * 1000,
    delayAfter: 5, // Começa a atrasar após x requisições
    // O delayMs é o atraso aplicado a cada tentativa, seja progressivo ou exponencial.
    delayMs: (hits) => hits ** 2 * 100, // Atraso exponencial.
    maxDelayMs: 25 * 1000,
    store: new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
    }), // Onde armazenar os dados do rate limit, neste caso usando Redis, o que é recomendado para aplicações em produção, já que o armazenamento em memória (MemoryStore) não é recomendado para produção, pois não é escalável e pode causar problemas de memória.
    keyGenerator: (req) => {
        if(req.session && req.session.user) return req.session.user
        return ipKeyGenerator(req.ip)
    },
    handler: (req, res, next, options) => {
        logger.warn(`IP ${req.ip} excedeu o limite de requisições livres para a rota ${req.originalUrl}, aplicando atraso`, {
            usuario: req.session && req.session.user ? req.session.user.id : 'Desconecido',
            ip: req.ip,
            rota: req.originalUrl,
            metodo: req.method
        });
    }
});

export const Oauth2SlowDown = slowDown({
    windowMs: 60 * 1000,
    delayAfter: 5, // Começa a atrasar após x requisições
    // O delayMs é o atraso aplicado a cada tentativa, seja progressivo ou exponencial.
    delayMs: (hits) => hits ** 2 * 100, // Atraso exponencial.
    maxDelayMs: 25 * 1000,
    store: new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
    }), // Onde armazenar os dados do rate limit, neste caso usando Redis, o que é recomendado para aplicações em produção, já que o armazenamento em memória (MemoryStore) não é recomendado para produção, pois não é escalável e pode causar problemas de memória.
    keyGenerator: (req) => {
        if(req.session && req.session.user) return req.session.user
        return ipKeyGenerator(req.ip)
    },
    handler: (req, res, next, options) => {
        logger.warn(`IP ${req.ip} excedeu o limite de requisições livres para a rota ${req.originalUrl}, aplicando atraso`, {
            usuario: req.session && req.session.user ? req.session.user.id : 'Desconecido',
            ip: req.ip,
            rota: req.originalUrl,
            metodo: req.method
        });
    }
});

export const verifyEmailSlowDown = slowDown({
    windowMs: 60 * 1000,
    delayAfter: 1, // Começa a atrasar após x requisições
    // O delayMs é o atraso aplicado a cada tentativa, seja progressivo ou exponencial.
    delayMs: (hits) => hits ** 4 * 100, // Atraso exponencial.
    maxDelayMs: 25 * 1000,
    store: new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
    }), // Onde armazenar os dados do rate limit, neste caso usando Redis, o que é recomendado para aplicações em produção, já que o armazenamento em memória (MemoryStore) não é recomendado para produção, pois não é escalável e pode causar problemas de memória.
    keyGenerator: (req) => {
        if(req.session && req.session.user) return req.session.user
        return ipKeyGenerator(req.ip)
    },
    handler: (req, res, next, options) => {
        logger.warn(`IP ${req.ip} excedeu o limite de requisições livres para a rota ${req.originalUrl}, aplicando atraso`, {
            usuario: req.session && req.session.user ? req.session.user.id : 'Desconecido',
            ip: req.ip,
            rota: req.originalUrl,
            metodo: req.method
        });
    }
});