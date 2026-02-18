import { registerUser, loginUser, registerWithOauth, OauthRequest } from "../services/userService.js";
import jwt from 'jsonwebtoken'

export const getOauthUrl = async (req, res) => {
    try {
        const url = await OauthRequest();
        res.status(200).json({ url })
    } catch (error) {
        res.status(500).json({ message: 'Erro ao gerar url para autenticação Oauth' })
        console.log(error)
    }
}

export const signUpWithOauth = async (req, res) => {
    const { code } = req.query
    
    try {
        const service = await registerWithOauth(code);

        const token = jwt.sign({ user: service.subGoogle, }, process.env.JWT_SECRET);
        res.cookie('authencationToken', token, { expires: new Date(Date.now() + 900000), httpOnly: true, secure: true });

        res.status(201).json({ message: 'Usuário logado com Oauth' });
    } catch (error) {
        if(error.message === 'Usuário existente'){
            return res.status(401).json({ message: 'Usuário existente' })
        };

        res.status(500).json({ error: 'Erro ao registrar usuário' });
        console.log(error);
    }
}

export const signUp = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        await registerUser(name, email, password);
        res.status(201).json({ message: 'Usuário registrado com sucesso' });
    } catch (error) {
        if(error.message === 'Email existente') {
            return res.status(401).json({ error: error.message });
        }

        res.status(500).json({ error: 'Erro ao registrar usuário' });
        console.log(error);
    }
}

export const signIn = async (req, res) => {
    const { email, password } = req.body;

    try {
        await loginUser(email, password);
        res.status(200).json({ message: 'Login bem-sucedido' });
    } catch (error) {
        if(error.message === 'Email ou senha incorretos') {
            return res.status(401).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Erro ao fazer login' });
        console.log(error);
    }
};

export const mainPage = (req, res) => {
    try {
        res.status(200).json({ message: 'Página principal acessada com sucesso' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Erro ao acessar a página principal' })
    }
}