const Retailer = require('../models/Retailer');

const retailerService = {
  // ✅ Get all retailers with active status
  getAllRetailers: async () => {
    try {
      const retailers = await Retailer.find(
        { status: 'active' }, // Lọc chỉ lấy retailer active
        { _id: 1, name: 1 }, // Chỉ lấy _id và name
      ).lean();

      return {
        success: true,
        data: retailers,
      };
    } catch (error) {
      console.error('Error in getAllRetailers service:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách nhà bán lẻ',
      };
    }
  },

  // Get all retailers for management (including inactive)
  getAllRetailersForManagement: async (page = 1, limit = 10, filters = {}) => {
    try {
      const skip = (page - 1) * limit;
      const query = {};

      // Apply filters
      if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
      }
      if (filters.status) {
        query.status = filters.status;
      }

      const retailers = await Retailer.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      const total = await Retailer.countDocuments(query);

      return {
        success: true,
        data: {
          retailers,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          }
        },
      };
    } catch (error) {
      console.error('Error in getAllRetailersForManagement service:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách nhà bán lẻ',
      };
    }
  },

  // Get retailer by ID
  getRetailerById: async (id) => {
    try {
      const retailer = await Retailer.findById(id).lean();
      
      if (!retailer) {
        return {
          success: false,
          message: 'Không tìm thấy nhà bán lẻ',
        };
      }

      return {
        success: true,
        data: retailer,
      };
    } catch (error) {
      console.error('Error in getRetailerById service:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy thông tin nhà bán lẻ',
      };
    }
  },

  // Create new retailer
  createRetailer: async (retailerData) => {
    try {
      // Check if retailer with same name already exists
      const existingRetailer = await Retailer.findOne({ name: retailerData.name });
      if (existingRetailer) {
        return {
          success: false,
          message: 'Nhà bán lẻ với tên này đã tồn tại',
        };
      }

      const retailer = new Retailer(retailerData);
      await retailer.save();

      return {
        success: true,
        data: retailer,
      };
    } catch (error) {
      console.error('Error in createRetailer service:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo nhà bán lẻ',
      };
    }
  },

  // Update retailer
  updateRetailer: async (id, updateData) => {
    try {
      // Check if retailer exists
      const existingRetailer = await Retailer.findById(id);
      if (!existingRetailer) {
        return {
          success: false,
          message: 'Không tìm thấy nhà bán lẻ',
        };
      }

      // Check if name is being changed and if it conflicts with existing retailer
      if (updateData.name && updateData.name !== existingRetailer.name) {
        const nameConflict = await Retailer.findOne({ 
          name: updateData.name, 
          _id: { $ne: id } 
        });
        if (nameConflict) {
          return {
            success: false,
            message: 'Nhà bán lẻ với tên này đã tồn tại',
          };
        }
      }

      const updatedRetailer = await Retailer.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      return {
        success: true,
        data: updatedRetailer,
      };
    } catch (error) {
      console.error('Error in updateRetailer service:', error);
      return {
        success: false,
        message: 'Lỗi khi cập nhật nhà bán lẻ',
      };
    }
  },

  // Delete retailer
  deleteRetailer: async (id) => {
    try {
      const retailer = await Retailer.findById(id);
      if (!retailer) {
        return {
          success: false,
          message: 'Không tìm thấy nhà bán lẻ',
        };
      }

      await Retailer.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Xóa nhà bán lẻ thành công',
      };
    } catch (error) {
      console.error('Error in deleteRetailer service:', error);
      return {
        success: false,
        message: 'Lỗi khi xóa nhà bán lẻ',
      };
    }
  },
};

module.exports = retailerService; 