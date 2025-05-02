const express = require('express');
const router = express.Router();
const warningController = require('../../backend/Controller/flightsController');

router.get('/', warningController.getWarnings);
router.post('/', warningController.createWarning);
router.put('/:id', warningController.updateWarning);
router.delete('/:id', warningController.deleteWarning);
router.get('/stats', warningController.getWarningStats);

module.exports = router;
