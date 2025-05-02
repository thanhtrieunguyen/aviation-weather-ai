const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 

const UserSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        index: true,  
        lowercase: true, 
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} không phải là email hợp lệ!`
        }
    },
    name: { 
        type: String, 
        required: true,
        trim: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['Admin', 'User'], 
    },
    status: { 
        type: String, 
        enum: ['active', 'inactive'], 
        default: 'active' 
    },
    token: { 
        type: String 
    }
}, { 
    collection: 'users',
    timestamps: true 
});

// hash password
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// so sánh mật khẩu
UserSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// tạo Token
UserSchema.methods.generateAuthToken = function() {
    return jwt.sign(
      { userId: this._id, email: this.email, role: this.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );
  };

module.exports = mongoose.model('User', UserSchema);
