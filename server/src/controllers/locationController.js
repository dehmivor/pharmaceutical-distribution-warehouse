const Package = require('../models/Package');
const Batch = require('../models/Batch');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const locationService = require('../services/locationService');
const { USER_ROLES } = require('../utils/constants');
const { Location } = require('../models');

// Existing methods (keep unchanged)
const getLocationsWithBatches = async (req, res) => {
  try {
    const locations = await Location.aggregate([
      {
        $lookup: {
          from: 'batches',
          localField: 'position',
          foreignField: 'batch_code',
          as: 'batch_info',
        },
      },
      { $match: { batch_info: { $ne: [] } } },
    ]);
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAvailableLocations = async (req, res) => {
  try {
    const locations = await Location.find({ available: true });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLocationsByBatchMedicine = async (req, res) => {
  try {
    const { batchId } = req.params;

    // 1) Find the batch to get its medicine_id
    const batch = await Batch.findById(batchId).select('medicine_id');
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
      });
    }

    // 2) Gather all batch IDs with that medicine_id
    const siblingBatches = await Batch.find({ medicine_id: batch.medicine_id }).select('_id');
    const batchIds = siblingBatches.map((b) => b._id);

    // 3) Find distinct location_ids from Package
    const locationIds = await Package.distinct('location_id', {
      batch_id: { $in: batchIds },
      location_id: { $ne: null },
    });

    // 4) Fetch full Location docs (populate area if desired)
    const locations = await Location.find({ _id: { $in: locationIds } }).populate(
      'area_id',
      'name',
    ); // only bring back area name

    return res.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error('Error in getLocationsByBatchMedicine:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching locations',
      error: error.message,
    });
  }
};

const getLocationWithPackages = async (req, res) => {
  try {
    const { locationId } = req.params;

    // 1) Load the Location
    const location = await Location.findById(locationId).populate(
      'area_id',
      'name storage_conditions',
    );
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      });
    }

    // 2) Load all Packages in that location
    const packages = await Package.find({ location_id: locationId })
      .populate({
        path: 'batch_id',
        select: 'batch_code expiry_date quality_status',
        populate: {
          path: 'medicine_id',
          select: 'medicine_name unit_of_measure',
        },
      })
      .populate('import_order_id', 'status') // if you want import order info
      .sort({ _id: -1 });

    // 3) Return combined result
    return res.json({
      success: true,
      data: {
        location,
        packages,
      },
    });
  } catch (error) {
    console.error('Error fetching location with packages:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching location and its packages',
      error: error.message,
    });
  }
};

const getLocationById = async (req, res) => {
  try {
    const { locationId } = req.params;
    const result = await locationService.getLocationById(locationId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching location:', err);
    const status =
      err.statusCode === 400 && err.message === 'locationId is required'
        ? 400
        : err.statusCode === 404
          ? 404
          : err.name === 'CastError'
            ? 400
            : 500;

    const message =
      status === 400 && err.name === 'CastError' ? 'Invalid location ID format' : err.message;

    res.status(status).json({ success: false, message });
  }
};

// New V2 methods for Location Management
const getAllLocations = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { page = 1, limit = 10, areaId = '', available = '' } = req.query;
  const result = await locationService.getAllLocations(
    parseInt(page),
    parseInt(limit),
    areaId,
    available,
  );

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

const getLocationByIdV2 = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const result = await locationService.getLocationById(id);

  if (!result.success) {
    return res.status(404).json(result);
  }

  res.json(result);
});

const getLocationInfo = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const result = await locationService.getLocationInfo(id);

  if (!result.success) {
    return res.status(404).json(result);
  }

  res.json(result);
});

const updateLocationAvailable = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  if (req.user.role !== USER_ROLES.SUPERVISOR) {
    return res.status(403).json({
      success: false,
      message: 'Chỉ supervisor mới có quyền cập nhật trạng thái vị trí',
    });
  }

  const { id } = req.params;
  const { available } = req.body;
  const result = await locationService.updateLocationAvailable(id, available);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

const createLocation = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  if (req.user.role !== USER_ROLES.SUPERVISOR) {
    return res.status(403).json({
      success: false,
      message: 'Chỉ supervisor mới có quyền tạo vị trí',
    });
  }

  const io = req.app.locals.io;
  const result = await locationService.createLocation(req.body, io);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(201).json(result);
});

const deleteLocation = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  if (req.user.role !== USER_ROLES.SUPERVISOR) {
    return res.status(403).json({
      success: false,
      message: 'Chỉ supervisor mới có quyền xóa vị trí',
    });
  }

  const { id } = req.params;
  const result = await locationService.deleteLocation(id);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

module.exports = {
  // Existing methods
  getLocationsWithBatches,
  getAvailableLocations,
  getLocationsByBatchMedicine,
  getLocationWithPackages,
  getLocationById,

  // New V2 methods
  getAllLocations,
  getLocationByIdV2,
  getLocationInfo,
  updateLocationAvailable,
  deleteLocation,
  createLocation,
};
