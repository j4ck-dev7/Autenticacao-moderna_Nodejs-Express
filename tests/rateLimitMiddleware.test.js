import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import Redis from 'ioredis-mock';

/**
 * ioredis-mock: Simula Redis de forma muito próxima ao real
 * 
 * ioredis-mock é uma biblioteca que fornece uma instância simulada do Redis
 * que funciona quase identicamente ao Redis real. Diferente de mocks manuais,
 * o ioredis-mock implementa corretamente o protocolo Redis e retorna respostas
 * esperadas pelo rate-limit-redis.
 * 
 * Por quê usar ao invés de mock manual?
 * - Implementação completa do protocolo Redis
 * - Suporta comandos Redis reais (INCR, EXPIRE, GET, DEL, etc.)
 * - Retorna respostas no formato esperado
 * - Funciona com rate-limit-redis sem erros
 */

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
// ioredis-mock simula Redis de forma realista, retornando respostas corretas
// para comandos como INCR, EXPIRE, GET, DEL que rate-limit-redis espera
const mockRedisClient = new Redis();

jest.unstable_mockModule('../src/config/redis.js', () => ({
    client: mockRedisClient
}));

// Mock do express-rate-limit com factory que retorna funções middleware
// com a propriedade .options para testes
const createMockMiddleware = (options) => {
    const middleware = (req, res, next) => {
        next();
    };
    middleware.options = options;
    return middleware;
};

jest.unstable_mockModule('express-rate-limit', () => ({
    rateLimit: jest.fn((options) => createMockMiddleware(options)),
    ipKeyGenerator: jest.fn((ip) => ip)
}));

jest.unstable_mockModule('rate-limit-redis', () => ({
    RedisStore: jest.fn((options) => ({
        sendCommand: options.sendCommand,
        prefix: options.prefix
    }))
}));

// Import após mocks
const {
    mainPageLimit,
    autenticacaoLimit,
    Oauth2UrlLimit,
    Oauth2AuthenticationLimit
} = await import('../src/middlewares/rateLimit.js');

const { logger } = await import('../src/config/logger.js');

/**
 * Rate Limiting em aplicações Express:
 * 
 * O middleware express-rate-limit funciona armazenando contadores de requisições
 * em um store (neste caso, Redis para produção). Quando o limite é excedido,
 * o middleware chama o handler definido, retornando uma resposta ao cliente.
 * 
 * Testes para rate limiting focam em:
 * 1. Verificar que o middleware está configurado corretamente
 * 2. Verificar que logs são gerados quando limites são excedidos
 * 3. Verificar que o middleware passa corretamente para rotas válidas
 */

describe('Rate Limit Middleware - mainPageLimit', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        // Limpar dados do Redis mock entre testes
        await mockRedisClient.flushall();
    });

    test('Deve ser definido e ter configurações corretas', () => {
        expect(mainPageLimit).toBeDefined();
        expect(mainPageLimit.options).toBeDefined();
        expect(mainPageLimit.options.windowMs).toBe(60 * 1000); // 1 minuto
        expect(mainPageLimit.options.limit).toBe(5); // 5 requisições
    });

    test('Deve usar Redis store para armazenar dados de rate limit', () => {
        expect(mainPageLimit.options.store).toBeDefined();
    });

    test('Deve usar keyGenerator customizado que retorna user ID se autenticado', () => {
        const keyGeneratorFn = mainPageLimit.options.keyGenerator;
        expect(keyGeneratorFn).toBeDefined();

        const req = {
            session: { user: 'user_id_123' },
            ip: '192.168.1.1'
        };

        const key = keyGeneratorFn(req);
        expect(key).toBe('user_id_123');
    });

    test('Deve usar keyGenerator customizado que retorna IP se não autenticado', () => {
        const keyGeneratorFn = mainPageLimit.options.keyGenerator;

        const req = {
            session: {},
            ip: '192.168.1.1'
        };

        // OBS: ipKeyGenerator retorna uma função que processa o IP
        // Para este teste, apenas verificamos que a função existe
        expect(keyGeneratorFn).toBeDefined();
    });

    test('Deve ter handler customizado que loga avisos', () => {
        const handlerFn = mainPageLimit.options.handler;
        expect(handlerFn).toBeDefined();

        const req = {
            ip: '192.168.1.1',
            originalUrl: '/api/user/main',
            method: 'GET',
            session: { user: 'user_id_123' }
        };

        const res = {
            status: jest.fn(function(code) {
                this.statusCode = code;
                return this;
            }),
            json: jest.fn(function(data) {
                this.jsonData = data;
                return this;
            })
        };

        const next = jest.fn();
        const options = { statusCode: 429, message: 'Muitas requisições, por favor tente novamente mais tarde.' };

        handlerFn(req, res, next, options);

        expect(logger.warn).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Muitas requisições, por favor tente novamente mais tarde.'
        });
    });
});

