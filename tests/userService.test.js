import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals'; // Importa as funções do Jest, usando ESM é necessário importar explicitamente
// Além disso é necessário importar o jest para usar mocks

// Mocks, serve para simular o comportamento dos repositórios e do bcrypt, sem usar dados reais
// mocks devem ser declarados antes dos imports que serão testados. Este código está comentado porque a sintaxe de mock para ESM é diferente
// CommonJs (dinâmico e síncrono):
// jest.mock('../src/repositories/userRepository.js', () => ({
//     VerifyEmailExists: jest.fn(),
//     createUser: jest.fn(),
//     findUserByEmail: jest.fn()
// }));

// unstable_mockModule para ESM || é um mock para módulos ES6. O unstable_mockModule cria um mock antes da importação do módulo real, sendo necessário 
// por que normalmente os imports são feitos no topo do arquivo, assim executando eles primeiro fazendo com que o mock falhe. Então o unstable_mockModule 
// permite criar o mock antes da importação do módulo real, já que imports são estáticos e resolvido antes de qualquer código rodar.
// Apenas utilize mocks em depêndencias que deseja simular, mas nunca no módulo que está sendo testado. Neste caso, o userService.js não deve ser mockado,
// o userService.js só deve ser mockado em outros testes que ele é uma depêndencia como testes no controller.

// Mock dos repositórios e dependências externas
jest.unstable_mockModule('../src/repositories/userRepository.js', () => ({
    VerifyEmailExists: jest.fn(),
    createUser: jest.fn(),
    findUserByEmail: jest.fn(),
    findUserByOauth: jest.fn(),
    createUserWithOauth: jest.fn(),
    findUserById: jest.fn(),
    findUserByIdEmail: jest.fn(),
    updateUserPassword: jest.fn(),
    changeUserStatusActive: jest.fn()
}));

jest.unstable_mockModule('bcryptjs', () => ({
    default: {
        hashSync: jest.fn((password) => {
            // Mock que simula um hash real
            return `$2a$10$hashed_${password}`;
        }),
        hash: jest.fn(async (password) => {
            // Mock que simula um hash real de forma assíncrona
            return `$2a$10$hashed_${password}`;
        }),
        compare: jest.fn(async (password, hash) => {
            // Mock que verifica se o hash corresponde à senha
            return hash === `$2a$10$hashed_${password}`;
        })
    }
}));

