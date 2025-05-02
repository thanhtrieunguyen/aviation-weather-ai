const Alert = require('../models/Alert'); 

const getAllAlerts = async (req, res) => {
    try {
      const alerts = await Alert.find().sort({ time: -1 }); 
      res.status(200).json(alerts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

//create 
const createAlert = async (req, res) => {
    try {
      const alert = new Alert({ 
        Number_Flight: req.body. Number_Flight,
        content: req.body.content,
        level: req.body.level || 'medium',
        status: req.body.status || 'pending',
        time: req.body.time || new Date()
      });
  
      const newAlert = await alert.save();
      res.status(201).json(newAlert);
    } catch (error) {
      console.error('Create alert error:', error);
      res.status(400).json({
        message: error.message,
        details: error.errors
      });
    }
};

const getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (alert) {
      res.status(200).json(alert);
    } else {
      res.status(404).json({ message: 'Alert not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//update
const updateAlert = async (req, res) => {
    try {
      const alert = await Alert.findByIdAndUpdate( 
        req.params.id,
        req.body,
        { new: true }
      );
      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      res.status(200).json(alert);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
};

//delete
const deleteAlert = async (req, res) => {
    try {
      const alert = await Alert.findByIdAndDelete(req.params.id);
      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      res.status(200).json({ message: 'Alert deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

module.exports = {
  getAllAlerts,
  createAlert,
  getAlertById,
  updateAlert,
  deleteAlert
};