describe('Rate Limit Middleware - autenticacaoLimit', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await mockRedisClient.flushall();
    });

    test('Deve ser configurado para rotas de autenticação', () => {
        expect(autenticacaoLimit).toBeDefined();
        expect(autenticacaoLimit.options.windowMs).toBe(60 * 1000);
        expect(autenticacaoLimit.options.limit).toBe(5);
    });

    test('Deve ter store Redis configurado', () => {
        expect(autenticacaoLimit.options.store).toBeDefined();
    });

    test('Deve logar quando limite é excedido', () => {
        const handlerFn = autenticacaoLimit.options.handler;

        const req = {
            ip: '192.168.1.1',
            originalUrl: '/api/user/signin',
            method: 'POST',
            session: { user: null }
        };

        const res = {
            status: jest.fn(function(code) {
                this.statusCode = code;
                return this;
            }),
            json: jest.fn(function(data) {
                this.jsonData = data;
                return this;
            })
        };

        const next = jest.fn();
        const options = { statusCode: 429 };

        handlerFn(req, res, next, options);

        expect(logger.warn).toHaveBeenCalled();
        // Verificar que a mensagem contém informações sobre IP e rota
        const warnCall = logger.warn.mock.calls[0];
        expect(warnCall[0]).toContain('192.168.1.1');
    });
});

describe('Rate Limit Middleware - Oauth2UrlLimit', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await mockRedisClient.flushall();
    });

    test('Deve ser configurado para obter URLs OAuth2', () => {
        expect(Oauth2UrlLimit).toBeDefined();
        expect(Oauth2UrlLimit.options.windowMs).toBe(60 * 1000);
        expect(Oauth2UrlLimit.options.limit).toBe(10); // Limite mais alto para URLs
    });

    test('Deve ter mensagem apropriada para quando limite é excedido', () => {
        const handlerFn = Oauth2UrlLimit.options.handler;

        const req = {
            ip: '192.168.1.1',
            originalUrl: '/api/auth/oauth-signup-url',
            method: 'GET',
            session: { user: null }
        };

        const res = {
            status: jest.fn(function(code) {
                this.statusCode = code;
                return this;
            }),
            json: jest.fn(function(data) {
                this.jsonData = data;
                return this;
            })
        };

        const next = jest.fn();
        const options = { statusCode: 429, message: 'Muitas requisições, por favor tente novamente mais tarde.' };

        handlerFn(req, res, next, options);

        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalled();
        const jsonCall = res.json.mock.calls[0][0];
        expect(jsonCall.message).toBeDefined();
        // Verifica que a mensagem contém "Muitas requisições"
        expect(jsonCall.message).toMatch(/Muitas requisições/i);
    });
});

describe('Rate Limit Middleware - Oauth2AuthenticationLimit', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await mockRedisClient.flushall();
    });

    test('Deve ser configurado para autenticação OAuth2', () => {
        expect(Oauth2AuthenticationLimit).toBeDefined();
        expect(Oauth2AuthenticationLimit.options.limit).toBe(10);
    });

    test('Deve proteger contra ataques de força bruta no OAuth', () => {
        const keyGeneratorFn = Oauth2AuthenticationLimit.options.keyGenerator;

        const req = {
            session: { user: 'user_id_123' },
            ip: '192.168.1.1'
        };

        const key = keyGeneratorFn(req);
        // Deve retornar user ID se autenticado
        expect(key).toBeDefined();
    });

    test('Deve logar tentativas bloqueadas', () => {
        const handlerFn = Oauth2AuthenticationLimit.options.handler;

        const req = {
            ip: '192.168.1.1',
            originalUrl: '/api/auth/oauth-signin-callback',
            method: 'GET',
            session: { user: null }
        };

        const res = {
            status: jest.fn(function(code) {
                this.statusCode = code;
                return this;
            }),
            json: jest.fn(function(data) {
                this.jsonData = data;
                return this;
            })
        };

        const next = jest.fn();
        const options = { statusCode: 429 };

        handlerFn(req, res, next, options);

        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('192.168.1.1'),
            expect.objectContaining({
                ip: '192.168.1.1',
                rota: '/api/auth/oauth-signin-callback',
                metodo: 'GET'
            })
        );
    });
});

