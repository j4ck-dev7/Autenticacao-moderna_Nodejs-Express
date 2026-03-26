// Importação de depêndencias 
import joi from 'joi';

// Validação do login
export const signInValidate = (data) => {
    const schema = joi.object({
        name: joi.string().required().min(3).max(50),
        email: joi.string().required().min(13).max(50),
        password: joi.string().required().min(8).max(100),
    })

    return schema.validate(data)
}

// Validação do register
export const signUpValidate = (data) => {
    const schema = joi.object({
        name: joi.string().required().min(3).max(50),
        email: joi.string().required().min(13).max(50),
        password: joi.string().required().min(8).max(100),
    })

    return schema.validate(data)
}

// Validação de mudança de senha 
const changePasswordValidateSchema = joi.object({
    password: joi.string().required().min(8).max(100),
    newPassword: joi.string().required().min(8).max(100),
    confirmNewPassword: joi.any().valid(joi.ref('newPassword')).required()
});

export const changePasswordValidate = (req, res, next) => {
    const { password, newPassword, confirmNewPassword } = req.body;
    const data = { password, newPassword, confirmNewPassword };

    const { error } = changePasswordValidateSchema.validate(data);

    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    next();
};