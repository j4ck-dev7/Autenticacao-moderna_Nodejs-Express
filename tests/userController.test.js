import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock das dependências
jest.unstable_mockModule('../src/services/userService.js', () => ({
    registerUser: jest.fn(),
    loginUser: jest.fn(),
    registerWithOauth: jest.fn(),
    OauthRequestSignUp: jest.fn(),
    OauthRequestSignIn: jest.fn(),
    loginWithOauth: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
    requestPasswordReset: jest.fn(),
    validatePasswordResetToken: jest.fn()
}));

jest.unstable_mockModule('../src/config/logger.js', () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

jest.unstable_mockModule('../src/utils/redisLoginAttempts.js', () => ({
    getLoginAttempts: jest.fn(),
    incrementLoginAttempts: jest.fn(),
    resetLoginAttempts: jest.fn(),
    isLockedOut: jest.fn()
}));

jest.unstable_mockModule('node:crypto', () => ({
    default: {
        randomBytes: jest.fn(() => ({
            toString: jest.fn(() => 'random_state_from_crypto')
        }))
    }
}));

// Imports após mocks
const {
    getOauthUrlSignUp,
    getOauthUrlSignIn,
    signUpWithOauth,
    signInWithOauth,
    signUp,
    verifyUser,
    signIn,
    changePassword,
    mainPage,
    requestResetPassword,
    resetPasswordWithToken
} = await import('../src/controllers/userController.js');

const {
    registerUser,
    loginUser,
    registerWithOauth,
    OauthRequestSignUp,
    OauthRequestSignIn,
    loginWithOauth,
    resetPassword,
    verifyEmail,
    requestPasswordReset,
    validatePasswordResetToken
} = await import('../src/services/userService.js');

const { logger } = await import('../src/config/logger.js');

const {
    isLockedOut,
    incrementLoginAttempts,
    resetLoginAttempts
} = await import('../src/utils/redisLoginAttempts.js');

// Helper para criar mock de request e response
function createMockReqRes() {
    const req = {
        body: {},
        query: {},
        session: {
            user: null,
            regenerate: jest.fn((cb) => cb(null)),
            save: jest.fn((cb) => cb(null))
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
        }),
        send: jest.fn(function(html) {
            this.htmlData = html;
            return this;
        }),
        redirect: jest.fn(function(url) {
            this.redirectUrl = url;
            return this;
        }),
        statusCode: 200
    };

    return { req, res };
}

describe('User Controller - OAuth URLs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve gerar URL para signup com OAuth', async () => {
        const { req, res } = createMockReqRes();
        OauthRequestSignUp.mockReturnValue('https://accounts.google.com/oauth/authorize?...');

        await getOauthUrlSignUp(req, res);

        expect(OauthRequestSignUp).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            url: expect.any(String)
        }));
        expect(req.session.OauthState).toBeDefined();
        expect(logger.debug).toHaveBeenCalled();
    });

    test('Deve gerar URL para signin com OAuth', async () => {
        const { req, res } = createMockReqRes();
        OauthRequestSignIn.mockReturnValue('https://accounts.google.com/oauth/authorize?...');

        await getOauthUrlSignIn(req, res);

        expect(OauthRequestSignIn).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            url: expect.any(String)
        }));
        expect(req.session.OauthState).toBeDefined();
    });

    test('Deve retornar erro ao gerar URL para signup', async () => {
        const { req, res } = createMockReqRes();
        OauthRequestSignUp.mockImplementation(() => {
            throw new Error('OAuth Error');
        });

        await getOauthUrlSignUp(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Erro ao gerar url para autenticação Oauth'
        });
        expect(logger.error).toHaveBeenCalled();
    });
});

