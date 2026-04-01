import { registerUser, loginUser, registerWithOauth, OauthRequestSignIn, OauthRequestSignUp, loginWithOauth, resetPassword } from "../services/userService.js";
import jwt from 'jsonwebtoken';
import { logger } from "../config/logger.js";

export const getOauthUrlSignUp = async (req, res) => {
    const inicio = Date.now();
    const { ip } = req;

    try {
        const url = await OauthRequestSignUp(ip);

        logger.debug('Url para autenticação Oauth gerada com sucesso', { 
            usuarioId: 'Desconecido',
            ip
        });

        res.status(200).json({ url })
    } catch (error) {
        const duracao = Date.now() - inicio;
        logger.error('Erro ao gerar url para autenticação Oauth', error, {
            usuarioId: 'Desconecido',
            ip,
            duracao
        });

        res.status(500).json({ message: 'Erro ao gerar url para autenticação Oauth' })
    }
}

export const getOauthUrlSignIn = async (req, res) => {
    const inicio = Date.now();
    const { ip } = req;

    try {
        const url = await OauthRequestSignIn(ip);

        logger.debug('Url para autenticação Oauth gerada com sucesso', { 
            usuarioId: 'Desconecido',
            ip
        });

        res.status(200).json({ url })
    } catch (error) {
        const duracao = Date.now() - inicio;
        logger.error('Erro ao gerar url para autenticação Oauth', error, {
            usuarioId: 'Desconecido',
            duracao
        });

        res.status(500).json({ message: 'Erro ao gerar url para autenticação Oauth' })
    }
}

export const signUpWithOauth = async (req, res) => {
    const { code } = req.query;
    const inicio = Date.now();
    const { ip } = req;

    try {
        const service = await registerWithOauth(code, ip);

        const token = jwt.sign({ user: service.subGoogle, }, process.env.SECRET);
        res.cookie('authenticationToken', token, { expires: new Date(Date.now() + 2 * 3600000), httpOnly: true, secure: true });

        const duracao = Date.now() - inicio;
        logger.info('Login bem-sucedido', {
            usuarioId: service.subGoogle,
            ip,
            duracao
        });

        res.status(201).json({ message: 'Usuário registrado com Oauth' });
    } catch (error) {
        if(error.message === 'Usuário existente'){
            return res.status(401).json({ message: 'Usuário existente' })
        };

        const duracao = Date.now() - inicio;
        logger.error('Erro ao registrar usuário com Oauth', error, {
            usuarioId: service?.subGoogle || 'Desconecido',
            duracao
        });

        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
};

export const signInWithOauth = async (req, res) => {
    const { code } = req.query;
    const inicio = Date.now();
    const { ip } = req;

    try {
        const service = await loginWithOauth(code, ip);
        
        const token = jwt.sign({ user: service.subGoogle, }, process.env.SECRET);
        res.cookie('authenticationToken', token, { expires: new Date(Date.now() + 2 * 3600000), httpOnly: true, secure: true });

        const duracao = Date.now() - inicio;
        logger.info('Login bem-sucedido', {
            usuarioId: service.subGoogle,
            ip,
            duracao
        });

        res.status(201).json({ message: 'Usuário logado com Oauth' });
    } catch (error) {
        if(error.message === 'Usuário não encontrado'){
            return res.status(401).json({ message: 'Usuário não encontrado' })
        }

        const duracao = Date.now() - inicio;
        logger.error('Erro ao fazer login com Oauth', error, {
            usuarioId: service?.subGoogle || 'Desconecido',
            duracao
        });

        res.status(500).json({ error: 'Erro ao fazer login com Oauth' });
    }
}

export const signUp = async (req, res) => {
    const { name, email, password } = req.body;
    const inicio = Date.now();
    const { ip } = req;

    try {
        const user = await registerUser(name, email, password, ip);

        const token = jwt.sign({ _id: user._id, name: user.name, authenticationType: user.autenticationType }, process.env.SECRET);
        res.cookie('authenticationToken', token, { expires: new Date(Date.now() + 2 * 3600000), httpOnly: true, secure: true });

        const duracao = Date.now() - inicio;
        logger.info('Login bem-sucedido', {
            usuarioId: user._id,
            ip,
            duracao
        });

        res.status(201).json({ message: 'Usuário registrado com sucesso' });
    } catch (error) {
        if(error.message === 'Email existente') {
            return res.status(401).json({ error: error.message });
        }

        const duracao = Date.now() - inicio;
        logger.error('Erro ao registrar usuário', error, {
            usuarioId: user?._id || 'Desconecido',
            duracao
        });

        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
}

export const signIn = async (req, res) => {
    const { email, password } = req.body;
    const inicio = Date.now();
    const { ip } = req;

    try {
        const user = await loginUser(email, password, ip);

        const token = jwt.sign({ _id: user._id, name: user.name, authenticationType: user.autenticationType }, process.env.SECRET);
        res.cookie('authenticationToken', token, { expires: new Date(Date.now() + 2 * 3600000), httpOnly: true, secure: true });

        const duracao = Date.now() - inicio;
        logger.info('Login bem-sucedido', {
            usuarioId: user._id,
            ip,
            duracao
        });

        res.status(200).json({ message: 'Login bem-sucedido' });
    } catch (error) {
        if(error.message === 'Email ou senha incorretos') {
            return res.status(401).json({ error: error.message });
        }
        
        const duracao = Date.now() - inicio;
        logger.error('Erro ao fazer login', error, {
            usuarioId: user?._id || 'Desconecido',
            duracao
        });

        res.status(500).json({ error: 'Erro ao fazer login' });
    }
};

export const changePassword = async (req, res) => {
    const inicio = Date.now();
    const { _id } = req.user;
    const { password, newPassword, confirmNewPassword } = req.body;
    const { ip } = req;

    try {
        const updatePassword = await resetPassword(newPassword, confirmNewPassword, password, _id, ip);

        logger.info('Senha alterada com sucesso', {
            usuarioId: _id,
            ip,
            duracao: Date.now() - inicio
        });

        res.status(201).json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        if(
            error.message === 'Senha incorreta' || 
            error.message === 'As senhas não coincidem' || 
            error.message === 'Usuário não encontrado' || 
            error.message === 'A nova senha deve ser diferente da senha atual'
        ) {
            return res.status(401).json({ error: error.message });
        }

        const duracao = Date.now() - inicio;
        logger.error('Erro ao alterar senha', error, {
            usuarioId: _id,
            duracao
        });

        res.status(500).json({ error: 'Erro ao alterar senha' });
    }
}

export const mainPage = (req, res) => {
    const inicio = Date.now();
    const { ip } = req;

    try {
        logger.info('Página principal acessada com sucesso', {
            usuarioId: req.user._id,
            ip,
            duracao: Date.now() - inicio
        });

        res.status(200).json({ message: 'Página principal acessada com sucesso' })
    } catch (error) {
        const duracao = Date.now() - inicio;
        logger.error('Erro ao acessar a página principal', error, {
            usuarioId: req.user._id,
            duracao
        });    
        
        res.status(500).json({ message: 'Erro ao acessar a página principal' })
    }
}