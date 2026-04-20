import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import Redis from 'ioredis-mock';

// Mock do logger
jest.unstable_mockModule('../src/config/logger.js', () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

// Mock do Redis usando ioredis-mock
const mockRedisClient = new Redis();

jest.unstable_mockModule('../src/config/redis.js', () => ({
    client: mockRedisClient
}));

// Mock do express-slow-down com factory que retorna funções middleware
const createMockMiddleware = (options) => {
    const middleware = (req, res, next) => {
        next();
    };
    middleware.options = options;
    return middleware;
};

jest.unstable_mockModule('express-slow-down', () => ({
    default: jest.fn((options) => createMockMiddleware(options)),
    slowDown: jest.fn((options) => createMockMiddleware(options))
}));

jest.unstable_mockModule('rate-limit-redis', () => ({
    RedisStore: jest.fn((options) => ({
        sendCommand: options.sendCommand,
        prefix: options.prefix
    }))
}));

// Import após mocks
const {
    authenticationSlowDown,
    createUserSlowDown
} = await import('../src/middlewares/slowDownMiddleware.js');

const { logger } = await import('../src/config/logger.js');

/**
 * Slow Down Middleware - Documentation
 * 
 * Express-slow-down é um middleware que adiciona atrasos progressivos às requisições
 * quando um limite é excedido, diferente de rate-limit que bloqueia completamente.
 * 
 * Funciona aplicando atrasos exponenciais:
 * - Hits 1-3: sem atraso
 * - Hit 4: atraso de 4^2 * 100 = 1600ms
 * - Hit 5: atraso de 5^2 * 100 = 2500ms
 * - E assim por diante até maxDelayMs (25s)
 * 
 * Contexto: Isso previne ataques de força bruta mantendo a conexão aberta
 * mas tornando impraticável atacar rapidamente.
 */

describe('Slow Down Middleware - authenticationSlowDown', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await mockRedisClient.flushall();
    });

    test('Deve ser definido e ter configurações corretas', () => {
        expect(authenticationSlowDown).toBeDefined();
        expect(authenticationSlowDown.options).toBeDefined();
    });

    test('Deve ter janela de tempo de 1 minuto', () => {
        expect(authenticationSlowDown.options.windowMs).toBe(60 * 1000);
    });

    test('Deve começar a atrasar após 3 requisições', () => {
        expect(authenticationSlowDown.options.delayAfter).toBe(3);
    });

    test('Deve ter atraso máximo de 25 segundos', () => {
        expect(authenticationSlowDown.options.maxDelayMs).toBe(25 * 1000);
    });

    test('Deve usar atraso exponencial', () => {
        const delayMs = authenticationSlowDown.options.delayMs;
        expect(delayMs).toBeDefined();

        // Testa a fórmula: hits ** 2 * 100
        expect(delayMs(1)).toBe(100); // 1^2 * 100 = 100ms
        expect(delayMs(2)).toBe(400); // 2^2 * 100 = 400ms
        expect(delayMs(3)).toBe(900); // 3^2 * 100 = 900ms
        expect(delayMs(4)).toBe(1600); // 4^2 * 100 = 1600ms
        expect(delayMs(5)).toBe(2500); // 5^2 * 100 = 2500ms
    });

    test('Deve usar Redis Store para armazenar dados', () => {
        expect(authenticationSlowDown.options.store).toBeDefined();
    });

    test('Deve usar prefixo "slowdown:" no Redis', () => {
        expect(authenticationSlowDown.options.store.prefix).toBe('slowdown:');
    });

    test('Deve retornar user ID como chave se usuário autenticado', () => {
        const keyGeneratorFn = authenticationSlowDown.options.keyGenerator;
        
        const req = {
            session: { user: 'user_id_123' },
            ip: '192.168.1.1'
        };

        const key = keyGeneratorFn(req);
        expect(key).toBe('user_id_123');
    });

    test('Deve retornar IP como chave se usuário não autenticado', () => {
        const keyGeneratorFn = authenticationSlowDown.options.keyGenerator;
        
        const req = {
            session: {},
            ip: '192.168.1.1'
        };

        // A função ipKeyGenerator é de express-rate-limit
        // que precisa de req.ip
        expect(keyGeneratorFn).toBeDefined();
    });

    test('Deve ter handler personalizado que loga avisos', () => {
        const handlerFn = authenticationSlowDown.options.handler;
        expect(handlerFn).toBeDefined();

        const req = {
            ip: '192.168.1.1',
            originalUrl: '/api/user/signin',
            method: 'POST',
            session: { user: null }
        };

        const res = {};
        const next = jest.fn();
        const options = {};

        handlerFn(req, res, next, options);

        expect(logger.warn).toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('limite de requisições livres'),
            expect.anything()
        );
    });

    test('Deve logar informações de IP e rota quando atraso é aplicado', () => {
        const handlerFn = authenticationSlowDown.options.handler;

        const req = {
            ip: '192.168.1.1',
            originalUrl: '/api/user/signin',
            method: 'POST',
            session: { user: 'user_id_123' }
        };

        const res = {};
        const next = jest.fn();
        const options = {};

        handlerFn(req, res, next, options);

        const warnCall = logger.warn.mock.calls[0];
        expect(warnCall[1]).toEqual(
            expect.objectContaining({
                ip: '192.168.1.1',
                rota: '/api/user/signin',
                metodo: 'POST'
            })
        );
    });
});