jest.unstable_mockModule('google-auth-library', () => ({
    OAuth2Client: jest.fn().mockImplementation(() => ({
        generateAuthUrl: jest.fn(() => 'https://mock.oauth.url'),
        getToken: jest.fn(async () => ({
            tokens: { id_token: 'mock_token' }
        })),
        verifyIdToken: jest.fn(async () => ({
            payload: { sub: 'google_sub_123', name: 'Google User' }
        }))
    }))
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
    default: {
        sign: jest.fn(() => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTIxNjU3N2U5ZjAxZTEwYTA4ZWI5MiIsImVtYWlsIjoidGVzdGUxOTZAZW1haWwuY29tIiwiaWF0IjoxNzc2NDI0NTM1LCJleHAiOjE3NzcwMjQ1MzV9.schkKITCCO22i3S2GjeaNEMXw4x3WLXsKEMuO0rEKvQ'),
        verify: jest.fn((token) => ({ id: '69e216577e9f01e10a08eb92', email: 'teste196@email.com' }))
    }
}));

jest.unstable_mockModule('../src/config/logger.js', () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

jest.unstable_mockModule('../src/config/nodemailer.js', () => ({
    transporter: {
        sendMail: jest.fn(async () => ({ messageId: 'mock_message_id' }))
    }
}));

jest.unstable_mockModule('../src/utils/redisLoginAttempts.js', () => ({
    getLoginAttempts: jest.fn(),
    incrementLoginAttempts: jest.fn(),
    resetLoginAttempts: jest.fn(),
    isLockedOut: jest.fn(),
    getResetPasswordToken: jest.fn(),
    setResetPasswordToken: jest.fn(),
    deleteResetPasswordToken: jest.fn()
}));

jest.unstable_mockModule('../src/utils/tokenGenerator.js', () => ({
    generateVerificationCode: jest.fn(() => '123456'),
    generateSecureToken: jest.fn(() => 'secure_token_random_32_bytes'),
    generateUUID: jest.fn(() => 'uuid-123-456-789')
}));

// Imports após mocks
const { 
    VerifyEmailExists, 
    createUser, 
    findUserByEmail,
    findUserByOauth,
    createUserWithOauth,
    findUserById,
    findUserByIdEmail,
    updateUserPassword,
    changeUserStatusActive
} = await import('../src/repositories/userRepository.js');

const bcrypt = await import('bcryptjs');
const { OAuth2Client } = await import('google-auth-library');
const jwt = await import('jsonwebtoken');
const { logger } = await import('../src/config/logger.js');
const { transporter } = await import('../src/config/nodemailer.js');

const {
    OauthRequestSignUp,
    OauthRequestSignIn,
    registerWithOauth,
    loginWithOauth,
    registerUser,
    loginUser,
    verifyEmail,
    resetPassword,
    requestPasswordReset,
    validatePasswordResetToken
} = await import('../src/services/userService.js');

const {
    getLoginAttempts,
    incrementLoginAttempts,
    resetLoginAttempts,
    isLockedOut,
    getResetPasswordToken,
    setResetPasswordToken,
    deleteResetPasswordToken
} = await import('../src/utils/redisLoginAttempts.js');

const {
    generateVerificationCode,
    generateSecureToken,
    generateUUID
} = await import('../src/utils/tokenGenerator.js');

const objUtill = {
    _id: '69e216577e9f01e10a08eb92',
    tokenJWT: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTIxNjU3N2U5ZjAxZTEwYTA4ZWI5MiIsImVtYWlsIjoidGVzdGUxOTZAZW1haWwuY29tIiwiaWF0IjoxNzc2NDI0NTM1LCJleHAiOjE3NzcwMjQ1MzV9.schkKITCCO22i3S2GjeaNEMXw4x3WLXsKEMuO0rEKvQ',
    email: 'teste196@email.com'
}

describe('User Service - OAuth', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GOOGLE_CLIENT_ID = 'test_client_id';
        process.env.GOOGLE_CLIENT_SECRET = 'test_client_secret';
        process.env.GOOGLE_REDIRECT_URL_SIGNUP = 'http://localhost/signup';
    });

    test('Deve gerar URL para signup com OAuth', () => {
        const ip = '192.168.1.1';
        const state = 'random_state_123';
        
        const url = OauthRequestSignUp(ip, state);
        
        expect(url).toBe('https://mock.oauth.url');
        expect(logger.debug).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve gerar URL para signin com OAuth', () => {
        const ip = '192.168.1.1';
        const state = 'random_state_456';
        
        const url = OauthRequestSignIn(ip, state);
        
        expect(url).toBe('https://mock.oauth.url');
    });

    test('Deve registrar usuário com OAuth quando não existe', async () => {
        const code = 'auth_code_123';
        const ip = '192.168.1.1';
        
        findUserByOauth.mockResolvedValue(null);
        createUserWithOauth.mockResolvedValue({
            _id: 'user_id_123',
            subGoogle: 'google_sub_123',
            name: 'Google User',
            autenticationType: 'google'
        });

        const result = await registerWithOauth(code, ip);

        expect(findUserByOauth).toHaveBeenCalledWith('google_sub_123');
        expect(createUserWithOauth).toHaveBeenCalledWith('google_sub_123', 'Google User');
        expect(result._id).toBe('user_id_123');
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve lançar erro ao tentar registrar com OAuth se usuário já existe', async () => {
        const code = 'auth_code_123';
        const ip = '192.168.1.1';
        
        findUserByOauth.mockResolvedValue({
            _id: 'user_id_existing',
            subGoogle: 'google_sub_123'
        });

        await expect(registerWithOauth(code, ip)).rejects.toThrow('Usuário existente');
    });

    test('Deve fazer login com OAuth quando usuário existe', async () => {
        const code = 'auth_code_123';
        const ip = '192.168.1.1';
        
        findUserByOauth.mockResolvedValue({
            _id: 'user_id_123',
            subGoogle: 'google_sub_123',
            name: 'Google User'
        });

        const result = await loginWithOauth(code, ip);

        expect(findUserByOauth).toHaveBeenCalledWith('google_sub_123');
        expect(result._id).toBe('user_id_123');
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve lançar erro ao fazer login com OAuth se usuário não existe', async () => {
        const code = 'auth_code_123';
        const ip = '192.168.1.1';
        
        findUserByOauth.mockResolvedValue(null);

        await expect(loginWithOauth(code, ip)).rejects.toThrow('Usuário não encontrado');
    });
});

