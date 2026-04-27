import { registerUser, loginUser, registerWithOauth, OauthRequestSignIn, OauthRequestSignUp, loginWithOauth, resetPassword, verifyEmail, requestPasswordReset, validatePasswordResetToken } from "../services/userService.js";
import { logger } from "../config/logger.js";
import crypto from 'node:crypto';

const numberOfAttemps = [1, 2, 3, 4, 5];

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
            req.session.version = service.sessionVersion ?? 0;

            req.session.save((err) => {
                if(err) {
                    logger.error('Erro ao salvar sessão após registro com Oauth', err, {
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
            req.session.version = service.sessionVersion ?? 0;

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
            usuarioId: service?._id || 'Desconecido',
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
            req.session.version = service.sessionVersion ?? 0;

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
        if(
            error.message === 'Token ausente' || 
            error.message === 'Token inválido' || 
            error.message === 'Usuário não encontrado' || 
            error.message === 'Email já verificado'
        ) {
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
                logger.error('Erro ao criar sessão após login', err, {
                    usuarioId: service._id,
                    ip
                });
                return res.status(500).json({ message: 'Erro ao criar sessão' });
            };

            req.session.user = service._id;
            req.session.version = service.sessionVersion ?? 0;

            req.session.save((err) => {
                if(err) {
                    logger.error('Erro ao salvar sessão após login', err, {
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
        const duracao = Date.now() - inicio;

        switch(error.message) {
            case 'Usuário bloqueado por muitas tentativas':
                logger.warn('Tentativa de login para usuário bloqueado por muitas tentativas', {
                    usuarioId: 'Desconecido',
                    email,
                    ip,
                    duracao: `${duracao}ms`
                });

                const resetPasswordHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Resetar Senha</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 50px; }
                            .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                            button { background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
                            button:hover { background-color: #0056b3; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>Muitas tentativas de login</h2>
                            <p>Você ultrapassou o limite de tentativas de login. Deseja resetar sua senha?</p>
                            <form method="POST" action="/api/user/request-reset-password">
                                <input type="hidden" name="email" value="${email}">
                                <button type="submit">Sim, resetar minha senha</button>
                            </form>
                        </div>
                    </body>
                    </html>
                `;

                return res.status(401).send(resetPasswordHtml);

            case 'Email ou senha incorretos':
                logger.warn('Tentativa de login com credenciais incorretas', {
                    usuarioId: 'Desconecido',
                    email,
                    ip,
                    tentativas: error.attempts,
                    duracao: `${duracao}ms`
                });

                return res.status(401).json({ 
                    error: error.message,
                    attemptsRemaining: error.remainingAttempts
                });

            case 'Email não verificado':
                logger.warn('Tentativa de login com email não verificado', {
                    usuarioId: 'Desconecido',
                    email,
                    ip,
                    duracao: `${duracao}ms`
                });

                return res.status(401).json({ error: error.message });

            default:
                logger.error('Erro ao fazer login', error, {
                    usuarioId: service?._id || 'Desconecido',
                    email,
                    ip,
                    duracao: `${duracao}ms`
                });

                return res.status(500).json({ error: 'Erro ao fazer login' });
        }
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

export const requestResetPassword = async (req, res) => {
    const { email } = req.body;
    const inicio = Date.now();
    const { ip } = req;

    try {
        await requestPasswordReset(email, ip);

        const duracao = Date.now() - inicio;
        logger.info('Solicitação de reset de senha processada', {
            usuarioId: 'Desconecido',
            email,
            ip,
            duracao: `${duracao}ms`
        });

        res.status(200).json({ message: 'Email de reset de senha enviado com sucesso' });
    } catch (error) {
        if(error.message === 'Email não encontrado') {
            const duracao = Date.now() - inicio;
            logger.warn('Solicitação de reset para email não registrado', {
                usuarioId: 'Desconecido',
                email,
                ip,
                duracao: `${duracao}ms`
            });

            return res.status(404).json({ error: error.message });
        }

        const duracao = Date.now() - inicio;
        logger.error('Erro ao solicitar reset de senha', error, {
            usuarioId: 'Desconecido',
            email,
            ip,
            duracao: `${duracao}ms`
        });

        res.status(500).json({ error: 'Erro ao solicitar reset de senha' });
    }
}

export const resetPasswordWithToken = async (req, res) => {
    const { token, code, newPassword, confirmPassword, email } = req.body;
    const inicio = Date.now();
    const { ip } = req;

    try {
        await validatePasswordResetToken(token, code, newPassword, confirmPassword, email, ip);

        const duracao = Date.now() - inicio;
        logger.info('Senha resetada com sucesso via token', {
            usuarioId: 'Desconecido',
            email,
            ip,
            duracao: `${duracao}ms`
        });

        res.status(200).json({ message: 'Senha resetada com sucesso' });
    } catch (error) {
        if(
            error.message === 'As senhas não coincidem' ||
            error.message === 'Usuário não encontrado' ||
            error.message === 'Token inválido' ||
            error.message === 'Token inválido ou expirado' ||
            error.message === 'Código de verificação inválido'
        ) {
            const duracao = Date.now() - inicio;
            logger.warn('Validação falhou no reset de senha', {
                usuarioId: 'Desconecido',
                email,
                ip,
                erro: error.message,
                duracao: `${duracao}ms`
            });

            return res.status(401).json({ error: error.message });
        }

        const duracao = Date.now() - inicio;
        logger.error('Erro ao resetar senha com token', error, {
            usuarioId: 'Desconecido',
            email,
            ip,
            duracao: `${duracao}ms`
        });

        res.status(500).json({ error: 'Erro ao resetar senha' });
    }
}