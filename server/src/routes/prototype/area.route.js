const express = require('express');
const router = express.Router();
const Area = require('../../models/Area.model');

// Lấy danh sách khu vực
router.get('/', async (req, res) => {
    try {
        const areas = await Area.find();
        res.status(200).json({
            success: true,
            data: areas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Lấy chi tiết khu vực
router.get('/:id', async (req, res) => {
    try {
        const area = await Area.findById(req.params.id);
        if (!area) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khu vực'
            });
        }
        res.status(200).json({
            success: true,
            data: area
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
