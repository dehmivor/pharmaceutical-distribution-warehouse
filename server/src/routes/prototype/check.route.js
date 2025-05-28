const express = require('express');
const router = express.Router();

const {
    createCycleCount,
    getCycleCounts,
    getCycleCountDetail,
    updateLocationStatus,
    approveCycleCount
} = require('../../controllers/CycleCountForm.controller');

// Tạo đợt kiểm kê mới
router.post('/cycle-count', createCycleCount);

// Lấy danh sách đợt kiểm kê
router.get('/cycle-count', getCycleCounts);

// Lấy chi tiết đợt kiểm kê
router.get('/cycle-count/:id', getCycleCountDetail);

// Cập nhật trạng thái vị trí
router.put('/cycle-count/:id/status', updateLocationStatus);

// Phê duyệt đợt kiểm kê
router.put('/cycle-count/:id/approve', approveCycleCount);

module.exports = router;
