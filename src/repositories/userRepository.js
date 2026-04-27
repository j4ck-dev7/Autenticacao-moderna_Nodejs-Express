import User from "../models/User.js";

export const createUser = async (name, email, password) => {
    const user = new User({
        name,
        email,
        password
    });

    return await user.save();
}

export const createUserWithOauth = async (sub, name) => {
    const user = new User({
        subGoogle: sub,
        name,
        autenticationType: 'google'
    });

    return await user.save();
}

export const findUserByEmail = async (email) => {
    return await User.findOne({ email })
        .select('email name password _id autenticationType isVerified sessionVersion')
        .lean();
}

export const findUserByOauth = async (sub) => {
    return await User.findOne({ subGoogle: sub })
        .select('subGoogle _id sessionVersion')
        .lean();
}

export const VerifyEmailExists = async (email) => {
    return await User.findOne({ email })
        .select('email')
        .lean();
    ;
}

export const findUserById = async (id) => {
    return await User.findById(id)
        .select('password')
        .lean();
}

export const findUserByIdEmail = async (id) => {
    return await User.findById(id)
        .select('email isVerified sessionVersion')
        .lean();
}

export const findUserByIdVerified = async (id) => {
    return await User.findById(id)
        .select('isVerified sessionVersion')
        .lean();
}

export const updateUserPassword = async (id, newPassword) => {
    return await User.findByIdAndUpdate(id, { password: newPassword });
};

export const incrementUserSessionVersion = async (id) => {
    return await User.findByIdAndUpdate(
        id,
        { $inc: { sessionVersion: 1 } },
        { new: true }
    ).lean();
};

export const changeUserStatusActive = async (id) => {
    return await User.findByIdAndUpdate(id, { status: 'active', isVerified: true });
}