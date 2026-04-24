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
const {
    signInValidate,
    signUpValidate,
    changePasswordValidate,
    resetPasswordValidate,
    requestResetPasswordValidate
} = await import('../src/middlewares/validate.js');
const { logger } = await import('../src/config/logger.js');

describe('Validate Middleware - Sign In', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve validar signin com email e senha válidos', () => {
        const req = {
            body: {
                email: 'user@example.com',
                password: 'TestPass123!@'
            },
            session: null,
            ip: '192.168.1.1',
            originalUrl: '/api/user/signin',
            method: 'POST'
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

        signInValidate(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    test('Deve rejeitar signin sem email', () => {
        const req = {
            body: {
                email: '',
                password: 'TestPass123!@'
            },
            session: null,
            ip: '192.168.1.1',
            originalUrl: '/api/user/signin',
            method: 'POST'
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

        signInValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.stringContaining('campos obrigatórios')
            })
        );
        expect(next).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve rejeitar signin sem senha', () => {
        const req = {
            body: {
                email: 'user@example.com',
                password: ''
            },
            session: null,
            ip: '192.168.1.1',
            originalUrl: '/api/user/signin',
            method: 'POST'
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

        signInValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve rejeitar signin com email inválido', () => {
        const req = {
            body: {
                email: 'invalidemail',
                password: 'TestPass123!@'
            },
            session: null,
            ip: '192.168.1.1',
            originalUrl: '/api/user/signin',
            method: 'POST'
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

        signInValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve rejeitar signin com senha fraca', () => {
        const req = {
            body: {
                email: 'user@example.com',
                password: 'weakpass'
            },
            session: null,
            ip: '192.168.1.1',
            originalUrl: '/api/user/signin',
            method: 'POST'
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

        signInValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve rejeitar email com menos de 13 caracteres', () => {
        const req = {
            body: {
                email: 'user@s.com',
                password: 'TestPass123!@'
            },
            session: null,
            ip: '192.168.1.1',
            originalUrl: '/api/user/signin',
            method: 'POST'
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

        signInValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('Validate Middleware - Sign Up', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve validar signup com dados válidos', () => {
        const req = {
            body: {
                name: 'João Silva',
                email: 'joao@example.com',
                password: 'TestPass123!@'
            },
            session: null,
            ip: '192.168.1.1',
            originalUrl: '/api/user/signup',
            method: 'POST'
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

        signUpValidate(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve rejeitar signup sem nome', () => {
        const req = {
            body: {
                name: '',
                email: 'joao@example.com',
                password: 'TestPass123!@'
            },
            session: null,
            ip: '192.168.1.1',
            originalUrl: '/api/user/signup',
            method: 'POST'
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

        signUpValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve rejeitar signup com nome muito curto', () => {
        const req = {
            body: {
                name: 'A',
                email: 'joao@example.com',
                password: 'TestPass123!@'
            },
            session: null,
            ip: '192.168.1.1',
            originalUrl: '/api/user/signup',
            method: 'POST'
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

        signUpValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.stringContaining('3 caracteres')
            })
        );
    });

    test('Deve rejeitar signup sem email', () => {
        const req = {
            body: {
                name: 'João Silva',
                email: '',
                password: 'TestPass123!@'
            },
            session: null,
            ip: '192.168.1.1',
            originalUrl: '/api/user/signup',
            method: 'POST'
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

        signUpValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve rejeitar signup sem senha', () => {
        const req = {
            body: {
                name: 'João Silva',
                email: 'joao@example.com',
                password: ''
            },
            session: null,
            ip: '192.168.1.1',
            originalUrl: '/api/user/signup',
            method: 'POST'
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

        signUpValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve rejeitar signup com senha fraca', () => {
        const req = {
            body: {
                name: 'João Silva',
                email: 'joao@example.com',
                password: 'weakpass'
            },
            session: null,
            ip: '192.168.1.1',
            originalUrl: '/api/user/signup',
            method: 'POST'
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

        signUpValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve rejeitar signup com email inválido', () => {
        const req = {
            body: {
                name: 'João Silva',
                email: 'invalidemail',
                password: 'TestPass123!@'
            },
            session: null,
            ip: '192.168.1.1',
            originalUrl: '/api/user/signup',
            method: 'POST'
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

        signUpValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('Validate Middleware - Change Password', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve validar mudança de senha com dados válidos', () => {
        const req = {
            body: {
                password: 'OldPass123',
                newPassword: 'NewPass456!@',
                confirmNewPassword: 'NewPass456!@'
            },
            session: { user: 'user_id_123' },
            ip: '192.168.1.1',
            originalUrl: '/api/user/change-password',
            method: 'POST'
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

        changePasswordValidate(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalledTimes(1);
    });

    test('Deve rejeitar mudança de senha sem senha atual', () => {
        const req = {
            body: {
                password: '',
                newPassword: 'NewPass456!@',
                confirmNewPassword: 'NewPass456!@'
            },
            session: { user: 'user_id_123' },
            ip: '192.168.1.1',
            originalUrl: '/api/user/change-password',
            method: 'POST'
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

        changePasswordValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve rejeitar mudança de senha sem nova senha', () => {
        const req = {
            body: {
                password: 'OldPass123',
                newPassword: '',
                confirmNewPassword: ''
            },
            session: { user: 'user_id_123' },
            ip: '192.168.1.1',
            originalUrl: '/api/user/change-password',
            method: 'POST'
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

        changePasswordValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve rejeitar quando as novas senhas não coincidem', () => {
        const req = {
            body: {
                password: 'OldPass123',
                newPassword: 'NewPass456!@',
                confirmNewPassword: 'DifferentPass789!@'
            },
            session: { user: 'user_id_123' },
            ip: '192.168.1.1',
            originalUrl: '/api/user/change-password',
            method: 'POST'
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

        changePasswordValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'As senhas não coincidem'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve rejeitar nova senha que é muito curta', () => {
        const req = {
            body: {
                password: 'OldPass123',
                newPassword: 'Short',
                confirmNewPassword: 'Short'
            },
            session: { user: 'user_id_123' },
            ip: '192.168.1.1',
            originalUrl: '/api/user/change-password',
            method: 'POST'
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

        changePasswordValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve rejeitar nova senha fraca', () => {
        const req = {
            body: {
                password: 'OldPass123',
                newPassword: 'weakpass',
                confirmNewPassword: 'weakpass'
            },
            session: { user: 'user_id_123' },
            ip: '192.168.1.1',
            originalUrl: '/api/user/change-password',
            method: 'POST'
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

        changePasswordValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'A nova senha deve conter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais'
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe('Validate Middleware - Request Reset Password', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve validar solicitação de reset com email válido', () => {
        const req = {
            body: {
                email: 'user@example.com'
            },
            ip: '192.168.1.1',
            originalUrl: '/api/user/request-reset-password',
            method: 'POST'
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

        requestResetPasswordValidate(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve rejeitar solicitação de reset sem email', () => {
        const req = {
            body: {
                email: ''
            },
            ip: '192.168.1.1',
            originalUrl: '/api/user/request-reset-password',
            method: 'POST'
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

        requestResetPasswordValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Preencha os campos obrigatórios'
        });
        expect(next).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve rejeitar email inválido', () => {
        const req = {
            body: {
                email: 'invalid_email'
            },
            ip: '192.168.1.1',
            originalUrl: '/api/user/request-reset-password',
            method: 'POST'
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

        requestResetPasswordValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'O email deve ser um email válido'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve rejeitar email muito curto', () => {
        const req = {
            body: {
                email: 'test@ex.co'
            },
            ip: '192.168.1.1',
            originalUrl: '/api/user/request-reset-password',
            method: 'POST'
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

        requestResetPasswordValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'O email deve conter no mínimo 13 caracteres'
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe('Validate Middleware - Reset Password', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve validar reset de senha com dados válidos', () => {
        const req = {
            body: {
                email: 'user@example.com',
                token: 'valid_jwt_token_123',
                code: '123456',
                newPassword: 'NewPass789!@',
                confirmPassword: 'NewPass789!@'
            },
            ip: '192.168.1.1',
            originalUrl: '/api/user/reset-password',
            method: 'PATCH'
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

        resetPasswordValidate(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve rejeitar reset sem email', () => {
        const req = {
            body: {
                email: '',
                token: 'token_123',
                code: '123456',
                newPassword: 'NewPass789!@#',
                confirmPassword: 'NewPass789!@#'
            },
            ip: '192.168.1.1',
            originalUrl: '/api/user/reset-password',
            method: 'PATCH'
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

        resetPasswordValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Preencha os campos obrigatórios'
        });
        expect(next).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve rejeitar reset sem token', () => {
        const req = {
            body: {
                email: 'user@example.com',
                token: '',
                code: '123456',
                newPassword: 'NewPass789!@#',
                confirmPassword: 'NewPass789!@#'
            },
            ip: '192.168.1.1',
            originalUrl: '/api/user/reset-password',
            method: 'PATCH'
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

        resetPasswordValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Token ausente'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve rejeitar reset sem código de verificação', () => {
        const req = {
            body: {
                email: 'user@example.com',
                token: 'token_123',
                code: '',
                newPassword: 'NewPass789!@#',
                confirmPassword: 'NewPass789!@#'
            },
            ip: '192.168.1.1',
            originalUrl: '/api/user/reset-password',
            method: 'PATCH'
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

        resetPasswordValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Código de verificação ausente'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve rejeitar senhas que não coincidem', () => {
        const req = {
            body: {
                email: 'user@example.com',
                token: 'token_123',
                code: '123456',
                newPassword: 'NewPass789!@',
                confirmPassword: 'DifferentPass789!@'
            },
            ip: '192.168.1.1',
            originalUrl: '/api/user/reset-password',
            method: 'PATCH'
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

        resetPasswordValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'As senhas não coincidem'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve rejeitar senha fraca', () => {
        const req = {
            body: {
                email: 'user@example.com',
                token: 'token_123',
                code: '123456',
                newPassword: 'weakpass',
                confirmPassword: 'weakpass'
            },
            ip: '192.168.1.1',
            originalUrl: '/api/user/reset-password',
            method: 'PATCH'
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

        resetPasswordValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'A nova senha deve conter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('Deve rejeitar email inválido', () => {
        const req = {
            body: {
                email: 'invalid_email',
                token: 'token_123',
                code: '123456',
                newPassword: 'NewPass789!@',
                confirmPassword: 'NewPass789!@'
            },
            ip: '192.168.1.1',
            originalUrl: '/api/user/reset-password',
            method: 'PATCH'
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

        resetPasswordValidate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'O email deve ser um email válido'
        });
        expect(next).not.toHaveBeenCalled();
    });
});
