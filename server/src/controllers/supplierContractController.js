const supplierContractService = require('../services/supplierContractService');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

// Get all supplier contracts with filters
const getAllSupplierContracts = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { page = 1, limit = 10, created_by, supplier_id, status, contract_code } = req.query;
  const filters = {
    page: parseInt(page),
    limit: parseInt(limit),
    created_by,
    supplier_id,
    status,
    contract_code,
  };

  const contracts = await supplierContractService.getAllSupplierContracts(filters);
  res.status(200).json({
    success: true,
    data: contracts,
  });
});

const createSupplierContract = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const contractData = {
    ...req.body,
    created_by: req.user.userId, // Get created_by from authenticated user
  };
  const newContract = await supplierContractService.createSupplierContract(contractData);
  res.status(201).json({
    success: true,
    data: newContract,
  });
});

const getSupplierContractById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, message: 'Missing contract id' });
  }
  const contract = await supplierContractService.getSupplierContractById(id);
  if (!contract) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }
  res.status(200).json({ success: true, data: contract });
});

const deleteSupplierContract = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, message: 'Missing contract id' });
  }
  const contract = await supplierContractService.deleteSupplierContract(id);
  if (!contract) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }
  res.status(200).json({ success: true, data: contract });
});

module.exports = {
  getAllSupplierContracts,
  createSupplierContract,
  getSupplierContractById,
  deleteSupplierContract,
};