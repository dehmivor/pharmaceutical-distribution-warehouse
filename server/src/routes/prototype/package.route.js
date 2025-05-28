const express = require('express');
const router = express.Router();
const Package = require('../../models/Package.model');

// Lấy danh sách gói thuốc
router.get('/', async (req, res) => {
    try {
        const packages = await Package.find()
            .populate('area')
            .populate('location')
            .populate('content');
        res.status(200).json({
            status: 'success',
            data: {
                packages
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Lấy chi tiết gói thuốc
router.get('/:id', async (req, res) => {
    try {
        const package = await Package.findById(req.params.id)
            .populate('area')
            .populate('location')
            .populate('content');
        if (!package) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy gói thuốc'
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                package
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Lấy gói thuốc theo khu vực
router.get('/area/:areaId', async (req, res) => {
    try {
        const packages = await Package.find({ area: req.params.areaId })
            .populate('area')
            .populate('location')
            .populate('content');
        res.status(200).json({
            status: 'success',
            data: {
                packages
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Lấy gói thuốc theo vị trí
router.get('/location/:locationId', async (req, res) => {
    try {
        const packages = await Package.find({ location: req.params.locationId })
            .populate('area')
            .populate('location')
            .populate('content');
        res.status(200).json({
            status: 'success',
            data: {
                packages
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
