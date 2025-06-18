const Contract = require('../models/Contract');
const Medicine = require('../models/Medicine');
const constants = require('../utils/constants');

const contractService = {
  createContract: async (data, user) => {
    try {
      if (!['representative', 'supervisor'].includes(user.role)) {
        return { success: false, message: 'Unauthorized to create contract' };
      }
      const contract = new Contract({ ...data, created_by: user.userId });
      await contract.save();
      return { success: true, data: contract };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  getContractsByStatus: async (status, page = 1, limit = 10) => {
    const query = status ? { status } : {};
    const contracts = await Contract.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('created_by', 'email')
      .sort({ createdAt: -1 });
    return { success: true, data: contracts };
  },

  getContractsByCreator: async (userId, status, page = 1, limit = 10) => {
    const query = { created_by: userId };
    if (status) query.status = status;
    const contracts = await Contract.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    return { success: true, data: contracts };
  },

  updateContractStatus: async (contractId, status, user) => {
    if (user.role !== 'supervisor') {
      return { success: false, message: 'Only supervisors can update contract status' };
    }

    const contract = await Contract.findById(contractId);
    if (!contract) return { success: false, message: 'Contract not found' };

    contract.status = status;
    await contract.save();

    if (status === 'active') {
      for (const item of contract.items) {
        const exists = await Medicine.findOne({ license_code: item.medicine_detail.license_code });
        if (!exists) {
          const detail = {
            ...item.medicine_detail,
            min_stock_threshold: item.medicine_detail.min_stock_threshold ?? 0,
            max_stock_threshold: item.medicine_detail.max_stock_threshold ?? 0,
          };
          await Medicine.create(detail);
        }
      }
    }

    return { success: true, message: 'Status updated', data: contract };
  },

  deleteContract: async (id, user) => {
    const contract = await Contract.findById(id);
    if (!contract) return { success: false, message: 'Contract not found' };
    if (!contract.created_by.equals(user.userId)) {
      return { success: false, message: 'Unauthorized to delete this contract' };
    }
    await contract.deleteOne();
    return { success: true, message: 'Contract deleted' };
  },

  getContractById: async (id) => {
    const contract = await Contract.findById(id).populate('created_by', 'email');
    if (!contract) return { success: false, message: 'Contract not found' };
    return { success: true, data: contract };
  },
};

module.exports = contractService;