describe('User Service - Register', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.EMAIL_VERIFICATION_SECRET = 'test_secret_123';
        process.env.SMTP_USER = 'test@email.com';
    });

    test('Deve registrar novo usuário com sucesso', async () => {
        const userData = {
            name: 'João Silva',
            email: 'joao@example.com',
            password: 'TestPass123!@#'
        };

        VerifyEmailExists.mockResolvedValue(null);
        createUser.mockResolvedValue({
            _id: 'user_id_123',
            name: userData.name,
            email: userData.email,
            password: '$2a$10$hashed_TestPass123!@#'
        });

        const result = await registerUser(userData.name, userData.email, userData.password, '192.168.1.1');

        expect(VerifyEmailExists).toHaveBeenCalledWith(userData.email);
        expect(createUser).toHaveBeenCalledWith(
            userData.name,
            userData.email,
            expect.stringContaining('hashed_')
        );
        expect(transporter.sendMail).toHaveBeenCalled();
        expect(result._id).toBe('user_id_123');
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve lançar erro quando email já existe', async () => {
        VerifyEmailExists.mockResolvedValue('existing@example.com');

        await expect(
            registerUser('João', 'existing@example.com', 'TestPass123!@#', '192.168.1.1')
        ).rejects.toThrow('Email existente');

        expect(createUser).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve enviar email de verificação com token correto', async () => {
        VerifyEmailExists.mockResolvedValue(null);
        createUser.mockResolvedValue({
            _id: 'user_id_456',
            name: 'Maria',
            email: 'maria@example.com'
        });

        await registerUser('Maria', 'maria@example.com', 'TestPass456!@#', '192.168.1.1');

        expect(jwt.default.sign).toHaveBeenCalledWith(
            { id: 'user_id_456', email: 'maria@example.com' },
            'test_secret_123',
            { expiresIn: 1000 * 60 * 10 }
        );
    });
});

describe('User Service - Login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve fazer login com email e senha corretos', async () => {
        const userData = {
            _id: 'user_id_123',
            email: 'user@example.com',
            password: '$2a$10$hashed_TestPass123!@#',
            isVerified: true
        };

        findUserByEmail.mockResolvedValue(userData);
        bcrypt.default.compare.mockResolvedValue(true);

        const result = await loginUser('user@example.com', 'TestPass123!@#', '192.168.1.1');

        expect(findUserByEmail).toHaveBeenCalledWith('user@example.com');
        expect(bcrypt.default.compare).toHaveBeenCalledWith('TestPass123!@#', userData.password);
        expect(result._id).toBe('user_id_123');
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve lançar erro quando email não existe', async () => {
        const { incrementLoginAttempts } = await import('../src/utils/redisLoginAttempts.js');
        findUserByEmail.mockResolvedValue(null);
        incrementLoginAttempts.mockResolvedValue({ attempts: 1 });

        await expect(
            loginUser('nonexistent@example.com', 'TestPass123!@#', '192.168.1.1')
        ).rejects.toThrow('Email ou senha incorretos');

        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve lançar erro quando senha está incorreta', async () => {
        const { incrementLoginAttempts } = await import('../src/utils/redisLoginAttempts.js');
        const userData = {
            _id: 'user_id_123',
            email: 'user@example.com',
            password: '$2a$10$hashed_WrongPass',
            isVerified: true
        };

        findUserByEmail.mockResolvedValue(userData);
        bcrypt.default.compare.mockResolvedValue(false);
        incrementLoginAttempts.mockResolvedValue({ attempts: 2 });

        await expect(
            loginUser('user@example.com', 'WrongPassword', '192.168.1.1')
        ).rejects.toThrow('Email ou senha incorretos');

        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve lançar erro quando email não foi verificado', async () => {
        const userData = {
            _id: 'user_id_123',
            email: 'user@example.com',
            password: '$2a$10$hashed_TestPass123!@#',
            isVerified: false
        };

        findUserByEmail.mockResolvedValue(userData);

        await expect(
            loginUser('user@example.com', 'TestPass123!@#', '192.168.1.1')
        ).rejects.toThrow('Email não verificado');
    });

    test('Deve lançar erro quando usuário está bloqueado por muitas tentativas', async () => {
        const { isLockedOut } = await import('../src/utils/redisLoginAttempts.js');
        isLockedOut.mockResolvedValue(true);

        await expect(
            loginUser('locked@example.com', 'TestPass123!@#', '192.168.1.1')
        ).rejects.toThrow('Usuário bloqueado por muitas tentativas');

        expect(logger.warn).toHaveBeenCalled();
    });
});