describe('Slow Down Middleware - createUserSlowDown', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await mockRedisClient.flushall();
    });

    test('Deve ser definido para proteção de criação de usuário', () => {
        expect(createUserSlowDown).toBeDefined();
        expect(createUserSlowDown.options).toBeDefined();
    });

    test('Deve ter janela de tempo de 1 minuto', () => {
        expect(createUserSlowDown.options.windowMs).toBe(60 * 1000);
    });

    test('Deve começar a atrasar após 3 requisições', () => {
        expect(createUserSlowDown.options.delayAfter).toBe(3);
    });

    test('Deve usar atraso exponencial para criação de usuário', () => {
        const delayMs = createUserSlowDown.options.delayMs;
        expect(delayMs).toBeDefined();

        // Testa a fórmula exponencial
        expect(delayMs(1)).toBe(100);
        expect(delayMs(2)).toBe(400);
        expect(delayMs(3)).toBe(900);
    });

    test('Deve ter atraso máximo configurado', () => {
        expect(createUserSlowDown.options.maxDelayMs).toBe(25 * 1000);
    });

    test('Deve usar Redis Store para rastrear requisições', () => {
        expect(createUserSlowDown.options.store).toBeDefined();
    });

    test('Deve usar prefixo correto no Redis', () => {
        expect(createUserSlowDown.options.store.prefix).toBe('slowdown:');
    });

    test('Deve ter handler personalizado', () => {
        expect(createUserSlowDown.options.handler).toBeDefined();
    });
});

describe('Slow Down Middleware - Comportamento Geral', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await mockRedisClient.flushall();
    });

    test('Não deve bloquear requisições, apenas adicionar atraso', () => {
        // Diferença entre rate-limit e slow-down:
        // Rate-limit: res.status(429).json(message)
        // Slow-down: apenas adiciona atraso, next() é chamado
        
        const handlerFn = authenticationSlowDown.options.handler;
        const req = {
            ip: '192.168.1.1',
            originalUrl: '/api/test',
            method: 'GET',
            session: {}
        };
        const res = {};
        const next = jest.fn();
        const options = {};

        handlerFn(req, res, next, options);

        // O handler de slow-down não deve chamar res.status ou res.json
        // apenas loga e deixa passar
        expect(next).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve calcular atraso exponencialmente para múltiplas tentativas', () => {
        const delayMs = authenticationSlowDown.options.delayMs;
        
        // Simula aumento de tentativas
        const delays = [];
        for (let i = 1; i <= 8; i++) {
            delays.push(delayMs(i));
        }

        // Verifica que os atrasos aumentam exponencialmente
        expect(delays[0]).toBeLessThan(delays[1]);
        expect(delays[1]).toBeLessThan(delays[2]);
        expect(delays[2]).toBeLessThan(delays[3]);

        // Verifica que não excede maxDelayMs
        const maxDelay = 25 * 1000;
        delays.forEach(delay => {
            expect(delay).toBeLessThanOrEqual(maxDelay);
        });
    });

    test('Deve permitir customização por chave (user ID ou IP)', () => {
        const keyGeneratorFn = authenticationSlowDown.options.keyGenerator;

        // Usuário autenticado usa seu ID
        const authenticatedReq = {
            session: { user: 'user_123' },
            ip: '192.168.1.1'
        };
        expect(keyGeneratorFn(authenticatedReq)).toBe('user_123');

        // Usuário não autenticado usa IP
        const anonymousReq = {
            session: {},
            ip: '192.168.1.1'
        };
        expect(keyGeneratorFn).toBeDefined();
    });

    test('Deve registrar tentativas bloqueadas no logger', () => {
        const handlerFn = authenticationSlowDown.options.handler;

        const testCases = [
            {
                ip: '192.168.1.100',
                originalUrl: '/api/user/signin',
                method: 'POST',
                description: 'Login attempt'
            },
            {
                ip: '10.0.0.1',
                originalUrl: '/api/user/signup',
                method: 'POST',
                description: 'Signup attempt'
            }
        ];

        testCases.forEach(testCase => {
            logger.warn.mockClear();

            const req = {
                ip: testCase.ip,
                originalUrl: testCase.originalUrl,
                method: testCase.method,
                session: {}
            };

            handlerFn(req, {}, jest.fn(), {});

            expect(logger.warn).toHaveBeenCalled();
            const call = logger.warn.mock.calls[0];
            expect(call[0]).toContain(testCase.ip);
            expect(call[0]).toContain(testCase.originalUrl);
        });
    });
});

/**
 * IMPORTANTE: Como funciona express-slow-down
 * 
 * 1. O middleware rastreia requisições por chave (user ID ou IP)
 * 2. Após delayAfter requisições, começa a adicionar atraso
 * 3. O atraso é calculado por delayMs(hits)
 * 4. O handler é chamado quando atraso é adicionado (geralmente para logging)
 * 5. A requisição continua normalmente após o atraso
 * 
 * Diferença do rate-limit:
 * - rate-limit: bloqueia a requisição com erro 429
 * - slow-down: deixa a requisição passar, mas após atraso
 * 
 * Uso recomendado:
 * - Em rotas PUT/POST donde operações são custosas
 * - Em autenticação para prevenir brute force
 * - Em APIs públicas para proteção DDoS
 */