describe('User Controller - OAuth Authentication', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve fazer signup com OAuth com sucesso', async () => {
        const { req, res } = createMockReqRes();
        req.query = { code: 'auth_code_123', state: 'random_state_from_crypto' };
        req.session.OauthState = 'random_state_from_crypto';

        registerWithOauth.mockResolvedValue({
            _id: 'user_id_123',
            name: 'Test User',
            subGoogle: 'google_sub_123'
        });

        await signUpWithOauth(req, res);

        expect(registerWithOauth).toHaveBeenCalledWith('auth_code_123', req.ip);
        expect(req.session.user).toBe('user_id_123');
        expect(res.redirect).toHaveBeenCalledWith('/api/user/main');
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve retornar erro ao fazer signup com OAuth se state é inválido', async () => {
        const { req, res } = createMockReqRes();
        req.query = { code: 'auth_code_123', state: 'wrong_state' };
        req.session.OauthState = 'random_state_from_crypto';

        await signUpWithOauth(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'State inválido'
        });
        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve retornar erro ao fazer signup com OAuth se usuário já existe', async () => {
        const { req, res } = createMockReqRes();
        req.query = { code: 'auth_code_123', state: 'random_state_from_crypto' };
        req.session.OauthState = 'random_state_from_crypto';

        registerWithOauth.mockRejectedValue(new Error('Usuário existente'));

        await signUpWithOauth(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Usuário existente'
        });
    });

    test('Deve fazer signin com OAuth com sucesso', async () => {
        const { req, res } = createMockReqRes();
        req.query = { code: 'auth_code_123', state: 'random_state_from_crypto' };
        req.session.OauthState = 'random_state_from_crypto';

        loginWithOauth.mockResolvedValue({
            _id: 'user_id_123',
            name: 'Test User',
            subGoogle: 'google_sub_123'
        });

        await signInWithOauth(req, res);

        expect(loginWithOauth).toHaveBeenCalledWith('auth_code_123', req.ip);
        expect(req.session.user).toBe('user_id_123');
        expect(res.redirect).toHaveBeenCalledWith('/api/user/main');
    });

    test('Deve retornar erro ao fazer signin com OAuth se usuário não existe', async () => {
        const { req, res } = createMockReqRes();
        req.query = { code: 'auth_code_123', state: 'random_state_from_crypto' };
        req.session.OauthState = 'random_state_from_crypto';

        loginWithOauth.mockRejectedValue(new Error('Usuário não encontrado'));

        await signInWithOauth(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Usuário não encontrado'
        });
    });
});

describe('User Controller - Sign Up', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve fazer signup com sucesso', async () => {
        const { req, res } = createMockReqRes();
        req.body = {
            name: 'João Silva',
            email: 'joao@example.com',
            password: 'TestPass123!@#'
        };

        registerUser.mockResolvedValue({
            _id: 'user_id_123',
            name: 'João Silva',
            email: 'joao@example.com'
        });

        await signUp(req, res);

        expect(registerUser).toHaveBeenCalledWith('João Silva', 'joao@example.com', 'TestPass123!@#', req.ip);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Para concluir o registro, verifique seu email'
        });
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve retornar erro ao fazer signup com email já existente', async () => {
        const { req, res } = createMockReqRes();
        req.body = {
            name: 'João Silva',
            email: 'existing@example.com',
            password: 'TestPass123!@#'
        };

        registerUser.mockRejectedValue(new Error('Email existente'));

        await signUp(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Email existente'
        });
    });

    test('Deve retornar erro ao fazer signup', async () => {
        const { req, res } = createMockReqRes();
        req.body = {
            name: 'João Silva',
            email: 'joao@example.com',
            password: 'TestPass123!@#'
        };

        registerUser.mockRejectedValue(new Error('Erro desconhecido'));

        await signUp(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Erro ao registrar usuário'
        });
        expect(logger.error).toHaveBeenCalled();
    });
});

describe('User Controller - Verify Email', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve verificar email com sucesso', async () => {
        const { req, res } = createMockReqRes();
        req.query = { token: 'mock_token_123' };

        verifyEmail.mockResolvedValue({
            _id: 'user_id_123',
            email: 'user@example.com',
            isVerified: true
        });

        await verifyUser(req, res);

        expect(verifyEmail).toHaveBeenCalledWith('mock_token_123', req.ip);
        expect(req.session.user).toBe('user_id_123');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve retornar erro ao verificar email com token inválido', async () => {
        const { req, res } = createMockReqRes();
        req.query = { token: 'invalid_token' };

        verifyEmail.mockRejectedValue(new Error('Token inválido'));

        await verifyUser(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Token inválido'
        });
    });

    test('Deve retornar erro quando email já foi verificado', async () => {
        const { req, res } = createMockReqRes();
        req.query = { token: 'mock_token_123' };

        verifyEmail.mockRejectedValue(new Error('Email já verificado'));

        await verifyUser(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Email já verificado'
        });
    });
});

