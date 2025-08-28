const express = require('express');
const EnhancedAiTrendsController = require('../controllers/enhancedAiTrendsController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

// Middleware xác thực cho tất cả routes
router.use(authenticate);

// Routes cho AI Trends cơ bản
router.post('/medicine', EnhancedAiTrendsController.generateMedicineAiTrends);
router.get('/all', EnhancedAiTrendsController.generateAllMedicinesAiTrends);
router.get('/region/:region', EnhancedAiTrendsController.generateRegionalAiTrends);
router.get('/category/:category', EnhancedAiTrendsController.generateCategoryAiTrends);
router.get('/comprehensive-report', EnhancedAiTrendsController.generateComprehensiveReport);

// Routes cho khuyến nghị (Recommend tab)
router.get('/recommendations', EnhancedAiTrendsController.getMedicineRecommendations);

// Routes cho thông tin thị trường (AI Trends Market tab)
router.get('/market-insights', EnhancedAiTrendsController.getMarketInsights);

// Route để lấy dữ liệu theo khu vực cụ thể
router.get('/region/:region/insights', EnhancedAiTrendsController.getMarketInsights);

// Route để lấy dữ liệu theo danh mục cụ thể
router.get('/category/:category/insights', EnhancedAiTrendsController.getMarketInsights);

module.exports = router;
