import jwt from 'jsonwebtoken'
import { logger } from '../config/logger.js';

export const Auth = (req, res, next) => {
    const session = req.session.user
    if(!session){ 
        logger.info('Acesso negado - token de autenticação ausente', {
            usuarioId: 'Desconecido',
            ip: req.ip
        });

        return res.status(401).json({ message: 'Logue ou registre-se para acessar' }) 
    }
    
    try {
        const userVeriefied = jwt.verify(cookie, process.env.SECRET);
        req.user = userVeriefied;

        logger.info('Acesso autorizado - token de autenticação válido', {
            usuarioId: req.user._id,
            ip: req.ip
        });

        next();
    } catch (error) {
        logger.error('Token de autenticação inválido', error, {
            usuarioId: 'Desconecido',
            ip: req.ip
        })

        res.status(500).json({ message: 'Erro Interno' });    
    }
}