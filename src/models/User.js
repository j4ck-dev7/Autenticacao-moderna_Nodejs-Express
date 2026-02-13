import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, minlength: 3, maxlength: 50 },
    email: { type: String, required: true, unique: true, minlength: 13, maxlength: 50 },
    password: { type: String, required: true, minlength: 8, maxlength: 100 },
    admin: { type: Boolean, default: false },
    subGoogle: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('User', userSchema);
