const Area = require('../models/Area');

const areaController = {
  // Get all areas
  getAllAreas: async (req, res) => {
    try {
      const areas = await Area.find().sort({ name: 1 });
      res.json(areas);
    } catch (error) {
      console.error('Error fetching areas:', error);
      res.status(500).json({ error: 'Không thể tải danh sách khu vực' });
    }
  },

  // Get area by ID
  getAreaById: async (req, res) => {
    try {
      const { id } = req.params;
      const area = await Area.findById(id);
      
      if (!area) {
        return res.status(404).json({ error: 'Không tìm thấy khu vực' });
      }
      
      res.json(area);
    } catch (error) {
      console.error('Error fetching area:', error);
      res.status(500).json({ error: 'Không thể tải thông tin khu vực' });
    }
  },

  // Create new area
  createArea: async (req, res) => {
    try {
      const areaData = req.body;
      const area = new Area(areaData);
      await area.save();
      
      res.status(201).json({
        message: 'Tạo khu vực thành công',
        area
      });
    } catch (error) {
      console.error('Error creating area:', error);
      if (error.code === 11000) {
        res.status(400).json({ error: 'Tên khu vực đã tồn tại' });
      } else {
        res.status(500).json({ error: 'Không thể tạo khu vực' });
      }
    }
  },

  // Update area
  updateArea: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const area = await Area.findByIdAndUpdate(id, updateData, { 
        new: true, 
        runValidators: true 
      });
      
      if (!area) {
        return res.status(404).json({ error: 'Không tìm thấy khu vực' });
      }
      
      res.json({
        message: 'Cập nhật khu vực thành công',
        area
      });
    } catch (error) {
      console.error('Error updating area:', error);
      if (error.code === 11000) {
        res.status(400).json({ error: 'Tên khu vực đã tồn tại' });
      } else {
        res.status(500).json({ error: 'Không thể cập nhật khu vực' });
      }
    }
  },

  // Delete area
  deleteArea: async (req, res) => {
    try {
      const { id } = req.params;
      const area = await Area.findByIdAndDelete(id);
      
      if (!area) {
        return res.status(404).json({ error: 'Không tìm thấy khu vực' });
      }
      
      res.json({ message: 'Xóa khu vực thành công' });
    } catch (error) {
      console.error('Error deleting area:', error);
      res.status(500).json({ error: 'Không thể xóa khu vực' });
    }
  },
};

module.exports = areaController;
