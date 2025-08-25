const User = require('../models/User');
const ImportOrder = require('../models/ImportOrder');
const ExportOrder = require('../models/ExportOrder');
const Medicine = require('../models/Medicine');
const Location = require('../models/Location');
const Contract = require('../models/Contract');

class SearchService {
  /**
   * Global search cho supervisor - có thể search tất cả
   */
  async globalSearch(keyword, limit = 10) {
    try {
      const results = [];

      // Search users
      const users = await User.find({
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { email: { $regex: keyword, $options: 'i' } },
          { role: { $regex: keyword, $options: 'i' } },
        ],
      })
        .limit(limit)
        .select('name email role avatar_url');

      users.forEach((user) => {
        results.push({
          type: 'user',
          title: user.name,
          subtitle: user.email,
          description: `Vai trò: ${user.role}`,
          action_url: `/sp-manage-users/${user._id}`,
          navigate_to: `/sp-manage-users/${user._id}`,
          status: user.status || 'active',
        });
      });

      // Search orders
      const importOrders = await ImportOrder.find({
        $or: [
          { order_code: { $regex: keyword, $options: 'i' } },
          { 'contract_id.partner_id.name': { $regex: keyword, $options: 'i' } },
        ],
      })
        .populate('contract_id.partner_id', 'name')
        .limit(limit);

      importOrders.forEach((order) => {
        results.push({
          type: 'order',
          title: `Đơn nhập: ${order.order_code}`,
          subtitle: order.contract_id?.partner_id?.name || 'Không có nhà cung cấp',
          description: `Trạng thái: ${order.status}`,
          action_url: `/sp-import-orders/${order._id}`,
          navigate_to: `/sp-import-orders/${order._id}`,
          status: order.status,
        });
      });

      const exportOrders = await ExportOrder.find({
        $or: [
          { order_code: { $regex: keyword, $options: 'i' } },
          { 'contract_id.partner_id.name': { $regex: keyword, $options: 'i' } },
        ],
      })
        .populate('contract_id.partner_id', 'name')
        .limit(limit);

      exportOrders.forEach((order) => {
        results.push({
          type: 'order',
          title: `Đơn xuất: ${order.order_code}`,
          subtitle: order.contract_id?.partner_id?.name || 'Không có khách hàng',
          description: `Trạng thái: ${order.status}`,
          action_url: `/sp-export-orders/${order._id}`,
          navigate_to: `/sp-export-orders/${order._id}`,
          status: order.status,
        });
      });

      // Search medicines
      const medicines = await Medicine.find({
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { license_code: { $regex: keyword, $options: 'i' } },
          { manufacturer: { $regex: keyword, $options: 'i' } },
        ],
      }).limit(limit);

      medicines.forEach((medicine) => {
        results.push({
          type: 'medicine',
          title: medicine.name,
          subtitle: medicine.license_code,
          description: `Nhà sản xuất: ${medicine.manufacturer}`,
          action_url: `/sp-manage-medicines/${medicine._id}`,
          navigate_to: `/sp-manage-medicines/${medicine._id}`,
          status: medicine.status || 'active',
        });
      });

      // Search locations
      const locations = await Location.find({
        $or: [
          { 'area_id.name': { $regex: keyword, $options: 'i' } },
          { bay: { $regex: keyword, $options: 'i' } },
          { row: { $regex: keyword, $options: 'i' } },
          { column: { $regex: keyword, $options: 'i' } },
        ],
      })
        .populate('area_id', 'name')
        .limit(limit);

      locations.forEach((location) => {
        results.push({
          type: 'location',
          title: `${location.area_id?.name || 'Không có khu vực'} - Bay ${location.bay}, Row ${location.row}, Col ${location.column}`,
          subtitle: `Trạng thái: ${location.available ? 'Có sẵn' : 'Đã sử dụng'}`,
          description: `Vị trí: ${location.bay}-${location.row}-${location.column}`,
          action_url: `/sp-location-management/${location._id}`,
          navigate_to: `/sp-location-management/${location._id}`,
          status: location.available ? 'available' : 'occupied',
        });
      });