describe('User Service - Verify Email', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.EMAIL_VERIFICATION_SECRET = 'developmentSecret';
    });

    test('Deve verificar email com token válido', async () => {
        findUserByIdEmail.mockResolvedValue({
            _id: objUtill._id,
            email: objUtill.email,
        });
        changeUserStatusActive.mockResolvedValue({
            _id: objUtill._id,
            isVerified: true,
            status: 'active'
        });

        await verifyEmail(`${objUtill.tokenJWT}`, '192.168.1.1');

        expect(jwt.default.verify).toHaveBeenCalledWith(`${objUtill.tokenJWT}`, 'developmentSecret');
        expect(changeUserStatusActive).toHaveBeenCalledWith(`${objUtill._id}`);
        expect(logger.info).toHaveBeenCalledTimes(1);
    });

    test('Deve lançar erro quando token está ausente', async () => {
        await expect(
            verifyEmail(null, '192.168.1.1')
        ).rejects.toThrow('Token ausente');
    });

    test('Deve lançar erro quando token é inválido', async () => {
        jwt.default.verify.mockResolvedValue(() => {
            name: 'JsonWebTokenError'
            message: 'invalid token'
        });

        await expect(
            verifyEmail('invalid_token', '192.168.1.1')
        ).rejects.toThrow('Token inválido');
        expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    test('Deve lançar erro quando email já foi verificado', async () => {
        findUserByIdEmail.mockResolvedValue({
            _id: objUtill._id,
            email: objUtill.email,
            isVerified: true
        });

        jwt.default.verify.mockReturnValue({ id: objUtill._id, email: objUtill.email });

        await expect(verifyEmail(`${objUtill.tokenJWT}`, '192.168.1.1')).rejects.toThrow('Email já verificado');
        expect(logger.debug).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalledTimes(1);
        expect(changeUserStatusActive).toHaveBeenCalledTimes(0);
    });

    test('Deve lançar erro quando usuário não existe', async () => {
        findUserByIdEmail.mockResolvedValue(null);

        await expect(
            verifyEmail(objUtill.tokenJWT, '192.168.1.1')
        ).rejects.toThrow('Usuário não encontrado');
    });

    test('Deve lançar erro quando email do token não corresponde', async () => {
        const userData = {
            _id: 'user_id_123',
            email: 'other@example.com',
            isVerified: false
        };

        findUserByIdEmail.mockResolvedValue(userData);

        await expect(
            verifyEmail('mock_token_jwt', '192.168.1.1')
        ).rejects.toThrow('Token inválido');
    });
});

describe('User Service - Reset Password', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Deve alterar senha com sucesso', async () => {
        const userData = {
            _id: 'user_id_123',
            password: '$2a$10$hashed_OldPass123!@#'
        };

        findUserById.mockResolvedValue(userData);
        bcrypt.default.compare.mockResolvedValue(true);
        updateUserPassword.mockResolvedValue({
            ...userData,
            password: '$2a$10$hashed_NewPass456!@#'
        });

        const result = await resetPassword('NewPass456!@#', 'NewPass456!@#', 'OldPass123!@#', 'user_id_123', '192.168.1.1');

        expect(findUserById).toHaveBeenCalledWith('user_id_123');
        expect(bcrypt.default.compare).toHaveBeenCalledWith('OldPass123!@#', userData.password);
        expect(updateUserPassword).toHaveBeenCalledWith('user_id_123', expect.stringContaining('hashed_'));
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve lançar erro quando usuário não existe', async () => {
        findUserById.mockResolvedValue(null);

        await expect(
            resetPassword('NewPass456!@#', 'NewPass456!@#', 'OldPass123!@#', 'user_id_invalid', '192.168.1.1')
        ).rejects.toThrow('Usuário não encontrado');
    });

    test('Deve lançar erro quando senha atual está incorreta', async () => {
        const userData = {
            _id: 'user_id_123',
            password: '$2a$10$hashed_WrongPass'
        };

        findUserById.mockResolvedValue(userData);
        bcrypt.default.compare.mockResolvedValue(false);

        await expect(
            resetPassword('NewPass456!@#', 'NewPass456!@#', 'WrongPassword', 'user_id_123', '192.168.1.1')
        ).rejects.toThrow('Credenciais inválidas');

        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve lançar erro quando novas senhas não coincidem', async () => {
        const userData = {
            _id: 'user_id_123',
            password: '$2a$10$hashed_OldPass123!@#'
        };

        findUserById.mockResolvedValue(userData);
        bcrypt.default.compare.mockResolvedValue(true);

        await expect(
            resetPassword('NewPass456!@#', 'DifferentPass789!@#', 'OldPass123!@#', 'user_id_123', '192.168.1.1')
        ).rejects.toThrow('As senhas não coincidem');
    });

    test('Deve lançar erro quando nova senha é igual à senha atual', async () => {
        const userData = {
            _id: 'user_id_123',
            password: '$2a$10$hashed_SamePass123!@#'
        };

        findUserById.mockResolvedValue(userData);
        bcrypt.default.compare.mockResolvedValue(true);

        await expect(
            resetPassword('SamePass123!@#', 'SamePass123!@#', 'SamePass123!@#', 'user_id_123', '192.168.1.1')
        ).rejects.toThrow('A nova senha deve ser diferente da senha atual');
    });
});

