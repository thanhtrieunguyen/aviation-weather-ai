const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Lấy danh sách người dùng
router.get('/', async (req, res) => {
    try {
      const allUsers = await User.find()
        .select('-password -token')
        .sort({ createdAt: -1 });
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách người dùng',
        error: error.message,
      });
    }
  });
  


// Thêm người dùng
router.post('/', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!email || email.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Email không được để trống'
            });
        }
        const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã tồn tại trong hệ thống'
            });
        }

        const newUser = new User({
            name,
            email: email.trim().toLowerCase(),  
            password,
            role,
            status: 'active'
        });

        await newUser.save();

        const userResponse = newUser.toObject();
        delete userResponse.password;
        delete userResponse.token;

        res.status(201).json({
            success: true,
            data: userResponse,
            message: 'Tạo người dùng thành công'
        });
    } catch (error) {
        console.error('Lỗi khi thêm user:', error);
        res.status(400).json({
            success: false,
            message: 'Lỗi khi thêm người dùng',
            error: error.message
        });
    }
});


// Cập nhật người dùng
router.put('/:id', async (req, res) => {
    try {
        const { name, email, role, password } = req.body;
        const updateData = { name, email, role };
        if (password) {
            updateData.password = password;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password -token');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            data: updatedUser,
            message: 'Cập nhật thành công'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Lỗi khi cập nhật người dùng',
            error: error.message
        });
    }
});

// Xóa người dùng
router.delete('/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        
        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            message: 'Xóa người dùng thành công'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Lỗi khi xóa người dùng',
            error: error.message
        });
    }
});

// Cập nhật trạng thái người dùng
router.patch('/:id/status', async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        ).select('-password -token');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            data: updatedUser,
            message: 'Cập nhật trạng thái thành công'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái',
            error: error.message
        });
    }
});

module.exports = router;
