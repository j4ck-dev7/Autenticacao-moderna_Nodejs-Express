import client from "../config/redis.js";
import { logger } from "../config/logger.js";

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_SECONDS = 15 * 60; // 15 minutos

export const getLoginAttempts = async (email) => {
    try {
        const key = `login_attempts:${email}`;
        const data = await client.get(key);
        
        if (!data) {
            return { attempts: 0, lastAttempt: null };
        }
        
        return JSON.parse(data);
    } catch (error) {
        logger.error('Erro ao recuperar tentativas de login do Redis', error, {
            usuarioId: 'Desconecido',
            email
        });
        return { attempts: 0, lastAttempt: null };
    }
};

export const incrementLoginAttempts = async (email) => {
    try {
        const key = `login_attempts:${email}`;
        const current = await getLoginAttempts(email);
        
        const newData = {
            attempts: current.attempts + 1,
            lastAttempt: new Date().toISOString(),
            email
        };
        
        await client.setEx(key, ATTEMPT_WINDOW_SECONDS, JSON.stringify(newData));
        
        logger.debug('Tentativa de login registrada no Redis', {
            usuarioId: 'Desconecido',
            email,
            tentativas: newData.attempts
        });
        
        return newData;
    } catch (error) {
        logger.error('Erro ao incrementar tentativas de login no Redis', error, {
            usuarioId: 'Desconecido',
            email
        });
        throw error;
    }
};

export const resetLoginAttempts = async (email) => {
    try {
        const key = `login_attempts:${email}`;
        await client.del(key);
        
        logger.debug('Tentativas de login resetadas no Redis', {
            usuarioId: 'Desconecido',
            email
        });
    } catch (error) {
        logger.error('Erro ao resetar tentativas de login no Redis', error, {
            usuarioId: 'Desconecido',
            email
        });
        throw error;
    }
};

export const isLockedOut = async (email) => {
    try {
        const attempts = await getLoginAttempts(email);
        return attempts.attempts >= MAX_ATTEMPTS;
    } catch (error) {
        logger.error('Erro ao verificar bloqueio de login no Redis', error, {
            usuarioId: 'Desconecido',
            email
        });
        return false;
    }
};

export const getResetPasswordToken = async (email) => {
    try {
        const key = `reset_password_token:${email}`;
        const data = await client.get(key);
        
        if (!data) {
            return null;
        }
        
        return JSON.parse(data);
    } catch (error) {
        logger.error('Erro ao recuperar token de reset de senha do Redis', error, {
            usuarioId: 'Desconecido',
            email
        });
        return null;
    }
};

export const setResetPasswordToken = async (email, token, code) => {
    try {
        const key = `reset_password_token:${email}`;
        const data = {
            token,
            code,
            createdAt: new Date().toISOString()
        };
        
        await client.setEx(key, 60 * 15, JSON.stringify(data));
        
        logger.debug('Token de reset de senha armazenado no Redis', {
            usuarioId: 'Desconecido',
            email
        });
    } catch (error) {
        logger.error('Erro ao armazenar token de reset de senha no Redis', error, {
            usuarioId: 'Desconecido',
            email
        });
        throw error;
    }
};

export const deleteResetPasswordToken = async (email) => {
    try {
        const key = `reset_password_token:${email}`;
        await client.del(key);
        
        logger.debug('Token de reset de senha deletado do Redis', {
            usuarioId: 'Desconecido',
            email
        });
    } catch (error) {
        logger.error('Erro ao deletar token de reset de senha do Redis', error, {
            usuarioId: 'Desconecido',
            email
        });
        throw error;
    }
};
