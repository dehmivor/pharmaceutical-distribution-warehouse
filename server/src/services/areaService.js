const Area = require('../models/Area');

class AreaService {
  async getAllAreas(page = 1, limit = 10, search = '') {
    try {
      const skip = (page - 1) * limit;
      
      // Build query
      let query = {};
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      // Get total count
      const total = await Area.countDocuments(query);
      
      // Get areas with pagination
      const areas = await Area.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: {
          areas,
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

  async createArea(areaData) {
    try {
      const area = new Area(areaData);
      await area.save();
      return { success: true, data: area, message: 'Tạo khu vực thành công' };
    } catch (error) {
      if (error.code === 11000) {
        return { success: false, message: 'Tên khu vực đã tồn tại' };
      }
      return { success: false, message: error.message };
    }
  }

  async getAreaById(id) {
    try {
      const area = await Area.findById(id);
      if (!area) {
        return { success: false, message: 'Không tìm thấy khu vực' };
      }
      return { success: true, data: area };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async updateArea(id, updateData) {
    try {
      const area = await Area.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!area) {
        return { success: false, message: 'Không tìm thấy khu vực' };
      }
      
      return { success: true, data: area, message: 'Cập nhật khu vực thành công' };
    } catch (error) {
      if (error.code === 11000) {
        return { success: false, message: 'Tên khu vực đã tồn tại' };
      }
      return { success: false, message: error.message };
    }
  }

  async deleteArea(id) {
    try {
      const area = await Area.findByIdAndDelete(id);
      if (!area) {
        return { success: false, message: 'Không tìm thấy khu vực' };
      }
      return { success: true, message: 'Xóa khu vực thành công' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new AreaService(); 