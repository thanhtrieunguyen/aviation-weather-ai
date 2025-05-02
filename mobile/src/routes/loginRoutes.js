  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  const express = require('express');
  const router = express.Router();
  const User = require('../models/User');

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Kiểm tra đầu vào
    if (!email || !password) {
      return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
    }

    try {
      const user = await User.findOne({ email: email.toLowerCase() });

      // Kiểm tra xem người dùng có tồn tại không
      if (!user) {
        return res.status(401).json({ 
          message: 'Unauthorized access: User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Kiểm tra trạng thái kích hoạt của tài khoản
      if (user.status !== 'active') {
        return res.status(401).json({ 
          message: 'Unauthorized access: Account is not active',
          code: 'ACCOUNT_INACTIVE'
        });
      }

      // So sánh mật khẩu nhập vào với mật khẩu đã hash trong MongoDB
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ 
          message: 'Unauthorized access: Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Tạo token với thông tin chi tiết
      const token = jwt.sign(
        { 
          id: user._id, 
          email: user.email, 
          role: user.role,
          // Thêm các thông tin bổ sung nếu cần
          name: user.name
        },
        process.env.JWT_SECRET || 'af1a4eb7358f4b9e9520b589914c2f9884d3e940be79de79933c79e9b6f3fe6f914a7a383fd0edac4b8b91a11b578f8c1e2c91fc1d6027a4a9e0b4e6eac96f9a',
        { 
          expiresIn: '1h',
          issuer: 'nhom33' // Thêm issuer để tăng tính bảo mật
        }
      );

      // Log thông tin đăng nhập thành công (loại bỏ thông tin nhạy cảm)
      console.log(`User logged in: ${user.email} (${user.role})`);

      // Trả về thông tin người dùng và token
      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name
        }
      });

    } catch (error) {
      // Log lỗi chi tiết để debug
      console.error('Login Error:', {
        message: error.message,
        stack: error.stack
      });

      res.status(500).json({ 
        message: 'Server error. Vui lòng thử lại sau.',
        code: 'SERVER_ERROR'
      });
    }
  });

  module.exports = router;