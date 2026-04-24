import crypto from 'node:crypto';

/**
 * Gera um código de 6 dígitos aleatório
 * @returns {string} Código de 6 dígitos
 */
export const generateVerificationCode = () => {
    return crypto.randomInt(100000, 999999).toString();
};

/**
 * Gera um token aleatório seguro
 * @returns {string} Token aleatório em hexadecimal
 */
export const generateSecureToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Gera um UUID v4
 * @returns {string} UUID v4
 */
export const generateUUID = () => {
    return crypto.randomUUID();
};