describe('User Service - Request Password Reset', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.RESET_PASSWORD_SECRET = 'test_reset_secret';
        process.env.SMTP_USER = 'test@email.com';
    });

    test('Deve solicitar reset de senha com sucesso', async () => {
        const userData = {
            _id: 'user_id_123',
            name: 'João Silva',
            email: 'joao@example.com'
        };

        findUserByEmail.mockResolvedValue(userData);

        const result = await requestPasswordReset('joao@example.com', '192.168.1.1');

        expect(findUserByEmail).toHaveBeenCalledWith('joao@example.com');
        expect(generateVerificationCode).toHaveBeenCalled();
        expect(jwt.default.sign).toHaveBeenCalledWith(
            { id: userData._id, email: userData.email },
            'test_reset_secret',
            { expiresIn: 1000 * 60 * 15 }
        );
        expect(setResetPasswordToken).toHaveBeenCalled();
        expect(transporter.sendMail).toHaveBeenCalled();
        expect(result.message).toBe('Email de reset de senha enviado com sucesso');
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve incluir código e token no email enviado', async () => {
        const userData = {
            _id: 'user_id_456',
            name: 'Maria',
            email: 'maria@example.com'
        };

        findUserByEmail.mockResolvedValue(userData);

        await requestPasswordReset('maria@example.com', '192.168.1.1');

        expect(transporter.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'maria@example.com',
                subject: 'Solicitação de Reset de Senha',
                html: expect.stringContaining('123456')
            })
        );
    });

    test('Deve lançar erro quando email não existe', async () => {
        findUserByEmail.mockResolvedValue(null);

        await expect(
            requestPasswordReset('nonexistent@example.com', '192.168.1.1')
        ).rejects.toThrow('Email não encontrado');

        expect(transporter.sendMail).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve armazenar token e código no Redis', async () => {
        const userData = {
            _id: 'user_id_789',
            name: 'Carlos',
            email: 'carlos@example.com'
        };

        findUserByEmail.mockResolvedValue(userData);

        await requestPasswordReset('carlos@example.com', '192.168.1.1');

        expect(setResetPasswordToken).toHaveBeenCalledWith(
            'carlos@example.com',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTIxNjU3N2U5ZjAxZTEwYTA4ZWI5MiIsImVtYWlsIjoidGVzdGUxOTZAZW1haWwuY29tIiwiaWF0IjoxNzc2NDI0NTM1LCJleHAiOjE3NzcwMjQ1MzV9.schkKITCCO22i3S2GjeaNEMXw4x3WLXsKEMuO0rEKvQ',
            '123456'
        );
    });
});

