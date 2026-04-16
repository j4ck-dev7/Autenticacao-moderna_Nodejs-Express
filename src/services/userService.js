import { findUserByEmail, VerifyEmailExists, createUser, findUserByOauth, createUserWithOauth, findUserById, updateUserPassword } from "../repositories/userRepository.js";
import bcrypt from "bcryptjs";
import { OAuth2Client } from 'google-auth-library'
import { logger } from "../config/logger.js";
import jwt from "jsonwebtoken";
import { transporter } from "../config/nodemailer.js";
import session from "express-session";

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
    logger.debug('Iniciando processo de login', {
        usuarioId: 'Desconecido',
        ip
    });

    const user = await findUserByEmail(email);
    if (!user) {
        logger.warn('Tentativa de login com email não registrado', { 
            usuarioId: 'Desconecido',
            ip
        });
        
        throw new Error('Email ou senha incorretos');
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
        logger.warn('Tentativa de login com senha incorreta', { 
            usuarioId: user._id,
            ip
        });
        throw new Error('Email ou senha incorretos');
    }

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

    const user = await findUserById(decoded.id);
    if (!user) {
        logger.warn('Usuário não encontrado para token de verificação de email', {
            usuarioId: 'Desconecido',
            ip,
        });
        throw new Error('Usuário não encontrado');
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