const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email không tồn tại' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Tài khoản của bạn không hoạt động' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu không đúng' });
    }

    // Tạo token khi đăng nhập thành công
    const token = user.generateAuthToken();

    // Trả về token và thông tin user (bao gồm role) để frontend xử lý
    res.status(200).json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau' });
  }
};

module.exports = { login };