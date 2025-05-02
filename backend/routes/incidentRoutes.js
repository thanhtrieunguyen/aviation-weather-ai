const express = require('express');
const router = express.Router();
const Incident = require('../../backend/models/Incident.js');
router.use((req, res, next) => {
  next();
});

// Lấy tất cả báo cáo
router.get('/', async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (error) {
    console.error('Error getting incidents:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể lấy danh sách báo cáo'
    });
  }
});

// Lấy chi tiết báo cáo theo ID
router.get('/:id', async (req, res) => {
  try {

    console.log('Getting incident with ID:', req.params.id);
    const incident = await Incident.findById(req.params.id);
    
    if (!incident) {
      console.log('Incident not found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy báo cáo'
      });
    }
    
    res.status(200).json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Error getting incident details:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể lấy chi tiết báo cáo'
    });
  }
});

router.post('/', async (req, res) => {
  try {

    const incident = await Incident.create(req.body);
    res.status(201).json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Không thể tạo báo cáo'
      });
    }
  }
});

// Cập nhật báo cáo
router.put('/:id', async (req, res) => {
  try {

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!incident) {
      console.log('Incident not found for update, ID:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy báo cáo'
      });
    }
    res.status(200).json({
      success: true,
      data: incident
    });
  } catch (error) {
 
    res.status(500).json({
      success: false,
      error: 'Không thể cập nhật báo cáo'
    });
  }
});

// Xóa báo cáo
router.delete('/:id', async (req, res) => {
  try {
    console.log('Deleting incident with ID:', req.params.id);
    const incident = await Incident.findByIdAndDelete(req.params.id);
    
    if (!incident) {
      console.log('Incident not found for deletion, ID:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy báo cáo'
      });
    }
    
    console.log('Deleted incident with ID:', req.params.id);
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting incident:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể xóa báo cáo'
    });
  }
});

module.exports = router;