describe('User Controller - Sign In', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve fazer signin com sucesso', async () => {
        const { req, res } = createMockReqRes();
        req.body = {
            email: 'user@example.com',
            password: 'TestPass123!@#'
        };

        loginUser.mockResolvedValue({
            _id: 'user_id_123',
            email: 'user@example.com',
            name: 'Test User'
        });

        await signIn(req, res);

        expect(loginUser).toHaveBeenCalledWith('user@example.com', 'TestPass123!@#', req.ip);
        expect(req.session.user).toBe('user_id_123');
        expect(res.redirect).toHaveBeenCalledWith('/api/user/main');
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve retornar erro ao fazer signin com email ou senha incorretos', async () => {
        const { req, res } = createMockReqRes();
        req.body = {
            email: 'user@example.com',
            password: 'WrongPassword'
        };

        const error = new Error('Email ou senha incorretos');
        error.attempts = 1;
        error.remainingAttempts = 4;
        loginUser.mockRejectedValue(error);

        await signIn(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Email ou senha incorretos',
            attemptsRemaining: 4
        });
    });

    test('Deve retornar erro ao fazer signin com email não verificado', async () => {
        const { req, res } = createMockReqRes();
        req.body = {
            email: 'unverified@example.com',
            password: 'TestPass123!@#'
        };

        loginUser.mockRejectedValue(new Error('Email não verificado'));

        await signIn(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Email não verificado'
        });
    });

    test('Deve incrementar tentativas de login ao falhar', async () => {
        const { req, res } = createMockReqRes();
        req.body = {
            email: 'user@example.com',
            password: 'WrongPassword'
        };

        const error = new Error('Email ou senha incorretos');
        error.attempts = 2;
        error.remainingAttempts = 3;
        loginUser.mockRejectedValue(error);

        await signIn(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Email ou senha incorretos',
            attemptsRemaining: 3
        });
    });

    test('Deve bloquear usuário após 5 tentativas falhas', async () => {
        const { req, res } = createMockReqRes();
        req.body = {
            email: 'user@example.com',
            password: 'WrongPassword'
        };

        loginUser.mockRejectedValue(new Error('Usuário bloqueado por muitas tentativas'));

        await signIn(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve resetar tentativas após login bem-sucedido', async () => {
        const { req, res } = createMockReqRes();
        req.body = {
            email: 'user@example.com',
            password: 'TestPass123!@#'
        };

        loginUser.mockResolvedValue({
            _id: 'user_id_123',
            email: 'user@example.com',
            name: 'Test User'
        });

        await signIn(req, res);

        expect(req.session.user).toBe('user_id_123');
        expect(res.redirect).toHaveBeenCalledWith('/api/user/main');
    });
});

describe('User Controller - Change Password', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve alterar senha com sucesso', async () => {
        const { req, res } = createMockReqRes();
        req.session.user = 'user_id_123';
        req.body = {
            password: 'OldPass123!@#',
            newPassword: 'NewPass456!@#',
            confirmNewPassword: 'NewPass456!@#'
        };

        resetPassword.mockResolvedValue({
            _id: 'user_id_123',
            password: '$2a$10$hashed_NewPass456!@#'
        });

        await changePassword(req, res);

        expect(resetPassword).toHaveBeenCalledWith(
            'NewPass456!@#',
            'NewPass456!@#',
            'OldPass123!@#',
            'user_id_123',
            req.ip
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Senha alterada com sucesso'
        });
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve retornar erro ao alterar senha com senha incorreta', async () => {
        const { req, res } = createMockReqRes();
        req.session.user = 'user_id_123';
        req.body = {
            password: 'WrongPassword',
            newPassword: 'NewPass456!@#',
            confirmNewPassword: 'NewPass456!@#'
        };

        resetPassword.mockRejectedValue(new Error('Senha incorreta'));

        await changePassword(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Senha incorreta'
        });
    });

    test('Deve retornar erro ao alterar senha com senhas não coincidentes', async () => {
        const { req, res } = createMockReqRes();
        req.session.user = 'user_id_123';
        req.body = {
            password: 'OldPass123!@#',
            newPassword: 'NewPass456!@#',
            confirmNewPassword: 'DifferentPass789!@#'
        };

        resetPassword.mockRejectedValue(new Error('As senhas não coincidem'));

        await changePassword(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'As senhas não coincidem'
        });
    });

    test('Deve retornar erro quando nova senha é igual à atual', async () => {
        const { req, res } = createMockReqRes();
        req.session.user = 'user_id_123';
        req.body = {
            password: 'SamePass123!@#',
            newPassword: 'SamePass123!@#',
            confirmNewPassword: 'SamePass123!@#'
        };

        resetPassword.mockRejectedValue(new Error('A nova senha deve ser diferente da senha atual'));

        await changePassword(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'A nova senha deve ser diferente da senha atual'
        });
    });
});

