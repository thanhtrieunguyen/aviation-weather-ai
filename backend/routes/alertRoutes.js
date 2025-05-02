const express = require('express');
const router = express.Router();
const {
  getAllAlerts,
  createAlert,
  getAlertById,
  updateAlert,
  deleteAlert
} = require('../../backend/Controller/alertController');

router.get('/', getAllAlerts);
router.post('/', createAlert);
router.get('/:id', getAlertById);
router.put('/:id', updateAlert);
router.delete('/:id', deleteAlert);

module.exports = router;