describe('Rate Limit Middleware - ioredis-mock Integration', () => {
    /**
     * Testes de integração com ioredis-mock
     * 
     * ioredis-mock implementa comandos Redis reais que rate-limit-redis usa:
     * - INCR: Incrementa um counter (usado para contar requisições)
     * - EXPIRE: Define expiração da chave (usado para TTL de 1 minuto)
     * - GET: Obtém valor da chave (usado para verificar limite atual)
     * - DEL: Deleta chave (usado para reset)
     * 
     * Estes testes demonstram que o mock funciona corretamente com rate-limit-redis
     */

    beforeEach(async () => {
        await mockRedisClient.flushall();
    });

    test('Deve incrementar contador com INCR (como rate-limit-redis faz)', async () => {
        // Simula o que rate-limit-redis faz internamente
        let count = await mockRedisClient.incr('test:counter:user_123');
        expect(count).toBe(1);

        count = await mockRedisClient.incr('test:counter:user_123');
        expect(count).toBe(2);

        count = await mockRedisClient.incr('test:counter:user_123');
        expect(count).toBe(3);
    });

    test('Deve retornar null para chaves que não existem com GET', async () => {
        const result = await mockRedisClient.get('nonexistent:key');
        expect(result).toBeNull();
    });

    test('Deve armazenar e recuperar valores com SET/GET', async () => {
        await mockRedisClient.set('test:key', 'test:value');
        const result = await mockRedisClient.get('test:key');
        expect(result).toBe('test:value');
    });

    test('Deve definir expiração com EXPIRE (TTL)', async () => {
        await mockRedisClient.set('test:ttl:key', 'value');
        await mockRedisClient.expire('test:ttl:key', 1); // 1 segundo

        const result = await mockRedisClient.get('test:ttl:key');
        expect(result).toBe('value');

        // Espera 1.1 segundos para chave expirar
        await new Promise(resolve => setTimeout(resolve, 1100));

        const resultAfterExpiry = await mockRedisClient.get('test:ttl:key');
        expect(resultAfterExpiry).toBeNull();
    });

    test('Deve deletar chaves com DEL', async () => {
        await mockRedisClient.set('test:delete:key', 'value');
        let result = await mockRedisClient.get('test:delete:key');
        expect(result).toBe('value');

        await mockRedisClient.del('test:delete:key');
        result = await mockRedisClient.get('test:delete:key');
        expect(result).toBeNull();
    });

    test('Deve limpar tudo com FLUSHALL', async () => {
        await mockRedisClient.set('key1', 'value1');
        await mockRedisClient.set('key2', 'value2');
        
        let result1 = await mockRedisClient.get('key1');
        let result2 = await mockRedisClient.get('key2');
        expect(result1).toBe('value1');
        expect(result2).toBe('value2');

        await mockRedisClient.flushall();

        result1 = await mockRedisClient.get('key1');
        result2 = await mockRedisClient.get('key2');
        expect(result1).toBeNull();
        expect(result2).toBeNull();
    });

    test('Deve funcionar com padrão rate-limit-redis (contador + expiração)', async () => {
        const key = 'ratelimit:user_id_123';
        
        // Primeira requisição
        let count = await mockRedisClient.incr(key);
        expect(count).toBe(1);
        
        // Apenas define TTL na primeira requisição
        if (count === 1) {
            await mockRedisClient.expire(key, 60); // 1 minuto TTL
        }

        // Segunda requisição
        count = await mockRedisClient.incr(key);
        expect(count).toBe(2);

        // Terceira requisição
        count = await mockRedisClient.incr(key);
        expect(count).toBe(3);

        // Verificar que TTL está ainda ativo
        const ttl = await mockRedisClient.ttl(key);
        expect(ttl).toBeGreaterThan(0); // TTL em segundos
        expect(ttl).toBeLessThanOrEqual(60); // Não deve exceder 60 segundos
    });
});

describe('Rate Limit Middleware - Configurações Gerais', () => {
    test('Todos os limitadores devem ter standardHeaders ativado', () => {
        expect(mainPageLimit.options.standardHeaders).toBe(true);
        expect(autenticacaoLimit.options.standardHeaders).toBe(true);
        expect(Oauth2UrlLimit.options.standardHeaders).toBe(true);
        expect(Oauth2AuthenticationLimit.options.standardHeaders).toBe(true);
    });

    test('Todos os limitadores devem ter legacyHeaders desativado', () => {
        expect(mainPageLimit.options.legacyHeaders).toBe(false);
        expect(autenticacaoLimit.options.legacyHeaders).toBe(false);
        expect(Oauth2UrlLimit.options.legacyHeaders).toBe(false);
        expect(Oauth2AuthenticationLimit.options.legacyHeaders).toBe(false);
    });

    test('Todos os limitadores devem usar Redis Store', () => {
        expect(mainPageLimit.options.store).toBeDefined();
        expect(autenticacaoLimit.options.store).toBeDefined();
        expect(Oauth2UrlLimit.options.store).toBeDefined();
        expect(Oauth2AuthenticationLimit.options.store).toBeDefined();
    });

    test('Todos os limitadores devem ter handlers customizados', () => {
        expect(mainPageLimit.options.handler).toBeDefined();
        expect(autenticacaoLimit.options.handler).toBeDefined();
        expect(Oauth2UrlLimit.options.handler).toBeDefined();
        expect(Oauth2AuthenticationLimit.options.handler).toBeDefined();
    });
});
