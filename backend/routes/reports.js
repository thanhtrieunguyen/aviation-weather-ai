const express = require('express');
const router = express.Router();
const reportsController = require('../../backend/Controller/reportsController');

router.post('/', reportsController.createReport);
router.get('/', reportsController.getReports);
router.get('/:timeframe', reportsController.getReportByTimeframe);
router.put('/:id', reportsController.updateReport);
router.delete('/:id', reportsController.deleteReport);

module.exports = router;