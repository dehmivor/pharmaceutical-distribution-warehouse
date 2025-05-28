const express = require('express');
const router = express.Router();
const Location = require('../../models/Location.model');


// Lấy danh sách vị trí
router.get('/', async (req, res) => {
    try {
        const locations = await Location.find().populate('area');
        res.status(200).json({
            status: 'success',
            data: {
                locations
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Lấy chi tiết vị trí
router.get('/:id', async (req, res) => {
    try {
        const location = await Location.findById(req.params.id).populate('area');
        if (!location) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy vị trí'
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                location
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Lấy vị trí theo khu vực
router.get('/area/:areaId', async (req, res) => {
    try {
        const locations = await Location.find({ area: req.params.areaId }).populate('area');
        res.status(200).json({
            status: 'success',
            data: {
                locations
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
