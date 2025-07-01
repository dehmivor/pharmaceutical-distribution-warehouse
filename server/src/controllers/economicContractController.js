const economicContractService = require('../services/economicContractService');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const { CONTRACT_STATUSES, PARTNER_TYPES } = require('../utils/constants');
const getAllEconomicContracts = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { page = 1, limit = 10, created_by, partner_id, partner_type, status, contract_code } = req.query;

  const filters = {
    page: parseInt(page),
    limit: parseInt(limit),
    created_by,
    partner_id,
    partner_type,
    status,
    contract_code,
  };

  const contracts = await economicContractService.getAllEconomicContracts(filters);
  res.status(200).json({
    success: true,
    data: contracts,
  });
});


// GET /economic-contracts/detail/:id
const getEconomicContractById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contract = await economicContractService.getEconomicContractById(id);
  if (!contract) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }

  res.status(200).json({ success: true, data: contract });
});

// POST /economic-contracts
const createEconomicContract = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const contractData = {
    ...req.body,
    created_by: req.user.userId,
  };

  const newContract = await economicContractService.createEconomicContract(contractData);
  res.status(201).json({ success: true, data: newContract });
});

// GET /economic-contracts/filter-options
const getFilterOptions = async (req, res) => {
    try {
      const options = {
        status: Object.values(CONTRACT_STATUSES),
        partner_type: Object.values(PARTNER_TYPES),
      };

      res.status(200).json({
        success: true,
        message: 'Lấy tùy chọn bộ lọc thành công',
        data: options,
      });
    } catch (error) {
      console.error('Get filter options error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy tùy chọn bộ lọc',
      });
    }
};

// DELETE /economic-contracts/:id
const deleteEconomicContract = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contract = await economicContractService.getEconomicContractById(id);
  if (!contract) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }
  if (contract.created_by._id.toString() !== req.user.userId) {
    return res.status(403).json({ success: false, message: 'You do not have permission to delete this contract' });
  }
  if (contract.status !== CONTRACT_STATUSES.DRAFT) {
    return res.status(400).json({ success: false, message: 'Only draft contracts can be deleted' });
  }

  const result = await economicContractService.deleteEconomicContract(id);
  if (!result) {
    return res.status(500).json({ success: false, message: 'Failed to delete contract' });
  }

  res.status(200).json({ success: true });
});

const updateEconomicContract = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contract = await economicContractService.getEconomicContractById(id);
  if (!contract) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }

  if (contract.created_by._id.toString() !== req.user.userId) {
    return res.status(403).json({ success: false, message: 'You do not have permission to update this contract' });
  }
  if (contract.status !== CONTRACT_STATUSES.DRAFT) {
    return res.status(400).json({ success: false, message: 'Only draft contracts can be updated' });
  }

  const updatedContract = await economicContractService.updateEconomicContract(id, req.body);
  res.status(200).json({ success: true, data: updatedContract });
});

module.exports = {
  getAllEconomicContracts,
  getEconomicContractById,
  createEconomicContract,
  getFilterOptions,
  deleteEconomicContract,
  updateEconomicContract,
};
