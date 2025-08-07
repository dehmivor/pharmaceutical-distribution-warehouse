const Location = require('../models/Location');
const Package = require('../models/Package');
const Area = require('../models/Area');

class LocationService {
  async getAllLocations(page = 1, limit = 10, areaId = '', available = '') {
    try {
      const skip = (page - 1) * limit;

      // Build query
      let query = {};
      if (areaId) {
        query.area_id = areaId;
      }
      if (available !== '') {
        query.available = available === 'true';
      }

      // Get total count
      const total = await Location.countDocuments(query);

      // Get locations with pagination and populate area
      const locations = await Location.find(query)
        .populate('area_id', 'name')
        .sort({
          'area_id.name': 1,  // Theo tên khu vực
          bay: 1,
          row: 1,
          column: 1
        })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: {
          locations,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage,
            hasPrevPage,
          },
        },
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getLocationInfo(id) {
    try {
      const location = await Location.findById(id).populate('area_id', 'name');
      if (!location) {
        return { success: false, message: 'Không tìm thấy vị trí' };
      }

      // Get packages in this location with batch and medicine info
      const packages = await Package.find({ location_id: id })
        .populate({
          path: 'batch_id',
          populate: {
            path: 'medicine_id',
            select: 'name license_code'
          }
        });

      // Prepare package data
      const packageData = packages.map(pkg => ({
        package_id: pkg._id,
        batch_code: pkg.batch_id.batch_code,
        medicine_license_code: pkg.batch_id.medicine_id.license_code,
        medicine_name: pkg.batch_id.medicine_id.name,
        quantity: pkg.quantity
      }));

      // Group by medicine for medicine view
      const medicineSummary = packages.reduce((acc, pkg) => {
        const medicineLicenseCode = pkg.batch_id.medicine_id.license_code;
        const medicineName = pkg.batch_id.medicine_id.name;
        const key = medicineLicenseCode;

        if (!acc[key]) {
          acc[key] = {
            medicine_license_code: medicineLicenseCode,
            medicine_name: medicineName,
            total_quantity: 0
          };
        }

        acc[key].total_quantity += pkg.quantity;
        return acc;
      }, {});

      return {
        success: true,
        data: {
          location,
          packages: packageData,
          medicine_summary: Object.values(medicineSummary),
          total_packages: packages.length
        }
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async updateLocationAvailable(id, available) {
    try {
      const location = await Location.findByIdAndUpdate(
        id,
        { available },
        { new: true, runValidators: true }
      ).populate('area_id', 'name');

      if (!location) {
        return { success: false, message: 'Không tìm thấy vị trí' };
      }

      return {
        success: true,
        data: location,
        message: `Cập nhật trạng thái vị trí thành công`
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async createLocation(locationData) {
    try {
      const location = new Location(locationData);
      await location.save();
      const populatedLocation = await Location.findById(location._id).populate('area_id', 'name');
      return { success: true, data: populatedLocation, message: 'Tạo vị trí thành công' };
    } catch (error) {
      if (error.code === 11000) {
        return { success: false, message: 'Vị trí này đã tồn tại trong khu vực' };
      }
      return { success: false, message: error.message };
    }
  }

  async deleteLocation(id) {
    try {
      // Check if there are any packages in this location
      const packagesCount = await Package.countDocuments({ location_id: id });
      if (packagesCount > 0) {
        return {
          success: false,
          message: `Không thể xóa vị trí. Có ${packagesCount} package đang được lưu trữ tại vị trí này.`
        };
      }

      const location = await Location.findByIdAndDelete(id);
      if (!location) {
        return { success: false, message: 'Không tìm thấy vị trí' };
      }

      return { success: true, message: 'Xóa vị trí thành công' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }


  async getLocationByCoordinates(areaId, bay, row, column) {
    if (!areaId || !bay || !row || !column) {
      throw new Error('areaId, bay, row, and column are all required');
    }

    return await Location.findOne({
      area_id: areaId,
      bay: bay.trim(),
      row: row.trim(),
      column: column.trim(),
    })
      .populate({
        path: 'area_id',
        select: 'name storage_conditions description'
      })
      .lean();
  }

async  getLocationById(locationId) {
  if (!locationId) {
    const err = new Error('locationId is required');
    err.statusCode = 400;
    throw err;
  }

  // Mongoose will throw a CastError if the format is invalid
  const location = await Location.findById(locationId)
    .populate('area_id')
    .lean();

  if (!location) {
    const err = new Error(`No location found with id ${locationId}`);
    err.statusCode = 404;
    throw err;
  }

  return location;
}

}

module.exports = new LocationService(); 