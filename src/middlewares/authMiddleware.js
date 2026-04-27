import { logger } from '../config/logger.js';
import { findUserByIdVerified } from '../repositories/userRepository.js';

export const Auth = async (req, res, next) => {
    try {
        if(!req.session?.user) { 
            logger.info('Acesso negado - token de autenticação ausente', {
                usuarioId: 'Desconhecido',
                ip: req.ip
            });

            return res.status(401).json({ message: 'Logue ou registre-se para acessar' }) 
        }

        const usuario = await findUserByIdVerified(req.session.user);

        if(!usuario) {
            logger.info('Acesso negado - usuário não encontrado', {
                usuarioId: req.session.user,
                ip: req.ip
            });

            return res.status(401).json({ message: 'Usuário não encontrado' });
        }

        const sessionVersion = typeof req.session.version !== 'undefined' ? req.session.version : 0;
        if (usuario.sessionVersion !== sessionVersion) {
            if (typeof req.session.destroy === 'function') {
                req.session.destroy(() => {});
            }

            logger.info('Acesso negado - sessão expirada ou inválida', {
                usuarioId: req.session.user,
                ip: req.ip
            });

            return res.status(401).json({ message: 'Sessão expirada, faça login novamente' });
        }

        if (!usuario.isVerified) {
            logger.info('Acesso negado - usuário não verificado', {
                usuarioId: req.session.user,
                ip: req.ip
            });

            return res.status(401).json({ message: 'Acesso negado. Verifique sua conta.' });
        }

        logger.info('Acesso autorizado - token de autenticação válido', {
            usuarioId: req.session.user,
            ip: req.ip
        });

        next();
    } catch (error) {
        logger.error('Token de autenticação inválido', error, {
            usuarioId: req.session?.user || 'Desconecido',
            ip: req.ip
        })

        res.status(401).json({ message: 'Erro Interno' });    
    }
}