const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const {
  globalSearch,
  warehouseSearch,
  warehouseBasicSearch,
  representativeSearch,
  representativeManagerSearch,
  basicSearch,
} = require('../controllers/searchController');

// Tất cả routes đều cần authentication
router.use(authenticate);

// Global search - chỉ supervisor
router.get('/global', globalSearch);

// Warehouse search - chỉ warehouse_manager
router.get('/warehouse', warehouseSearch);

// Warehouse basic search - chỉ warehouse
router.get('/warehouse-basic', warehouseBasicSearch);

// Representative search - chỉ representative
router.get('/representative', representativeSearch);

// Representative manager search - chỉ representative_manager
router.get('/representative-manager', representativeManagerSearch);

// Basic search - cho tất cả role
router.get('/basic', basicSearch);

module.exports = router;
