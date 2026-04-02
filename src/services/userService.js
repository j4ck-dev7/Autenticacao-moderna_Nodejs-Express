import { findUserByEmail, VerifyEmailExists, createUser, findUserByOauth, createUserWithOauth, findUserById, updateUserPassword } from "../repositories/userRepository.js";
import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";
import { OAuth2Client } from 'google-auth-library'
import { logger } from "../config/logger.js";

export const OauthRequestSignUp = (ip) => {
    logger.debug('Iniciando processo de geração de url para autenticação Oauth', { 
        usuarioId: 'Desconecido',
        ip
    });

    const state =  CryptoJS.SHA256('testGoogle').toString(CryptoJS.enc.Hex);

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

    return authorizationUrl
};

export const OauthRequestSignIn = (ip) => {
    logger.debug('Iniciando processo de geração de url para autenticação Oauth', { 
        usuarioId: 'Desconecido',
        ip
    });

    const state =  CryptoJS.SHA256('testGoogle').toString(CryptoJS.enc.Hex);

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

    return await createUserWithOauth(sub, name);
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
        throw new Error('Usuário não encontrado');
    }

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

    return await createUser(name, email, passwordHash);
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

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        logger.warn('Tentativa de login com senha incorreta', { 
            usuarioId: user._id,
            ip
        });
        throw new Error('Email ou senha incorretos');
    }

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
    
    return updatePassword;
}