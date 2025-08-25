const searchService = require('../services/searchService');

/**
 * GET /api/search/global
 * Global search cho supervisor - có thể search tất cả
 */
const globalSearch = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const { role } = req.user;

    // Chỉ supervisor mới được global search
    if (role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện tìm kiếm toàn hệ thống',
      });
    }

    const results = await searchService.globalSearch(q, limit);
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm toàn hệ thống',
    });
  }
};

/**
 * GET /api/search/warehouse
 * Search cho warehouse manager
 */
const warehouseSearch = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const { role } = req.user;

    // Chỉ warehouse_manager mới được search warehouse
    if (role !== 'warehouse_manager') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện tìm kiếm này',
      });
    }

    const results = await searchService.warehouseSearch(q, limit);
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Warehouse search error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm warehouse',
    });
  }
};

/**
 * GET /api/search/warehouse-basic
 * Search cơ bản cho warehouse user
 */
const warehouseBasicSearch = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const { role } = req.user;

    // Chỉ warehouse user mới được search
    if (role !== 'warehouse') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện tìm kiếm này',
      });
    }

    const results = await searchService.warehouseBasicSearch(q, limit);
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Warehouse basic search error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm warehouse cơ bản',
    });
  }
};

/**
 * GET /api/search/representative
 * Search cho representative
 */
const representativeSearch = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const { role } = req.user;

    // Chỉ representative mới được search
    if (role !== 'representative') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện tìm kiếm này',
      });
    }

    const results = await searchService.representativeSearch(q, limit);
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Representative search error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm representative',
    });
  }
};

/**
 * GET /api/search/representative-manager
 * Search cho representative manager
 */
const representativeManagerSearch = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const { role } = req.user;

    // Chỉ representative_manager mới được search
    if (role !== 'representative_manager') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện tìm kiếm này',
      });
    }

    const results = await searchService.representativeManagerSearch(q, limit);
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Representative manager search error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm representative manager',
    });
  }
};

/**
 * GET /api/search/basic
 * Search cơ bản cho các role khác
 */
const basicSearch = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const { role } = req.user;

    const results = await searchService.basicSearch(q, limit, role);
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Basic search error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm cơ bản',
    });
  }
};

module.exports = {
  globalSearch,
  warehouseSearch,
  warehouseBasicSearch,
  representativeSearch,
  representativeManagerSearch,
  basicSearch,
};
