// Importação de depêndencias 
import joi from 'joi';

// Validação do login
const signInValidateSchema = joi.object({
    email: joi.string().required().empty().email().min(13).max(50),
    password: joi.string().required().alphanum().empty().min(8).max(100),
});

export const signInValidate = (req, res, next) => {
    const { password, email } = req.body;
    const data = { password, email };

    const { error } = signInValidateSchema.validate(data);

    switch(error?.details[0].message) {
        case '"email" is required': 
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"password" is required': 
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"email" length must be at least 13 characters long':
            return res.status(400).json({ error: 'O email deve conter no mínimo 13 caracteres' });
        case '"email" length must be less than or equal to 50 characters long':
            return res.status(400).json({ error: 'O email deve conter no máximo 50 caracteres' });
        case '"password" length must be at least 8 characters long':
            return res.status(400).json({ error: 'A senha deve conter no mínimo 8 caracteres' });
        case '"password" length must be less than or equal to 100 characters long':
            return res.status(400).json({ error: 'A senha deve conter no máximo 100 caracteres' });
        case '"password" must only contain alpha-numeric characters':
            return res.status(400).json({ error: 'A senha deve conter apenas caracteres alfanuméricos' });
        case '"email" must be a valid email':
            return res.status(400).json({ error: 'O email deve ser um email válido' });
        case '"email" is not allowed to be empty':
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"password" is not allowed to be empty':
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case undefined: 
            return next();
        default:
            return res.status(400).json({ error: 'Erro de validação desconhecido' });
    }
}

// Validação do register
const signUpValidateSchema = joi.object({
    name: joi.string().required().empty().min(3).max(50),
    email: joi.string().required().empty().email().min(13).max(50),
    password: joi.string().required().empty().alphanum().min(8).max(100),
})

export const signUpValidate = (req, res, next) => {
    const { name, email, password } = req.body;
    const data = { name, email, password };

    const { error } = signUpValidateSchema.validate(data);
   
    switch(error?.details[0].message) {
        case '"name" is required': 
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"email" is required': 
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"password" is required': 
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"name" length must be at least 3 characters long':
            return res.status(400).json({ error: 'O nome deve conter no mínimo 3 caracteres' });
        case '"name" length must be less than or equal to 50 characters long':
            return res.status(400).json({ error: 'O nome deve conter no máximo 50 caracteres' });
        case '"email" length must be at least 13 characters long':
            return res.status(400).json({ error: 'O email deve conter no mínimo 13 caracteres' });
        case '"email" length must be less than or equal to 50 characters long':
            return res.status(400).json({ error: 'O email deve conter no máximo 50 caracteres' });
        case '"password" length must be at least 8 characters long':
            return res.status(400).json({ error: 'A senha deve conter no mínimo 8 caracteres' });
        case '"password" length must be less than or equal to 100 characters long':
            return res.status(400).json({ error: 'A senha deve conter no máximo 100 caracteres' });
        case '"password" must only contain alpha-numeric characters':
            return res.status(400).json({ error: 'A senha deve conter apenas caracteres alfanuméricos' });
        case '"email" must be a valid email':
            return res.status(400).json({ error: 'O email deve ser um email válido' });
        case '"name" is not allowed to be empty':
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"email" is not allowed to be empty':
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"password" is not allowed to be empty':
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case undefined:
            return next();
        default:
            return res.status(400).json({ error: 'Erro de validação desconhecido' });
    }
};

// Validação de mudança de senha 
const changePasswordValidateSchema = joi.object({
    password: joi.string().required().empty().alphanum().min(8).max(100),
    newPassword: joi.string().min(8).max(100).required().alphanum().empty(),
    confirmNewPassword: joi.any().valid(joi.ref('newPassword')).required().empty()
});

export const changePasswordValidate = (req, res, next) => {
    const { password, newPassword, confirmNewPassword } = req.body;
    const data = { password, newPassword, confirmNewPassword };

    const { error } = changePasswordValidateSchema.validate(data);
   
    switch(error?.details[0].message) {
        case '"password" is required': 
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"newPassword" is required': 
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"confirmNewPassword" is required': 
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"confirmNewPassword" must be [ref:newPassword]': 
            return res.status(400).json({ error: 'As senhas não coincidem' });
        case '"password" length must be less than or equal to 100 characters long':
            return res.status(400).json({ error: 'As senhas não coincidem' });
        case '"newPassword" length must be at least 8 characters long':
            return res.status(400).json({ error: 'A nova senha deve conter no mínimo 8 caracteres' });
        case '"newPassword" length must be less than or equal to 100 characters long':
            return res.status(400).json({ error: 'A nova senha deve conter no máximo 100 caracteres' });
        case '"password" must only contain alpha-numeric characters':
            return res.status(400).json({ error: 'Credenciais inválidas' });
        case '"password" is not allowed to be empty':
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"newPassword" is not allowed to be empty':
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"confirmNewPassword" is not allowed to be empty':
            return res.status(400).json({ error: 'Preencha os campos obrigatórios' });
        case '"newPassword" must only contain alpha-numeric characters':
            return res.status(400).json({ error: 'A nova senha deve conter apenas caracteres alfanuméricos' });
        case undefined:
            return next();
        default:
            return res.status(400).json({ error: 'Erro de validação desconhecido' });
    }
};