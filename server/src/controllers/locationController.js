const Location = require('../models/Location');

exports.getLocationsWithBatches = async (req, res) => {
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
};

exports.getAvailableLocations = async (req, res) => {
  try {
    const locations = await Location.find({ available: true });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};