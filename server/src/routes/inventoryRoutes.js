const express = require('express');
const router = express.Router();
const { updateInventoryLocation } = require('../controllers/inventoryController');

// POST endpoint to update inventory location
router.post('/update-location', async (req, res) => {
  try {
    const result = await updateInventoryLocation(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;