      return results.slice(0, limit);
    } catch (error) {
      console.error('Global search error:', error);
      throw error;
    }
  }

  /**
   * Search cho warehouse manager
   */
  async warehouseSearch(keyword, limit = 10) {
    try {
      const results = [];

      // Search inventory
      const medicines = await Medicine.find({
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { license_code: { $regex: keyword, $options: 'i' } },
        ],
      }).limit(limit);

      medicines.forEach((medicine) => {
        results.push({
          type: 'medicine',
          title: medicine.name,
          subtitle: medicine.license_code,
          description: `Nhà sản xuất: ${medicine.manufacturer}`,
          action_url: `/wm-manage-medicines/${medicine._id}`,
          navigate_to: `/wm-manage-medicines/${medicine._id}`,
          status: medicine.status || 'active',
        });
      });

      // Search locations
      const locations = await Location.find({
        $or: [
          { 'area_id.name': { $regex: keyword, $options: 'i' } },
          { bay: { $regex: keyword, $options: 'i' } },
        ],
      })
        .populate('area_id', 'name')
        .limit(limit);

      locations.forEach((location) => {
        results.push({
          type: 'location',
          title: `${location.area_id?.name || 'Không có khu vực'} - Bay ${location.bay}`,
          subtitle: `Row ${location.row}, Col ${location.column}`,
          description: `Trạng thái: ${location.available ? 'Có sẵn' : 'Đã sử dụng'}`,
          action_url: `/wm-location-management/${location._id}`,
          navigate_to: `/wm-location-management/${location._id}`,
          status: location.available ? 'available' : 'occupied',
        });
      });

      // Search orders
      const importOrders = await ImportOrder.find({
        order_code: { $regex: keyword, $options: 'i' },
      }).limit(limit);

      importOrders.forEach((order) => {
        results.push({
          type: 'order',
          title: `Đơn nhập: ${order.order_code}`,
          subtitle: `Trạng thái: ${order.status}`,
          description: `Ngày tạo: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}`,
          action_url: `/wm-import-orders/${order._id}`,
          navigate_to: `/wm-import-orders/${order._id}`,
          status: order.status,
        });
      });

      return results.slice(0, limit);
    } catch (error) {
      console.error('Warehouse search error:', error);
      throw error;
    }
  }

  /**
   * Search cơ bản cho warehouse user
   */
  async warehouseBasicSearch(keyword, limit = 10) {
    try {
      const results = [];

      // Search locations
      const locations = await Location.find({
        $or: [
          { 'area_id.name': { $regex: keyword, $options: 'i' } },
          { bay: { $regex: keyword, $options: 'i' } },
        ],
      })
        .populate('area_id', 'name')
        .limit(limit);

      locations.forEach((location) => {
        results.push({
          type: 'location',
          title: `${location.area_id?.name || 'Không có khu vực'} - Bay ${location.bay}`,
          subtitle: `Row ${location.row}, Col ${location.column}`,
          description: `Trạng thái: ${location.available ? 'Có sẵn' : 'Đã sử dụng'}`,
          action_url: `/wh-location/${location._id}`,
          navigate_to: `/wh-location/${location._id}`,
          status: location.available ? 'available' : 'occupied',
        });
      });

      return results.slice(0, limit);
    } catch (error) {
      console.error('Warehouse basic search error:', error);
      throw error;
    }
  }

  /**
   * Search cho representative
   */
  async representativeSearch(keyword, limit = 10) {
    try {
      const results = [];

      // Search orders
      const importOrders = await ImportOrder.find({
        $or: [
          { order_code: { $regex: keyword, $options: 'i' } },
          { 'contract_id.contract_code': { $regex: keyword, $options: 'i' } },
        ],
      })
        .populate('contract_id', 'contract_code')
        .limit(limit);

      importOrders.forEach((order) => {
        results.push({
          type: 'order',
          title: `Đơn nhập: ${order.order_code}`,
          subtitle: `Hợp đồng: ${order.contract_id?.contract_code || 'Không có'}`,
          description: `Trạng thái: ${order.status}`,
          action_url: `/rp-import-orders/${order._id}`,
          navigate_to: `/rp-import-orders/${order._id}`,
          status: order.status,
        });
      });

      // Search contracts
      const contracts = await Contract.find({
        contract_code: { $regex: keyword, $options: 'i' },
      })
        .populate('partner_id', 'name')
        .limit(limit);

      contracts.forEach((contract) => {
        results.push({
          type: 'contract',
          title: `Hợp đồng: ${contract.contract_code}`,
          subtitle: contract.partner_id?.name || 'Không có đối tác',
          description: `Loại: ${contract.type}`,
          action_url: `/rp-manage-contracts/${contract._id}`,
          navigate_to: `/rp-manage-contracts/${contract._id}`,
          status: contract.status,
        });
      });

      return results.slice(0, limit);
    } catch (error) {
      console.error('Representative search error:', error);
      throw error;
    }
  }

  /**
   * Search cho representative manager
   */
  async representativeManagerSearch(keyword, limit = 10) {
    try {
      const results = [];

      // Search orders
      const importOrders = await ImportOrder.find({
        $or: [
          { order_code: { $regex: keyword, $options: 'i' } },
          { 'contract_id.contract_code': { $regex: keyword, $options: 'i' } },
        ],
      })
        .populate('contract_id', 'contract_code')
        .limit(limit);

      importOrders.forEach((order) => {
        results.push({
          type: 'order',
          title: `Đơn nhập: ${order.order_code}`,
          subtitle: `Hợp đồng: ${order.contract_id?.contract_code || 'Không có'}`,
          description: `Trạng thái: ${order.status}`,
          action_url: `/rm-import-orders/${order._id}`,
          navigate_to: `/rm-import-orders/${order._id}`,
          status: order.status,
        });
      });

      // Search contracts
      const contracts = await Contract.find({
        contract_code: { $regex: keyword, $options: 'i' },
      })
        .populate('partner_id', 'name')
        .limit(limit);

      contracts.forEach((contract) => {
        results.push({
          type: 'contract',
          title: `Hợp đồng: ${contract.contract_code}`,
          subtitle: contract.partner_id?.name || 'Không có đối tác',
          description: `Loại: ${contract.type}`,
          action_url: `/rm-manage-contracts/${contract._id}`,
          navigate_to: `/rm-manage-contracts/${contract._id}`,
          status: contract.status,
        });
      });

      // Search users (representatives)
      const users = await User.find({
        role: 'representative',
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { email: { $regex: keyword, $options: 'i' } },
        ],
      })
        .limit(limit)
        .select('name email');

      users.forEach((user) => {
        results.push({
          type: 'user',
          title: user.name,
          subtitle: user.email,
          description: 'Vai trò: Representative',
          action_url: `/rm-manage-users/${user._id}`,
          navigate_to: `/rm-manage-users/${user._id}`,
          status: user.status || 'active',
        });
      });

      return results.slice(0, limit);
    } catch (error) {
      console.error('Representative manager search error:', error);
      throw error;
    }
  }

  /**
   * Search cơ bản cho các role khác
   */
  async basicSearch(keyword, limit = 10, role) {
    try {
      const results = [];

      // Basic search cho tất cả role
      const medicines = await Medicine.find({
        name: { $regex: keyword, $options: 'i' },
      }).limit(limit);

      medicines.forEach((medicine) => {
        results.push({
          type: 'medicine',
          title: medicine.name,
          subtitle: medicine.license_code,
          description: `Nhà sản xuất: ${medicine.manufacturer}`,
          action_url: `/medicines/${medicine._id}`,
          navigate_to: `/medicines/${medicine._id}`,
          status: medicine.status || 'active',
        });
      });

      return results.slice(0, limit);
    } catch (error) {
      console.error('Basic search error:', error);
      throw error;
    }
  }
}

module.exports = new SearchService();
