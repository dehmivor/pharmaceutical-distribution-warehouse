const express = require('express');
const router = express.Router();
const Medicine = require('../../models/Medicine.model');

// Lấy danh sách thuốc
router.get('/', async (req, res) => {
    try {
        const medicines = await Medicine.find().populate('supplier');
        res.status(200).json({
            status: 'success',
            data: {
                medicines
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Lấy chi tiết thuốc
router.get('/:id', async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id).populate('supplier');
        if (!medicine) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy thuốc'
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                medicine
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Tìm kiếm thuốc theo tên
router.get('/search/:name', async (req, res) => {
    try {
        const medicines = await Medicine.find({
            name: { $regex: req.params.name, $options: 'i' }
        }).populate('supplier');
        res.status(200).json({
            status: 'success',
            data: {
                medicines
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
