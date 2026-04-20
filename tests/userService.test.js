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
    resetPassword
} = await import('../src/services/userService.js');

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
        findUserByEmail.mockResolvedValue(null);

        await expect(
            loginUser('nonexistent@example.com', 'TestPass123!@#', '192.168.1.1')
        ).rejects.toThrow('Email ou senha incorretos');

        expect(logger.warn).toHaveBeenCalled();
    });

    test('Deve lançar erro quando senha está incorreta', async () => {
        const userData = {
            _id: 'user_id_123',
            email: 'user@example.com',
            password: '$2a$10$hashed_WrongPass',
            isVerified: true
        };

        findUserByEmail.mockResolvedValue(userData);
        bcrypt.default.compare.mockResolvedValue(false);

        await expect(
            loginUser('user@example.com', 'WrongPassword', '192.168.1.1')
        ).rejects.toThrow('Email ou senha incorretos');
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
