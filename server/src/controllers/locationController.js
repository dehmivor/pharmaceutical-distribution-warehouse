const Location = require('../models/Location');
const Package = require('../models/Package');
const Batch = require('../models/Batch');


const locationController = {

  getLocationsWithBatches: async (req, res) => {
    try {
      const locations = await Location.aggregate([
        {
          $lookup: {
            from: 'batches',
            localField: 'position',
            foreignField: 'batch_code',
            as: 'batch_info'
          }
        },
        { $match: { 'batch_info': { $ne: [] } } }
      ]);
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getAvailableLocations: async (req, res) => {
    try {
      const locations = await Location.find({ available: true });
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getLocationsByBatchMedicine: async (req, res) => {
    try {
      const { batchId } = req.params;

      // 1) Find the batch to get its medicine_id
      const batch = await Batch.findById(batchId).select('medicine_id');
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }

      // 2) Gather all batch IDs with that medicine_id
      const siblingBatches = await Batch
        .find({ medicine_id: batch.medicine_id })
        .select('_id');
      const batchIds = siblingBatches.map(b => b._id);

      // 3) Find distinct location_ids from Package
      const locationIds = await Package.distinct('location_id', {
        batch_id: { $in: batchIds },
        location_id: { $ne: null }
      });

      // 4) Fetch full Location docs (populate area if desired)
      const locations = await Location.find({ _id: { $in: locationIds } })
        .populate('area_id', 'name');  // only bring back area name

      return res.json({
        success: true,
        data: locations
      });

    } catch (error) {
      console.error('Error in getLocationsByBatchMedicine:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error fetching locations',
        error: error.message
      });
    }
  },

  getLocationWithPackages: async (req, res) => {
    try {
      const { locationId } = req.params;

      // 1) Load the Location
      const location = await Location.findById(locationId)
        .populate('area_id', 'name storage_conditions');
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // 2) Load all Packages in that location
      const packages = await Package.find({ location_id: locationId })
        .populate({
          path: 'batch_id',
          select: 'batch_code expiry_date quality_status',
          populate: {
            path: 'medicine_id',
            select: 'medicine_name unit_of_measure'
          }
        })
        .populate('import_order_id', 'status')   // if you want import order info
        .sort({ _id: -1 });

      // 3) Return combined result
      return res.json({
        success: true,
        data: {
          location,
          packages
        }
      });
    } catch (error) {
      console.error('Error fetching location with packages:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error fetching location and its packages',
        error: error.message
      });
    }
  },

}

module.exports = locationController