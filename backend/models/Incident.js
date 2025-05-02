// models/Incident.js
const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  flightNumber: {
    type: String,
    required: [true, 'Mã chuyến bay là bắt buộc'],
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  title: {
    type: String,
    required: [true, 'Tiêu đề là bắt buộc'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Mô tả chi tiết là bắt buộc']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['Đang xử lý', 'Đã xử lý', 'Đã đóng', 'Cần theo dõi'],
    default: 'Đang xử lý'
  },
  assignee: {
    type: String,
    trim: true
  },
  read: { // Thêm trường read để lưu trạng thái đã đọc
    type: Boolean,
    default: false
  }
}, {
  collection: 'incidents',
  timestamps: true // Tự động tạo createdAt và updatedAt
});

// Thêm index cho các trường thường xuyên query
incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ flightNumber: 1 });
incidentSchema.index({ read: 1 }); // Thêm index cho trường read

const IncidentModel = mongoose.model('Incident', incidentSchema);

module.exports = IncidentModel;