describe('User Controller - Main Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve acessar página principal com sucesso', () => {
        const { req, res } = createMockReqRes();
        req.session.user = 'user_id_123';

        mainPage(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Página principal acessada com sucesso'
        });
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve retornar erro ao acessar página principal', () => {
        const { req, res } = createMockReqRes();
        req.session.user = 'user_id_123';
        
        // Simula um erro
        res.status.mockImplementation(() => {
            throw new Error('Internal error');
        });

        expect(() => {
            mainPage(req, res);
        }).toThrow();
    });
});

describe('User Controller - Request Reset Password', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve solicitar reset de senha com sucesso', async () => {
        const { req, res } = createMockReqRes();
        req.body = { email: 'user@example.com' };
        
        requestPasswordReset.mockResolvedValue({
            message: 'Email de reset de senha enviado com sucesso'
        });

        await requestResetPassword(req, res);

        expect(requestPasswordReset).toHaveBeenCalledWith('user@example.com', req.ip);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Email de reset de senha enviado com sucesso'
        });
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve retornar 404 quando email não existe', async () => {
        const { req, res } = createMockReqRes();
        req.body = { email: 'nonexistent@example.com' };
        
        requestPasswordReset.mockRejectedValue(new Error('Email não encontrado'));

        await requestResetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Email não encontrado'
        });
        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve retornar 500 em caso de erro no servidor', async () => {
        const { req, res } = createMockReqRes();
        req.body = { email: 'user@example.com' };
        
        requestPasswordReset.mockRejectedValue(new Error('Erro interno'));

        await requestResetPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(logger.error).toHaveBeenCalled();
    });
});

describe('User Controller - Reset Password With Token', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve resetar senha com token e código válidos', async () => {
        const { req, res } = createMockReqRes();
        req.body = {
            email: 'user@example.com',
            token: 'valid_token_123',
            code: '123456',
            newPassword: 'NewPass789!@#',
            confirmPassword: 'NewPass789!@#'
        };
        
        validatePasswordResetToken.mockResolvedValue({
            message: 'Senha resetada com sucesso'
        });

        await resetPasswordWithToken(req, res);

        expect(validatePasswordResetToken).toHaveBeenCalledWith(
            'valid_token_123',
            '123456',
            'NewPass789!@#',
            'NewPass789!@#',
            'user@example.com',
            req.ip
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Senha resetada com sucesso'
        });
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve retornar 401 quando senhas não coincidem', async () => {
        const { req, res } = createMockReqRes();
        req.body = {
            email: 'user@example.com',
            token: 'token_123',
            code: '123456',
            newPassword: 'NewPass789!@#',
            confirmPassword: 'DifferentPass789!@#'
        };
        
        validatePasswordResetToken.mockRejectedValue(new Error('As senhas não coincidem'));

        await resetPasswordWithToken(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'As senhas não coincidem'
        });
        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve retornar 401 quando código é inválido', async () => {
        const { req, res } = createMockReqRes();
        req.body = {
            email: 'user@example.com',
            token: 'token_123',
            code: 'invalid_code',
            newPassword: 'NewPass789!@#',
            confirmPassword: 'NewPass789!@#'
        };
        
        validatePasswordResetToken.mockRejectedValue(new Error('Código de verificação inválido'));

        await resetPasswordWithToken(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Código de verificação inválido'
        });
    });

    test('Deve retornar 401 quando token é inválido ou expirado', async () => {
        const { req, res } = createMockReqRes();
        req.body = {
            email: 'user@example.com',
            token: 'invalid_or_expired_token',
            code: '123456',
            newPassword: 'NewPass789!@#',
            confirmPassword: 'NewPass789!@#'
        };
        
        validatePasswordResetToken.mockRejectedValue(new Error('Token inválido ou expirado'));

        await resetPasswordWithToken(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Token inválido ou expirado'
        });
    });

    test('Deve retornar 500 em caso de erro no servidor', async () => {
        const { req, res } = createMockReqRes();
        req.body = {
            email: 'user@example.com',
            token: 'token_123',
            code: '123456',
            newPassword: 'NewPass789!@#',
            confirmPassword: 'NewPass789!@#'
        };
        
        validatePasswordResetToken.mockRejectedValue(new Error('Erro interno do servidor'));

        await resetPasswordWithToken(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(logger.error).toHaveBeenCalled();
    });
});
