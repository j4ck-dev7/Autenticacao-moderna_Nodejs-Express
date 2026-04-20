import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock do logger
jest.unstable_mockModule('../src/config/logger.js', () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

// Import após mock
const { loggerMiddleware } = await import('../src/middlewares/loggerMiddleware.js');
const { logger } = await import('../src/config/logger.js');

describe('Logger Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve logar requisição HTTP com sucesso (status 200)', () => {
        const req = {
            method: 'GET',
            path: '/api/user/main',
            session: {
                user: 'user_id_123'
            },
            ip: '192.168.1.1',
            get: jest.fn((header) => {
                if (header === 'user-agent') return 'Mozilla/5.0...';
                return '';
            })
        };

        const res = {
            statusCode: 200,
            send: jest.fn(function(data) {
                return data;
            })
        };

        const next = jest.fn();

        // Aplicar middleware
        loggerMiddleware(req, res, next);

        // Chamar send (que o middleware sobrescreve)
        res.send('{"message":"success"}');

        expect(next).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(
            'Requisição HTTP',
            expect.objectContaining({
                metodo: 'GET',
                rota: '/api/user/main',
                statusCode: 200,
                duracao: expect.stringContaining('ms'),
                usuarioId: 'user_id_123',
                ip: '192.168.1.1',
                userAgent: 'Mozilla/5.0...'
            })
        );
    });

    test('Deve logar segundo status de erro (400+) como aviso', () => {
        const req = {
            method: 'POST',
            path: '/api/user/signin',
            session: {
                user: null
            },
            ip: '192.168.1.2',
            get: jest.fn((header) => {
                if (header === 'user-agent') return 'Chrome/90.0..';
                return '';
            })
        };

        const res = {
            statusCode: 400,
            send: jest.fn(function(data) {
                return data;
            })
        };

        const next = jest.fn();

        // Aplicar middleware
        loggerMiddleware(req, res, next);

        // Chamar send
        res.send('{"error":"Validação falhou"}');

        expect(logger.info).toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalledWith(
            'Erro na requisição',
            expect.objectContaining({
                metodo: 'POST',
                rota: '/api/user/signin',
                statusCode: 400,
                corpo: '{"error":"Validação falhou"}',
                usuarioId: 'Desconhecido'
            })
        );
    });

    test('Deve logar requisição HTTP com status 401', () => {
        const req = {
            method: 'GET',
            path: '/api/protected-route',
            session: {},
            ip: '10.0.0.1',
            get: jest.fn((header) => {
                if (header === 'user-agent') return 'Firefox/88.0..';
                return '';
            })
        };

        const res = {
            statusCode: 401,
            send: jest.fn(function(data) {
                return data;
            })
        };

        const next = jest.fn();

        loggerMiddleware(req, res, next);
        res.send('{"error":"Não autorizado"}');

        expect(logger.warn).toHaveBeenCalledWith(
            'Erro na requisição',
            expect.objectContaining({
                statusCode: 401
            })
        );
    });

    test('Deve logar requisição HTTP com status 500', () => {
        const req = {
            method: 'POST',
            path: '/api/user/signup',
            session: {
                user: null
            },
            ip: '172.16.0.1',
            get: jest.fn(() => 'Safari/604.1..')
        };

        const res = {
            statusCode: 500,
            send: jest.fn(function(data) {
                return data;
            })
        };

        const next = jest.fn();

        loggerMiddleware(req, res, next);
        res.send('{"error":"Erro interno do servidor"}');

        expect(logger.warn).toHaveBeenCalledWith(
            'Erro na requisição',
            expect.objectContaining({
                statusCode: 500,
                corpo: '{"error":"Erro interno do servidor"}'
            })
        );
    });

    test('Deve chamar next() para continuar o middleware', () => {
        const req = {
            method: 'GET',
            path: '/test',
            session: { user: null },
            ip: '192.168.1.1',
            get: jest.fn(() => '')
        };

        const res = {
            statusCode: 200,
            send: jest.fn(function(data) {
                return data;
            })
        };

        const next = jest.fn();

        loggerMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    test('Deve medir a duração da requisição corretamente', (done) => {
        const req = {
            method: 'GET',
            path: '/api/user/main',
            session: { user: 'user_id_123' },
            ip: '192.168.1.1',
            get: jest.fn(() => '')
        };

        const res = {
            statusCode: 200,
            send: jest.fn(function(data) {
                return data;
            })
        };

        const next = jest.fn();

        loggerMiddleware(req, res, next);

        // Simular atraso
        setTimeout(() => {
            res.send('{"message":"success"}');

            expect(logger.info).toHaveBeenCalled();
            const callArgs = logger.info.mock.calls[0];
            const duracao = callArgs[1].duracao;
            
            // Verificar que duracao contém 'ms' e é um número válido
            expect(duracao).toMatch(/\d+ms/);
            done();
        }, 10);
    });

    test('Deve logar com usuarioId "Desconhecido" quando não há sessão', () => {
        const req = {
            method: 'GET',
            path: '/api/public',
            session: null,
            ip: '192.168.1.100',
            get: jest.fn(() => '')
        };

        const res = {
            statusCode: 200,
            send: jest.fn(function(data) {
                return data;
            })
        };

        const next = jest.fn();

        loggerMiddleware(req, res, next);
        res.send('{"message":"public data"}');

        expect(logger.info).toHaveBeenCalledWith(
            'Requisição HTTP',
            expect.objectContaining({
                usuarioId: 'Desconhecido'
            })
        );
    });

    test('Deve preservar os dados retornados pelo send original', () => {
        const responseData = '{"message":"success"}';
        
        const req = {
            method: 'GET',
            path: '/api/test',
            session: { user: null },
            ip: '192.168.1.1',
            get: jest.fn(() => '')
        };

        const res = {
            statusCode: 200,
            send: jest.fn(function(data) {
                return data;
            })
        };

        const next = jest.fn();

        loggerMiddleware(req, res, next);
        const result = res.send(responseData);

        expect(result).toBe(responseData);
    });
});
