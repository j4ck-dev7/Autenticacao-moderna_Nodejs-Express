import { findUserByEmail, VerifyEmailExists, createUser, findUserByOauth, createUserWithOauth } from "../repositories/userRepository.js";
import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";
import { OAuth2Client } from 'google-auth-library'

export const OauthRequest = () => {
    const state =  CryptoJS.SHA256('testGoogle').toString(CryptoJS.enc.Hex);

    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL,
    );

    const authorizationUrl = client.generateAuthUrl({
        access_type: 'offline',
        state,
        scope: ['https://www.googleapis.com/auth/userinfo.profile'],
        include_granted_scopes: true
    });

    return authorizationUrl
};

export const registerWithOauth = async (code) => {
    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL,
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
}

export const registerUser = async (name, email, password) => {
    const emailExists = await VerifyEmailExists(email);
    if (emailExists) {
        throw new Error('Email existente');
    }

    const passwordHash = bcrypt.hashSync(password);

    return await createUser(name, email, passwordHash);
}

export const loginUser = async (email, password) => {
    const user = await findUserByEmail(email);
    if (!user) {
        throw new Error('Email ou senha incorretos');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        throw new Error('Email ou senha incorretos');
    }

    return user;
}