const Report = require('../models/Report');

const reportsController = {
  createReport: async (req, res) => {
    try {
      const report = new Report(req.body);
      await report.save();
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  getReports: async (req, res) => {
    try {
      const reports = await Report.find()
        .sort({ createdAt: -1 })
        .limit(10);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getReportByTimeframe: async (req, res) => {
    try {
      const report = await Report.findOne({
        timeframe: req.params.timeframe
      }).sort({ createdAt: -1 });
      
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updateReport: async (req, res) => {
    try {
      const report = await Report.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  deleteReport: async (req, res) => {
    try {
      const report = await Report.findByIdAndDelete(req.params.id);
      
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      res.json({ message: 'Report deleted' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = reportsController;