describe('User Service - Validate Password Reset Token', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.RESET_PASSWORD_SECRET = 'test_reset_secret';
    });

    test('Deve resetar senha com token e código válidos', async () => {
        const userData = {
            _id: 'user_id_123',
            email: 'user@example.com'
        };

        const storedData = {
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTIxNjU3N2U5ZjAxZTEwYTA4ZWI5MiIsImVtYWlsIjoidGVzdGUxOTZAZW1haWwuY29tIiwiaWF0IjoxNzc2NDI0NTM1LCJleHAiOjE3NzcwMjQ1MzV9.schkKITCCO22i3S2GjeaNEMXw4x3WLXsKEMuO0rEKvQ',
            code: '123456'
        };

        findUserByEmail.mockResolvedValue(userData);
        getResetPasswordToken.mockResolvedValue(storedData);
        jwt.default.verify.mockImplementationOnce(() => ({
            id: userData._id,
            email: userData.email
        }));
        updateUserPassword.mockResolvedValue({ ...userData, password: '$2a$10$hashed_NewPass789!@#' });
        deleteResetPasswordToken.mockResolvedValue(null);

        const result = await validatePasswordResetToken(
            storedData.token,
            storedData.code,
            'NewPass789!@#',
            'NewPass789!@#',
            'user@example.com',
            '192.168.1.1'
        );

        expect(findUserByEmail).toHaveBeenCalledWith('user@example.com');
        expect(getResetPasswordToken).toHaveBeenCalledWith('user@example.com');
        expect(updateUserPassword).toHaveBeenCalledWith(userData._id, expect.stringContaining('hashed_'));
        expect(deleteResetPasswordToken).toHaveBeenCalledWith('user@example.com');
        expect(result.message).toBe('Senha resetada com sucesso');
        expect(logger.info).toHaveBeenCalled();
    });

    test('Deve lançar erro quando senhas não coincidem', async () => {
        const userData = {
            _id: 'user_id_123',
            email: 'user@example.com'
        };

        findUserByEmail.mockResolvedValue(userData);

        await expect(
            validatePasswordResetToken(
                'token_123',
                '123456',
                'NewPass789!@#',
                'DifferentPass789!@#',
                'user@example.com',
                '192.168.1.1'
            )
        ).rejects.toThrow('As senhas não coincidem');

        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve lançar erro quando código é inválido', async () => {
        const userData = {
            _id: 'user_id_123',
            email: 'user@example.com'
        };

        const storedData = {
            token: 'valid_token',
            code: '654321'
        };

        findUserByEmail.mockResolvedValue(userData);
        getResetPasswordToken.mockResolvedValue(storedData);

        await expect(
            validatePasswordResetToken(
                storedData.token,
                '123456', // código diferente
                'NewPass789!@#',
                'NewPass789!@#',
                'user@example.com',
                '192.168.1.1'
            )
        ).rejects.toThrow('Código de verificação inválido');

        expect(logger.warn).toHaveBeenCalled();
        expect(updateUserPassword).not.toHaveBeenCalled();
    });

    test('Deve lançar erro quando token expirou', async () => {
        const userData = {
            _id: 'user_id_123',
            email: 'user@example.com'
        };

        findUserByEmail.mockResolvedValue(userData);
        getResetPasswordToken.mockResolvedValue(null); // Token não encontrado no Redis

        await expect(
            validatePasswordResetToken(
                'expired_token',
                '123456',
                'NewPass789!@#',
                'NewPass789!@#',
                'user@example.com',
                '192.168.1.1'
            )
        ).rejects.toThrow('Token expirado ou inválido');

        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve lançar erro quando token JWT é inválido', async () => {
        const userData = {
            _id: 'user_id_123',
            email: 'user@example.com'
        };

        const storedData = {
            token: 'invalid_jwt_token',
            code: '123456'
        };

        findUserByEmail.mockResolvedValue(userData);
        getResetPasswordToken.mockResolvedValue(storedData);
        jwt.default.verify.mockImplementationOnce(() => {
            throw new Error('Token inválido');
        });

        await expect(
            validatePasswordResetToken(
                storedData.token,
                storedData.code,
                'NewPass789!@#',
                'NewPass789!@#',
                'user@example.com',
                '192.168.1.1'
            )
        ).rejects.toThrow('Token inválido ou expirado');

        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve lançar erro quando usuário não existe', async () => {
        findUserByEmail.mockResolvedValue(null);

        await expect(
            validatePasswordResetToken(
                'token_123',
                '123456',
                'NewPass789!@#',
                'NewPass789!@#',
                'nonexistent@example.com',
                '192.168.1.1'
            )
        ).rejects.toThrow('Usuário não encontrado');

        expect(logger.warn).toHaveBeenCalled();
    });
});
