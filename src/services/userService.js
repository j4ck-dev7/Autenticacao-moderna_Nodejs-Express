import { 
    findUserByEmail, 
    VerifyEmailExists, 
    createUser, 
    findUserByOauth, 
    createUserWithOauth, 
    findUserById, 
    updateUserPassword, 
    findUserByIdEmail, 
    changeUserStatusActive
} from "../repositories/userRepository.js";

import bcrypt from "bcryptjs";
import { OAuth2Client } from 'google-auth-library'
import { logger } from "../config/logger.js";
import jwt from "jsonwebtoken";
import { transporter } from "../config/nodemailer.js";
import { generateVerificationCode } from "../utils/tokenGenerator.js";
import { setResetPasswordToken, deleteResetPasswordToken, getResetPasswordToken } from "../utils/redisLoginAttempts.js";
import { incrementLoginAttempts, resetLoginAttempts, isLockedOut, getLoginAttempts } from "../utils/redisLoginAttempts.js";

export const OauthRequestSignUp = (ip, state) => {
    logger.debug('Iniciando processo de geração de url para autenticação Oauth', { 
        usuarioId: 'Desconecido',
        ip
    });

    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL_SIGNUP,
    );

    const authorizationUrl = client.generateAuthUrl({
        access_type: 'offline',
        state,
        scope: ['https://www.googleapis.com/auth/userinfo.profile'],
        include_granted_scopes: true
    });

    logger.info('URL para autenticação Oauth gerada com sucesso', { 
        usuarioId: 'Desconecido',
        ip
    });

    return authorizationUrl
};

export const OauthRequestSignIn = (ip, state) => {
    logger.debug('Iniciando processo de geração de url para autenticação Oauth', { 
        usuarioId: 'Desconecido',
        ip
    });

    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL_SIGNIN,
    );

    const authorizationUrl = client.generateAuthUrl({
        access_type: 'offline',
        state,
        scope: ['https://www.googleapis.com/auth/userinfo.profile'],
        include_granted_scopes: true
    });

    logger.info('URL para autenticação Oauth gerada com sucesso', { 
        usuarioId: 'Desconecido',
        ip
    });
    return authorizationUrl
};

export const registerWithOauth = async (code, ip) => {
    logger.debug('Iniciando processo de registro com Oauth', {
        usuarioId: 'Desconecido',
        ip
    });

    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL_SIGNUP,
    );

    const { tokens } = await client.getToken(code)

    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
    });

    const { sub, name } = ticket.payload

    const userExists = await findUserByOauth(sub);
    if (userExists) {
        throw new Error('Usuário existente');
    }

    const user = await createUserWithOauth(sub, name);
    logger.info('Usuário registrado com Oauth com sucesso', { usuarioId: user.subGoogle, ip });

    return user;
};

export const loginWithOauth = async (code, ip) => {
    logger.debug('Iniciando processo de login com Oauth', {
        usuarioId: 'Desconecido',
        ip
    });

    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL_SIGNIN,
    );

    const { tokens } = await client.getToken(code)

    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
    });

    const { sub } = ticket.payload

    const userExists = await findUserByOauth(sub);
    if (!userExists) {
        logger.warn('Tentativa de login com Oauth para usuário não registrado', {
            usuarioId: 'Desconecido',
            ip
        });
        throw new Error('Usuário não encontrado');
    }
    logger.info('Usuário logado com Oauth com sucesso', {
        usuarioId: userExists.subGoogle,
        ip
    });

    return userExists;
}

export const registerUser = async (name, email, password, ip) => {
    logger.debug('Iniciando processo de registro de usuário', { email, ip });

    const emailExists = await VerifyEmailExists(email);
    if (emailExists) {
        logger.warn('Tentativa de registro com email já existente', { 
            usuarioId: 'Desconecido',
            ip
        });
        throw new Error('Email existente');
    }

    const passwordHash = await bcrypt.hashSync(password);
 
    const user = await createUser(name, email, passwordHash);
    logger.info('Usuário registrado com sucesso', { email, usuarioId: user._id, ip });

    const token = jwt.sign({ id: user._id, email: email }, process.env.EMAIL_VERIFICATION_SECRET, { expiresIn: 1000 * 60 * 10 });
    const verificationLink = `http://localhost:5000/api/user/verify-email?token=${token}`;
    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Verificação de Email',
        html: `<p>Olá ${name},</p>
               <p>Obrigado por se registrar. Por favor, clique no link abaixo para verificar seu email:</p>
               <a href="${verificationLink}">Verificar Email</a>
               <p>Este link expira em 10 minutos.</p>`
    })

    logger.info('Email de verificação enviado com sucesso', { email, usuarioId: user._id, ip });

    return user;
}

