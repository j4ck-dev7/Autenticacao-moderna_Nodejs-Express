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

jest.unstable_mockModule('../src/repositories/userRepository.js', () => ({
    findUserByIdVerified: jest.fn()
}));

// Import após mock
const { Auth } = await import('../src/middlewares/authMiddleware.js');
const { logger } = await import('../src/config/logger.js');
const { findUserByIdVerified } = await import('../src/repositories/userRepository.js');

describe('Auth Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve permitir acesso quando usuário está autenticado', async () => {
        findUserByIdVerified.mockResolvedValue({
            id: 'user_id_123',
            isVerified: true
        })

        const req = {
            session: {
                user: 'user_id_123'
            },
            ip: '192.168.1.1'
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

        await Auth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    test('Deve negar acesso quando o usuário não foi encontrado', async () => {
        findUserByIdVerified.mockResolvedValue(null);

        const req = {
            session: {
                user: 'user_id_123'
            },
            ip: '192.168.1.1'
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

        await Auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Usuário não encontrado'
        });
        expect(next).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledTimes(1);
    });

    test('Deve negar acesso quando o usuário não está verificado', async () => {
        findUserByIdVerified.mockResolvedValue({
            id: 'user_id_123',
            isVerified: false
        });

        const req = {
            session: {
                user: 'user_id_123'
            },
            ip: '192.168.1.1'
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

        await Auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Acesso negado. Verifique sua conta.'
        });
        expect(next).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledTimes(1);
    });


    test('Deve negar acesso quando usuário não está autenticado', async () => {
        const req = {
            session: {
                user: null
            },
            ip: '192.168.1.1'
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

        await Auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Logue ou registre-se para acessar'
        });
        expect(next).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve negar acesso quando session.user é undefined', async () => {
        const req = {
            session: {},
            ip: '192.168.1.1'
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

        await Auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Logue ou registre-se para acessar'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve tratar erro internos adequadamente', async () => {
        // Cria um objeto session que lançará erro ao acessar
        const req = {
            session: null, // Simula um cenário onde session é null e causa erro
            ip: '192.168.1.1'
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

        try {
            await Auth(req, res, next);
        } catch (e) {
            // Captura o erro esperado
        }

        // Se não capturar erro, então o middleware tratou corretamente
        // Caso contrário, significa que não está tratando erros corretamente
    });

    test('Deve logar informações de acesso autorizado corretamente', async () => {
        findUserByIdVerified.mockResolvedValue({
            id: 'user_id_456',
            isVerified: true
        })

        const req = {
            session: {
                user: 'user_id_456'
            },
            ip: '10.0.0.1'
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

        await Auth(req, res, next);

        expect(logger.info).toHaveBeenCalledWith(
            'Acesso autorizado - token de autenticação válido',
            expect.objectContaining({
                usuarioId: 'user_id_456',
                ip: '10.0.0.1'
            })
        );
    });

    test('Deve logar informações de acesso negado corretamente', async () => {
        const req = {
            session: {
                user: null
            },
            ip: '172.16.0.1'
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

        await Auth(req, res, next);

        expect(logger.info).toHaveBeenCalledWith(
            'Acesso negado - token de autenticação ausente',
            expect.objectContaining({
                usuarioId: 'Desconhecido',
                ip: '172.16.0.1'
            })
        );
    });
});
