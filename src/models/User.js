import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    autenticationType: { type: String, enum: ['local', 'google'], required: true, default: 'local' },
    name: { type: String, required: true, minlength: 3, maxlength: 50 },
    email: { type: String, required: false, unique: true, minlength: 13, maxlength: 50 },
    password: { type: String, required: false, minlength: 8, maxlength: 100 },
    admin: { type: Boolean, default: false },
    subGoogle: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    status: { type: String, enum: [ 'active', 'pending', 'blocked' ], default: 'pending' },
    sessionVersion: { type: Number, default: 0 }
});

userSchema.pre('save', function(next){
    if(this.autenticationType === 'google'){
        this.email = null;
        this.password = null;
    }
    next();
})

export default mongoose.model('User', userSchema);
