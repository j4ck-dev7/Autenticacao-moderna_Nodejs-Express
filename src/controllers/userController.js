import { registerUser, loginUser, registerWithOauth, OauthRequestSignIn, OauthRequestSignUp, loginWithOauth, resetPassword, verifyEmail } from "../services/userService.js";
import { logger } from "../config/logger.js";
import crypto from 'node:crypto';


export const getOauthUrlSignUp = async (req, res) => {
    const inicio = Date.now();
    const { ip } = req;
    const state =  crypto.randomBytes(32).toString('hex')
    req.session.OauthState = state;

    try {
        const url = await OauthRequestSignUp(ip, state);

        const duracao = Date.now() - inicio;
        logger.debug('Url para autenticação Oauth gerada com sucesso', { 
            usuarioId: 'Desconecido',
            ip,
            duracao: `${duracao}ms`
        });

        res.status(200).json({ url })
    } catch (error) {
        const duracao = Date.now() - inicio;
        logger.error('Erro ao gerar url para autenticação Oauth', error, {
            usuarioId: 'Desconecido',
            ip,
            duracao: `${duracao}ms`
        });

        res.status(500).json({ message: 'Erro ao gerar url para autenticação Oauth' })
    }
}

export const getOauthUrlSignIn = async (req, res) => {
    const inicio = Date.now();
    const { ip } = req;
    const state =  crypto.randomBytes(32).toString('hex');
    req.session.OauthState = state;

    try {
        const url = await OauthRequestSignIn(ip, state);

        const duracao = Date.now() - inicio;
        logger.debug('Url para autenticação Oauth gerada com sucesso', { 
            usuarioId: 'Desconecido',
            ip,
            duracao: `${duracao}ms`
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
    const { code, state } = req.query;
    const inicio = Date.now();
    const { ip } = req;
    let service;    

    if(state !== req.session.OauthState) {
        const duracao = Date.now() - inicio;
        logger.warn('State inválido na autenticação Oauth, possível ataque CSRF', {
            usuarioId: 'Desconecido',
            ip,
            duracao: `${duracao}ms`
        });

        return res.status(401).json({ message: 'State inválido' });
    }

    try {
        service = await registerWithOauth(code, ip);

        req.session.regenerate((err) => {
            if(err) {
                logger.error('Erro ao criar sessão após registro com Oauth', err, {
                    usuarioId: service._id,
                    ip
                });
                return res.status(500).json({ message: 'Erro ao criar sessão' });
            };

            req.session.user = service._id;

            req.session.save((err) => {
                if(err) {
                    logger.error('Erro ao salvar sessão após registro', err, {
                        usuarioId: service._id,
                        ip
                    });
                    return res.status(500).json({ message: 'Erro ao salvar sessão' });
                };

                const duracao = Date.now() - inicio;
                logger.info('Registro bem-sucedido', {
                    usuarioId: service._id,
                    ip,
                    duracao: `${duracao}ms`
                });

                res.redirect('/api/user/main');
            });
        })
    } catch (error) {
        if(error.message === 'Usuário existente'){
            return res.status(401).json({ message: 'Usuário existente' })
        };

        const duracao = Date.now() - inicio;
        logger.error('Erro ao registrar usuário com Oauth', error, {
            usuarioId: service.subGoogle || 'Desconecido',
            duracao: `${duracao}ms`
        });

        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
};

export const signInWithOauth = async (req, res) => {
    const { code, state } = req.query;
    const inicio = Date.now();
    const { ip } = req;
    let service;

    if(state !== req.session.OauthState) {
        const duracao = Date.now() - inicio;
        logger.warn('State inválido na autenticação Oauth, possível ataque CSRF', {
            usuarioId: 'Desconecido',
            ip,
            duracao: `${duracao}ms`
        });

        return res.status(401).json({ message: 'State inválido' });
    }

    try {
        service = await loginWithOauth(code, ip);
        
        req.session.regenerate((err) => {
            if(err) {
                logger.error('Erro ao criar sessão após registro com Oauth', err, {
                    usuarioId: service._id,
                    ip
                });
                return res.status(500).json({ message: 'Erro ao criar sessão' });
            };

            req.session.user = service._id;

            req.session.save((err) => {
                if(err) {
                    logger.error('Erro ao salvar sessão após registro com Oauth', err, {
                        usuarioId: service._id,
                        ip
                    });
                    return res.status(500).json({ message: 'Erro ao salvar sessão' });
                };

                const duracao = Date.now() - inicio;
                logger.info('Login bem-sucedido', {
                    usuarioId: service._id,
                    ip,
                    duracao: `${duracao}ms`
                });

                res.redirect('/api/user/main');
            });
        })
    } catch (error) {
        if(error.message === 'Usuário não encontrado'){
            return res.status(401).json({ message: 'Usuário não encontrado' })
        }

        const duracao = Date.now() - inicio;
        logger.error('Erro ao fazer login com Oauth', error, {
            usuarioId: service?.subGoogle || 'Desconecido',
            duracao: `${duracao}ms`
        });

        res.status(500).json({ error: 'Erro ao fazer login com Oauth' });
    }
}

export const signUp = async (req, res) => {
    const { name, email, password } = req.body;
    const inicio = Date.now();
    const { ip } = req;
    let service;

    try {
        service = await registerUser(name, email, password, ip);

        const duracao = Date.now() - inicio;
        logger.info('Registro bem-sucedido', {
            usuarioId: service._id,
            ip,
            duracao: `${duracao}ms`
        });

        res.status(201).json({ message: 'Para concluir o registro, verifique seu email' });

    } catch (error) {
        if(error.message === 'Email existente') {
            return res.status(401).json({ error: error.message });
        }

        const duracao = Date.now() - inicio;
        logger.error('Erro ao registrar usuário', error, {
            usuarioId: service._id || 'Desconecido',
            duracao: `${duracao}ms`
        });

        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
}

export const verifyUser = async (req, res) => {
    const { token } = req.query;
    const inicio = Date.now();
    const { ip } = req;
    let service;

    try{
        service = await verifyEmail(token, ip);

        const duracao = Date.now() - inicio;
        logger.info('Email verificado com sucesso', {
            usuarioId: service._id,
            ip,
            duracao: `${duracao}ms`
        });

        req.session.regenerate((err) => {
            if(err) {
                logger.error('Erro ao criar sessão após a verificação de email', err, {
                    usuarioId: service._id,
                    ip
                });
                return res.status(500).json({ message: 'Erro ao criar sessão' });
            };

            req.session.user = service._id;

            req.session.save((err) => {
                if(err) {
                    logger.error('Erro ao salvar sessão após a verificação de email', err, {
                        usuarioId: service._id,
                        ip
                    });
                    return res.status(500).json({ message: 'Erro ao salvar sessão' });
                };

                const duracao = Date.now() - inicio;
                logger.info('Email verificado com sucesso', {
                    usuarioId: service._id,
                    ip,
                    duracao: `${duracao}ms`
                });

                res.status(200).json({ message: 'Email verificado com sucesso' });
            });
        })
    }catch(error){
        if(error.message === 'Token ausente' || error.message === 'Token inválido' || error.message === 'Usuário não encontrado' || error.message === 'Email já verificado') {
            return res.status(401).json({ error: error.message });
        }

        const duracao = Date.now() - inicio;
        logger.error('Erro ao verificar email', error, {
            usuarioId: service?._id || 'Desconecido',
            ip,
            duracao: `${duracao}ms`
        });

        res.status(500).json({ error: 'Erro ao verificar email' });
    }
}

export const signIn = async (req, res) => {
    const { email, password } = req.body;
    const inicio = Date.now();
    const { ip } = req;
    let service;

    try {
        service = await loginUser(email, password, ip);

        req.session.regenerate((err) => {
            if(err) {
                logger.error('Erro ao criar sessão após registro com Oauth', err, {
                    usuarioId: service._id,
                    ip
                });
                return res.status(500).json({ message: 'Erro ao criar sessão' });
            };

            req.session.user = service._id;

            req.session.save((err) => {
                if(err) {
                    logger.error('Erro ao salvar sessão após registro com Oauth', err, {
                        usuarioId: service._id,
                        ip
                    });
                    return res.status(500).json({ message: 'Erro ao salvar sessão' });
                };

                const duracao = Date.now() - inicio;
                logger.info('Login bem-sucedido', {
                    usuarioId: service._id,
                    ip,
                    duracao: `${duracao}ms`
                });

                res.redirect('/api/user/main');
            });
        })
    } catch (error) {
        if(error.message === 'Email ou senha incorretos') {
            return res.status(401).json({ error: error.message });
        }
        
        const duracao = Date.now() - inicio;
        logger.error('Erro ao fazer login', error, {
            usuarioId: service?._id || 'Desconecido',
            duracao: `${duracao}ms`
        });

        res.status(500).json({ error: 'Erro ao fazer login' });
    }
};

export const changePassword = async (req, res) => {
    const inicio = Date.now();
    const { password, newPassword, confirmNewPassword } = req.body;
    const _id = req.session.user;
    const { ip } = req;

    try {
        const updatePassword = await resetPassword(newPassword, confirmNewPassword, password, _id, ip);

        const duracao = Date.now() - inicio;
        logger.info('Senha alterada com sucesso', {
            usuarioId: _id,
            ip,
            duracao: `${duracao}ms`
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
            duracao: `${duracao}ms`
        });

        res.status(500).json({ error: 'Erro ao alterar senha' });
    }
}

export const mainPage = (req, res) => {
    const inicio = Date.now();
    const { ip } = req;
    const _id = req.session.user;

    try {
        const duracao = Date.now() - inicio;
        logger.info('Página principal acessada com sucesso', {
            usuarioId: _id,
            ip,
            duracao: `${duracao}ms`
        });

        res.status(200).json({ message: 'Página principal acessada com sucesso' })
    } catch (error) {
        const duracao = Date.now() - inicio;
        logger.error('Erro ao acessar a página principal', error, {
            usuarioId: _id,
            duracao: `${duracao}ms`
        });    
        
        res.status(500).json({ message: 'Erro ao acessar a página principal' })
    }
}