export const loginUser = async (email, password, ip) => {
    const inicio = Date.now();
    
    logger.debug('Iniciando processo de login', {
        usuarioId: 'Desconecido',
        ip
    });

    // Verificar se o usuário está bloqueado por muitas tentativas de login
    const locked = await isLockedOut(email);
    if (locked) {
        logger.warn('Tentativa de login para usuário bloqueado por muitas tentativas', {
            usuarioId: 'Desconecido',
            email,
            ip
        });

        throw new Error('Usuário bloqueado por muitas tentativas');
    }

    const user = await findUserByEmail(email);
    if (!user) {
        const duracao = Date.now() - inicio;
        const loginAttemps = await incrementLoginAttempts(email);
        
        logger.warn('Tentativa de login com credenciais incorretas', {
            usuarioId: 'Desconecido',
            email,
            ip,
            tentativas: loginAttemps.attempts,
            duracao: `${duracao}ms`
        });
        
        const error = new Error('Email ou senha incorretos');
        error.attempts = loginAttemps.attempts;
        error.remainingAttempts = 5 - loginAttemps.attempts;
        throw error;
    }

    if(!user.isVerified){
        logger.warn('Tentativa de login com email não verificado', {
            usuarioId: user._id,
            ip
        });

        throw new Error('Email não verificado');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        const duracao = Date.now() - inicio;
        const loginAttemps = await incrementLoginAttempts(email);
        
        logger.warn('Tentativa de login com credenciais incorretas', {
            usuarioId: 'Desconecido',
            email,
            ip,
            tentativas: loginAttemps.attempts,
            duracao: `${duracao}ms`
        });

        const error = new Error('Email ou senha incorretos');
        error.attempts = loginAttemps.attempts;
        error.remainingAttempts = 5 - loginAttemps.attempts;
        throw error;
    }

    // Resetar tentativas de login ao sucesso
    await resetLoginAttempts(email);

    logger.info('Usuário logado com sucesso', { 
        usuarioId: user._id,
        ip
    });
    return user;
}

export const verifyEmail = async (token, ip) => {
    logger.debug('Iniciando processo de verificação de email', {
        usuarioId: 'Desconecido',
        ip,
    });

    if(!token){
        logger.warn('Tentativa de verificação de email sem token', {
            usuarioId: 'Desconecido',
            ip,
        });
        throw new Error('Token ausente');
    }

    const decoded = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET);
    if (!decoded) {
        logger.warn('Token de verificação de email inválido', {
            usuarioId: 'Desconecido',
            ip,
        });
        throw new Error('Token inválido');
    }

    const user = await findUserByIdEmail(decoded.id);
    if (!user) {
        logger.warn('Usuário não encontrado para token de verificação de email', {
            usuarioId: 'Desconecido',
            ip,
        });
        throw new Error('Usuário não encontrado');
    };

    if(user.email !== decoded.email) {
        logger.warn('Token de verificação de email não corresponde ao usuário', {
            usuarioId: user._id,
            ip,
        });
        throw new Error('Token inválido');
    }

    if (user.isVerified) {
        logger.info('Email já verificado', {
            usuarioId: user._id,
            ip,
        });
        throw new Error('Email já verificado');
    }

    await changeUserStatusActive(user._id);
    logger.info('Email do usuário verificado com sucesso', {
        usuarioId: user._id,
        ip,
    });

    return user;
}

