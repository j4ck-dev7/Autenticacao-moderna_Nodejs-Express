import client from "../config/redis.js";
import { logger } from "../config/logger.js";

const getKey = (userId) => `user_sessions:${userId}`;
const SESSION_PREFIX = 'session:';

export const addUserSession = async (userId, sessionId) => {
    try {
        const key = getKey(userId);
        await client.sAdd(key, sessionId);
        // Sincroniza o TTL com o TTL das sessões (300s configurado no RedisStore)
        await client.expire(key, 300);

        logger.debug('Sessão adicionada ao conjunto do usuário no Redis', { usuarioId: userId, sessionId });
    } catch (error) {
        logger.error('Erro ao adicionar sessão do usuário no Redis', error, { usuarioId: userId, sessionId });
    }
};

export const removeUserSession = async (userId, sessionId) => {
    try {
        const key = getKey(userId);
        await client.sRem(key, sessionId);
        logger.debug('Sessão removida do conjunto do usuário no Redis', { usuarioId: userId, sessionId });
    } catch (error) {
        logger.error('Erro ao remover sessão do usuário no Redis', error, { usuarioId: userId, sessionId });
    }
};

export const revokeAllUserSessions = async (userId) => {
    try {
        const key = getKey(userId);
        const sessions = await client.sMembers(key);
        if (!sessions || sessions.length === 0) {
            logger.debug('Nenhuma sessão encontrada para revogação', { usuarioId: userId });
            return;
        }

        const keys = sessions.map(sid => `${SESSION_PREFIX}${sid}`);

        // Deleta as chaves de sessão no Redis
        await client.del(...keys);
        // Remove o conjunto que mapeia as sessões do usuário
        await client.del(key);

        logger.info('Sessões do usuário revogadas com sucesso', { usuarioId: userId, revokedSessionsCount: sessions.length });
    } catch (error) {
        logger.error('Erro ao revogar sessões do usuário no Redis', error, { usuarioId: userId });
        throw error;
    }
};