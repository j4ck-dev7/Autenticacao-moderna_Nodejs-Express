// Importação de depêndencias 
import joi from 'joi';
import { logger } from '../config/logger.js';

// Validação do login
const signInValidateSchema = joi.object({
    email: joi.string().required().empty().email().min(13).max(50),
    password: joi.string().required().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).empty().min(8).max(100),
});

export const signInValidate = (req, res, next) => {
    const { password, email } = req.body;
    const data = { password, email };

    const { error } = signInValidateSchema.validate(data);

    switch(error?.details[0].message) {
        case `"password" with value "${password}" fails to match the required pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/`:
            logger.warn(`IP ${req.ip} tentou fazer login com senha que não atende os requisitos de complexidade`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'A senha deve conter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais' });
        case '"email" is required': 
            logger.warn(`IP ${req.ip} tentou fazer login sem email`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"password" is required': 
            logger.warn(`IP ${req.ip} tentou fazer login sem senha`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"email" length must be at least 13 characters long':
            logger.warn(`IP ${req.ip} enviou um email com menos de 13 caracteres`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'O email deve conter no mínimo 13 caracteres' });
        case '"email" length must be less than or equal to 50 characters long':
            logger.warn(`IP ${req.ip} enviou um email com mais de 50 caracteres`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'O email deve conter no máximo 50 caracteres' });
        case '"password" length must be at least 8 characters long':
            logger.warn(`IP ${req.ip} enviou uma senha com menos de 8 caracteres`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'A senha deve conter no mínimo 8 caracteres' });
        case '"password" length must be less than or equal to 100 characters long':
            logger.warn(`IP ${req.ip} enviou uma senha com mais de 100 caracteres`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'A senha deve conter no máximo 100 caracteres' });
        case '"password" must only contain alpha-numeric characters':
            logger.warn(`IP ${req.ip} enviou uma senha com caracteres inválidos`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'A senha deve conter apenas caracteres alfanuméricos' });
        case '"email" must be a valid email':
            logger.warn(`IP ${req.ip} enviou um email inválido`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'O email deve ser um email válido' });
        case '"email" is not allowed to be empty':
            logger.warn(`IP ${req.ip} tentou fazer login sem email`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"password" is not allowed to be empty':
            logger.warn(`IP ${req.ip} tentou fazer login sem senha`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case undefined: 
            logger.info(`IP ${req.ip} passou na validação de login`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return next();
        default:
            logger.error(`Erro de validação desconhecido: ${error.details[0].message}`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Erro de validação desconhecido' });
    }
}

// Validação do register
const signUpValidateSchema = joi.object({
    name: joi.string().required().empty().min(3).max(50),
    email: joi.string().required().empty().email().min(13).max(50),
    password: joi.string().required().empty().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).min(8).max(100),
})

export const signUpValidate = (req, res, next) => {
    const { name, email, password } = req.body;
    const data = { name, email, password };

    const { error } = signUpValidateSchema.validate(data);
   
    switch(error?.details[0].message) {
        case `"password" with value "${password}" fails to match the required pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/`:
            logger.warn(`IP ${req.ip} tentou fazer cadastro com senha que não atende os requisitos de complexidade`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'A senha deve conter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais' });
        case '"name" is required': 
            logger.warn(`IP ${req.ip} tentou fazer cadastro sem nome`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"email" is required': 
            logger.warn(`IP ${req.ip} tentou fazer cadastro sem email`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"password" is required': 
            logger.warn(`IP ${req.ip} tentou fazer cadastro sem senha`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"name" length must be at least 3 characters long':
            logger.warn(`IP ${req.ip} tentou fazer cadastro com nome inválido`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'O nome deve conter no mínimo 3 caracteres' });
        case '"name" length must be less than or equal to 50 characters long':
            logger.warn(`IP ${req.ip} tentou fazer cadastro com nome inválido`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'O nome deve conter no máximo 50 caracteres' });
        case '"email" length must be at least 13 characters long':
            logger.warn(`IP ${req.ip} tentou fazer cadastro com email inválido`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'O email deve conter no mínimo 13 caracteres' });
        case '"email" length must be less than or equal to 50 characters long':
            logger.warn(`IP ${req.ip} tentou fazer cadastro com email inválido`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'O email deve conter no máximo 50 caracteres' });
        case '"password" length must be at least 8 characters long':
            logger.warn(`IP ${req.ip} tentou fazer cadastro com senha inválida`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'A senha deve conter no mínimo 8 caracteres' });
        case '"password" length must be less than or equal to 100 characters long':
            logger.warn(`IP ${req.ip} tentou fazer cadastro com senha inválida`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'A senha deve conter no máximo 100 caracteres' });
        case '"password" must only contain alpha-numeric characters':
            logger.warn(`IP ${req.ip} tentou fazer cadastro com senha inválida`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'A senha deve conter apenas caracteres alfanuméricos' });
        case '"email" must be a valid email':
            logger.warn(`IP ${req.ip} tentou fazer cadastro com email inválido`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'O email deve ser um email válido' });
        case '"name" is not allowed to be empty':
            logger.warn(`IP ${req.ip} tentou fazer cadastro com nome inválido`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"email" is not allowed to be empty':
            logger.warn(`IP ${req.ip} tentou fazer cadastro com email inválido`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"password" is not allowed to be empty':
            logger.warn(`IP ${req.ip} tentou fazer cadastro com senha inválida`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case undefined:
            logger.info(`IP ${req.ip} passou na validação de cadastro`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return next();
        default:
            logger.error(`Erro de validação desconhecido: ${error.details[0].message}`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Erro de validação desconhecido' });
    }
};

// Validação de mudança de senha 
const changePasswordValidateSchema = joi.object({
    password: joi.string().required().empty().alphanum().min(8).max(100),
    newPassword: joi.string().min(8).max(100).required().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).empty(),
    confirmNewPassword: joi.any().valid(joi.ref('newPassword')).required().empty()
});

export const changePasswordValidate = (req, res, next) => {
    const { password, newPassword, confirmNewPassword } = req.body;
    const data = { password, newPassword, confirmNewPassword };

    const { error } = changePasswordValidateSchema.validate(data);
   
    switch(error?.details[0].message) {
        case `"newPassword" with value "${newPassword}" fails to match the required pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/`:
            logger.warn(`O usuário ${req.user ? req.user.id : 'Desconecido'} tentou mudar a senha para uma nova senha que não atende os requisitos de complexidade`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'A nova senha deve conter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais' });
        case '"password" is required': 
            logger.warn(`O usuário ${req.user ? req.user.id : 'Desconecido'} tentou mudar a senha sem preencher a senha atual`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"newPassword" is required': 
            logger.warn(`O usuário ${req.user ? req.user.id : 'Desconecido'} tentou mudar a senha sem preencher a nova senha`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"confirmNewPassword" is required': 
            logger.warn(`O usuário ${req.user ? req.user.id : 'Desconecido'} tentou mudar a senha sem confirmar a nova senha`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"confirmNewPassword" must be [ref:newPassword]': 
            logger.warn(`O usuário ${req.user ? req.user.id : 'Desconecido'} tentou mudar a senha com senhas não coincidentes`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'As senhas não coincidem' });
        case '"password" length must be less than or equal to 100 characters long':
            logger.warn(`O usuário ${req.user ? req.user.id : 'Desconecido'} tentou usar uma senha muito longa`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'As senhas não coincidem' });
        case '"newPassword" length must be at least 8 characters long':
            logger.warn(`O usuário ${req.user ? req.user.id : 'Desconecido'} tentou usar uma nova senha muito curta`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'A nova senha deve conter no mínimo 8 caracteres' });
        case '"newPassword" length must be less than or equal to 100 characters long':
            logger.warn(`O usuário ${req.user ? req.user.id : 'Desconecido'} tentou usar uma nova senha muito longa`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'A nova senha deve conter no máximo 100 caracteres' });
        case '"password" must only contain alpha-numeric characters':
            logger.warn(`O usuário ${req.user ? req.user.id : 'Desconecido'} tentou usar credenciais inválidas`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Credenciais inválidas' });
        case '"password" is not allowed to be empty':
            logger.warn(`O usuário ${req.user ? req.user.id : 'Desconecido'} tentou deixar o campo de senha atual vazio`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"newPassword" is not allowed to be empty':
            logger.warn(`O usuário ${req.user ? req.user.id : 'Desconecido'} tentou deixar o campo de nova senha vazio`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"confirmNewPassword" is not allowed to be empty':
            logger.warn(`O usuário ${req.user ? req.user.id : 'Desconecido'} tentou deixar o campo de confirmação de nova senha vazio`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"newPassword" must only contain alpha-numeric characters':
            logger.warn(`O usuário ${req.user ? req.user.id : 'Desconecido'} tentou usar uma nova senha com caracteres inválidos`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'A nova senha deve conter apenas caracteres alfanuméricos' });
        case undefined:
            logger.info(`O usuário ${req.user ? req.user.id : 'Desconecido'} passou na validação de mudança de senha`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return next();
        default:
            logger.error(`Erro de validação desconhecido: ${error.details[0].message}`, {
                usuario: req.user ? req.user.id : 'Desconecido',
                ip: req.ip,
                rota: req.originalUrl,
                metodo: req.method
            });
            return res.status(400).json({ error: 'Erro de validação desconhecido' });
    }
};