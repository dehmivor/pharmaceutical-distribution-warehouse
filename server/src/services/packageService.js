const Package = require('../models/Package');
const Location = require('../models/Location');
const Area = require('../models/Area');
const Batch = require('../models/Batch');
const Inventory = require('../models/Inventory');
const mongoose = require('mongoose');

const packageService = {
  // ✅ Get all packages with filtering and pagination
  getAllPackages: async (filters = {}) => {
    try {
      const { page = 1, limit = 10, status, location_id } = filters;

      // Build query
      const query = {};
      if (status) query.status = status;
      if (location_id) query.location_id = location_id;

      const skip = (page - 1) * limit;

      const packages = await Package.find(query)
        .populate({
          path: 'location_id',
          populate: {
            path: 'area_id',
            model: 'Area',
          },
        })
        .populate('batch_id')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Package.countDocuments(query);

      return {
        success: true,
        packages,
        pagination: {
          current_page: page,
          per_page: limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('❌ Get all packages service error:', error);
      return {
        success: false,
        message: 'Lỗi server khi lấy danh sách packages',
      };
    }
  },

  // ✅ Get package by ID
  getPackageById: async (packageId) => {
    try {
      if (!packageId) {
        return {
          success: false,
          message: 'Package ID là bắt buộc',
        };
      }

      const package = await Package.findById(packageId)
        .populate({
          path: 'location_id',
          populate: {
            path: 'area_id',
            model: 'Area',
          },
        })
        .populate({
          path: 'batch_id',
          populate: {
            path: 'medicine_id',
            select: 'medicine_name license_code',
          },
        });

      if (!package) {
        return {
          success: false,
          message: 'Không tìm thấy package',
        };
      }

      return {
        success: true,
        package,
      };
    } catch (error) {
      console.error('❌ Get package by ID service error:', error);

      if (error.name === 'CastError') {
        return {
          success: false,
          message: 'Package ID không hợp lệ',
        };
      }

      return {
        success: false,
        message: 'Lỗi server khi lấy thông tin package',
      };
    }
  },

  // ✅ Create new package
  createPackage: async (packageData) => {
    try {
      const { batch_id, quantity, location_id, status = 'PENDING', import_order_id } = packageData;

      // Validate required fields
      if (!batch_id || !quantity) {
        return {
          success: false,
          message: 'Batch ID, quantity là bắt buộc',
        };
      }
      // Create new package
      const newPackage = new Package({
        batch_id,
        quantity,
        location_id,
        import_order_id,
        status,
      });

      const savedPackage = await newPackage.save();

      // Populate data for response
      const populatedPackage = await Package.findById(savedPackage._id)
        .populate({
          path: 'location_id',
          populate: {
            path: 'area_id',
            model: 'Area',
          },
        })
        .populate('batch_id');

      return {
        success: true,
        package: populatedPackage,
      };
    } catch (error) {
      console.error('❌ Create package service error:', error);

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err) => err.message);
        return {
          success: false,
          message: messages.join(', '),
        };
      }

      return {
        success: false,
        message: 'Lỗi server khi tạo package',
      };
    }
  },

  // ✅ Update package location with inventory management
  updatePackageLocation: async (packageId, updateData) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { newLocationId, updatedBy } = updateData;

      // Validate input
      if (!newLocationId || !updatedBy) {
        await session.abortTransaction();
        return {
          success: false,
          message: 'New location ID và updated by là bắt buộc',
        };
      }

      // Get package info
      const pkg = await Package.findById(packageId).session(session);
      if (!pkg) {
        await session.abortTransaction();
        return {
          success: false,
          message: 'Package không tồn tại',
        };
      }

      // Check if new location exists and is available
      const newLocation = await Location.findById(newLocationId).session(session);
      if (!newLocation) {
        await session.abortTransaction();
        return {
          success: false,
          message: 'Location mới không tồn tại',
        };
      }

      if (!newLocation.available) {
        await session.abortTransaction();
        return {
          success: false,
          message: 'Location mới không khả dụng',
        };
      }

      // Check if the new location already has a package
      const existingPackage = await Package.findOne({
        location_id: newLocationId,
        _id: { $ne: packageId },
      }).session(session);

      if (existingPackage) {
        await session.abortTransaction();
        return {
          success: false,
          message: 'Location này đã có package khác',
        };
      }

      const oldLocationId = pkg.location_id;

      // Update package location
      await Package.findByIdAndUpdate(packageId, { location_id: newLocationId }, { session });

      // Update inventory - remove from old location if it exists
      if (oldLocationId) {
        const oldInventory = await Inventory.findOne({
          batch_id: pkg.batch_id,
          location_id: oldLocationId,
        }).session(session);

        if (oldInventory) {
          const updatedQuantity = oldInventory.quantity - pkg.quantity;
          if (updatedQuantity <= 0) {
            await Inventory.deleteOne({
              batch_id: pkg.batch_id,
              location_id: oldLocationId,
            }).session(session);
          } else {
            await Inventory.findOneAndUpdate(
              { batch_id: pkg.batch_id, location_id: oldLocationId },
              { $set: { quantity: updatedQuantity } },
              { session },
            );
          }
        }
      }

      // Update inventory - add to new location
      const existingInventory = await Inventory.findOne({
        batch_id: pkg.batch_id,
        location_id: newLocationId,
      }).session(session);

      if (existingInventory) {
        await Inventory.findOneAndUpdate(
          { batch_id: pkg.batch_id, location_id: newLocationId },
          { $inc: { quantity: pkg.quantity } },
          { session },
        );
      } else {
        // Get batch info and validate
        const batch = await mongoose.model('Batch').findById(pkg.batch_id).session(session);
        if (!batch) {
          await session.abortTransaction();
          return {
            success: false,
            message: 'Batch không tồn tại',
          };
        }

        await Inventory.create(
          [
            {
              medicine_id: batch.medicine_id,
              batch_id: pkg.batch_id,
              location_id: newLocationId,
              quantity: pkg.quantity,
            },
          ],
          { session },
        );
      }

      // Update location's updated_by
      await Location.findByIdAndUpdate(newLocationId, { updated_by: updatedBy }, { session });

      await session.commitTransaction();

      // Get updated package with populated data
      const updatedPackage = await Package.findById(packageId)
        .populate({
          path: 'location_id',
          populate: {
            path: 'area_id',
            model: 'Area',
          },
        })
        .populate('batch_id');

      return {
        success: true,
        package: updatedPackage,
      };
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Update package location service error:', error);
      return {
        success: false,
        message: 'Lỗi server khi cập nhật vị trí package',
      };
    } finally {
      session.endSession();
    }
  },

  // ✅ Confirm package storage
  confirmPackageStorage: async (packageId) => {
    try {
      if (!packageId) {
        return {
          success: false,
          message: 'Package ID là bắt buộc',
        };
      }

      // Get package info
      const pkg = await Package.findById(packageId);
      if (!pkg) {
        return {
          success: false,
          message: 'Package không tồn tại',
        };
      }

      // Update package status to STORED
      await Package.findByIdAndUpdate(packageId, { status: 'STORED' });

      // Get updated package with populated data
      const updatedPackage = await Package.findById(packageId)
        .populate({
          path: 'location_id',
          populate: {
            path: 'area_id',
            model: 'Area',
          },
        })
        .populate('batch_id');

      return {
        success: true,
        package: updatedPackage,
      };
    } catch (error) {
      console.error('❌ Confirm package storage service error:', error);
      return {
        success: false,
        message: 'Lỗi server khi xác nhận lưu trữ package',
      };
    }
  },

  // ✅ Get packages by location
  getPackagesByLocation: async (locationId) => {
    try {
      if (!locationId) {
        return {
          success: false,
          message: 'Location ID là bắt buộc',
        };
      }

      const packages = await Package.find({ location_id: locationId })
        .populate({
          path: 'location_id',
          populate: {
            path: 'area_id',
            model: 'Area',
          },
        })
        .populate({
          path: 'batch_id',
          populate: {
            path: 'medicine_id',
            select: 'medicine_name license_code',
          },
        })
        .sort({ created_at: -1 });

      return {
        success: true,
        packages,
      };
    } catch (error) {
      console.error('❌ Get packages by location service error:', error);
      return {
        success: false,
        message: 'Lỗi server khi lấy packages theo location',
      };
    }
  },

  // ✅ Get all available locations
  getAllLocations: async () => {
    try {
      const locations = await Location.find({ available: true })
        .populate('area_id')
        .sort({ position: 1 });

      return {
        success: true,
        locations,
      };
    } catch (error) {
      console.error('❌ Get all locations service error:', error);
      return {
        success: false,
        message: 'Lỗi server khi lấy danh sách locations',
      };
    }
  },

  getPackagesByImportOrder: async (importOrderId) => {
    try {
      if (!importOrderId) {
        return {
          success: false,
          message: 'importOrderId là bắt buộc',
        };
      }

      // Find packages for the given import order, populate related docs
      const packages = await Package.find({ import_order_id: importOrderId })
        // Populate location → area
        .populate({
          path: 'location_id',
          populate: { path: 'area_id', model: 'Area' },
        })
        // Populate batch → and within batch, populate medicine
        .populate({
          path: 'batch_id',
          populate: {
            path: 'medicine_id',
            model: 'Medicine',
            select: 'medicine_name license_code', // only needed fields
          },
        });

      return {
        success: true,
        packages,
      };
    } catch (error) {
      console.error('❌ Get packages by import order service error:', error);
      return {
        success: false,
        message: 'Lỗi server khi lấy packages theo import order',
      };
    }
  },


  clearPackageLocation: async (packageId) => {
    try {
      if (!packageId) {
        return { success: false, message: 'packageId là bắt buộc' };
      }
      await Package.findByIdAndUpdate(packageId, {
        $unset: { location_id: '' },
      });
      return { success: true };
    } catch (err) {
      console.error('❌ clearPackageLocation error:', err);
      return { success: false, message: 'Lỗi server khi xóa location' };
    }
  },


  getPackagesByBatch: async (batchId) => {
    // 1) Validate batchId
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      throw new Error('Invalid batch_id');
    }

    // 2) Query DB
    const packages = await Package.find({ batch_id: batchId })
      .populate({
        path: 'batch_id',
        select: 'batch_code production_date expiry_date quality_status',
      })
      .populate({
        path: 'location_id',
        select: 'bay row column',       // only these fields on Location
        populate: {
          path: 'area_id',               // nested populate of the Area doc
          select: 'name',                // just the area name
        },
      })
      .exec();

    return packages;
  },

  // V2 methods for Supervisor Package Management
  getAllPackagesV2: async ({ page = 1, limit = 10, medicine_id, area_id }) => {
    try {
      const skip = (page - 1) * limit;
      
      // Build query
      const query = {};
      if (medicine_id) {
        // Find packages by medicine_id through batch
        const batches = await Batch.find({ medicine_id }).select('_id');
        const batchIds = batches.map(batch => batch._id);
        query.batch_id = { $in: batchIds };
      }
      if (area_id) {
        // Find packages by area_id through location
        const locations = await Location.find({ area_id }).select('_id');
        const locationIds = locations.map(location => location._id);
        query.location_id = { $in: locationIds };
      }

      // Get total count
      const totalCount = await Package.countDocuments(query);
      
      // Get packages with pagination
      const packages = await Package.find(query)
        .populate({
          path: 'batch_id',
          select: 'batch_code medicine_id',
          populate: {
            path: 'medicine_id',
            select: 'medicine_name license_code',
          },
        })
        .populate({
          path: 'location_id',
          select: 'bay row column area_id',
          populate: {
            path: 'area_id',
            select: 'name',
          },
        })
        .skip(skip)
        .limit(limit)
        .sort({ _id: -1 });

      // Transform data for frontend
      const transformedPackages = packages.map(pkg => ({
        _id: pkg._id.toString().slice(-6), // Rút gọn _id
        location: pkg.location_id ? 
          `${pkg.location_id.area_id?.name || 'N/A'} - ${pkg.location_id.bay || 'N/A'} - ${pkg.location_id.row || 'N/A'} - ${pkg.location_id.column || 'N/A'}` : 
          'Chưa có vị trí',
        batch_code: pkg.batch_id?.batch_code || 'N/A',
        license_code: pkg.batch_id?.medicine_id?.license_code || 'N/A',
        medicine_name: pkg.batch_id?.medicine_id?.medicine_name || 'N/A',
        quantity: pkg.quantity,
        full_id: pkg._id, // Giữ lại full ID cho các operations
        location_id: pkg.location_id?._id,
        batch_id: pkg.batch_id?._id,
        medicine_id: pkg.batch_id?.medicine_id?._id,
      }));

      return {
        packages: transformedPackages,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error('Error in getAllPackagesV2:', error);
      throw error;
    }
  },

  getPackageByIdV2: async (id) => {
    try {
      const package = await Package.findById(id)
        .populate({
          path: 'batch_id',
          select: 'batch_code medicine_id',
          populate: {
            path: 'medicine_id',
            select: 'medicine_name',
          },
        })
        .populate({
          path: 'location_id',
          select: 'bay row column area_id',
          populate: {
            path: 'area_id',
            select: 'name',
          },
        });

      if (!package) {
        return {
          success: false,
          message: 'Package not found',
        };
      }

      return {
        success: true,
        package: {
          _id: package._id,
          quantity: package.quantity,
          batch_code: package.batch_id?.batch_code,
          medicine_name: package.batch_id?.medicine_id?.medicine_name,
          location: package.location_id ? {
            _id: package.location_id._id,
            area_name: package.location_id.area_id?.name,
            bay: package.location_id.bay,
            row: package.location_id.row,
            column: package.location_id.column,
          } : null,
          batch_id: package.batch_id?._id,
          medicine_id: package.batch_id?.medicine_id?._id,
        },
      };
    } catch (error) {
      console.error('Error in getPackageByIdV2:', error);
      return {
        success: false,
        message: 'Error getting package',
      };
    }
  },

  updatePackageLocationV2: async (packageId, newLocationId) => {
    try {
      // Check if package exists
      const package = await Package.findById(packageId);
      if (!package) {
        return {
          success: false,
          message: 'Package not found',
        };
      }

      // Check if new location exists and is available
      const newLocation = await Location.findById(newLocationId);
      if (!newLocation) {
        return {
          success: false,
          message: 'New location not found',
        };
      }

      if (!newLocation.available) {
        return {
          success: false,
          message: 'New location is not available',
        };
      }

      // Update package location
      const updatedPackage = await Package.findByIdAndUpdate(
        packageId,
        { location_id: newLocationId },
        { new: true }
      ).populate({
        path: 'batch_id',
        select: 'batch_code medicine_id',
        populate: {
          path: 'medicine_id',
          select: 'medicine_name',
        },
      }).populate({
        path: 'location_id',
        select: 'bay row column area_id',
        populate: {
          path: 'area_id',
          select: 'name',
        },
      });

      return {
        success: true,
        package: {
          _id: updatedPackage._id,
          quantity: updatedPackage.quantity,
          batch_code: updatedPackage.batch_id?.batch_code,
          medicine_name: updatedPackage.batch_id?.medicine_id?.medicine_name,
          location: updatedPackage.location_id ? {
            _id: updatedPackage.location_id._id,
            area_name: updatedPackage.location_id.area_id?.name,
            bay: updatedPackage.location_id.bay,
            row: updatedPackage.location_id.row,
            column: updatedPackage.location_id.column,
          } : null,
        },
      };
    } catch (error) {
      console.error('Error in updatePackageLocationV2:', error);
      return {
        success: false,
        message: 'Error updating package location',
      };
    }
  },

  updatePackageV2: async (packageId, updateData) => {
    try {
      const { newLocationId, quantity } = updateData;

      // Check if package exists
      const package = await Package.findById(packageId);
      if (!package) {
        return {
          success: false,
          message: 'Package not found',
        };
      }

      // Prepare update object
      const updateObject = {};

      // Update location if provided
      if (newLocationId) {
        const newLocation = await Location.findById(newLocationId);
        if (!newLocation) {
          return {
            success: false,
            message: 'New location not found',
          };
        }

        if (!newLocation.available) {
          return {
            success: false,
            message: 'New location is not available',
          };
        }

        updateObject.location_id = newLocationId;
      }

      // Update quantity if provided
      if (quantity !== undefined && quantity !== null) {
        updateObject.quantity = quantity;
      }

      // If no updates to make, return success
      if (Object.keys(updateObject).length === 0) {
        return {
          success: false,
          message: 'No updates provided',
        };
      }

      // Update package
      const updatedPackage = await Package.findByIdAndUpdate(
        packageId,
        updateObject,
        { new: true }
      ).populate({
        path: 'batch_id',
        select: 'batch_code medicine_id',
        populate: {
          path: 'medicine_id',
          select: 'medicine_name',
        },
      }).populate({
        path: 'location_id',
        select: 'bay row column area_id',
        populate: {
          path: 'area_id',
          select: 'name',
        },
      });

      return {
        success: true,
        package: {
          _id: updatedPackage._id,
          quantity: updatedPackage.quantity,
          batch_code: updatedPackage.batch_id?.batch_code,
          medicine_name: updatedPackage.batch_id?.medicine_id?.medicine_name,
          location: updatedPackage.location_id ? {
            _id: updatedPackage.location_id._id,
            area_name: updatedPackage.location_id.area_id?.name,
            bay: updatedPackage.location_id.bay,
            row: updatedPackage.location_id.row,
            column: updatedPackage.location_id.column,
          } : null,
        },
      };
    } catch (error) {
      console.error('Error in updatePackageV2:', error);
      return {
        success: false,
        message: 'Error updating package',
      };
    }
  },

};

module.exports = packageService;