export const resetPassword = async (newPassword, confirmPassword, password, id, ip) => {
    logger.debug('Iniciando processo de reset de senha', { usuarioId: id });

    const findUser = await findUserById(id);
    if(!findUser) {
        throw new Error('Usuário não encontrado');
    };

    const passwordMatch = await bcrypt.compare(password, findUser.password);
    if (!passwordMatch) {
        logger.warn('Tentativa de reset de senha com senha atual incorreta', {
            usuarioId: id, 
            ip
        });
        throw new Error('Credenciais inválidas');
    };

    if (newPassword !== confirmPassword) {
        throw new Error('As senhas não coincidem');
    };

    if (password === newPassword) {
        throw new Error('A nova senha deve ser diferente da senha atual');
    }

    const newPasswordHash = await bcrypt.hashSync(newPassword);

    const updatePassword = await updateUserPassword(id, newPasswordHash);
    logger.info('Senha do usuário atualizada com sucesso', { usuarioId: id });
    
    return updatePassword;
}

export const requestPasswordReset = async (email, ip) => {
    logger.debug('Iniciando processo de solicitação de reset de senha', { 
        usuarioId: 'Desconecido', 
        email,
        ip
    });

    const user = await findUserByEmail(email);
    if (!user) {
        logger.warn('Solicitação de reset de senha para email não registrado', {
            usuarioId: 'Desconecido',
            email,
            ip
        });
        throw new Error('Email não encontrado');
    }

    const verificationCode = generateVerificationCode();
    const resetToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.RESET_PASSWORD_SECRET,
        { expiresIn: 1000 * 60 * 15 }
    );

    await setResetPasswordToken(email, resetToken, verificationCode);

    const resetLink = `Código de verificação: ${verificationCode}`;
    
    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Solicitação de Reset de Senha',
        html: `<p>Olá ${user.name},</p>
               <p>Recebemos uma solicitação para resetar sua senha. Use o código abaixo para prosseguir com o reset:</p>
               <p><strong>Código de Verificação: ${verificationCode}</strong></p>
               <p>Este código expira em 15 minutos.</p>
               <p>Se você não solicitou este reset, ignore este email.</p>
               <p><strong>Token de Segurança:</strong> ${resetToken}</p>`
    });

    logger.info('Email de reset de senha enviado com sucesso', { 
        usuarioId: user._id, 
        email,
        ip
    });

    return { message: 'Email de reset de senha enviado com sucesso' };
}

export const validatePasswordResetToken = async (token, code, newPassword, confirmPassword, email, ip) => {
    logger.debug('Iniciando processo de validação de token de reset de senha', {
        usuarioId: 'Desconecido',
        email,
        ip
    });

    if (newPassword !== confirmPassword) {
        logger.warn('Senhas não coincidem no reset de senha', {
            usuarioId: 'Desconecido',
            email,
            ip
        });
        throw new Error('As senhas não coincidem');
    }

    const user = await findUserByEmail(email);
    if (!user) {
        logger.warn('Usuário não encontrado para validação de reset de senha', {
            usuarioId: 'Desconecido',
            email,
            ip
        });
        throw new Error('Usuário não encontrado');
    }

    // Recuperar dados armazenados no Redis
    const storedData = await getResetPasswordToken(email);
    if (!storedData) {
        logger.warn('Token de reset de senha expirado ou não encontrado', {
            usuarioId: user._id,
            email,
            ip
        });
        throw new Error('Token expirado ou inválido');
    }

    // Validar código de verificação
    if (storedData.code !== code) {
        logger.warn('Código de verificação inválido no reset de senha', {
            usuarioId: user._id,
            email,
            ip
        });
        throw new Error('Código de verificação inválido');
    }

    try {
        const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
        if (decoded.id !== user._id.toString() || decoded.email !== email) {
            logger.warn('Token de reset de senha inválido (dados inconsistentes)', {
                usuarioId: user._id,
                email,
                ip
            });
            throw new Error('Token inválido');
        }
    } catch (error) {
        logger.warn('Erro ao verificar token de reset de senha', {
            usuarioId: user._id,
            email,
            ip,
            erro: error.message
        });
        throw new Error('Token inválido ou expirado');
    }

    await deleteResetPasswordToken(email);

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(user._id, newPasswordHash);

    logger.info('Senha do usuário resetada com sucesso', { 
        usuarioId: user._id, 
        email,
        ip
    });

    return { message: 'Senha resetada com sucesso' };
}