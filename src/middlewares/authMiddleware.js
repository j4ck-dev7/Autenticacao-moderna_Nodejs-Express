import { logger } from '../config/logger.js';

export const Auth = (req, res, next) => {
    const session = req.session.user;
    console.log(session)
    console.log(req.session.user)
    try {
        if(!req.session.user) { 
            logger.info('Acesso negado - token de autenticação ausente', {
                usuarioId: 'Desconhecido',
                ip: req.ip
            });

            return res.status(401).json({ message: 'Logue ou registre-se para acessar' }) 
        }

        logger.info('Acesso autorizado - token de autenticação válido', {
            usuarioId: req.session.user,
            ip: req.ip
        });

        next();
    } catch (error) {
        logger.error('Token de autenticação inválido', error, {
            usuarioId: req.session.user || 'Desconecido',
            ip: req.ip
        })

        res.status(401).json({ message: 'Erro Interno' });    
    }
}